/**
 * What is set by hand lives only in a box of rich text (ADR 0113). A font,
 * a size or a colour on words, and how a paragraph stands by hand, are
 * taken away from whatever comes to stand outside a box: a paragraph
 * dragged or lifted out, what is pasted elsewhere, a box made ordinary
 * text. In a note at the foot, though it is written in a box, nothing is
 * set by hand either: its look is the layout's. And a heading (ADR 0115)
 * is a paragraph of text: made a point of a list or of another kind, it is
 * a heading no more. Done at once, with the
 * change that brought it about, so that it is one step of undo with it,
 * and so that the document never holds a look the tools of the place
 * cannot show or take away.
 */

import type { MarkType, Node } from 'prosemirror-model';
import { Plugin, type Transaction } from 'prosemirror-state';
import { AddMarkStep, AttrStep } from 'prosemirror-transform';
import { BOX } from './box';
import { HAND_MARKS, handOf } from './hand';

/** The stretches of the text as it now stands that the changes touched. */
function touched(transactions: readonly Transaction[]): [number, number][] {
  let ranges: [number, number][] = [];
  for (const tr of transactions) {
    tr.steps.forEach((step, i) => {
      const map = tr.mapping.maps[i];
      ranges = ranges.map(([from, to]) => [map.map(from, -1), map.map(to, 1)]);
      map.forEach((_from, _to, from, to) => ranges.push([from, to]));
      // A mark put on, or something said of a block, moves nothing.
      if (step instanceof AddMarkStep) ranges.push([step.from, step.to]);
      else if (step instanceof AttrStep) ranges.push([step.pos, step.pos + 1]);
    });
  }
  return ranges;
}

/** The marks set by hand that a schema has. */
export function handMarkTypes(doc: Node): MarkType[] {
  return HAND_MARKS.map((name) => doc.type.schema.marks[name]).filter((type) => !!type);
}

/** Whether anything in a node is set by hand: words, or how a paragraph stands. */
export function holdsHand(node: Node): boolean {
  const types = handMarkTypes(node);
  let found = node.type.name === 'paragraph' && node.attrs.hand != null;
  node.descendants((child) => {
    if (found) return false;
    if (child.type.name === 'paragraph' && child.attrs.hand != null) found = true;
    else if (child.marks.some((mark) => types.includes(mark.type))) found = true;
    return !found;
  });
  return found;
}

/** Takes away what is set by hand in the stretch from `from` to `to` of the text `tr` has come to. */
function clear(tr: Transaction, from: number, to: number, types: readonly MarkType[]) {
  for (const type of types) if (tr.doc.rangeHasMark(from, to, type)) tr.removeMark(from, to, type);
  tr.doc.nodesBetween(from, to, (node, pos) => {
    if (node.type.name === 'paragraph' && node.attrs.hand != null)
      tr.setNodeAttribute(pos, 'hand', null);
    return true;
  });
}

/** The plugin that keeps the rule, for the editor of a text. */
export function onlyInBoxes(): Plugin {
  return new Plugin({
    appendTransaction(transactions, _before, state) {
      if (!transactions.some((tr) => tr.docChanged)) return null;
      const ranges = touched(transactions);
      if (!ranges.length) return null;
      const types = handMarkTypes(state.doc);
      const tr = state.tr;
      state.doc.forEach((block, pos) => {
        const end = pos + block.nodeSize;
        if (!ranges.some(([from, to]) => from <= end && to >= pos)) return;
        if (block.type.name !== BOX) {
          if (holdsHand(block)) clear(tr, pos, end, types);
          return;
        }
        // In a box: the notes at the foot are the layout's, and a heading is a paragraph of text and of no other kind.
        block.descendants((node, at) => {
          if (node.type.name === 'paragraph' && node.attrs.kind !== 'text') {
            const hand = handOf(node.attrs.hand);
            if (hand?.heading) {
              const { heading: _, ...rest } = hand;
              tr.setNodeAttribute(pos + 1 + at, 'hand', handOf(rest));
            }
          }
          if (node.type.name !== 'footnote') return true;
          const start = pos + 1 + at;
          if (holdsHand(node)) clear(tr, start + 1, start + node.nodeSize - 1, types);
          return false;
        });
      });
      return tr.steps.length ? tr : null;
    },
  });
}
