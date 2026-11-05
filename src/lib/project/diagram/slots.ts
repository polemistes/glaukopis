/**
 * Where an element dragged over the map would go in the order: the slots
 * between the elements that flow beside a parent (record 0083).
 *
 * The elements that flow beside a parent stand in a column on its side, in
 * the order of the tree. Between two of them, over the first and under the
 * last there is a slot: an element dropped there takes that place in the
 * order under that parent and flows with the rest. What the user placed by
 * hand stands in no column, nor does the single element that stands under
 * the element in view (the chain of record 0082): a column is of elements
 * beside their parent. Dropped on the background anywhere else, an element
 * is placed by hand and keeps its order.
 */

import type { Tree } from '../model/tree';
import type { Position, Side } from '../model/types';
import type { Layout, Placed } from './layout';

export interface Slot {
  parent: string;
  /** The place among the parent's children, counted as `Project.move` counts it: in the list as it is. */
  index: number;
  /** The element over the slot and the one under it, in the column; nothing at an end. */
  above: string | null;
  below: string | null;
  side: Side;
  /** The line across the column, from `x0` to `x1` at `y`. */
  x0: number;
  x1: number;
  y: number;
}

/** How far beside the boxes of a column a point still counts as over it. */
export const SLOT_REACH = 12;
/** How far over the first of a column and under the last a point still counts as over it. */
export const SLOT_END = 36;
/** How far from the first box the line over it stands, and from the last the line under it. */
const END_LINE = 6;

/**
 * The columns of a layout: the elements that flow beside each parent, on
 * each side, from the top down. Those in `except`, and the children of
 * those, are left out: they are what is being dragged.
 */
export function columns(
  lay: Layout,
  except: ReadonlySet<string> = new Set(),
): Map<string, Placed[]> {
  const out = new Map<string, Placed[]>();
  for (const p of lay.placed.values()) {
    if (p.pinned || p.parent === null || except.has(p.id) || except.has(p.parent)) continue;
    const parent = lay.placed.get(p.parent);
    // Beside its parent, not under it.
    if (!parent || Math.abs(p.x - parent.x) <= parent.w / 2) continue;
    const key = `${p.parent}|${p.side}`;
    let list = out.get(key);
    if (!list) out.set(key, (list = []));
    list.push(p);
  }
  for (const list of out.values()) list.sort((a, b) => a.y - b.y);
  return out;
}

/**
 * The slot at a point of the canvas, if the point is over a column and
 * not over one of its boxes; `allowed` says which parents may take what is
 * dragged. Where two columns reach the point, the nearer takes it.
 */
export function slotAt(
  lay: Layout,
  tree: Tree,
  world: Position,
  except: ReadonlySet<string> = new Set(),
  allowed: (parent: string) => boolean = () => true,
): Slot | null {
  let best: { list: Placed[]; away: number } | null = null;
  for (const list of columns(lay, except).values()) {
    if (!allowed(list[0].parent!)) continue;
    const left = Math.min(...list.map((p) => p.x - p.w / 2));
    const right = Math.max(...list.map((p) => p.x + p.w / 2));
    if (world.x < left - SLOT_REACH || world.x > right + SLOT_REACH) continue;
    const first = list[0];
    const last = list[list.length - 1];
    const top = first.y - first.h / 2;
    const bottom = last.y + last.h / 2;
    const away = world.y < top ? top - world.y : world.y > bottom ? world.y - bottom : 0;
    if (away > SLOT_END) continue;
    if (!best || away < best.away) best = { list, away };
  }
  if (!best) return null;
  const { list } = best;
  const parent = list[0].parent!;
  const i = list.findIndex((p) => world.y < p.y);
  const above = i === -1 ? list[list.length - 1] : i > 0 ? list[i - 1] : null;
  const below = i === -1 ? null : list[i];
  const siblings = tree.children.get(parent) ?? [];
  const index = above ? siblings.indexOf(above.id) + 1 : siblings.indexOf(below!.id);
  const y =
    above && below
      ? (above.y + above.h / 2 + (below.y - below.h / 2)) / 2
      : above
        ? above.y + above.h / 2 + END_LINE
        : below!.y - below!.h / 2 - END_LINE;
  return {
    parent,
    index,
    above: above?.id ?? null,
    below: below?.id ?? null,
    side: list[0].side,
    x0: Math.min(...list.map((p) => p.x - p.w / 2)),
    x1: Math.max(...list.map((p) => p.x + p.w / 2)),
    y,
  };
}
