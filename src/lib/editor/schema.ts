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

/**
 * The works of a citation, from what may be them: an array of objects each
 * with the id of a reference, and of what else each holds only what a work
 * of a citation says, as the type it says it in. Nothing, where it is not
 * that, as a `data-citation` of another program's own.
 */
export function citeItems(value: unknown): CiteItem[] | null {
  if (!Array.isArray(value)) return null;
  const items: CiteItem[] = [];
  for (const held of value as unknown[]) {
    if (!held || typeof held !== 'object') return null;
    const item = held as Record<string, unknown>;
    if (typeof item.id !== 'string' || !item.id) return null;
    const out: CiteItem = { id: item.id };
    for (const key of ['locator', 'label', 'prefix', 'suffix'] as const) {
      if (typeof item[key] === 'string') out[key] = item[key];
    }
    if (item.suppressAuthor === true) out.suppressAuthor = true;
    items.push(out);
  }
  return items;
}

/** Steps of indentation, from what may be one: none to eight. */
function indentAttr(value: unknown): number {
  return Math.max(0, Math.min(8, Math.round(Number(value ?? 0)) || 0));
}

/** How a stretch is numbered, from what may say it: nothing where it is not numbered. */
export function numberingAttr(value: unknown): 'counted' | 'given' | null {
  return value === 'counted' || value === 'given' ? value : null;
}

/** Every how many a number is shown: a whole number from one, or nothing for the layout's. */
export function everyAttr(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = Math.round(Number(value));
  return Number.isFinite(n) && n >= 1 ? n : null;
}

/** The side the numbers stand on, or nothing for the layout's. */
export function sideAttr(value: unknown): 'left' | 'right' | null {
  return value === 'left' || value === 'right' ? value : null;
}

/** The one kind whose lines a stretch counts, by its id, or nothing for every kind. */
export function onlyAttr(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

const bodyNodes: Record<string, NodeSpec> = {
  doc: { content: 'block+' },
  /**
   * A paragraph of a kind. `kind` is the id of its kind (`editor/kinds.ts`,
   * `project/model/families.ts`), `text` by default; `indent` its steps in,
   * from none to eight. A paragraph is lines, parted by `hard_break`; what
   * is said of one line by hand stands in a `linemark` at its start.
   * `numbering`, `every`, `side` and `only` are the settings of the
   * numbered stretch it stands in: consecutive paragraphs with the same
   * settings are numbered together, whatever their kinds
   * (`project/model/lines.ts`). `numbering` is `counted` or `given`,
   * nothing where it is not numbered; `every` how often a counted number is
   * shown and `side` where, nothing for what the layout says; `only` the
   * one kind whose lines are counted, nothing for every kind that is
   * counted. `new` is true where the paragraph begins a
   * new run of its kind beside another of the same kind. What is not said
   * is nothing, never false, so that it is not stored. See ADR 0041.
   */
  paragraph: {
    group: 'block',
    content: 'inline*',
    attrs: {
      kind: { default: 'text' },
      indent: { default: 0 },
      numbering: { default: null },
      every: { default: null },
      side: { default: null },
      only: { default: null },
      new: { default: null },
    },
    parseDOM: [
      {
        tag: 'p',
        getAttrs: (node) => {
          const el = node as HTMLElement;
          return {
            kind: el.getAttribute('data-kind') || 'text',
            indent: indentAttr(el.getAttribute('data-indent')),
            numbering: numberingAttr(el.getAttribute('data-numbering')),
            every: everyAttr(el.getAttribute('data-every')),
            side: sideAttr(el.getAttribute('data-side')),
            only: onlyAttr(el.getAttribute('data-only')),
            new: el.hasAttribute('data-new') ? true : null,
          };
        },
      },
    ],
    toDOM: (node) => {
      const every = everyAttr(node.attrs.every);
      return [
        'p',
        {
          'data-kind': node.attrs.kind && node.attrs.kind !== 'text' ? node.attrs.kind : null,
          'data-indent': node.attrs.indent ? String(node.attrs.indent) : null,
          style: node.attrs.indent ? `--indent: ${node.attrs.indent}` : null,
          'data-numbering': numberingAttr(node.attrs.numbering),
          'data-every': every ? String(every) : null,
          'data-side': sideAttr(node.attrs.side),
          'data-only': onlyAttr(node.attrs.only),
          'data-new': node.attrs.new === true ? '' : null,
        },
        0,
      ];
    },
  },
  /**
   * What the writer said of one line by hand, where lines are numbered: it
   * stands at the start of the line, first in its paragraph or right after
   * a line break, and shows nothing itself; the numbers in the margin are
   * drawn by the editor (`editor/numbers.ts`). `number` a number or a label
   * given by hand ("1234", "567a"), from which the count goes on; `counted`
   * false for a line the count passes over; `hidden` true for one that is
   * counted and never shows its number, `shown` true for one that always
   * does; `margin` words shown in the margin beside it, the annotation;
   * `indent` the line's own steps in, for verse; `continues` true for a
   * line that begins where the line before ended, which the editor sets in
   * by measuring that line (`editor/continues.ts`). Each is nothing where it
   * is not said. A mark that says nothing is taken away.
   */
  linemark: {
    group: 'inline',
    inline: true,
    atom: true,
    selectable: false,
    attrs: {
      number: { default: null },
      counted: { default: null },
      hidden: { default: null },
      shown: { default: null },
      margin: { default: null },
      indent: { default: null },
      continues: { default: null },
    },
    parseDOM: [
      {
        tag: 'span.linemark',
        getAttrs: (node) => {
          const el = node as HTMLElement;
          return {
            number: el.getAttribute('data-number') || null,
            counted: el.hasAttribute('data-uncounted') ? false : null,
            hidden: el.hasAttribute('data-hidden') ? true : null,
            shown: el.hasAttribute('data-shown') && !el.hasAttribute('data-hidden') ? true : null,
            margin: el.getAttribute('data-margin') || null,
            indent: indentAttr(el.getAttribute('data-indent')) || null,
            continues: el.hasAttribute('data-continues') ? true : null,
          };
        },
      },
    ],
    toDOM: (node) => [
      'span',
      {
        class: 'linemark',
        'data-number': node.attrs.number || null,
        'data-uncounted': node.attrs.counted === false ? '' : null,
        'data-hidden': node.attrs.hidden === true ? '' : null,
        'data-shown': node.attrs.shown === true ? '' : null,
        'data-margin': node.attrs.margin || null,
        'data-indent': node.attrs.indent ? String(node.attrs.indent) : null,
        'data-continues': node.attrs.continues === true ? '' : null,
        style: node.attrs.indent ? `--indent: ${node.attrs.indent}` : null,
      },
    ],
  },
  /** A break of the page or of the column: what follows stands at the top of the next. */
  pagebreak: {
    group: 'block',
    atom: true,
    selectable: true,
    attrs: { what: { default: 'page' } },
    parseDOM: [
      {
        tag: 'div.pagebreak',
        getAttrs: (node) => ({
          what: (node as HTMLElement).getAttribute('data-what') === 'column' ? 'column' : 'page',
        }),
      },
    ],
    toDOM: (node) => [
      'div',
      { class: 'pagebreak', 'data-what': node.attrs.what === 'column' ? 'column' : 'page' },
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
    content: 'paragraph+',
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
          // The attribute may come from another program's HTML, pasted:
          // a span is taken for a citation only where it holds works.
          try {
            const el = node as HTMLElement;
            const items = citeItems(JSON.parse(el.getAttribute('data-citation') ?? '[]'));
            if (!items) return false;
            return {
              items,
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
