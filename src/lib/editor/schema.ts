/**
 * What a text can hold.
 *
 * Two schemas: one for the text of an element, one for its name. Both are
 * kept small on purpose. Headings are absent: the elements of the map are the
 * headings. The names of nodes and marks are also the names under which the
 * content is stored in the project document, so they must not be changed.
 */

import { Schema, type MarkSpec, type NodeSpec } from 'prosemirror-model';
import { tableNodes } from 'prosemirror-tables';

/**
 * Whether a link may be followed: to the web, to an address, or within the
 * document. Not `javascript:` and its like, which would run in the
 * application; a project that is shared can bring any link with it.
 */
export function safeHref(href: unknown): href is string {
  if (typeof href !== 'string') return false;
  // As a browser reads it: without the spaces and the signs that are not written.
  // eslint-disable-next-line no-control-regex
  const bare = href.replace(/[\u0000-\u0020\u007f]/g, '');
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(bare)?.[1]?.toLowerCase();
  return !scheme || ['http', 'https', 'mailto', 'ftp', 'doi'].includes(scheme);
}

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

/**
 * Kinds of locator, as CSL names them, with the short form a text in English
 * shows for each. The menu of a citation names them in the language of the
 * interface (`editor-locator-<kind>`); a text in another language shows the
 * words of CSL for them (`locatorWord` in `references.svelte.ts`).
 */
export const LOCATOR_LABELS: [string, string][] = [
  ['page', 'p.'],
  ['chapter', 'ch.'],
  ['section', '§'],
  ['paragraph', '¶'],
  ['line', 'l.'],
  ['verse', 'v.'],
  ['book', 'bk.'],
  ['volume', 'vol.'],
  ['part', 'pt.'],
  ['column', 'col.'],
  ['folio', 'fol.'],
  ['figure', 'fig.'],
  ['note', 'n.'],
  ['number', 'no.'],
  ['sub-verbo', 's.v.'],
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
    // Itself as well: a mark that does not exclude itself is kept under a changed name by y-prosemirror.
    excludes: 'sup sub',
    parseDOM: [{ tag: 'sup' }, { style: 'vertical-align=super' }],
    toDOM: () => ['sup', 0],
  },
  sub: {
    excludes: 'sup sub',
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
    // A link that may not be followed is kept, and shown without where it leads.
    toDOM: (mark) => [
      'a',
      safeHref(mark.attrs.href) ? { href: mark.attrs.href, rel: 'noopener' } : { rel: 'noopener' },
      0,
    ],
  },
  // A citation that was found in a text written elsewhere, and stands as
  // the text it was until it is tied to a reference: see `api/found.ts`.
  // With `left`, text that the writer has said is none, which is not shown
  // as something found.
  found: {
    attrs: {
      id: { default: '' },
      by: { default: 'form' },
      items: { default: [] },
      mode: { default: 'normal' },
      left: { default: false },
    },
    // What is written beside it is not part of it.
    inclusive: false,
    parseDOM: [
      {
        tag: 'span[data-found]',
        getAttrs: (node) => {
          try {
            const held = JSON.parse((node as HTMLElement).getAttribute('data-found') ?? '');
            return foundAttrs(held) ?? false;
          } catch {
            return false;
          }
        },
      },
    ],
    toDOM: (mark) => [
      'span',
      {
        'data-found': JSON.stringify(mark.attrs),
        'data-by': mark.attrs.by,
        class: mark.attrs.left ? 'found left' : 'found',
      },
      0,
    ],
  },
};

