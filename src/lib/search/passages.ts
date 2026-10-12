/**
 * What a search reads of a text: its passages. See ADR 0017.
 *
 * A passage is a line of text as the writer wrote it: the name of an
 * element, a paragraph (of whatever kind, in a cell as well), what is
 * said of a figure or a table, the text of a note, and the formula of an
 * equation. The passages of a text are numbered in the order they are read,
 * and a note is read right after the passage it stands in, so that every
 * reader of the same text numbers them alike: this one, which reads the
 * text as `model/text.ts` gives it, `editors.ts`, which reads an editor, and
 * `replacing.ts`, which reads the project where it keeps the text.
 *
 * What is not text (a citation, a formula, words that point, a note) stands
 * in a passage as one sign, U+FFFC, and nothing matches across it. Where
 * what stands outside the text is taken in, a citation stands as it is
 * shown, a formula as it is written in TeX, and words that point as what
 * they say; a note is one sign still, since its text is a passage of its own.
 *
 * Where a search crosses paragraphs (ADR 0033), the lines of a text that
 * follow one another are read as one, joined by a paragraph separator
 * (`joined`). The name, a note, an equation, what is said of a figure or a
 * table and the paragraphs of a cell stand apart, and are never joined.
 */

import type { CiteItem, CiteMode } from '$lib/editor/schema';
import type { Block, Inline, RefForm } from '$lib/project/model/text';

/** What stands in a passage for what is not text. */
export const NO_TEXT = '￼';

/** What stands between paragraphs that are read as one: the paragraph separator, U+2029. */
export const PARAGRAPH = '\u2029';

/** How what stands outside the text is shown, where it is taken in. */
export interface Labels {
  citation(items: CiteItem[], mode: CiteMode): string;
  crossref(target: string, form: RefForm): string;
}

export type PieceKind = 'text' | 'break' | 'citation' | 'math' | 'crossref' | 'note';

/** A part of a passage: a run of text, or one thing that is not text. */
export interface Piece {
  kind: PieceKind;
  /** Where it begins in the text of the passage. */
  start: number;
  length: number;
}

export interface Passage {
  /** Its place among the passages of the name, or of the text, in the order they are read. */
  index: number;
  /** A line of text, the text of a note, or the formula of an equation. */
  kind: 'line' | 'note' | 'equation';
  text: string;
  pieces: Piece[];
  /** Of a note: the passage it stands in, and where in it. */
  within?: { passage: number; at: number };
  /** Of a line that is never joined to those around it: what is said of a figure or a table, a cell. */
  apart?: true;
  /** A line that begins a run of its own, as the first of a side of a parallel text does. */
  parted?: true;
}

/** The citations of a text as the reader sees them: only those that name a work. */
export function citedItems(items: unknown): CiteItem[] {
  return Array.isArray(items)
    ? (items as CiteItem[]).filter((i) => i && typeof i.id === 'string')
    : [];
}

/**
 * Makes passages one after the other. Each reader (of blocks, of an editor,
 * of the project) tells it what it meets, in the order it meets it.
 */
export class PassageMaker<Ref = undefined> {
  readonly passages: Passage[] = [];
  /** What each piece is, where the reader needs to find it again: by passage, by piece. */
  readonly refs: Ref[][] = [];
  readonly labels: Labels | null;
  /** How deep in the cells of tables the reader is: the lines there stand apart. */
  inCells = 0;
  /** Whether the next line begins a run of its own: see `part`. */
  #parted = false;

  constructor(labels: Labels | null) {
    this.labels = labels;
  }

  /**
   * Parts the lines before from those after, in a search across paragraphs:
   * the sides of a parallel text are each read by themselves, and what
   * follows the parallel text is not joined to its last side.
   */
  part() {
    this.#parted = true;
  }

