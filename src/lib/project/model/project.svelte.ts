/**
 * A project: the shared document, its reactive reading, and every operation
 * on it. See ADR 0002.
 *
 * Nothing outside this file writes to the document, except the editors, which
 * write the text of elements through y-prosemirror.
 */

import { newTextLanguage, t } from '$lib/i18n';
import { generateKeyBetween, generateNKeysBetween } from 'fractional-indexing';
import { SvelteMap } from 'svelte/reactivity';
import * as Y from 'yjs';
import { ySyncPluginKey } from 'y-prosemirror';
import { Awareness } from 'y-protocols/awareness';
import { newId } from '$lib/util/id';
import {
  bodyFacts,
  fillBody,
  fillTitle,
  inlineText,
  readBody,
  readTitle,
  titleHtml,
  type Block,
  type Inline,
} from './text';
import { buildTree, isAncestor, subtree, topmost, type FlatNode, type Tree } from './tree';
import type {
  DocumentSettings,
  LinkRecord,
  MapRecord,
  NodeRecord,
  Position,
  RefRecord,
} from './types';

/** Origin of changes made by this user outside the editors. */
export const LOCAL = 'local';
/** Origin of changes read from disk: not to be saved again, nor undone. */
export const LOAD = 'load';

export interface Persistence {
  append(update: Uint8Array): Promise<void>;
  saveState(state: Uint8Array, summary: Summary): Promise<void>;
}

export interface Summary {
  name?: string;
  maps: { id: string; name: string; elements: number }[];
  words: number;
  references: number;
  /** The pictures the project uses, by the names the store keeps them by. */
  pictures: string[];
}

/** Someone else who has the project open. */
export interface Other {
  /** One for each window a person has the project open in. */
  client: number;
  name: string;
  color: string;
  /** The collaborator, or nothing for the owner. */
  member: string | null;
  /** The element the person is at, if any. */
  node: string | null;
}

export type SaveStatus = 'saved' | 'unsaved' | 'saving' | 'error';

type YNode = Y.Map<unknown>;

const SNAPSHOT_AFTER_UPDATES = 150;
const SNAPSHOT_AFTER_BYTES = 200_000;
const APPEND_DELAY = 400;
const SNAPSHOT_IDLE = 90_000;

