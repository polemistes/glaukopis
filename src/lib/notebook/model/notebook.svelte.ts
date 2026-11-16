/**
 * The notebook: one document outside all projects, and its reactive
 * reading (record 0101; `docs/plans/the-notebook.md`). It follows a
 * project in small (`project/model/project.svelte.ts`): made, read,
 * undone, saved, loaded and passed between windows as a project is.
 *
 * Six parts stand at its top: `notes`, by id, each a map with its text
 * (`body`, written in the editor of the texts), its `name`, when it was
 * collected (`made`), what became of pieces of it (`went`), its `box`,
 * where its card lies on the surface of the box (`at`) and how wide it is
 * (`width`), and its `tags`; `sources`, by id, plain records; `passages`,
 * by id, where words taken in came from and how they read when they were
 * taken; `files`, by the hash of a file a note holds, what it is called and
 * where it came from; `boxes`, by id, what notes lie in (`boxes.ts`); and
 * `links`, by id, between notes, as a project's (`links.ts`). From stage 4
 * a seventh: `starts`, the starting texts of new notes (`starts.ts`); a
 * note taken in from elsewhere says it has not been looked at (`seen`),
 * and a file what was read in it (`text`).
 *
 * What changes boxes, places, tags and links, and joins notes, stands in
 * modules of its own beside this, as a project's changes stand in
 * `changing/`, and is taken in below.
 *
 * Nothing outside this writes to the document, except the editors, which
 * write the text of notes through y-prosemirror.
 */

import type { Node as PMNode } from 'prosemirror-model';
import { SvelteMap } from 'svelte/reactivity';
import * as Y from 'yjs';
import { prosemirrorToYXmlFragment, ySyncPluginKey } from 'y-prosemirror';
import { Awareness } from 'y-protocols/awareness';
import type { NotebookSummary } from '$lib/api/notebook';
import { widthFor } from '$lib/editor/commands';
import { Copying } from '$lib/org/folder';
import { LOAD, LOCAL, WINDOW, nowIso, str } from '$lib/project/model/origins';
import { Saving, type Persistence, type SaveStatus } from '$lib/project/model/saving.svelte';
import type { LinkRecord } from '$lib/project/model/types';
import { newId } from '$lib/util/id';
import { boxChanges, boxesOf, FIRST_BOX } from './boxes';
import { joinChanges } from './joining';
import { linksOf, linksTouching, noteLinkChanges } from './links';
import { bringBack, readsNow, unmark } from './marks';
import {
  beginsOf,
  holdsNothing,
  holdsOf,
  metOf,
  pictureOf,
  piecesOf,
  wordsOf,
  type Met,
} from './pieces';
import { cardWidth, heightOf, placeChanges, pointOf, widthOf } from './places';
import { startChanges, startsOf } from './starts';
import { cleanTag, TagCounts, tagChanges, tagsIn } from './tags';
import type {
  BoxRecord,
  HeldFile,
  NewSource,
  NoteRecord,
  Passage,
  Piece,
  Point,
  Source,
  SourceChange,
  StartRecord,
  TagCount,
  Went,
} from './types';

/** Where the notebook is written: as a project is, and its readable copy (`notebook/org.ts`). */
export interface NotebookPersistence extends Omit<Persistence<NotebookSummary>, 'readable'> {
  /**
   * Writes the readable copy of the notebook into its folder. Where it is
   * given, it is written a little after the whole is saved.
   */
  readable?(notebook: Notebook): Promise<void>;
}

/** What the notebook tells of itself as it is changed: that its notes hold files the store is to keep. */
export interface NotebookTold {
  hold?(hashes: string[]): void;
}

/**
 * Origin of what the notebook records of itself, which is saved and not
 * undone: what became of a piece, and a file a note was found to hold.
 */
const RECORD = 'record';

/** A note as the document holds it. */
type YNote = Y.Map<unknown>;

/** What a passage is kept as. */
type StoredPassage = Omit<Passage, 'id'>;
/** What a file a note holds is kept as. */
type StoredFile = Omit<HeldFile, 'hash'>;

const WENT = new Set<Went['what']>(['text', 'quotation', 'figure', 'reference', 'file']);

/** A record as it is kept: without what is not said. */
function plain<T extends object>(record: T): T {
  return Object.fromEntries(
    Object.entries(record).filter(([, v]) => v !== undefined && v !== null && v !== ''),
  ) as T;
}