  /** Begins a passage; with `apart`, a line that is never joined to others. */
  begin(kind: Passage['kind'], within?: Passage['within'], apart = false): Passage {
    const passage: Passage = {
      index: this.passages.length,
      kind,
      text: '',
      pieces: [],
      ...(within ? { within } : {}),
      ...(kind === 'line' && (apart || this.inCells > 0) ? { apart: true as const } : {}),
      ...(kind === 'line' && this.#parted ? { parted: true as const } : {}),
    };
    if (kind === 'line') this.#parted = false;
    this.passages.push(passage);
    this.refs.push([]);
    return passage;
  }

  /** Adds a piece to a passage. What is empty is not a piece. */
  put(passage: Passage, kind: PieceKind, text: string, ref?: Ref) {
    if (!text) return;
    passage.pieces.push({ kind, start: passage.text.length, length: text.length });
    this.refs[passage.index].push(ref as Ref);
    passage.text += text;
  }

  /** What stands for a citation. */
  citation(items: unknown, mode: unknown): string {
    return this.labels
      ? this.labels.citation(citedItems(items), mode === 'intext' ? 'intext' : 'normal')
      : NO_TEXT;
  }

  /** What stands for a formula, in the line or by itself. */
  math(tex: string): string {
    return this.labels ? tex : NO_TEXT;
  }

  /** What stands for words that point. */
  crossref(target: string, form: RefForm): string {
    return this.labels ? this.labels.crossref(target, form) || '?' : NO_TEXT;
  }

  /** Begins the passage of an equation, which is its formula where that is taken in, and nothing otherwise. */
  equation(tex: string, ref?: Ref): Passage {
    const passage = this.begin('equation');
    if (this.labels) this.put(passage, 'math', tex, ref);
    return passage;
  }
}

/** Reads the passages of a line of inline content, and of the notes in it after it. */
function line(
  maker: PassageMaker,
  inlines: Inline[],
  kind: 'line' | 'note',
  within?: Passage['within'],
  said = false,
): void {
  const passage = maker.begin(kind, within, said);
  const notes: { content: Inline[]; at: number }[] = [];
  for (const i of inlines) {
    switch (i.kind) {
      case 'text':
        maker.put(passage, 'text', i.text);
        break;
      case 'break':
        maker.put(passage, 'break', '\n');
        break;
      case 'citation':
        maker.put(passage, 'citation', maker.citation(i.items, i.mode));
        break;
      case 'math':
        maker.put(passage, 'math', maker.math(i.tex));
        break;
      case 'crossref':
        maker.put(passage, 'crossref', maker.crossref(i.target, i.form));
        break;
      case 'footnote':
        // What is said of a figure or a table holds no note.
        if (said) break;
        maker.put(passage, 'note', NO_TEXT);
        // A note within a note is not a thing: it is read as nothing more.
        if (kind === 'line') notes.push({ content: i.content, at: passage.text.length - 1 });
        break;
    }
  }
  for (const n of notes)
    line(maker, n.content, 'note', { passage: passage.index, at: n.at }, false);
}

function blocks(maker: PassageMaker, list: Block[]): void {
  for (const b of list) {
    switch (b.kind) {
      case 'paragraph':
        line(maker, b.content, 'line');
        break;
      case 'parallel':
        maker.part();
        blocks(maker, b.left);
        maker.part();
        blocks(maker, b.right);
        maker.part();
        break;
      case 'figure':
        line(maker, b.caption, 'line', undefined, true);
        break;
      case 'table':
        line(maker, b.caption, 'line', undefined, true);
        maker.inCells++;
        for (const row of b.rows) for (const cell of row) blocks(maker, cell.content);
        maker.inCells--;
        break;
      case 'equation':
        maker.equation(b.tex);
        break;
      case 'row':
        blocks(maker, b.items);
        break;
    }
  }
}

/** The passages of the text of an element, from its blocks. */
export function bodyPassages(list: Block[], labels: Labels | null = null): Passage[] {
  const maker = new PassageMaker(labels);
  blocks(maker, list);
  return maker.passages;
}

/** The passage of the name of an element. */
export function titlePassage(inlines: Inline[]): Passage {
  const maker = new PassageMaker(null);
  line(maker, inlines, 'line');
  return maker.passages[0];
}

/** Lines read as one, where a search crosses paragraphs. */
export interface Joined {
  /** The texts of the passages, with a paragraph separator between each and the next. */
  text: string;
  /** The passages, in order. */
  passages: Passage[];
  /** Where each passage begins in the text. */
  starts: number[];
}

/**
 * The passages of a text as a search across paragraphs reads them: the
 * lines that follow one another as one, and what stands apart by itself. A
 * note is read by itself, and does not part the lines around it, since it
 * stands within one of them.
 */
export function joined(passages: Passage[]): Joined[] {
  const out: Joined[] = [];
  let run: Joined | null = null;
  for (const p of passages) {
    if (p.kind === 'note') {
      out.push({ text: p.text, passages: [p], starts: [0] });
      continue;
    }
    if (p.parted) run = null;
    if (p.kind !== 'line' || p.apart) {
      run = null;
      out.push({ text: p.text, passages: [p], starts: [0] });
      continue;
    }
    if (run) {
      run.text += PARAGRAPH;
      run.starts.push(run.text.length);
      run.passages.push(p);
      run.text += p.text;
    } else {
      run = { text: p.text, passages: [p], starts: [0] };
      out.push(run);
    }
  }
  return out;
}

/**
 * Which passage of lines read as one a place in them is in, and where in
 * it. A place just after a paragraph separator is at the beginning of the
 * passage after it; one just before, at the end of the passage before.
 */
export function placeIn(j: Joined, offset: number): { passage: number; offset: number } {
  let low = 0;
  let high = j.starts.length - 1;
  while (low < high) {
    const mid = (low + high + 1) >> 1;
    if (j.starts[mid] <= offset) low = mid;
    else high = mid - 1;
  }
  return { passage: j.passages[low].index, offset: offset - j.starts[low] };
}

/** Which piece of a passage a place in it is in: the last that begins at or before it. */
export function pieceAt(passage: Passage, offset: number): number {
  let low = 0;
  let high = passage.pieces.length - 1;
  while (low < high) {
    const mid = (low + high + 1) >> 1;
    if (passage.pieces[mid].start <= offset) low = mid;
    else high = mid - 1;
  }
  return low;
}

/**
 * A place of a passage read without what stands outside the text, in the
 * same passage read with it: the pieces are the same, and only what is no
 * text is longer.
 */
export function translate(plain: Passage, shown: Passage, offset: number): number {
  if (!plain.pieces.length || plain.pieces.length !== shown.pieces.length) return offset;
  const k = pieceAt(plain, offset);
  const a = plain.pieces[k];
  const b = shown.pieces[k];
  if (a.kind === 'text' || a.kind === 'break')
    return b.start + Math.min(offset - a.start, b.length);
  return offset <= a.start ? b.start : b.start + b.length;
}
