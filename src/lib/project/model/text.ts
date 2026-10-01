/**
 * Reading the text of elements straight from the project document, without an
 * editor. The shape is that of `editor/schema.ts`, as y-prosemirror stores it:
 * nodes are XML elements named after their type, text is XML text whose
 * formatting attributes are the marks.
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
export type Inline =
  InlineText | InlineCitation | InlineFootnote | InlineBreak | InlineMath | InlineCrossRef;

export function refForm(value: unknown): RefForm {
  return value === 'number' || value === 'name' ? value : 'full';
}

/** A picture with what is said of it. The picture is a file of the project. */
/** Where something stands, when it is not where the format has it: see `editor/schema.ts`. */
export type Stand = 'left' | 'center' | 'right';

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

export type Block =
  | { kind: 'paragraph'; content: Inline[] }
  | { kind: 'blockquote'; content: Block[] }
  | VerseBlock
  | { kind: 'parallel'; left: Block[]; right: Block[] }
  | { kind: 'script'; part: ScriptPart; content: Inline[] }
  | PassageBlock
  | { kind: 'bullet_list'; items: Block[][] }
  | { kind: 'ordered_list'; start: number; items: Block[][] }
  | { kind: 'equation'; id: string; tex: string; numbered: boolean; align?: Stand }
  | FigureBlock
  | TableBlock
  | { kind: 'row'; items: Block[] };

/**
 * A paragraph of a kind: an epigraph, a headword, a break, or a kind of the
 * writer's own. `name` is the id of the kind (`editor/kinds.ts`). See ADR 0029.
 */
export interface PassageBlock {
  kind: 'passage';
  name: string;
  content: Inline[];
}

/**
 * Lines of verse, as a quotation of drama or poetry: each line kept as a
 * line, numbered from `start` every `by` lines where `start` is given; a
 * line may be a speaker's name or a stage direction, and may be indented.
 */
export interface VerseBlock {
  kind: 'verse';
  start: number | null;
  by: number;
  lines: VerseLine[];
}

export type VerseLineKind = 'line' | 'speaker' | 'direction';

/** A paragraph of a screenplay: what it is in the script. */
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

export interface VerseLine {
  kind: VerseLineKind;
  /** Steps of indentation, for the shorter lines of lyric. */
  indent: number;
  content: Inline[];
}

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
        default:
          out.push(...inlinesOf(child));
      }
    }
  }
  return out;
}

function verseLineKind(value: unknown): VerseLineKind {
  return value === 'speaker' || value === 'direction' ? value : 'line';
}

