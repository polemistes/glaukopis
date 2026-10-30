/**
 * Where the elements of a map stand on the canvas.
 *
 * Elements are placed automatically, as a mind map: the element in view in
 * the middle, its children to the right and to the left, each branch growing
 * outwards with its children stacked beside it, each as close under the one
 * before as the outline of the two allows: the boxes, and the lines from an
 * element to those under it, so that nothing stands across a line. An
 * element with little under it thus stands close beside one with much, and
 * what is under the latter fans out past it; an element stands midway
 * between its first child and its last. An element the user has moved keeps
 * the place it was given, relative to its parent, and its own branch is laid
 * out from there. The element in view stands at the origin whatever its
 * place under its own parent, and is never folded. Coordinates are those of
 * the centre of each element.
 */

import type { Tree } from '../model/tree';
import type { NodeRecord, Position, Side } from '../model/types';
import { clearance, joined, moved, piece, reach, type Outline } from './contour';

export interface Size {
  w: number;
  h: number;
}

export interface Placed {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  side: Side;
  depth: number;
  parent: string | null;
  /** How many elements are hidden under it because it is collapsed. */
  hidden: number;
  /** Whether the user placed it. */
  pinned: boolean;
}

export interface Layout {
  placed: Map<string, Placed>;
  /** Visible elements, parents before children. */
  order: string[];
  bounds: { left: number; top: number; right: number; bottom: number };
}

/** Between an element and those under it. */
export const H_GAP = 64;
/** Between a branch and the next, wherever the two come closest. */
export const V_GAP = 10;
export const DEFAULT_SIZE: Size = { w: 120, h: 36 };

/** A branch as laid out on its own, its element at the origin and growing to the right. */
interface Branch {
  top: Outline;
  bottom: Outline;
  /** How far it reaches above the middle of its element, and below. */
  above: number;
  below: number;
}

