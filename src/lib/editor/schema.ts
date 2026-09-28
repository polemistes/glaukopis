/**
 * What a text can hold.
 *
 * Two schemas: one for the text of an element, one for its name. Both are
 * kept small on purpose. Headings are absent: the elements of the map are the
 * headings. The names of nodes and marks are also the names under which the
 * content is stored in the project document, so they must not be changed.
 */

import { Schema, type MarkSpec, type NodeSpec } from 'prosemirror-model';

/** One work cited, with what is said about the place in it. */
export interface CiteItem {
  /** The id of the reference in the library. */
  id: string;
  /** Page numbers or another place in the work: "45", "45–67", "3.2". */
  locator?: string;
  /** What the locator counts, when not pages: chapter, line, verse, … */
  label?: string;
  /** Words before: "see", "cf." */
  prefix?: string;
  /** Words after: "and passim". */
  suffix?: string;
  /** The author is named in the sentence; the citation gives the year only. */
  suppressAuthor?: boolean;
}

export type CiteMode = 'normal' | 'intext';

/** Kinds of locator, as CSL names them, with the words shown for them. */
export const LOCATOR_LABELS: [string, string, string][] = [
  ['page', 'Page', 'p.'],
  ['chapter', 'Chapter', 'ch.'],
  ['section', 'Section', '§'],
  ['paragraph', 'Paragraph', '¶'],
  ['line', 'Line', 'l.'],
  ['verse', 'Verse', 'v.'],
  ['book', 'Book', 'bk.'],
  ['volume', 'Volume', 'vol.'],
  ['part', 'Part', 'pt.'],
  ['column', 'Column', 'col.'],
  ['folio', 'Folio', 'fol.'],
  ['figure', 'Figure', 'fig.'],
  ['note', 'Note', 'n.'],
  ['number', 'Number', 'no.'],
  ['sub-verbo', 'Sub verbo', 's.v.'],
];

const marks: Record<string, MarkSpec> = {
  em: {
    parseDOM: [{ tag: 'i' }, { tag: 'em' }, { style: 'font-style=italic' }],
    toDOM: () => ['em', 0],
  },
  strong: {
    parseDOM: [
      { tag: 'strong' },
      { tag: 'b', getAttrs: (node) => (node as HTMLElement).style.fontWeight !== 'normal' && null },
      {
        style: 'font-weight',
        getAttrs: (value) => /^(bold(er)?|[5-9]\d{2,})$/.test(value as string) && null,
      },
    ],
    toDOM: () => ['strong', 0],
  },
  smallcaps: {
    parseDOM: [
      { tag: 'span.smallcaps' },
      { style: 'font-variant=small-caps' },
      { style: 'font-variant-caps=small-caps' },
    ],
    toDOM: () => ['span', { class: 'smallcaps' }, 0],
  },
  sup: {
    excludes: 'sub',
    parseDOM: [{ tag: 'sup' }, { style: 'vertical-align=super' }],
    toDOM: () => ['sup', 0],
  },
  sub: {
    excludes: 'sup',
    parseDOM: [{ tag: 'sub' }, { style: 'vertical-align=sub' }],
    toDOM: () => ['sub', 0],
  },
  strike: {
    parseDOM: [
      { tag: 's' },
      { tag: 'del' },
      { tag: 'strike' },
      { style: 'text-decoration=line-through' },
    ],
    toDOM: () => ['s', 0],
  },
  link: {
    attrs: { href: {} },
    inclusive: false,
    parseDOM: [
      {
        tag: 'a[href]',
        getAttrs: (node) => ({ href: (node as HTMLElement).getAttribute('href') }),
      },
    ],
    toDOM: (mark) => ['a', { href: mark.attrs.href, rel: 'noopener' }, 0],
  },
};