/** A source from what the document holds; none, where it is no source. */
function sourceOf(id: string, value: unknown): Source | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>;
  const reference = typeof v.reference === 'string' && v.reference ? v.reference : undefined;
  const base = reference ? { id, reference } : { id };
  switch (v.sort) {
    case 'web':
      return { ...base, sort: 'web', url: str(v.url), title: str(v.title), read: str(v.read) };
    case 'reference':
      if (!reference) return null;
      return plain({
        ...base,
        sort: 'reference' as const,
        reference,
        locator: str(v.locator) || undefined,
        label: str(v.label) || undefined,
      });
    case 'file': {
      const place = v.place as { lat?: unknown; lon?: unknown } | undefined;
      return plain({
        ...base,
        sort: 'file' as const,
        name: str(v.name),
        time: str(v.time) || undefined,
        taken: str(v.taken) || undefined,
        place:
          place && Number.isFinite(place.lat) && Number.isFinite(place.lon)
            ? { lat: place.lat as number, lon: place.lon as number }
            : undefined,
        locator: str(v.locator) || undefined,
      });
    }
    case 'words':
      return { ...base, sort: 'words', words: str(v.words) };
    default:
      return null;
  }
}

/** Whether two sources are one: of one sort, and the same in what tells them apart. */
function sameSource(a: Source, b: NewSource): boolean {
  if (a.sort !== b.sort) return false;
  const trim = (s: string | undefined) => (s ?? '').trim();
  switch (b.sort) {
    case 'web':
      return trim((a as typeof b).url) === trim(b.url);
    case 'reference':
      return (
        (a as typeof b).reference === b.reference &&
        trim((a as typeof b).locator) === trim(b.locator) &&
        trim((a as typeof b).label) === trim(b.label)
      );
    case 'file':
      return (
        (a as typeof b).name === b.name &&
        trim((a as typeof b).time) === trim(b.time) &&
        trim((a as typeof b).locator) === trim(b.locator)
      );
    case 'words':
      return trim((a as typeof b).words) === trim(b.words);
  }
}

function wentOf(value: unknown): Went | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>;
  if (!WENT.has(v.what as Went['what']) || typeof v.when !== 'string') return null;
  return plain({
    what: v.what as Went['what'],
    project: str(v.project) || undefined,
    name: str(v.name) || undefined,
    element: str(v.element) || undefined,
    when: v.when,
  });
}

/** A paragraph of text, as the editor writes one, with words, taken in a passage where one is given. */
function paragraphWith(fragment: Y.XmlFragment, words: string, passage: string | null) {
  const el = new Y.XmlElement('paragraph');
  el.setAttribute('kind', 'text');
  el.setAttribute('indent', 0 as unknown as string);
  const text = new Y.XmlText();
  el.insert(0, [text]);
  fragment.insert(fragment.length, [el]);
  if (words) text.insert(0, words, passage ? { taken: { passage } } : {});
}

/** The hashes of the files a text holds: what each figure shows, and each file. */
function hashesIn(parent: Y.XmlElement | Y.XmlFragment, into: Set<string>) {
  for (const child of parent.toArray()) {
    if (!(child instanceof Y.XmlElement)) continue;
    if (child.nodeName === 'figure') {
      const file = child.getAttribute('file') as unknown;
      if (typeof file === 'string' && file) into.add(file);
    } else if (child.nodeName === 'file') {
      const hash = child.getAttribute('hash') as unknown;
      if (typeof hash === 'string' && hash) into.add(hash);
    } else hashesIn(child, into);
  }
}

/** What is kept of a note as it was last read, beside its record. */
interface Reading {
  pieces: Piece[];
  met: Met[];
  hashes: Set<string>;
}

/** What a note is made with, beside its text. */
export interface NewNote {
  name?: string;
  /** When it was collected; now, to the thousandth of a second, where none is given. */
  made?: string;
  /** Its box; the first where none is given, or the box is not there. */
  box?: string;
  tags?: string[];
  at?: Point | null;
  width?: number | null;
  /** False for a note taken in from elsewhere, which has not been looked at. */
  seen?: boolean;
}

type BoxChanges = typeof boxChanges;
type PlaceChanges = typeof placeChanges;
type TagChanges = typeof tagChanges;
type NoteLinkChanges = typeof noteLinkChanges;
type JoinChanges = typeof joinChanges;
type StartChanges = typeof startChanges;

/** What changes boxes, places, tags and links, and joins notes, in modules beside this: its methods, which it takes in below. */
export interface Notebook
  extends BoxChanges, PlaceChanges, TagChanges, NoteLinkChanges, JoinChanges, StartChanges {}

export class Notebook {
  readonly doc: Y.Doc;
  readonly yNotes: Y.Map<YNote>;
  readonly ySources: Y.Map<unknown>;
  readonly yPassages: Y.Map<StoredPassage>;
  readonly yFiles: Y.Map<StoredFile>;
  readonly yBoxes: Y.Map<Y.Map<unknown>>;
  readonly yLinks: Y.Map<Y.Map<unknown>>;
  readonly yStarts: Y.Map<Y.Map<unknown>>;
  readonly undoManager: Y.UndoManager;
  /** Who is in the texts: nobody else is ever there, but the editor asks. */
  readonly awareness: Awareness;

