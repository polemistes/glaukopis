/**
 * Where what stands by itself stands: a figure, a table, an equation. To
 * the left, in the middle, to the right; with the text flowing around it;
 * beside others, in a row.
 */

import type { Node } from 'prosemirror-model';
import {
  NodeSelection,
  Plugin,
  type Command,
  type EditorState,
  type Transaction,
} from 'prosemirror-state';
import { ySyncPluginKey } from 'y-prosemirror';
import type { DocumentFormat } from '$lib/api/documents';
import { flow, stand, type Flow, type Stand } from '$lib/editor/schema';

/** The most that stand beside each other. */
export const MOST_BESIDE = 4;

const STANDS_ALONE = ['figure', 'equation', 'tabular'];

export type Side = 'left' | 'center' | 'right';

/** Where things of a kind stand when nothing is said of one: what the format says. */
export interface Usual {
  align: Side;
  wrap: boolean;
}

export function usualOf(
  format: DocumentFormat | undefined,
  kind: 'figure' | 'table' | 'equation',
): Usual {
  const side = (value: unknown): Side => (value === 'left' || value === 'right' ? value : 'center');
  switch (kind) {
    case 'figure':
      return { align: side(format?.figures?.align), wrap: !!format?.figures?.wrap };
    case 'table':
      return { align: side(format?.tables?.align), wrap: !!format?.tables?.wrap };
    case 'equation':
      return { align: side(format?.equations?.align), wrap: false };
  }
}

/** Where something stands, and whether the text flows around it: what is said of it, or what is usual. */
export function placed(
  attrs: { align?: unknown; flow?: unknown },
  usual: Usual,
): { stand: Side; around: boolean } {
  const to = stand(attrs.align) || usual.align;
  const said = flow(attrs.flow);
  const around = (said ? said === 'around' : usual.wrap) && to !== 'center';
  return { stand: to, around };
}

export const SIDES: { value: Stand; label: string }[] = [
  { value: '', label: 'As the format' },
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Middle' },
  { value: 'right', label: 'Right' },
];

export const FLOWS: { value: Flow; label: string }[] = [
  { value: '', label: 'As the format' },
  { value: 'around', label: 'Flows around it' },
  { value: 'apart', label: 'Stands apart' },
];

export const sideWords: Record<Side, string> = {
  left: 'to the left',
  center: 'in the middle',
  right: 'to the right',
};

/** What stands at a position, if it is something that stands by itself. */
function standing(state: EditorState, pos: number): Node | null {
  const node = state.doc.nodeAt(pos);
  return node && STANDS_ALONE.includes(node.type.name) ? node : null;
}

/** Whether what stands at a position stands in a row. */
export function inRow(state: EditorState, pos: number): boolean {
  if (!standing(state, pos)) return false;
  return state.doc.resolve(pos).parent.type.name === 'row';
}

/** Whether what stands at a position could stand beside what is before it. */
export function canStandBeside(state: EditorState, pos: number): boolean {
  if (!standing(state, pos) || !state.schema.nodes.row) return false;
  const at = state.doc.resolve(pos);
  if (at.parent.type.name === 'row' || at.index() === 0) return false;
  const before = at.parent.child(at.index() - 1);
  if (before.type.name === 'row') return before.childCount < MOST_BESIDE;
  return STANDS_ALONE.includes(before.type.name);
}

/**
 * Puts what stands at a position beside what stands before it: into the
 * row that is there, or into a row that is made of the two. It is left
 * selected where it then stands.
 */
export function standBeside(pos: number): Command {
  return (state, dispatch) => {
    if (!canStandBeside(state, pos)) return false;
    const node = state.doc.nodeAt(pos)!;
    const at = state.doc.resolve(pos);
    const before = at.parent.child(at.index() - 1);
    if (dispatch) {
      const tr = state.tr;
      let now: number;
      if (before.type.name === 'row') {
        tr.delete(pos, pos + node.nodeSize);
        // The row ends where the thing began: within it, one step before.
        now = pos - 1;
        tr.insert(now, node);
      } else {
        const from = pos - before.nodeSize;
        tr.replaceWith(
          from,
          pos + node.nodeSize,
          state.schema.nodes.row.create(null, [before, node]),
        );
        now = from + 1 + before.nodeSize;
      }
      tr.setSelection(NodeSelection.create(tr.doc, now));
      dispatch(tr.scrollIntoView());
    }
    return true;
  };
}

/** Takes what stands at a position out of its row, to stand by itself after it. */
export function standAlone(pos: number): Command {
  return (state, dispatch) => {
    if (!inRow(state, pos)) return false;
    const node = state.doc.nodeAt(pos)!;
    const at = state.doc.resolve(pos);
    const row = at.parent;
    const rowStart = at.before();
    if (dispatch) {
      const tr = state.tr;
      if (row.childCount <= 2) {
        // A row of one is no row: the other stands by itself as well.
        const others: Node[] = [];
        row.forEach((child) => {
          if (child !== node) others.push(child);
        });
        tr.replaceWith(rowStart, rowStart + row.nodeSize, [...others, node]);
        const now = rowStart + others.reduce((n, o) => n + o.nodeSize, 0);
        tr.setSelection(NodeSelection.create(tr.doc, now));
      } else {
        tr.delete(pos, pos + node.nodeSize);
        const after = tr.mapping.map(rowStart + row.nodeSize);
        tr.insert(after, node);
        tr.setSelection(NodeSelection.create(tr.doc, after));
      }
      dispatch(tr.scrollIntoView());
    }
    return true;
  };
}

/**
 * A row of one is no row, and one of none is nothing: what is left of a
 * row when the others have been taken away stands by itself again.
 */
export function rows(): Plugin {
  return new Plugin({
    appendTransaction(transactions, _before, state) {
      if (!transactions.some((tr) => tr.docChanged && !tr.getMeta(ySyncPluginKey))) return null;
      const found: { pos: number; node: Node }[] = [];
      state.doc.descendants((node, pos) => {
        if (node.type.name === 'row') {
          if (node.childCount < 2) found.push({ pos, node });
          return false;
        }
        return !node.isTextblock;
      });
      if (!found.length) return null;
      let tr: Transaction = state.tr;
      // From the end, so that what is before stays where it is.
      for (const { pos, node } of found.reverse()) {
        const inner: Node[] = [];
        node.forEach((child) => inner.push(child));
        tr = tr.replaceWith(pos, pos + node.nodeSize, inner);
      }
      return tr;
    },
  });
}