const bodyNodes: Record<string, NodeSpec> = {
  doc: { content: 'block+' },
  paragraph: {
    group: 'block',
    content: 'inline*',
    parseDOM: [{ tag: 'p' }],
    toDOM: () => ['p', 0],
  },
  blockquote: {
    group: 'block',
    content: 'block+',
    defining: true,
    parseDOM: [{ tag: 'blockquote' }],
    toDOM: () => ['blockquote', 0],
  },
  bullet_list: {
    group: 'block',
    content: 'list_item+',
    parseDOM: [{ tag: 'ul' }],
    toDOM: () => ['ul', 0],
  },
  ordered_list: {
    group: 'block',
    content: 'list_item+',
    attrs: { start: { default: 1 } },
    parseDOM: [
      {
        tag: 'ol',
        getAttrs: (node) => ({
          start: Number((node as HTMLElement).getAttribute('start') ?? 1) || 1,
        }),
      },
    ],
    toDOM: (node) => (node.attrs.start === 1 ? ['ol', 0] : ['ol', { start: node.attrs.start }, 0]),
  },
  list_item: {
    content: 'paragraph block*',
    defining: true,
    parseDOM: [{ tag: 'li' }],
    toDOM: () => ['li', 0],
  },
  text: { group: 'inline' },
  hard_break: {
    group: 'inline',
    inline: true,
    selectable: false,
    parseDOM: [{ tag: 'br' }],
    toDOM: () => ['br'],
  },
  citation: {
    group: 'inline',
    inline: true,
    atom: true,
    draggable: true,
    attrs: {
      items: { default: [] },
      mode: { default: 'normal' },
    },
    parseDOM: [
      {
        tag: 'span[data-citation]',
        getAttrs: (node) => {
          try {
            const el = node as HTMLElement;
            return {
              items: JSON.parse(el.getAttribute('data-citation') ?? '[]'),
              mode: el.getAttribute('data-mode') === 'intext' ? 'intext' : 'normal',
            };
          } catch {
            return false;
          }
        },
      },
    ],
    toDOM: (node) => [
      'span',
      {
        'data-citation': JSON.stringify(node.attrs.items),
        'data-mode': node.attrs.mode,
        class: 'citation',
      },
    ],
  },
  footnote: {
    group: 'inline',
    inline: true,
    atom: true,
    content: 'inline*',
    // Where the note stands, when not where the format has its notes: 'foot' or 'end'.
    attrs: { place: { default: '' } },
    // A note within a note is not a thing.
    parseDOM: [
      {
        tag: 'span[data-footnote]',
        contentElement: 'span',
        getAttrs: (el) => ({ place: notePlace((el as HTMLElement).getAttribute('data-place')) }),
      },
    ],
    toDOM: (node) => [
      'span',
      { 'data-footnote': '', 'data-place': node.attrs.place || null, class: 'footnote' },
      ['span', 0],
    ],
  },
};

/** How wide a picture is, in hundredths of the width of the text. */
export function figureWidth(value: unknown): number {
  const n = Math.round(Number(value));
  return Number.isFinite(n) && n > 0 ? Math.min(100, Math.max(10, n)) : 100;
}

/**
 * Mathematics, in the notation of TeX, and figures. The picture of a figure
 * is a file of the project, named by what it holds; the text of the figure
 * is what is said of it under or over the picture.
 */
