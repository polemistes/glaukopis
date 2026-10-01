/**
 * What changed in a map between two moments, read from a document that keeps
 * what was deleted: its passages piece by piece, its figures, equations and
 * tables, and its elements. See `types.ts` for what each part says.
 *
 * The text of an element is ProseMirror's tree of nodes as y-prosemirror
 * keeps it: an element of XML for each node, and within a block, texts of
 * XML whose formatting is the marks. Every item is walked, those that were
 * deleted among them, and each is asked whether it was to be seen before and
 * after: so what was removed is found where it stood.
 */

import * as Y from 'yjs';
import { buildTree, type FlatNode, type Tree } from '$lib/project/model/tree';
import { attributesAt, children, entryAt, idWord, valueAt, type At } from './moments';
import type {
  Items,
  MapChanges,
  ObjectChange,
  Passage,
  Piece,
  Place,
  Run,
  TextObject,
} from './types';

/** What stands for an object in the text of a piece. */
export const OBJECT = '￼';

/** Blocks that hold other blocks, and are not changes of their own. */
const CONTAINERS = new Set([
  'blockquote',
  'verse',
  'parallel',
  'parallel_side',
  'bullet_list',
  'ordered_list',
  'list_item',
  'row',
  'table',
  'table_row',
  'table_cell',
  'table_header',
]);

/** Blocks that are changes of their own as wholes: they stand by themselves in the text. */
const OBJECTS: Record<string, string> = {
  figure: 'figure',
  equation: 'equation',
  tabular: 'table',
};

/** Who is who: by the copy that made an item, and by what they deleted. */
export interface Who {
  maker(client: number): string | null;
  deleter(id: Y.ID): string | null;
}

/** A stretch of a block that is compared with what was accepted there rather than with the moment. */
export interface Override {
  /** Positions in the units of the block, as `units` gives them: from the first to the one after the last. */
  from: number;
  to: number;
  visible: Items;
}

/** A part of a block, in order: some text, an object, or what formats the text after it. */
export interface Unit {
  item: Y.Item;
  kind: 'text' | 'object' | 'format';
  /** The text of XML it is in, where it is text or formats it. */
  text: Y.XmlText | null;
}

/** The parts of a block in order, deleted ones among them. */
export function units(block: Y.XmlElement): Unit[] {
  const out: Unit[] = [];
  for (const child of children(block)) {
    const content = child.content;
    if (!(content instanceof Y.ContentType)) continue;
    const type = content.type;
    if (type instanceof Y.XmlText) {
      for (const item of children(type)) {
        if (item.content instanceof Y.ContentFormat) out.push({ item, kind: 'format', text: type });
        else if (item.content instanceof Y.ContentString)
          out.push({ item, kind: 'text', text: type });
        else if (item.content instanceof Y.ContentEmbed)
          out.push({ item, kind: 'object', text: type });
      }
    } else if (type instanceof Y.XmlElement) {
      out.push({ item: child, kind: 'object', text: null });
    }
  }
  return out;
}

export function has(items: Items, id: Y.ID): boolean {
  const list = items[id.client];
  if (!list) return false;
  let low = 0;
  let high = list.length - 1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    const [from, to] = list[mid];
    if (id.clock < from) high = mid - 1;
    else if (id.clock >= to) low = mid + 1;
    else return true;
  }
  return false;
}

export function addItems(items: Items, client: number, clock: number, length: number) {
  const list = (items[client] ??= []);
  const last = list[list.length - 1];
  if (last && last[1] === clock) last[1] += length;
  else list.push([clock, clock + length]);
}

/** Items made whole again: sorted, and what touches joined. */
export function tidyItems(items: Items): Items {
  const out: Items = {};
  for (const [client, list] of Object.entries(items)) {
    const sorted = [...list].sort((a, b) => a[0] - b[0]);
    const joined: [number, number][] = [];
    for (const [from, to] of sorted) {
      const last = joined[joined.length - 1];
      if (last && from <= last[1]) last[1] = Math.max(last[1], to);
      else joined.push([from, to]);
    }
    out[Number(client)] = joined;
  }
  return out;
}