function blocksOf(parent: Y.XmlElement | Y.XmlFragment): Block[] {
  const out: Block[] = [];
  for (const child of parent.toArray()) {
    if (!(child instanceof Y.XmlElement)) continue;
    switch (child.nodeName) {
      case 'paragraph':
      case 'title':
        out.push({ kind: 'paragraph', content: inlinesOf(child) });
        break;
      case 'blockquote':
        out.push({ kind: 'blockquote', content: blocksOf(child) });
        break;
      case 'verse': {
        const lines: VerseLine[] = child
          .toArray()
          .filter(
            (l): l is Y.XmlElement => l instanceof Y.XmlElement && l.nodeName === 'verse_line',
          )
          .map((l) => ({
            kind: verseLineKind(l.getAttribute('kind') as unknown),
            indent: Math.max(0, Math.min(8, Number(l.getAttribute('indent') as unknown) || 0)),
            content: inlinesOf(l),
          }));
        if (!lines.length) break;
        const start = Number(child.getAttribute('start') as unknown);
        out.push({
          kind: 'verse',
          start: Number.isFinite(start) && child.getAttribute('start') !== undefined ? start : null,
          by: Math.max(1, Number(child.getAttribute('by') as unknown) || 5),
          lines,
        });
        break;
      }
      case 'script':
        out.push({
          kind: 'script',
          part: SCRIPT_PARTS.find((p) => p === child.getAttribute('part')) ?? 'action',
          content: inlinesOf(child),
        });
        break;
      case 'passage': {
        // A passage of no kind is a paragraph.
        const name = text(child.getAttribute('name') as unknown).trim();
        if (name) out.push({ kind: 'passage', name, content: inlinesOf(child) });
        else out.push({ kind: 'paragraph', content: inlinesOf(child) });
        break;
      }
      case 'parallel': {
        const sides = child
          .toArray()
          .filter(
            (c): c is Y.XmlElement => c instanceof Y.XmlElement && c.nodeName === 'parallel_side',
          );
        out.push({
          kind: 'parallel',
          left: sides[0] ? blocksOf(sides[0]) : [],
          right: sides[1] ? blocksOf(sides[1]) : [],
        });
        break;
      }
      case 'bullet_list':
        out.push({ kind: 'bullet_list', items: itemsOf(child) });
        break;
      case 'ordered_list':
        out.push({
          kind: 'ordered_list',
          start: Number(child.getAttribute('start') as unknown) || 1,
          items: itemsOf(child),
        });
        break;
      case 'equation': {
        const tex = text(child.getAttribute('tex') as unknown).trim();
        const to = stand(child.getAttribute('align') as unknown);
        if (tex)
          out.push({
            kind: 'equation',
            id: text(child.getAttribute('id') as unknown),
            tex,
            numbered: !!child.getAttribute('numbered'),
            ...(to ? { align: to } : {}),
          });
        break;
      }
      case 'tabular': {
        const parts = child.toArray().filter((c): c is Y.XmlElement => c instanceof Y.XmlElement);
        const said = parts.find((c) => c.nodeName === 'table_caption');
        const table = parts.find((c) => c.nodeName === 'table');
        const rows = (table?.toArray() ?? [])
          .filter((r): r is Y.XmlElement => r instanceof Y.XmlElement)
          .map((row) =>
            row
              .toArray()
              .filter((c): c is Y.XmlElement => c instanceof Y.XmlElement)
              .map((cell): TableCell => {
                const to = stand(cell.getAttribute('align') as unknown);
                return {
                  content: blocksOf(cell),
                  colspan: Math.max(1, Number(cell.getAttribute('colspan') as unknown) || 1),
                  rowspan: Math.max(1, Number(cell.getAttribute('rowspan') as unknown) || 1),
                  header: cell.nodeName === 'table_header',
                  ...(to ? { align: to } : {}),
                };
              }),
          )
          .filter((row) => row.length);
        if (!rows.length) break;
        const to = stand(child.getAttribute('align') as unknown);
        const around = flow(child.getAttribute('flow') as unknown);
        out.push({
          kind: 'table',
          id: text(child.getAttribute('id') as unknown),
          caption: said ? inlinesOf(said).filter((i) => i.kind !== 'footnote') : [],
          rows,
          numbered: (child.getAttribute('numbered') as unknown) !== false,
          width: tableWidth(child.getAttribute('width') as unknown),
          ...(to ? { align: to } : {}),
          ...(around ? { wrap: around === 'around' } : {}),
        });
        break;
      }
      case 'row': {
        const items = blocksOf(child);
        // One alone stands as it would without the row.
        if (items.length === 1) out.push(items[0]);
        else if (items.length) out.push({ kind: 'row', items });
        break;
      }
      case 'figure': {
        const to = stand(child.getAttribute('align') as unknown);
        const around = flow(child.getAttribute('flow') as unknown);
        out.push({
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
        });
        break;
      }
      default:
        // Something a later version added: keep its text.
        out.push({ kind: 'paragraph', content: inlinesOf(child) });
    }
  }
  return out;
}

function itemsOf(list: Y.XmlElement): Block[][] {
  return list
    .toArray()
    .filter((c): c is Y.XmlElement => c instanceof Y.XmlElement)
    .map((item) => blocksOf(item));
}

/** The text of an element as blocks. Empty paragraphs at the end are dropped. */
export function readBody(fragment: Y.XmlFragment | undefined): Block[] {
  if (!fragment) return [];
  const blocks = blocksOf(fragment);
  while (blocks.length) {
    const last = blocks[blocks.length - 1];
    if (last.kind === 'paragraph' && !last.content.length) blocks.pop();
    else break;
  }
  return blocks;
}

/**
 * The kinds of the catalogue (`editor/kinds.ts`) that are no kinds of
 * passage: the plain kinds, which are paragraphs and what holds them, and
 * the kinds of words and of lines of verse. The catalogue itself is not
 * read here, so that the text can be read where the interface is not.
 */