export function layout(
  tree: Tree,
  nodes: ReadonlyMap<string, NodeRecord>,
  sizes: ReadonlyMap<string, Size>,
  /** Elements held at a place on the canvas whatever their parent: those being dragged. */
  held: ReadonlyMap<string, Position> = new Map(),
): Layout {
  const placed = new Map<string, Placed>();
  const order: string[] = [];
  const size = (id: string): Size => sizes.get(id) ?? DEFAULT_SIZE;

  // The element in view is open whatever is said of it: what it is folded
  // under is not seen from within it.
  const visibleChildren = (id: string): string[] =>
    id !== tree.root && nodes.get(id)?.collapsed ? [] : (tree.children.get(id) ?? []);

  const countUnder = (id: string): number => {
    let n = 0;
    for (const c of tree.children.get(id) ?? []) n += 1 + countUnder(c);
    return n;
  };

  /** Where a child stands from its parent, in the frame of a branch growing to the right; of those that flow. */
  const rel = new Map<string, Position>();
  /** Which side of the element in view each of its flowing children went to. */
  const sideOf = new Map<string, Side>();

  /** Those of the children that take their place in the flow: all but those the user put somewhere. A flowing element that is held keeps its room, so that nothing else moves while it is dragged. */
  const flowing = (id: string): string[] => visibleChildren(id).filter((c) => !nodes.get(c)?.pos);

  /**
   * Children stacked beside their parent, each as close under the one
   * before as the outlines allow: how far down each stands from the first,
   * and the outline of all of them together, in the parent's frame.
   */
  const stack = (parent: Size, kids: { id: string; branch: Branch }[]) => {
    const ys: number[] = [];
    let top: Outline = [];
    let bottom: Outline = [];
    kids.forEach((k, i) => {
      const s = size(k.id);
      const dx = parent.w / 2 + H_GAP + s.w / 2;
      const over = moved(k.branch.top, dx, 0);
      // Their boxes stand in one column, so they always lie over each other; failing that, box under box.
      const dy =
        i === 0
          ? 0
          : (clearance(bottom, over, V_GAP) ??
            ys[i - 1] + size(kids[i - 1].id).h / 2 + V_GAP + s.h / 2);
      ys.push(dy);
      top = joined(top, moved(over, 0, dy), false);
      bottom = joined(bottom, moved(k.branch.bottom, dx, dy), true);
    });
    return { ys, top, bottom };
  };

  /** Each child of a stack given its place from the parent, which stands midway between the first and the last. */
  const settle = (parent: Size, kids: { id: string; branch: Branch }[], ys: number[]): number => {
    const mid = (ys[0] + ys[ys.length - 1]) / 2;
    kids.forEach((k, i) =>
      rel.set(k.id, { x: parent.w / 2 + H_GAP + size(k.id).w / 2, y: ys[i] - mid }),
    );
    return mid;
  };

  const branches = new Map<string, Branch>();
  const branch = (id: string): Branch => {
    const known = branches.get(id);
    if (known) return known;
    const s = size(id);
    const kids = flowing(id).map((c) => ({ id: c, branch: branch(c) }));
    // What the user put somewhere is laid out from there, on its own.
    for (const c of visibleChildren(id)) if (nodes.get(c)?.pos) branch(c);
    let top = piece(-s.w / 2, -s.h / 2, s.w / 2, -s.h / 2);
    let bottom = piece(-s.w / 2, s.h / 2, s.w / 2, s.h / 2);
    if (kids.length) {
      const stacked = stack(s, kids);
      const mid = settle(s, kids, stacked.ys);
      // The lines to the first child and to the last bound the fan of lines between them.
      for (const k of [kids[0], kids[kids.length - 1]]) {
        const line = piece(s.w / 2, 0, s.w / 2 + H_GAP, rel.get(k.id)!.y);
        top = joined(top, line, false);
        bottom = joined(bottom, line, true);
      }
      top = joined(top, moved(stacked.top, 0, -mid), false);
      bottom = joined(bottom, moved(stacked.bottom, 0, -mid), true);
    }
    const b = { top, bottom, above: -reach(top, false), below: reach(bottom, true) };
    branches.set(id, b);
    return b;
  };

  // Around the element in view: what is already on either side, placed by
  // hand, is counted, and the rest is divided so that the sides come out
  // even with it counted; the first in order to the right.
  const root = tree.root;
  const rs = size(root);
  const occupied = { left: 0, right: 0 };
  const flow: { id: string; branch: Branch }[] = [];
  for (const c of visibleChildren(root)) {
    const pos = nodes.get(c)?.pos;
    const b = branch(c);
    if (pos) occupied[pos.x < 0 ? 'left' : 'right'] += b.above + b.below + V_GAP;
    else flow.push({ id: c, branch: b });
  }
  const split = balance(
    flow.map((k) => k.branch.above + k.branch.below),
    occupied.right,
    occupied.left,
  );
  for (const [kids, side] of [
    [flow.slice(0, split), 'right'],
    [flow.slice(split), 'left'],
  ] as const) {
    if (!kids.length) continue;
    settle(rs, kids, stack(rs, kids).ys);
    for (const k of kids) sideOf.set(k.id, side);
  }

  const place = (
    id: string,
    x: number,
    y: number,
    side: Side,
    depth: number,
    parent: string | null,
  ) => {
    const s = size(id);
    const node = nodes.get(id);
    placed.set(id, {
      id,
      x,
      y,
      w: s.w,
      h: s.h,
      side,
      depth,
      parent,
      hidden: node?.collapsed && id !== tree.root ? countUnder(id) : 0,
      pinned: !!node?.pos && parent !== null,
    });
    order.push(id);

    for (const c of visibleChildren(id)) {
      const pos = nodes.get(c)?.pos;
      const at = held.get(c);
      const r = rel.get(c);
      if (at) {
        // Held where the pointer is; its room in the flow, where it flows, kept for it.
        place(c, at.x, at.y, at.x < x ? 'left' : 'right', depth + 1, id);
      } else if (pos) {
        // Placed by the user: the branch grows away from its parent.
        place(
          c,
          x + pos.x,
          y + pos.y,
          pos.x < 0 ? 'left' : pos.x > 0 ? 'right' : side,
          depth + 1,
          id,
        );
      } else if (r) {
        const to = sideOf.get(c) ?? side;
        place(c, to === 'right' ? x + r.x : x - r.x, y + r.y, to, depth + 1, id);
      }
    }
  };

  // The element in view stands at the origin, whatever its place under its
  // own parent, and is not moved by being held.
  place(root, 0, 0, 'right', 0, null);

  const bounds = { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity };
  for (const p of placed.values()) {
    bounds.left = Math.min(bounds.left, p.x - p.w / 2);
    bounds.right = Math.max(bounds.right, p.x + p.w / 2);
    bounds.top = Math.min(bounds.top, p.y - p.h / 2);
    bounds.bottom = Math.max(bounds.bottom, p.y + p.h / 2);
  }
  if (!placed.size) Object.assign(bounds, { left: 0, top: 0, right: 0, bottom: 0 });
  return { placed, order, bounds };
}

/**
 * How many of the branches, from the first, go to the right of the element
 * in view, the rest going to the left, so that the two sides come closest to
 * equal height; `right` and `left` are what the sides hold already, of
 * branches placed by hand. Nothing held, and a single branch goes to the right.
 */
