/**
 * The zoom of the pages of the typesetting pane: a factor of their size
 * as printed, a hundred percent being a page as large on the screen as on
 * paper, or none, for pages as wide as the pane. It is the window's, kept
 * with its arrangement.
 */

/** The steps the menu of the zoom offers, beside fitting the width. */
export const ZOOMS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;
/** The least and the most the pages are zoomed to. */
export const LEAST = 0.5;
export const MOST = 3;
/** How much one turn of the wheel, or one key, zooms. */
export const STEP = 0.1;
/** Pixels to a point: a page at a hundred percent is as large as on paper, the screen having 96 pixels to an inch. */
export const PX_PER_PT = 96 / 72;

/** A factor brought within the least and the most, to a hundredth. */
export function clampZoom(factor: number): number {
  return Math.round(Math.min(MOST, Math.max(LEAST, factor)) * 100) / 100;
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

/** A kept zoom, read with care: a factor within bounds, or none. */
export function keptZoom(kept: unknown): number | null {
  return typeof kept === 'number' && Number.isFinite(kept) && kept > 0 ? clampZoom(kept) : null;
}

/** A factor as a whole percentage. */
export const percent = (factor: number) => Math.round(factor * 100);
