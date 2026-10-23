/**
 * The hard space (ADR 0064): a space at which a line does not break. It is
 * the character U+00A0 itself, and nothing more is kept of it: it goes into
 * every document as it is, the Org form holds it as it is, search takes it
 * for a space, and one that comes in by pasting is one. The editor rings
 * each, so that the style sheet can show it with the marks of whitespace
 * (`app.css`); a text drawn without an editor has the ring from
 * `blocksHtml`. The rings are found once when a text is opened, and then
 * only where a change touched it, so that a keystroke does not go through
 * the whole text.
 */

import type { Node } from 'prosemirror-model';
import { Plugin, PluginKey, type Command } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';
import { changedRanges } from './changes';

/** The hard space, a space at which a line does not break. */
export const HARD_SPACE = ' ';

/** Writes a hard space where the cursor is, in the place of what is selected. */
export const insertHardSpace: Command = (state, dispatch) => {
  if (dispatch) dispatch(state.tr.insertText(HARD_SPACE).scrollIntoView());
  return true;
};

/** The rings of the hard spaces between two places of a text. */
export function ringsIn(doc: Node, from: number, to: number): Decoration[] {
  const out: Decoration[] = [];
  doc.nodesBetween(from, to, (node, pos) => {
    if (!node.isText) return true;
    const text = node.text ?? '';
    for (let i = text.indexOf(HARD_SPACE); i >= 0; i = text.indexOf(HARD_SPACE, i + 1)) {
      const at = pos + i;
      if (at >= from && at < to)
        out.push(Decoration.inline(at, at + 1, { class: 'hard-space' }, { hardSpace: true }));
    }
    return false;
  });
  return out;
}

/** From the start of the textblock a place is in to its end; the place itself outside one. */
function blockAround(doc: Node, at: number, side: -1 | 1): number {
  const $at = doc.resolve(Math.max(0, Math.min(at, doc.content.size)));
  if (!$at.parent.isTextblock) return $at.pos;
  return side < 0 ? $at.start() : $at.end();
}

const hardSpacesKey = new PluginKey<DecorationSet>('hard-spaces');

/** Rings every hard space of a text: see the top of this file. */
export function hardSpaces(): Plugin {
  return new Plugin<DecorationSet>({
    key: hardSpacesKey,
    state: {
      init: (_config, state) =>
        DecorationSet.create(state.doc, ringsIn(state.doc, 0, state.doc.content.size)),
      apply(tr, set) {
        if (!tr.docChanged) return set;
        let next = set.map(tr.mapping, tr.doc);
        // Within the paragraphs that were written in, the rings are found anew.
        for (const [a, b] of changedRanges([tr])) {
          const from = blockAround(tr.doc, a, -1);
          const to = blockAround(tr.doc, b, 1);
          next = next.remove(next.find(from, to)).add(tr.doc, ringsIn(tr.doc, from, to));
        }
        return next;
      },
    },
    props: {
      decorations: (state) => hardSpacesKey.getState(state),
    },
  });
}
