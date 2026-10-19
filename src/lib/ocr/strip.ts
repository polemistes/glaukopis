/**
 * The arithmetic of the strip of pages (`PageStrip.svelte`): which pages are
 * drawn next, where the page in view goes by the keys, what the band over a
 * run of pages says, and where the parts of the outline stand under the
 * pages. The dots to the inch a page is drawn at, to be as wide as asked,
 * are the core's (`drawing::small_size`).
 */

import type { OutlinePart } from '$lib/api/ocr';
import type { Args } from '$lib/i18n';
import type { PageSettings } from './plan';

/** How many pages are drawn at a time. */
export const BATCH = 40;

/**
 * How many dots wide each page is drawn: shown at fewer pixels than that, so
 * that it is sharp on a fine screen as well.
 */
export const WIDTH = 120;

/** A run of pages to draw: `count` of them from `from`, counted from nought. */
export interface Batch {
  from: number;
  count: number;
}

/**
 * The next pages to draw, where the first `shown` of `total` are drawn or
 * asked for: as many as a batch, or as are left. Nothing, where all are.
 */
export function nextBatch(shown: number, total: number, size = BATCH): Batch | null {
  const from = Math.max(0, Math.floor(shown));
  if (size < 1 || from >= total) return null;
  return { from, count: Math.min(size, total - from) };
}

/**
 * The pages to draw so that page `at` (counted from nought), which has come
 * into sight, is drawn: from it on, as many as a batch, up to the first that
 * is drawn or asked for already (`asked`), or the last there is. Nothing,
 * where it is drawn or asked for itself, or is not a page of the `total`.
 */
export function batchAt(
  at: number,
  total: number,
  asked: (index: number) => boolean,
  size = BATCH,
): Batch | null {
  const next = nextBatch(at, total, size);
  if (!next || at < 0 || asked(next.from)) return null;
  let count = 1;
  while (count < next.count && !asked(next.from + count)) count++;
  return { from: next.from, count };
}

/**
 * The first page (counted from nought) of those `near` in sight that is not
 * drawn or asked for (`asked`); nothing, where all of them are.
 */
export function firstWanted(
  near: Iterable<number>,
  asked: (index: number) => boolean,
): number | null {
  let first: number | null = null;
  for (const index of near) if (!asked(index) && (first === null || index < first)) first = index;
  return first;
}

/**
 * Where the page in view goes by a key, of `pages` pages counted from one: Left
 * and Right by a page, Home and End to the first and the last. With nothing
 * selected, Left and Right begin at the first. Nothing, where the key does
 * not move it, or there are no pages.
 */
export function moved(selected: number | null, key: string, pages: number): number | null {
  if (pages < 1) return null;
  switch (key) {
    case 'ArrowRight':
      return selected === null ? 1 : Math.min(pages, selected + 1);
    case 'ArrowLeft':
      return selected === null ? 1 : Math.max(1, selected - 1);
    case 'Home':
      return 1;
    case 'End':
      return pages;
    default:
      return null;
  }
}

/**
 * What the band over a run of pages read alike says: the names of its
 * languages, the resolution where it is not 300, the layout where Tesseract
 * is told it, and black and white where the pages are made so.
 */
export function runSaid(
  settings: PageSettings,
  nameOf: (code: string) => string,
  t: (id: string, args?: Args) => string,
): string {
  const said = [
    settings.languages.length
      ? settings.languages.map((code) => nameOf(code)).join(', ')
      : t('ocr-strip-band-none'),
  ];
  if (settings.dpi !== 0 && settings.dpi !== 300)
    said.push(t('ocr-strip-band-dpi', { dpi: String(settings.dpi) }));
  if (settings.layout) said.push(t(`ocr-how-layout-${settings.layout}`));
  if (settings.contrast) said.push(t('ocr-strip-band-contrast'));
  return said.join(' · ');
}

/**
 * Where a part of the outline begins under the pages: its page, the titles
 * of the parts that begin there (two may), the index of the first of them in
 * the outline, and how many pages there are to the next tick or the end,
 * which is the room for its label.
 */
export interface Tick {
  page: number;
  titles: string[];
  index: number;
  span: number;
}

/** The ticks of the parts of an outline under a file of `pages` pages, in the order of their pages; parts past the end are left out. */
export function ticksOf(outline: OutlinePart[], pages: number): Tick[] {
  const byPage = new Map<number, Tick>();
  outline.forEach((part, index) => {
    if (!Number.isInteger(part.page) || part.page < 1 || part.page > pages) return;
    const tick = byPage.get(part.page);
    if (tick) tick.titles.push(part.title);
    else byPage.set(part.page, { page: part.page, titles: [part.title], index, span: 0 });
  });
  const ticks = [...byPage.values()].sort((a, b) => a.page - b.page);
  ticks.forEach((tick, i) => (tick.span = (ticks[i + 1]?.page ?? pages + 1) - tick.page));
  return ticks;
}
