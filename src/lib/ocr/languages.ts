/**
 * The languages Tesseract reads, by its own names for them (`eng`, `nor`,
 * `chi_sim`, `script/Latin`), with their names in the language of the
 * interface; and those that are chosen to read with at first: those of the
 * settings, and where none are set there, the language of the text and that
 * of the interface (ADR 0018).
 */

import { languageName, primary, t } from '$lib/i18n';

/** Tesseract's names for the languages of texts, by the first part of their tags. */
const OF_TAG: Record<string, string> = {
  ar: 'ara',
  bg: 'bul',
  ca: 'cat',
  cs: 'ces',
  cy: 'cym',
  da: 'dan',
  de: 'deu',
  el: 'ell',
  en: 'eng',
  es: 'spa',
  et: 'est',
  eu: 'eus',
  fa: 'fas',
  fi: 'fin',
  fr: 'fra',
  ga: 'gle',
  gl: 'glg',
  grc: 'grc',
  he: 'heb',
  hi: 'hin',
  hr: 'hrv',
  hu: 'hun',
  is: 'isl',
  it: 'ita',
  ja: 'jpn',
  ko: 'kor',
  la: 'lat',
  lt: 'lit',
  lv: 'lav',
  nb: 'nor',
  nl: 'nld',
  nn: 'nor',
  no: 'nor',
  pl: 'pol',
  pt: 'por',
  ro: 'ron',
  ru: 'rus',
  sk: 'slk',
  sl: 'slv',
  sr: 'srp',
  sv: 'swe',
  tr: 'tur',
  uk: 'ukr',
  zh: 'chi_sim',
  // As BibLaTeX names them, in `langid` and `language`.
  american: 'eng',
  british: 'eng',
  english: 'eng',
  norsk: 'nor',
  nynorsk: 'nor',
  norwegian: 'nor',
  danish: 'dan',
  swedish: 'swe',
  german: 'deu',
  ngerman: 'deu',
  french: 'fra',
  italian: 'ita',
  spanish: 'spa',
  portuguese: 'por',
  dutch: 'nld',
  latin: 'lat',
  greek: 'ell',
  ancientgreek: 'grc',
  polutonikogreek: 'grc',
  finnish: 'fin',
  icelandic: 'isl',
  polish: 'pol',
  czech: 'ces',
  russian: 'rus',
};

/** Tesseract's name for the language of a tag (`nb-NO` is `nor`), where it has one. */
export function tesseractLanguage(tag: string | null | undefined): string | null {
  return OF_TAG[primary(tag)] ?? null;
}

/** Tags for those of Tesseract's names that are not tags themselves. */
const AS_TAG: Record<string, string> = {
  chi_sim: 'zh-Hans',
  chi_sim_vert: 'zh-Hans',
  chi_tra: 'zh-Hant',
  chi_tra_vert: 'zh-Hant',
  jpn_vert: 'jpn',
  kor_vert: 'kor',
  aze_cyrl: 'aze-Cyrl',
  srp_latn: 'srp-Latn',
  uzb_cyrl: 'uzb-Cyrl',
  deu_latf: 'deu',
  frk: 'deu',
  ita_old: 'ita',
  spa_old: 'spa',
};

/** The name of a language Tesseract reads, in the language of the interface. */
export function ocrLanguageName(code: string): string {
  if (code.startsWith('script/')) return t('ocr-language-script', { script: code.slice(7) });
  const tag = AS_TAG[code] ?? code.split('_')[0];
  const name = languageName(tag);
  if (code === 'frk' || code === 'deu_latf') return t('ocr-language-fraktur', { language: name });
  if (code.endsWith('_old')) return t('ocr-language-old', { language: name });
  if (code.endsWith('_vert')) return t('ocr-language-vertical', { language: name });
  return name;
}

/** The languages Tesseract has, in the order of their names. */
export function byName(codes: string[]): string[] {
  return [...codes].sort((a, b) => ocrLanguageName(a).localeCompare(ocrLanguageName(b)));
}

/**
 * The languages to read with at first, the likeliest first: those chosen in
 * the settings; where none are chosen, those of the tags given (the language
 * of the text, then that of the interface); English where none of them is
 * installed; else the first that is.
 */
export function firstLanguages(
  installed: string[],
  chosen: string[],
  tags: (string | null | undefined)[],
): string[] {
  const has = (code: string | null): code is string => !!code && installed.includes(code);
  const out: string[] = [];
  const add = (code: string | null) => {
    if (has(code) && !out.includes(code)) out.push(code);
  };
  chosen.forEach(add);
  if (!out.length) tags.forEach((tag) => add(tesseractLanguage(tag)));
  if (!out.length) add('eng');
  if (!out.length && installed.length) out.push(installed[0]);
  return out;
}
