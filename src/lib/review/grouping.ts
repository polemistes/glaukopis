/**
 * The changes of a map, as a review goes through them (ADR 0022): what the
 * history says changed in a map, grouped into what is decided at once.
 *
 * - A sentence is one change, with the words that changed marked in it,
 *   however many places in it changed, and whoever changed them.
 * - New text of a sentence or more is one change, however long, and so is
 *   text deleted: a paragraph written, or several in a row, or deleted.
 * - A paragraph moved, a passage deleted and one written with nearly the
 *   same text anywhere in the map, is one change.
 * - Each element added, deleted, moved, set in or out of the document, or
 *   given a heading or not, is one; an element added with its text is one.
 * - A figure, an equation or a table as a whole is one, and so is a
 *   citation, a formula or a note put into a sentence or taken out of it,
 *   where nothing else of the sentence changed. What is said of a figure,
 *   the text of a note and of a cell are gone through sentence by sentence.
 * - Formatting is part of its sentence.
 *
 * The review can also go by paragraph: each passage that changed is one.
 */

import type {
  ElementChange,
  MapChanges,
  ObjectChange,
  Passage,
  Piece,
  Place,
} from '$lib/history/types';
import { core, sentences, type Sentence } from './sentences';

export type Unit = 'sentence' | 'paragraph';

export interface Options {
  /** Sentence by sentence, or paragraph by paragraph. */
  unit?: Unit;
  /** The language of the map, whose sentences are found. */
  language?: string | null;
  /** Who reviews: their own changes are left out, unless `own`. */
  me?: string | null;
  own?: boolean;
  /** The elements of the map in the order of the text, which the changes are put in. */
  sequence?: string[];
}

/** A stretch of a passage that is part of a change. */
export interface Stretch {
  passage: Passage;
  /** Its pieces: those of the passage, the first and the last cut where the stretch begins and ends. */
  pieces: Piece[];
  /** Where it is in the text of the passage as it is now (the same and the added) and as it was (the same and the removed). */
  now: Span;
  then: Span;
  /** Whether it is the whole of the passage. */
  whole: boolean;
}

export interface Span {
  from: number;
  to: number;
}

export type ChangeKind = 'changed' | 'added' | 'removed' | 'moved' | 'object' | 'element';

export interface Change {
  /** What tells it from the others, and stays the same while it is worked out anew. */
  key: string;
  kind: ChangeKind;
  /** The element it is in, or is. */
  element: string;
  /** Its text: one stretch, or several for paragraphs in a row, or two (from, to) for a move. */
  stretches: Stretch[];
  /** A figure, an equation or a table as a whole. */
  object?: ObjectChange;
  /** An element as an element. */
  change?: ElementChange;
  /** Who made it, as the history knows them; null for someone not known. */
  by: (string | null)[];
}

// ---- pieces ----

const SPACE = /^\s*$/u;

function sameMarks(a: Record<string, unknown>, b: Record<string, unknown>): boolean {
  const ka = Object.keys(a).filter((k) => a[k] != null && a[k] !== false);
  const kb = Object.keys(b).filter((k) => b[k] != null && b[k] !== false);
  if (ka.length !== kb.length) return false;
  return ka.every((k) => JSON.stringify(a[k]) === JSON.stringify(b[k]));
}

/** Whether a piece is a change: added, removed, or formatted otherwise than it was. */
export function changed(piece: Piece): boolean {
  return (
    piece.status !== 'same' ||
    (piece.marksBefore !== undefined && !sameMarks(piece.marks, piece.marksBefore))
  );
}

/** Whether a piece is space and nothing else. */
function blank(piece: Piece): boolean {
  return !piece.object && SPACE.test(piece.text);
}

/** A piece laid out: where it begins among all the pieces, in the text as it is, and as it was. */
interface Laid {
  piece: Piece;
  at: number;
  /** -1 where it is not in that text. */
  now: number;
  then: number;
}

interface Layout {
  laid: Laid[];
  now: string;
  then: string;
  length: number;
}

