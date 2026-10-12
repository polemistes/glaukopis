/**
 * The shape of a text, kept after every change (ADR 0040): paragraphs of
 * kinds that belong together stand in a passage of their family, and text
 * stands in none. The writer chooses only the kind of a paragraph; the
 * passages follow from it, by a step after each transaction that changed
 * the text:
 *
 * - a paragraph of a kind that is not text standing outside a passage is
 *   put in one of its family, with those that follow it and belong with it;
 * - a text paragraph inside a passage is lifted out, splitting the passage;
 * - a paragraph whose family is not its passage's, and that does not join
 *   (an attribution stands in whatever passage precedes it), is lifted out,
 *   and so put in a passage of its own;
 * - passages of one family that stand next to each other are joined, the
 *   first one's settings holding;
 * - an empty passage goes, and so does a passage of text that is not
 *   numbered: text stands in a passage only while it is numbered.
 *
 * Each step is a step of the transaction, so that the cursor follows and
 * undo is one. The walk is from the top, and begins again after each step,
 * since the positions have moved; it ends when it finds nothing to do, and
 * finds nothing to do on a text that has the shape.
 */

import { NodeRange, type Node, type NodeType } from 'prosemirror-model';
import { Plugin, PluginKey, type Transaction } from 'prosemirror-state';
import { liftTarget } from 'prosemirror-transform';
import { ySyncPluginKey } from 'y-prosemirror';
import { familyOf, joinsBefore, type BasedKind } from '$lib/project/model/families';

export const passagesKey = new PluginKey('passages');

/** The kind of a paragraph, as its attributes say it. */
function kindOf(paragraph: Node): string {
  return (paragraph.attrs.kind as string) || 'text';
}

/** The range that is the children `from` up to `to` of the node that begins its content at `start`. */
function rangeOf(doc: Node, parent: Node, start: number, from: number, to: number): NodeRange {
  let pos = start;
  for (let i = 0; i < from; i++) pos += parent.child(i).nodeSize;
  const first = pos;
  for (let i = from; i < to; i++) pos += parent.child(i).nodeSize;
  // Within the first and the last child, so that the range is of the parent's children.
  const $from = doc.resolve(first + 1);
  const $to = doc.resolve(pos - 1);
  return new NodeRange($from, $to, $from.depth - 1);
}

/**
 * Puts the paragraph at `index` of `parent`, and those after it that belong
 * with it, in a passage. A paragraph that joins goes with the passage
 * before it, whatever its family: it is put in one of that family, which
 * the next step joins to it.
 */
function wrapRun(
  tr: Transaction,
  passage: NodeType,
  parent: Node,
  start: number,
  index: number,
  own: readonly BasedKind[],
): boolean {
  const first = parent.child(index);
  let family = familyOf(kindOf(first), own);
  const before = index > 0 ? parent.child(index - 1) : null;
  if (joinsBefore(kindOf(first), own) && before?.type === passage)
    family = before.attrs.family as string;
  let end = index + 1;
  for (; end < parent.childCount; end++) {
    const next = parent.child(end);
    if (next.type.name !== 'paragraph') break;
    const kind = kindOf(next);
    if (familyOf(kind, own) !== family && !joinsBefore(kind, own)) break;
  }
  if (!parent.canReplaceWith(index, end, passage)) return false;
  const range = rangeOf(tr.doc, parent, start, index, end);
  tr.wrap(range, [{ type: passage, attrs: { family } }]);
  return true;
}

/**
 * Lifts the paragraph at `index` of the passage out of it, with those after
 * it that do not belong in it either, and those that join whatever is
 * before them; the passage is split around them.
 */
function liftRun(
  tr: Transaction,
  passage: Node,
  start: number,
  index: number,
  own: readonly BasedKind[],
): boolean {
  const family = passage.attrs.family as string;
  let end = index + 1;
  for (; end < passage.childCount; end++) {
    const kind = kindOf(passage.child(end));
    if (familyOf(kind, own) === family && !joinsBefore(kind, own)) break;
  }
  const range = rangeOf(tr.doc, passage, start, index, end);
  const target = liftTarget(range);
  if (target === null) return false;
  tr.lift(range, target);
  return true;
}