const NOT_PASSAGES = [
  'text',
  'quote',
  'list',
  'numbered',
  'speaker',
  'direction',
  'foreign',
  'title',
  'term',
  'mention',
  'highlight',
];

/**
 * What a text begins in when its kind of paragraph is given: a verse, a
 * script, a passage of the kind, or paragraphs of text; a kind that is not
 * known is one of the writer's own, and a passage.
 */
export function beginsIn(kind: string): 'text' | 'verse' | 'script' | 'passage' {
  if (!kind || NOT_PASSAGES.includes(kind)) return 'text';
  if (kind === 'verse') return 'verse';
  if (SCRIPT_PARTS.includes(kind as ScriptPart)) return 'script';
  return 'passage';
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
    if (b.kind === 'paragraph' || b.kind === 'passage')
      parts.push(inlineText(b.content, withNotes));
    else if (b.kind === 'blockquote') parts.push(blocksText(b.content, withNotes));
    else if (b.kind === 'verse')
      parts.push(b.lines.map((l) => inlineText(l.content, withNotes)).join('\n'));
    else if (b.kind === 'script') parts.push(inlineText(b.content, withNotes));
    else if (b.kind === 'parallel')
      parts.push(blocksText(b.left, withNotes), blocksText(b.right, withNotes));
    else if (b.kind === 'figure') parts.push(inlineText(b.caption, withNotes));
    else if (b.kind === 'equation') parts.push(b.tex);
    else if (b.kind === 'row') parts.push(blocksText(b.items, withNotes));
    else if (b.kind === 'table') {
      parts.push(inlineText(b.caption, withNotes));
      for (const row of b.rows)
        parts.push(row.map((cell) => blocksText(cell.content, withNotes)).join('\t'));
    } else for (const item of b.items) parts.push(blocksText(item, withNotes));
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
   * once, in the order of first use: the kinds of its passages, the parts
   * of its script, verse where there is verse, with its speakers and stage
   * directions, and the kinds of its words. Not the plain kinds.
   */
  uses: string[];
}

export function bodyFacts(blocks: Block[]): BodyFacts {
  const cited: string[] = [];
  const uses: string[] = [];
  const use = (id: unknown) => {
    if (typeof id === 'string' && id && !uses.includes(id)) uses.push(id);
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
  const visit = (list: Block[]) => {
    for (const b of list) {
      if (b.kind === 'paragraph') visitInlines(b.content);
      else if (b.kind === 'script' || b.kind === 'passage') {
        use(b.kind === 'script' ? b.part : b.name);
        visitInlines(b.content);
      } else if (b.kind === 'blockquote') visit(b.content);
      else if (b.kind === 'verse') {
        use('verse');
        for (const line of b.lines) {
          if (line.kind !== 'line') use(line.kind);
          visitInlines(line.content);
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
      else for (const item of b.items) visit(item);
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

/**
 * Makes the content of a text from plain text: one paragraph to a line.
 * With `begins`, the kind of paragraph the text is written in: lines of
 * one verse, paragraphs of a part of a script, passages of a kind of the
 * catalogue or of the writer's own; and one empty one, where there is no
 * text, so that the writing begins in it.
 */
export function fillBody(fragment: Y.XmlFragment, text: string, begins = '') {
  if (fragment.length) fragment.delete(0, fragment.length);
  const lines = text.split(/\n+/).filter((p) => p.trim());
  const kind = begins.trim();
  const structure = beginsIn(kind);
  const line = (name: string, attrs: Record<string, string> = {}, words = '') => {
    const el = new Y.XmlElement(name);
    for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
    if (words) el.insert(0, [new Y.XmlText(words)]);
    return el;
  };
  if (structure === 'verse') {
    const verse = new Y.XmlElement('verse');
    verse.insert(
      0,
      (lines.length ? lines : ['']).map((l) => line('verse_line', {}, l)),
    );
    fragment.insert(0, [verse]);
  } else if (structure === 'script') {
    fragment.insert(
      0,
      (lines.length ? lines : ['']).map((l) => line('script', { part: kind }, l)),
    );
  } else if (structure === 'passage') {
    fragment.insert(
      0,
      (lines.length ? lines : ['']).map((l) => line('passage', { name: kind }, l)),
    );
  } else {
    fragment.insert(
      0,
      lines.map((l) => line('paragraph', {}, l)),
    );
  }
}
