/**
 * Where the elements of a map stand on the canvas.
 *
 * Elements are placed automatically, as a mind map: the centre in the middle,
 * its children to the right and to the left, each branch growing outwards with
 * its children stacked beside it. An element the user has moved keeps the
 * place it was given, relative to its parent, and its own branch is laid out
 * from there. Coordinates are those of the centre of each element.
 */

import type { Tree } from '../model/tree';
import type { NodeRecord, Position, Side } from '../model/types';

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

export const H_GAP = 64;
export const V_GAP = 16;
export const DEFAULT_SIZE: Size = { w: 120, h: 36 };

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

  const visibleChildren = (id: string): string[] =>
    nodes.get(id)?.collapsed ? [] : (tree.children.get(id) ?? []);

  const countUnder = (id: string): number => {
    let n = 0;
    for (const c of tree.children.get(id) ?? []) n += 1 + countUnder(c);
    return n;
  };

  // The height a branch takes when placed automatically.
  const heights = new Map<string, number>();
  const blockHeight = (id: string): number => {
    const known = heights.get(id);
    if (known !== undefined) return known;
    // What is held keeps its room in the flow, so that nothing else moves while it is dragged.
    const flowing = visibleChildren(id).filter((c) => !nodes.get(c)?.pos || held.has(c));
    let kids = 0;
    flowing.forEach((c, i) => {
      kids += blockHeight(c) + (i ? V_GAP : 0);
    });
    const h = Math.max(size(id).h, kids);
    heights.set(id, h);
    return h;
  };

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
      hidden: node?.collapsed ? countUnder(id) : 0,
      pinned: !!node?.pos && parent !== null,
    });
    order.push(id);

    const children = visibleChildren(id);
    if (!children.length) return;

    const flow = (list: string[], to: Side) => {
      let total = 0;
      list.forEach((c, i) => {
        total += blockHeight(c) + (i ? V_GAP : 0);
      });
      let top = y - total / 2;
      for (const c of list) {
        const block = blockHeight(c);
        const at = held.get(c);
        if (at) {
          // Held where the pointer is, its room in the flow kept for it.
          place(c, at.x, at.y, at.x < x ? 'left' : 'right', depth + 1, id);
        } else {
          const cs = size(c);
          const cx =
            to === 'right' ? x + s.w / 2 + H_GAP + cs.w / 2 : x - s.w / 2 - H_GAP - cs.w / 2;
          place(c, cx, top + block / 2, to, depth + 1, id);
        }
        top += block + V_GAP;
      }
    };

    const flowing: string[] = [];
    // What is already on either side, placed by hand or held: the rest is
    // divided so that the sides come out even with it counted.
    const occupied = { left: 0, right: 0 };
    for (const c of children) {
      const n = nodes.get(c);
      const at = held.get(c);
      if (at && n?.pos) {
        // Placed by the user, and held: where the pointer is, counted on the side it was placed.
        const to: Side = n.pos.x < 0 ? 'left' : n.pos.x > 0 ? 'right' : side;
        occupied[to] += blockHeight(c) + V_GAP;
        place(c, at.x, at.y, at.x < x ? 'left' : 'right', depth + 1, id);
      } else if (at) {
        // Held while it flows: it keeps its room in the flow, and is placed where the pointer is.
        flowing.push(c);
      } else if (n?.pos) {
        // Placed by the user: the branch grows away from its parent.
        const to: Side = n.pos.x < 0 ? 'left' : n.pos.x > 0 ? 'right' : side;
        occupied[to] += blockHeight(c) + V_GAP;
        place(c, x + n.pos.x, y + n.pos.y, to, depth + 1, id);
      } else {
        flowing.push(c);
      }
    }
    if (id === tree.root) {
      // Around the centre: the first in order to the right, the rest to the
      // left, divided where the two sides come closest to equal height.
      const split = balance(flowing.map(blockHeight), occupied.right, occupied.left);
      flow(flowing.slice(0, split), 'right');
      flow(flowing.slice(split), 'left');
    } else {
      flow(flowing, side);
    }
  };

  const rootPos = (tree.root && (held.get(tree.root) ?? nodes.get(tree.root)?.pos)) || {
    x: 0,
    y: 0,
  };
  if (tree.root) place(tree.root, rootPos.x, rootPos.y, 'right', 0, null);
  for (const id of tree.loose) {
    const pos = held.get(id) ?? nodes.get(id)?.pos ?? { x: 0, y: 0 };
    place(id, pos.x, pos.y, pos.x < rootPos.x ? 'left' : 'right', 0, null);
  }

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

/** Where to divide a list of heights so that the two parts are closest to equal. The first part is never the smaller by count when heights are equal. */
/**
 * How many of the branches, from the first, go to the right of the centre,
 * the rest going to the left, so that the two sides come closest to equal
 * height; `right` and `left` are what the sides hold already, of branches
 * placed by hand. Nothing held, and a single branch goes to the right.
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