function lay(pieces: Piece[]): Layout {
  const laid: Laid[] = [];
  let at = 0;
  let now = '';
  let then = '';
  for (const piece of pieces) {
    laid.push({
      piece,
      at,
      now: piece.status === 'removed' ? -1 : now.length,
      then: piece.status === 'added' ? -1 : then.length,
    });
    if (piece.status !== 'removed') now += piece.text;
    if (piece.status !== 'added') then += piece.text;
    at += piece.text.length;
  }
  return { laid, now, then, length: at };
}

type Side = 'now' | 'then';

/**
 * Where a place of the text as it is, or as it was, is among all the pieces.
 * The end of something is found in the piece that its last sign is in.
 */
function toAll(layout: Layout, side: Side, offset: number, end: boolean): number {
  for (const l of layout.laid) {
    const start = l[side];
    if (start < 0) continue;
    const length = l.piece.text.length;
    if (
      end ? offset > start && offset <= start + length : offset >= start && offset < start + length
    )
      return l.at + (offset - start);
  }
  return end ? layout.length : 0;
}

/** Where a stretch of all the pieces is in one of the texts. */
function fromAll(layout: Layout, side: Side, from: number, to: number): Span {
  let a = -1;
  let b = -1;
  let count = 0;
  for (const l of layout.laid) {
    const length = l.piece.text.length;
    if (l[side] < 0) continue;
    const start = Math.max(from, l.at);
    const end = Math.min(to, l.at + length);
    if (end > start) {
      if (a < 0) a = l[side] + (start - l.at);
      b = l[side] + (end - l.at);
    }
    count = l[side] + length;
    if (l.at >= to && a < 0) {
      a = b = l[side];
      break;
    }
  }
  if (a < 0) a = b = count;
  return { from: a, to: b };
}

/** The pieces of a stretch of all the pieces, cut where it begins and ends. */
function cut(layout: Layout, from: number, to: number): Piece[] {
  const out: Piece[] = [];
  for (const l of layout.laid) {
    const length = l.piece.text.length;
    const start = Math.max(from, l.at);
    const end = Math.min(to, l.at + length);
    if (end <= start) continue;
    out.push(
      start === l.at && end === l.at + length
        ? l.piece
        : { ...l.piece, text: l.piece.text.slice(start - l.at, end - l.at) },
    );
  }
  return out;
}

/** Who made the changes among some pieces, each once, in the order they come. */
function peopleOf(pieces: Piece[]): (string | null)[] {
  const out: (string | null)[] = [];
  for (const p of pieces) if (changed(p) && !out.includes(p.by)) out.push(p.by);
  return out;
}

// ---- within a passage ----

interface Group {
  from: number;
  to: number;
  /** Whether all it changed is things that are no text: a citation, a formula, a note. */
  objects: boolean;
}

/** The sentences of a text, as stretches of all the pieces: the whole, and the core without space. */
function laidSentences(layout: Layout, side: Side, language: string | null | undefined) {
  const text = layout[side];
  return sentences(text, language).map((s) => {
    const kernel = core(text, s);
    const all = (x: Sentence) => ({
      from: toAll(layout, side, x.start, false),
      to: toAll(layout, side, x.end, true),
    });
    return { text: s, core: kernel, whole: all(s), inner: kernel ? all(kernel) : null };
  });
}

/**
 * The groups of a passage in which the text as it is and as it was differ,
 * sentence by sentence: each the sentences that the changes in it touch.
 */
