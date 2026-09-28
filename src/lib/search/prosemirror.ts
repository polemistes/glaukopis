/**
 * The passages of a document of ProseMirror, as an editor holds a text, with
 * where each piece of them is in the document: so that what was found in
 * the project can be selected and marked where an editor shows it. The
 * passages are read by the rules of `passages.ts`, and so are numbered as
 * those of the same text read without an editor.
 */

import type { Node } from 'prosemirror-model';
import { refForm } from '$lib/project/model/text';
import { NO_TEXT, PassageMaker, pieceAt, type Labels, type Passage } from './passages';

/** Where a piece is in the document: before its first sign, or before the node that is no text. */
export interface Placed {
  pos: number;
  node: Node;
}

export interface ReadDoc {
  passages: Passage[];
  refs: Placed[][];
  /** Where the content of each passage begins in the document. */
  starts: number[];
}

class Reader {
  readonly maker: PassageMaker<Placed>;
  readonly starts: number[] = [];

  constructor(labels: Labels | null) {
    this.maker = new PassageMaker<Placed>(labels);
  }

  get read(): ReadDoc {
    return { passages: this.maker.passages, refs: this.maker.refs, starts: this.starts };
  }

  /** A line of inline content that begins at `start`, and the notes in it after it. */
  line(node: Node, start: number, kind: 'line' | 'note', within?: Passage['within'], said = false) {
    const { maker } = this;
    const passage = maker.begin(kind, within);
    this.starts[passage.index] = start;
    const notes: { node: Node; pos: number; at: number }[] = [];
    node.forEach((child, offset) => {
      const pos = start + offset;
      const at = { pos, node: child };
      if (child.isText) {
        maker.put(passage, 'text', child.text ?? '', at);
        return;
      }
      switch (child.type.name) {
        case 'hard_break':
          maker.put(passage, 'break', '\n', at);
          break;
        case 'citation':
          maker.put(passage, 'citation', maker.citation(child.attrs.items, child.attrs.mode), at);
          break;
        case 'math': {
          const tex = String(child.attrs.tex ?? '').trim();
          if (tex) maker.put(passage, 'math', maker.math(tex), at);
          break;
        }
        case 'crossref': {
          const target = String(child.attrs.target ?? '');
          if (target)
            maker.put(passage, 'crossref', maker.crossref(target, refForm(child.attrs.form)), at);
          break;
        }
        case 'footnote':
          if (said) break;
          maker.put(passage, 'note', NO_TEXT, at);
          if (kind === 'line') notes.push({ node: child, pos, at: passage.text.length - 1 });
          break;
      }
    });
    for (const n of notes)
      this.line(n.node, n.pos + 1, 'note', { passage: passage.index, at: n.at });
  }

  /** The blocks of a node whose content begins at `start`. */
  blocks(parent: Node, start: number) {
    parent.forEach((child, offset) => {
      const pos = start + offset;
      switch (child.type.name) {
        case 'paragraph':
          this.line(child, pos + 1, 'line');
          break;
        case 'figure':
          this.line(child, pos + 1, 'line', undefined, true);
          break;
        case 'tabular':
          this.table(child, pos);
          break;
        case 'equation': {
          const tex = String(child.attrs.tex ?? '').trim();
          if (tex) {
            const passage = this.maker.equation(tex, { pos, node: child });
            this.starts[passage.index] = pos;
          }
          break;
        }
        default:
          if (child.isTextblock) this.line(child, pos + 1, 'line');
          else if (!child.isLeaf) this.blocks(child, pos + 1);
      }
    });
  }

  /** A table: what is said of it, and its cells. One without cells is not read, as it is not shown. */
  table(tabular: Node, pos: number) {
    let caption: { node: Node; pos: number } | null = null;
    let table: { node: Node; pos: number } | null = null;
    tabular.forEach((part, offset) => {
      if (part.type.name === 'table_caption') caption = { node: part, pos: pos + 1 + offset };
      else if (part.type.name === 'table') table = { node: part, pos: pos + 1 + offset };
    });
    const found = table as { node: Node; pos: number } | null;
    let cells = false;
    found?.node.forEach((row) => {
      if (row.childCount) cells = true;
    });
    if (!found || !cells) return;
    const said = caption as { node: Node; pos: number } | null;
    if (said) this.line(said.node, said.pos + 1, 'line', undefined, true);
    else this.starts[this.maker.begin('line').index] = pos + 1;
    found.node.forEach((row, rowOffset) => {
      const rowStart = found.pos + 1 + rowOffset + 1;
      row.forEach((cell, cellOffset) => this.blocks(cell, rowStart + cellOffset + 1));
    });
  }
}

