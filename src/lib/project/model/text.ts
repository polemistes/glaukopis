/**
 * Reading the text of elements straight from the project document, without an
 * editor. The shape is that of `editor/schema.ts`, as y-prosemirror stores it:
 * nodes are XML elements named after their type, text is XML text whose
 * formatting attributes are the marks.
 *
 * A text is paragraphs, each of a kind and with the settings of the stretch
 * it stands in, holding lines parted by line breaks, with a line mark at the
 * start of a line where the writer said something of it; page and column
 * breaks; and what is not text: figures, formulas, tables, rows and texts
 * side by side (ADR 0041). Old shapes are not read well, only without
 * falling over: a `passage` is read as the paragraphs it holds, standing
 * where it stands, and the number, count and margin an old paragraph kept
 * become a line mark at its start. Nothing here reads the words of the
 * interface: it runs in the thread of the search as well.
 */

import * as Y from 'yjs';
import {
  figureWidth,
  flow,
  stand,
  tableWidth,
  type CiteItem,
  type CiteMode,
} from '$lib/editor/schema';
import {
  factsOf,
  NUMBERINGS,
  renamed,
  type BasedKind,
  type Numbering,
  type Side,
} from './families';

export interface InlineText {
  kind: 'text';
  text: string;
  marks: Record<string, Record<string, unknown> | true>;
}
export interface InlineCitation {
  kind: 'citation';
  items: CiteItem[];
  mode: CiteMode;
}
export interface InlineFootnote {
  kind: 'footnote';
  content: Inline[];
  /** Where the note stands, when not where the format has its notes. */
  place?: 'foot' | 'end';
}
export interface InlineBreak {
  kind: 'break';
}
/** Mathematics in the line, in the notation of TeX. */
export interface InlineMath {
  kind: 'math';
  tex: string;
}
/** How words point to what they point to. */
export type RefForm = 'full' | 'number' | 'name';
/**
 * Words that point to something that stands in the document: a figure, an
 * equation, or a part of it. What they say is what the document calls it.
 */
export interface InlineCrossRef {
  kind: 'crossref';
  /** The id of the figure or the equation, or of the element the part is made from. */
  target: string;
  form: RefForm;
}
/**
 * A reference mark: a verse of the Bible, a page of Stephanus, a number of
 * Bekker. No part of the words; the layout says how it is set.
 */
export interface InlineRefMark {
  kind: 'refmark';
  label: string;
}
/**
 * What the writer said of one line by hand, where lines are numbered (ADR
 * 0041): a mark at the start of the line — the first thing in its
 * paragraph, or the first after a line break. A number or label given by
 * hand, from which the count goes on (`lines.ts`); `counted: false` for a
 * line the count passes over; `hidden: true` for one that is counted and
 * never shows its number, `shown: true` for one that always does (never
 * both); words in the margin, the annotation; the line's indent, for verse;
 * and `continues: true` for a line that begins where the line before ended,
 * as the second part of a line shared by two speakers (ADR 0067). What is
 * not said is left out. A mark that says nothing is not written.
 */
export interface InlineLineMark {
  kind: 'linemark';
  number?: string;
  counted?: false;
  hidden?: true;
  shown?: true;
  margin?: string;
  indent?: number;
  continues?: true;
}
export type Inline =
  | InlineText
  | InlineCitation
  | InlineFootnote
  | InlineBreak
  | InlineMath
  | InlineCrossRef
  | InlineRefMark
  | InlineLineMark;

export function refForm(value: unknown): RefForm {
  return value === 'number' || value === 'name' ? value : 'full';
}

/** Where something stands, when it is not where the format has it: see `editor/schema.ts`. */
export type Stand = 'left' | 'center' | 'right';

