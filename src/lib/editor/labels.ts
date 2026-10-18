/**
 * What stands in a text for what is not text: a citation in its neutral
 * short form ("Nagy 1979, 45"), and the words that point to a figure, a
 * table, an equation or a part ("Figure 3", "(2)"). One rule, without the
 * interface: the editor gives it the words of the interface and of the
 * document's format and language (`references.svelte.ts`,
 * `figures/numbering.svelte.ts`), and the search through everything, in a
 * worker that has neither, is given the same words with what it is asked
 * (`search/everything.ts`). Each had its own copy of the rule before, and
 * the search's said "Figure" and "Table" where the document said
 * otherwise.
 */

import { LOCATOR_LABELS, type CiteItem, type CiteMode } from './schema';
import type { RefForm } from '$lib/project/model/text';

// ---- citations ----

/** A work cited, as much of it as a citation shows. */
export interface CitedWork {
  authors: string;
  year: string;
  title: string;
  key: string;
}

/** The words a citation is shown with, in the language of its text. */
export interface CitationWords {
  /** For a work that is not known. */
  readonly missing: string;
  /** For a citation of no work. */
  readonly empty: string;
  /** For a work without a year: "n.d.". */
  readonly noDate: string;
  /** What a kind of locator is called: "p.", "ch.", "§". */
  locator(kind: string): string;
}

/** The first words of a title, to stand for a work without authors. */
function shortTitle(title: string): string {
  const main = title.split(/[:.?!]\s/)[0];
  const words = main.split(/\s+/);
  return words.length > 5 ? `${words.slice(0, 5).join(' ')}…` : main;
}

/** Who a work is by, as a citation names it: its authors, else its title in short, else its key. */
export function whoOf(work: CitedWork): string {
  return work.authors.replace(/ \(eds?\.\)$/, '') || shortTitle(work.title) || work.key;
}

/** A work in short, without a locator: "Nagy 1979". */
export function workText(work: CitedWork, words: Pick<CitationWords, 'noDate'>): string {
  return `${whoOf(work)} ${work.year || words.noDate}`;
}

/** One cited work in short: "Nagy 1979, 45". */
export function itemText(
  item: CiteItem,
  work: CitedWork | null,
  words: CitationWords,
  suppressAuthor = false,
): string {
  if (!work) return words.missing;
  const parts: string[] = [];
  if (item.prefix) parts.push(item.prefix.trim());
  const year = work.year || words.noDate;
  parts.push(item.suppressAuthor || suppressAuthor ? year : `${whoOf(work)} ${year}`);
  let out = parts.join(' ');
  if (item.locator) {
    const label = item.label && item.label !== 'page' ? words.locator(item.label) : '';
    out += `, ${label ? `${label} ` : ''}${item.locator}`;
  }
  // Words that begin with a sign of their own stand close to what is before them.
  const after = item.suffix?.trim();
  if (after) out += /^[,;:.!?)]/.test(after) ? after : ` ${after}`;
  return out;
}

/**
 * A citation as the text shows it. The reference style is applied in the
 * preview; in the text a neutral short form stands for it.
 */
export function citationText(
  items: CiteItem[],
  mode: CiteMode,
  lookup: (id: string) => CitedWork | null,
  words: CitationWords,
): string {
  if (!items.length) return words.empty;
  if (mode === 'intext') {
    const [first, ...rest] = items;
    const work = lookup(first.id);
    const who = work
      ? work.authors.replace(/ \(eds?\.\)$/, '') || shortTitle(work.title)
      : words.missing;
    const inside = [
      itemText(first, work, words, true),
      ...rest.map((i) => itemText(i, lookup(i.id), words)),
    ].join('; ');
    return `${who} (${inside})`;
  }
  return `(${items.map((i) => itemText(i, lookup(i.id), words)).join('; ')})`;
}

// ---- words that point ----

export type PointedKind = 'figure' | 'table' | 'equation' | 'part';

/** What the format of a document calls what is pointed to, in its language. */
export interface PointerWords {
  /** What a figure is called under it, and where it is pointed to, where that is other. */
  label: string;
  reference: string;
  /** The same for a table. */
  tableLabel: string;
  tableReference: string;
  /** What stands around the number of an equation. */
  before: string;
  after: string;
}

/** The words of a document without a format of its own, in English. */
export const PLAIN_POINTER: PointerWords = {
  label: 'Figure',
  reference: '',
  tableLabel: 'Table',
  tableReference: '',
  before: '(',
  after: ')',
};

/** The words that point to something, as the document calls it. Nothing, when it cannot be pointed to. */
export function pointerText(
  pointed: { kind: PointedKind; number: string | null; words: string } | undefined,
  form: RefForm,
  c: PointerWords,
): string {
  if (!pointed) return '';
  switch (pointed.kind) {
    case 'figure':
    case 'table': {
      const called =
        pointed.kind === 'figure'
          ? (c.reference.trim() || c.label).trim()
          : (c.tableReference.trim() || c.tableLabel).trim();
      if (pointed.number === null) return called;
      if (form === 'number' || !called) return pointed.number;
      // A space that does not break: "Figure" and its number stay on one line.
      return `${called} ${pointed.number}`;
    }
    case 'equation':
      if (pointed.number === null) return '';
      return form === 'number' ? pointed.number : `${c.before}${pointed.number}${c.after}`;
    case 'part':
      return pointed.number !== null && form !== 'name' ? pointed.number : pointed.words;
  }
}

// ---- the words, as data, for where the interface is not ----

/**
 * The words of a document as data that a worker can be sent: those of a
 * citation, with what each kind of locator is called, and those of words
 * that point.
 */
export interface LabelWords {
  citation: { missing: string; empty: string; noDate: string; locators: Record<string, string> };
  pointer: PointerWords;
}

/** The words of a document without a format or a language of its own, in English. */
export const PLAIN_WORDS: LabelWords = {
  citation: {
    missing: '',
    empty: '',
    noDate: 'n.d.',
    locators: Object.fromEntries(LOCATOR_LABELS.map(([kind, word]) => [kind, word])),
  },
  pointer: PLAIN_POINTER,
};

/** The words of a citation, from words sent as data. */
export function citationWordsOf(words: LabelWords['citation']): CitationWords {
  return { ...words, locator: (kind) => words.locators[kind] ?? '' };
}
