/**
 * Writing text into the project document without an editor: from the blocks
 * that `text.ts` reads to a document of ProseMirror, which y-prosemirror
 * writes as the editors do. The inverse of `readBody` and `readTitle`.
 *
 * What the schema has no place for is not written: a note within a note, a
 * note in what is said of a figure, anything but paragraphs in a cell.
 */

import { Mark, type Node, type Schema } from 'prosemirror-model';
import { prosemirrorToYXmlFragment } from 'y-prosemirror';
import type * as Y from 'yjs';
import { bodySchema, figureWidth, foundAttrs, tableWidth, titleSchema } from '$lib/editor/schema';
import { newId } from '$lib/util/id';
import { blocksText, type Block, type Inline, type InlineText, type TableCell } from './text';

/** Where a line stands: in the text, in a note, or in what is said of a figure or a table. */
type Line = 'text' | 'note' | 'said';

function marksOf(schema: Schema, marks: InlineText['marks']): readonly Mark[] {
  let set: readonly Mark[] = Mark.none;
  for (const [named, value] of Object.entries(marks ?? {})) {
    // Raised and lowered text was once kept by y-prosemirror under its name
    // and something more: "sup--2fdn…".
    const name = named.split('--')[0];
    const type = schema.marks[name];
    if (!type || value == null || (value as unknown) === false) continue;
    if (name === 'link') {
      const href = typeof value === 'object' ? value.href : undefined;
      if (typeof href !== 'string' || !href) continue;
      set = type.create({ href }).addToSet(set);
    } else if (name === 'found') {
      // A citation that was found: what is known of it goes with the text.
      const held = foundAttrs(value);
      if (held) set = type.create(held).addToSet(set);
    } else set = type.create().addToSet(set);
  }
  return set;
}

function inlineNodes(inlines: Inline[], line: Line): Node[] {
  const { nodes } = bodySchema;
  const out: Node[] = [];
  for (const i of inlines) {
    switch (i.kind) {
      case 'text':
        if (i.text) out.push(bodySchema.text(i.text, marksOf(bodySchema, i.marks)));
        break;
      case 'break':
        out.push(nodes.hard_break.create());
        break;
      case 'math':
        if (i.tex.trim()) out.push(nodes.math.create({ tex: i.tex.trim() }));
        break;
      case 'citation': {
        const items = i.items.filter((item) => item && typeof item.id === 'string' && item.id);
        if (items.length)
          out.push(
            nodes.citation.create({ items, mode: i.mode === 'intext' ? 'intext' : 'normal' }),
          );
        break;
      }
      case 'crossref':
        if (i.target) out.push(nodes.crossref.create({ target: i.target, form: i.form }));
        break;
      case 'footnote':
        if (line === 'text')
          out.push(nodes.footnote.create({ place: i.place ?? '' }, inlineNodes(i.content, 'note')));
        break;
    }
  }
  return out;
}

const flowOf = (wrap: boolean | undefined) => (wrap === undefined ? '' : wrap ? 'around' : 'apart');

function cellNode(cell: TableCell): Node {
  const { nodes } = bodySchema;
  // A cell holds paragraphs; what else stands in it is written as the text it has.
  const content: Node[] = [];
  for (const block of cell.content) {
    if (block.kind === 'paragraph')
      content.push(nodes.paragraph.create(null, inlineNodes(block.content, 'text')));
    else {
      for (const line of blocksText([block]).split('\n')) {
        if (line.trim()) content.push(nodes.paragraph.create(null, bodySchema.text(line.trim())));
      }
    }
  }
  if (!content.length) content.push(nodes.paragraph.create());
  return (cell.header ? nodes.table_header : nodes.table_cell).create(
    {
      colspan: Math.max(1, Math.round(cell.colspan) || 1),
      rowspan: Math.max(1, Math.round(cell.rowspan) || 1),
      align: cell.align ?? '',
    },
    content,
  );
}

