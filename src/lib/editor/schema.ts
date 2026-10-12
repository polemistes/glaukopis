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
 * How a language is named where a passage says it is in one. The interface
 * gives its own names when it starts (main.ts); elsewhere, as in the thread of
 * the search, where the words of the interface cannot be, the tag is the name.
 */
let nameOfLanguage: (tag: string) => string = (tag) => tag;

/** Gives the names of languages, in the language of the interface. */
export function nameLanguagesBy(name: (tag: string) => string): void {
  nameOfLanguage = name;
}

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
  underline: {
    parseDOM: [{ tag: 'u' }, { style: 'text-decoration=underline' }],
    toDOM: () => ['u', 0],
  },
  /** Words kept letter for letter, in letters of equal width. */
  code: {
    parseDOM: [{ tag: 'code' }],
    toDOM: () => ['code', 0],
  },
  /**
   * A kind of words: foreign words, the title of a work, a term, a mention,
   * a highlight, or a kind of the writer's own. `name` is the id of the
   * kind (`editor/kinds.ts`); `lang` the language of foreign words, as a
   * tag, and empty where none is said. A run of words has one kind.
   */
  kind: {
    attrs: { name: { default: '' }, lang: { default: '' } },
    excludes: 'kind',
    parseDOM: [
      {
        tag: 'span.kind[data-kind]',
        getAttrs: (node) => ({
          name: (node as HTMLElement).getAttribute('data-kind') ?? '',
          lang: (node as HTMLElement).getAttribute('lang') ?? '',
        }),
      },
    ],
    toDOM: (mark) => [
      'span',
      { class: 'kind', 'data-kind': mark.attrs.name, lang: mark.attrs.lang || null },
      0,
    ],
  },
  /**
   * The language of a passage, from a word to many paragraphs: `tag` is its
   * tag, "grc", "la", "de". It has no look of its own, and goes with every
   * other mark, a kind of words among them; where foreign words say a
   * language as well, this one holds. A passage over several paragraphs is
   * marked in each. It stands inside a kind of words, so that the nearest
   * language is its own. See ADR 0020.
   */
  lang: {
    attrs: { tag: { default: '' } },
    parseDOM: [
      {
        tag: 'span.lang[lang]',
        getAttrs: (node) => ({ tag: (node as HTMLElement).getAttribute('lang') ?? '' }),
      },
    ],
    toDOM: (mark) => [
      'span',
      { class: 'lang', lang: mark.attrs.tag, title: nameOfLanguage(mark.attrs.tag) },
      0,
    ],
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
  /**
   * A paragraph of a kind. `kind` is the id of its kind (`editor/kinds.ts`,
   * `project/model/families.ts`), `text` by default; `indent` its steps in,
   * for lines of verse and items of a list; `number` a number or a label
   * given to it by hand ("1234", "567a"), from which the count of its
   * passage goes on; `counted` is false for one the count passes over, as
   * the second half of a line shared between speakers; `margin` is words
   * shown in the margin beside it. See ADR 0040 and `project/model/lines.ts`.
   */
  paragraph: {
    group: 'block',
    content: 'inline*',
    attrs: {
      kind: { default: 'text' },
      indent: { default: 0 },
      number: { default: null },
      counted: { default: true },
      margin: { default: null },
    },
    parseDOM: [
      {
        tag: 'p',
        getAttrs: (node) => {
          const el = node as HTMLElement;
          return {
            kind: el.getAttribute('data-kind') || 'text',
            indent: Math.max(0, Math.round(Number(el.getAttribute('data-indent') ?? 0)) || 0),
            number: el.getAttribute('data-number') || null,
            counted: !el.hasAttribute('data-uncounted'),
            margin: el.getAttribute('data-margin') || null,
          };
        },
      },
    ],
    toDOM: (node) => [
      'p',
      {
        'data-kind': node.attrs.kind && node.attrs.kind !== 'text' ? node.attrs.kind : null,
        'data-indent': node.attrs.indent ? String(node.attrs.indent) : null,
        style: node.attrs.indent ? `--indent: ${node.attrs.indent}` : null,
        'data-number': node.attrs.number || null,
        'data-uncounted': node.attrs.counted === false ? '' : null,
        'data-margin': node.attrs.margin || null,
      },
      0,
    ],
  },
  /**
   * A run of paragraphs of one family, which the editor keeps around them
   * (`passages.ts`): a quotation, a verse, a script, a glossary, a list, a
   * code block, a draft; or a kind of the writer's own based on text, named
   * by its id. `numbering` says how its paragraphs are numbered: not at
   * all, counted from the first number given, or only by the numbers given;
   * `every` how often a counted number is shown and `side` where, each null
   * for what the layout says. Text, which forms no passage, is the default
   * of `family` only so that a passage read without one is not lost: the
   * editor undoes it. See ADR 0040.
   */
  passage: {
    group: 'block',
    content: 'paragraph+',
    defining: true,
    attrs: {
      family: { default: 'text' },
      numbering: { default: 'none' },
      every: { default: null },
      side: { default: null },
    },
    parseDOM: [
      {
        tag: 'div.passage[data-family]',
        getAttrs: (node) => {
          const el = node as HTMLElement;
          const numbering = el.getAttribute('data-numbering');
          const every = Number(el.getAttribute('data-every'));
          const side = el.getAttribute('data-side');
          return {
            family: el.getAttribute('data-family') || 'text',
            numbering: numbering === 'counted' || numbering === 'given' ? numbering : 'none',
            every: every >= 1 ? Math.round(every) : null,
            side: side === 'left' || side === 'right' ? side : null,
          };
        },
      },
    ],
    toDOM: (node) => [
      'div',
      {
        class: 'passage',
        'data-family': node.attrs.family,
        'data-numbering': node.attrs.numbering !== 'none' ? node.attrs.numbering : null,
        'data-every': node.attrs.every ? String(node.attrs.every) : null,
        'data-side': node.attrs.side || null,
      },
      0,
    ],
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
    content: '(paragraph | passage)+',
    defining: true,
    isolating: true,
    parseDOM: [{ tag: 'div.parallel-side' }],
    toDOM: () => ['div', { class: 'parallel-side' }, 0],
  },
  text: { group: 'inline' },
  // A break within a paragraph. It is drawn as a line break with a faint
  // sign at the end of its line, which the style sheet draws (app.css), so
  // that the sign is no text: not copied, searched or printed.
  hard_break: {
    group: 'inline',
    inline: true,
    selectable: false,
    parseDOM: [{ tag: 'span.hard-break' }, { tag: 'br' }],
    toDOM: () => ['span', { class: 'hard-break' }, ['br']],
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
  /**
   * A reference mark: a verse of the Bible (3:16), a page of Stephanus
   * (327a), a number of Bekker. It is no part of the words: spelling, search
   * and the count of words pass over it. How it is set, raised in the line or
   * in the margin, the layout says. See ADR 0039.
   */
  refmark: {
    group: 'inline',
    inline: true,
    atom: true,
    draggable: true,
    attrs: { label: { default: '' } },
    parseDOM: [
      {
        tag: 'span[data-refmark]',
        getAttrs: (el) => ({ label: (el as HTMLElement).getAttribute('data-refmark') ?? '' }),
      },
    ],
    toDOM: (node) => [
      'span',
      { 'data-refmark': node.attrs.label, class: 'refmark' },
      node.attrs.label,
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
