/**
 * The pages selected in the workbench of a reading, as a list of their
 * numbers counted from one, in order: what the strip's pointer and keys make
 * of it, and how it is said. An empty list is every page; a long book
 * selected whole is the empty list, not five hundred numbers. Where the page
 * in view goes by the keys is `moved` of `strip.ts`.
 */

import type { OutlinePart } from '$lib/api/ocr';
import type { Args } from '$lib/i18n';
import { stretchesOf } from './how';
import type { Run } from './plan';

/** The selection with a page added, or taken away where it was in it. */
export function toggled(selection: number[], page: number): number[] {
  if (selection.includes(page)) return selection.filter((p) => p !== page);
  return [...selection, page].sort((a, b) => a - b);
}

/** The pages from one to the other, both ends in, in order. */
export function rangeBetween(anchor: number, page: number): number[] {
  const from = Math.min(anchor, page);
  const to = Math.max(anchor, page);
  return Array.from({ length: to - from + 1 }, (_, i) => from + i);
}

/** The pages of a run. */
export function pagesOfRun(run: Pick<Run, 'from' | 'to'>): number[] {
  return rangeBetween(run.from, run.to);
}

/**
 * The pages of a part of the outline, of a file of `pages` pages: from the
 * part's page to the page before the next part's, or to the end. The next
 * part is the nearest that begins after it, so that parts out of order, or
 * two on one page, still hold their pages. None, where the part leads past
 * the end.
 */
export function pagesOfPart(outline: OutlinePart[], index: number, pages: number): number[] {
  const part = outline[index];
  if (!part || part.page < 1 || part.page > pages) return [];
  let next = pages + 1;
  for (const other of outline) if (other.page > part.page && other.page < next) next = other.page;
  return rangeBetween(part.page, next - 1);
}

/**
 * The selection said, for the words that hold for it: *page 280*, *pages
 * 3–5, 9*. Nothing where it is empty or holds every page of the `pages`,
 * where the caller says *all 559 pages*.
 */
export function selectionSaid(
  selection: number[],
  pages: number,
  t: (id: string, args?: Args) => string,
): string {
  const chosen = [...new Set(selection)]
    .filter((p) => Number.isInteger(p) && p >= 1 && p <= pages)
    .sort((a, b) => a - b);
  if (!chosen.length || chosen.length === pages) return '';
  return t('ocr-pages-selection', { count: chosen.length, pages: stretchesOf(chosen) });
}
