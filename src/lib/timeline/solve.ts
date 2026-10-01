/**
 * Where elements stand in time, from what each says of itself. An element
 * is at a point or over a span; each end (`Bound`) is either a time written
 * in words, or relative: after another element, before another, during
 * another, or two of these. What is relative is solved: every bound gets
 * the window of what it may be, propagated from the times that are fixed,
 * and is drawn in the middle of its window where that is closed, or a
 * little way from its one edge where it is open. Contradictions (`after X`
 * and `before X` at once, or in a circle) are reported on the element, not
 * passed over.
 *
 * Where nothing at all is fixed, the elements are **ordered** instead:
 * placed in levels, each after what it comes after, with no scale.
 */

import { readDuration, readTime, type Axis } from './time';

/** One end of a placement. */
export interface Bound {
  /** A time written in words; nothing where the end is relative. */
  at?: string;
  /** After the end of this element. */
  after?: string;
  /** Before the start of this element. */
  before?: string;
  /** Within this element's span. */
  during?: string;
  approx?: boolean;
  /**
   * A margin either side of a written time, as a length of time: `5
   * years`, `3 months`; on the axis of units a number. The time may be so
   * much earlier or later than written; it is drawn fading away both ways.
   */
  margin?: string;
}

/** When an element is: at a point (`start` alone), or over a span. */
export interface When {
  start: Bound;
  end?: Bound;
}

export interface Placed {
  id: string;
  /** A point, or a span. */
  span: boolean;
  /** Where it is drawn: the start, and the end (the start again, for a point). */
  from: number;
  to: number;
  /** Whether both ends are written times: not solved, not floating. */
  fixed: boolean;
  /** The window of what each end may be, where an end is relative. Infinite where open. */
  window: { start: [number, number]; end: [number, number] } | null;
  /** Said to be approximate, at either end. */
  approx: boolean;
  /** The margin either side, at the start and at the end, on the axis; nought where there is none. */
  margins: [number, number];
  /** What is wrong with it: it is in contradiction with what it refers to, or refers to what is not placed. */
  problem: 'contradiction' | 'unknown' | null;
}

export interface Solved {
  /** Whether a scale was had: false where nothing was fixed and the elements are ordered. */
  scaled: boolean;
  placed: Map<string, Placed>;
  /** The earliest and the latest of all that is placed; nothing where nothing is. */
  range: [number, number] | null;
}

type Interval = [number, number];
const ALL: Interval = [-Infinity, Infinity];

interface Node {
  id: string;
  when: When;
  /** What each end may be, tightened as the solving goes. */
  start: Interval;
  end: Interval;
  /** A written time at each end, as written: it is drawn there whatever else says. */
  fixedStart: Interval | null;
  fixedEnd: Interval | null;
  /** The margin either side of each written end, on the axis. */
  marginStart: number;
  marginEnd: number;
  problem: Placed['problem'];
}

/** How far from an open edge a floating end is drawn, as a share of the range of what is fixed. */
const GAP_SHARE = 0.03;

function isRelative(b: Bound): boolean {
  return !b.at && !!(b.after || b.before || b.during);
}

function hasWindow(w: When): boolean {
  return isRelative(w.start) || (!!w.end && isRelative(w.end));
}

/** The margin either side of a written end, on the axis; nought where none is said, or it cannot be read. */
function marginOf(b: Bound, axis: Axis): number {
  if (!b.at || !b.margin) return 0;
  return readDuration(b.margin, axis) ?? 0;
}