/**
 * A paragraph, of a kind (ADR 0041). `name` is the id of its kind, `text`
 * for plain text; `indent` its steps of indentation, for items of lists and
 * any paragraph that is indented. A paragraph is lines, parted by line
 * breaks (`InlineBreak`); what is said of one line stands in a line mark at
 * its start. `numbering`, `every`, `side` and `only` are the settings of
 * the stretch it stands in: consecutive paragraphs with the same settings
 * are one stretch, numbered together, whatever their kinds (`lines.ts`).
 * `new` begins a new run of its kind, where two runs of one kind stand
 * together. What is not said is left out when written.
 */
export interface ParagraphBlock {
  kind: 'paragraph';
  name: string;
  indent: number;
  /** Absent for a paragraph that is not numbered. */
  numbering?: Numbering;
  /** Every how many a number shows; absent for the layout's. */
  every?: number;
  /** The side the numbers stand on; absent for the layout's. */
  side?: Side;
  /** The one kind whose lines are counted, by its id; absent for every kind that is counted. */
  only?: string;
  /** The number the count of the stretch begins from, taken up at its first counted line; absent where it begins at the first number given. */
  from?: string;
  /** Begins a new run of its kind. */
  new?: true;
  content: Inline[];
}

/** A break of the page or of the column: the next text stands at the top of the next. */
export interface BreakBlock {
  kind: 'break';
  what: 'page' | 'column';
}

/** A picture with what is said of it. The picture is a file of the project. */
export interface FigureBlock {
  kind: 'figure';
  /** By which words in the text point to it. */
  id: string;
  /** Where it stands, when not where the format has figures. */
  align?: Stand;
  /** Whether the text flows around it, when not as the format says. */
  wrap?: boolean;
  /** The SHA-256 of what the file holds. */
  file: string;
  extension: string;
  name: string;
  caption: Inline[];
  alt: string;
  /** In hundredths of the width of the text. */
  width: number;
  numbered: boolean;
}

export interface EquationBlock {
  kind: 'equation';
  id: string;
  tex: string;
  numbered: boolean;
  align?: Stand;
}

/** Two texts side by side: an original and its translation. Each side holds paragraphs. */
export interface ParallelBlock {
  kind: 'parallel';
  left: Block[];
  right: Block[];
}

/** Figures, tables and equations that stand beside each other. */
export interface RowBlock {
  kind: 'row';
  items: Block[];
}

export type Block =
  ParagraphBlock | BreakBlock | ParallelBlock | EquationBlock | FigureBlock | TableBlock | RowBlock;

/** A cell of a table. */
export interface TableCell {
  content: Block[];
  colspan: number;
  rowspan: number;
  /** Whether it is a heading of its column or its row. */
  header: boolean;
  align?: Stand;
}

/** A table, with what is said of it. */
export interface TableBlock {
  kind: 'table';
  id: string;
  caption: Inline[];
  rows: TableCell[][];
  numbered: boolean;
  align?: Stand;
  wrap?: boolean;
  /** In hundredths of the width of the text; nought for as wide as it needs to be. */
  width: number;
}

/**
 * Something that stands in a text by itself and may have a number in the
 * document: a figure or an equation. Kept with each element, in the order
 * they stand in, so that they can be numbered without reading the texts.
 */
export interface SetOff {
  kind: 'figure' | 'equation' | 'table';
  id: string;
  numbered: boolean;
  /** What tells it from the others, in words: what is said of a figure, the formula of an equation. */
  words: string;
  /** Of a figure: its picture. */
  file?: string;
  extension?: string;
  name?: string;
}

/** A paragraph of a kind, with what is said of it beyond its words. */
export function paragraph(
  content: Inline[],
  name = 'text',
  more:
    | Pick<ParagraphBlock, 'indent' | 'numbering' | 'every' | 'side' | 'only' | 'from' | 'new'>
    | number = 0,
): ParagraphBlock {
  const said = typeof more === 'number' ? { indent: more } : more;
  return {
    kind: 'paragraph',
    name,
    indent: said.indent ?? 0,
    ...(said.numbering && said.numbering !== 'none' ? { numbering: said.numbering } : {}),
    ...(said.every ? { every: said.every } : {}),
    ...(said.side ? { side: said.side } : {}),
    ...(said.only ? { only: said.only } : {}),
    ...(said.from ? { from: said.from } : {}),
    ...(said.new ? { new: true as const } : {}),
    content,
  };
}

