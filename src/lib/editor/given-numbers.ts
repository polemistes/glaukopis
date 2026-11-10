/**
 * A point of a numbered list given its number by hand, in the mark of its
 * line: by `7. ` typed at the start of a paragraph, or in a list brought in
 * from a file that goes on past paragraphs of text. The editor says the
 * number on the paragraph (`data-given`, `--given`), and the style sheet
 * counts on from it, as the document does (app.css).
 */

import type { Node } from 'prosemirror-model';
import { Plugin } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';
import { withinLines } from './changes';

/** The number a point of a numbered list was given by hand; nothing, where it was given none. */
export function givenNumber(paragraph: Node): string | null {
  if (paragraph.attrs.kind !== 'numbered') return null;
  const mark = paragraph.firstChild;
  const number = mark?.type.name === 'linemark' ? String(mark.attrs.number ?? '') : '';
  return /^\d+$/.test(number) ? number : null;
}

function drawn(doc: Node): DecorationSet {
  const list: Decoration[] = [];
  doc.descendants((node, pos) => {
    if (node.type.name !== 'paragraph') return true;
    const number = givenNumber(node);
    if (number)
      list.push(
        Decoration.node(pos, pos + node.nodeSize, {
          'data-given': number,
          style: `--given: ${number}`,
        }),
      );
    return false;
  });
  return DecorationSet.create(doc, list);
}

export function givenNumbers(): Plugin<DecorationSet> {
  return new Plugin<DecorationSet>({
    state: {
      init: (_, state) => drawn(state.doc),
      // Text written in a line gives no point a number: what was drawn moves with it.
      apply: (tr, before) =>
        !tr.docChanged
          ? before
          : withinLines(tr)?.onlyText
            ? before.map(tr.mapping, tr.doc)
            : drawn(tr.doc),
    },
    props: {
      decorations(state) {
        return this.getState(state);
      },
    },
  });
}