/** Solves where everything stands, from what each element says. */
export function solve(items: { id: string; when: When }[], axis: Axis): Solved {
  const nodes = new Map<string, Node>();
  let anyFixed = false;
  for (const { id, when } of items) {
    const node: Node = {
      id,
      when,
      start: ALL,
      end: ALL,
      fixedStart: null,
      fixedEnd: null,
      marginStart: 0,
      marginEnd: 0,
      problem: null,
    };
    // A written time is drawn as written; with a margin either side, what
    // is relative to it may be anywhere within the margin.
    const startTime = when.start.at ? readTime(when.start.at, axis) : null;
    if (startTime) {
      node.marginStart = marginOf(when.start, axis);
      node.fixedStart = [startTime.from, startTime.to];
      node.start = [startTime.from - node.marginStart, startTime.to + node.marginStart];
      anyFixed = true;
    } else if (when.start.at) node.problem = 'unknown';
    if (when.end) {
      const endTime = when.end.at ? readTime(when.end.at, axis) : null;
      if (endTime) {
        node.marginEnd = marginOf(when.end, axis);
        node.fixedEnd = [endTime.from, endTime.to];
        node.end = [endTime.from - node.marginEnd, endTime.to + node.marginEnd];
        anyFixed = true;
      } else if (when.end.at) node.problem = 'unknown';
    } else {
      node.end = node.start;
      node.fixedEnd = node.fixedStart;
      node.marginEnd = node.marginStart;
    }
    nodes.set(id, node);
  }

  // What is referred to must be there.
  for (const node of nodes.values()) {
    for (const bound of [node.when.start, node.when.end]) {
      if (!bound) continue;
      for (const ref of [bound.after, bound.before, bound.during]) {
        if (ref && !nodes.has(ref)) node.problem ??= 'unknown';
      }
    }
  }

  if (!anyFixed) return ordered(nodes);

  // Propagate until nothing tightens, or too long: a circle of contradictions
  // would tighten for ever.
  const tighten = (node: Node, which: 'start' | 'end', lo: number, hi: number): boolean => {
    const was = node[which];
    const next: Interval = [Math.max(was[0], lo), Math.min(was[1], hi)];
    if (next[0] === was[0] && next[1] === was[1]) return false;
    node[which] = next;
    if (!node.when.end) {
      // A point: one interval for both.
      node.start = next;
      node.end = next;
    }
    if (next[0] > next[1]) node.problem = 'contradiction';
    return true;
  };
  for (let round = 0; round < 100; round++) {
    let changed = false;
    for (const node of nodes.values()) {
      // A span begins before it ends.
      if (node.when.end) {
        changed = tighten(node, 'start', -Infinity, node.end[1]) || changed;
        changed = tighten(node, 'end', node.start[0], Infinity) || changed;
      }
      const ends: ['start' | 'end', Bound][] = [['start', node.when.start]];
      if (node.when.end) ends.push(['end', node.when.end]);
      for (const [which, bound] of ends) {
        if (bound.at) continue;
        const other = (ref: string | undefined) => (ref ? nodes.get(ref) : undefined);
        const after = other(bound.after);
        if (after) {
          changed = tighten(node, which, after.end[0], Infinity) || changed;
          changed = tighten(after, 'end', -Infinity, node[which][1]) || changed;
        }
        const before = other(bound.before);
        if (before) {
          changed = tighten(node, which, -Infinity, before.start[1]) || changed;
          changed = tighten(before, 'start', node[which][0], Infinity) || changed;
        }
        const during = other(bound.during);
        if (during) {
          changed = tighten(node, which, during.start[0], during.end[1]) || changed;
        }
      }
    }
    if (!changed) break;
  }

  // The range of what is fixed, for the gaps of what floats.
  let lo = Infinity;
  let hi = -Infinity;
  for (const node of nodes.values()) {
    for (const fixed of [node.fixedStart, node.fixedEnd]) {
      if (!fixed) continue;
      lo = Math.min(lo, fixed[0]);
      hi = Math.max(hi, fixed[1]);
    }
  }
  const gap = Math.max((hi - lo) * GAP_SHARE, 1);

  /**
   * Where a floating end is drawn: in the middle of its window, or a little
   * way from its one edge. What it refers to is taken where that was
   * drawn, once it has been, so that a chain of elements each after the
   * last is drawn in its order, not all at the same earliest place.
   */
  const drawn = new Map<string, { from: number; to: number }>();
  const settle = (
    node: Node,
    which: 'start' | 'end',
    fixed: Interval | null,
    bound: Bound,
    lean: number,
  ): number => {
    // A written time stands where it was written: a point at its start, a span's end at its end.
    if (fixed) return which === 'start' ? fixed[0] : fixed[1];
    let [a, b] = node[which];
    const after = bound.after ? drawn.get(bound.after) : undefined;
    if (after) a = Math.max(a, after.to);
    const before = bound.before ? drawn.get(bound.before) : undefined;
    if (before) b = Math.min(b, before.from);
    const during = bound.during ? drawn.get(bound.during) : undefined;
    if (during) {
      a = Math.max(a, during.from);
      b = Math.min(b, during.to);
    }
    if (a > b) {
      // After what is drawn later than what it is before: nowhere to be.
      node.problem = 'contradiction';
      return Number.isFinite(a) ? a : Number.isFinite(b) ? b : lean;
    }
    if (Number.isFinite(a) && Number.isFinite(b)) return (a + b) / 2;
    if (Number.isFinite(a)) return a + gap;
    if (Number.isFinite(b)) return b - gap;
    return lean;
  };

  const placed = new Map<string, Placed>();
  let min = Infinity;
  let max = -Infinity;
  const unplaceable = (node: Node) => {
    placed.set(node.id, {
      id: node.id,
      span: !!node.when.end,
      from: NaN,
      to: NaN,
      fixed: false,
      window: null,
      approx: false,
      margins: [0, 0],
      problem: node.problem ?? 'unknown',
    });
  };
  const refs = (node: Node): string[] => {
    const out: string[] = [];
    for (const bound of [node.when.start, node.when.end]) {
      if (!bound || bound.at) continue;
      for (const ref of [bound.after, bound.before, bound.during]) if (ref) out.push(ref);
    }
    return out;
  };
  const place = (node: Node) => {
    const from = settle(node, 'start', node.fixedStart, node.when.start, lo);
    let to = node.when.end ? settle(node, 'end', node.fixedEnd, node.when.end, from + gap) : from;
    if (node.when.end && !node.fixedEnd && to <= from) to = from + gap;
    // A point written as a year, a month, a century, is as long as what was written.
    if (!node.when.end && node.fixedStart) to = node.fixedStart[1];
    if (!Number.isFinite(from) || !Number.isFinite(to)) {
      unplaceable(node);
      return;
    }
    drawn.set(node.id, { from, to });
    const margins: [number, number] = [node.marginStart, node.marginEnd];
    placed.set(node.id, {
      id: node.id,
      span: !!node.when.end,
      from,
      to,
      fixed: !!node.fixedStart && !!node.fixedEnd,
      window: hasWindow(node.when) ? { start: node.start, end: node.end } : null,
      approx: !!node.when.start.approx || !!node.when.end?.approx,
      margins,
      problem: node.problem,
    });
    // The margins are drawn too: the range takes them in.
    min = Math.min(min, from - margins[0]);
    max = Math.max(max, to + margins[1]);
  };
  // What is written first; then what refers only to what is drawn, round by
  // round; last, what refers to itself in a circle, from its window alone.
  const waiting = new Set<Node>();
  for (const node of nodes.values()) {
    const unplaced =
      !node.fixedStart && !Number.isFinite(node.start[0]) && !Number.isFinite(node.start[1]);
    if (!node.fixedStart && (node.problem === 'unknown' || (unplaced && !node.when.end))) {
      unplaceable(node);
      continue;
    }
    if (node.fixedStart && (!node.when.end || node.fixedEnd)) place(node);
    else waiting.add(node);
  }
  for (let round = 0; waiting.size && round < 100; round++) {
    const ready = [...waiting].filter((node) =>
      refs(node).every((ref) => drawn.has(ref) || placed.has(ref) || !nodes.has(ref)),
    );
    if (!ready.length) break;
    for (const node of ready) {
      waiting.delete(node);
      place(node);
    }
  }
  for (const node of waiting) place(node);
  return { scaled: true, placed, range: min <= max ? [min, max] : null };
}