/** A line mark that says what is given; nothing said, nothing written but the kind. */
export function linemark(said: Omit<InlineLineMark, 'kind'> = {}): InlineLineMark {
  return {
    kind: 'linemark',
    ...(said.number?.trim() ? { number: said.number.trim() } : {}),
    ...(said.counted === false ? { counted: false as const } : {}),
    ...(said.hidden ? { hidden: true as const } : {}),
    ...(said.shown && !said.hidden ? { shown: true as const } : {}),
    ...(said.margin?.trim() ? { margin: said.margin.trim() } : {}),
    ...(said.indent ? { indent: said.indent } : {}),
    ...(said.continues ? { continues: true as const } : {}),
  };
}

/** Whether a line mark says anything. */
export const saysAnything = (m: InlineLineMark): boolean =>
  !!(m.number || m.counted === false || m.hidden || m.shown || m.margin || m.indent || m.continues);

/** A break of the page or of the column. */
export function pagebreak(what: BreakBlock['what'] = 'page'): BreakBlock {
  return { kind: 'break', what };
}

/** Steps of indentation as they are kept: none to eight. */
export function indentOf(value: unknown): number {
  return Math.max(0, Math.min(8, Math.round(Number(value)) || 0));
}

export function numberingOf(value: unknown): Numbering {
  return NUMBERINGS.find((n) => n === value) ?? 'none';
}

export function sideOf(value: unknown): Side | null {
  return value === 'left' || value === 'right' ? value : null;
}

/** Every how many a number is shown, where the passage says so; nothing for the layout's. */
export function everyOf(value: unknown): number | null {
  const n = Math.round(Number(value));
  return Number.isFinite(n) && n > 0 && value !== null && value !== undefined && value !== ''
    ? n
    : null;
}

const text = (value: unknown): string => (typeof value === 'string' ? value : '');

/**
 * The name of a mark as the schema has it. y-prosemirror keeps a mark that may
 * overlap itself under its name and eight signs after `--`; raised and lowered
 * text were once kept so.
 */
function plainMark(name: string): string {
  return /^(.*)--[a-zA-Z0-9+/=]{8}$/.exec(name)?.[1] ?? name;
}

function inlinesOf(parent: Y.XmlElement | Y.XmlFragment): Inline[] {
  const out: Inline[] = [];
  for (const child of parent.toArray()) {
    if (child instanceof Y.XmlText) {
      for (const op of child.toDelta() as {
        insert: unknown;
        attributes?: Record<string, unknown>;
      }[]) {
        if (typeof op.insert !== 'string' || !op.insert) continue;
        const marks: InlineText['marks'] = {};
        for (const [name, value] of Object.entries(op.attributes ?? {})) {
          if (value == null || value === false) continue;
          marks[plainMark(name)] =
            typeof value === 'object' ? (value as Record<string, unknown>) : true;
        }
        out.push({ kind: 'text', text: op.insert, marks });
      }
    } else if (child instanceof Y.XmlElement) {
      switch (child.nodeName) {
        case 'citation': {
          const items = child.getAttribute('items') as unknown;
          out.push({
            kind: 'citation',
            items: Array.isArray(items)
              ? (items as CiteItem[]).filter((i) => i && typeof i.id === 'string')
              : [],
            mode: (child.getAttribute('mode') as unknown) === 'intext' ? 'intext' : 'normal',
          });
          break;
        }
        case 'footnote': {
          const place = child.getAttribute('place') as unknown;
          out.push({
            kind: 'footnote',
            content: inlinesOf(child),
            ...(place === 'foot' || place === 'end' ? { place } : {}),
          });
          break;
        }
        case 'hard_break':
          out.push({ kind: 'break' });
          break;
        case 'math': {
          const tex = text(child.getAttribute('tex') as unknown).trim();
          if (tex) out.push({ kind: 'math', tex });
          break;
        }
        case 'crossref': {
          const target = text(child.getAttribute('target') as unknown);
          if (target)
            out.push({ kind: 'crossref', target, form: refForm(child.getAttribute('form')) });
          break;
        }
        case 'refmark': {
          const label = text(child.getAttribute('label') as unknown).trim();
          if (label) out.push({ kind: 'refmark', label });
          break;
        }
        case 'linemark':
          out.push(lineMarkOf(child));
          break;
        default:
          out.push(...inlinesOf(child));
      }
    }
  }
  return out;
}

