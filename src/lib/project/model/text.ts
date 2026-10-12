/**
 * Reading the text of elements straight from the project document, without an
 * editor. The shape is that of `editor/schema.ts`, as y-prosemirror stores it:
 * nodes are XML elements named after their type, text is XML text whose
 * formatting attributes are the marks.
 *
 * Two shapes are read (ADR 0040). The shape texts are written in now: a
 * `paragraph` of a kind, with its indent, its number, whether it is counted
 * and its margin words; and a `passage`, a run of paragraphs of one family
 * with its numbering. And the shape texts were written in before: a
 * `blockquote` holding paragraphs, a `verse` of `verse_line`s, a `script`
 * paragraph of a part, a `passage` of a name, and the lists of items. The
 * old shape is read into the new as the migration rewrites it
 * (`migrate.ts`), by the one conversion here, since the history of a
 * project and the search through projects on disk read texts as they were
 * written. Nothing here reads the words of the interface: it runs in the
 * thread of the search as well.
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
  familyOf,
  joinsBefore,
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
 * shows no number; words in the margin; and the line's indent, for verse.
 * What is not said is left out. A mark that says nothing is not written.
 */
export interface InlineLineMark {
  kind: 'linemark';
  number?: string;
  counted?: false;
  hidden?: true;
  margin?: string;
  indent?: number;
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
 * its start. `numbering`, `every` and `side` are the settings of the
 * stretch it stands in: consecutive paragraphs with the same settings are
 * one stretch, numbered together, whatever their kinds (`lines.ts`).
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

/** Two texts side by side: an original and its translation. Each side holds paragraphs and passages. */
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

/** The parts of a screenplay, as the old shape named them: a script paragraph of a part. */
export type ScriptPart =
  'scene' | 'action' | 'character' | 'dialogue' | 'parenthetical' | 'transition';

export const SCRIPT_PARTS: readonly ScriptPart[] = [
  'scene',
  'action',
  'character',
  'dialogue',
  'parenthetical',
  'transition',
];

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
  more: Pick<ParagraphBlock, 'indent' | 'numbering' | 'every' | 'side' | 'new'> | number = 0,
): ParagraphBlock {
  const said = typeof more === 'number' ? { indent: more } : more;
  return {
    kind: 'paragraph',
    name,
    indent: said.indent ?? 0,
    ...(said.numbering && said.numbering !== 'none' ? { numbering: said.numbering } : {}),
    ...(said.every ? { every: said.every } : {}),
    ...(said.side ? { side: said.side } : {}),
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
    ...(said.margin?.trim() ? { margin: said.margin.trim() } : {}),
    ...(said.indent ? { indent: said.indent } : {}),
  };
}

/** Whether a line mark says anything. */
export const saysAnything = (m: InlineLineMark): boolean =>
  !!(m.number || m.counted === false || m.hidden || m.margin || m.indent);

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
        default:
          out.push(...inlinesOf(child));
      }
    }
  }
  return out;
}

const elementsOf = (parent: Y.XmlElement | Y.XmlFragment): Y.XmlElement[] =>
  parent.toArray().filter((c): c is Y.XmlElement => c instanceof Y.XmlElement);

/** Whether an element of a text is a passage as texts are written now: it names its family, or holds paragraphs. */
function newPassage(el: Y.XmlElement): boolean {
  return (
    el.getAttribute('family') !== undefined ||
    el.toArray().some((c) => c instanceof Y.XmlElement && c.nodeName === 'paragraph')
  );
}

/** The names of the elements of the old shape, which the migration rewrites. */
const OLD = new Set([
  'blockquote',
  'verse',
  'verse_line',
  'script',
  'bullet_list',
  'ordered_list',
  'list_item',
]);

/** Whether an element of a text is of the shape texts were written in before ADR 0040. */
export function isOldShape(el: Y.XmlElement): boolean {
  return OLD.has(el.nodeName) || (el.nodeName === 'passage' && !newPassage(el));
}

/**
 * A paragraph from an element that holds inline content, with what is said
 * of it: its kind (`kind` as paragraphs have it, or the kind given), its
 * indent, number, whether it is counted, and its margin words.
 */
function paragraphOf(el: Y.XmlElement, kind?: string): ParagraphBlock {
  const name = renamed(kind ?? text(el.getAttribute('kind') as unknown).trim()) || 'text';
  const number = text(el.getAttribute('number') as unknown).trim();
  const margin = text(el.getAttribute('margin') as unknown).trim();
  return paragraph(inlinesOf(el), name, {
    indent: indentOf(el.getAttribute('indent') as unknown),
    ...(number ? { number } : {}),
    ...((el.getAttribute('counted') as unknown) === false ? { counted: false } : {}),
    ...((el.getAttribute('hidden') as unknown) === true ? { hidden: true } : {}),
    ...(margin ? { margin } : {}),
  });
}

/** The kind of a line of verse as the old shape had it. */
function verseLineKind(value: unknown): string {
  return value === 'speaker' || value === 'direction' ? value : 'line';
}