/** Marks as the contract has them: by name, `true` or what the mark holds. */
function marksOf(attributes: Map<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const names = [...attributes.keys()].sort();
  for (const key of names) {
    const value = attributes.get(key);
    if (value === null || value === undefined || value === false) continue;
    const name = /^(.*)--[a-zA-Z0-9+/=]{8}$/.exec(key)?.[1] ?? key;
    out[name] =
      typeof value === 'object' && value !== null && Object.keys(value).length ? value : true;
  }
  return out;
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** Where a unit stands in the text: whether it was to be seen before and after. */
interface Seen {
  before: boolean;
  after: boolean;
}

/**
 * Reads a block between two moments, piece by piece. Objects in it that
 * have text of their own (notes) are told to `note`, with the index each
 * has among the notes of the block.
 */
export function readPieces(
  block: Y.XmlElement,
  before: At,
  after: At,
  who: Who,
  override: Override[] = [],
  note?: (element: Y.XmlElement, index: number) => void,
  /** Only the units from and to these, where given: what formats them is read all the same. */
  range?: [number, number],
): Piece[] {
  const list = units(block);
  // A stretch that was accepted takes in what formats it at its ends.
  const stretches = override.map((o) => {
    let from = o.from;
    while (from > 0 && list[from - 1].kind === 'format') from--;
    let to = o.to;
    while (to < list.length && list[to].kind === 'format') to++;
    return { from, to, visible: o.visible };
  });
  const seen = (unit: Unit, index: number): Seen => {
    const stretch = stretches.find((s) => index >= s.from && index < s.to);
    return {
      before: stretch ? has(stretch.visible, unit.item.id) : before.seen(unit.item),
      after: after.seen(unit.item),
    };
  };

  const pieces: Piece[] = [];
  let attrsBefore = new Map<string, unknown>();
  let attrsAfter = new Map<string, unknown>();
  /** Who last changed each mark, in the text being read. */
  let changedBy = new Map<string, string | null>();
  let text: Y.XmlText | null = null;
  /** What formats the text, until the next piece takes it. */
  let formats: Items = {};
  let notes = 0;

  const put = (piece: Piece, mergeable: boolean) => {
    for (const [client, ranges] of Object.entries(formats))
      for (const [from, to] of ranges) addItems(piece.items, Number(client), from, to - from);
    formats = {};
    const last = pieces[pieces.length - 1];
    if (
      mergeable &&
      last &&
      !last.object &&
      last.status === piece.status &&
      last.by === piece.by &&
      last.marksBy === piece.marksBy &&
      same(last.marks, piece.marks) &&
      same(last.marksBefore, piece.marksBefore)
    ) {
      last.text += piece.text;
      for (const [client, ranges] of Object.entries(piece.items))
        for (const [from, to] of ranges) addItems(last.items, Number(client), from, to - from);
      for (const run of piece.runs) {
        const end = last.runs[last.runs.length - 1];
        if (end && end[0] === run[0] && end[1] + end[2] === run[1]) end[2] += run[2];
        else last.runs.push([...run] as Run);
      }
      return;
    }
    pieces.push(piece);
  };

  list.forEach((unit, index) => {
    const item = unit.item;
    if (unit.text !== text) {
      text = unit.text;
      attrsBefore = new Map();
      attrsAfter = new Map();
      changedBy = new Map();
    }
    const { before: b, after: a } = seen(unit, index);
    if (unit.kind === 'format') {
      const format = item.content as Y.ContentFormat;
      if (b) attrsBefore.set(format.key, format.value);
      if (a) attrsAfter.set(format.key, format.value);
      if (a && !b) changedBy.set(format.key, who.maker(item.id.client));
      else if (b && !a) changedBy.set(format.key, who.deleter(item.id));
      if (a || b) addItems(formats, item.id.client, item.id.clock, item.length);
      return;
    }
    if (!a && !b) return;
    if (range && (index < range[0] || index >= range[1])) return;
    const status = a && b ? 'same' : a ? 'added' : 'removed';
    const by =
      status === 'added'
        ? who.maker(item.id.client)
        : status === 'removed'
          ? who.deleter(item.id)
          : null;
    const items: Items = {};
    addItems(items, item.id.client, item.id.clock, item.length);
    const runs: Run[] = [[item.id.client, item.id.clock, item.length]];

    if (unit.kind === 'object') {
      const content = item.content;
      const element = content instanceof Y.ContentType ? (content.type as Y.XmlElement) : null;
      const kind = element ? element.nodeName : 'embed';
      const attrsThen = element ? attributesAt(element, before) : {};
      const attrsNow = element ? attributesAt(element, after) : {};
      const object: TextObject = {
        kind,
        label: '',
        attrs: status === 'removed' ? attrsThen : attrsNow,
      };
      const piece: Piece = {
        status,
        text: OBJECT,
        object,
        marks: {},
        by,
        items,
        runs,
      };
      if (status === 'same' && !same(attrsThen, attrsNow)) {
        piece.objectBefore = { kind, label: '', attrs: attrsThen };
        piece.marksBy = changer(element!, before, after, who);
      }
      put(piece, false);
      // Notes are counted as they are now: one that is gone has the place it would have.
      if (element && kind === 'footnote') {
        note?.(element, notes);
        if (a) notes++;
      }
      return;
    }

    const marksNow = marksOf(attrsAfter);
    const marksThen = marksOf(attrsBefore);
    const piece: Piece = {
      status,
      text: (item.content as Y.ContentString).str,
      marks: status === 'removed' ? marksThen : marksNow,
      by,
      items,
      runs,
    };
    if (status === 'same' && !same(marksNow, marksThen)) {
      piece.marksBefore = marksThen;
      const keys = new Set([...Object.keys(marksNow), ...Object.keys(marksThen)]);
      let changer: string | null = null;
      for (const [key, person] of changedBy) {
        const name = /^(.*)--[a-zA-Z0-9+/=]{8}$/.exec(key)?.[1] ?? key;
        if (keys.has(name) && !same(marksNow[name], marksThen[name])) changer = person;
      }
      piece.marksBy = changer;
    }
    put(piece, true);
  });
  // What formats the end of the text belongs to the last piece.
  if (pieces.length && Object.keys(formats).length) {
    const last = pieces[pieces.length - 1];
    for (const [client, ranges] of Object.entries(formats))
      for (const [from, to] of ranges) addItems(last.items, Number(client), from, to - from);
  }
  for (const p of pieces) p.items = tidyItems(p.items);
  return settle(pieces);
}

/** Who last changed an attribute of an element between two moments. */
function changer(element: Y.XmlElement, before: At, after: At, who: Who): string | null {
  let found: string | null = null;
  let newest = -1;
  for (const key of element._map.keys()) {
    const now = entryAt(element, key, after);
    const then = entryAt(element, key, before);
    if (now && now !== then && now.id.clock > newest) {
      newest = now.id.clock;
      found = who.maker(now.id.client);
    } else if (!now && then) found ??= who.deleter(then.id);
  }
  return found;
}

/**
 * y-prosemirror writes a run of text anew where an object is put into it or
 * taken out of it: what follows the object is deleted and written again. The
 * same text, taken away and put back by the same person with only objects
 * between, is shown as it is: the same.
 */
function settle(pieces: Piece[]): Piece[] {
  for (let i = 0; i < pieces.length; i++) {
    const removed = pieces[i];
    if (removed.status !== 'removed' || removed.object) continue;
    for (let j = i + 1; j < pieces.length; j++) {
      const other = pieces[j];
      if (other.object) continue;
      if (
        other.status === 'added' &&
        other.text === removed.text &&
        other.by === removed.by &&
        same(other.marks, removed.marks)
      ) {
        other.status = 'same';
        other.by = null;
        pieces.splice(i, 1);
        i--;
      }
      break;
    }
  }
  return pieces;
}

// =====================================================================
// A map
// =====================================================================

/** What is read of a map: its changes, and what is needed to find its blocks again. */
export interface MapReading extends MapChanges {
  /** Every passage, in the order of the text, those that did not change among them. */
  all: Passage[];
  /** The elements in the order of the text, with whether they were there before and after. */
  order: { element: string; before: boolean; after: boolean; level: number }[];
}

interface ElementAt {
  id: string;
  node: Y.Map<unknown>;
  parent: string | null;
  order: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyType = Y.AbstractType<any>;

function elementsAt(doc: Y.Doc, map: string, at: At): Map<string, ElementAt> {
  const nodes = doc.getMap('nodes') as unknown as AnyType;
  const out = new Map<string, ElementAt>();
  for (const id of nodes._map.keys()) {
    const node = valueAt(nodes, id, at);
    if (!(node instanceof Y.Map)) continue;
    const type = node as unknown as AnyType;
    if (valueAt(type, 'map', at) !== map) continue;
    const parent = valueAt(type, 'parent', at);
    const order = valueAt(type, 'order', at);
    out.set(id, {
      id,
      node,
      parent: typeof parent === 'string' ? parent : null,
      order: typeof order === 'string' ? order : 'a0',
    });
  }
  return out;
}

function treeAt(doc: Y.Doc, map: string, at: At, elements: Map<string, ElementAt>): Tree {
  const maps = doc.getMap('maps') as unknown as AnyType;
  const record = valueAt(maps, map, at);
  const root = record instanceof Y.Map ? valueAt(record as unknown as AnyType, 'root', at) : null;
  const flat: FlatNode[] = [...elements.values()].map((e) => ({
    id: e.id,
    map,
    parent: e.parent,
    order: e.order,
  }));
  return buildTree(flat, map, typeof root === 'string' ? root : null);
}

/** The elements of both moments in one order: those that are gone where they stood. */
function merged(before: string[], after: string[]): string[] {
  const out = [...after];
  const present = new Set(after);
  let previous: string | null = null;
  const placed = new Map<string, number>();
  for (const id of before) {
    if (present.has(id)) {
      previous = id;
      continue;
    }
    // After the element before it, and after those gone that were put there already.
    let at = previous === null ? 0 : out.indexOf(previous) + 1;
    while (at < out.length && placed.has(out[at])) at++;
    out.splice(at, 0, id);
    placed.set(id, at);
    previous = id;
  }
  return out;
}

/** Of a list in two orders, those that are not where they were among the others: the fewest that moved. */
function movedIn(before: string[], after: string[]): Set<string> {
  const common = new Set(before.filter((id) => after.includes(id)));
  const a = before.filter((id) => common.has(id));
  const b = after.filter((id) => common.has(id));
  // The longest they have in common, in order; the rest moved.
  const table = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--)
      table[i][j] =
        a[i] === b[j] ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1]);
  const stayed = new Set<string>();
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      stayed.add(a[i]);
      i++;
      j++;
    } else if (table[i + 1][j] >= table[i][j + 1]) i++;
    else j++;
  }
  return new Set(a.filter((id) => !stayed.has(id)));
}

