/**
 * What the text of a map shows, worked out from plain data: the rows of
 * the elements and what is folded away under them, the numbers of the
 * outline, the place and depth where dragged elements would go, and the
 * brackets of the associations in the margin with the lanes they take.
 *
 * `MapText` measures the page and calls these; nothing here looks at the
 * page or at Svelte, so that each decision can be tested by itself.
 */

import type { LinkRecord, NodeRecord } from '../model/types';
import type { Tree } from '../model/tree';

/** What a row needs to know of its element. */
export type RowFacts = Pick<NodeRecord, 'excluded' | 'empty' | 'include' | 'words'>;

export interface Row {
  id: string;
  level: number;
  excluded: boolean;
  /** Whether it has text of its own or something under it, which can be folded away. */
  foldable: boolean;
  /**
   * What is folded away of it: the elements under it, whether it has text
   * of its own, and how many words there are in all of it.
   */
  hidden: { ids: string[]; text: boolean; words: number } | null;
  /** Whether it is folded away itself, under another. */
  away: boolean;
}

/**
 * Every element of the branch, the one in view first, those that are
 * folded away as well (`away`). `folded` says whether an element is
 * folded; one that is folded with something to fold away hides all under
 * it, and counts the words of all it hides.
 */
export function textRows(
  tree: Tree,
  facts: (id: string) => RowFacts | undefined,
  folded: (id: string) => boolean,
): Row[] {
  const out: Row[] = [];
  const walk = (id: string, level: number, excluded: boolean, away: boolean) => {
    const node = facts(id);
    if (!node) return;
    const out_ = excluded || node.excluded;
    const under = tree.children.get(id) ?? [];
    const text = !node.empty || !!node.include;
    const foldable = under.length > 0 || text;
    const hides = !away && foldable && folded(id);
    const row: Row = {
      id,
      level,
      excluded: out_,
      foldable,
      hidden: hides ? { ids: [], text, words: node.words } : null,
      away,
    };
    out.push(row);
    // The element in view is the title; every element deepens what is under it.
    const from = out.length;
    for (const c of under) walk(c, level + 1, out_, away || hides);
    if (row.hidden) {
      for (const r of out.slice(from)) {
        row.hidden.ids.push(r.id);
        row.hidden.words += facts(r.id)?.words ?? 0;
      }
    }
  };
  walk(tree.root, 0, false, false);
  return out;
}

/**
 * The numbers of the elements, as in an outline: 1, 1.2, 1.2.3, counted
 * every element counted, what is folded away as well (pass all the
 * rows), so that they do not change as it is folded. The element in view
 * and what is left out of the document have none.
 */
export function outlineNumbers(rows: Row[]): Map<string, string> {
  const out = new Map<string, string>();
  const counters: number[] = [];
  for (const r of rows) {
    if (r.level === 0 || r.excluded) continue;
    counters.length = r.level;
    counters[r.level - 1] = (counters[r.level - 1] ?? 0) + 1;
    out.set(r.id, Array.from(counters, (n) => n ?? 0).join('.'));
  }
  return out;
}

/** The words and the notes of the document, what is folded away with them, what is left out not. */
export function totalsOf(
  rows: Row[],
  facts: (id: string) => Pick<NodeRecord, 'words' | 'notes'> | undefined,
): { words: number; notes: number } {
  let words = 0;
  let notes = 0;
  for (const r of rows) {
    if (r.excluded) continue;
    const n = facts(r.id);
    if (!n) continue;
    words += n.words;
    notes += n.notes;
  }
  return { words, notes };
}

/**
 * Whether an element can be joined to the one shown before it: it has
 * nothing under it, and the one before is not folded. What is folded
 * stands, in the document, between that element's own text and this
 * one, and a text joined to it would move before what is folded away.
 * `rows` are those shown.
 */
export function joinable(rows: Row[], tree: Tree, id: string): boolean {
  const i = rows.findIndex((r) => r.id === id);
  return i > 0 && id !== tree.root && !(tree.children.get(id)?.length ?? 0) && !rows[i - 1].hidden;
}

// ---- where dragged elements would go ----

/** The width of the gutter of a section, before its name: see `TextSection`. */
export const GUTTER = 44;
/** How far each level of a drop is indented, from where the names begin. */
export const DROP_STEP = 24;

/** Where a section stands in the column, as it is measured. */
export interface Box {
  top: number;
  bottom: number;
  height: number;
}

/** How deep an element stands under the element in view, which is at nought. */
export function depthUnder(tree: Tree, id: string): number {
  let depth = 0;
  for (let at = id; at !== tree.root; depth++) {
    const parent = tree.parent.get(at);
    if (!parent) break;
    at = parent;
  }
  return depth;
}

/**
 * Which of the sections shown is above the place the pointer's height
 * points at: the place is after it. In the upper half of a section, or
 * its first 60 pixels where it is tall, the place is before it, after the
 * one before. `box` measures a section, asked only as far as is needed.
 */
export function placeAt(y: number, count: number, box: (i: number) => Box): number {
  let above = 0;
  for (let i = 0; i < count; i++) {
    const r = box(i);
    if (y < r.top) break;
    const upper = y < r.top + Math.min(r.height / 2, 60);
    above = upper ? Math.max(0, i - 1) : i;
    if (upper || y <= r.bottom) break;
  }
  return above;
}

