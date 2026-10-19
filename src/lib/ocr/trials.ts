/**
 * The trials of a page in the workbench of a reading: each one reading of
 * the page in view with the settings that held for it, kept while the
 * dialog is open, the newest first, so that one sees whether a change of
 * setting helped or hurt and can go back to the better one. And the words
 * Tesseract was unsure of, which are underlined in the text it read and
 * marked faintly on the picture: they show where a reading is weak without
 * reading it all.
 */

import type { Layout, Tried, TriedWord } from '$lib/api/ocr';
import type { Args } from '$lib/i18n';
import { shownDpi } from './how';
import type { PageSettings } from './plan';

/** Under this confidence, out of 100, Tesseract was unsure of a word: as the core counts them. */
export const UNSURE = 70;

/** How many trials of a page are kept. */
export const KEPT = 6;

/** A page tried: what was read, and the settings it was read with. */
export interface Trial {
  settings: PageSettings;
  tried: Tried;
  /** When it was tried, as `Date.now()` says: which trial it is among those of its page. */
  at: number;
}

/** What the interface says by a name: `t` of `$lib/i18n`, given so that what is said here can be tested. */
type Say = (id: string, args?: Args) => string;

/** The trials of a page with one more: the newest first, the oldest dropped past `most`. */
export function remembered(trials: Trial[], trial: Trial, most = KEPT): Trial[] {
  return [trial, ...trials].slice(0, Math.max(0, most));
}

/** The layouts Tesseract is told, in the words of the settings. */
const LAYOUT_SAID: Record<Exclude<Layout, ''>, (t: Say) => string> = {
  column: (t) => t('ocr-how-layout-column'),
  block: (t) => t('ocr-how-layout-block'),
  sparse: (t) => t('ocr-how-layout-sparse'),
};

/**
 * Settings said in a line: *Fraktur, Danish and Norwegian (Gothic type) ·
 * 300*, or *English + Ancient Greek · 400 · One column · B/W*. The languages
 * stand between plus signs, since the name of a model may have a comma of
 * its own; the layout is left out where Tesseract judges it, and black and
 * white is said only where it is on.
 */
export function settingsSaid(
  settings: PageSettings,
  nameOf: (code: string) => string,
  t: Say,
): string {
  const parts = [
    settings.languages.length
      ? settings.languages.map(nameOf).join(' + ')
      : t('ocr-settings-said-no-language'),
    String(shownDpi(settings.dpi)),
  ];
  if (settings.layout) parts.push(LAYOUT_SAID[settings.layout](t));
  if (settings.contrast) parts.push(t('ocr-settings-said-contrast'));
  return parts.join(' · ');
}

/**
 * Whether a trial was read with the settings that hold for its page now:
 * the same languages in the same order, the same layout and black and
 * white, and the same resolution, where 0 is 300.
 */
export function triedAsNow(trial: Trial, now: PageSettings): boolean {
  const was = trial.settings;
  return (
    was.languages.length === now.languages.length &&
    was.languages.every((code, i) => code === now.languages[i]) &&
    shownDpi(was.dpi) === shownDpi(now.dpi) &&
    was.layout === now.layout &&
    was.contrast === now.contrast
  );
}

/** Whether Tesseract was unsure of a word: a confidence under `UNSURE`. A word it gave none is not counted. */
export function isUnsure(word: TriedWord): boolean {
  return word.confidence != null && word.confidence < UNSURE;
}

/** The words of a page tried that Tesseract was unsure of, in the order read: to be marked on the picture. */
export function unsureOf(tried: Tried | null | undefined): TriedWord[] {
  return tried ? tried.paragraphs.flat().filter(isUnsure) : [];
}

/**
 * A paragraph as text: its words with spaces between, and each line on a
 * line of its own, as Tesseract read it and as the text the PDF has is
 * shown beside it, so that the two are compared line by line and a word
 * broken at a line's end stays at its end.
 */
export function paragraphText(paragraph: TriedWord[]): string {
  return paragraph.map((word, i) => (i > 0 ? (word.line ? '\n' : ' ') : '') + word.text).join('');
}

/** A piece of a paragraph as it is shown: sure words together as text, or one unsure word, to be marked. */
export interface Piece {
  text: string;
  /** The word, where it is one Tesseract was unsure of. */
  unsure: TriedWord | null;
}

/**
 * A paragraph in the pieces it is shown in: the sure words joined into
 * runs of text with the spaces between, each unsure word a piece of its
 * own. Joined, the pieces are `paragraphText`.
 */
export function pieces(paragraph: TriedWord[]): Piece[] {
  const out: Piece[] = [];
  const plain = (text: string) => {
    const last = out.at(-1);
    if (last && !last.unsure) last.text += text;
    else out.push({ text, unsure: null });
  };
  paragraph.forEach((word, i) => {
    if (i > 0) plain(word.line ? '\n' : ' ');
    if (isUnsure(word)) out.push({ text: word.text, unsure: word });
    else plain(word.text);
  });
  return out;
}
