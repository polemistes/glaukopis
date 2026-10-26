/**
 * Where the pages of a file stand in its side, and which to fetch and keep:
 * plain functions, tested on their own.
 */

/** The room around the pages and between them, in pixels. */
export const AROUND = { top: 16, side: 18, between: 12 };
/** At most so many pages are kept drawn: those nearest to what is looked at. */
export const KEPT = 40;
/** So many pages before and after those in view are fetched with them. */
export const BESIDE = 2;
/** Widths are asked for in steps, so that a zoom changed a little is served by the pages drawn. */
export const WIDTH_STEP = 200;
/** The widest a page is drawn, in dots. */
export const WIDEST = 4000;

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
  const tops: number[] = [];
  const widths: number[] = [];
  const heights: number[] = [];
  let y = AROUND.top;
  for (const [w, h] of sizes) {
    const width = Math.max(1, widthOf(w));
    const height = Math.max(1, (width * h) / Math.max(w, 1));
    tops.push(y);
    widths.push(width);
    heights.push(height);
    y += height + AROUND.between;
  }
  return { tops, widths, heights, total: y - AROUND.between + AROUND.top };
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

/** The width a page is asked to be drawn at: its shown width in dots, up to the next step. */
export function widthWanted(shown: number, ratio = 1): number {
  const dots = Math.ceil(shown * Math.max(ratio, 1));
  return Math.min(WIDEST, Math.ceil(dots / WIDTH_STEP) * WIDTH_STEP);
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