/** What the mark `found` holds, from what may be it. Nothing, where it has no id. */
export function foundAttrs(value: unknown): {
  id: string;
  by: string;
  items: unknown[];
  mode: CiteMode;
  left: boolean;
} | null {
  if (!value || typeof value !== 'object') return null;
  const held = value as Record<string, unknown>;
  if (typeof held.id !== 'string' || !held.id) return null;
  return {
    id: held.id,
    by: ['zotero', 'mendeley', 'key', 'form'].includes(held.by as string)
      ? (held.by as string)
      : 'form',
    items: Array.isArray(held.items) ? held.items : [],
    mode: held.mode === 'intext' ? 'intext' : 'normal',
    left: held.left === true,
  };
}

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
  /**
   * Lines of verse: a quotation of poetry or drama, each line kept as a
   * line, numbered where `start` is given. A line may be a speaker's name
   * or a stage direction.
   */
  verse: {
    group: 'block',
    content: 'verse_line+',
    defining: true,
    attrs: { start: { default: null }, by: { default: 5 } },
    parseDOM: [
      {
        tag: 'div.verse',
        getAttrs: (node) => {
          const el = node as HTMLElement;
          const start = el.getAttribute('data-start');
          return {
            start: start === null || start === '' ? null : Number(start) || 0,
            by: Number(el.getAttribute('data-by') ?? 5) || 5,
          };
        },
      },
    ],
    toDOM: (node) => [
      'div',
      {
        class: 'verse',
        ...(node.attrs.start === null ? {} : { 'data-start': String(node.attrs.start) }),
        'data-by': String(node.attrs.by),
      },
      0,
    ],
  },
  verse_line: {
    content: 'inline*',
    attrs: { kind: { default: 'line' }, indent: { default: 0 } },
    parseDOM: [
      {
        tag: 'p.verse-line',
        getAttrs: (node) => {
          const el = node as HTMLElement;
          const kind = ['speaker', 'direction'].find((k) => el.classList.contains(k)) ?? 'line';
          return { kind, indent: Number(el.getAttribute('data-indent') ?? 0) || 0 };
        },
      },
    ],
    toDOM: (node) => [
      'p',
      {
        class: `verse-line ${node.attrs.kind}`,
        ...(node.attrs.indent
          ? { 'data-indent': String(node.attrs.indent), style: `--indent: ${node.attrs.indent}` }
          : {}),
      },
      0,
    ],
  },
  /** A paragraph of a screenplay: a scene heading, action, a character, dialogue, a parenthetical, a transition. */
  script: {
    group: 'block',
    content: 'inline*',
    attrs: { part: { default: 'action' } },
    parseDOM: [
      {
        tag: 'p.script',
        getAttrs: (node) => ({
          part:
            ['scene', 'action', 'character', 'dialogue', 'parenthetical', 'transition'].find((p) =>
              (node as HTMLElement).classList.contains(p),
            ) ?? 'action',
        }),
      },
    ],
    toDOM: (node) => ['p', { class: `script ${node.attrs.part}` }, 0],
  },
  /** Two texts side by side: an original and its translation. */
  parallel: {
    group: 'block',
    content: 'parallel_side parallel_side',
    defining: true,
    isolating: true,
    parseDOM: [{ tag: 'div.parallel' }],
    toDOM: () => ['div', { class: 'parallel' }, 0],
  },
  parallel_side: {
    content: 'block+',
    defining: true,
    isolating: true,
    parseDOM: [{ tag: 'div.parallel-side' }],
    toDOM: () => ['div', { class: 'parallel-side' }, 0],
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
 * Where something that stands by itself stands: to the left, in the middle,
 * to the right. Nothing, for where the format of the document has it.
 */
export type Stand = '' | 'left' | 'center' | 'right';

export function stand(value: unknown): Stand {
  return value === 'left' || value === 'center' || value === 'right' ? value : '';
}

/** Whether the text flows around it. Nothing, for what the format says. */
export type Flow = '' | 'around' | 'apart';

export function flow(value: unknown): Flow {
  return value === 'around' || value === 'apart' ? value : '';
}

/** How wide a table is, in hundredths of the width of the text. Nought for as wide as it needs to be. */
export function tableWidth(value: unknown): number {
  const n = Math.round(Number(value));
  return Number.isFinite(n) && n > 0 ? Math.min(100, Math.max(10, n)) : 0;
}

/** What is said of a figure or a table, in the line that is its caption. */
const SAID = '(text | hard_break | citation | math | crossref)*';

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
    attrs: {
      id: { default: '' },
      tex: { default: '' },
      numbered: { default: false },
      align: { default: '' },
    },
    parseDOM: [
      {
        tag: 'div[data-equation]',
        getAttrs: (el) => ({
          id: (el as HTMLElement).getAttribute('data-id') ?? '',
          tex: (el as HTMLElement).getAttribute('data-equation') ?? '',
          numbered: (el as HTMLElement).hasAttribute('data-numbered'),
          align: stand((el as HTMLElement).getAttribute('data-align')),
        }),
      },
    ],
    toDOM: (node) => [
      'div',
      {
        'data-id': node.attrs.id || null,
        'data-equation': node.attrs.tex,
        'data-numbered': node.attrs.numbered ? '' : null,
        'data-align': node.attrs.align || null,
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
    content: SAID,
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
      align: { default: '' },
      flow: { default: '' },
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
            align: stand(el.getAttribute('data-align')),
            flow: flow(el.getAttribute('data-flow')),
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
        'data-align': node.attrs.align || null,
        'data-flow': node.attrs.flow || null,
        class: 'figure',
      },
      ['figcaption', 0],
    ],
  },
};