function groupsOf(layout: Layout, language: string | null | undefined): Group[] {
  const { laid } = layout;
  const changes = laid.map((l) => changed(l.piece));
  if (!changes.some(Boolean)) return [];

  const lists = {
    now: laidSentences(layout, 'now', language),
    then: laidSentences(layout, 'then', language),
  };
  /** The sentences a changed piece touches: those whose words it is among, or where it is space, those it stands in. */
  const touched = (l: Laid): Span[] => {
    const side: Side = l.piece.status === 'removed' ? 'then' : 'now';
    const start = l[side];
    const end = start + l.piece.text.length;
    const list = lists[side];
    const inner = list.filter((s) => s.core && s.core.start < end && s.core.end > start);
    if (inner.length) return inner.map((s) => s.inner!);
    return list
      .filter((s) => s.text.start < Math.max(end, start + 1) && s.text.end > start)
      .map((s) => s.whole);
  };

  // Runs of changes: changed pieces one after another, with nothing but space between.
  const runs: number[][] = [];
  let run: number[] = [];
  let gap = false;
  laid.forEach((l, i) => {
    if (changes[i]) {
      if (gap && run.length) {
        runs.push(run);
        run = [];
      }
      run.push(i);
      gap = false;
    } else if (!blank(l.piece)) gap = true;
  });
  if (run.length) runs.push(run);

  const groups: Group[] = runs.map((indices) => {
    const first = laid[indices[0]];
    const last = laid[indices[indices.length - 1]];
    let from = first.at;
    let to = last.at + last.piece.text.length;
    const pieces = indices.map((i) => laid[i].piece);
    // A citation, a formula or a note put in or taken out, and nothing else: a change of its own.
    const objects =
      pieces.some((p) => p.object) &&
      pieces.every((p) => p.object || (blank(p) && p.status !== 'same'));
    if (!objects) {
      for (const i of indices) {
        for (const s of touched(laid[i])) {
          from = Math.min(from, s.from);
          to = Math.max(to, s.to);
        }
      }
    }
    return { from, to, objects };
  });

  // Groups that share a sentence are one.
  groups.sort((a, b) => a.from - b.from || a.to - b.to);
  const merged: Group[] = [];
  for (const g of groups) {
    const last = merged[merged.length - 1];
    if (last && g.from < last.to) {
      last.to = Math.max(last.to, g.to);
      last.objects &&= g.objects;
    } else merged.push({ ...g });
  }
  return merged;
}

/** What a stretch of pieces is: all of its words new, all deleted, or some of each. */
function kindOf(pieces: Piece[], objects: boolean): ChangeKind {
  if (objects) return 'object';
  const worded = pieces.filter((p) => !blank(p));
  if (worded.length && worded.every((p) => p.status === 'added')) return 'added';
  if (worded.length && worded.every((p) => p.status === 'removed')) return 'removed';
  return 'changed';
}

function stretchOf(passage: Passage, layout: Layout, from: number, to: number): Stretch {
  return {
    passage,
    pieces: cut(layout, from, to),
    now: fromAll(layout, 'now', from, to),
    then: fromAll(layout, 'then', from, to),
    whole: from <= 0 && to >= layout.length,
  };
}

/** A passage that is new or deleted as a whole. */
function wholly(passage: Passage): 'added' | 'removed' | null {
  if (!passage.before && passage.after) return 'added';
  if (passage.before && !passage.after) return 'removed';
  const worded = passage.pieces.filter((p) => !blank(p));
  if (!worded.length) return null;
  if (worded.every((p) => p.status === 'added')) return 'added';
  if (worded.every((p) => p.status === 'removed')) return 'removed';
  return null;
}

// ---- keys and order ----

function pathKey(path: Place['path']): string {
  return path.join('.');
}

/** Whether a path is that of a block or of what is within it. */
function within(path: Place['path'], block: Place['path']): boolean {
  return block.every((step, i) => path[i] === step);
}

function placeKey(place: Place): string {
  return `${place.element}/${place.part}/${pathKey(place.path)}`;
}

/** The first item of the changes among some pieces, which stays while more is written after it. */
function firstItem(pieces: Piece[]): string {
  let best: [number, number] | null = null;
  for (const p of pieces) {
    if (!changed(p)) continue;
    for (const [client, ranges] of Object.entries(p.items)) {
      for (const [start] of ranges) {
        const c = Number(client);
        if (!best || c < best[0] || (c === best[0] && start < best[1])) best = [c, start];
      }
    }
    if (best) break;
  }
  return best ? `${best[0]}.${best[1]}` : '';
}