const elementsOf = (parent: Y.XmlElement | Y.XmlFragment): Y.XmlElement[] =>
  parent.toArray().filter((c): c is Y.XmlElement => c instanceof Y.XmlElement);

/** What a line mark, or an old paragraph, says of its line: the defaults left out. */
function saidOf(el: Y.XmlElement): Omit<InlineLineMark, 'kind' | 'indent'> {
  return {
    number: text(el.getAttribute('number') as unknown),
    ...((el.getAttribute('counted') as unknown) === false ? { counted: false as const } : {}),
    ...((el.getAttribute('hidden') as unknown) === true ? { hidden: true as const } : {}),
    ...((el.getAttribute('shown') as unknown) === true ? { shown: true as const } : {}),
    ...((el.getAttribute('continues') as unknown) === true ? { continues: true as const } : {}),
    margin: text(el.getAttribute('margin') as unknown),
  };
}

/** A line mark from the element y-prosemirror keeps it in. */
function lineMarkOf(el: Y.XmlElement): InlineLineMark {
  return linemark({ ...saidOf(el), indent: indentOf(el.getAttribute('indent') as unknown) });
}

/**
 * A paragraph from an element that holds inline content, with what is said
 * of it: its kind, its indent, and the settings of the stretch it stands in.
 * A paragraph of the shape before kept a number, whether it was counted,
 * whether its number was hidden and its margin words on itself: those
 * become a line mark at its start, where it has none.
 */
function paragraphOf(el: Y.XmlElement): ParagraphBlock {
  const name = renamed(text(el.getAttribute('kind') as unknown).trim()) || 'text';
  const content = inlinesOf(el);
  const old = linemark(saidOf(el));
  if (saysAnything(old) && content[0]?.kind !== 'linemark') content.unshift(old);
  return paragraph(content, name, {
    indent: indentOf(el.getAttribute('indent') as unknown),
    numbering: numberingOf(el.getAttribute('numbering') as unknown),
    every: everyOf(el.getAttribute('every') as unknown) ?? undefined,
    side: sideOf(el.getAttribute('side') as unknown) ?? undefined,
    only: text(el.getAttribute('only') as unknown).trim() || undefined,
    new: (el.getAttribute('new') as unknown) === true ? true : undefined,
  });
}

