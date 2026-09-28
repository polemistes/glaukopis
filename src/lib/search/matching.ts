/**
 * Finding words in a passage, with the options a search has (ADR 0017):
 * capitals as they are written, whole words, letters with and without
 * accents alike, regular expressions, and what is put in the place of what
 * is found.
 */

import { NO_TEXT } from './passages';

export interface SearchOptions {
  /** Capitals as they are written: otherwise "wrath" finds "Wrath". */
  caseSensitive: boolean;
  /** Only whole words: otherwise "wrath" finds "wrathful". */
  wholeWords: boolean;
  /** Letters with and without accents alike: "ἄειδε" finds "αειδε", "Pelée" finds "Pelee". */
  accentsAlike: boolean;
  /** The words are a regular expression. */
  regex: boolean;
  /** Only in the text that was selected. */
  selection: boolean;
  /** What stands outside the text is searched as well: citations as they are shown, words that point, formulas. */
  labels: boolean;
}

export const NO_OPTIONS: SearchOptions = {
  caseSensitive: false,
  wholeWords: false,
  accentsAlike: false,
  regex: false,
  selection: false,
  labels: false,
};

/** Where something was found in a passage, and, of a regular expression, where its groups were. */
export interface Hit {
  start: number;
  end: number;
  groups?: ([number, number] | undefined)[];
  named?: Record<string, [number, number] | undefined>;
}

/** A text with the accents taken off its letters, and where each of its signs came from. */
export interface Folded {
  text: string;
  /** For each sign, where the letter it came from begins in the text as it was; one more for the end. */
  at: number[];
}

const bare = new Map<number, string>();

/** The letter without what is set on it: "é" is "e", "ἄ" is "α". Letters of their own, as "ø", stay. */
function bareOf(point: number, sign: string): string {
  let out = bare.get(point);
  if (out === undefined) {
    out = sign.normalize('NFD').replace(/\p{M}/gu, '');
    bare.set(point, out);
  }
  return out;
}

export function fold(text: string): Folded {
  let out = '';
  const at: number[] = [];
  for (let i = 0; i < text.length;) {
    const point = text.codePointAt(i)!;
    const size = point > 0xffff ? 2 : 1;
    // Most text is plain: below the letters of Latin-1 nothing has an accent.
    const sign = point < 0xc0 ? text[i] : bareOf(point, text.slice(i, i + size));
    for (let k = 0; k < sign.length; k++) at.push(i);
    out += sign;
    i += size;
  }
  at.push(text.length);
  return { text: out, at };
}

/** The first place in a folded text whose sign came from at or after a place of the text as it was. */
function foldedAt(folded: Folded, offset: number): number {
  let low = 0;
  let high = folded.at.length - 1;
  while (low < high) {
    const mid = (low + high) >> 1;
    if (folded.at[mid] < offset) low = mid + 1;
    else high = mid;
  }
  return low;
}

const SYNTAX = /[\\^$.*+?()[\]{}|/]/;
/** Signs that are written in more than one way, and are found as any of them where plain words are looked for. */
const ALIKE: Record<string, string> = {
  "'": "['‘’ʼ]",
  '‘': "['‘’ʼ]",
  '’': "['‘’ʼ]",
  ʼ: "['‘’ʼ]",
  '"': '["“”„]',
  '“': '["“”„]',
  '”': '["“”„]',
  '„': '["“”„]',
};

/** Plain words as a regular expression: room is any room, as a space that does not break. */
function plain(words: string): string {
  let out = '';
  for (const sign of words) {
    if (/\s/u.test(sign)) out += '\\s';
    else if (ALIKE[sign]) out += ALIKE[sign];
    else out += SYNTAX.test(sign) ? `\\${sign}` : sign;
  }
  return out;
}

/** What letters and words are made of, for telling where a word begins and ends. */
const WORDLY = '[\\p{L}\\p{N}\\p{M}_]';

export type Made = { matcher: Matcher } | { error: string } | null;

export class Matcher {
  readonly options: SearchOptions;
  #re: RegExp;
  /** Folded passages, by the passage text: the same text is folded once while the matcher lasts. */
  #folded = new Map<string, Folded>();