/** The path of the block a passage is in: that of the paragraph a note stands in. */
function blockOf(path: Place['path']): number[] {
  const at = path.indexOf('note');
  return (at < 0 ? path : path.slice(0, at)) as number[];
}

/**
 * Whether the block `b` comes right after the block `a` in the text: the
 * next at some depth, and the first of whatever it holds.
 */
function nextBlock(a: number[], b: number[]): boolean {
  for (let depth = a.length - 1; depth >= 0; depth--) {
    if (b.length <= depth) continue;
    let same = true;
    for (let i = 0; i < depth; i++) if (a[i] !== b[i]) same = false;
    // Blocks deleted one after another may be said to stand at the same place.
    const step = b[depth] - a[depth];
    const last = depth === a.length - 1;
    if (same && (step === 1 || (last && step === 0)) && b.slice(depth + 1).every((n) => n === 0))
      return true;
  }
  return false;
}

/** Whether a passage follows another right after it, in the same text: its note, or the next block. */
function follows(a: Passage, b: Passage): boolean {
  if (a.place.element !== b.place.element || a.place.part !== b.place.part) return false;
  const pa = blockOf(a.place.path);
  const pb = blockOf(b.place.path);
  if (pathKey(pa) === pathKey(pb)) return true;
  return nextBlock(pa, pb);
}

function comparePaths(a: Place['path'], b: Place['path']): number {
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    const x = a[i];
    const y = b[i];
    if (x === y) continue;
    // A note comes after the text it stands in, and before the next block.
    if (x === 'note') return 1;
    if (y === 'note') return -1;
    return (x as number) - (y as number);
  }
  return a.length - b.length;
}

// ---- moves ----

function words(text: string): string[] {
  return text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
}

/** How nearly two texts have the same words: from nought to one. */
export function likeness(a: string, b: string): number {
  return alike(bagOf(a), bagOf(b));
}

/** The words of a text, each with how often it stands in it. */
interface Bag {
  text: string;
  count: number;
  words: Map<string, number>;
}

function bagOf(text: string): Bag {
  const list = words(text);
  const bag = new Map<string, number>();
  for (const w of list) bag.set(w, (bag.get(w) ?? 0) + 1);
  return { text, count: list.length, words: bag };
}

function alike(x: Bag, y: Bag): number {
  if (!x.count && !y.count) return x.text.trim() === y.text.trim() ? 1 : 0;
  if (!x.count || !y.count) return 0;
  const [small, large] = x.words.size <= y.words.size ? [x, y] : [y, x];
  let common = 0;
  for (const [w, n] of small.words) common += Math.min(n, large.words.get(w) ?? 0);
  return (2 * common) / (x.count + y.count);
}

/**
 * How many passages deleted and written are compared at most, to find the
 * paragraphs moved: beyond it, as where most of a map was written anew,
 * what was moved is shown as deleted and written.
 */
const COMPARED = 40_000;

/** How nearly the same a passage deleted and one written must be to be a paragraph moved. */
const MOVED = 0.8;

function textOf(change: Change, side: 'added' | 'removed'): string {
  return change.stretches
    .map((s) =>
      s.pieces
        .filter((p) => p.status === side || p.status === 'same')
        .map((p) => p.text)
        .join(''),
    )
    .join('\n');
}

// ---- the whole ----

