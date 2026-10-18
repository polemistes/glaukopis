/**
 * The numbers that figures, equations and the parts of a document have, and
 * what the document calls them.
 *
 * A number belongs to a document, and a document is an element, the one
 * in view: the same figure is the second in the document of one element
 * and the fifth in that of another, which has the first standing in the
 * place of one of its elements. The numbers are counted as they are when
 * the document is made (`crates/core/src/document/pandoc.rs`), from what is
 * kept of each element, without reading the texts.
 */

import { documentWord, t } from '$lib/i18n';
import { untrack } from 'svelte';
import { createSubscriber, SvelteMap } from 'svelte/reactivity';
import type { DocumentFormat } from '$lib/api/documents';
import { documents } from '$lib/preview/documents.svelte';
import { walkDocument } from '$lib/project/model/document';
import type { Project } from '$lib/project/model/project.svelte';
import { partOf } from '$lib/project/parts';
import type { RefForm } from '$lib/project/model/text';
import { PROJECT } from '$lib/project/model/types';

export type PointedKind = 'figure' | 'table' | 'equation' | 'part';

/** Something that stands in the document and can be pointed to. */
export interface Pointed {
  id: string;
  kind: PointedKind;
  /** Its number in the document, if it has one. */
  number: string | null;
  /** What tells it from the others: what is said of a figure, the formula, the name of a part. */
  words: string;
  /** The element it stands in, or is. */
  element: string;
  /** Of a figure: its picture. */
  file?: string;
  extension?: string;
}

export interface Within {
  figure: (string | null)[];
  table: (string | null)[];
  equation: (string | null)[];
}

export interface Numbers {
  /** What can be pointed to, in the order of the document. */
  all: Pointed[];
  byId: Map<string, Pointed>;
  /** The numbers of the figures, the tables and the equations of each element, in the order they stand in. */
  within: Map<string, Within>;
}

/** What of the format the numbers and the words depend on. */
export interface Counting {
  numberedHeadings: boolean;
  /** The levels of heading that run into the text, which have no number. */
  runIn: number[];
  deepest: number;
  /** What a figure is called under it, and where it is pointed to. */
  label: string;
  reference: string;
  separator: string;
  /** The same for a table. */
  tableLabel: string;
  tableReference: string;
  tableSeparator: string;
  before: string;
  after: string;
}

const PLAIN: Counting = {
  numberedHeadings: false,
  runIn: [],
  deepest: 6,
  label: 'Figure',
  reference: '',
  separator: '. ',
  tableLabel: 'Table',
  tableReference: '',
  tableSeparator: '. ',
  before: '(',
  after: ')',
};

/**
 * What of the format the numbers and the words depend on, with the words in
 * the language of the document (ADR 0020).
 */
export function countingOf(format: DocumentFormat | undefined, language?: string): Counting {
  const say = (word: string) => documentWord(language, word);
  if (!format) return { ...PLAIN, label: say(PLAIN.label), tableLabel: say(PLAIN.tableLabel) };
  const levels = format.headings?.levels ?? [];
  return {
    numberedHeadings: !!format.headings?.numbered,
    runIn: levels.flatMap((l, i) => (l.runIn ? [i + 1] : [])),
    deepest: Math.min(6, Math.max(1, levels.length)),
    label: say(format.figures?.label ?? PLAIN.label),
    reference: say(format.figures?.reference ?? ''),
    separator: format.figures?.separator ?? PLAIN.separator,
    tableLabel: say(format.tables?.label ?? PLAIN.tableLabel),
    tableReference: say(format.tables?.reference ?? ''),
    tableSeparator: format.tables?.separator ?? PLAIN.tableSeparator,
    before: format.equations?.beforeNumber ?? PLAIN.before,
    after: format.equations?.afterNumber ?? PLAIN.after,
  };
}

/**
 * The top of the tree under the project an element stands in: the element
 * in whose document the text of the element is counted, where none is in
 * view. The project itself, for the project.
 */
export function topOf(project: Project, element: string): string {
  return project.pathTo(element)[1] ?? PROJECT;
}