/** One depth a place between two elements allows, and where it puts what is dropped. */
export interface DropChoice {
  /** How deep they would stand, from one, for the elements under the one in view. */
  depth: number;
  /** Under which they go, at which place among those under it. */
  parent: string;
  index: number;
  /** What the line says: under the element named, after it, or before it. */
  say: 'under' | 'after' | 'before';
  /** The element named. */
  name: string;
}

/**
 * The depths the place between `above` and `below` (the elements shown
 * there; no `below` after the last) allows, from the deepest to the
 * shallowest: under the element above, after it, or after the one over
 * it at each depth out, as far out as beside the element below. Where
 * that is beside the element below, it is said to be before it. `inside`
 * says of an element that what is dragged would go into itself there.
 */
export function dropChoices(
  tree: Tree,
  above: string,
  below: string | null,
  inside: (id: string) => boolean,
): DropChoice[] {
  const deepest = depthUnder(tree, above) + 1;
  const belowDepth = below ? depthUnder(tree, below) : null;
  const shallowest = belowDepth ?? 1;
  const choices: DropChoice[] = [];
  if (!inside(above))
    choices.push({ depth: deepest, parent: above, index: 0, say: 'under', name: above });
  let x: string | undefined = above;
  for (let depth = deepest - 1; depth >= shallowest && x && x !== tree.root; depth--) {
    const parent = tree.parent.get(x);
    if (!parent) break;
    if (!inside(parent)) {
      const list = tree.children.get(parent) ?? [];
      const before = below !== null && belowDepth === depth ? below : null;
      choices.push({
        depth,
        parent,
        index: list.indexOf(x) + 1,
        say: before ? 'before' : 'after',
        name: before ?? x,
      });
    }
    x = parent;
  }
  return choices;
}

/** The depth the pointer is at, from where the names begin at `left`. */
export function depthAt(x: number, left: number): number {
  return 1 + Math.round((x - left) / DROP_STEP);
}

/** The choice nearest to the depth wanted; between two as near, the deeper. */
export function nearestChoice<C extends { depth: number }>(choices: C[], wanted: number): C {
  return choices.reduce((best, c) =>
    Math.abs(c.depth - wanted) < Math.abs(best.depth - wanted) ? c : best,
  );
}

/**
 * Where the line of a drop is drawn, from the top of the column at `base`:
 * halfway between the two sections, or a little under the last.
 */
export function lineBetween(above: Box, below: Box | undefined, base: number): number {
  return Math.round((below ? (above.bottom + below.top) / 2 : above.bottom + 6) - base);
}

/** How far in the line of a drop is drawn for a depth, never so far that its words leave the column. */
export function dropIndent(depth: number, width: number): number {
  return Math.min(GUTTER + (depth - 1) * DROP_STEP, width - 80);
}

// ---- the brackets of associations, in the margin ----

export interface Bracket {
  id: string;
  /** The end higher up in the text, and the one lower down. */
  from: string;
  to: string;
  top: number;
  bottom: number;
  lane: number;
  label: string;
  /** The path drawn, from the edge of the text outwards. */
  path: string;
}

/** How far apart the lanes are, and where the first is. */
export const LANE = 9;
export const FIRST = 10;

/**
 * The brackets of the associations: each from the height of one end's
 * name (`anchors`) to the other's, ends that are folded away taken where
 * they are folded under (`shown`). One whose ends are not both measured,
 * or which would join an element to itself, is not drawn. The short ones
 * stand innermost; each takes the first lane where it clears, by six
 * pixels, every bracket already there.
 */
export function bracketsOf(
  links: LinkRecord[],
  anchors: Map<string, number>,
  shown: (id: string) => string,
): Bracket[] {
  const spans = links
    .map((l) => {
      const from = shown(l.from);
      const to = shown(l.to);
      if (from === to) return null;
      const a = anchors.get(from);
      const b = anchors.get(to);
      if (a === undefined || b === undefined) return null;
      const upper = a <= b ? from : to;
      const lower = a <= b ? to : from;
      return {
        id: l.id,
        from: upper,
        to: lower,
        top: Math.min(a, b),
        bottom: Math.max(a, b),
        label: l.label,
      };
    })
    .filter((s): s is NonNullable<typeof s> => s !== null)
    // Short ones innermost.
    .sort((x, y) => x.bottom - x.top - (y.bottom - y.top) || x.top - y.top);

  const lanes: { top: number; bottom: number }[][] = [];
  const out: Bracket[] = [];
  for (const s of spans) {
    let lane = 0;
    for (;;) {
      const taken = lanes[lane] ?? (lanes[lane] = []);
      if (!taken.some((t) => s.top <= t.bottom + 6 && s.bottom >= t.top - 6)) {
        taken.push({ top: s.top, bottom: s.bottom });
        break;
      }
      lane++;
    }
    const x = FIRST + lane * LANE;
    const r = Math.min(5, (s.bottom - s.top) / 2);
    const path =
      s.bottom - s.top < 2
        ? `M 0 ${s.top} H ${x}`
        : `M 0 ${s.top} H ${x - r} Q ${x} ${s.top} ${x} ${s.top + r} V ${s.bottom - r} Q ${x} ${s.bottom} ${x - r} ${s.bottom} H 0`;
    out.push({ ...s, lane, path });
  }
  return out;
}

/** How wide the margin is for the brackets: room for every lane taken, and never narrower than 40. */
export function marginWidth(brackets: Bracket[]): number {
  return Math.max(40, FIRST + (Math.max(-1, ...brackets.map((b) => b.lane)) + 1) * LANE + 12);
}