const figureNodes: Record<string, NodeSpec> = {
  math: {
    group: 'inline',
    inline: true,
    atom: true,
    draggable: true,
    attrs: { tex: { default: '' } },
    parseDOM: [
      {
        tag: 'span[data-math]',
        getAttrs: (el) => ({ tex: (el as HTMLElement).getAttribute('data-math') ?? '' }),
      },
    ],
    toDOM: (node) => ['span', { 'data-math': node.attrs.tex, class: 'math' }, node.attrs.tex],
  },
  equation: {
    group: 'block',
    atom: true,
    selectable: true,
    // The id is that by which words in the text point to the equation.
    attrs: { id: { default: '' }, tex: { default: '' }, numbered: { default: false } },
    parseDOM: [
      {
        tag: 'div[data-equation]',
        getAttrs: (el) => ({
          id: (el as HTMLElement).getAttribute('data-id') ?? '',
          tex: (el as HTMLElement).getAttribute('data-equation') ?? '',
          numbered: (el as HTMLElement).hasAttribute('data-numbered'),
        }),
      },
    ],
    toDOM: (node) => [
      'div',
      {
        'data-id': node.attrs.id || null,
        'data-equation': node.attrs.tex,
        'data-numbered': node.attrs.numbered ? '' : null,
        class: 'equation',
      },
      node.attrs.tex,
    ],
  },
  crossref: {
    group: 'inline',
    inline: true,
    atom: true,
    draggable: true,
    attrs: { target: { default: '' }, form: { default: 'full' } },
    parseDOM: [
      {
        tag: 'span[data-crossref]',
        getAttrs: (el) => {
          const target = (el as HTMLElement).getAttribute('data-crossref') ?? '';
          if (!target) return false;
          const form = (el as HTMLElement).getAttribute('data-form');
          return { target, form: form === 'number' || form === 'name' ? form : 'full' };
        },
      },
    ],
    toDOM: (node) => [
      'span',
      { 'data-crossref': node.attrs.target, 'data-form': node.attrs.form, class: 'crossref' },
    ],
  },
  figure: {
    group: 'block',
    // What is said of a figure is a line of text. A note has no place in it:
    // not every kind of document can set one there.
    content: '(text | hard_break | citation | math | crossref)*',
    isolating: true,
    defining: true,
    attrs: {
      id: { default: '' },
      file: { default: '' },
      extension: { default: '' },
      name: { default: '' },
      alt: { default: '' },
      width: { default: 100 },
      numbered: { default: true },
    },
    parseDOM: [
      {
        tag: 'figure[data-picture]',
        contentElement: 'figcaption',
        getAttrs: (node) => {
          const el = node as HTMLElement;
          const [file, extension] = (el.getAttribute('data-picture') ?? '').split('.');
          if (!/^[0-9a-f]{64}$/.test(file ?? '')) return false;
          return {
            id: el.getAttribute('data-id') ?? '',
            file,
            extension: extension ?? '',
            name: el.getAttribute('data-name') ?? '',
            alt: el.getAttribute('data-alt') ?? '',
            width: figureWidth(el.getAttribute('data-width')),
            numbered: !el.hasAttribute('data-unnumbered'),
          };
        },
      },
    ],
    toDOM: (node) => [
      'figure',
      {
        'data-id': node.attrs.id || null,
        'data-picture': `${node.attrs.file}.${node.attrs.extension}`,
        'data-name': node.attrs.name || null,
        'data-alt': node.attrs.alt || null,
        'data-width': String(figureWidth(node.attrs.width)),
        'data-unnumbered': node.attrs.numbered ? null : '',
        class: 'figure',
      },
      ['figcaption', 0],
    ],
  },
};

export const bodySchema = new Schema({ nodes: { ...bodyNodes, ...figureNodes }, marks });

export type NotePlace = '' | 'foot' | 'end';

export function notePlace(value: unknown): NotePlace {
  return value === 'foot' || value === 'end' ? value : '';
}

const titleMarks: Record<string, MarkSpec> = {
  em: marks.em,
  smallcaps: marks.smallcaps,
  sup: marks.sup,
  sub: marks.sub,
};

export const titleSchema = new Schema({
  nodes: {
    doc: { content: 'title' },
    title: {
      content: 'inline*',
      parseDOM: [{ tag: 'h1' }, { tag: 'h2' }, { tag: 'h3' }, { tag: 'p' }, { tag: 'div' }],
      toDOM: () => ['div', { class: 'title-line' }, 0],
    },
    text: { group: 'inline' },
  },
  marks: titleMarks,
});
