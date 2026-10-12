/**
 * Writing text into the project document without an editor: from the blocks
 * that `text.ts` reads to the elements of XML that y-prosemirror keeps for
 * the editors, written as the editors would write them: an element named
 * after each node with the attributes the node has, and a text of XML for
 * each run of words, whose formatting attributes are the marks. The inverse
 * of `readBody` and `readTitle`. Only the shape texts are written in now is
 * written (ADR 0040); the old shape never.
 *
 * What the schema has no place for is not written: a note within a note, a
 * note in what is said of a figure, anything but paragraphs in a cell.
 */

import * as Y from 'yjs';
import { figureWidth, foundAttrs, tableWidth } from '$lib/editor/schema';
import { newId } from '$lib/util/id';
import {
  blocksText,
  indentOf,
  type Block,
  type Inline,
  type InlineText,
  type ParagraphBlock,
  type PassageBlock,
  type TableCell,
} from './text';

/** Where a line stands: in the text, in a note, or in what is said of a figure or a table. */
type Line = 'text' | 'note' | 'said';

type Child = Y.XmlElement | Y.XmlText;

/** The marks of the text of an element, as `editor/schema.ts` has them. */
const BODY_MARKS = new Set([
  'em',
  'strong',
  'smallcaps',
  'sup',
  'sub',
  'strike',
  'underline',
  'code',
  'kind',
  'lang',
  'link',
  'found',
]);

/** The marks a name can have. */
const TITLE_MARKS = new Set(['em', 'smallcaps', 'sup', 'sub']);

/**
 * The marks of a run of words as attributes of its text, each what the
 * mark holds, as y-prosemirror writes them. A mark that is not known, or
 * that lacks what it needs, is left out; raised and lowered at once is not
 * a thing, and the last said holds.
 */
function attributesOf(marks: InlineText['marks'], known: Set<string>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [named, value] of Object.entries(marks ?? {})) {
    // Raised and lowered text was once kept by y-prosemirror under its name
    // and something more: "sup--2fdn…".
    const name = named.split('--')[0];
    if (!known.has(name) || value == null || (value as unknown) === false) continue;
    const held = typeof value === 'object' ? value : {};
    if (name === 'link') {
      const href = held.href;
      if (typeof href !== 'string' || !href) continue;
      out.link = { href };
    } else if (name === 'found') {
      // A citation that was found: what is known of it goes with the text.
      const found = foundAttrs(value);
      if (found) out.found = found;
    } else if (name === 'kind') {
      // A kind of words, with the language of a foreign word.
      const kind = held.name;
      if (typeof kind !== 'string' || !kind) continue;
      out.kind = { name: kind, lang: typeof held.lang === 'string' ? held.lang : '' };
    } else if (name === 'lang') {
      // The language of a passage.
      const tag = held.tag;
      if (typeof tag !== 'string' || !tag.trim()) continue;
      out.lang = { tag: tag.trim() };
    } else {
      if (name === 'sup') delete out.sub;
      if (name === 'sub') delete out.sup;
      out[name] = {};
    }
  }
  return out;
}

/** An element with these attributes, those that are nothing left out, holding these children. */
function element(
  name: string,
  attrs: Record<string, unknown> = {},
  children: Child[] = [],
): Y.XmlElement {
  const el = new Y.XmlElement(name);
  for (const [key, value] of Object.entries(attrs))
    if (value !== null && value !== undefined) el.setAttribute(key, value as unknown as string);
  if (children.length) el.insert(0, children);
  return el;
}

/**
 * The children of an element that holds inline content: a text of XML for
 * each run of words, an element for what is not words. In a note, no note;
 * in what is said of a figure or a table, no note and no reference mark.
 */
function inlineChildren(inlines: Inline[], line: Line, known = BODY_MARKS): Child[] {
  const out: Child[] = [];
  let text: Y.XmlText | null = null;
  let at = 0;
  for (const i of inlines) {
    if (i.kind === 'text') {
      if (!i.text) continue;
      if (!text) {
        text = new Y.XmlText();
        at = 0;
        out.push(text);
      }
      text.insert(at, i.text, attributesOf(i.marks, known));
      at += i.text.length;
      continue;
    }
    text = null;
    switch (i.kind) {
      case 'break':
        out.push(element('hard_break'));
        break;
      case 'math':
        if (i.tex.trim()) out.push(element('math', { tex: i.tex.trim() }));
        break;
      case 'citation': {
        const items = i.items.filter((item) => item && typeof item.id === 'string' && item.id);
        if (items.length)
          out.push(element('citation', { items, mode: i.mode === 'intext' ? 'intext' : 'normal' }));
        break;
      }
      case 'crossref':
        if (i.target) out.push(element('crossref', { target: i.target, form: i.form }));
        break;
      case 'refmark':
        if (line !== 'said' && i.label.trim())
          out.push(element('refmark', { label: i.label.trim() }));
        break;
      case 'footnote':
        if (line === 'text')
          out.push(
            element('footnote', { place: i.place ?? '' }, inlineChildren(i.content, 'note')),
          );
        break;
    }
  }
  return out;
}

/** A paragraph as the editors write one: its kind, indent and count always, its number and margin where given. */
function paragraphElement(p: ParagraphBlock): Y.XmlElement {
  return element(
    'paragraph',
    {
      kind: p.name || 'text',
      indent: indentOf(p.indent),
      number: p.number?.trim() || null,
      counted: p.counted !== false,
      margin: p.margin?.trim() || null,
    },
    inlineChildren(p.content, 'text'),
  );
}

