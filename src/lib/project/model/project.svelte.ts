/**
 * A project: the shared document, and its reactive reading. See ADR 0002.
 *
 * What changes it is in files of their own, whose methods the project takes
 * in (`changing/`): its elements, what it keeps of references, and
 * associations. It is one tree, with the project's own element at the top
 * (ADR 0037); `migrate.ts` brings a document written before into that shape. Who else has it open is told by `presence.svelte.ts`; it is
 * written to disk by `saving.svelte.ts`; the people of its full history are
 * kept by `people.ts`.
 *
 * Nothing outside these writes to the document, except the editors, which
 * write the text of elements through y-prosemirror.
 */

import type { Template } from '$lib/api/templates';
import { newTextLanguage, t, term } from '$lib/i18n';
import type { Bound, When } from '$lib/timeline/solve';
import { SvelteMap } from 'svelte/reactivity';
import * as Y from 'yjs';
import { ySyncPluginKey } from 'y-prosemirror';
import type { Awareness } from 'y-protocols/awareness';
import { commentChanges } from './changing/comments';
import { kindChanges } from './changing/kinds';
import { elementChanges, elementOf } from './changing/elements';
import { linkChanges } from './changing/links';
import { cleanLook, family, passageKindChanges } from './changing/passage-kinds';
import { referenceChanges } from './changing/references';
import { cleanTemplate, templateChanges } from './changing/templates';
import { HISTORY, LOAD, LOCAL, str, TIDY, type YNode } from './origins';
import { People, type Me } from './people';
import { Presence, type Other } from './presence.svelte';
import {
  Saving,
  type Follower,
  type Persistence,
  type SaveStatus,
  type Summary,
} from './saving.svelte';
import { isCatalogueKind } from '$lib/project/parts';
import { migrate, needsMigration } from './migrate';
import { bodyFacts, inlineText, readBody, readTitle, titleHtml, type Block } from './text';
import { buildTree, pathTo, viewOf, type FlatNode, type Tree } from './tree';
import {
  OWN_SETTINGS,
  PROJECT,
  STATUSES,
  type DocumentSettings,
  type Hand,
  type KindRecord,
  type TimelineSettings,
  type LinkRecord,
  type NodeRecord,
  type PassageKindRecord,
  type Position,
  type RefRecord,
  type Thread,
} from './types';

export { HISTORY, LOAD, LOCAL, TIDY } from './origins';
export type { Me } from './people';
export type { Other } from './presence.svelte';
export type { Follower, Persistence, SaveStatus, Summary } from './saving.svelte';

/** How the full history of a project is kept (ADR 0021): in the document, so that every copy keeps it alike. */
export interface HistorySettings {
  on: boolean;
  /** After how many weeks the changes of each hour are merged into one. */
  hourly: number;
  /** After how many months the changes of each day are merged into one. */
  daily: number;
}

export const HISTORY_GIVEN: HistorySettings = { on: false, hourly: 4, daily: 6 };

/**
 * Whether something in a piece of text, or in an element, was written or set
 * by someone else than `me`, and is still there.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function holdsWorkOfOthers(type: Y.AbstractType<any>, me: number): boolean {
  const holds = (item: Y.Item) =>
    !item.deleted &&
    (item.id.client !== me ||
      (item.content instanceof Y.ContentType && holdsWorkOfOthers(item.content.type, me)));
  for (let item = type._start; item !== null; item = item.right) if (holds(item)) return true;
  // What a map holds by name: the parts of an element, and the attributes of a paragraph.
  for (const item of type._map.values()) if (holds(item)) return true;
  return false;
}

/** When an element is, as the document holds it; nothing where it says nothing that can be read. */
function readWhen(value: unknown): When | null {
  if (!value || typeof value !== 'object') return null;
  const given = value as { start?: unknown; end?: unknown };
  const bound = (b: unknown): Bound | null => {
    if (!b || typeof b !== 'object') return null;
    const { at, after, before, during, approx, margin } = b as Record<string, unknown>;
    const out: Bound = {};
    if (typeof at === 'string' && at.trim()) {
      out.at = at.trim();
      if (typeof margin === 'string' && margin.trim()) out.margin = margin.trim();
    } else {
      if (typeof after === 'string' && after) out.after = after;
      if (typeof before === 'string' && before) out.before = before;
      if (typeof during === 'string' && during) out.during = during;
    }
    if (approx === true) out.approx = true;
    return out;
  };
  const start = bound(given.start);
  if (!start) return null;
  const end = given.end ? bound(given.end) : null;
  return end ? { start, end } : { start };
}

/** The kinds in hand of the project, as the document holds them: lists of ids, empty where nothing is said. */
function readHand(value: unknown): Hand {
  const list = (ids: unknown) =>
    Array.isArray(ids) ? ids.filter((id): id is string => typeof id === 'string' && !!id) : [];
  const given = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;
  return { pinned: list(given.pinned), unpinned: list(given.unpinned) };
}