function str(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function nowIso(): string {
  return new Date().toISOString().replace(/\.\d+Z$/, 'Z');
}

const NONE: Other[] = [];

/** Whether something in a piece of text was written by someone else than `me`, and is still there. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function holdsWorkOfOthers(type: Y.AbstractType<any>, me: number): boolean {
  for (let item = type._start; item !== null; item = item.right) {
    if (item.deleted) continue;
    if (item.id.client !== me) return true;
    if (item.content instanceof Y.ContentType && holdsWorkOfOthers(item.content.type, me))
      return true;
  }
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
  readonly undoManager: Y.UndoManager;
  #awareness: Awareness | null = null;

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
  /** Rises when the shape of any tree changes. */
  structure = $state(0);
  /** Rises with every change to the project, whoever made it. */
  revision = $state(0);
  /** The others who have the project open, while it is shared. */
  others = $state.raw<Other[]>([]);
  canUndo = $state(false);
  canRedo = $state(false);
  status = $state<SaveStatus>('saved');
  saveError = $state<string | null>(null);

  #persistence: Persistence | null;
  #pending: Uint8Array[] = [];
  #appendTimer: ReturnType<typeof setTimeout> | undefined;
  #idleTimer: ReturnType<typeof setTimeout> | undefined;
  #sinceSnapshot = { updates: 0, bytes: 0 };
  #writing: Promise<void> = Promise.resolve();
  #trees = new Map<string, { structure: number; tree: Tree }>();
  #closed = false;

  constructor(persistence: Persistence | null = null) {
    this.#persistence = persistence;
    this.doc = new Y.Doc();
    this.yMeta = this.doc.getMap('meta');
    this.yMaps = this.doc.getMap('maps');
    this.yNodes = this.doc.getMap('nodes');
    this.yLinks = this.doc.getMap('links');
    this.yRefs = this.doc.getMap('refs');
    this.yNotes = this.doc.getMap('notes');
    this.yIgnored = this.doc.getMap('ignored');

    this.undoManager = new Y.UndoManager([this.yMeta, this.yMaps, this.yNodes, this.yLinks], {
      trackedOrigins: new Set<unknown>([LOCAL, ySyncPluginKey]),
      captureTimeout: 600,
      // Taking back a paragraph one began must not take with it what another
      // has written in it since: then only one's own words go.
      deleteFilter: (item) =>
        !(item.content instanceof Y.ContentType) ||
        !(item.content.type instanceof Y.XmlElement || item.content.type instanceof Y.XmlText) ||
        !holdsWorkOfOthers(item.content.type, this.doc.clientID),
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

    this.doc.on('update', (update: Uint8Array, origin: unknown) => {
      if (origin === LOAD || this.#closed) return;
      this.revision++;
      this.#queue(update);
    });
  }

  /**
   * Who is here, and where. It is there for every project, shared or not, so
   * that the editors need not be made anew when a project is shared; it says
   * nothing of this user until `present` has been called.
   */
  get awareness(): Awareness {
    if (!this.#awareness) {
      this.#awareness = new Awareness(this.doc);
      this.#awareness.setLocalState(null);
      this.#awareness.on('change', () => this.#readOthers());
    }
    return this.#awareness;
  }

  #readOthers() {
    const others: Other[] = [];
    for (const [client, state] of this.awareness.getStates()) {
      if (client === this.doc.clientID) continue;
      const told = state as { user?: Partial<Other>; at?: unknown };
      if (!told.user?.name) continue;
      others.push({
        client,
        name: String(told.user.name),
        color: typeof told.user.color === 'string' ? told.user.color : '#6b7280',
        member: typeof told.user.member === 'string' ? told.user.member : null,
        node: typeof told.at === 'string' ? told.at : null,
      });
    }
    others.sort((a, b) => a.name.localeCompare(b.name) || a.client - b.client);
    this.others = others;
  }

  /** Those of the others who are at an element. */
  othersAt(node: string): Other[] {
    return this.others.length ? this.others.filter((o) => o.node === node) : NONE;
  }

  /** Tells the others who this is; or, with nothing, no longer tells them. */
  present(user: { name: string; color: string; member: string | null } | null) {
    this.awareness.setLocalState(user ? { user } : null);
  }

  /** Tells the others which element this user is at. */
  at(node: string | null) {
    const awareness = this.#awareness;
    const state = awareness?.getLocalState() as { at?: string | null } | null | undefined;
    if (!awareness || !state || (state.at ?? null) === node) return;
    awareness.setLocalStateField('at', node);
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
    this.#readAll();
    this.undoManager.clear();
    this.#sinceSnapshot = {
      updates: updates.length,
      bytes: updates.reduce((n, u) => n + u.length, 0),
    };
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
    this.structure++;
  }

  #queue(update: Uint8Array) {
    this.#pending.push(update);
    this.status = 'unsaved';
    clearTimeout(this.#appendTimer);
    this.#appendTimer = setTimeout(() => void this.flush(), APPEND_DELAY);
    clearTimeout(this.#idleTimer);
    this.#idleTimer = setTimeout(() => void this.snapshot(), SNAPSHOT_IDLE);
  }

  /** Writes pending changes to the log. */
  flush(): Promise<void> {
    clearTimeout(this.#appendTimer);
    if (!this.#pending.length || !this.#persistence) {
      if (!this.#persistence) this.#pending = [];
      return this.#writing;
    }
    const batch = this.#pending;
    this.#pending = [];
    const merged = batch.length === 1 ? batch[0] : Y.mergeUpdates(batch);
    this.status = 'saving';
    this.#writing = this.#writing
      .then(() => this.#persistence!.append(merged))
      .then(() => {
        this.#sinceSnapshot.updates++;
        this.#sinceSnapshot.bytes += merged.length;
        this.saveError = null;
        if (!this.#pending.length) this.status = 'saved';
        if (
          this.#sinceSnapshot.updates >= SNAPSHOT_AFTER_UPDATES ||
          this.#sinceSnapshot.bytes >= SNAPSHOT_AFTER_BYTES
        ) {
          void this.snapshot();
        }
      })
      .catch((error) => {
        // Keep what could not be written, to try again with the next change.
        this.#pending.unshift(merged);
        this.status = 'error';
        this.saveError = error?.message ?? String(error);
        console.error('the project could not be saved', error);
      });
    return this.#writing;
  }

  /** Writes the whole document as one state, and empties the log. */
  async snapshot(): Promise<void> {
    clearTimeout(this.#idleTimer);
    await this.flush();
    if (!this.#persistence || this.status === 'error') return;
    if (this.#sinceSnapshot.updates === 0) return;
    const state = Y.encodeStateAsUpdate(this.doc);
    const summary = this.summary();
    this.#sinceSnapshot = { updates: 0, bytes: 0 };
    this.#writing = this.#writing
      .then(() => this.#persistence!.saveState(state, summary))
      .catch((error) => {
        this.#sinceSnapshot.updates = 1;
        this.status = 'error';
        this.saveError = error?.message ?? String(error);
        console.error('the project could not be saved', error);
      });
    return this.#writing;
  }

  async close(): Promise<void> {
    if (this.#closed) return;
    await this.snapshot();
    this.#closed = true;
    clearTimeout(this.#appendTimer);
    clearTimeout(this.#idleTimer);
    this.undoManager.destroy();
    this.#awareness?.destroy();
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

  // =====================================================================
  // Changing
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

  // ---- order keys ----

  /** A key that sorts between two siblings. `siblings` is the list the element will join, without it. */
  #keyAt(siblings: string[], index: number): string {
    const at = Math.max(0, Math.min(index, siblings.length));
    const before = at > 0 ? this.#order(siblings[at - 1]) : null;
    const after = at < siblings.length ? this.#order(siblings[at]) : null;
    if (before !== null && after !== null && before >= after) {
      // Keys made at the same moment by two people can be equal. Give the
      // whole list fresh keys, leaving room for the newcomer.
      const keys = generateNKeysBetween(null, null, siblings.length + 1);
      siblings.forEach((id, i) => {
        const n = this.yNodes.get(id);
        if (n) n.set('order', keys[i < at ? i : i + 1]);
      });
      return keys[at];
    }
    try {
      return generateKeyBetween(before, after);
    } catch {
      return generateKeyBetween(before, null);
    }
  }

  #order(id: string): string {
    return str(this.yNodes.get(id)?.get('order'), 'a0');
  }

  // ---- maps ----

  createMap(name: string, options: { title?: string } = {}): string {
    const clean = name.replace(/\s+/g, ' ').trim() || t('project-untitled');
    const id = newId();
    const root = newId();
    this.transact(() => {
      const last = this.maps.length ? this.maps[this.maps.length - 1].order : null;
      const m = new Y.Map<unknown>();
      m.set('name', clean);
      m.set('root', root);
      m.set('order', generateKeyBetween(last, null));
      m.set('created', nowIso());
      // The language is written into the map, so that it is the same for
      // everyone the project is shared with (ADR 0020).
      m.set('document', { language: newTextLanguage() });
      this.yMaps.set(id, m);
      this.#makeNode(root, {
        map: id,
        parent: null,
        order: 'a0',
        title: options.title ?? clean,
        pos: { x: 0, y: 0 },
      });
    });
    return id;
  }

  /**
   * A map made whole, in one step that undo takes back as one: for a
   * document that is brought in. The first of the parts is the centre; every
   * other says which part it stands under, by the place of that part in the
   * list, and stands after it. `fill` writes the name and the text of each.
   */
  buildMap(
    name: string,
    parts: { under: number }[],
    fill: (part: number, title: Y.XmlFragment, body: Y.XmlFragment) => void,
    document: DocumentSettings = {},
  ): { map: string; nodes: string[] } {
    const clean = name.replace(/\s+/g, ' ').trim() || t('project-untitled');
    const id = newId();
    const nodes = parts.length ? parts.map(() => newId()) : [newId()];
    // Under what each stands, and the others that stand there, in their order.
    const under = parts.map((p, i) => (i > 0 && p.under > 0 && p.under < i ? p.under : 0));
    const beside = new Map<number, number[]>();
    for (let i = 1; i < parts.length; i++) {
      const list = beside.get(under[i]);
      if (list) list.push(i);
      else beside.set(under[i], [i]);
    }
    const orders = new Map<number, string>();
    for (const list of beside.values()) {
      const keys = generateNKeysBetween(null, null, list.length);
      list.forEach((part, i) => orders.set(part, keys[i]));
    }
    const settings: Record<string, unknown> = {
      ...document,
      language: document.language || newTextLanguage(),
    };
    for (const [k, v] of Object.entries(settings)) {
      if (v === undefined || v === null || v === '' || (Array.isArray(v) && !v.length))
        delete settings[k];
    }
    this.transact(() => {
      const last = this.maps.length ? this.maps[this.maps.length - 1].order : null;
      const m = new Y.Map<unknown>();
      m.set('name', clean);
      m.set('root', nodes[0]);
      m.set('order', generateKeyBetween(last, null));
      m.set('created', nowIso());
      m.set('document', settings);
      this.yMaps.set(id, m);
      nodes.forEach((node, i) => {
        const n = this.#makeNode(node, {
          map: id,
          parent: i === 0 ? null : nodes[under[i]],
          order: orders.get(i) ?? 'a0',
          title: i === 0 && !parts.length ? clean : '',
          pos: i === 0 ? { x: 0, y: 0 } : null,
        });
        if (parts.length) fill(i, n.get('title') as Y.XmlFragment, n.get('body') as Y.XmlFragment);
      });
    });
    return { map: id, nodes };
  }

  renameMap(id: string, name: string) {
    const clean = name.replace(/\s+/g, ' ').trim();
    const m = this.yMaps.get(id);
    if (!m || !clean || m.get('name') === clean) return;
    this.transact(() => m.set('name', clean));
  }

  setDocument(id: string, patch: Partial<DocumentSettings>) {
    const m = this.yMaps.get(id);
    if (!m) return;
    this.transact(() => {
      const current = (m.get('document') as DocumentSettings | undefined) ?? {};
      const next: Record<string, unknown> = { ...current, ...patch };
      for (const [k, v] of Object.entries(next)) {
        if (v === undefined || v === '' || (Array.isArray(v) && !v.length)) delete next[k];
      }
      m.set('document', next);
    });
  }

  /** Puts a map before another in the list of maps, or last. */
  moveMap(id: string, before: string | null) {
    const m = this.yMaps.get(id);
    if (!m) return;
    const others = this.maps.filter((x) => x.id !== id);
    const index = before ? others.findIndex((x) => x.id === before) : others.length;
    const at = index < 0 ? others.length : index;
    const prev = at > 0 ? others[at - 1].order : null;
    const next = at < others.length ? others[at].order : null;
    this.transact(() => {
      m.set(
        'order',
        prev !== null && next !== null && prev >= next
          ? generateKeyBetween(prev, null)
          : generateKeyBetween(prev, next),
      );
    });
  }

  /** Deletes a map and all its elements. Elements that include it cease to. */
  deleteMap(id: string) {
    if (!this.yMaps.has(id)) return;
    this.transact(() => {
      const doomed = new Set<string>();
      for (const [nodeId, n] of this.yNodes) {
        if (n.get('map') === id) doomed.add(nodeId);
        else if (n.get('include') === id) n.delete('include');
      }
      this.#deleteNodes(doomed);
      this.yMaps.delete(id);
    });
  }

  /** A copy of a map, with everything in it. Returns the id of the copy. */
  duplicateMap(id: string, name?: string): string | null {
    const source = this.map(id);
    if (!source) return null;
    const tree = this.tree(id);
    const copyId = newId();
    this.transact(() => {
      const ids = new Map<string, string>();
      for (const old of tree.sequence) ids.set(old, newId());
      const m = new Y.Map<unknown>();
      m.set('name', name?.trim() || t('project-map-copy', { name: source.name }));
      m.set('root', ids.get(source.root) ?? newId());
      const index = this.maps.findIndex((x) => x.id === id);
      const next = this.maps[index + 1]?.order ?? null;
      m.set(
        'order',
        next !== null && source.order >= next
          ? generateKeyBetween(source.order, null)
          : generateKeyBetween(source.order, next),
      );
      m.set('created', nowIso());
      m.set('document', { ...source.document });
      this.yMaps.set(copyId, m);
      for (const old of tree.sequence) {
        const parent = tree.parent.get(old) ?? null;
        this.#cloneNode(old, ids.get(old)!, {
          map: copyId,
          parent: parent ? (ids.get(parent) ?? null) : null,
          origin: { map: id, node: old },
        });
      }
      this.#cloneLinks(ids);
    });
    return copyId;
  }

  /** A new map that begins as a copy of a branch. The branch stays where it is. */
  mapFromBranch(nodeId: string, name?: string): string | null {
    const node = this.node(nodeId);
    if (!node) return null;
    const tree = this.tree(node.map);
    const branch = subtree(tree, nodeId);
    const mapId = newId();
    this.transact(() => {
      const ids = new Map<string, string>();
      for (const old of branch) ids.set(old, newId());
      const last = this.maps.length ? this.maps[this.maps.length - 1].order : null;
      const m = new Y.Map<unknown>();
      m.set('name', name?.trim() || node.title || t('project-untitled'));
      m.set('root', ids.get(nodeId)!);
      m.set('order', generateKeyBetween(last, null));
      m.set('created', nowIso());
      // The text is the text of the map it comes from, in its language.
      const language = this.maps.find((x) => x.id === node.map)?.document.language;
      m.set('document', language ? { language } : {});
      this.yMaps.set(mapId, m);
      for (const old of branch) {
        const parent = old === nodeId ? null : (tree.parent.get(old) ?? null);
        const copy = this.#cloneNode(old, ids.get(old)!, {
          map: mapId,
          parent: parent ? (ids.get(parent) ?? null) : null,
          origin: { map: node.map, node: old },
        });
        if (old === nodeId) {
          copy.set('pos', { x: 0, y: 0 });
          copy.delete('side');
          copy.set('heading', true);
          copy.delete('excluded');
        }
      }
      this.#cloneLinks(ids);
    });
    return mapId;
  }

  // ---- elements ----

  #makeNode(
    id: string,
    init: {
      map: string;
      parent: string | null;
      order: string;
      title?: string;
      body?: string;
      pos?: Position | null;
    },
  ): YNode {
    const n = new Y.Map<unknown>();
    n.set('map', init.map);
    n.set('parent', init.parent);
    n.set('order', init.order);
    if (init.pos) n.set('pos', init.pos);
    const title = new Y.XmlFragment();
    const body = new Y.XmlFragment();
    n.set('title', title);
    n.set('body', body);
    this.yNodes.set(id, n);
    fillTitle(title, init.title ?? '');
    if (init.body) fillBody(body, init.body);
    return n;
  }

  #cloneNode(
    from: string,
    id: string,
    change: { map: string; parent: string | null; origin?: NodeRecord['origin']; order?: string },
  ): YNode {
    const source = this.yNodes.get(from)!;
    const n = new Y.Map<unknown>();
    for (const [key, value] of source) {
      if (key === 'title' || key === 'body') continue;
      n.set(key, value instanceof Y.AbstractType ? value.clone() : structuredClone(value));
    }
    n.set('map', change.map);
    n.set('parent', change.parent);
    if (change.order) n.set('order', change.order);
    if (change.origin) n.set('origin', change.origin);
    for (const key of ['title', 'body'] as const) {
      const f = source.get(key);
      n.set(key, f instanceof Y.XmlFragment ? f.clone() : new Y.XmlFragment());
    }
    this.yNodes.set(id, n);
    return n;
  }

  /** Copies the links among a set of copied elements. */
  #cloneLinks(ids: Map<string, string>) {
    for (const l of this.links) {
      const from = ids.get(l.from);
      const to = ids.get(l.to);
      if (from && to) this.#makeLink(from, to, l.label);
    }
  }

  /** Adds an element under another. `index` is its place among the children; at the end when absent. */
  addChild(
    parentId: string,
    options: { title?: string; body?: string; index?: number } = {},
  ): string | null {
    const parent = this.node(parentId);
    if (!parent) return null;
    const tree = this.tree(parent.map);
    const siblings = tree.children.get(parentId) ?? [];
    const id = newId();
    this.transact(() => {
      const order = this.#keyAt(siblings, options.index ?? siblings.length);
      this.#makeNode(id, {
        map: parent.map,
        parent: parentId,
        order,
        title: options.title,
        body: options.body,
      });
      const p = this.yNodes.get(parentId);
      if (p?.get('collapsed') === true) p.delete('collapsed');
    });
    return id;
  }

  /** Adds an element after another, under the same parent. After the centre, adds a child. */
  addSibling(nodeId: string, options: { title?: string; before?: boolean } = {}): string | null {
    const node = this.node(nodeId);
    if (!node) return null;
    const tree = this.tree(node.map);
    const parentId = tree.parent.get(nodeId) ?? null;
    if (nodeId === tree.root) return this.addChild(nodeId, options);
    if (parentId === null) {
      // Beside a loose element: another loose element, below it.
      const pos = node.pos ?? { x: 0, y: 0 };
      return this.addLoose(node.map, { x: pos.x, y: pos.y + 70 }, options.title);
    }
    const siblings = tree.children.get(parentId) ?? [];
    const index = siblings.indexOf(nodeId) + (options.before ? 0 : 1);
    const id = newId();
    this.transact(() => {
      this.#makeNode(id, {
        map: node.map,
        parent: parentId,
        order: this.#keyAt(siblings, index),
        title: options.title,
      });
    });
    return id;
  }

  /** Adds an element that is attached to nothing. */
  addLoose(mapId: string, pos: Position, title?: string): string | null {
    if (!this.yMaps.has(mapId)) return null;
    const tree = this.tree(mapId);
    const id = newId();
    this.transact(() => {
      this.#makeNode(id, {
        map: mapId,
        parent: null,
        order: this.#keyAt(tree.loose, tree.loose.length),
        title,
        pos: { x: Math.round(pos.x), y: Math.round(pos.y) },
      });
    });
    return id;
  }

  /** Replaces the name of an element by plain text. */
  setTitle(id: string, text: string) {
    const f = this.fragment(id, 'title');
    if (!f) return;
    const clean = text.replace(/\s+/g, ' ').trim();
    if (clean === this.node(id)?.title) return;
    this.transact(() => fillTitle(f, clean));
  }

  #set(id: string, key: string, value: unknown, absentWhen: unknown) {
    const n = this.yNodes.get(id);
    if (!n) return;
    this.transact(() => {
      if (value === absentWhen || value === null || value === undefined) n.delete(key);
      else n.set(key, value);
    });
  }

  setPosition(id: string, pos: Position | null) {
    this.#set(id, 'pos', pos ? { x: Math.round(pos.x), y: Math.round(pos.y) } : null, null);
  }

  setCollapsed(id: string, collapsed: boolean) {
    this.#set(id, 'collapsed', collapsed, false);
  }

  setHeading(id: string, heading: boolean) {
    this.#set(id, 'heading', heading, true);
  }

  setExcluded(id: string, excluded: boolean) {
    this.#set(id, 'excluded', excluded, false);
  }

  /** Whether including `mapId` in an element of `inMap` would make a map include itself. */
  wouldLoop(inMap: string, mapId: string): boolean {
    if (inMap === mapId) return true;
    const seen = new Set<string>();
    const visit = (m: string): boolean => {
      if (m === inMap) return true;
      if (seen.has(m)) return false;
      seen.add(m);
      for (const n of this.nodes.values()) {
        if (n.map === m && n.include && visit(n.include)) return true;
      }
      return false;
    };
    return visit(mapId);
  }

  /** Makes an element stand for another map in the document. Returns false when that would loop. */
  setInclude(id: string, mapId: string | null): boolean {
    const node = this.node(id);
    if (!node) return false;
    if (mapId && (!this.yMaps.has(mapId) || this.wouldLoop(node.map, mapId))) return false;
    this.#set(id, 'include', mapId, null);
    return true;
  }

  /** Removes the positions the user gave, so that the branch is laid out automatically. */
  tidy(ids: string[]) {
    this.transact(() => {
      for (const top of ids) {
        const node = this.node(top);
        if (!node) continue;
        const tree = this.tree(node.map);
        for (const id of subtree(tree, top)) {
          const parent = tree.parent.get(id) ?? null;
          // The centre and loose elements keep their place: they have no other.
          if (parent === null) continue;
          this.yNodes.get(id)?.delete('pos');
        }
      }
    });
  }

  /**
   * Moves elements, with all under them, to a parent (or to none: loose), at a
   * place among its children. Elements cannot be moved under themselves.
   * Returns the ids that were moved.
   */
  move(
    ids: string[],
    parentId: string | null,
    index?: number,
    options: { pos?: Position | null; map?: string } = {},
  ): string[] {
    const first = this.node(ids[0]);
    if (!first) return [];
    const sourceMap = first.map;
    const targetMap = parentId
      ? (this.node(parentId)?.map ?? sourceMap)
      : (options.map ?? sourceMap);
    const sourceTree = this.tree(sourceMap);
    const targetTree = this.tree(targetMap);
    const movable = topmost(
      sourceTree,
      ids.filter((id) => this.node(id)?.map === sourceMap),
    ).filter(
      (id) =>
        id !== sourceTree.root &&
        id !== parentId &&
        !(parentId && sourceMap === targetMap && isAncestor(sourceTree, id, parentId)),
    );
    if (!movable.length) return [];

    this.transact(() => {
      const moving = new Set(movable);
      const list = parentId ? (targetTree.children.get(parentId) ?? []) : targetTree.loose;
      // Where in the list, counted without those that are moving.
      let at = index ?? list.length;
      at -= list.slice(0, at).filter((id) => moving.has(id)).length;
      const siblings = list.filter((id) => !moving.has(id));

      movable.forEach((id, i) => {
        const n = this.yNodes.get(id)!;
        const order = this.#keyAt(siblings, at + i);
        siblings.splice(at + i, 0, id);
        if (n.get('parent') !== parentId) n.set('parent', parentId);
        n.set('order', order);
        if (options.pos !== undefined) {
          if (options.pos) {
            n.set('pos', { x: Math.round(options.pos.x), y: Math.round(options.pos.y + i * 60) });
          } else n.delete('pos');
        } else if (parentId === null && !n.get('pos')) {
          n.set('pos', { x: 0, y: 0 });
        }
        n.delete('side');
        if (targetMap !== sourceMap) {
          for (const d of subtree(sourceTree, id)) this.yNodes.get(d)?.set('map', targetMap);
        }
      });
      if (parentId) {
        const p = this.yNodes.get(parentId);
        if (p?.get('collapsed') === true) p.delete('collapsed');
      }
    });
    return movable;
  }

  /**
   * Copies elements, with all under them, to a parent in any map (or to none:
   * loose, in `options.map`). Each copy remembers what it was copied from.
   * Returns the ids of the copies of the elements named.
   */
  copy(
    ids: string[],
    parentId: string | null,
    index?: number,
    options: { pos?: Position | null; map?: string } = {},
  ): string[] {
    const first = this.node(ids[0]);
    if (!first) return [];
    const sourceTree = this.tree(first.map);
    const targetMap = parentId ? this.node(parentId)?.map : (options.map ?? first.map);
    if (!targetMap || !this.yMaps.has(targetMap)) return [];
    const targetTree = this.tree(targetMap);
    const tops = topmost(
      sourceTree,
      ids.filter((id) => this.node(id)?.map === first.map),
    );
    const made: string[] = [];

    this.transact(() => {
      const list = parentId ? (targetTree.children.get(parentId) ?? []) : targetTree.loose;
      const siblings = list.slice();
      let at = index ?? list.length;
      const map = new Map<string, string>();
      for (const top of tops) {
        for (const old of subtree(sourceTree, top)) map.set(old, newId());
      }
      for (const top of tops) {
        for (const old of subtree(sourceTree, top)) {
          const isTop = old === top;
          const oldParent = sourceTree.parent.get(old) ?? null;
          const copy = this.#cloneNode(old, map.get(old)!, {
            map: targetMap,
            parent: isTop ? parentId : (map.get(oldParent!) ?? null),
            origin: { map: first.map, node: old },
            order: isTop ? this.#keyAt(siblings, at) : undefined,
          });
          if (isTop) {
            siblings.splice(at, 0, map.get(old)!);
            at++;
            made.push(map.get(old)!);
            if (options.pos)
              copy.set('pos', {
                x: Math.round(options.pos.x),
                y: Math.round(options.pos.y + (made.length - 1) * 60),
              });
            else if (parentId === null) copy.set('pos', copy.get('pos') ?? { x: 0, y: 0 });
            else copy.delete('pos');
            copy.delete('side');
          }
        }
      }
      this.#cloneLinks(map);
    });
    return made;
  }

  #deleteNodes(ids: Set<string>) {
    for (const id of ids) this.yNodes.delete(id);
    for (const [linkId, l] of this.yLinks) {
      if (ids.has(str(l.get('from'))) || ids.has(str(l.get('to')))) this.yLinks.delete(linkId);
    }
  }

  /**
   * Removes elements. With `keepChildren`, what is under them moves up to
   * their parent; otherwise it goes with them. The centre of a map cannot be
   * removed. Returns how many elements went.
   */
  remove(ids: string[], options: { keepChildren?: boolean } = {}): number {
    const first = this.node(ids[0]);
    if (!first) return 0;
    const tree = this.tree(first.map);
    const doomed = new Set<string>();
    this.transact(() => {
      if (options.keepChildren) {
        for (const id of ids) {
          if (id === tree.root || !this.yNodes.has(id)) continue;
          const parent = tree.parent.get(id) ?? null;
          const children = tree.children.get(id) ?? [];
          const siblings = (parent ? (tree.children.get(parent) ?? []) : tree.loose).filter(
            (s) => s !== id,
          );
          const at = (parent ? (tree.children.get(parent) ?? []) : tree.loose).indexOf(id);
          children.forEach((c, i) => {
            const n = this.yNodes.get(c)!;
            n.set('parent', parent);
            n.set('order', this.#keyAt(siblings, at + i));
            siblings.splice(at + i, 0, c);
            n.delete('pos');
            if (parent === null) n.set('pos', { x: 0, y: 0 });
          });
          doomed.add(id);
        }
      } else {
        for (const top of topmost(tree, ids)) {
          if (top === tree.root || !this.yNodes.has(top)) continue;
          for (const id of subtree(tree, top)) doomed.add(id);
        }
      }
      this.#deleteNodes(doomed);
    });
    return doomed.size;
  }

  // ---- references ----

  /**
   * Cites works at the end of the text of an element: for a reference that
   * is dropped on an element, where there is no cursor to say where.
   */
  cite(id: string, refs: string[]) {
    const body = this.fragment(id, 'body');
    if (!body || !refs.length) return;
    this.transact(() => {
      let last = body.length ? body.get(body.length - 1) : null;
      if (!(last instanceof Y.XmlElement) || last.nodeName !== 'paragraph') {
        last = new Y.XmlElement('paragraph');
        body.insert(body.length, [last]);
      }
      const paragraph = last as Y.XmlElement;
      const end = paragraph.length ? paragraph.get(paragraph.length - 1) : null;
      if (end instanceof Y.XmlText) {
        if (end.length && !/\s$/.test(end.toString())) end.insert(end.length, ' ', {});
      } else if (end) {
        paragraph.insert(paragraph.length, [new Y.XmlText(' ')]);
      }
      const citation = new Y.XmlElement('citation');
      citation.setAttribute('items', refs.map((ref) => ({ id: ref })) as unknown as string);
      citation.setAttribute('mode', 'normal');
      paragraph.insert(paragraph.length, [citation]);
    });
  }

  /**
   * A figure at the end of the text of an element: for a picture that is
   * dropped on an element, where there is no cursor to say where.
   */
  addFigure(
    id: string,
    picture: { hash: string; extension: string; name: string; alt?: string; caption?: Inline[] },
    width = 100,
  ) {
    const body = this.fragment(id, 'body');
    if (!body) return;
    this.transact(() => {
      // An empty paragraph at the end gives way.
      const last = body.length ? body.get(body.length - 1) : null;
      const at =
        last instanceof Y.XmlElement && last.nodeName === 'paragraph' && last.length === 0
          ? body.length - 1
          : body.length;
      const figure = new Y.XmlElement('figure');
      figure.setAttribute('id', newId());
      figure.setAttribute('file', picture.hash);
      figure.setAttribute('extension', picture.extension);
      figure.setAttribute('name', picture.name);
      figure.setAttribute('alt', picture.alt ?? '');
      figure.setAttribute('width', width as unknown as string);
      figure.setAttribute('numbered', true as unknown as string);
      // What is said of the picture in the store is said of the figure, to begin with.
      const said = (picture.caption ?? []).flatMap((i): (Y.XmlElement | Y.XmlText)[] => {
        if (i.kind === 'math' && i.tex) {
          const formula = new Y.XmlElement('math');
          formula.setAttribute('tex', i.tex);
          return [formula];
        }
        if (i.kind !== 'text' || !i.text) return [];
        const text = new Y.XmlText();
        text.insert(0, i.text, i.marks);
        return [text];
      });
      if (said.length) figure.insert(0, said);
      body.insert(at, [figure]);
    });
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

  /**
   * What is written about a work, for this project. It is changed where it
   * differs, and not replaced, so that two who write in it at once keep what
   * both wrote. Not part of undo: the field it is written in has its own.
   */
  setNote(ref: string, text: string) {
    const existing = this.yNotes.get(ref);
    const before = existing instanceof Y.Text ? existing.toString() : '';
    if (before === text) return;
    this.doc.transact(() => {
      if (!text.trim()) {
        this.yNotes.delete(ref);
        return;
      }
      let note = existing instanceof Y.Text ? existing : null;
      if (!note) {
        note = new Y.Text();
        this.yNotes.set(ref, note);
      }
      let start = 0;
      const most = Math.min(before.length, text.length);
      while (start < most && before[start] === text[start]) start++;
      let end = 0;
      while (
        end < most - start &&
        before[before.length - 1 - end] === text[text.length - 1 - end]
      ) {
        end++;
      }
      if (before.length - start - end > 0) note.delete(start, before.length - start - end);
      if (text.length - start - end > 0) note.insert(start, text.slice(start, text.length - end));
    }, 'notes');
  }

  #readIgnored() {
    this.ignored = new Set(this.yIgnored.keys());
  }

  /**
   * Has spelling leave a word alone in this project, for all it is shared
   * with. Not part of undo: it is not the user's writing.
   */
  ignoreWord(word: string) {
    const clean = word.trim();
    if (!clean || this.yIgnored.has(clean)) return;
    this.doc.transact(() => this.yIgnored.set(clean, true), 'spelling');
  }

  /** Has spelling check a word again that was ignored in this project. */
  unignoreWord(word: string) {
    if (!this.yIgnored.has(word)) return;
    this.doc.transact(() => this.yIgnored.delete(word), 'spelling');
  }

  /** The element whose name or text a piece of the document is. */
  ownerOf(fragment: Y.XmlFragment): string | null {
    const parent = fragment.parent;
    if (!(parent instanceof Y.Map)) return null;
    for (const [id, n] of this.yNodes) if (n === parent) return id;
    return null;
  }

  /** Keeps a copy of a reference in the project. Not part of undo: it is not the user's writing. */
  putReference(record: RefRecord) {
    const existing = this.yRefs.get(record.id);
    if (existing && existing.modified >= record.modified) return;
    this.doc.transact(() => this.yRefs.set(record.id, record), 'references');
  }

  // ---- links ----

  #makeLink(from: string, to: string, label = ''): string {
    const id = newId();
    const l = new Y.Map<unknown>();
    l.set('from', from);
    l.set('to', to);
    if (label) l.set('label', label);
    this.yLinks.set(id, l);
    return id;
  }

  /** Associates two elements. Returns the id of the link, or of the one that was there. */
  addLink(from: string, to: string): string | null {
    if (from === to || !this.yNodes.has(from) || !this.yNodes.has(to)) return null;
    const existing = this.links.find(
      (l) => (l.from === from && l.to === to) || (l.from === to && l.to === from),
    );
    if (existing) return existing.id;
    return this.transact(() => this.#makeLink(from, to));
  }

  removeLink(id: string) {
    if (!this.yLinks.has(id)) return;
    this.transact(() => this.yLinks.delete(id));
  }

  setLinkLabel(id: string, label: string) {
    const l = this.yLinks.get(id);
    if (!l) return;
    const clean = label.replace(/\s+/g, ' ').trim();
    this.transact(() => {
      if (clean) l.set('label', clean);
      else l.delete('label');
    });
  }
}
