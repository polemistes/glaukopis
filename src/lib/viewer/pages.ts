/**
 * Where the pages of a file stand in its side, and which to fetch and keep:
 * plain functions, tested on their own.
 */

/** The room around the pages and between them, in pixels. */
export const AROUND = { top: 16, side: 18, between: 12 };
/** At most so many pages are kept drawn: those nearest to what is looked at. */
export const KEPT = 40;
/** So many pages before and after those in view are fetched with them, and stand in the document. */
export const BESIDE = 2;
/** At most so many pages are asked of the core at once (ADR 0072). */
export const IN_FLIGHT = 4;
/** The widest a page is drawn, in dots. */
export const WIDEST = 4000;
/** A picture wider than this many times the width wanted is drawn again, narrower. */
export const TOO_WIDE = 1.25;

/** The place of each page in the column, and the height of all, in pixels. */
export interface Placed {
  tops: number[];
  widths: number[];
  heights: number[];
  total: number;
}

/**
 * The pages one under another: each as wide as `widthOf` says, as high as its
 * size makes it, with the room around and between them.
 */
export function placePages(sizes: [number, number][], widthOf: (w: number) => number): Placed {
  // Whole pixels across, so that a picture drawn as wide is painted dot for dot.
  const tops: number[] = [];
  const widths: number[] = [];
  const heights: number[] = [];
  let y = AROUND.top;
  for (const [w, h] of sizes) {
    const width = Math.max(1, Math.round(widthOf(w)));
    const height = Math.max(1, (width * h) / Math.max(w, 1));
    tops.push(y);
    widths.push(width);
    heights.push(height);
    y += height + AROUND.between;
  }
  return { tops, widths, heights, total: y - AROUND.between + AROUND.top };
}

/** The width of the column of pages: the widest, with the room at its sides. */
export function columnWidth(placed: Placed): number {
  return Math.max(0, ...placed.widths) + 2 * AROUND.side;
}

/**
 * Where the left edge of a page stands, in pixels from the left of what
 * the side scrolls: the column in the middle of a side wider than it, and
 * at the left of one narrower; each page in the middle of the column.
 */
export function pageLeft(placed: Placed, i: number, room: number): number {
  return (Math.max(columnWidth(placed), room) - (placed.widths[i] ?? 0)) / 2;
}

/** The page, counted from one, that stands at a height in the column: the last whose top is above it. */
export function pageAt(placed: Placed, y: number): number {
  const { tops } = placed;
  if (!tops.length) return 1;
  let lo = 0;
  let hi = tops.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (tops[mid] <= y) lo = mid;
    else hi = mid - 1;
  }
  return lo + 1;
}

/** A place in a file: a page, counted from one, and how far down it, from 0 at its top to 1 at its foot. */
export interface Place {
  page: number;
  at: number;
}

/** The place at a height of the column: the page there, and how far down it. */
export function placeAt(placed: Placed, y: number): Place {
  const page = pageAt(placed, y);
  const i = page - 1;
  const top = placed.tops[i] ?? 0;
  const at = (y - top) / Math.max(placed.heights[i] ?? 1, 1);
  return { page, at: Math.min(1, Math.max(0, at)) };
}

/** The height of the column at which a place stands. */
export function heightOf(placed: Placed, place: Place): number {
  if (!placed.tops.length) return 0;
  const i = Math.min(Math.max(Math.round(place.page), 1), placed.tops.length) - 1;
  return placed.tops[i] + Math.min(1, Math.max(0, place.at)) * placed.heights[i];
}

/** The pages, counted from one, seen between two heights, with those beside them. */
export function pagesSeen(placed: Placed, from: number, to: number, beside = BESIDE): number[] {
  const count = placed.tops.length;
  if (!count) return [];
  const first = Math.max(1, pageAt(placed, from) - beside);
  const last = Math.min(count, pageAt(placed, to) + beside);
  const out: number[] = [];
  for (let n = first; n <= last; n++) out.push(n);
  return out;
}

/**
 * The width a page is asked to be drawn at: exactly its shown width in the
 * screen's own dots, so that its picture is painted as it is, not scaled
 * at every paint (ADR 0072).
 */
export function widthWanted(shown: number, ratio = 1): number {
  return Math.min(WIDEST, Math.max(1, Math.ceil(shown * Math.max(ratio, 1))));
}

/**
 * Whether a page drawn at `has` dots wide, or not yet drawn, is to be drawn
 * at `want`: where it is narrower, or much wider. One that could not be
 * drawn (`pictured` false) is not asked for again at a width it was asked at.
 */
export function lacking(
  has: { width: number; pictured: boolean } | undefined,
  want: number,
): boolean {
  if (!has) return true;
  if (!has.pictured) return has.width < want;
  return has.width < want || has.width > want * TOO_WIDE;
}

/** The pages to fetch, of those `seen`: those that `lack`, nearest to the page `middle` first. */
export function wanted(seen: number[], middle: number, lack: (n: number) => boolean): number[] {
  return seen.filter(lack).sort((a, b) => Math.abs(a - middle) - Math.abs(b - middle) || a - b);
}

/** Of the pages kept, those to let go: the furthest from the page in view, beyond `most`. */
export function toLetGo(kept: number[], at: number, most = KEPT): number[] {
  if (kept.length <= most) return [];
  return [...kept].sort((a, b) => Math.abs(b - at) - Math.abs(a - at)).slice(0, kept.length - most);
}

/**
 * A page asked for by what is written in the field: its number in print
 * where a page has it, else its count. Nothing where neither is a page.
 */
export function pageAsked(said: string, labels: string[]): number | null {
  const s = said.trim();
  if (!s) return null;
  const printed = labels.findIndex((l) => l.toLowerCase() === s.toLowerCase());
  if (printed >= 0) return printed + 1;
  const n = Number(s);
  return Number.isInteger(n) && n >= 1 && n <= labels.length ? n : null;
}
