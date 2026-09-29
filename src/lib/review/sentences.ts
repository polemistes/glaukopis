/**
 * The sentences of a text, as a review of changes goes through it (ADR 0022).
 *
 * They are found by `Intl.Segmenter`, in the language of the map, and mended
 * where it breaks wrongly for scholarly writing: after an abbreviation that
 * does not end a sentence ("cf.", "p.", "vol.", "jf.", "bl.a."), after the
 * initials of a name ("A. B. Lord"), after a short abbreviation before a
 * number ("Il. 9.410", "no. 3"), and before a word in small letters. What
 * stands right after the stop of a sentence and is no text, as the number of
 * a note, belongs to the sentence it follows, and not to the next.
 *
 * Where a sentence is found wrongly, a change is shown as two, or two as one:
 * nothing worse follows from it.
 */

/** What stands in a text for what is not text: a citation, a formula, a note. */
export const OBJECT = '￼';

/** A sentence: from where, to where, in the text. The space after it is its own. */
export interface Sentence {
  start: number;
  end: number;
}

/** Abbreviations that do not end a sentence, in small letters, in every language. */
const SCHOLARLY = [
  'cf.',
  'p.',
  'pp.',
  's.',
  'ss.',
  'vol.',
  'vols.',
  'ch.',
  'chap.',
  'fig.',
  'figs.',
  'e.g.',
  'i.e.',
  'ed.',
  'eds.',
  'ca.',
  'viz.',
  'vs.',
  's.v.',
  'op.',
  'esp.',
  'approx.',
  'col.',
  'cols.',
  'fol.',
  'fols.',
  'sc.',
  'tr.',
  'trans.',
  'repr.',
  'dr.',
  'mr.',
  'mrs.',
  'ms.',
  'prof.',
  'st.',
];

/** Those of Norwegian: "red." is an English word as well, and is not one of them in English. */
const NORWEGIAN = [
  'jf.',
  'jfr.',
  'bl.a.',
  'f.eks.',
  'red.',
  'nr.',
  'kap.',
  'dvs.',
  'mht.',
  'pga.',
  'ifb.',
  'iht.',
  'ifr.',
  'evt.',
  'ev.',
  'inkl.',
  'ekskl.',
  'kl.',
  'bd.',
  'hhv.',
  'iflg.',
  'vedr.',
  'ang.',
  'm.a.o.',
  'o.a.',
  'sst.',
  'tab.',
  'pkt.',
  'avsn.',
  'utg.',
  'overs.',
  'oppl.',
  'årg.',
];

const everywhere = new Set(SCHOLARLY);
const inNorwegian = new Set([...SCHOLARLY, ...NORWEGIAN]);

function norwegian(language: string): boolean {
  const primary = language.toLowerCase().split(/[-_]/)[0];
  return primary === 'nb' || primary === 'nn' || primary === 'no';
}

const segmenters = new Map<string, Intl.Segmenter>();

function segmenterFor(language: string): Intl.Segmenter {
  let made = segmenters.get(language);
  if (!made) {
    try {
      made = new Intl.Segmenter(language || undefined, { granularity: 'sentence' });
    } catch {
      // A tag the segmenter does not take: the rules of English are near enough.
      made = new Intl.Segmenter('en', { granularity: 'sentence' });
    }
    segmenters.set(language, made);
  }
  return made;
}

/** Opening signs that stand before a word, which a word is read without. */
const OPENING = /^[([{“"‘'«‹¿¡]+/u;

/** Whether the break between two sentences is a break the segmenter made wrongly. */
function wrongBreak(text: string, from: number, at: number, next: number, known: Set<string>) {
  const before = text.slice(from, at).trimEnd();
  const word = (/\S+$/u.exec(before)?.[0] ?? '').replace(OPENING, '');
  const following = text.slice(next).trimStart();
  const first = following.charAt(0);
  // A sentence does not begin with a small letter: "etc. are here".
  if (/\p{Ll}/u.test(first)) return true;
  if (!word.endsWith('.')) return false;
  if (known.has(word.toLowerCase())) return true;
  // The initials of a name: "A. B. Lord", "A.B. Lord".
  if (/^(\p{Lu}\.)+$/u.test(word)) return true;
  // A short abbreviation before a number: "Il. 9.410", "no. 3", "kl. 3".
  if (/^\p{L}{1,5}\.$/u.test(word) && /\p{Nd}/u.test(first)) return true;
  return false;
}

/**
 * The sentences of a text, in order, covering it all. A text without a
 * sentence in it is one sentence; an empty text has none.
 */
export function sentences(text: string, language?: string | null): Sentence[] {
  if (!text) return [];
  const known = language && norwegian(language) ? inNorwegian : everywhere;
  const starts = [0];
  for (const segment of segmenterFor(language ?? '').segment(text)) {
    const at = segment.index;
    if (at === 0) continue;
    // What is no text right after the stop, as the number of a note, and the
    // space after it, go with the sentence before.
    let next = at;
    while (next < text.length && text[next] === OBJECT) next++;
    if (next > at) while (next < text.length && /\s/u.test(text[next])) next++;
    if (next >= text.length) continue;
    const from = starts[starts.length - 1];
    if (next <= from) continue;
    if (wrongBreak(text, from, at, next, known)) continue;
    starts.push(next);
  }
  return starts.map((start, i) => ({ start, end: starts[i + 1] ?? text.length }));
}

/**
 * Of a sentence, the part without the space around it: what a change must
 * touch to be a change of this sentence. Space alone is no sentence's.
 */
export function core(text: string, sentence: Sentence): Sentence | null {
  let { start, end } = sentence;
  while (start < end && /\s/u.test(text[start])) start++;
  while (end > start && /\s/u.test(text[end - 1])) end--;
  return end > start ? { start, end } : null;
}