export interface ReadOptions {
  /** Only these elements, where given. */
  elements?: Set<string>;
  /** Stretches accepted, by the block they are in (`client:clock` of its item). */
  overrides?: Map<string, Override[]>;
}

/** Reads what changed in a map between two moments. Within a transaction in which the moments are split. */
export function readMap(
  doc: Y.Doc,
  map: string,
  before: At,
  after: At,
  who: Who,
  options: ReadOptions = {},
): MapReading {
  const then = elementsAt(doc, map, before);
  const now = elementsAt(doc, map, after);
  const treeThen = treeAt(doc, map, before, then);
  const treeNow = treeAt(doc, map, after, now);
  const sequence = merged(treeThen.sequence, treeNow.sequence);

  const reading: MapReading = { map, passages: [], objects: [], elements: [], all: [], order: [] };
  const nodes = doc.getMap('nodes') as unknown as AnyType;

  // ---- the elements themselves ----
  /** The parents among whose children some changed places. */
  const reordered = new Set<string>();
  const parents = new Set([...treeThen.children.keys(), ...treeNow.children.keys()]);
  for (const parent of parents) {
    const a = (treeThen.children.get(parent) ?? []).filter(
      (id) => treeNow.parent.get(id) === parent,
    );
    const b = (treeNow.children.get(parent) ?? []).filter(
      (id) => treeThen.parent.get(id) === parent,
    );
    if (movedIn(a, b).size) reordered.add(parent);
  }
  const placeIn = (tree: Tree, id: string) => {
    const parent = tree.parent.get(id) ?? null;
    const siblings = parent ? (tree.children.get(parent) ?? []) : tree.loose;
    const index = siblings.indexOf(id);
    return { parent, after: index > 0 ? siblings[index - 1] : null };
  };

  for (const id of sequence) {
    if (options.elements && !options.elements.has(id)) continue;
    const a = now.get(id);
    const b = then.get(id);
    reading.order.push({
      element: id,
      before: !!b,
      after: !!a,
      level: (a ? treeNow.depth.get(id) : treeThen.depth.get(id)) ?? 0,
    });
    const entry = entryAt(nodes, id, a ? after : before);
    if (a && !b) {
      reading.elements.push({
        element: id,
        kind: 'added',
        after: placeIn(treeNow, id),
        by: entry ? who.maker(entry.id.client) : null,
      });
    } else if (b && !a) {
      const gone = entryAt(nodes, id, before);
      reading.elements.push({
        element: id,
        kind: 'removed',
        before: placeIn(treeThen, id),
        by: gone ? who.deleter(gone.id) : null,
      });
    } else if (a && b) {
      const node = a.node as unknown as AnyType;
      // Of two that changed places, the one that moved is the one given a new
      // place: its order is newer, and among those that were there both times
      // its neighbours are others than they were.
      const neighbours = (tree: Tree, other: Tree) => {
        const parent = tree.parent.get(id) ?? null;
        const list = (parent ? (tree.children.get(parent) ?? []) : tree.loose).filter(
          (x) => x === id || (other.parent.get(x) ?? null) === parent,
        );
        const i = list.indexOf(id);
        return `${list[i - 1] ?? ''} ${list[i + 1] ?? ''}`;
      };
      const moved =
        (treeThen.parent.get(id) ?? null) !== (treeNow.parent.get(id) ?? null) ||
        (reordered.has(treeNow.parent.get(id) ?? '') &&
          entryAt(node, 'order', after) !== entryAt(node, 'order', before) &&
          neighbours(treeThen, treeNow) !== neighbours(treeNow, treeThen));
      const by = (key: string) => {
        const item = entryAt(node, key, after);
        return item && item !== entryAt(node, key, before) ? who.maker(item.id.client) : null;
      };
      if (moved)
        reading.elements.push({
          element: id,
          kind: 'moved',
          before: placeIn(treeThen, id),
          after: placeIn(treeNow, id),
          by: by('order') ?? by('parent'),
        });
      const flag = (key: string, given: boolean) => {
        const value = valueAt(node, key, after);
        const was = valueAt(node, key, before);
        return {
          now: value === undefined ? given : value === true,
          then: was === undefined ? given : was === true,
        };
      };
      const heading = flag('heading', true);
      if (heading.now !== heading.then)
        reading.elements.push({ element: id, kind: 'heading', by: by('heading') });
      const excluded = flag('excluded', false);
      if (excluded.now !== excluded.then)
        reading.elements.push({
          element: id,
          kind: excluded.now ? 'excluded' : 'included',
          by: by('excluded'),
        });
    }

    // ---- its name and text ----
    const node = (a ?? b)!.node as unknown as AnyType;
    for (const part of ['title', 'body'] as const) {
      const fragment = valueAt(node, part, a ? after : before);
      if (!(fragment instanceof Y.XmlFragment)) continue;
      readBlocks(fragment, [], { element: id, part }, before, after, who, options, reading);
    }
  }
  return reading;
}