/** A record of settings as the document holds it: an object, or nothing. */
function readRecord<T extends object>(value: unknown): T {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as T) : ({} as T);
}

/**
 * A text in few signs, by which it is told whether two texts are the same:
 * its length, and two numbers made of all its signs.
 */
function printOf(text: string): string {
  let a = 0x811c9dc5;
  let b = 0x01000193;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    a = Math.imul(a ^ c, 0x01000193);
    b = Math.imul(b + c, 0x85ebca6b) ^ (b >>> 13);
  }
  return `${text.length}.${(a >>> 0).toString(36)}.${(b >>> 0).toString(36)}`;
}

type ElementChanges = typeof elementChanges;
type ReferenceChanges = typeof referenceChanges;
type LinkChanges = typeof linkChanges;
type CommentChanges = typeof commentChanges;
type KindChanges = typeof kindChanges;
type PassageKindChanges = typeof passageKindChanges;
type TemplateChanges = typeof templateChanges;

/** What changes a project, in `changing/`: its methods, which it takes in below. */
export interface Project
  extends
    ElementChanges,
    ReferenceChanges,
    LinkChanges,
    CommentChanges,
    KindChanges,
    PassageKindChanges,
    TemplateChanges {}

export class Project {
  readonly doc: Y.Doc;
  readonly yMeta: Y.Map<unknown>;
  readonly yNodes: Y.Map<YNode>;
  readonly yLinks: Y.Map<YNode>;
  readonly yRefs: Y.Map<RefRecord>;
  /** What is written about the works cited, for this project: by the id of the reference. */
  readonly yNotes: Y.Map<Y.Text>;
  /**
   * Words whose spelling is not to be checked in this project, as they
   * were written: a set, which is the same for all it is shared with.
   */
  readonly yIgnored: Y.Map<true>;
  /** How the full history is kept: see `HistorySettings`. */
  readonly yHistory: Y.Map<unknown>;
  /** The comments: threads by their id, each on an element. See `changing/comments.ts`. */
  readonly yComments: Y.Map<Y.Map<unknown>>;
  /** The kinds of elements, by their id. See `changing/kinds.ts`. */
  readonly yKinds: Y.Map<Y.Map<unknown>>;
  /** The kinds of paragraph and of words of the writer's own, by their id. See `changing/passage-kinds.ts`. */
  readonly yPassageKinds: Y.Map<Y.Map<unknown>>;
  /**
   * The templates of the writer's own that the project carries a copy of,
   * as plain records by their id (ADR 0038). See `changing/templates.ts`.
   */
  readonly yTemplates: Y.Map<unknown>;
  /**
   * The people of a project whose history is on, as Yjs's
   * `PermanentUserData` keeps them: by person, the copies that are theirs
   * (`ids`) and what they deleted (`ds`); and their name.
   */
  readonly yUsers: Y.Map<Y.Map<unknown>>;
  readonly undoManager: Y.UndoManager;

  // ---- what the interface reads ----
  /** The name of the project: that of its element (`PROJECT`), as plain text. */
  name = $state('');
  /** The kinds of paragraph and of words the writer has pinned to the hand, and those taken out of it. */
  hand = $state.raw<Hand>({ pinned: [], unpinned: [] });
  readonly nodes = new SvelteMap<string, NodeRecord>();
  links = $state.raw<LinkRecord[]>([]);
  readonly refs = new SvelteMap<string, RefRecord>();
  /** The notes on references that belong to this project. Those without text are not among them. */
  readonly notes = new SvelteMap<string, string>();
  /** The words ignored in this project by spelling. A new set whenever they change. */
  ignored = $state.raw<ReadonlySet<string>>(new Set());
  /** The comments, by the id of the thread. A thread is made anew whenever it changes. */
  readonly comments = new SvelteMap<string, Thread>();
  /** The kinds of elements, in their order. */
  kinds = $state.raw<KindRecord[]>([]);
  /** The kinds of paragraph and of words of the writer's own, in their order. */
  passageKinds = $state.raw<PassageKindRecord[]>([]);
  /** The templates the project carries a copy of, by name. */
  templates = $state.raw<Template[]>([]);
  /** Rises when the shape of any tree changes. */
  structure = $state(0);
  /** Rises with every change to the project, whoever made it. */
  revision = $state(0);
  canUndo = $state(false);
  canRedo = $state(false);
  /** How the full history is kept. */
  history = $state.raw<HistorySettings>(HISTORY_GIVEN);

  readonly #presence: Presence;
  readonly #saving: Saving;
  readonly #people: People;
  /** Those who are told that the project has changed: see `onChange`. */
  #listeners = new Set<() => void>();
  /** Whether what was on disk has been read. */
  #loaded = false;
  #trees = new Map<string, { structure: number; tree: Tree }>();
  #closed = false;

