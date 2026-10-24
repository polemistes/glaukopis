/**
 * The shape of a text as the editor finds it in its nodes (ADR 0041): the
 * lines of a paragraph, each with the line mark that begins it, and the
 * runs of paragraphs of one kind. Nothing here is stored: a run is seen,
 * and drawn by its bracket (`brackets.ts`); the numbers of a stretch are
 * counted by `project/model/lines.ts` over the paragraphs as blocks.
 */

import type { Node } from 'prosemirror-model';
import { renamed, type BasedKind } from '$lib/project/model/families';
import type { Inline, InlineLineMark, ParagraphBlock } from '$lib/project/model/text';
import { amongOthers } from './kinds';

/** A line of a paragraph in the document. */
export interface LineAt {
  /** Which line of its paragraph it is, from nought. */
  index: number;
  /** Where the line begins: where its mark stands, or would. */
  start: number;
  /** Where it ends: at the line break after it, or the end of the paragraph. */
  end: number;
  /** The line mark at its start, if any. */
  mark: Node | null;
  /** Whether it holds nothing to read. */
  blank: boolean;
}

/** The kind of a paragraph, by its id as it is now. */
export const kindOfNode = (node: Node): string => renamed((node.attrs.kind as string) || 'text');

/** The lines of the paragraph that begins at `pos`, parted by its line breaks. */
export function linesOfNode(paragraph: Node, pos: number): LineAt[] {
  const out: LineAt[] = [];
  let start = pos + 1;
  let mark: Node | null = null;
  let first = true;
  let blank = true;
  paragraph.forEach((child, offset) => {
    const at = pos + 1 + offset;
    const name = child.type.name;
    if (name === 'hard_break') {
      out.push({ index: out.length, start, end: at, mark, blank });
      start = at + child.nodeSize;
      mark = null;
      first = true;
      blank = true;
      return;
    }
    if (name === 'linemark') {
      if (first) mark = child;
    } else if (child.isText) {
      if (child.text?.trim()) blank = false;
    } else blank = false;
    first = false;
  });
  out.push({ index: out.length, start, end: pos + paragraph.nodeSize - 1, mark, blank });
  return out;
}

/** What a line mark says, as the text model has it. */
export function markOf(node: Node): InlineLineMark {
  const a = node.attrs;
  return {
    kind: 'linemark',
    ...(typeof a.number === 'string' && a.number.trim() ? { number: a.number.trim() } : {}),
    ...(a.counted === false ? { counted: false as const } : {}),
    ...(a.hidden === true ? { hidden: true as const } : {}),
    ...(a.shown === true && a.hidden !== true ? { shown: true as const } : {}),
    ...(typeof a.margin === 'string' && a.margin.trim() ? { margin: a.margin.trim() } : {}),
    ...(Number(a.indent) > 0 ? { indent: Number(a.indent) } : {}),
    ...(a.continues === true ? { continues: true as const } : {}),
  };
}

/** Whether the attributes of a line mark say anything. */
export function marksAnything(attrs: Record<string, unknown>): boolean {
  return !!(
    (typeof attrs.number === 'string' && attrs.number.trim()) ||
    attrs.counted === false ||
    attrs.hidden === true ||
    attrs.shown === true ||
    (typeof attrs.margin === 'string' && attrs.margin.trim()) ||
    Number(attrs.indent) > 0 ||
    attrs.continues === true
  );
}

/**
 * A paragraph as the text model has it, as much as the count of its lines
 * needs: its kind, its settings, and its content as text, line breaks and
 * line marks; what is neither text nor a line is a sign that is read.
 */
export function blockOf(node: Node): ParagraphBlock {
  const content: Inline[] = [];
  node.forEach((child) => {
    if (child.isText) content.push({ kind: 'text', text: child.text ?? '', marks: {} });
    else if (child.type.name === 'hard_break') content.push({ kind: 'break' });
    else if (child.type.name === 'linemark') content.push(markOf(child));
    else content.push({ kind: 'text', text: '￼', marks: {} });
  });
  const numbering = node.attrs.numbering;
  return {
    kind: 'paragraph',
    name: kindOfNode(node),
    indent: Number(node.attrs.indent) || 0,
    ...(numbering === 'counted' || numbering === 'given' ? { numbering } : {}),
    ...(Number(node.attrs.every) >= 1 ? { every: Number(node.attrs.every) } : {}),
    ...(node.attrs.side === 'left' || node.attrs.side === 'right' ? { side: node.attrs.side } : {}),
    ...(typeof node.attrs.only === 'string' && node.attrs.only ? { only: node.attrs.only } : {}),
    ...(node.attrs.new === true ? { new: true as const } : {}),
    content,
  };
}

/** Calls `f` with every node that holds paragraphs, and where its content begins: the text, the sides of texts side by side, the cells of tables. */
export function eachHolder(doc: Node, f: (parent: Node, start: number) => void) {
  f(doc, 0);
  doc.descendants((node, pos) => {
    if (node.isTextblock) return false;
    let holds = false;
    node.forEach((child) => {
      if (child.type.name === 'paragraph') holds = true;
    });
    if (holds) f(node, pos + 1);
    return true;
  });
}

/** A paragraph among its fellows, with where it begins. */
export interface Placed {
  node: Node;
  pos: number;
}

/**
 * A run: paragraphs of one kind standing together, with the speakers and
 * directions among them, which do not part a run; a paragraph that says it
 * begins a new run begins one. `kind` is the kind of the run; one of
 * speakers and directions alone has the kind of its first.
 */
export interface Run {
  kind: string;
  paragraphs: Placed[];
  /** Whether it is of speakers and directions alone. */
  among: boolean;
}

/**
 * The runs among the children of a node whose content begins at `start`.
 * Speakers and directions between two paragraphs of one kind are within
 * their run; those before a run of a kind go with it, and those before
 * text with the run before them, if there is one: a direction at the end
 * of a verse is the verse's. Those that stand alone are a run of their own.
 * Anything that is not a paragraph ends a run.
 */
export function runsIn(parent: Node, start: number, own: readonly BasedKind[] = []): Run[] {
  const out: Run[] = [];
  let current: Run | null = null;
  let waiting: Placed[] = [];
  /** Whether one of those waiting begins a new run, so that what follows is not joined to the one before. */
  let parted = false;
  /** Those waiting, with the run before, or as a run of their own. */
  const settle = () => {
    if (!waiting.length) return;
    if (current && !current.among) current.paragraphs.push(...waiting);
    else {
      current = { kind: kindOfNode(waiting[0].node), paragraphs: [...waiting], among: true };
      out.push(current);
    }
    waiting = [];
  };
  let pos = start;
  parent.forEach((node) => {
    const here = pos;
    pos += node.nodeSize;
    if (node.type.name !== 'paragraph') {
      settle();
      current = null;
      parted = false;
      return;
    }
    const kind = kindOfNode(node);
    const placed = { node, pos: here };
    if (amongOthers(kind, own)) {
      if (node.attrs.new === true && !parted) {
        settle();
        parted = true;
      }
      waiting.push(placed);
      return;
    }
    const goesOn =
      current && !current.among && current.kind === kind && node.attrs.new !== true && !parted;
    parted = false;
    if (goesOn) {
      current!.paragraphs.push(...waiting, placed);
      waiting = [];
      return;
    }
    if (kind === 'text') settle();
    current = { kind, paragraphs: [...waiting, placed], among: false };
    waiting = [];
    out.push(current);
  });
  settle();
  return out;
}