  // ---- what the interface reads ----
  readonly notes = new SvelteMap<string, NoteRecord>();
  readonly sources = new SvelteMap<string, Source>();
  readonly passages = new SvelteMap<string, Passage>();
  readonly files = new SvelteMap<string, HeldFile>();
  /** The boxes: the first, then the rest in their order. */
  boxes = $state.raw<BoxRecord[]>([{ id: FIRST_BOX, name: '', order: '' }]);
  /** The links between notes that are there, by their ids. */
  links = $state.raw<LinkRecord[]>([]);
  /** The starting texts of new notes, in their order. */
  starts = $state.raw<StartRecord[]>([]);
  /** Every tag any note has, with how many notes have it, sorted as words are. */
  tags = $state.raw<TagCount[]>([]);
  /** Rises with every change to the notebook, whoever made it. */
  revision = $state(0);
  canUndo = $state(false);
  canRedo = $state(false);

  readonly #saving: Saving<NotebookSummary>;
  /** The readable copy in the notebook's folder, where it has one: see `org/folder.ts`. */
  readonly #copy: Copying | null;
  readonly #told: NotebookTold;
  /** For each note, what was read of it beside its record. */
  #readings = new Map<string, Reading>();
  #tagCounts = new TagCounts();
  #closed = false;

  constructor(persistence: NotebookPersistence | null = null, told: NotebookTold = {}) {
    this.doc = new Y.Doc();
    this.yNotes = this.doc.getMap('notes');
    this.ySources = this.doc.getMap('sources');
    this.yPassages = this.doc.getMap('passages');
    this.yFiles = this.doc.getMap('files');
    this.yBoxes = this.doc.getMap('boxes');
    this.yLinks = this.doc.getMap('links');
    this.awareness = new Awareness(this.doc);
    this.#told = told;
    const readable = persistence?.readable?.bind(persistence);
    this.#copy = readable
      ? new Copying(() => readable(this), 'the readable copy of the notebook')
      : null;
    this.#saving = new Saving<NotebookSummary>(
      persistence && {
        append: (update, here, time) => persistence.append(update, here, time),
        saveState: (state, summary, keep) => persistence.saveState(state, summary, keep),
      },
      {
        doc: this.doc,
        summary: () => this.summary(),
        keepsHistory: () => false,
        beforeBatch: () => {},
        beforeState: () => {},
        afterState: () => this.#copy?.schedule(),
      },
    );

    this.undoManager = new Y.UndoManager(
      [this.yNotes, this.ySources, this.yPassages, this.yFiles, this.yBoxes, this.yLinks],
      { trackedOrigins: new Set<unknown>([LOCAL, ySyncPluginKey]), captureTimeout: 600 },
    );
    const stacks = () => {
      this.canUndo = this.undoManager.undoStack.length > 0;
      this.canRedo = this.undoManager.redoStack.length > 0;
    };
    this.undoManager.on('stack-item-added', stacks);
    this.undoManager.on('stack-item-popped', stacks);
    this.undoManager.on('stack-cleared', stacks);

