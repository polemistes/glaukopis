/**
 * The numbers that figures, equations and the parts of a document have, and
 * what the document calls them.
 *
 * A number belongs to a document, and a document is a map: the same figure
 * is the second in one map and the fifth in a map that has the first in the
 * place of one of its elements. The numbers are counted as they are when
 * the document is made (`crates/core/src/document/pandoc.rs`), from what is
 * kept of each element, without reading the texts.
 */

import { SvelteMap } from 'svelte/reactivity';
import type { DocumentFormat } from '$lib/api/documents';
import { documents } from '$lib/preview/documents.svelte';
import { walkDocument } from '$lib/project/model/document';
import type { Project } from '$lib/project/model/project.svelte';
import type { RefForm } from '$lib/project/model/text';

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

export function countingOf(format: DocumentFormat | undefined): Counting {
  if (!format) return PLAIN;
  const levels = format.headings?.levels ?? [];
  return {
    numberedHeadings: !!format.headings?.numbered,
    runIn: levels.flatMap((l, i) => (l.runIn ? [i + 1] : [])),
    deepest: Math.min(6, Math.max(1, levels.length)),
    label: format.figures?.label ?? PLAIN.label,
    reference: format.figures?.reference ?? '',
    separator: format.figures?.separator ?? PLAIN.separator,
    tableLabel: format.tables?.label ?? PLAIN.tableLabel,
    tableReference: format.tables?.reference ?? '',
    tableSeparator: format.tables?.separator ?? PLAIN.tableSeparator,
    before: format.equations?.beforeNumber ?? PLAIN.before,
    after: format.equations?.afterNumber ?? PLAIN.after,
  };
}

/** Counts through the document of a map. */
export function count(project: Project, mapId: string, counting: Counting = PLAIN): Numbers {
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

  walkDocument(project, mapId, (placed) => {
    const node = project.node(placed.id);
    if (!node) return;
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
    // The same element may stand twice in a document, where a map stands in
    // the place of an element of another: its numbers are those of the first.
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

/** The forms words can point by, for each kind, with what each is called. */
export function formsOf(kind: PointedKind, numbered: boolean): { form: RefForm; label: string }[] {
  switch (kind) {
    case 'figure':
    case 'table':
      return [
        { form: 'full', label: 'The word and the number' },
        { form: 'number', label: 'The number alone' },
      ];
    case 'equation':
      return [
        { form: 'full', label: 'The number as it stands by the equation' },
        { form: 'number', label: 'The number alone' },
      ];
    case 'part':
      return numbered
        ? [
            { form: 'full', label: 'Its number' },
            { form: 'name', label: 'Its name' },
          ]
        : [{ form: 'full', label: 'Its name' }];
  }
}

class Numbering {
  /** The formats that have been read, by their ids. */
  readonly #formats = new SvelteMap<string, DocumentFormat | null>();
  #counted = new Map<string, { at: string; numbers: Numbers }>();

  /** The format of the document of a map, when it has been read; it is asked for when it has not. */
  formatOf(project: Project, mapId: string): DocumentFormat | undefined {
    const id = documents.choice(project.map(mapId)?.document ?? {}).format;
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

  countingOf(project: Project, mapId: string): Counting {
    return countingOf(this.formatOf(project, mapId));
  }

  /**
   * The numbers of the document of a map, as they are now. Read where they
   * are shown: what reads them is told when the project has changed.
   */
  of(project: Project, mapId: string): Numbers {
    const counting = this.countingOf(project, mapId);
    const at = `${project.revision}:${project.structure}:${counting.numberedHeadings}:${counting.runIn}:${counting.deepest}`;
    const known = this.#counted.get(mapId);
    if (known && known.at === at) return known.numbers;
    const numbers = count(project, mapId, counting);
    if (this.#counted.size > 40) this.#counted.clear();
    this.#counted.set(mapId, { at, numbers });
    return numbers;
  }
}

export const numbering = new Numbering();