  constructor(persistence: Persistence | null = null) {
    this.doc = new Y.Doc();
    this.yMeta = this.doc.getMap('meta');
    this.yNodes = this.doc.getMap('nodes');
    this.yLinks = this.doc.getMap('links');
    this.yRefs = this.doc.getMap('refs');
    this.yNotes = this.doc.getMap('notes');
    this.yIgnored = this.doc.getMap('ignored');
    this.yHistory = this.doc.getMap('history');
    this.yComments = this.doc.getMap('comments');
    this.yKinds = this.doc.getMap('kinds');
    this.yPassageKinds = this.doc.getMap('passageKinds');
    this.yTemplates = this.doc.getMap('templates');
    this.yUsers = this.doc.getMap('users');
    this.#presence = new Presence(this.doc);
    this.#people = new People(this.doc, this.yUsers, () => this.history.on);
    this.#saving = new Saving(persistence, {
      doc: this.doc,
      summary: () => this.summary(),
      keepsHistory: () => this.history.on,
      beforeBatch: () => this.#people.noteDeleted(),
      beforeState: () => this.#people.tidy(),
    });

    this.undoManager = new Y.UndoManager([this.yMeta, this.yNodes, this.yLinks], {
      trackedOrigins: new Set<unknown>([LOCAL, ySyncPluginKey]),
      captureTimeout: 600,
      // Taking back a paragraph or an element one began must not take with it
      // what another has written in it since: then only one's own words go.
      deleteFilter: (item) => {
        const me = this.doc.clientID;
        const node = elementOf(this, item);
        if (node) return !holdsWorkOfOthers(node, me);
        return (
          !(item.content instanceof Y.ContentType) ||
          !(item.content.type instanceof Y.XmlElement || item.content.type instanceof Y.XmlText) ||
          !holdsWorkOfOthers(item.content.type, me)
        );
      },
    });
    const stacks = () => {
      this.canUndo = this.undoManager.undoStack.length > 0;
      this.canRedo = this.undoManager.redoStack.length > 0;
    };
    this.undoManager.on('stack-item-added', stacks);
    this.undoManager.on('stack-item-popped', stacks);
    this.undoManager.on('stack-cleared', stacks);

    this.yMeta.observe(() => this.#readMeta());
    this.yLinks.observeDeep(() => this.#readLinks());
    this.yRefs.observe((event) => {
      for (const key of event.keysChanged) {
        const value = this.yRefs.get(key);
        if (value) this.refs.set(key, value);
        else this.refs.delete(key);
      }
    });
    this.yNodes.observeDeep((events) => this.#nodesChanged(events));
    this.yNotes.observeDeep(() => this.#readNotes());
    this.yIgnored.observe(() => this.#readIgnored());
    this.yHistory.observe(() => this.#readHistory());
    this.yKinds.observeDeep(() => this.#readKinds());
    this.yPassageKinds.observeDeep(() => this.#readPassageKinds());
    this.yTemplates.observe(() => this.#readTemplates());
    this.yComments.observeDeep((events) => {
      const touched = new Set<string>();
      for (const event of events) {
        if (event.target === this.yComments) {
          for (const key of (event as Y.YMapEvent<unknown>).keysChanged) touched.add(key);
        } else if (typeof event.path[0] === 'string') touched.add(event.path[0]);
      }
      for (const id of touched) this.#readThread(id);
    });

    this.doc.on(
      'update',
      (update: Uint8Array, origin: unknown, _doc: Y.Doc, transaction: Y.Transaction) => {
        if (origin === LOAD || this.#closed) return;
        this.revision++;
        for (const heard of this.#listeners) heard();
        // What came from another copy is applied as a change that is not local.
        this.#saving.change(update, transaction.local);
      },
    );
    // Who deleted what is kept, while the history is on: Yjs does not say it.
    this.doc.on('afterTransaction', (transaction: Y.Transaction) => {
      if (
        this.history.on &&
        transaction.local &&
        transaction.origin !== LOAD &&
        transaction.deleteSet.clients.size
      )
        this.#people.deleted(transaction.deleteSet);
    });
  }

  // ---- who else has the project open: see `Presence` ----

  /**
   * Who is here, and where. It is there for every project, shared or not, so
   * that the editors need not be made anew when a project is shared; it says
   * nothing of this user until `present` has been called.
   */
  get awareness(): Awareness {
    return this.#presence.awareness;
  }

  /** The others who have the project open, while it is shared. */
  get others(): Other[] {
    return this.#presence.others;
  }

  /** Those of the others who are at an element. */
  othersAt(node: string): Other[] {
    return this.#presence.othersAt(node);
  }

  /** Tells the others who this is; or, with nothing, no longer tells them. */
  present(user: { name: string; color: string; member: string | null } | null) {
    this.#presence.present(user);
  }

  /** Tells the others which element this user is at. */
  at(node: string | null) {
    this.#presence.at(node);
  }

  // ---- how the project is written: see `Saving` ----

  get status(): SaveStatus {
    return this.#saving.status;
  }

  get saveError(): string | null {
    return this.#saving.saveError;
  }

  /** Writes the changes not yet written to the log. */
  flush(): Promise<void> {
    return this.#saving.flush();
  }

  /** Follows the changes as they are made, until the function returned is called. */
  follow(follower: Follower): () => void {
    return this.#saving.follow(follower);
  }

  /** Writes the whole document as one state, and empties the log; with `always`, even when nothing was written since. */
  snapshot(always = false): Promise<void> {
    return this.#saving.snapshot(always);
  }

  // ---- who works here: see `People` ----

  get me(): Me | null {
    return this.#people.me;
  }

  /**
   * Says who works here. While the history is on, the project keeps them
   * among its people, with their name as it is now.
   */
  setMe(me: Me | null) {
    this.#people.setMe(me);
  }

  // =====================================================================
  // Loading and saving
  // =====================================================================

  /** Applies what was read from disk. */
  load(state: Uint8Array | null, updates: Uint8Array[]) {
    this.doc.transact(() => {
      if (state) Y.applyUpdate(this.doc, state, LOAD);
      for (const u of updates) {
        try {
          Y.applyUpdate(this.doc, u, LOAD);
        } catch (error) {
          console.error('a stored change could not be applied', error);
        }
      }
    }, LOAD);
    this.#sweep();
    this.#readAll();
    this.#loaded = true;
    this.undoManager.clear();
    this.#saving.loaded(updates);
  }

  /**
   * A project begins with its own element, named `name`; one written before
   * ADR 0037, as maps with a centre each and loose elements beside, is
   * brought into one tree. Done once, saved but not undone; nothing happens
   * to a project that is in shape. Not for a joined project that has not
   * arrived yet: its element is on its way. Returns whether anything was done.
   */
  begin(name: string): boolean {
    if (!needsMigration(this.doc)) return false;
    this.doc.transact(() => migrate(this.doc, name, newTextLanguage(), term), TIDY);
    return true;
  }

  /**
   * Threads of comments on elements that are gone, by undo or by another,
   * go with them. Only where the element is known to have been deleted, not
   * where it has only not arrived yet.
   */
  #sweep() {
    const stale: string[] = [];
    for (const [id, thread] of this.yComments) {
      const element = str(thread.get('element'));
      if (!this.yNodes.has(element) && this.yNodes._map.get(element)?.deleted) stale.push(id);
    }
    if (stale.length)
      this.doc.transact(() => {
        for (const id of stale) this.yComments.delete(id);
      }, TIDY);
  }

  #readAll() {
    this.#readMeta();
    this.#readLinks();
    this.nodes.clear();
    for (const id of this.yNodes.keys()) this.#readNode(id);
    this.refs.clear();
    for (const [id, value] of this.yRefs) this.refs.set(id, value);
    this.#readNotes();
    this.#readIgnored();
    this.#readHistory();
    this.comments.clear();
    for (const id of this.yComments.keys()) this.#readThread(id);
    this.#readKinds();
    this.#readPassageKinds();
    this.#readTemplates();
    this.structure++;
  }

  #readKinds() {
    const list: KindRecord[] = [];
    for (const [id, k] of this.yKinds) {
      if (!(k instanceof Y.Map)) continue;
      const begins = str(k.get('begins'));
      const basedOn = str(k.get('basedOn'));
      list.push({
        id,
        name: str(k.get('name'), '?'),
        colour: str(k.get('colour')),
        template: str(k.get('template')),
        ...(begins ? { begins } : {}),
        ...(basedOn ? { basedOn } : {}),
        order: str(k.get('order'), 'a0'),
      });
    }
    list.sort((a, b) => (a.order < b.order ? -1 : a.order > b.order ? 1 : a.id < b.id ? -1 : 1));
    this.kinds = list;
  }

  /** A kind by its id. */
  kind(id: string | null | undefined): KindRecord | undefined {
    return id ? this.kinds.find((k) => k.id === id) : undefined;
  }

  /**
   * The kinds of the catalogue of parts of a document (`project/parts.ts`)
   * that elements of the project are of, each once, in no order.
   */
  catalogueKindsInUse(): string[] {
    const out = new Set<string>();
    for (const n of this.nodes.values()) if (n.kind && isCatalogueKind(n.kind)) out.add(n.kind);
    return [...out];
  }

  #readPassageKinds() {
    const list: PassageKindRecord[] = [];
    for (const [id, k] of this.yPassageKinds) {
      if (!(k instanceof Y.Map)) continue;
      list.push({
        id,
        name: str(k.get('name'), '?'),
        family: family(k.get('family')),
        basedOn: str(k.get('basedOn')),
        look: cleanLook(k.get('look')),
        order: str(k.get('order'), 'a0'),
      });
    }
    list.sort((a, b) => (a.order < b.order ? -1 : a.order > b.order ? 1 : a.id < b.id ? -1 : 1));
    this.passageKinds = list;
  }

  /** A kind of paragraph or of words of the writer's own, by its id. */
  passageKind(id: string | null | undefined): PassageKindRecord | undefined {
    return id ? this.passageKinds.find((k) => k.id === id) : undefined;
  }

  #readTemplates() {
    const list: Template[] = [];
    for (const [id, value] of this.yTemplates) {
      const template = cleanTemplate(value, id);
      if (template) list.push(template);
    }
    list.sort((a, b) => a.name.localeCompare(b.name) || (a.id < b.id ? -1 : 1));
    this.templates = list;
  }

  /** The project's copy of a template, by its id; nothing where it carries none. */
  templateCopy(id: string | null | undefined): Template | undefined {
    return id ? this.templates.find((tp) => tp.id === id) : undefined;
  }

  /** Whether some element of the project has chosen the template. */
  usesTemplate(id: string): boolean {
    for (const n of this.nodes.values()) if (n.document.template === id) return true;
    return false;
  }

  #readThread(id: string) {
    const y = this.yComments.get(id);
    const notes = y instanceof Y.Map ? y.get('notes') : null;
    const element = y instanceof Y.Map ? str(y.get('element')) : '';
    if (!y || !(notes instanceof Y.Array) || !element) {
      this.comments.delete(id);
      return;
    }
    const passage = y.get('passage') as Thread['passage'] | undefined;
    const card = y.get('card') as Position | undefined;
    this.comments.set(id, {
      id,
      element,
      passage:
        passage && passage.from instanceof Uint8Array && passage.to instanceof Uint8Array
          ? { from: passage.from, to: passage.to, text: str(passage.text) }
          : null,
      resolved: y.get('resolved') === true,
      card:
        card && Number.isFinite(card.x) && Number.isFinite(card.y)
          ? { x: card.x, y: card.y }
          : null,
      notes: (notes.toArray() as unknown[]).filter(
        (n): n is Thread['notes'][number] =>
          !!n && typeof n === 'object' && typeof (n as { text?: unknown }).text === 'string',
      ),
    });
  }

  /** The threads on an element, the oldest first. */
  threadsOf(element: string): Thread[] {
    const out: Thread[] = [];
    for (const thread of this.comments.values()) if (thread.element === element) out.push(thread);
    return out.sort((a, b) => (a.notes[0]?.created ?? '').localeCompare(b.notes[0]?.created ?? ''));
  }

  #readHistory() {
    const on = this.yHistory.get('on') === true;
    const number = (key: 'hourly' | 'daily') => {
      const value = this.yHistory.get(key);
      return typeof value === 'number' && value > 0 ? value : HISTORY_GIVEN[key];
    };
    const next = { on, hourly: number('hourly'), daily: number('daily') };
    const before = this.history;
    if (before.on === next.on && before.hourly === next.hourly && before.daily === next.daily)
      return;
    this.history = next;
    if (on && !before.on) {
      // Not within the observer that read it: after the change that turned it on.
      queueMicrotask(() => {
        if (this.#closed) return;
        this.#people.introduce();
        // The history begins now, with the whole state, on every copy that learns it is on.
        if (this.#loaded) void this.snapshot(true);
      });
    }
  }

  /**
   * Changes how the full history is kept. Turning it on begins it with the
   * project as it is; turning it off, what was kept is deleted when the
   * project is next saved, on every copy.
   */
  async setHistory(change: Partial<HistorySettings>): Promise<void> {
    const next = { ...this.history, ...change };
    this.doc.transact(() => {
      for (const key of ['on', 'hourly', 'daily'] as const) {
        if (this.yHistory.get(key) !== next[key]) this.yHistory.set(key, next[key]);
      }
    }, HISTORY);
    await this.snapshot(true);
  }

  /**
   * Tells `listener` that the project has changed, by the writer, by
   * another or by undo: once for all that changed at the same moment, or,
   * with `wait`, when nothing has changed for so many milliseconds. The
   * function returned stops it.
   */
  onChange(listener: () => void, wait = 0): () => void {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let queued = false;
    const tell = () => {
      if (this.#listeners.has(heard)) listener();
    };
    const heard = () => {
      if (wait) {
        clearTimeout(timer);
        timer = setTimeout(tell, wait);
      } else if (!queued) {
        queued = true;
        queueMicrotask(() => {
          queued = false;
          tell();
        });
      }
    };
    this.#listeners.add(heard);
    return () => {
      this.#listeners.delete(heard);
      clearTimeout(timer);
    };
  }

  async close(): Promise<void> {
    if (this.#closed) return;
    await this.snapshot();
    this.#closed = true;
    this.#listeners.clear();
    this.#saving.stop();
    this.undoManager.destroy();
    this.#presence.destroy();
    this.doc.destroy();
  }

  summary(): Summary {
    let words = 0;
    const references = new Set<string>();
    for (const n of this.nodes.values()) {
      words += n.words;
      for (const id of n.cited) references.add(id);
    }
    // The trees under the project stand for its maps, with the elements of each counted.
    const tree = this.tree();
    const count = (id: string): number =>
      (tree.children.get(id) ?? []).reduce((n, c) => n + count(c), 1);
    return {
      name: this.name || undefined,
      description: this.#description(),
      maps: (tree.children.get(PROJECT) ?? []).map((id) => ({
        id,
        name: this.nodes.get(id)?.title || t('project-untitled'),
        elements: count(id),
      })),
      words,
      references: references.size,
      pictures: this.usedPictures().map((p) => p.hash),
      cited: [...references],
    };
  }

  /** The first words of the project's text, for the list of projects, which does not read the documents. */
  #description(): string {
    const out: string[] = [];
    for (const b of this.blocksOf(PROJECT)) {
      if (b.kind === 'paragraph' || b.kind === 'passage' || b.kind === 'script')
        out.push(inlineText(b.content));
      if (out.join(' ').length > 280) break;
    }
    return out.join(' ').replace(/\s+/g, ' ').trim().slice(0, 300);
  }

  // =====================================================================
  // Reading
  // =====================================================================

  #readMeta() {
    // The name is the project element's; until that has arrived, what was written here.
    if (!this.yNodes.has(PROJECT)) this.name = str(this.yMeta.get('name'));
    this.hand = readHand(this.yMeta.get('hand'));
  }

  #readLinks() {
    const list: LinkRecord[] = [];
    for (const [id, l] of this.yLinks) {
      if (!(l instanceof Y.Map)) continue;
      const from = str(l.get('from'));
      const to = str(l.get('to'));
      if (from && to && from !== to) list.push({ id, from, to, label: str(l.get('label')) });
    }
    list.sort((a, b) => (a.id < b.id ? -1 : 1));
    this.links = list;
  }

  /** The text of each element as it was read, and what it is known by: see `#readNode`. */
  #texts = new WeakMap<NodeRecord, { blocks: Block[]; stamp: string }>();
  /** For each element, what its text was when it was last read, in few signs, and the stamp it has. */
  #stamps = new Map<string, { print: string; stamp: string }>();
  #stamped = 0;

  #readNode(id: string) {
    const n = this.yNodes.get(id);
    if (!(n instanceof Y.Map)) {
      this.nodes.delete(id);
      this.#stamps.delete(id);
      return;
    }
    const title = readTitle(n.get('title') as Y.XmlFragment | undefined);
    const blocks = readBody(n.get('body') as Y.XmlFragment | undefined);
    const facts = bodyFacts(blocks);
    const pos = n.get('pos') as Position | null | undefined;
    const origin = n.get('origin') as NodeRecord['origin'] | undefined;
    const record: NodeRecord = {
      id,
      parent: id === PROJECT ? null : ((n.get('parent') as string | null | undefined) ?? null),
      order: str(n.get('order'), 'a0'),
      pos: pos && Number.isFinite(pos.x) && Number.isFinite(pos.y) ? { x: pos.x, y: pos.y } : null,
      collapsed: n.get('collapsed') === true,
      heading: n.get('heading') !== false,
      excluded: n.get('excluded') === true,
      include: (n.get('include') as string | null | undefined) || null,
      origin:
        origin && origin.node
          ? { node: origin.node, ...(origin.print ? { print: origin.print } : {}) }
          : null,
      status: STATUSES.find((s) => s === n.get('status')) ?? null,
      kind: str(n.get('kind')) || null,
      when: readWhen(n.get('when')),
      document: readRecord<DocumentSettings>(n.get('document')),
      timeline: readRecord<TimelineSettings>(n.get('timeline')),
      title: inlineText(title).trim(),
      titleHtml: titleHtml(title),
      empty: facts.empty,
      words: facts.words,
      cited: facts.cited,
      notes: facts.notes,
      noteWords: facts.noteWords,
      set: facts.set,
      uses: facts.uses,
    };
    // The text as it was read is kept with the record, which is made anew
    // whenever the element is changed: a document is then made of what was
    // read already, and only what was changed is read again. The stamp of
    // a text stays the same while the text does, whatever else of the
    // element is changed: where it stands in the diagram, whether it is folded.
    const print = printOf(JSON.stringify(blocks));
    const before = this.#stamps.get(id);
    const stamp = before?.print === print ? before.stamp : `${id}.${++this.#stamped}`;
    this.#stamps.set(id, { print, stamp });
    this.#texts.set(record, { blocks, stamp });
    this.nodes.set(id, record);
    if (id === PROJECT) this.name = record.title;
  }

  /** What each element was, in few signs, as it was last read: see `fingerprint`. */
  #prints = new WeakMap<NodeRecord, string>();

  /**
   * An element's name and text in few signs, by which it is told whether
   * they are what they were: a copy keeps its original's, to say whether
   * the original has changed since. Nothing, of an element that is not there.
   */
  fingerprint(id: string): string | null {
    const record = this.nodes.get(id);
    if (!record) return null;
    let print = this.#prints.get(record);
    if (print === undefined) {
      print = printOf(`${record.titleHtml}\n${JSON.stringify(this.blocksOf(id))}`);
      this.#prints.set(record, print);
    }
    return print;
  }

  /**
   * Of a copy, its original, and whether that has changed since the copy
   * was made or its change was last seen: nothing where that is not known,
   * of a copy made before it was kept. Nothing, of what is no copy.
   */
  copyOf(id: string): { original: NodeRecord | null; changed: boolean | null } | null {
    const origin = this.nodes.get(id)?.origin;
    if (!origin) return null;
    const original = this.nodes.get(origin.node) ?? null;
    return {
      original,
      changed: original && origin.print ? this.fingerprint(original.id) !== origin.print : null,
    };
  }

  /** The text of an element, as it was read when the element was last changed. */
  blocksOf(id: string): Block[] {
    const record = this.nodes.get(id);
    const kept = record && this.#texts.get(record);
    return kept ? kept.blocks : readBody(this.fragment(id, 'body') ?? undefined);
  }

  /**
   * What tells the text of an element from every other, and from itself as
   * it was before the element was changed. Nothing, of an element that is
   * not there.
   */
  stampOf(id: string): string | null {
    const record = this.nodes.get(id);
    return (record && this.#texts.get(record)?.stamp) ?? null;
  }

  #nodesChanged(events: Y.YEvent<Y.AbstractType<unknown>>[]) {
    let structural = false;
    const touched = new Set<string>();
    for (const event of events) {
      if (event.target === this.yNodes) {
        structural = true;
        for (const key of (event as Y.YMapEvent<unknown>).keysChanged) touched.add(key);
        continue;
      }
      const id = event.path[0];
      if (typeof id !== 'string') continue;
      touched.add(id);
      if (event.path.length === 1 && event instanceof Y.YMapEvent) {
        for (const key of event.keysChanged) {
          if (key === 'parent' || key === 'order') structural = true;
        }
      }
    }
    for (const id of touched) this.#readNode(id);
    if (structural) this.structure++;
  }

  node(id: string | null | undefined): NodeRecord | undefined {
    return id ? this.nodes.get(id) : undefined;
  }

  /**
   * The tree of the project, or of it seen from an element: that element at
   * the top, and all under it. Reading it makes the reader depend on the
   * shape of the project.
   */
  tree(root: string = PROJECT): Tree {
    const structure = this.structure;
    const cached = this.#trees.get(root);
    if (cached && cached.structure === structure) return cached.tree;
    let whole = root === PROJECT ? null : this.#trees.get(PROJECT);
    if (!whole || whole.structure !== structure) {
      const flat: FlatNode[] = [];
      for (const [id, n] of this.yNodes) {
        if (!(n instanceof Y.Map)) continue;
        flat.push({
          id,
          parent: (n.get('parent') as string | null | undefined) ?? null,
          order: str(n.get('order'), 'a0'),
        });
      }
      whole = { structure, tree: buildTree(flat) };
      this.#trees.set(PROJECT, whole);
    }
    const tree = root === PROJECT ? whole.tree : viewOf(whole.tree, root);
    this.#trees.set(root, { structure, tree });
    return tree;
  }

  /** From the project down to the element: the path by which it is reached. */
  pathTo(id: string): string[] {
    return pathTo(this.tree(), id);
  }

  /**
   * What is said of an element as a document, with what it inherits: a
   * setting it does not make is the nearest element's over it that makes
   * it, then nothing; its title and subtitle are its own (`OWN_SETTINGS`). `from` says, for each setting that is set, which
   * element sets it.
   */
  documentOf(id: string): {
    settings: DocumentSettings;
    from: Map<keyof DocumentSettings, string>;
  } {
    const settings: Record<string, unknown> = {};
    const from = new Map<keyof DocumentSettings, string>();
    for (const at of this.pathTo(id)) {
      const own = this.nodes.get(at)?.document ?? {};
      for (const key of Object.keys(own) as (keyof DocumentSettings)[]) {
        if (at !== id && OWN_SETTINGS.includes(key)) continue;
        const value = own[key];
        if (value === undefined || value === '' || (Array.isArray(value) && !value.length))
          continue;
        settings[key] = value;
        from.set(key, at);
      }
    }
    return { settings: settings as DocumentSettings, from };
  }

  /** The content of an element's name or text, for an editor to bind to. */
  fragment(id: string, which: 'title' | 'body'): Y.XmlFragment | null {
    const n = this.yNodes.get(id);
    if (!(n instanceof Y.Map)) return null;
    const f = n.get(which);
    return f instanceof Y.XmlFragment ? f : null;
  }

  /** Links of which both ends are within an element: under it, or it. */
  linksOf(within: string): LinkRecord[] {
    const inside = new Set(this.tree(within).sequence);
    return this.links.filter((l) => inside.has(l.from) && inside.has(l.to));
  }

  linksAt(nodeId: string): LinkRecord[] {
    return this.links.filter((l) => l.from === nodeId || l.to === nodeId);
  }

  /** Ids of the references that are cited in the project, or within one of its elements. */
  usedReferences(within: string = PROJECT): string[] {
    const out = new Set<string>();
    for (const id of this.tree(within).sequence) {
      for (const ref of this.nodes.get(id)?.cited ?? []) out.add(ref);
    }
    return [...out];
  }

  /** Where a reference is cited: the elements that cite it, in the order of the text. */
  citing(reference: string): NodeRecord[] {
    const out: NodeRecord[] = [];
    for (const id of this.tree().sequence) {
      const n = this.nodes.get(id);
      if (n?.cited.includes(reference)) out.push(n);
    }
    return out;
  }

  /**
   * The pictures of the figures of the project, or within one of its
   * elements, each once, as the project names them.
   */
  usedPictures(within: string = PROJECT): { hash: string; extension: string; name: string }[] {
    const out = new Map<string, { hash: string; extension: string; name: string }>();
    for (const id of this.tree(within).sequence) {
      const n = this.nodes.get(id);
      if (!n) continue;
      // The cover of an e-book is a figure among them, in an element of the kind `cover`.
      for (const s of n.set) {
        if (s.kind !== 'figure' || !s.file || out.has(s.file)) continue;
        out.set(s.file, { hash: s.file, extension: s.extension ?? '', name: s.name ?? '' });
      }
    }
    return [...out.values()];
  }

  #readNotes() {
    const seen = new Set<string>();
    for (const [id, text] of this.yNotes) {
      const value = text instanceof Y.Text ? text.toString() : '';
      if (!value.trim()) continue;
      seen.add(id);
      if (this.notes.get(id) !== value) this.notes.set(id, value);
    }
    for (const id of [...this.notes.keys()]) if (!seen.has(id)) this.notes.delete(id);
  }

  #readIgnored() {
    this.ignored = new Set(this.yIgnored.keys());
  }

  // =====================================================================
  // Changing: here what is the project's as a whole; the rest in `changing/`
  // =====================================================================

  transact<T>(change: () => T): T {
    return this.doc.transact(change, LOCAL);
  }

  /** Ends the current step of undo, so that what follows is undone separately. */
  checkpoint() {
    this.undoManager.stopCapturing();
  }

  undo() {
    this.undoManager.undo();
  }

  redo() {
    this.undoManager.redo();
  }

  /**
   * Names the project: its element is named so, and the name is written
   * beside, for what reads the document without its elements.
   */
  setName(name: string) {
    const clean = name.replace(/\s+/g, ' ').trim();
    if (!clean || clean === this.name) return;
    this.transact(() => {
      this.yMeta.set('name', clean);
      if (this.yNodes.has(PROJECT)) this.setTitle(PROJECT, clean);
    });
  }

  /**
   * The language of the project's text, as its element says it (ADR 0020):
   * what every element inherits that says nothing itself. Null where none
   * is said, and the settings of each writer decide.
   */
  get language(): string | null {
    return this.nodes.get(PROJECT)?.document.language?.trim() || null;
  }

  /** Changes the language of the project's text; null leaves it to the settings of each writer. */
  setLanguage(language: string | null) {
    const clean = language?.trim() || null;
    if (clean === this.language) return;
    this.setDocument(PROJECT, { language: clean ?? undefined });
  }

  /**
   * Changes the kinds in hand: those the writer has pinned, those taken
   * out. A kind pinned is no longer taken out, and the other way round.
   * Nothing is kept of a hand that says nothing.
   */
  setHand(patch: Partial<Hand>) {
    const list = (ids: string[] | undefined) => [
      ...new Set((ids ?? []).map((k) => k.trim()).filter(Boolean)),
    ];
    this.transact(() => {
      const current = this.hand;
      let pinned = list(patch.pinned ?? current.pinned);
      let unpinned = list(patch.unpinned ?? current.unpinned);
      if (patch.unpinned) pinned = pinned.filter((k) => !unpinned.includes(k));
      else unpinned = unpinned.filter((k) => !pinned.includes(k));
      if (pinned.length || unpinned.length) this.yMeta.set('hand', { pinned, unpinned });
      else this.yMeta.delete('hand');
    });
  }
}

Object.assign(
  Project.prototype,
  elementChanges,
  referenceChanges,
  linkChanges,
  commentChanges,
  kindChanges,
  passageKindChanges,
  templateChanges,
);