/**
 * A verse of the old shape as a passage: counted where it was given a
 * start, or where a line was given a number (which the count began at,
 * ADR 0039); `every` the old `by` where that was not five; the first
 * counted line without a number given the start as its number.
 */
function verseOf(verse: Y.XmlElement): PassageBlock | null {
  const lines = elementsOf(verse)
    .filter((l) => l.nodeName === 'verse_line')
    .map((l) => paragraphOf(l, verseLineKind(l.getAttribute('kind') as unknown)));
  if (!lines.length) return null;
  const given = verse.getAttribute('start') as unknown;
  const start = Number(given);
  const hasStart = given !== undefined && given !== null && Number.isFinite(start);
  const by = Math.max(1, Math.round(Number(verse.getAttribute('by') as unknown)) || 5);
  if (hasStart) {
    const first = lines.find((l) => l.name === 'line' && l.counted !== false && !l.number);
    if (first) first.number = String(start);
  }
  const counted =
    hasStart || lines.some((l) => l.name === 'line' && l.counted !== false && l.number);
  return passage('verse', lines, counted ? 'counted' : 'none', by !== 5 ? { every: by } : {});
}

/**
 * A list of the old shape as paragraphs of `item` or `numbered`, their
 * indent the depth; a list within an item one step deeper; a numbered list
 * that did not start at one giving its first item that number. A second
 * paragraph of an item is an item; what else stands in an item stands
 * after it.
 */
function listOf(list: Y.XmlElement, depth: number, own: readonly BasedKind[]): Block[] {
  const numbered = list.nodeName === 'ordered_list';
  const kind = numbered ? 'numbered' : 'item';
  const start = numbered ? Math.round(Number(list.getAttribute('start') as unknown)) || 1 : 1;
  const out: Block[] = [];
  let first = true;
  for (const item of elementsOf(list)) {
    const parts = item.nodeName === 'list_item' ? elementsOf(item) : [item];
    for (const part of parts) {
      if (part.nodeName === 'paragraph') {
        const p = paragraphOf(part, kind);
        p.indent = indentOf(depth);
        if (first && start !== 1) p.number = String(start);
        first = false;
        out.push(p);
      } else if (part.nodeName === 'bullet_list' || part.nodeName === 'ordered_list') {
        out.push(...listOf(part, depth + 1, own));
      } else out.push(...rawOf(part, own));
    }
  }
  return out;
}

/**
 * A block quote of the old shape: its paragraphs as `quote` paragraphs, a
 * passage of a name among them as a paragraph of that kind; what stood in
 * it that was no paragraph stands after it, as itself.
 */
function quotedOf(quote: Y.XmlElement, own: readonly BasedKind[]): Block[] {
  const out: Block[] = [];
  for (const child of elementsOf(quote)) {
    if (child.nodeName === 'paragraph') {
      const p = paragraphOf(child);
      if (p.name === 'text') p.name = 'quote';
      out.push(p);
    } else if (child.nodeName === 'blockquote') out.push(...quotedOf(child, own));
    else out.push(...rawOf(child, own));
  }
  return out;
}

/**
 * The blocks an element of a text stands for, before they are brought into
 * shape: paragraphs of a kind loose, where the old shape had them in
 * containers or typed, and passages as they are.
 */
