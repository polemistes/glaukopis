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
  | { kind: 'bullet_list'; items: Block[][] }
  | { kind: 'ordered_list'; start: number; items: Block[][] }
  | { kind: 'equation'; id: string; tex: string; numbered: boolean; align?: Stand }
  | FigureBlock
  | TableBlock
  | { kind: 'row'; items: Block[] };

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
    else if (b.kind === 'blockquote') parts.push(blocksText(b.content, withNotes));
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
}

export function bodyFacts(blocks: Block[]): BodyFacts {
  const cited: string[] = [];
  let notes = 0;
  /** What the notes say. */
  let noted = '';
  /** Figures and formulas. */
  let set = 0;
  const setOff: SetOff[] = [];
  let text = '';
  const visitInlines = (inlines: Inline[]) => {
    for (const i of inlines) {
      if (i.kind === 'text') text += i.text;
      else if (i.kind === 'break') text += ' ';
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
      else if (b.kind === 'blockquote') visit(b.content);
      else if (b.kind === 'figure') {
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
  };
}

/** Makes the content of a name from plain text. */
export function fillTitle(fragment: Y.XmlFragment, text: string) {
  if (fragment.length) fragment.delete(0, fragment.length);
  const line = new Y.XmlElement('title');
  if (text) line.insert(0, [new Y.XmlText(text)]);
  fragment.insert(0, [line]);
}

/** Makes the content of a text from plain text: one paragraph to a line. */
export function fillBody(fragment: Y.XmlFragment, text: string) {
  if (fragment.length) fragment.delete(0, fragment.length);
  const paragraphs = text.split(/\n+/).filter((p) => p.trim());
  fragment.insert(
    0,
    paragraphs.map((p) => {
      const el = new Y.XmlElement('paragraph');
      el.insert(0, [new Y.XmlText(p)]);
      return el;
    }),
  );
}