/** The blocks an element of a text stands for. */
function blocksOfElement(child: Y.XmlElement): Block[] {
  switch (child.nodeName) {
    case 'paragraph':
    case 'title':
      return [paragraphOf(child)];
    case 'passage':
      // A passage as texts were once written: what it holds, standing where it stands.
      if (child.toArray().some((c) => c instanceof Y.XmlElement && c.nodeName === 'paragraph'))
        return blocksOf(child);
      return [paragraph(inlinesOf(child))];
    case 'pagebreak':
      return [pagebreak((child.getAttribute('what') as unknown) === 'column' ? 'column' : 'page')];
    case 'parallel': {
      const sides = elementsOf(child).filter((c) => c.nodeName === 'parallel_side');
      return [
        {
          kind: 'parallel',
          left: sides[0] ? blocksOf(sides[0]) : [],
          right: sides[1] ? blocksOf(sides[1]) : [],
        },
      ];
    }
    case 'equation': {
      const tex = text(child.getAttribute('tex') as unknown).trim();
      const to = stand(child.getAttribute('align') as unknown);
      if (!tex) return [];
      return [
        {
          kind: 'equation',
          id: text(child.getAttribute('id') as unknown),
          tex,
          numbered: !!child.getAttribute('numbered'),
          ...(to ? { align: to } : {}),
        },
      ];
    }
    case 'tabular': {
      const parts = elementsOf(child);
      const said = parts.find((c) => c.nodeName === 'table_caption');
      const table = parts.find((c) => c.nodeName === 'table');
      const rows = (table ? elementsOf(table) : [])
        .map((row) =>
          elementsOf(row).map((cell): TableCell => {
            const to = stand(cell.getAttribute('align') as unknown);
            return {
              // A cell holds paragraphs, of whatever kind.
              content: blocksOf(cell),
              colspan: Math.max(1, Number(cell.getAttribute('colspan') as unknown) || 1),
              rowspan: Math.max(1, Number(cell.getAttribute('rowspan') as unknown) || 1),
              header: cell.nodeName === 'table_header',
              ...(to ? { align: to } : {}),
            };
          }),
        )
        .filter((row) => row.length);
      if (!rows.length) return [];
      const to = stand(child.getAttribute('align') as unknown);
      const around = flow(child.getAttribute('flow') as unknown);
      return [
        {
          kind: 'table',
          id: text(child.getAttribute('id') as unknown),
          caption: said ? inlinesOf(said).filter((i) => i.kind !== 'footnote') : [],
          rows,
          numbered: (child.getAttribute('numbered') as unknown) !== false,
          width: tableWidth(child.getAttribute('width') as unknown),
          ...(to ? { align: to } : {}),
          ...(around ? { wrap: around === 'around' } : {}),
        },
      ];
    }
    case 'row': {
      const items = blocksOf(child);
      // One alone stands as it would without the row.
      if (items.length === 1) return items;
      return items.length ? [{ kind: 'row', items }] : [];
    }
    case 'figure': {
      const to = stand(child.getAttribute('align') as unknown);
      const around = flow(child.getAttribute('flow') as unknown);
      return [
        {
          kind: 'figure',
          ...(to ? { align: to } : {}),
          ...(around ? { wrap: around === 'around' } : {}),
          id: text(child.getAttribute('id') as unknown),
          file: text(child.getAttribute('file') as unknown),
          extension: text(child.getAttribute('extension') as unknown),
          name: text(child.getAttribute('name') as unknown),
          // A note cannot stand in what is said of a figure.
          caption: inlinesOf(child).filter((i) => i.kind !== 'footnote'),
          alt: text(child.getAttribute('alt') as unknown),
          width: figureWidth(child.getAttribute('width') as unknown),
          numbered: (child.getAttribute('numbered') as unknown) !== false,
        },
      ];
    }
    default:
      // Something a later version added, or an earlier one had: keep its text.
      return [paragraph(inlinesOf(child))];
  }
}

/** The blocks of the elements a part of a text holds, in order. */
function blocksOf(parent: Y.XmlElement | Y.XmlFragment): Block[] {
  return elementsOf(parent).flatMap(blocksOfElement);
}

/**
 * The text of an element as blocks. Empty paragraphs of text at the end are
 * dropped. `own`, the kinds of paragraph of the writer's own, are not needed
 * to read a text any more, and are taken for the callers that give them.
 */
export function readBody(
  fragment: Y.XmlFragment | undefined,
  own: readonly BasedKind[] = [],
): Block[] {
  if (!fragment) return [];
  return trimmed(blocksOf(fragment));
}