function rawOf(child: Y.XmlElement, own: readonly BasedKind[]): Block[] {
  switch (child.nodeName) {
    case 'paragraph':
    case 'title':
      return [paragraphOf(child)];
    case 'passage': {
      if (!newPassage(child)) {
        // A passage of a name, as it was: a paragraph of that kind; of no name, a paragraph.
        return [paragraphOf(child, text(child.getAttribute('name') as unknown).trim())];
      }
      const content = elementsOf(child)
        .filter((p) => p.nodeName === 'paragraph')
        .map((p) => paragraphOf(p));
      if (!content.length) return [];
      return [
        passage(
          text(child.getAttribute('family') as unknown).trim() || familyOf(content[0].name, own),
          content,
          numberingOf(child.getAttribute('numbering') as unknown),
          {
            every: everyOf(child.getAttribute('every') as unknown),
            side: sideOf(child.getAttribute('side') as unknown),
          },
        ),
      ];
    }
    case 'blockquote':
      return quotedOf(child, own);
    case 'verse': {
      const verse = verseOf(child);
      return verse ? [verse] : [];
    }
    case 'verse_line':
      return [paragraphOf(child, verseLineKind(child.getAttribute('kind') as unknown))];
    case 'script':
      return [
        paragraphOf(child, SCRIPT_PARTS.find((p) => p === child.getAttribute('part')) ?? 'action'),
      ];
    case 'bullet_list':
    case 'ordered_list':
    case 'list_item':
      return listOf(child, 0, own);
    case 'parallel': {
      const sides = elementsOf(child).filter((c) => c.nodeName === 'parallel_side');
      return [
        {
          kind: 'parallel',
          left: sides[0] ? blocksOf(sides[0], own) : [],
          right: sides[1] ? blocksOf(sides[1], own) : [],
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
              // A cell holds paragraphs, of whatever kind, and no passage.
              content: elementsOf(cell).flatMap((c) => rawOf(c, own)),
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
      const items = elementsOf(child).flatMap((c) => rawOf(c, own));
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
      // Something a later version added: keep its text.
      return [paragraph(inlinesOf(child))];
  }
}

/**
 * Blocks brought into the shape the editor keeps (ADR 0040): a paragraph
 * of a kind that is not text standing loose is put in a passage of its
 * family, or in the passage before it where its kind joins; passages of
 * one family that stand next to each other are joined, the first one's
 * settings holding; a passage of nothing goes. Paragraphs of text stand
 * loose. The same shaping on blocks in shape changes nothing.
 */
export function shaped(blocks: readonly Block[], own: readonly BasedKind[] = []): Block[] {
  const out: Block[] = [];
  for (const b of blocks) {
    const before = out[out.length - 1];
    if (b.kind === 'paragraph') {
      const family = familyOf(b.name, own);
      if (family === 'text') {
        out.push(b);
        continue;
      }
      if (before?.kind === 'passage' && (before.family === family || joinsBefore(b.name, own)))
        before.content.push(b);
      else out.push(passage(family, [b]));
    } else if (b.kind === 'passage') {
      if (!b.content.length) continue;
      if (before?.kind === 'passage' && before.family === b.family)
        before.content.push(...b.content);
      else out.push({ ...b, content: [...b.content] });
    } else if (b.kind === 'parallel') {
      out.push({ kind: 'parallel', left: shaped(b.left, own), right: shaped(b.right, own) });
    } else out.push(b);
  }
  return out;
}

/** The blocks of these elements of a text, which stand next to each other, in shape. */
export function readBlocks(
  elements: readonly Y.XmlElement[],
  own: readonly BasedKind[] = [],
): Block[] {
  return shaped(
    elements.flatMap((el) => rawOf(el, own)),
    own,
  );
}

function blocksOf(parent: Y.XmlElement | Y.XmlFragment, own: readonly BasedKind[]): Block[] {
  return readBlocks(elementsOf(parent), own);
}

/**
 * The text of an element as blocks. `own` are the kinds of paragraph of the
 * writer's own, by which a kind of theirs in the old shape has its family.
 * Empty paragraphs of text at the end are dropped.
 */
export function readBody(
  fragment: Y.XmlFragment | undefined,
  own: readonly BasedKind[] = [],
): Block[] {
  if (!fragment) return [];
  const blocks = blocksOf(fragment, own);
  while (blocks.length) {
    const last = blocks[blocks.length - 1];
    if (last.kind === 'paragraph' && last.name === 'text' && !last.content.length) blocks.pop();
    else break;
  }
  return blocks;
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
 * What a text begins in when its kind of paragraph is given: `text` for
 * paragraphs of text, else the family of the kind, whose passage the
 * paragraphs are written in.
 */
export function beginsIn(kind: string, own: readonly BasedKind[] = []): string {
  const id = renamed(kind.trim());
  if (!id) return 'text';
  return familyOf(id, own);
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
    else if (b.kind === 'passage')
      parts.push(b.content.map((p) => inlineText(p.content, withNotes)).join('\n'));
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

export function countWords(text: string): number {
  // Letters and digits in runs, with apostrophes and hyphens inside them.
  return text.match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu)?.length ?? 0;
}

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

export function bodyFacts(blocks: Block[]): BodyFacts {
  const cited: string[] = [];
  const uses: string[] = [];
  const use = (id: unknown) => {
    if (typeof id === 'string' && id && id !== 'text' && !uses.includes(id)) uses.push(id);
  };
  let notes = 0;
  /** What the notes say. */
  let noted = '';
  /** Figures and formulas. */
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
      else if (b.kind === 'passage') {
        for (const p of b.content) {
          visitParagraph(p);
          text += '\n';
        }
      } else if (b.kind === 'parallel') {
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
  el.setAttribute('counted', true as unknown as string);
  if (words) el.insert(0, [new Y.XmlText(words)]);
  return el;
}

/**
 * Makes the content of a text from plain text: one paragraph to a line.
 * With `begins`, the kind of paragraph the text is written in: paragraphs
 * of that kind in a passage of its family, and one empty one, where there
 * is no text, so that the writing begins in it. `own` are the kinds of
 * the writer's own, by which one of theirs has its family.
 */
export function fillBody(
  fragment: Y.XmlFragment,
  text: string,
  begins = '',
  own: readonly BasedKind[] = [],
) {
  if (fragment.length) fragment.delete(0, fragment.length);
  const lines = text.split(/\n+/).filter((p) => p.trim());
  const kind = renamed(begins.trim());
  const family = beginsIn(kind, own);
  if (family === 'text') {
    fragment.insert(
      0,
      lines.map((l) => paragraphElement('text', l)),
    );
    return;
  }
  const el = new Y.XmlElement('passage');
  el.setAttribute('family', family);
  el.setAttribute('numbering', 'none');
  el.insert(
    0,
    (lines.length ? lines : ['']).map((l) => paragraphElement(kind, l)),
  );
  fragment.insert(0, [el]);
}
