/**
 * The words of a text, as spelling is checked by them: found with
 * `Intl.Segmenter`, and without those that are not checked (ADR 0019).
 *
 * Not checked: words with digits in them (1990s, H2O), what stands in an
 * address (of a web page or a mail box), and words written in another
 * script than the dictionary's, such as Greek in an English text. The core
 * looks at what it is asked about again (`crates/core/src/spelling/words.rs`).
 *
 * Words joined by a hyphen are one word (e-post, TV-program), as the
 * dictionaries have many such; a dictionary that does not have one checks
 * its parts. A word that a point follows is asked about with the point as
 * well, since abbreviations are in the dictionaries so (osv., e.g.); the
 * dictionary tries the word without it first.
 */

/** A word, and where it stands in the text, in units of UTF-16. */
export interface Word {
  /** The word as it stands, which is underlined where it is wrong. */
  word: string;
  from: number;
  to: number;
  /** What the dictionary is asked: the word, with the point that follows it, if one does. */
  asked: string;
}

/** Stands in a text for what is not text: a citation, a formula, a note. */
export const NOT_TEXT = '￼';

const segmenters = new Map<string, Intl.Segmenter>();

/** One for each language, as they are slow to make. */
function segmenterFor(locale: string): Intl.Segmenter {
  let segmenter = segmenters.get(locale);
  if (!segmenter) {
    try {
      segmenter = new Intl.Segmenter(locale || undefined, { granularity: 'word' });
    } catch {
      segmenter = new Intl.Segmenter(undefined, { granularity: 'word' });
    }
    segmenters.set(locale, segmenter);
  }
  return segmenter;
}

/** Hyphens that join words: that of the keyboard, the hyphen, and the one that does not break. */
const HYPHENS = new Set(['-', '‐', '‑']);

const DIGIT = /\p{Nd}/u;
const LETTER = /\p{L}/u;

/** Addresses of web pages and of mail boxes, whose parts are not words. */
const ADDRESS =
  /\b[a-z][a-z0-9+.-]*:\/\/[^\s<>"]+|\bwww\.[^\s<>"]+|[^\s@<>()"'[\]{},;:]+@[^\s@<>()"'[\]{},;:]+\.[^\s@<>()"'[\]{},;:]+/giu;

const scripts = new Map<string, RegExp | null>();

/** A test of whether a letter is of a script, by its name in ISO 15924 (`Latn`, `Grek`). */
function scriptTest(script: string): RegExp | null {
  if (!scripts.has(script)) {
    let test: RegExp | null = null;
    try {
      test = new RegExp(`\\p{Script=${script}}`, 'u');
    } catch {
      // A script this engine does not know: its words are all checked.
    }
    scripts.set(script, test);
  }
  return scripts.get(script) ?? null;
}

/**
 * Whether the word is written in another script than the one given: it
 * has letters, and none of them is of that script. A word that mixes the
 * scripts is checked, and is found wrong, which it most likely is.
 */
export function inAnotherScript(word: string, script: string): boolean {
  const test = scriptTest(script);
  if (!test) return false;
  let other = false;
  for (const c of word) {
    if (!LETTER.test(c)) continue;
    if (test.test(c)) return false;
    // Letters that belong to no script of their own, such as marks, are of every script.
    if (!/\p{Script=Zyyy}|\p{Script=Zinh}/u.test(c)) other = true;
  }
  return other;
}

/**
 * Whether a word looks like the name of a place on the web or of a file:
 * parts parted by points (`example.org`, `notes.txt`). An abbreviation has
 * a part of a single letter (`e.g`, `f.eks`), and is checked.
 */
export function isAddress(word: string): boolean {
  if (word.includes('@') || word.includes('://')) return true;
  const inner = word.replace(/\.+$/, '');
  return inner.includes('.') && inner.split('.').every((part) => [...part].length >= 2);
}

/** Whether a word is checked at all, in a dictionary of the script. */
export function isChecked(word: string, script?: string | null): boolean {
  if (!LETTER.test(word) || DIGIT.test(word) || isAddress(word)) return false;
  return !script || !inAnotherScript(word, script);
}

/** The parts of the text that are addresses. */
function addresses(text: string): [number, number][] {
  if (!text.includes('.') && !text.includes('@')) return [];
  const out: [number, number][] = [];
  for (const m of text.matchAll(ADDRESS)) {
    // A point at its end ends the sentence, not the address.
    const end = m.index + m[0].replace(/[.,;:!?)]+$/u, '').length;
    out.push([m.index, end]);
  }
  return out;
}

/**
 * The words of a text that are checked. `locale` is the language of the
 * text (`nb`, `en-GB`), by which it is parted into words; `script` that of
 * the dictionary it is checked with, whose words alone are checked.
 */
export function findWords(text: string, locale = '', script: string | null = null): Word[] {
  const parts: { from: number; to: number }[] = [];
  for (const s of segmenterFor(locale).segment(text)) {
    if (!s.isWordLike) continue;
    const from = s.index;
    const to = from + s.segment.length;
    const last = parts[parts.length - 1];
    // Joined to the one before by a hyphen, and nothing else.
    if (last && from === last.to + 1 && HYPHENS.has(text[last.to])) last.to = to;
    else parts.push({ from, to });
  }
  const away = addresses(text);
  const out: Word[] = [];
  for (const { from, to } of parts) {
    if (away.some(([a, b]) => from < b && to > a)) continue;
    const word = text.slice(from, to);
    if (!isChecked(word, script)) continue;
    const asked = text[to] === '.' ? `${word}.` : word;
    out.push({ word, from, to, asked });
  }
  return out;
}

/** The word that stands at a place of the text, or touches it. */
export function wordAt(words: Word[], at: number): Word | null {
  return words.find((w) => w.from <= at && at <= w.to) ?? null;
}