  private constructor(re: RegExp, options: SearchOptions) {
    this.#re = re;
    this.options = options;
  }

  /**
   * A matcher for words and options. Nothing, where there are no words; an
   * error, where they are a regular expression that is not one.
   */
  static make(words: string, options: SearchOptions): Made {
    if (!words) return null;
    const folded = options.accentsAlike ? fold(words).text : words;
    let source = options.regex ? folded : plain(folded);
    if (options.wholeWords) source = `(?<!${WORDLY})(?:${source})(?!${WORDLY})`;
    const flags = `gu${options.caseSensitive ? '' : 'i'}${options.regex ? 'd' : ''}`;
    try {
      return { matcher: new Matcher(new RegExp(source, flags), options) };
    } catch (error) {
      return { error: error instanceof Error ? error.message : String(error) };
    }
  }

  #fold(text: string): Folded {
    let known = this.#folded.get(text);
    if (!known) {
      known = fold(text);
      // Only the long ones are worth keeping; the short ones are folded again quickly.
      if (text.length > 200) this.#folded.set(text, known);
    }
    return known;
  }

  /**
   * What is found in a passage, in the order it stands in. Nothing is found
   * across what is not text; with `within`, only what lies wholly within it
   * is found, as if the passage were no more than that.
   */
  find(text: string, within: [number, number] | null = null): Hit[] {
    const out: Hit[] = [];
    const from = within ? Math.max(0, within[0]) : 0;
    const to = within ? Math.min(text.length, within[1]) : text.length;
    if (to <= from) return out;
    const folded = this.options.accentsAlike ? this.#fold(text) : null;
    let start = from;
    while (start < to) {
      let end = text.indexOf(NO_TEXT, start);
      if (end < 0 || end > to) end = to;
      if (end > start) this.#segment(text, folded, start, end, out);
      start = end + 1;
    }
    return out;
  }

  #segment(text: string, folded: Folded | null, start: number, end: number, out: Hit[]) {
    const from = folded ? foldedAt(folded, start) : start;
    const to = folded ? foldedAt(folded, end) : end;
    const subject = (folded ? folded.text : text).slice(from, to);
    const back = (i: number) => (folded ? folded.at[from + i] : start + i);
    const pair = (range: [number, number] | undefined): [number, number] | undefined =>
      range ? [back(range[0]), back(range[1])] : undefined;
    this.#re.lastIndex = 0;
    for (const m of subject.matchAll(this.#re)) {
      if (!m[0]) continue;
      const at = m.index ?? 0;
      const hit: Hit = { start: back(at), end: back(at + m[0].length) };
      if (m.indices) {
        hit.groups = m.indices.slice(1).map(pair);
        if (m.indices.groups)
          hit.named = Object.fromEntries(
            Object.entries(m.indices.groups).map(([name, range]) => [name, pair(range)]),
          );
      }
      out.push(hit);
    }
  }

  /**
   * What is put in the place of what was found. Plain words are put as they
   * are; of a regular expression, `$1`, `$<name>` and `$&` are what the
   * groups and the whole found, and `$$` is a dollar.
   */
  replacement(text: string, hit: Hit, words: string): string {
    if (!this.options.regex) return words;
    const part = (range: [number, number] | undefined) =>
      range ? text.slice(range[0], range[1]) : '';
    const groups = hit.groups ?? [];
    return words.replace(/\$(\$|&|`|'|\d{1,2}|<([^>]*)>)/g, (all, what: string, name?: string) => {
      if (what === '$') return '$';
      if (what === '&') return text.slice(hit.start, hit.end);
      if (what === '`') return text.slice(0, hit.start);
      if (what === "'") return text.slice(hit.end);
      if (name !== undefined) return hit.named ? part(hit.named[name]) : all;
      // Two figures where there are so many groups, else one and a figure after it.
      const n = Number(what);
      if (n >= 1 && n <= groups.length) return part(groups[n - 1]);
      const one = Number(what[0]);
      if (what.length === 2 && one >= 1 && one <= groups.length)
        return part(groups[one - 1]) + what[1];
      return all;
    });
  }
}
