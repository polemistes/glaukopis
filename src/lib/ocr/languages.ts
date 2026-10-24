/**
 * The languages Tesseract reads, by its own names for them (`eng`, `nor`,
 * `chi_sim`, `script/Latin`), with their names in the language of the
 * interface; and those that are chosen to read with at first: those of the
 * settings, and where none are set there, the language of the text and that
 * of the interface (ADR 0018).
 */

import { languageName, languages, primary, t } from '$lib/i18n';

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
  frk: 'deu',
  ita_old: 'ita',
  spa_old: 'spa',
};

/**
 * The models that read a type rather than a language: Tesseract's Fraktur
 * model, its model of the Fraktur script, and Glaukopis's own Fraktur model
 * for Danish and Norwegian, which is Tesseract's taught æ, ø and å. They
 * read the Gothic type of books in German, Norwegian, Danish or Swedish
 * alike, so they are named for the type first, and then for the languages
 * they were trained on.
 */
const FRAKTUR_MODELS = ['deu_latf', 'dan_latf', 'script/Fraktur'];

/**
 * The line under the languages chosen where a model of Gothic type is
 * installed: which model such books are read with. Where Norwegian or
 * Danish is among the languages, it is the model that knows æ, ø and å;
 * otherwise the Fraktur model made for German. Nothing where no model of
 * Gothic type is installed.
 */
export function frakturHint(installed: string[], chosen: string[]): string | null {
  if (!hasFrakturModel(installed)) return null;
  const nordic = chosen.some((code) => code === 'nor' || code === 'dan');
  return nordic ? 'ocr-languages-fraktur-hint-dan' : 'ocr-languages-fraktur-hint';
}

/**
 * Whether Gothic type can be read with what is installed: the Fraktur model,
 * its model of the script, or the older German one, `frk`.
 */
export function hasFrakturModel(installed: string[]): boolean {
  return installed.some((code) => FRAKTUR_MODELS.includes(code) || code === 'frk');
}

/** The name of a language Tesseract reads, in the language of the interface. */
export function ocrLanguageName(code: string, inText = false): string {
  if (code === 'dan_latf') return t('ocr-language-fraktur-norwegian');
  if (FRAKTUR_MODELS.includes(code)) return t('ocr-language-fraktur-german');
  if (code.startsWith('script/')) return t('ocr-language-script', { script: code.slice(7) });
  const tag = AS_TAG[code] ?? code.split('_')[0];
  // Standing alone, a name begins with a capital; in a sentence, it is as
  // the language writes it there: "English", but "engelsk".
  const name = inText ? inSentence(tag) : languageName(tag);
  // The older Fraktur models were each of one language, and are named by it.
  if (code === 'frk' || code.endsWith('_frak'))
    return t('ocr-language-fraktur', { language: name });
  if (code.endsWith('_old')) return t('ocr-language-old', { language: name });
  if (code.endsWith('_vert')) return t('ocr-language-vertical', { language: name });
  return name;
}

/** The name of a language as it is written in a sentence of the interface. */
function inSentence(tag: string): string {
  try {
    return new Intl.DisplayNames([languages.current], { type: 'language' }).of(tag) ?? tag;
  } catch {
    return tag;
  }
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
