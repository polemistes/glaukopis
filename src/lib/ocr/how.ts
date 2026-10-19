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
 * Fewer dots to the inch than this, and the letters of a scan are too few
 * to be read well, whatever is chosen.
 */
export const LOW_RESOLUTION = 150;

/** Whether the pages of a PDF are pictures at too few dots to the inch to be read well. */
export function lowResolution(looked: { resolution?: number | null }): boolean {
  return looked.resolution != null && looked.resolution < LOW_RESOLUTION;
}

/**
 * What every page takes at first, all one way (ADR 0061): read by Tesseract
 * where half or more of the pages that have text have text that does not
 * read as text, and the scan is not too coarse to be read anew; the text
 * the PDF has otherwise, and always where Tesseract is not there to read.
 * Pages without text are read whatever this says.
 */
export function firstSource(
  looked: { withText: number; poor: number; resolution?: number | null },
  canRead: boolean,
): 'pdf' | 'read' {
  return canRead && anewAtFirst(looked) && !lowResolution(looked) ? 'read' : 'pdf';
}

/** Pages, counted from one and in order, said as stretches, `3–5, 9`, as the core says them; past ten stretches, the rest are not named. */
export function stretchesOf(pages: number[]): string {
  const stretches: [number, number][] = [];
  for (const page of pages) {
    const last = stretches.at(-1);
    if (last && page === last[1] + 1) last[1] = page;
    else stretches.push([page, page]);
  }
  const said = stretches.slice(0, 10).map(([a, b]) => (a === b ? `${a}` : `${a}–${b}`));
  if (stretches.length > 10) said.push('…');
  return said.join(', ');
}

/** The scripts some of whose letters look alike. Those of other scripts are never warned of. */
export type Script = 'Latin' | 'Greek' | 'Cyrillic';

/** Tesseract's languages by their script, where it is one of those whose letters look alike. */
const SCRIPTS: Record<Script, readonly string[]> = {
  Latin: [
    'afr',
    'aze',
    'bos',
    'bre',
    'cat',
    'ceb',
    'ces',
    'cos',
    'cym',
    'dan',
    'dan_frak',
    'dan_latf',
    'deu',
    'deu_frak',
    'deu_latf',
    'enm',
    'eng',
    'epo',
    'est',
    'eus',
    'fao',
    'fil',
    'fin',
    'fra',
    'frk',
    'frm',
    'fry',
    'gla',
    'gle',
    'glg',
    'hat',
    'hrv',
    'hun',
    'ind',
    'isl',
    'ita',
    'ita_old',
    'jav',
    'kmr',
    'kur',
    'lat',
    'lav',
    'lit',
    'ltz',
    'mlt',
    'mri',
    'msa',
    'nld',
    'nor',
    'oci',
    'pol',
    'por',
    'que',
    'ron',
    'slk',
    'slk_frak',
    'slv',
    'spa',
    'spa_old',
    'sqi',
    'srp_latn',
    'sun',
    'swa',
    'swe',
    'tgl',
    'ton',
    'tur',
    'uzb',
    'vie',
    'yor',
    'script/Latin',
    'script/Fraktur',
    'script/Vietnamese',
  ],
  Greek: ['grc', 'ell', 'script/Greek'],
  Cyrillic: [
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
    'aze_cyrl',
    'script/Cyrillic',
  ],
};

const SCRIPT_OF = new Map<string, Script>(
  (Object.entries(SCRIPTS) as [Script, readonly string[]][]).flatMap(([script, codes]) =>
    codes.map((code) => [code, script] as const),
  ),
);

/** The script of one of Tesseract's languages, where it is Latin, Greek or Cyrillic; nothing for any other. */
export function scriptOf(code: string): Script | null {
  return SCRIPT_OF.get(code) ?? null;
}

/** Two scripts whose letters look alike, with the letters, those of the first before those of the second. */
export interface ScriptsAlike {
  a: Script;
  b: Script;
  alike: string;
}

/**
 * The scripts whose letters look alike, with the letters. Read together,
 * Tesseract often takes a letter of the one for the other's, and whole
 * words come out in the wrong script: the lunate sigma of Greek as a Latin
 * c, the Cyrillic р as a Latin p.
 */
const ALIKE: readonly ScriptsAlike[] = [
  { a: 'Greek', b: 'Latin', alike: 'ϲ c, ο o, ν v, ρ p, α a' },
  { a: 'Cyrillic', b: 'Latin', alike: 'с c, о o, р p, а a, е e, у y, х x' },
  { a: 'Greek', b: 'Cyrillic', alike: 'ο о, α а, ρ р' },
];

/** The pairs of scripts among the languages chosen whose letters look alike. */
export function scriptsAlike(chosen: string[]): ScriptsAlike[] {
  const scripts = new Set(chosen.map(scriptOf));
  return ALIKE.filter(({ a, b }) => scripts.has(a) && scripts.has(b));
}
