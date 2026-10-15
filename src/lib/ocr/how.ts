/**
 * How pages are read, when the way they are read at first goes badly: the
 * resolution they are drawn at, the layout of the page, and whether they are
 * made black and white. The settings say what to begin with; a dialog may
 * say otherwise for one reading.
 */

import type { How, Layout } from '$lib/api/ocr';
import { settings } from '$lib/state/settings.svelte';

/** The resolutions offered, in dots to the inch. 0 in the settings stands for the first. */
export const DPIS = [300, 400, 600] as const;

export const LAYOUTS: readonly Layout[] = ['', 'column', 'block', 'sparse'];

/** How to read, as the settings say. */
export function howFromSettings(): How {
  const { ocrDpi, ocrLayout, ocrContrast } = settings.value;
  return {
    dpi: DPIS.includes(ocrDpi as (typeof DPIS)[number]) ? ocrDpi : 0,
    layout: LAYOUTS.includes(ocrLayout) ? ocrLayout : '',
    contrast: !!ocrContrast,
  };
}

/** The resolution as it is shown: 0 is the first offered. */
export const shownDpi = (dpi: number) => (dpi === 0 ? DPIS[0] : dpi);

/**
 * Whether a PDF is read anew at first, in place of the text it has: where
 * half or more of its pages that have text have text that does not read as
 * text.
 */
export function anewAtFirst(looked: { withText: number; poor: number }): boolean {
  return looked.withText > 0 && looked.poor * 2 >= looked.withText;
}

/**
 * What becomes of the text a PDF has at first: translated where a scheme
 * applies, read anew where the text is poor and none does, kept otherwise.
 */
export function firstTextChoice(looked: {
  withText: number;
  poor: number;
  schemes: unknown[];
}): 'keep' | 'translate' | 'anew' {
  if (looked.schemes.length) return 'translate';
  return anewAtFirst(looked) ? 'anew' : 'keep';
}

/** Tesseract's languages whose script is not the Latin one, as far as they are offered. */
const NOT_LATIN = new Set([
  'grc',
  'ell',
  'rus',
  'ukr',
  'bel',
  'bul',
  'mkd',
  'srp',
  'kaz',
  'kir',
  'mon',
  'tgk',
  'tat',
  'uzb_cyrl',
  'heb',
  'yid',
  'ara',
  'fas',
  'urd',
  'pus',
  'syr',
  'hin',
  'mar',
  'nep',
  'san',
  'ben',
  'asm',
  'guj',
  'pan',
  'ori',
  'tam',
  'tel',
  'kan',
  'mal',
  'sin',
  'tha',
  'lao',
  'khm',
  'mya',
  'bod',
  'dzo',
  'amh',
  'tir',
  'kat',
  'kat_old',
  'hye',
  'chi_sim',
  'chi_tra',
  'jpn',
  'kor',
  'chr',
  'iku',
  'div',
  'osd',
  'equ',
]);

/**
 * The languages of the Latin script chosen together with Greek: with them,
 * Tesseract reads the lunate sigma, which looks like a Latin c, as Latin.
 */
export function latinWithGreek(chosen: string[]): string[] {
  if (!chosen.some((l) => l === 'grc' || l === 'ell' || l === 'script/Greek')) return [];
  return chosen.filter((l) => !NOT_LATIN.has(l) && !l.startsWith('script/'));
}
