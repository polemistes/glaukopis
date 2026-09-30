/**
 * What is drawn between the elements of a diagram: the line from each to
 * what it stands under, and the curve of each association, between what is
 * to be seen of its ends.
 */

import type { Tree } from '../model/tree';
import type { LinkRecord, Position } from '../model/types';
import { associationCurve, edgePoint, hierarchyLine, type Layout, type Placed } from './layout';

export interface Line {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  /** Of an element that is being dragged away. */
  faint: boolean;
}

export interface DrawnAssociation {
  id: string;
  path: string;
  middle: Position;
  label: string;
  /** Where an end is folded away, and the curve goes to what it is folded under. */
  faint: boolean;
}

/** The line from each element to what it stands under; faint for those that are lifted. */
export function linesOf(lay: Layout, lifted: Set<string>): Line[] {
  const out: Line[] = [];
  for (const p of lay.placed.values()) {
    if (!p.parent) continue;
    const parent = lay.placed.get(p.parent);
    if (!parent) continue;
    const [a, b] = hierarchyLine(parent, p);
    out.push({ id: p.id, x1: a.x, y1: a.y, x2: b.x, y2: b.y, faint: lifted.has(p.id) });
  }
  return out;
}

/** The end of an association as it is seen: the element itself, or what it is folded under. */
export function visibleEnd(lay: Layout, tree: Tree, id: string): Placed | null {
  let at: string | null = id;
  while (at) {
    const p = lay.placed.get(at);
    if (p) return p;
    at = tree.parent.get(at) ?? null;
  }
  return null;
}

/** The associations of a map, as they are drawn. */
export function associationsOf(links: LinkRecord[], lay: Layout, tree: Tree): DrawnAssociation[] {
  const out: DrawnAssociation[] = [];
  for (const link of links) {
    const a = visibleEnd(lay, tree, link.from);
    const b = visibleEnd(lay, tree, link.to);
    if (!a || !b || a.id === b.id) continue;
    const c = associationCurve(a, b);
    out.push({
      id: link.id,
      path: c.path,
      middle: c.middle,
      label: link.label,
      faint: a.id !== link.from || b.id !== link.to,
    });
  }
  return out;
}

/** An association that is being drawn: to the element the pointer is over, or to the pointer. */
export function drawing(
  lay: Layout,
  linking: { from: string; x: number; y: number; over: string | null },
): string | null {
  const from = lay.placed.get(linking.from);
  if (!from) return null;
  const over = linking.over ? lay.placed.get(linking.over) : null;
  if (over) return associationCurve(from, over).path;
  const start = edgePoint(from, linking);
  return `M ${start.x} ${start.y} L ${linking.x} ${linking.y}`;
}
