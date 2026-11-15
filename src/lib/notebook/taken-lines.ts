/**
 * The faint line beside a paragraph of a note that was taken whole: every
 * letter of it carries the mark `taken`, and it has letters. The paragraph
 * is given the class `taken-whole`, by which the style sheet draws the line
 * (`src/app.css`; record 0101). Read anew when the text changes.
 */

import type { Node } from 'prosemirror-model';
import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';

const key = new PluginKey<DecorationSet>('taken-lines');

/** Whether a paragraph was taken whole: it has letters, and each carries the mark `taken`. */
export function isTakenWhole(block: Node): boolean {
  if (!block.isTextblock) return false;
  let letters = false;
  let all = true;
  block.forEach((child) => {
    if (!all || !child.isText || !child.text?.trim()) return;
    letters = true;
    if (!child.marks.some((m) => m.type.name === 'taken')) all = false;
  });
  return letters && all;
}

function linesOf(doc: Node): DecorationSet {
  const marks: Decoration[] = [];
  doc.descendants((node, pos) => {
    if (!node.isTextblock) return true;
    if (node.type.name === 'paragraph' && isTakenWhole(node))
      marks.push(Decoration.node(pos, pos + node.nodeSize, { class: 'taken-whole' }));
    return false;
  });
  return DecorationSet.create(doc, marks);
}

export function takenLines(): Plugin<DecorationSet> {
  return new Plugin<DecorationSet>({
    key,
    state: {
      init: (_, state) => linesOf(state.doc),
      apply: (tr, lines) => (tr.docChanged ? linesOf(tr.doc) : lines),
    },
    props: {
      decorations: (state) => key.getState(state),
    },
  });
}