/** Whether a paragraph belongs in a passage of a family: of that family, or joining what is before it in the passage. */
function belongs(kind: string, family: string, index: number, own: readonly BasedKind[]): boolean {
  if (familyOf(kind, own) === family) return true;
  return index > 0 && joinsBefore(kind, own);
}

/**
 * Finds the first thing to do under `parent`, whose content begins at
 * `start`, and does it. True when a step was taken; then the positions have
 * moved, and the walk begins again.
 */
function fixIn(tr: Transaction, parent: Node, start: number, own: readonly BasedKind[]): boolean {
  const passage = parent.type.schema.nodes.passage;
  let pos = start;
  for (let i = 0; i < parent.childCount; i++) {
    const child = parent.child(i);
    if (child.type === passage) {
      // An empty passage goes.
      if (child.childCount === 0) {
        tr.delete(pos, pos + child.nodeSize);
        return true;
      }
      // A passage of text is there only while it is numbered: its paragraphs are lifted out when it is not.
      if (child.attrs.family === 'text' && (child.attrs.numbering ?? 'none') === 'none') {
        const range = rangeOf(tr.doc, child, pos + 1, 0, child.childCount);
        const target = liftTarget(range);
        if (target !== null) {
          tr.lift(range, target);
          return true;
        }
      }
      // Two passages of one family, next to each other, are one.
      const next = i + 1 < parent.childCount ? parent.child(i + 1) : null;
      if (next?.type === passage && next.attrs.family === child.attrs.family) {
        tr.join(pos + child.nodeSize);
        return true;
      }
      // What does not belong in the passage is lifted out of it.
      const family = child.attrs.family as string;
      for (let j = 0; j < child.childCount; j++) {
        const paragraph = child.child(j);
        if (paragraph.type.name !== 'paragraph') continue;
        if (belongs(kindOf(paragraph), family, j, own)) continue;
        if (liftRun(tr, child, pos + 1, j, own)) return true;
      }
    } else if (child.type.name === 'paragraph') {
      // A paragraph of a kind outside a passage is put in one, where one can stand.
      if (familyOf(kindOf(child), own) !== 'text' && parent.canReplaceWith(i, i + 1, passage)) {
        if (wrapRun(tr, passage, parent, start, i, own)) return true;
      }
    } else if (!child.isTextblock && !child.isLeaf) {
      if (fixIn(tr, child, pos + 1, own)) return true;
    }
    pos += child.nodeSize;
  }
  return false;
}

/**
 * Gives the text of the transaction the shape, step by step. True when
 * anything was done. `own` is the kinds of the writer's own, for the family
 * of a paragraph of one.
 */
export function keepShape(tr: Transaction, own: readonly BasedKind[] = []): boolean {
  if (!tr.doc.type.schema.nodes.passage) return false;
  let did = false;
  // Each step mends one thing; a text has only so many. The bound is for
  // safety alone, so that a shape that could not be mended does not loop.
  for (let steps = 0; steps < 10000; steps++) {
    if (!fixIn(tr, tr.doc, 0, own)) break;
    did = true;
  }
  return did;
}

/**
 * Keeps the shape after every change to the text, as a transaction appended
 * to the one that changed it. What comes through the shared document was
 * given the shape where it was written, as the ids of figures are left to
 * those who made them (`plugins.ts`).
 */
export function passages(own: () => readonly BasedKind[] = () => []): Plugin {
  return new Plugin({
    key: passagesKey,
    appendTransaction(transactions, _before, state) {
      if (!transactions.some((tr) => tr.docChanged && !tr.getMeta(ySyncPluginKey))) return null;
      const tr = state.tr;
      return keepShape(tr, own()) ? tr : null;
    },
  });
}