/** A passage: its family and numbering always, every how many and the side where the passage says. */
function passageElement(p: PassageBlock): Y.XmlElement | null {
  if (!p.content.length) return null;
  const every = Math.round(Number(p.every));
  return element(
    'passage',
    {
      family: p.family,
      numbering: p.numbering,
      every: p.every != null && Number.isFinite(every) && every > 0 ? every : null,
      side: p.side === 'left' || p.side === 'right' ? p.side : null,
    },
    p.content.map(paragraphElement),
  );
}

const flowOf = (wrap: boolean | undefined) => (wrap === undefined ? '' : wrap ? 'around' : 'apart');

const emptyParagraph = () => element('paragraph', { kind: 'text', indent: 0, counted: true });

function cellElement(cell: TableCell): Y.XmlElement {
  // A cell holds paragraphs, of whatever kind; what else stands in it is written as the text it has.
  const content: Y.XmlElement[] = [];
  for (const block of cell.content) {
    if (block.kind === 'paragraph') content.push(paragraphElement(block));
    else if (block.kind === 'passage') content.push(...block.content.map(paragraphElement));
    else {
      for (const line of blocksText([block]).split('\n')) {
        if (line.trim())
          content.push(
            paragraphElement({
              kind: 'paragraph',
              name: 'text',
              indent: 0,
              content: [{ kind: 'text', text: line.trim(), marks: {} }],
            }),
          );
      }
    }
  }
  if (!content.length) content.push(emptyParagraph());
  return element(
    cell.header ? 'table_header' : 'table_cell',
    {
      colspan: Math.max(1, Math.round(cell.colspan) || 1),
      rowspan: Math.max(1, Math.round(cell.rowspan) || 1),
      align: cell.align ?? '',
    },
    content,
  );
}

/** What stands by itself: an equation, a figure, a table. Nothing of one that holds nothing. */
function setOff(block: Block): Y.XmlElement | null {
  switch (block.kind) {
    case 'equation':
      if (!block.tex.trim()) return null;
      return element('equation', {
        id: block.id || newId(),
        tex: block.tex.trim(),
        numbered: !!block.numbered,
        align: block.align ?? '',
      });
    case 'figure':
      return element(
        'figure',
        {
          id: block.id || newId(),
          file: block.file,
          extension: block.extension,
          name: block.name,
          alt: block.alt,
          width: figureWidth(block.width),
          numbered: block.numbered !== false,
          align: block.align ?? '',
          flow: flowOf(block.wrap),
        },
        inlineChildren(block.caption, 'said'),
      );
    case 'table': {
      const rows = block.rows
        .filter((row) => row.length)
        .map((row) => element('table_row', {}, row.map(cellElement)));
      if (!rows.length) return null;
      return element(
        'tabular',
        {
          id: block.id || newId(),
          numbered: block.numbered !== false,
          align: block.align ?? '',
          flow: flowOf(block.wrap),
          width: tableWidth(block.width),
        },
        [
          element('table_caption', {}, inlineChildren(block.caption, 'said')),
          element('table', {}, rows),
        ],
      );
    }
    default:
      return null;
  }
}

/**
 * A text as the elements of XML the project keeps it in. Figures, equations
 * and tables that have no id are given one; a passage of nothing is not written.
 */
export function blockElements(blocks: readonly Block[]): Y.XmlElement[] {
  const out: Y.XmlElement[] = [];
  for (const block of blocks) {
    switch (block.kind) {
      case 'paragraph':
        out.push(paragraphElement(block));
        break;
      case 'passage': {
        const el = passageElement(block);
        if (el) out.push(el);
        break;
      }
      case 'parallel': {
        const side = (list: Block[]) => {
          const content = blockElements(list);
          return element('parallel_side', {}, content.length ? content : [emptyParagraph()]);
        };
        out.push(element('parallel', {}, [side(block.left), side(block.right)]));
        break;
      }
      case 'row': {
        const items = block.items.flatMap((item) => setOff(item) ?? []);
        if (items.length === 1) out.push(items[0]);
        else if (items.length) out.push(element('row', {}, items));
        break;
      }
      default: {
        const el = setOff(block);
        if (el) out.push(el);
      }
    }
  }
  return out;
}

/** A name as the element the project keeps it in: one line of text, with the marks a name can have. */
export function nameElement(name: Inline[]): Y.XmlElement {
  const words: Inline[] = [];
  for (const i of name) {
    // A name is one line: what is not text is written as the text it has, or not at all.
    const text =
      i.kind === 'text' ? i.text : i.kind === 'math' ? i.tex : i.kind === 'break' ? ' ' : '';
    const clean = text.replace(/\s+/g, ' ');
    if (clean) words.push({ kind: 'text', text: clean, marks: i.kind === 'text' ? i.marks : {} });
  }
  return element('title', {}, inlineChildren(words, 'said', TITLE_MARKS));
}

/**
 * Writes a text into the place the project has for it, in place of what
 * stood there. Nothing is written of a text that is empty.
 */
export function writeBody(fragment: Y.XmlFragment, blocks: Block[]) {
  if (!blocks.length) return;
  const elements = blockElements(blocks);
  if (fragment.length) fragment.delete(0, fragment.length);
  fragment.insert(0, elements.length ? elements : [emptyParagraph()]);
}

/** Writes a name into the place the project has for it, in place of what stood there. */
export function writeName(fragment: Y.XmlFragment, name: Inline[]) {
  if (fragment.length) fragment.delete(0, fragment.length);
  fragment.insert(0, [nameElement(name)]);
}
