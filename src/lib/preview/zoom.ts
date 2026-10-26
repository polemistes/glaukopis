/**
 * The zoom of pages: a factor of their size, a hundred percent being a page
 * as large on the screen as on paper, or none, for pages fitted to their
 * pane. The typesetting pane's is the window's, kept with its arrangement,
 * and goes by tenths within a narrow range; a file in a side (ADR 0069)
 * goes by rungs of a ladder within a wide one.
 */

/** Where a zoom may go, and how finely it is kept: so many parts to one. */
export interface Range {
  least: number;
  most: number;
  grain: number;
}

/** The typesetting pane: between half and three times the page, to a hundredth. */
export const PANE: Range = { least: 0.5, most: 3, grain: 100 };
/** A file in a side: from a twentieth to eight times, to a thousandth, so that small zooms still step. */
export const FILE: Range = { least: 0.05, most: 8, grain: 1000 };

/** The steps the menu of the typesetting pane offers, beside fitting the width. */
export const ZOOMS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;
/** The steps the menu of a file side offers, each twice the one before. */
export const FILE_ZOOMS = [0.125, 0.25, 0.5, 1, 2, 4] as const;
/** How much one key zooms the typesetting pane. */
export const STEP = 0.1;
/** So many rungs of the file's ladder to a doubling: each about twelve percent more than the one below. */
export const RUNGS = 6;
/** How much a pixel of the wheel zooms a file: a notch of forty pixels is near a rung. */
export const WHEEL = 0.0025;
/** Pixels to a point: a page at a hundred percent is as large as on paper, the screen having 96 pixels to an inch. */
export const PX_PER_PT = 96 / 72;

/** A factor brought within the least and the most, to the grain. */
export function clampZoom(factor: number, range: Range = PANE): number {
  return Math.round(within(factor, range) * range.grain) / range.grain;
}

/** A factor brought within the least and the most, as fine as it is. */
export function within(factor: number, range: Range): number {
  return Math.min(range.most, Math.max(range.least, factor));
}

/**
 * The factor so many steps from the one given, up or down: to the next
 * tenth, so that a page fitted at 87 % goes to 90 % and to 80 %, not to
 * 97 % and 77 %.
 */
export function stepped(from: number, steps: number): number {
  const tenths = from / STEP;
  const near = Math.round(tenths);
  // Already on a step: one step on. Between two: to the one in the direction asked.
  const base =
    Math.abs(tenths - near) < 0.01 ? near : steps > 0 ? Math.floor(tenths) : Math.ceil(tenths);
  return clampZoom((base + steps) * STEP);
}

/**
 * The factor so many rungs from the one given on the ladder of a file,
 * which has a hundred percent on it and six rungs to each doubling: from
 * between two rungs, to the one in the direction asked.
 */
export function rung(from: number, steps: number, range: Range = FILE): number {
  const r = Math.log2(Math.max(from, 1e-6)) * RUNGS;
  const near = Math.round(r);
  const base = Math.abs(r - near) < 0.02 ? near : steps > 0 ? Math.floor(r) : Math.ceil(r);
  return clampZoom(2 ** ((base + steps) / RUNGS), range);
}

/**
 * The factor after a turn of the wheel over a file: by so much for each
 * pixel, a mouse's notch near a rung and the small turns of a touchpad as
 * small as they are; one turn never more than a quarter. Lines and pages
 * are taken as pixels. Not rounded, so that the least zooms still move.
 */
export function wheeled(from: number, deltaY: number, deltaMode = 0, range: Range = FILE): number {
  const px = deltaMode === 1 ? deltaY * 40 : deltaMode === 2 ? deltaY * 800 : deltaY;
  const d = Math.max(-100, Math.min(100, px));
  return within(from * Math.exp(-d * WHEEL), range);
}

/**
 * A zoom asked for by what is written in a field, in percent: "150", "150 %",
 * "12,5"; brought within the range. Nothing where it is not a number above nought.
 */
export function zoomAsked(said: string, range: Range = FILE): number | null {
  const n = Number(said.replace('%', '').replace(',', '.').trim());
  return Number.isFinite(n) && n > 0 ? clampZoom(n / 100, range) : null;
}

/** A kept zoom, read with care: a factor within bounds, or none. */
export function keptZoom(kept: unknown, range: Range = PANE): number | null {
  return typeof kept === 'number' && Number.isFinite(kept) && kept > 0
    ? clampZoom(kept, range)
    : null;
}

/** A factor as a whole percentage. */
export const percent = (factor: number) => Math.round(factor * 100);