/** Counts through the document of an element. */
export function count(project: Project, at: string, counting: Counting = PLAIN): Numbers {
  const all: Pointed[] = [];
  const byId = new Map<string, Pointed>();
  const within: Numbers['within'] = new Map();
  const put = (p: Pointed) => {
    all.push(p);
    // What stands twice in a document is pointed to where it stands first.
    if (p.id && !byId.has(p.id)) byId.set(p.id, p);
  };
  const counted = { figure: 0, table: 0, equation: 0 };
  const levels = [0, 0, 0, 0, 0, 0];

  walkDocument(project, at, (placed) => {
    const node = project.node(placed.id);
    if (!node) return;
    // What a cover output alone prints has no number among the figures of the text.
    if (placed.part && partOf(project, project.node(placed.part)?.kind)?.place === 'cover') return;
    if (placed.printed && placed.level > 0) {
      const level = Math.min(Math.max(placed.level, 1), counting.deepest);
      let number: string | null = null;
      if (counting.numberedHeadings && !counting.runIn.includes(level)) {
        levels[level - 1] += 1;
        levels.fill(0, level);
        number = levels.slice(0, level).join('.');
      }
      put({ id: placed.id, kind: 'part', number, words: node.title, element: placed.id });
    }
    // The same element may stand twice in a document, where a branch stands
    // in the place of an element: its numbers are those of the first.
    const first = !within.has(placed.id);
    const numbers: Within = { figure: [], table: [], equation: [] };
    for (const s of node.set) {
      const number = s.numbered ? String(++counted[s.kind]) : null;
      numbers[s.kind].push(number);
      put({
        id: s.id,
        kind: s.kind,
        number,
        words: s.words,
        element: placed.id,
        file: s.file,
        extension: s.extension,
      });
    }
    if (first) within.set(placed.id, numbers);
  });
  return { all, byId, within };
}

/** The words that point to something, as the document calls it. Nothing, when it cannot be pointed to. */
export function pointerText(pointed: Pointed | undefined, form: RefForm, c: Counting): string {
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
      return `${called} ${pointed.number}`;
    }
    case 'equation':
      if (pointed.number === null) return '';
      return form === 'number' ? pointed.number : `${c.before}${pointed.number}${c.after}`;
    case 'part':
      return pointed.number !== null && form !== 'name' ? pointed.number : pointed.words;
  }
}

/** The forms words can point by, for each kind, with what each is called in the interface. */
export function formsOf(kind: PointedKind, numbered: boolean): { form: RefForm; label: string }[] {
  switch (kind) {
    case 'figure':
    case 'table':
      return [
        { form: 'full', label: t('figures-form-full') },
        { form: 'number', label: t('figures-form-number') },
      ];
    case 'equation':
      return [
        { form: 'full', label: t('figures-form-equation') },
        { form: 'number', label: t('figures-form-number') },
      ];
    case 'part':
      return numbered
        ? [
            { form: 'full', label: t('figures-form-its-number') },
            { form: 'name', label: t('figures-form-its-name') },
          ]
        : [{ form: 'full', label: t('figures-form-its-name') }];
  }
}

/** Whether two countings of a document give the same numbers, to the same things, with the same words. */
export function sameNumbers(a: Numbers, b: Numbers): boolean {
  if (a === b) return true;
  if (a.all.length !== b.all.length || a.within.size !== b.within.size) return false;
  const same = (x: Pointed, y: Pointed) =>
    x.id === y.id &&
    x.kind === y.kind &&
    x.number === y.number &&
    x.words === y.words &&
    x.element === y.element &&
    x.file === y.file &&
    x.extension === y.extension;
  if (!a.all.every((x, i) => same(x, b.all[i]))) return false;
  const list = (x: (string | null)[], y: (string | null)[] | undefined) =>
    !!y && x.length === y.length && x.every((n, i) => n === y[i]);
  for (const [element, x] of a.within) {
    const y = b.within.get(element);
    if (!list(x.figure, y?.figure) || !list(x.table, y?.table) || !list(x.equation, y?.equation))
      return false;
  }
  return true;
}