/** The changes of a map, in the order of the text. */
export function group(map: MapChanges, options: Options = {}): Change[] {
  const unit = options.unit ?? 'sentence';
  const out: Change[] = [];

  // What each passage holds.
  for (const passage of map.passages) {
    const layout = lay(passage.pieces);
    const whole = wholly(passage);
    if (unit === 'paragraph' || whole) {
      if (!passage.pieces.some(changed) && passage.before === passage.after) continue;
      const stretch = stretchOf(passage, layout, 0, layout.length);
      out.push({
        key: '',
        kind: whole ?? 'changed',
        element: passage.place.element,
        stretches: [stretch],
        by: peopleOf(passage.pieces),
      });
      continue;
    }
    for (const g of groupsOf(layout, options.language)) {
      const stretch = stretchOf(passage, layout, g.from, g.to);
      out.push({
        key: '',
        kind: kindOf(stretch.pieces, g.objects),
        element: passage.place.element,
        stretches: [stretch],
        by: peopleOf(stretch.pieces),
      });
    }
  }

  // New text in a row is one change: paragraphs one after another, with their notes.
  const joined: Change[] = [];
  for (const c of out) {
    const last = joined[joined.length - 1];
    if (
      last &&
      (c.kind === 'added' || c.kind === 'removed') &&
      last.kind === c.kind &&
      c.stretches[0].whole &&
      last.stretches[last.stretches.length - 1].whole &&
      follows(last.stretches[last.stretches.length - 1].passage, c.stretches[0].passage)
    ) {
      last.stretches.push(...c.stretches);
      for (const b of c.by) if (!last.by.includes(b)) last.by.push(b);
      continue;
    }
    joined.push(c);
  }

  // A note put in or taken out, and its text, are one change.
  for (const c of joined) {
    if (c.kind !== 'object') continue;
    const note = c.stretches[0].pieces.find((p) => p.object?.kind === 'footnote');
    if (!note) continue;
    const at = c.stretches[0].passage.place;
    const text = joined.find(
      (d) =>
        d !== c &&
        d.kind === (note.status === 'added' ? 'added' : 'removed') &&
        d.stretches[0].whole &&
        d.stretches[0].passage.place.element === at.element &&
        d.stretches[0].passage.place.part === at.part &&
        d.stretches[0].passage.place.path.includes('note') &&
        pathKey(blockOf(d.stretches[0].passage.place.path)) === pathKey(at.path),
    );
    if (!text) continue;
    c.kind = text.kind;
    c.stretches.push(...text.stretches);
    for (const b of text.by) if (!c.by.includes(b)) c.by.push(b);
    joined.splice(joined.indexOf(text), 1);
  }

  // A paragraph deleted and one written with nearly the same words is a paragraph moved.
  const removed = joined.filter((c) => c.kind === 'removed' && c.stretches.every((s) => s.whole));
  const added = joined.filter((c) => c.kind === 'added' && c.stretches.every((s) => s.whole));
  const pairs: { from: Change; to: Change; like: number }[] = [];
  // Only those of nearly the same length are compared: the written ones by their length.
  const written = added
    .map((to) => ({ to, bag: bagOf(textOf(to, 'added')) }))
    .sort((x, y) => x.bag.text.length - y.bag.text.length);
  let compared = 0;
  for (const from of removed) {
    const a = bagOf(textOf(from, 'removed'));
    const least = a.text.length * MOVED;
    const most = a.text.length / MOVED;
    let low = 0;
    let high = written.length;
    while (low < high) {
      const mid = (low + high) >> 1;
      if (written[mid].bag.text.length < least) low = mid + 1;
      else high = mid;
    }
    for (let i = low; i < written.length && written[i].bag.text.length <= most; i++) {
      if (++compared > COMPARED) break;
      const { to, bag } = written[i];
      if (!bag.text.length && !a.text.length) continue;
      const like = alike(a, bag);
      if (like >= MOVED) pairs.push({ from, to, like });
    }
  }
  pairs.sort((x, y) => y.like - x.like);
  const paired = new Set<Change>();
  for (const { from, to } of pairs) {
    if (paired.has(from) || paired.has(to)) continue;
    paired.add(from);
    paired.add(to);
    to.kind = 'moved';
    to.stretches = [...from.stretches, ...to.stretches];
    for (const b of from.by) if (!to.by.includes(b)) to.by.push(b);
    joined.splice(joined.indexOf(from), 1);
  }

  // Figures, equations and tables, with what is said of them where they are new or deleted.
  for (const object of map.objects) {
    const change: Change = {
      key: '',
      kind: 'object',
      element: object.place.element,
      stretches: [],
      object,
      by: [object.by],
    };
    if (object.status !== 'changed') {
      const said = joined.find(
        (d) =>
          d.kind === object.status &&
          d.stretches.every((s) => s.whole) &&
          d.stretches[0].passage.place.element === object.place.element &&
          d.stretches[0].passage.place.part === object.place.part &&
          within(d.stretches[0].passage.place.path, object.place.path),
      );
      if (said) {
        change.stretches = said.stretches;
        for (const b of said.by) if (!change.by.includes(b)) change.by.push(b);
        joined.splice(joined.indexOf(said), 1);
      }
    }
    joined.push(change);
  }

  // Elements, with their name and text where they are new or deleted.
  for (const element of map.elements) {
    const change: Change = {
      key: '',
      kind: 'element',
      element: element.element,
      stretches: [],
      change: element,
      by: [element.by],
    };
    if (element.kind === 'added' || element.kind === 'removed') {
      const side = element.kind;
      for (let i = joined.length - 1; i >= 0; i--) {
        const d = joined[i];
        if (d.element !== element.element || d.kind !== side) continue;
        if (!d.stretches.every((s) => s.whole)) continue;
        change.stretches.unshift(...d.stretches);
        for (const b of d.by) if (!change.by.includes(b)) change.by.push(b);
        joined.splice(i, 1);
      }
    }
    joined.push(change);
  }

  // One's own are shown only when asked for.
  const shown =
    options.me && !options.own ? joined.filter((c) => c.by.some((b) => b !== options.me)) : joined;

  for (const c of shown) c.key = keyOf(c);
  const seen = new Map<string, number>();
  for (const c of shown) {
    const n = seen.get(c.key) ?? 0;
    seen.set(c.key, n + 1);
    if (n) c.key += `#${n}`;
  }
  return order(shown, options.sequence ?? []);
}