/** Without a scale: each element a level after what it comes after. */
function ordered(nodes: Map<string, Node>): Solved {
  const placed = new Map<string, Placed>();
  // The elements each depends on: those it is after, during, or that are before it.
  const deps = new Map<string, Set<string>>();
  for (const node of nodes.values()) deps.set(node.id, new Set());
  for (const node of nodes.values()) {
    for (const bound of [node.when.start, node.when.end]) {
      if (!bound) continue;
      if (bound.after && nodes.has(bound.after)) deps.get(node.id)!.add(bound.after);
      if (bound.during && nodes.has(bound.during)) deps.get(node.id)!.add(bound.during);
      if (bound.before && nodes.has(bound.before)) deps.get(bound.before)!.add(node.id);
    }
  }
  const level = new Map<string, number>();
  const visiting = new Set<string>();
  const circular = new Set<string>();
  const levelOf = (id: string): number => {
    const known = level.get(id);
    if (known !== undefined) return known;
    if (visiting.has(id)) {
      circular.add(id);
      return 0;
    }
    visiting.add(id);
    let l = 0;
    for (const d of deps.get(id) ?? []) l = Math.max(l, levelOf(d) + 1);
    visiting.delete(id);
    level.set(id, l);
    return l;
  };
  let max = 0;
  for (const node of nodes.values()) max = Math.max(max, levelOf(node.id));
  for (const node of nodes.values()) {
    const l = levelOf(node.id);
    // A span that another is during reaches as far as what is in it.
    let to = l;
    if (node.when.end) {
      to = l + 1;
      for (const other of nodes.values()) {
        if (other.when.start.during === node.id || other.when.end?.during === node.id)
          to = Math.max(to, levelOf(other.id) + 1);
      }
    }
    placed.set(node.id, {
      id: node.id,
      span: !!node.when.end,
      from: l,
      to,
      fixed: false,
      window: null,
      approx: !!node.when.start.approx || !!node.when.end?.approx,
      margins: [0, 0],
      problem: circular.has(node.id) ? 'contradiction' : node.problem,
    });
    max = Math.max(max, to);
  }
  return { scaled: false, placed, range: nodes.size ? [0, max] : null };
}

/** What a placement says, in words, for where it is shown beside the element. */
export function describeWhen(
  when: When,
  nameOf: (id: string) => string,
  words: { after: string; before: string; during: string; to: string; approx: string },
): string {
  const bound = (b: Bound): string => {
    if (b.at)
      return (b.approx ? `${words.approx} ` : '') + b.at + (b.margin ? ` ± ${b.margin}` : '');
    const parts: string[] = [];
    if (b.after) parts.push(`${words.after} ${nameOf(b.after)}`);
    if (b.before) parts.push(`${words.before} ${nameOf(b.before)}`);
    if (b.during) parts.push(`${words.during} ${nameOf(b.during)}`);
    return parts.join(', ');
  };
  const start = bound(when.start);
  return when.end ? `${start} ${words.to} ${bound(when.end)}` : start;
}