class Numbering {
  /** The formats that have been read, by their ids. */
  readonly #formats = new SvelteMap<string, DocumentFormat | null>();
  /** The numbers of the documents of each project, by the element each is the document of. */
  #counted = new WeakMap<Project, Map<string, Counted>>();

  /** The format of the document of an element, when it has been read; it is asked for when it has not. */
  formatOf(project: Project, at: string): DocumentFormat | undefined {
    const id = documents.choice(project.documentOf(at).settings, project).format;
    if (!id) return undefined;
    // A format that was changed is read anew.
    const key = `${id}@${documents.changed}`;
    const known = this.#formats.get(key);
    if (known !== undefined) return known ?? undefined;
    queueMicrotask(() => {
      if (this.#formats.has(key)) return;
      this.#formats.set(key, null);
      documents
        .format(id)
        .then((format) => this.#formats.set(key, format))
        .catch(() => {});
    });
    return undefined;
  }

  countingOf(project: Project, at: string): Counting {
    return countingOf(this.formatOf(project, at), project.documentOf(at).settings.language);
  }

  /**
   * The numbers of the document of an element, as they are now. Read where
   * they are shown: what reads them is told when they have changed, and
   * only then.
   *
   * They are counted once for every change of the project, however many
   * figures, equations and words that point read them, and the same object
   * is given out until the numbers themselves are different. A word typed
   * in a paragraph changes the project but no number, and what shows one is
   * not done again: read with the project's revision, as they were, every
   * figure, table, equation and pointer on the screen, and every text shown
   * with them, was worked out again for every keystroke anywhere.
   */
  of(project: Project, at: string): Numbers {
    let byElement = this.#counted.get(project);
    if (!byElement) this.#counted.set(project, (byElement = new Map()));
    let counted = byElement.get(at);
    if (!counted) {
      if (byElement.size > 40) byElement.clear();
      byElement.set(at, (counted = new Counted(project, at, this)));
    }
    return counted.read();
  }
}

/** The numbers of the document of one element, counted when the project has changed, and given out until they are different. */
class Counted {
  readonly #project: Project;
  readonly #at: string;
  readonly #numbering: Numbering;
  #numbers: Numbers | undefined;
  /** The revision of the project, and what of the format, they were counted with. */
  #mark = '';
  /** The numbers those who follow them were last told of. */
  #told: Numbers | undefined;
  /** Follows them, for an effect or a derived that reads them: told when they are different. */
  readonly #follow: () => void;

  constructor(project: Project, at: string, numbering: Numbering) {
    this.#project = project;
    this.#at = at;
    this.#numbering = numbering;
    // While anything follows them, they are counted once for all that
    // changed at a moment, and those who follow are told only where the
    // numbers came out different.
    this.#follow = createSubscriber((tell) =>
      project.onChange(() => {
        const numbers = this.#count(untrack(() => numbering.countingOf(project, at)));
        if (numbers === this.#told) return;
        this.#told = numbers;
        tell();
      }),
    );
  }

  read(): Numbers {
    this.#follow();
    // Followed itself: a format read later, or changed, counts them anew.
    const counting = this.#numbering.countingOf(this.#project, this.#at);
    // Counted here as well, where the project has changed since: what reads
    // them at once, before those who follow are told, has them as they are.
    const numbers = this.#count(counting);
    this.#told ??= numbers;
    return numbers;
  }

  #count(counting: Counting): Numbers {
    return untrack(() => {
      const mark = `${this.#project.revision}:${this.#project.structure}:${countingMark(counting)}`;
      if (this.#numbers && mark === this.#mark) return this.#numbers;
      this.#mark = mark;
      const now = count(this.#project, this.#at, counting);
      if (!this.#numbers || !sameNumbers(this.#numbers, now)) this.#numbers = now;
      return this.#numbers;
    });
  }
}

/** What of the format the numbers depend on. */
const countingMark = (c: Counting) =>
  `${c.numberedHeadings}:${c.runIn}:${c.deepest}:${c.label}:${c.tableLabel}`;

export const numbering = new Numbering();