/** Reads the blocks of a fragment or container, and the blocks within them. */
function readBlocks(
  container: Y.XmlFragment,
  path: (number | 'note')[],
  where: { element: string; part: 'title' | 'body' },
  before: At,
  after: At,
  who: Who,
  options: ReadOptions,
  reading: MapReading,
  within: string | null = null,
) {
  let index = 0;
  for (const item of children(container)) {
    const content = item.content;
    if (!(content instanceof Y.ContentType) || !(content.type instanceof Y.XmlElement)) continue;
    const element = content.type;
    const b = before.seen(item);
    const a = after.seen(item);
    const here = [...path, index];
    if (a) index++;
    if (!a && !b) continue;
    const name = element.nodeName;
    const place: Place = { element: where.element, part: where.part, path: here };

    if (name in OBJECTS) {
      const attrsNow = attributesAt(element, after);
      const attrsThen = attributesAt(element, before);
      const shape = (at: At) => (name === 'tabular' ? tableShape(element, at) : null);
      const status: ObjectChange['status'] = a && b ? 'changed' : a ? 'added' : 'removed';
      const shapeNow = shape(after);
      const shapeThen = shape(before);
      if (status !== 'changed' || !same(attrsNow, attrsThen) || !same(shapeNow, shapeThen)) {
        reading.objects.push({
          place,
          kind: OBJECTS[name],
          status,
          ...(b ? { before: { ...attrsThen, ...(shapeThen ?? {}) } } : {}),
          ...(a ? { after: { ...attrsNow, ...(shapeNow ?? {}) } } : {}),
          by:
            status === 'added'
              ? who.maker(item.id.client)
              : status === 'removed'
                ? who.deleter(item.id)
                : changer(element, before, after, who),
        });
      }
      if (name === 'figure')
        readText(element, here, place, 'caption', a, b, before, after, who, options, reading);
      else if (name === 'tabular')
        readBlocks(element, here, where, before, after, who, options, reading, 'table');
      continue;
    }
    if (name === 'table_caption') {
      readText(element, here, place, 'caption', a, b, before, after, who, options, reading);
      continue;
    }
    if (CONTAINERS.has(name)) {
      const inside = name === 'table_cell' || name === 'table_header' ? 'cell' : within;
      readBlocks(element, here, where, before, after, who, options, reading, inside);
      continue;
    }
    const kind = where.part === 'title' ? 'name' : within === 'cell' ? 'cell' : 'paragraph';
    readText(element, here, place, kind, a, b, before, after, who, options, reading);
  }
}