/** The passages of the text of an element as an editor holds it. */
export function readBodyDoc(doc: Node, labels: Labels | null): ReadDoc {
  const reader = new Reader(labels);
  reader.blocks(doc, 0);
  return reader.read;
}

/** The passage of the name of an element as an editor holds it. */
export function readTitleDoc(doc: Node): ReadDoc {
  const reader = new Reader(null);
  const line = doc.firstChild;
  if (line) reader.line(line, 1, 'line');
  else reader.starts[reader.maker.begin('line').index] = 0;
  return reader.read;
}

/** The passage of one line of inline content, as the content of a node that is a document of its own. */
export function readLine(node: Node, kind: 'line' | 'note', labels: Labels | null = null): ReadDoc {
  const reader = new Reader(labels);
  reader.line(node, 0, kind);
  return reader.read;
}

/**
 * Where a place of a passage is in the document. Within what is not text, it
 * is before it, as the beginning of something found; with `end`, after it.
 */
export function positionOf(read: ReadDoc, passage: number, offset: number, end = false): number {
  const p = read.passages[passage];
  if (!p) return 0;
  if (!p.pieces.length) return read.starts[passage] ?? 0;
  // The end of something found is found in the piece it ends in.
  const i = pieceAt(p, end ? Math.max(0, offset - 1) : offset);
  const piece = p.pieces[i];
  const at = read.refs[passage][i];
  if (piece.kind === 'text') return at.pos + Math.min(offset - piece.start, piece.length);
  if (end) return offset <= piece.start ? at.pos : at.pos + at.node.nodeSize;
  return offset >= piece.start + piece.length ? at.pos + at.node.nodeSize : at.pos;
}

/** Where the content of a passage ends in the document. */
function endOf(read: ReadDoc, p: Passage): number {
  const last = p.pieces.length - 1;
  if (last < 0) return read.starts[p.index] ?? 0;
  const at = read.refs[p.index][last];
  return p.pieces[last].kind === 'text'
    ? at.pos + p.pieces[last].length
    : at.pos + at.node.nodeSize;
}

/** How far into a passage a position within it is. Within something that is no text, before it. */
function within(read: ReadDoc, p: Passage, pos: number): number {
  const refs = read.refs[p.index];
  for (let i = 0; i < p.pieces.length; i++) {
    const piece = p.pieces[i];
    const at = refs[i];
    if (pos <= at.pos) return piece.start;
    if (piece.kind === 'text') {
      if (pos <= at.pos + piece.length) return piece.start + (pos - at.pos);
    } else if (pos < at.pos + at.node.nodeSize) return piece.start;
  }
  return p.text.length;
}

/**
 * The place of a passage a position of the document is at: the passage in
 * which it is, the innermost, and how far into it. A position between
 * passages, as between two paragraphs, is at the beginning of the next;
 * with `side: 'to'`, as the end of a selection, at the end of the one before.
 */
export function offsetOf(
  read: ReadDoc,
  pos: number,
  side: 'from' | 'to' = 'from',
): { passage: number; offset: number } | null {
  let inside: { passage: number; offset: number } | null = null;
  let next: { passage: number; offset: number } | null = null;
  let before: { passage: number; offset: number } | null = null;
  for (const p of read.passages) {
    const start = read.starts[p.index] ?? 0;
    const end = endOf(read, p);
    // A note is within the passage it stands in, and comes after it: the innermost is the last.
    if (pos >= start && pos <= end) inside = { passage: p.index, offset: within(read, p, pos) };
    else if (p.within) continue;
    else if (pos < start) next ??= { passage: p.index, offset: 0 };
    else before = { passage: p.index, offset: p.text.length };
  }
  if (inside) return inside;
  return side === 'from' ? (next ?? before) : (before ?? next);
}