export function balance(heights: number[], right = 0, left = 0): number {
  if (!heights.length) return 0;
  if (heights.length === 1 && !right && !left) return 1;
  const total = heights.reduce((a, b) => a + b + V_GAP, 0);
  let best = 0;
  let bestDiff = Math.abs(right - (left + total));
  let first = 0;
  for (let i = 1; i <= heights.length; i++) {
    first += heights[i - 1] + V_GAP;
    const diff = Math.abs(right + first - (left + total - first));
    if (diff <= bestDiff + 0.5) {
      bestDiff = diff;
      best = i;
    }
  }
  return best;
}

export interface Point {
  x: number;
  y: number;
}

/** The ends of the line from a parent to a child: from the side of the one to the side of the other. */
export function hierarchyLine(parent: Placed, child: Placed): [Point, Point] {
  const gapRight = child.x - child.w / 2 - (parent.x + parent.w / 2);
  const gapLeft = parent.x - parent.w / 2 - (child.x + child.w / 2);
  if (gapRight >= 8) {
    return [
      { x: parent.x + parent.w / 2, y: parent.y },
      { x: child.x - child.w / 2, y: child.y },
    ];
  }
  if (gapLeft >= 8) {
    return [
      { x: parent.x - parent.w / 2, y: parent.y },
      { x: child.x + child.w / 2, y: child.y },
    ];
  }
  // One above the other.
  if (child.y > parent.y) {
    return [
      { x: parent.x, y: parent.y + parent.h / 2 },
      { x: child.x, y: child.y - child.h / 2 },
    ];
  }
  return [
    { x: parent.x, y: parent.y - parent.h / 2 },
    { x: child.x, y: child.y + child.h / 2 },
  ];
}

/** Where the line from the centre of a box towards a point leaves the box. */
export function edgePoint(box: Placed, towards: Point, margin = 3): Point {
  const dx = towards.x - box.x;
  const dy = towards.y - box.y;
  if (dx === 0 && dy === 0) return { x: box.x, y: box.y };
  const hw = box.w / 2 + margin;
  const hh = box.h / 2 + margin;
  const scale = Math.min(
    dx !== 0 ? hw / Math.abs(dx) : Infinity,
    dy !== 0 ? hh / Math.abs(dy) : Infinity,
  );
  return { x: box.x + dx * scale, y: box.y + dy * scale };
}

export interface Curve {
  path: string;
  /** The middle of the curve, where its label goes. */
  middle: Point;
}

/**
 * The curve of an association between two elements. It bows to one side, by
 * an amount that grows with the distance, so that it is never mistaken for a
 * line of the hierarchy.
 */
export function associationCurve(a: Placed, b: Placed): Curve {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const distance = Math.hypot(dx, dy) || 1;
  const bow = Math.min(56, 18 + distance * 0.1);
  // Perpendicular to the line between the centres; always to the same side
  // for the same pair, whichever end is named first.
  const flip = a.id < b.id ? 1 : -1;
  const nx = (-dy / distance) * flip;
  const ny = (dx / distance) * flip;
  const control = { x: (a.x + b.x) / 2 + nx * bow * 2, y: (a.y + b.y) / 2 + ny * bow * 2 };
  const start = edgePoint(a, control);
  const end = edgePoint(b, control);
  const middle = {
    x: 0.25 * start.x + 0.5 * control.x + 0.25 * end.x,
    y: 0.25 * start.y + 0.5 * control.y + 0.25 * end.y,
  };
  const r = (n: number) => Math.round(n * 10) / 10;
  return {
    path: `M ${r(start.x)} ${r(start.y)} Q ${r(control.x)} ${r(control.y)} ${r(end.x)} ${r(end.y)}`,
    middle,
  };
}

/** The element nearest in a direction, for moving the selection with the arrow keys. */
export function neighbour(
  layout: Layout,
  from: string,
  direction: 'left' | 'right' | 'up' | 'down',
): string | null {
  const at = layout.placed.get(from);
  if (!at) return null;
  let best: string | null = null;
  let bestScore = Infinity;
  for (const p of layout.placed.values()) {
    if (p.id === from) continue;
    const dx = p.x - at.x;
    const dy = p.y - at.y;
    let along: number;
    let across: number;
    switch (direction) {
      case 'right':
        along = p.x - p.w / 2 - (at.x + at.w / 2);
        across = Math.abs(dy);
        break;
      case 'left':
        along = at.x - at.w / 2 - (p.x + p.w / 2);
        across = Math.abs(dy);
        break;
      case 'down':
        along = dy;
        across = Math.abs(dx);
        break;
      default:
        along = -dy;
        across = Math.abs(dx);
    }
    if (along <= 0) continue;
    // Prefer what lies straight ahead; kin before strangers at equal distance.
    const kin = p.parent === from || at.parent === p.id || p.parent === at.parent ? 0.8 : 1;
    const score = (along + across * 2.5) * kin;
    if (score < bestScore) {
      bestScore = score;
      best = p.id;
    }
  }
  return best;
}
