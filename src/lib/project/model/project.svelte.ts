/**
 * A project: the shared document, and its reactive reading. See ADR 0002.
 *
 * What changes it is in files of their own, whose methods the project takes
 * in (`changing/`): its maps, its elements, what it keeps of references, and
 * associations. Who else has it open is told by `presence.svelte.ts`; it is
 * written to disk by `saving.svelte.ts`; the people of its full history are
 * kept by `people.ts`.
 *
 * Nothing outside these writes to the document, except the editors, which
 * write the text of elements through y-prosemirror.
 */

import { t } from '$lib/i18n';
import { SvelteMap } from 'svelte/reactivity';
import * as Y from 'yjs';
import { ySyncPluginKey } from 'y-prosemirror';
import type { Awareness } from 'y-protocols/awareness';
import { commentChanges } from './changing/comments';
import { deleteNodes, elementChanges, elementOf } from './changing/elements';
import { linkChanges } from './changing/links';
import { mapChanges } from './changing/maps';
import { referenceChanges } from './changing/references';
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
import { bodyFacts, inlineText, readBody, readTitle, titleHtml, type Block } from './text';
import { buildTree, type FlatNode, type Tree } from './tree';
import {
  STATUSES,
  type DocumentSettings,
  type LinkRecord,
  type MapRecord,
  type NodeRecord,
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

type MapChanges = typeof mapChanges;
type ElementChanges = typeof elementChanges;
type ReferenceChanges = typeof referenceChanges;
type LinkChanges = typeof linkChanges;
type CommentChanges = typeof commentChanges;

/** What changes a project, in `changing/`: its methods, which it takes in below. */
export interface Project
  extends MapChanges, ElementChanges, ReferenceChanges, LinkChanges, CommentChanges {}

export class Project {
  readonly doc: Y.Doc;
  readonly yMeta: Y.Map<unknown>;
  readonly yMaps: Y.Map<YNode>;
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
  /**
   * The people of a project whose history is on, as Yjs's
   * `PermanentUserData` keeps them: by person, the copies that are theirs
   * (`ids`) and what they deleted (`ds`); and their name.
   */
  readonly yUsers: Y.Map<Y.Map<unknown>>;
  readonly undoManager: Y.UndoManager;

  // ---- what the interface reads ----
  name = $state('');
  maps = $state.raw<MapRecord[]>([]);
  readonly nodes = new SvelteMap<string, NodeRecord>();
  links = $state.raw<LinkRecord[]>([]);
  readonly refs = new SvelteMap<string, RefRecord>();
  /** The notes on references that belong to this project. Those without text are not among them. */
  readonly notes = new SvelteMap<string, string>();
  /** The words ignored in this project by spelling. A new set whenever they change. */
  ignored = $state.raw<ReadonlySet<string>>(new Set());
  /** The comments, by the id of the thread. A thread is made anew whenever it changes. */
  readonly comments = new SvelteMap<string, Thread>();
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
    this.yMaps = this.doc.getMap('maps');
    this.yNodes = this.doc.getMap('nodes');
    this.yLinks = this.doc.getMap('links');
    this.yRefs = this.doc.getMap('refs');
    this.yNotes = this.doc.getMap('notes');
    this.yIgnored = this.doc.getMap('ignored');
    this.yHistory = this.doc.getMap('history');
    this.yComments = this.doc.getMap('comments');
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

    this.undoManager = new Y.UndoManager([this.yMeta, this.yMaps, this.yNodes, this.yLinks], {
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
    this.yMaps.observeDeep(() => this.#readMaps());
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
   * Elements of a map that was deleted while another added to it are left
   * with no map to be seen in, and would be counted and carried for ever:
   * they go. Only where the map is known to have been deleted, not where it
   * has only not arrived yet.
   */
  #sweep() {
    const lost: string[] = [];
    for (const [id, n] of this.yNodes) {
      const map = n.get('map');
      if (typeof map === 'string' && !this.yMaps.has(map) && this.yMaps._map.get(map)?.deleted)
        lost.push(id);
    }
    // So with the threads of comments on elements that are gone, by undo or by another.
    const stale: string[] = [];
    for (const [id, thread] of this.yComments) {
      const element = str(thread.get('element'));
      if (
        !this.yNodes.has(element) &&
        (lost.includes(element) || this.yNodes._map.get(element)?.deleted)
      )
        stale.push(id);
    }
    if (lost.length || stale.length)
      this.doc.transact(() => {
        deleteNodes(this, new Set(lost));
        for (const id of stale) this.yComments.delete(id);
      }, TIDY);
  }

  #readAll() {
    this.#readMeta();
    this.#readMaps();
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
    this.structure++;
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
    const elements = new Map<string, number>();
    let words = 0;
    const references = new Set<string>();
    for (const n of this.nodes.values()) {
      elements.set(n.map, (elements.get(n.map) ?? 0) + 1);
      words += n.words;
      for (const id of n.cited) references.add(id);
    }
    return {
      name: this.name || undefined,
      maps: this.maps.map((m) => ({ id: m.id, name: m.name, elements: elements.get(m.id) ?? 0 })),
      words,
      references: references.size,
      pictures: this.usedPictures().map((p) => p.hash),
      cited: [...references],
    };
  }

  // =====================================================================
  // Reading
  // =====================================================================

  #readMeta() {
    this.name = str(this.yMeta.get('name'));
  }

  #readMaps() {
    const list: MapRecord[] = [];
    for (const [id, m] of this.yMaps) {
      if (!(m instanceof Y.Map)) continue;
      list.push({
        id,
        name: str(m.get('name'), t('project-untitled')),
        root: str(m.get('root')),
        order: str(m.get('order'), 'a0'),
        created: str(m.get('created')),
        document: (m.get('document') as DocumentSettings | undefined) ?? {},
      });
    }
    list.sort((a, b) => (a.order < b.order ? -1 : a.order > b.order ? 1 : a.id < b.id ? -1 : 1));
    this.maps = list;
    this.structure++;
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
    const side = n.get('side');
    const origin = n.get('origin') as NodeRecord['origin'] | undefined;
    const record: NodeRecord = {
      id,
      map: str(n.get('map')),
      parent: (n.get('parent') as string | null | undefined) ?? null,
      order: str(n.get('order'), 'a0'),
      pos: pos && Number.isFinite(pos.x) && Number.isFinite(pos.y) ? { x: pos.x, y: pos.y } : null,
      side: side === 'left' || side === 'right' ? side : null,
      collapsed: n.get('collapsed') === true,
      heading: n.get('heading') !== false,
      excluded: n.get('excluded') === true,
      include: (n.get('include') as string | null | undefined) || null,
      origin: origin && origin.map && origin.node ? origin : null,
      status: STATUSES.find((s) => s === n.get('status')) ?? null,
      title: inlineText(title).trim(),
      titleHtml: titleHtml(title),
      empty: facts.empty,
      words: facts.words,
      cited: facts.cited,
      notes: facts.notes,
      noteWords: facts.noteWords,
      set: facts.set,
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
  copyOf(
    id: string,
  ): { original: NodeRecord | null; map: MapRecord | null; changed: boolean | null } | null {
    const origin = this.nodes.get(id)?.origin;
    if (!origin) return null;
    const original = this.nodes.get(origin.node) ?? null;
    return {
      original,
      map: this.map(origin.map) ?? null,
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
          if (key === 'parent' || key === 'order' || key === 'map') structural = true;
        }
      }
    }
    for (const id of touched) this.#readNode(id);
    if (structural) this.structure++;
  }

  map(id: string | null | undefined): MapRecord | undefined {
    return id ? this.maps.find((m) => m.id === id) : undefined;
  }

  node(id: string | null | undefined): NodeRecord | undefined {
    return id ? this.nodes.get(id) : undefined;
  }

  /** The tree of a map. Reading it makes the reader depend on the shape of the project. */
  tree(mapId: string): Tree {
    const structure = this.structure;
    const cached = this.#trees.get(mapId);
    if (cached && cached.structure === structure) return cached.tree;
    const flat: FlatNode[] = [];
    for (const [id, n] of this.yNodes) {
      if (!(n instanceof Y.Map)) continue;
      flat.push({
        id,
        map: str(n.get('map')),
        parent: (n.get('parent') as string | null | undefined) ?? null,
        order: str(n.get('order'), 'a0'),
      });
    }
    const tree = buildTree(flat, mapId, this.map(mapId)?.root ?? null);
    this.#trees.set(mapId, { structure, tree });
    return tree;
  }

  /** The content of an element's name or text, for an editor to bind to. */
  fragment(id: string, which: 'title' | 'body'): Y.XmlFragment | null {
    const n = this.yNodes.get(id);
    if (!(n instanceof Y.Map)) return null;
    const f = n.get(which);
    return f instanceof Y.XmlFragment ? f : null;
  }

  /** Links of which both ends are in the map. */
  linksOf(mapId: string): LinkRecord[] {
    return this.links.filter(
      (l) => this.nodes.get(l.from)?.map === mapId && this.nodes.get(l.to)?.map === mapId,
    );
  }

  linksAt(nodeId: string): LinkRecord[] {
    return this.links.filter((l) => l.from === nodeId || l.to === nodeId);
  }

  /** Ids of the references that are cited in the project, or in one of its maps. */
  usedReferences(mapId?: string): string[] {
    const out = new Set<string>();
    for (const n of this.nodes.values()) {
      if (mapId && n.map !== mapId) continue;
      for (const id of n.cited) out.add(id);
    }
    return [...out];
  }

  /**
   * Where a reference is cited: the maps that cite it, in their order, each
   * with the elements that do, in the order of the text.
   */
  citing(reference: string): { map: MapRecord; elements: NodeRecord[] }[] {
    const out: { map: MapRecord; elements: NodeRecord[] }[] = [];
    for (const map of this.maps) {
      const elements: NodeRecord[] = [];
      for (const id of this.tree(map.id).sequence) {
        const n = this.nodes.get(id);
        if (n?.cited.includes(reference)) elements.push(n);
      }
      if (elements.length) out.push({ map, elements });
    }
    return out;
  }

  /**
   * The pictures of the figures of the project, or of one of its maps, each
   * once, as the project names them.
   */
  usedPictures(mapId?: string): { hash: string; extension: string; name: string }[] {
    const out = new Map<string, { hash: string; extension: string; name: string }>();
    for (const n of this.nodes.values()) {
      if (mapId && n.map !== mapId) continue;
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

  setName(name: string) {
    const clean = name.replace(/\s+/g, ' ').trim();
    if (!clean || clean === this.name) return;
    this.transact(() => this.yMeta.set('name', clean));
  }
}

Object.assign(
  Project.prototype,
  mapChanges,
  elementChanges,
  referenceChanges,
  linkChanges,
  commentChanges,
);