function keyOf(c: Change): string {
  if (c.change) return `element:${c.element}:${c.change.kind}`;
  if (c.object) return `object:${placeKey(c.object.place)}:${c.object.status}`;
  const last = c.stretches[c.stretches.length - 1];
  return `${c.kind === 'moved' ? 'moved' : 'text'}:${placeKey(last.passage.place)}:${firstItem(last.pieces)}`;
}

/** Where a change is: the element, the part and the path it begins at, where it stands now. */
function whereOf(c: Change): { element: string; part: number; path: Place['path']; at: number } {
  if (c.change) return { element: c.element, part: -1, path: [], at: 0 };
  const place = c.object?.place ?? c.stretches[c.stretches.length - 1]?.passage.place;
  const at = c.object ? 0 : (c.stretches[c.stretches.length - 1]?.now.from ?? 0);
  return {
    element: c.element,
    part: place?.part === 'title' ? 0 : 1,
    path: place?.path ?? [],
    at,
  };
}

/** The changes in the order of the text: that of the elements, and within each, of its text. */
function order(changes: Change[], sequence: string[]): Change[] {
  const index = new Map(sequence.map((id, i) => [id, i]));
  // An element that is no longer there stands where it stood: after the one it came after, or under its parent.
  const rank = (c: Change): number => {
    const known = index.get(c.element);
    if (known !== undefined) return known;
    const was = c.change?.before;
    const near = was ? (index.get(was.after ?? '') ?? index.get(was.parent ?? '')) : undefined;
    return near !== undefined ? near + 0.5 : sequence.length;
  };
  return changes
    .map((c, i) => ({ c, i, rank: rank(c), where: whereOf(c) }))
    .sort(
      (a, b) =>
        a.rank - b.rank ||
        a.where.part - b.where.part ||
        comparePaths(a.where.path, b.where.path) ||
        a.where.at - b.where.at ||
        a.i - b.i,
    )
    .map((x) => x.c);
}