function setOff(block: Block): Node | null {
  const { nodes } = bodySchema;
  switch (block.kind) {
    case 'equation':
      if (!block.tex.trim()) return null;
      return nodes.equation.create({
        id: block.id || newId(),
        tex: block.tex.trim(),
        numbered: !!block.numbered,
        align: block.align ?? '',
      });
    case 'figure':
      return nodes.figure.create(
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
        inlineNodes(block.caption, 'said'),
      );
    case 'table': {
      const rows = block.rows
        .filter((row) => row.length)
        .map((row) => nodes.table_row.create(null, row.map(cellNode)));
      if (!rows.length) return null;
      return nodes.tabular.create(
        {
          id: block.id || newId(),
          numbered: block.numbered !== false,
          align: block.align ?? '',
          flow: flowOf(block.wrap),
          width: tableWidth(block.width),
        },
        [
          nodes.table_caption.create(null, inlineNodes(block.caption, 'said')),
          nodes.table.create(null, rows),
        ],
      );
    }
    default:
      return null;
  }
}

function itemNode(item: Block[]): Node {
  const { nodes } = bodySchema;
  const content = blockNodes(item);
  // An item begins with a paragraph, whatever else it holds.
  if (content[0]?.type !== nodes.paragraph) content.unshift(nodes.paragraph.create());
  return nodes.list_item.create(null, content);
}

function blockNodes(blocks: Block[]): Node[] {
  const { nodes } = bodySchema;
  const out: Node[] = [];
  for (const block of blocks) {
    switch (block.kind) {
      case 'paragraph':
        out.push(nodes.paragraph.create(null, inlineNodes(block.content, 'text')));
        break;
      case 'blockquote': {
        const content = blockNodes(block.content);
        if (content.length) out.push(nodes.blockquote.create(null, content));
        break;
      }
      case 'bullet_list':
        if (block.items.length) out.push(nodes.bullet_list.create(null, block.items.map(itemNode)));
        break;
      case 'ordered_list':
        if (block.items.length)
          out.push(
            nodes.ordered_list.create(
              { start: Math.max(1, Math.round(block.start) || 1) },
              block.items.map(itemNode),
            ),
          );
        break;
      case 'row': {
        const items = block.items.flatMap((item) => setOff(item) ?? []);
        if (items.length === 1) out.push(items[0]);
        else if (items.length) out.push(nodes.row.create(null, items));
        break;
      }
      default: {
        const node = setOff(block);
        if (node) out.push(node);
      }
    }
  }
  return out;
}

/**
 * A text as a document of ProseMirror. Figures, equations and tables that
 * have no id are given one.
 */
export function blocksToDoc(blocks: Block[]): Node {
  const content = blockNodes(blocks);
  return bodySchema.nodes.doc.create(
    null,
    content.length ? content : [bodySchema.nodes.paragraph.create()],
  );
}

/** A name as a document of ProseMirror: text, with the marks a name can have. */
export function nameToDoc(name: Inline[]): Node {
  const content: Node[] = [];
  for (const i of name) {
    // A name is one line: what is not text is written as the text it has, or not at all.
    const text =
      i.kind === 'text' ? i.text : i.kind === 'math' ? i.tex : i.kind === 'break' ? ' ' : '';
    const clean = text.replace(/\s+/g, ' ');
    if (clean)
      content.push(titleSchema.text(clean, marksOf(titleSchema, i.kind === 'text' ? i.marks : {})));
  }
  return titleSchema.nodes.doc.create(null, titleSchema.nodes.title.create(null, content));
}

/** Writes a text into the place the project has for it. Nothing is written of a text that is empty. */
export function writeBody(fragment: Y.XmlFragment, blocks: Block[]) {
  if (!blocks.length) return;
  prosemirrorToYXmlFragment(blocksToDoc(blocks), fragment);
}

/** Writes a name into the place the project has for it. */
export function writeName(fragment: Y.XmlFragment, name: Inline[]) {
  prosemirrorToYXmlFragment(nameToDoc(name), fragment);
}