/** The blocks, without the empty paragraphs of text at the end. */
function trimmed(blocks: Block[]): Block[] {
  while (blocks.length) {
    const last = blocks[blocks.length - 1];
    if (last.kind === 'paragraph' && last.name === 'text' && !last.content.length) blocks.pop();
    else break;
  }
  return blocks;
}

/**
 * The texts of elements, read again after a change part by part: what each
 * part at the top of a text reads as (a paragraph, a table, a figure), and
 * its facts, are kept with the part until a change within it is told
 * (`changed`). So a keystroke in a long text reads again the paragraph
 * written in, and not the whole text: reading all of it, with its facts, on
 * every keystroke took some 38 ms in a text of 2000 paragraphs. What is
 * read is what `readBody` and `bodyFacts` give for the whole text.
 */
export class BodyReading {
  #parts = new WeakMap<Y.XmlElement, { blocks: Block[]; facts: BodyFacts }>();

  /**
   * Something within a part at the top of a text has changed, or the part
   * itself: it is read again. A change of the text itself, a part put in or
   * taken out, needs no word: a part put in has not been read.
   */
  changed(part: Y.XmlElement) {
    this.#parts.delete(part);
  }

  read(fragment: Y.XmlFragment | undefined): { blocks: Block[]; facts: BodyFacts } {
    const blocks: Block[] = [];
    const facts: BodyFacts[] = [];
    for (const child of fragment ? elementsOf(fragment) : []) {
      let part = this.#parts.get(child);
      if (!part) {
        const own = blocksOfElement(child);
        part = { blocks: own, facts: bodyFacts(own) };
        this.#parts.set(child, part);
      }
      for (const b of part.blocks) blocks.push(b);
      facts.push(part.facts);
    }
    // The empty paragraphs at the end that are dropped say nothing of the facts.
    return { blocks: trimmed(blocks), facts: joinedFacts(facts) };
  }
}

/**
 * The kinds of the writer's own as the facts of kinds need them, from the
 * map the project keeps them in: for a reader that has no project, as the
 * search through projects on disk and the migration.
 */
export function readBasedKinds(map: Y.Map<unknown> | undefined): BasedKind[] {
  const out: BasedKind[] = [];
  if (!map) return out;
  for (const [id, k] of map) {
    if (!(k instanceof Y.Map)) continue;
    const basedOn = k.get('basedOn');
    out.push({ id, basedOn: typeof basedOn === 'string' ? basedOn : null });
  }
  return out;
}

/**
 * The kind of paragraph a text begins in when a kind is given: the kind as
 * it is now named; `text` for nothing, and for a kind of words only, which
 * no paragraph is of. `own` are the kinds of the writer's own.
 */
export function beginsIn(kind: string, own: readonly BasedKind[] = []): string {
  const id = renamed(kind.trim());
  if (!id || factsOf(id, own).grouping === 'words') return 'text';
  return id;
}

/** The name of an element as inline content. */
export function readTitle(fragment: Y.XmlFragment | undefined): Inline[] {
  if (!fragment) return [];
  return inlinesOf(fragment);
}

export function inlineText(inlines: Inline[], withNotes = false): string {
  let out = '';
  for (const i of inlines) {
    if (i.kind === 'text') out += i.text;
    else if (i.kind === 'break') out += '\n';
    else if (i.kind === 'math') out += i.tex;
    else if (i.kind === 'footnote' && withNotes) out += ` [${inlineText(i.content, true)}]`;
  }
  return out;
}

