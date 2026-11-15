/**
 * The geometry of the surface of a box (`docs/plans/the-notebook.md`,
 * stage 2): the box of each card, by its middle and its size, as the
 * drawing of associations wants it; which cards the view shows; what a band
 * touches; the card nearest in a direction; where files dropped lie. A
 * card's place is its top left corner, in pixels of the surface.
 */

import type { Bounds, View } from '$lib/ui/camera';
import { CARD_GAP } from '../model/places';
import type { Point } from '../model/types';

/** The height a card is reckoned at before it has been measured. */
export const USUAL_HEIGHT = 120;
/** How far round the view cards are drawn too, in pixels of the screen. */
export const AROUND = 240;
/**
 * Where a note let go on the ground lies, from the point it was let go at:
 * its card's top left corner a little up and to the left, so that the
 * pointer is over its head.
 */
export const LET_GO = { x: 24, y: 14 };

/** A card as a box of the surface: its middle, its width and its height. */
export interface CardBox {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export type Direction = 'left' | 'right' | 'up' | 'down';

/** The box of a card at a place, as wide as given and as high as measured (else the usual height). */
export function cardBox(id: string, at: Point, width: number, height?: number): CardBox {
  const h = height && height > 0 ? height : USUAL_HEIGHT;
  return { id, x: at.x + width / 2, y: at.y + h / 2, w: width, h };
}

/** The edges of a box. */
function edges(b: CardBox): Bounds {
  return { left: b.x - b.w / 2, top: b.y - b.h / 2, right: b.x + b.w / 2, bottom: b.y + b.h / 2 };
}

/** Whether a box and an area of the surface overlap, or touch. */
function meets(b: CardBox, area: Bounds): boolean {
  const e = edges(b);
  return (
    e.right >= area.left && e.left <= area.right && e.bottom >= area.top && e.top <= area.bottom
  );
}

/** What of the surface a view shows in a viewport of a size, and `around` pixels of the screen round it. */
export function shownArea(view: View, width: number, height: number, around = AROUND): Bounds {
  return {
    left: (-view.x - around) / view.k,
    top: (-view.y - around) / view.k,
    right: (width - view.x + around) / view.k,
    bottom: (height - view.y + around) / view.k,
  };
}

/** The ids of the cards the view shows, and those a little round it, in the order given. */
export function cardsInView(
  boxes: CardBox[],
  view: View,
  width: number,
  height: number,
  around = AROUND,
): string[] {
  const area = shownArea(view, width, height, around);
  return boxes.filter((b) => meets(b, area)).map((b) => b.id);
}

/** The ids of the cards a band touches, in the order given. */
export function touching(band: Bounds, boxes: CardBox[]): string[] {
  return boxes.filter((b) => meets(b, band)).map((b) => b.id);
}

/** The band between two points, whichever way it was drawn. */
export function bandOf(a: Point, b: Point): Bounds {
  return {
    left: Math.min(a.x, b.x),
    top: Math.min(a.y, b.y),
    right: Math.max(a.x, b.x),
    bottom: Math.max(a.y, b.y),
  };
}

/** The edges of all the cards; none where there are none. */
export function boundsOf(boxes: CardBox[]): Bounds | null {
  if (!boxes.length) return null;
  const all = boxes.map(edges);
  return {
    left: Math.min(...all.map((e) => e.left)),
    top: Math.min(...all.map((e) => e.top)),
    right: Math.max(...all.map((e) => e.right)),
    bottom: Math.max(...all.map((e) => e.bottom)),
  };
}

/** The card at a point of the surface, the last drawn where cards lie over one another; none but these. */
export function cardAt(point: Point, boxes: CardBox[], except?: string): string | null {
  for (let i = boxes.length - 1; i >= 0; i--) {
    const b = boxes[i];
    if (b.id === except) continue;
    const e = edges(b);
    if (point.x >= e.left && point.x <= e.right && point.y >= e.top && point.y <= e.bottom)
      return b.id;
  }
  return null;
}

/**
 * The card nearest a card in a direction, for the arrows: of those that
 * begin beyond it that way, the nearest, what lies straight ahead before
 * what lies to the side.
 */
export function nearest(boxes: CardBox[], from: CardBox, direction: Direction): string | null {
  let best: string | null = null;
  let bestScore = Infinity;
  const f = edges(from);
  for (const b of boxes) {
    if (b.id === from.id) continue;
    const e = edges(b);
    let along: number;
    let across: number;
    switch (direction) {
      case 'right':
        along = b.x - from.x;
        across = Math.abs(b.y - from.y);
        if (e.left < f.left + 1) continue;
        break;
      case 'left':
        along = from.x - b.x;
        across = Math.abs(b.y - from.y);
        if (e.right > f.right - 1) continue;
        break;
      case 'down':
        along = b.y - from.y;
        across = Math.abs(b.x - from.x);
        if (e.top < f.top + 1) continue;
        break;
      default:
        along = from.y - b.y;
        across = Math.abs(b.x - from.x);
        if (e.bottom > f.bottom - 1) continue;
    }
    if (along <= 0) continue;
    const score = along + across * 2.5;
    if (score < bestScore) {
      bestScore = score;
      best = b.id;
    }
  }
  return best;
}

/** The card nearest a point, for the arrows where nothing is selected. */
export function nearestTo(point: Point, boxes: CardBox[]): string | null {
  let best: string | null = null;
  let bestDistance = Infinity;
  for (const b of boxes) {
    const d = Math.hypot(b.x - point.x, b.y - point.y);
    if (d < bestDistance) {
      bestDistance = d;
      best = b.id;
    }
  }
  return best;
}

/**
 * Where notes made of files dropped at a point lie: the first with its top
 * left corner there, each of the others under the one before, as high as
 * a card is reckoned before it is measured.
 */
export function stacked(at: Point, count: number, height = USUAL_HEIGHT): Point[] {
  return Array.from({ length: count }, (_, i) => ({
    x: Math.round(at.x),
    y: Math.round(at.y + i * (height + CARD_GAP)),
  }));
}

/** Where a note let go at a point of the surface lies: its top left corner. */
export function letGoAt(point: Point): Point {
  return { x: Math.round(point.x - LET_GO.x), y: Math.round(point.y - LET_GO.y) };
}