    this.yNotes.observeDeep((events) => {
      const touched = new Set<string>();
      /** The notes whose text changed, or that came or went: read whole; the rest only for what stands beside their text. */
      const texts = new Set<string>();
      let comeOrGone = false;
      let local = false;
      for (const event of events) {
        local ||= event.transaction.local && event.transaction.origin !== WINDOW;
        if (event.target === this.yNotes) {
          comeOrGone = true;
          for (const key of (event as Y.YMapEvent<unknown>).keysChanged) {
            touched.add(key);
            texts.add(key);
          }
          continue;
        }
        const where = this.#whereIn(event.target);
        if (!where) continue;
        touched.add(where.note);
        if (
          where.part === 'body' ||
          (where.part === null && (event as Y.YMapEvent<unknown>).keysChanged.has('body'))
        )
          texts.add(where.note);
      }
      for (const id of touched) this.#readNote(id, texts.has(id));
      this.#tagsRead();
      if (comeOrGone) this.#readLinks();
      if (local) this.#enterFiles(texts);
    });
    this.yBoxes.observeDeep((events) => {
      this.boxes = boxesOf(this.yBoxes);
      // A box come or gone: the notes said to lie in it lie in it, or in the first.
      const changed = new Set<string>();
      for (const event of events)
        if (event.target === this.yBoxes)
          for (const key of (event as Y.YMapEvent<unknown>).keysChanged) changed.add(key);
      if (!changed.size) return;
      for (const [id, n] of this.yNotes) {
        const box = n.get('box');
        if (typeof box === 'string' && changed.has(box)) this.#readNote(id, false);
      }
    });
    this.yLinks.observeDeep(() => this.#readLinks());
    this.yStarts = this.doc.getMap('starts');
    this.undoManager.addToScope(this.yStarts);
    this.yStarts.observeDeep(() => (this.starts = startsOf(this.yStarts)));
    this.ySources.observe((event) => {
      for (const id of event.keysChanged) {
        const source = sourceOf(id, this.ySources.get(id));
        if (source) this.sources.set(id, source);
        else this.sources.delete(id);
      }
    });
    this.yPassages.observe((event) => {
      for (const id of event.keysChanged) this.#readPassage(id);
      this.#metChanged(event.keysChanged, 'passage');
    });
    this.yFiles.observe((event) => {
      for (const hash of event.keysChanged) this.#readFile(hash);
      this.#metChanged(event.keysChanged, 'hash');
    });

    this.doc.on(
      'update',
      (update: Uint8Array, origin: unknown, _doc: Y.Doc, transaction: Y.Transaction) => {
        if (origin === LOAD || this.#closed) return;
        this.revision++;
        // What another window wrote, that window saved.
        if (origin === WINDOW) return;
        this.#saving.change(update, transaction.local);
      },
    );
  }

  // =====================================================================
  // Loading and saving
  // =====================================================================

  get status(): SaveStatus {
    return this.#saving.status;
  }

  get saveError(): string | null {
    return this.#saving.saveError;
  }

  /** Whether changes are waiting to be written, or could not be: kept to be tried again. */
  get unwritten(): boolean {
    return this.#saving.unwritten;
  }

  /** Writes the changes not yet written to the log. */
  flush(): Promise<void> {
    return this.#saving.flush();
  }

  /** Writes the whole document as one state, and empties the log; with `always`, even when nothing was written since. */
  snapshot(always = false): Promise<void> {
    return this.#saving.snapshot(always);
  }

  /** Applies what was read from disk. */
  load(state: Uint8Array | null, updates: Uint8Array[]) {
    this.doc.transact(() => {
      if (state) Y.applyUpdate(this.doc, state, LOAD);
      for (const u of updates) {
        try {
          Y.applyUpdate(this.doc, u, LOAD);
        } catch (error) {
          console.error('a stored change to the notebook could not be applied', error);
        }
      }
    }, LOAD);
    this.#readAll();
    // A file a note holds that the notebook does not know of, as where it
    // was left unwritten, is known from now on.
    this.#enterFiles(new Set(this.yNotes.keys()));
    this.undoManager.clear();
    this.#saving.loaded(updates);
  }

  /** Applies what another window wrote into the notebook: drawn here, not saved again, not undone here. */
  applyFromWindow(update: Uint8Array) {
    if (this.#closed) return;
    Y.applyUpdate(this.doc, update, WINDOW);
  }

  /** Whether the notebook is closed, and its document let go. */
  get closed(): boolean {
    return this.#closed;
  }

  /** Writes at once the readable copy that waits to be written, while the document is there. */
  finishCopy(): Promise<void> {
    return this.#copy?.finish() ?? Promise.resolve();
  }

  async close(): Promise<void> {
    if (this.#closed) return;
    await this.snapshot();
    await this.finishCopy();
    this.#closed = true;
    this.#saving.stop();
    this.undoManager.destroy();
    this.awareness.destroy();
    this.doc.destroy();
  }

  /** What is told of the notebook when it is saved: how many notes, and the files they hold now. */
  summary(): NotebookSummary {
    const files = new Set<string>();
    for (const [id, note] of this.yNotes) {
      const reading = this.#readings.get(id);
      if (reading) for (const h of reading.hashes) files.add(h);
      else {
        const body = note.get('body');
        if (body instanceof Y.XmlFragment) hashesIn(body, files);
      }
    }
    // A copy made to be shown is held with what it was made from.
    for (const hash of [...files]) {
      const from = this.files.get(hash)?.madeFrom;
      if (from) files.add(from);
    }
    return { notes: this.yNotes.size, files: [...files].sort() };
  }

  // =====================================================================
  // Reading
  // =====================================================================

  #readAll() {
    this.sources.clear();
    for (const [id, value] of this.ySources) {
      const source = sourceOf(id, value);
      if (source) this.sources.set(id, source);
    }
    this.passages.clear();
    for (const id of this.yPassages.keys()) this.#readPassage(id);
    this.files.clear();
    for (const hash of this.yFiles.keys()) this.#readFile(hash);
    this.boxes = boxesOf(this.yBoxes);
    this.notes.clear();
    this.#readings.clear();
    this.#tagCounts.clear();
    for (const id of this.yNotes.keys()) this.#readNote(id);
    this.#tagsRead();
    this.#readLinks();
    this.starts = startsOf(this.yStarts);
  }

  #readLinks() {
    this.links = linksOf(this.yLinks, this.yNotes);
  }

  /** The list of tags made anew, where the tags of a note changed. */
  #tagsRead() {
    const list = this.#tagCounts.takeList();
    if (list) this.tags = list;
  }