export function blocksText(blocks: Block[], withNotes = false): string {
  const parts: string[] = [];
  for (const b of blocks) {
    if (b.kind === 'paragraph') parts.push(inlineText(b.content, withNotes));
    else if (b.kind === 'parallel')
      parts.push(blocksText(b.left, withNotes), blocksText(b.right, withNotes));
    else if (b.kind === 'figure') parts.push(inlineText(b.caption, withNotes));
    else if (b.kind === 'equation') parts.push(b.tex);
    else if (b.kind === 'row') parts.push(blocksText(b.items, withNotes));
    else if (b.kind === 'table') {
      parts.push(inlineText(b.caption, withNotes));
      for (const row of b.rows)
        parts.push(row.map((cell) => blocksText(cell.content, withNotes)).join('\t'));
    }
  }
  return parts.join('\n');
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** A name as HTML, for the labels of the diagram: only the marks a name can have. */
export function titleHtml(inlines: Inline[]): string {
  let out = '';
  for (const i of inlines) {
    if (i.kind !== 'text') continue;
    let html = escapeHtml(i.text);
    if (i.marks.em) html = `<em>${html}</em>`;
    if (i.marks.smallcaps) html = `<span class="smallcaps">${html}</span>`;
    if (i.marks.sup) html = `<sup>${html}</sup>`;
    if (i.marks.sub) html = `<sub>${html}</sub>`;
    out += html;
  }
  return out;
}

/**
 * The words of a text: letters, digits and the marks set on them, in runs,
 * with apostrophes and hyphens inside them. The marks belong to the word:
 * a vowel sign of Hindi, the vowels of Arabic and Hebrew and an accent
 * written apart from its letter (as text from a PDF often has it) would
 * otherwise end the word at every syllable. The core counts by the same
 * rule (`count_words` in crates/core/src/import/document/convert.rs), and
 * the two are tested against the same texts in
 * crates/core/tests/fixtures/words.json.
 */
export function countWords(text: string): number {
  return text.match(WORD)?.length ?? 0;
}

const WORD = /[\p{Alphabetic}\p{N}\p{M}]+(?:['’\-][\p{Alphabetic}\p{N}\p{M}]+)*/gu;

export interface BodyFacts {
  /** The figures and equations, in the order they stand in. */
  set: SetOff[];
  /** Without text, and without anything else that is part of a document. */
  empty: boolean;
  words: number;
  /** Ids of the references cited, each once, in the order of first citation. */
  cited: string[];
  notes: number;
  /** The words that stand in notes, which are among the words. */
  noteWords: number;
  /**
   * The ids of the kinds of paragraph and of words the text uses, each
   * once, in the order of first use: the kinds of its paragraphs but text,
   * and the kinds of its words.
   */
  uses: string[];
}

/**
 * The facts of a text from those of its parts, in order, as `bodyFacts`
 * gives them of the whole: every block ends its text with a new line, so no
 * word runs from one part into the next, and the words are the sum.
 */
export function joinedFacts(parts: BodyFacts[]): BodyFacts {
  const set: SetOff[] = [];
  const cited = new Set<string>();
  const uses = new Set<string>();
  let empty = true;
  let words = 0;
  let notes = 0;
  let noteWords = 0;
  for (const f of parts) {
    for (const s of f.set) set.push(s);
    for (const id of f.cited) cited.add(id);
    for (const id of f.uses) uses.add(id);
    empty &&= f.empty;
    words += f.words;
    notes += f.notes;
    noteWords += f.noteWords;
  }
  return { set, empty, words, cited: [...cited], notes, noteWords, uses: [...uses] };
}

export function bodyFacts(blocks: Block[]): BodyFacts {
  const cited: string[] = [];
  const uses: string[] = [];
  const use = (id: unknown) => {
    if (typeof id === 'string' && id && id !== 'text' && !uses.includes(id)) uses.push(id);
  };
  let notes = 0;
  /** What the notes say. */
  let noted = '';
  /** Figures, formulas, tables and breaks: what is part of a document without being words. */
  let set = 0;
  const setOff: SetOff[] = [];
  let text = '';
  const visitInlines = (inlines: Inline[]) => {
    for (const i of inlines) {
      if (i.kind === 'text') {
        text += i.text;
        const kind = i.marks.kind;
        if (kind && typeof kind === 'object') use(kind.name);
      } else if (i.kind === 'break') text += ' ';
      else if (i.kind === 'math' || i.kind === 'crossref') {
        // A formula in the line stands for a word, and so do words that point.
        text += ' x ';
        set++;
      } else if (i.kind === 'citation') {
        for (const item of i.items) if (!cited.includes(item.id)) cited.push(item.id);
      } else if (i.kind === 'footnote') {
        notes++;
        text += ' ';
        const from = text.length;
        visitInlines(i.content);
        noted += ` ${text.slice(from)}`;
        text += ' ';
      }
    }
  };
  const visitParagraph = (p: ParagraphBlock) => {
    use(p.name);
    visitInlines(p.content);
  };
  const visit = (list: Block[]) => {
    for (const b of list) {
      if (b.kind === 'paragraph') visitParagraph(b);
      else if (b.kind === 'parallel') {
        visit(b.left);
        visit(b.right);
      } else if (b.kind === 'figure') {
        set++;
        setOff.push({
          kind: 'figure',
          id: b.id,
          numbered: b.numbered,
          words: inlineText(b.caption).trim(),
          file: b.file,
          extension: b.extension,
          name: b.name,
        });
        visitInlines(b.caption);
      } else if (b.kind === 'equation') {
        set++;
        setOff.push({ kind: 'equation', id: b.id, numbered: b.numbered, words: b.tex });
      } else if (b.kind === 'table') {
        set++;
        setOff.push({
          kind: 'table',
          id: b.id,
          numbered: b.numbered,
          words: inlineText(b.caption).trim(),
        });
        visitInlines(b.caption);
        text += '\n';
        for (const row of b.rows) for (const cell of row) visit(cell.content);
      } else if (b.kind === 'row') visit(b.items);
      // A page or column break is part of the document: an element that
      // holds only one is there to begin what follows on a new page, and
      // is not empty, to be hidden, removed by Backspace or filled anew.
      else if (b.kind === 'break') set++;
      text += '\n';
    }
  };
  visit(blocks);
  return {
    set: setOff,
    empty: !text.trim() && !cited.length && !notes && !set,
    words: countWords(text),
    cited,
    notes,
    noteWords: notes ? countWords(noted) : 0,
    uses,
  };
}

/** Makes the content of a name from plain text. */
export function fillTitle(fragment: Y.XmlFragment, text: string) {
  if (fragment.length) fragment.delete(0, fragment.length);
  const line = new Y.XmlElement('title');
  if (text) line.insert(0, [new Y.XmlText(text)]);
  fragment.insert(0, [line]);
}

/** An element of a paragraph of a kind, with plain words, as the editors write one. */
function paragraphElement(kind: string, words: string): Y.XmlElement {
  const el = new Y.XmlElement('paragraph');
  el.setAttribute('kind', kind);
  el.setAttribute('indent', 0 as unknown as string);
  if (words) el.insert(0, [new Y.XmlText(words)]);
  return el;
}

/**
 * Makes the content of a text from plain text: one paragraph to a line.
 * With `begins`, the kind of paragraph the text is written in: paragraphs
 * of that kind, and one empty one where there is no text, so that the
 * writing begins in it. `own` are the kinds of the writer's own.
 */
export function fillBody(
  fragment: Y.XmlFragment,
  text: string,
  begins = '',
  own: readonly BasedKind[] = [],
) {
  if (fragment.length) fragment.delete(0, fragment.length);
  const lines = text.split(/\n+/).filter((p) => p.trim());
  const kind = beginsIn(begins, own);
  if (kind === 'text') {
    fragment.insert(
      0,
      lines.map((l) => paragraphElement('text', l)),
    );
    return;
  }
  fragment.insert(
    0,
    (lines.length ? lines : ['']).map((l) => paragraphElement(kind, l)),
  );
}