/**
 * Tables. A table stands in the text as a `tabular`: what is said of it, and
 * the table itself, whose rows and cells are those of prosemirror-tables. A
 * cell holds paragraphs. A cell of the kind `table_header` is a heading of
 * its column or its row.
 */
const cells = tableNodes({
  cellContent: 'paragraph+',
  cellAttributes: {
    // Where what the cell holds stands in it: nothing for the left, or as the column has it.
    align: {
      default: '',
      getFromDOM: (dom) => stand(dom.style.textAlign),
      setDOMAttr: (value, attrs) => {
        if (value)
          attrs.style = `${(attrs.style as string | undefined) ?? ''}text-align: ${value as string};`;
      },
    },
  },
});

const tableNodesOfOurs: Record<string, NodeSpec> = {
  ...cells,
  table_caption: {
    content: SAID,
    isolating: true,
    parseDOM: [{ tag: 'figure[data-table] > figcaption' }],
    toDOM: () => ['figcaption', 0],
  },
  tabular: {
    group: 'block',
    content: 'table_caption table',
    isolating: true,
    defining: true,
    attrs: {
      id: { default: '' },
      numbered: { default: true },
      align: { default: '' },
      flow: { default: '' },
      // In hundredths of the width of the text; nought for as wide as it needs to be.
      width: { default: 0 },
    },
    parseDOM: [
      {
        tag: 'figure[data-table]',
        getAttrs: (node) => {
          const el = node as HTMLElement;
          return {
            id: el.getAttribute('data-id') ?? '',
            numbered: !el.hasAttribute('data-unnumbered'),
            align: stand(el.getAttribute('data-align')),
            flow: flow(el.getAttribute('data-flow')),
            width: tableWidth(el.getAttribute('data-width')),
          };
        },
      },
    ],
    toDOM: (node) => [
      'figure',
      {
        'data-table': '',
        'data-id': node.attrs.id || null,
        'data-unnumbered': node.attrs.numbered ? null : '',
        'data-align': node.attrs.align || null,
        'data-flow': node.attrs.flow || null,
        'data-width': tableWidth(node.attrs.width) ? String(tableWidth(node.attrs.width)) : null,
        class: 'tabular',
      },
      0,
    ],
  },
  /** Figures, tables and equations that stand beside each other. */
  row: {
    group: 'block',
    content: '(figure | equation | tabular)+',
    isolating: true,
    defining: true,
    parseDOM: [{ tag: 'div[data-row]' }],
    toDOM: () => ['div', { 'data-row': '', class: 'row-of' }, 0],
  },
};

export const bodySchema = new Schema({
  nodes: { ...bodyNodes, ...figureNodes, ...tableNodesOfOurs },
  marks,
});

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