  #readPassage(id: string) {
    const p = this.yPassages.get(id);
    if (!p || typeof p !== 'object') this.passages.delete(id);
    else
      this.passages.set(id, {
        id,
        source: typeof p.source === 'string' && p.source ? p.source : null,
        text: str(p.text),
        taken: str(p.taken),
      });
  }

  #readFile(hash: string) {
    const f = this.yFiles.get(hash);
    if (!f || typeof f !== 'object') this.files.delete(hash);
    else
      this.files.set(hash, {
        hash,
        name: str(f.name),
        extension: str(f.extension),
        source: typeof f.source === 'string' && f.source ? f.source : null,
        taken: str(f.taken),
        ...(typeof f.madeFrom === 'string' && f.madeFrom ? { madeFrom: f.madeFrom } : {}),
        ...(typeof f.text === 'string' ? { text: f.text } : {}),
      });
  }

  /**
   * The note a part of the document stands in, found by going up from it,
   * and the part of the note it is or stands in (`body`, `tags`, `went`):
   * none where it is the note itself.
   */
  #whereIn(type: Y.AbstractType<unknown>): { note: string; part: string | null } | null {
    let at: Y.AbstractType<unknown> = type;
    let part: string | null = null;
    while (at._item) {
      const parent = at._item.parent as Y.AbstractType<unknown>;
      if (parent === this.yNotes) {
        const note = at._item.parentSub;
        return note ? { note, part } : null;
      }
      part = at._item.parentSub;
      at = parent;
    }
    return null;
  }

  /** The sources of what a note holds, in the order met. */
  #sourcesOf(met: Met[]): (string | null)[] {
    const out: (string | null)[] = [];
    for (const m of met) {
      const source =
        'passage' in m
          ? (this.passages.get(m.passage)?.source ?? null)
          : (this.files.get(m.hash)?.source ?? null);
      if (!out.includes(source)) out.push(source);
    }
    return out;
  }

  /**
   * Reads a note into its record. With `text` false, where it was read
   * before, its text is not read again: only what stands beside it.
   */
  #readNote(id: string, text = true) {
    const n = this.yNotes.get(id);
    const before = this.notes.get(id);
    if (!(n instanceof Y.Map)) {
      if (before) this.#tagCounts.change(before.tags, []);
      this.notes.delete(id);
      this.#readings.delete(id);
      return;
    }
    let read: Pick<NoteRecord, 'pieces' | 'begins' | 'holds' | 'sources' | 'picture'>;
    if (!text && before && this.#readings.has(id)) read = before;
    else {
      const body = n.get('body');
      const fragment = body instanceof Y.XmlFragment ? body : null;
      const pieces = piecesOf(fragment);
      const met = metOf(pieces);
      const hashes = new Set<string>();
      if (fragment) hashesIn(fragment, hashes);
      this.#readings.set(id, { pieces, met, hashes });
      read = {
        pieces,
        begins: beginsOf(pieces),
        holds: holdsOf(pieces),
        sources: this.#sourcesOf(met),
        picture: pictureOf(pieces),
      };
    }
    const went = n.get('went');
    const name = str(n.get('name'));
    const box = n.get('box');
    const tags = tagsIn(n);
    this.#tagCounts.change(before?.tags ?? [], tags);
    this.notes.set(id, {
      id,
      name,
      made: str(n.get('made')),
      pieces: read.pieces,
      words: this.#wordsOf(id, read.pieces, name),
      begins: read.begins,
      holds: read.holds,
      sources: read.sources,
      picture: read.picture,
      box: typeof box === 'string' && this.yBoxes.has(box) ? box : FIRST_BOX,
      at: pointOf(n.get('at')),
      width: widthOf(n.get('width')),
      height: heightOf(n.get('height')),
      tags,
      went:
        went instanceof Y.Array
          ? (went.toArray() as unknown[]).flatMap((w) => {
              const read = wentOf(w);
              return read ? [read] : [];
            })
          : [],
      seen: n.get('seen') !== false,
    });
  }

  /** A note's words for finding: its name, its text, and what was read in the images it holds. */
  #wordsOf(id: string, pieces: Piece[], name: string): string {
    const words = wordsOf(pieces, name);
    const read: string[] = [];
    for (const hash of this.#readings.get(id)?.hashes ?? []) {
      const text = this.files.get(hash)?.text;
      if (text) read.push(text);
    }
    return read.length ? `${words}\n${read.join('\n').toLowerCase()}` : words;
  }

  /**
   * Passages or files were changed: the notes that hold them say their
   * sources anew, and the words read in their images, their text not read
   * again.
   */
  #metChanged(keys: Set<string>, what: 'passage' | 'hash') {
    for (const [id, reading] of this.#readings) {
      const touches = reading.met.some((m) =>
        what === 'passage'
          ? 'passage' in m && keys.has(m.passage)
          : 'hash' in m && keys.has(m.hash),
      );
      const read = what === 'hash' && [...reading.hashes].some((h) => keys.has(h));
      const record = this.notes.get(id);
      if ((touches || read) && record)
        this.notes.set(id, {
          ...record,
          sources: this.#sourcesOf(reading.met),
          words: this.#wordsOf(id, reading.pieces, record.name),
        });
    }
  }

  /**
   * The files notes hold that the notebook does not know of, as an image of
   * the library dropped into a note: entered with no source, and told, so
   * that the store keeps them.
   */
  #enterFiles(notes: Set<string>) {
    const found = new Map<string, { name: string; extension: string }>();
    for (const id of notes) {
      const fragment = this.fragment(id);
      if (!fragment) continue;
      const visit = (parent: Y.XmlElement | Y.XmlFragment) => {
        for (const child of parent.toArray()) {
          if (!(child instanceof Y.XmlElement)) continue;
          const isFigure = child.nodeName === 'figure';
          if (isFigure || child.nodeName === 'file') {
            const hash = str(child.getAttribute(isFigure ? 'file' : 'hash') as unknown);
            if (hash && !this.yFiles.has(hash))
              found.set(hash, {
                name: str(child.getAttribute('name') as unknown),
                extension: str(child.getAttribute('extension') as unknown),
              });
          } else visit(child);
        }
      };
      visit(fragment);
    }
    if (!found.size) return;
    const taken = nowIso();
    this.doc.transact(() => {
      for (const [hash, f] of found)
        this.yFiles.set(hash, plain({ name: f.name, extension: f.extension, source: null, taken }));
    }, RECORD);
    this.#told.hold?.([...found.keys()]);
  }

  // =====================================================================
  // Notes
  // =====================================================================

  /** The notes, the newest first. */
  get list(): NoteRecord[] {
    return [...this.notes.values()].sort((a, b) =>
      a.made === b.made ? (a.id < b.id ? 1 : -1) : a.made < b.made ? 1 : -1,
    );
  }

  /**
   * The notes whose words hold every word of what is asked, the newest
   * first; all of them where nothing is. Within a box where one is given,
   * and having every tag given.
   */
  find(query: string, within: { box?: string | null; tags?: string[] } = {}): NoteRecord[] {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    const { box = null, tags = [] } = within;
    return this.list.filter(
      (n) =>
        (box === null || n.box === box) &&
        tags.every((t) => n.tags.includes(t)) &&
        words.every((w) => n.words.includes(w)),
    );
  }

  note(id: string): NoteRecord | undefined {
    return this.notes.get(id);
  }

  /** The text of a note, for an editor to write in. */
  fragment(id: string): Y.XmlFragment | null {
    const body = this.yNotes.get(id)?.get('body');
    return body instanceof Y.XmlFragment ? body : null;
  }

  /**
   * Makes a note, with one empty paragraph to write in, and gives its id.
   * When it was made is kept to the thousandth of a second, so that notes
   * made one right after another stand in the order they were made.
   */
  addNote(options: NewNote = {}): string {
    const id = newId();
    this.transact(() => {
      const n = new Y.Map<unknown>();
      const body = new Y.XmlFragment();
      n.set('body', body);
      n.set('made', options.made ?? new Date().toISOString());
      n.set('went', new Y.Array());
      const tags = new Y.Map<boolean>();
      for (const tag of options.tags ?? []) {
        const clean = cleanTag(tag);
        if (clean) tags.set(clean, true);
      }
      n.set('tags', tags);
      if (options.name?.trim()) n.set('name', options.name.trim());
      if (options.box && options.box !== FIRST_BOX && this.yBoxes.has(options.box))
        n.set('box', options.box);
      const at = pointOf(options.at);
      if (at) n.set('at', { x: Math.round(at.x), y: Math.round(at.y) });
      if (typeof options.width === 'number' && Number.isFinite(options.width))
        n.set('width', cardWidth(options.width));
      if (options.seen === false) n.set('seen', false);
      this.yNotes.set(id, n);
      paragraphWith(body, '', null);
    });
    return id;
  }

  /** Deletes notes, and their links with them. */
  deleteNotes(ids: string[]) {
    this.transact(() => {
      for (const link of linksTouching(this.yLinks, new Set(ids))) this.yLinks.delete(link);
      for (const id of ids) this.yNotes.delete(id);
    });
  }

  /**
   * Makes the text of a note that is still empty what a document of the
   * editor of the texts holds, as a note divided from another is filled.
   * Gives whether it was filled: not where the note is not there, or holds
   * something already.
   */
  fillFrom(id: string, doc: PMNode): boolean {
    const fragment = this.fragment(id);
    if (!fragment || !holdsNothing(fragment)) return false;
    this.transact(() => prosemirrorToYXmlFragment(doc, fragment));
    return true;
  }

  /** Names a note; with nothing, it has no name, and is shown by how it begins. */
  setName(id: string, name: string) {
    const n = this.yNotes.get(id);
    if (!n) return;
    const given = name.trim();
    if (given === str(n.get('name'))) return;
    this.transact(() => {
      if (given) n.set('name', given);
      else n.delete('name');
    });
  }

  /** The text of a note to put something into: one that holds nothing but empty paragraphs is emptied first. */
  #into(note: string): Y.XmlFragment | null {
    const fragment = this.fragment(note);
    if (fragment && fragment.length && holdsNothing(fragment)) fragment.delete(0, fragment.length);
    return fragment;
  }

  /** Puts words at the end of a note: each line a paragraph of text, taken in a passage where one is given. */
  addText(note: string, text: string, passage: string | null = null) {
    this.transact(() => {
      const fragment = this.#into(note);
      if (!fragment) return;
      for (const line of text.split(/\r?\n/).filter((l) => l.trim()))
        paragraphWith(fragment, line, passage);
    });
  }

  /** Puts a figure of a picture at the end of a note, as the editor makes one. */
  addFigure(
    note: string,
    file: { hash: string; name: string; extension: string; width?: number | null; alt?: string },
  ) {
    this.transact(() => {
      const fragment = this.#into(note);
      if (!fragment) return;
      const el = new Y.XmlElement('figure');
      const attrs: Record<string, unknown> = {
        id: newId(),
        file: file.hash,
        extension: file.extension,
        name: file.name,
        alt: file.alt ?? '',
        width: widthFor(file),
        numbered: true,
        align: '',
        flow: '',
      };
      for (const [key, value] of Object.entries(attrs))
        el.setAttribute(key, value as unknown as string);
      fragment.insert(fragment.length, [el]);
    });
  }

  /** Puts a file that is no picture at the end of a note. */
  addFile(note: string, file: { hash: string; name: string; extension: string }) {
    this.transact(() => {
      const fragment = this.#into(note);
      if (!fragment) return;
      const el = new Y.XmlElement('file');
      el.setAttribute('hash', file.hash);
      el.setAttribute('name', file.name);
      el.setAttribute('extension', file.extension);
      fragment.insert(fragment.length, [el]);
    });
  }

  /** A note has been looked at: kept, and not undone. */
  lookedAt(id: string) {
    const n = this.yNotes.get(id);
    if (n?.get('seen') !== false) return;
    this.doc.transact(() => n.delete('seen'), RECORD);
  }

  /** Records what became of a piece of a note: kept, and not undone. */
  went(note: string, went: Omit<Went, 'when'>) {
    const n = this.yNotes.get(note);
    if (!n) return;
    this.doc.transact(() => {
      let list = n.get('went');
      if (!(list instanceof Y.Array)) {
        list = new Y.Array<unknown>();
        n.set('went', list);
      }
      (list as Y.Array<unknown>).push([plain({ ...went, when: nowIso() })]);
    }, RECORD);
  }

  // =====================================================================
  // Sources
  // =====================================================================

  /** Makes a source and gives its id; the same source again is the one that is there. */
  addSource(source: NewSource): string {
    for (const s of this.sources.values()) if (sameSource(s, source)) return s.id;
    const id = newId();
    this.transact(() => this.ySources.set(id, plain({ ...source, id })));
    return id;
  }

  /** Changes a source: what is given is set, what is given as undefined goes. Its sort stays. */
  changeSource(id: string, change: SourceChange) {
    const before = this.ySources.get(id);
    if (!before || typeof before !== 'object') return;
    const next: Record<string, unknown> = { ...(before as object) };
    for (const [key, value] of Object.entries(change)) {
      if (key === 'id' || key === 'sort') continue;
      if (value === undefined || value === null || value === '') delete next[key];
      else next[key] = value;
    }
    this.transact(() => this.ySources.set(id, next));
  }

  /** The source has been made a reference of the library. */
  madeReference(id: string, reference: string) {
    this.changeSource(id, { reference });
  }

  /** Removes a source that nothing uses; gives whether it was removed. */
  removeSource(id: string): boolean {
    const uses = this.usesOf(id);
    if (uses.passages.length || uses.files.length || !this.ySources.has(id)) return false;
    this.transact(() => this.ySources.delete(id));
    return true;
  }

  /** What has a source: the passages and the files that came from it. */
  usesOf(source: string): { passages: string[]; files: string[] } {
    return {
      passages: [...this.passages.values()].filter((p) => p.source === source).map((p) => p.id),
      files: [...this.files.values()].filter((f) => f.source === source).map((f) => f.hash),
    };
  }

  /** The notes that hold something from a source, the newest first. */
  notesOf(source: string): string[] {
    return this.list.filter((n) => n.sources.includes(source)).map((n) => n.id);
  }

  /** The notes that hold something whose source is, or has been made, a reference of the library, the newest first. */
  notesFrom(reference: string): string[] {
    const sources = new Set(
      [...this.sources.values()].filter((s) => s.reference === reference).map((s) => s.id),
    );
    if (!sources.size) return [];
    return this.list
      .filter((n) => n.sources.some((s) => s !== null && sources.has(s)))
      .map((n) => n.id);
  }

  // =====================================================================
  // Passages and files
  // =====================================================================

  /** Keeps words taken in, as they read now, with their source; gives the id of the passage. */
  addPassage(source: string | null, text: string): string {
    const id = newId();
    this.transact(() => this.yPassages.set(id, { source, text, taken: nowIso() }));
    return id;
  }

  setPassageSource(passage: string, source: string | null) {
    const p = this.yPassages.get(passage);
    if (!p || p.source === source) return;
    this.transact(() => this.yPassages.set(passage, { ...p, source }));
  }

  /**
   * Holds a file in the notebook, with its source. A file held already
   * keeps when it was taken, and its source where none is given.
   */
  holdFile(
    file: { hash: string; name: string; extension: string; madeFrom?: string | null },
    source: string | null,
  ) {
    const before = this.yFiles.get(file.hash);
    this.transact(() =>
      this.yFiles.set(
        file.hash,
        plain({
          name: file.name,
          extension: file.extension,
          source: source ?? before?.source ?? null,
          taken: before?.taken || nowIso(),
          madeFrom: file.madeFrom ?? before?.madeFrom ?? undefined,
          text: before?.text,
        }),
      ),
    );
  }

  setFileSource(hash: string, source: string | null) {
    const f = this.yFiles.get(hash);
    if (!f || (f.source ?? null) === source) return;
    this.transact(() => this.yFiles.set(hash, plain({ ...f, source })));
  }

  /** Keeps what was read in an image a note holds, in the place of what was read before: kept, and not undone. */
  setFileText(hash: string, text: string) {
    const f = this.yFiles.get(hash);
    if (!f || typeof f !== 'object' || f.text === text) return;
    this.doc.transact(() => this.yFiles.set(hash, { ...f, text }), RECORD);
  }

  /** The words of a passage stay, and their mark goes: the passage was no taking. One step of undo. */
  ownWords(note: string, passage: string) {
    const fragment = this.fragment(note);
    if (fragment) this.transact(() => unmark(fragment, passage));
  }

  /** How the words of a passage read now in a note: runs joined as the text has them, paragraphs by a line break. */
  readsNow(note: string, passage: string): string {
    const fragment = this.fragment(note);
    return fragment ? readsNow(fragment, passage) : '';
  }

  /** Whether the words of a passage in a note read otherwise than when they were taken, whitespace at the ends apart. */
  changedSince(note: string, passage: string): boolean {
    const p = this.passages.get(passage);
    if (!p) return false;
    return this.readsNow(note, passage).trim() !== p.text.trim();
  }

  /** The words of a passage in a note read again as when they were taken. One step of undo; gives whether there were any. */
  bringBack(note: string, passage: string): boolean {
    const fragment = this.fragment(note);
    const p = this.passages.get(passage);
    if (!fragment || !p) return false;
    return this.transact(() => bringBack(fragment, passage, p.text));
  }

  // =====================================================================
  // Changing and undoing
  // =====================================================================

  transact<T>(change: () => T): T {
    return this.doc.transact(change, LOCAL);
  }

  /** What is changed after this is a step of undo of its own, apart from what was changed before. */
  checkpoint() {
    this.undoManager.stopCapturing();
  }

  undo() {
    this.undoManager.undo();
  }

  redo() {
    this.undoManager.redo();
  }
}

Object.assign(
  Notebook.prototype,
  boxChanges,
  placeChanges,
  tagChanges,
  noteLinkChanges,
  joinChanges,
  startChanges,
);