function tableShape(tabular: Y.XmlElement, at: At): { rows: number; columns: number } {
  let rows = 0;
  let columns = 0;
  for (const part of children(tabular)) {
    if (!at.seen(part) || !(part.content instanceof Y.ContentType)) continue;
    const table = part.content.type as Y.XmlElement;
    if (table.nodeName !== 'table') continue;
    for (const row of children(table)) {
      if (!at.seen(row) || !(row.content instanceof Y.ContentType)) continue;
      rows++;
      let cells = 0;
      for (const cell of children(row.content.type as Y.XmlElement)) if (at.seen(cell)) cells++;
      columns = Math.max(columns, cells);
    }
  }
  return { rows, columns };
}

function differs(passage: Passage): boolean {
  return (
    passage.before !== passage.after ||
    passage.pieces.some((p) => p.status !== 'same' || p.marksBefore || p.objectBefore)
  );
}

function readText(
  element: Y.XmlElement,
  path: (number | 'note')[],
  place: Place,
  kind: string,
  a: boolean,
  b: boolean,
  before: At,
  after: At,
  who: Who,
  options: ReadOptions,
  reading: MapReading,
) {
  const block = idWord(element._item!.id);
  const notes: { element: Y.XmlElement; index: number }[] = [];
  const pieces = readPieces(
    element,
    before,
    after,
    who,
    options.overrides?.get(block),
    (note, index) => notes.push({ element: note, index }),
  );
  const passage: Passage = { place: { ...place, path }, block, kind, before: b, after: a, pieces };
  reading.all.push(passage);
  if (differs(passage)) reading.passages.push(passage);
  for (const n of notes) {
    const item = n.element._item!;
    const notePath = [...path, 'note' as const, n.index];
    const noteBlock = idWord(item.id);
    const notePieces = readPieces(n.element, before, after, who, options.overrides?.get(noteBlock));
    const note: Passage = {
      place: { ...place, path: notePath },
      block: noteBlock,
      kind: 'note',
      before: b && before.seen(item),
      after: a && after.seen(item),
      pieces: notePieces,
    };
    reading.all.push(note);
    if (differs(note)) reading.passages.push(note);
  }
}
