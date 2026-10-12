/** Texts side by side: a block of two sides, each a text of its own, as an original and its translation (ADR 0027). */

import type { Node } from 'prosemirror-model';
import { TextSelection, type Command, type EditorState } from 'prosemirror-state';

/** The side of a parallel text the cursor is in. */
function sideAt(
  state: EditorState,
): { parallel: Node; pos: number; side: number; depth: number } | null {
  const { $from } = state.selection;
  for (let d = $from.depth; d > 0; d--) {
    if (
      $from.node(d).type.name === 'parallel_side' &&
      $from.node(d - 1)?.type.name === 'parallel'
    ) {
      return {
        parallel: $from.node(d - 1),
        pos: $from.before(d - 1),
        side: $from.index(d - 1),
        depth: d,
      };
    }
  }
  return null;
}

/** Two texts side by side where the cursor is, each a paragraph to begin with. */
export const insertParallel: Command = (state, dispatch) => {
  const { parallel, parallel_side, paragraph } = state.schema.nodes;
  if (!parallel || !parallel_side || !paragraph) return false;
  if (sideAt(state)) return false;
  if (dispatch) {
    const side = () => parallel_side.create(null, paragraph.create());
    const made = parallel.create(null, [side(), side()]);
    const { $from } = state.selection;
    const depth = $from.depth > 0 ? 1 : 0;
    const where = depth ? $from.after(depth) : $from.pos;
    const tr = state.tr.insert(where, made);
    tr.setSelection(TextSelection.near(tr.doc.resolve(where + 3)));
    dispatch(tr.scrollIntoView());
  }
  return true;
};

/** Backspace in two sides that are both empty takes the block away. */
export const backOutOfParallel: Command = (state, dispatch) => {
  const at = sideAt(state);
  if (!at || !state.selection.empty) return false;
  const empty = (side: Node) => side.childCount === 1 && side.firstChild!.content.size === 0;
  if (!empty(at.parallel.child(0)) || !empty(at.parallel.child(1))) return false;
  if (dispatch) {
    const { paragraph } = state.schema.nodes;
    const tr = state.tr.replaceWith(at.pos, at.pos + at.parallel.nodeSize, paragraph.create());
    tr.setSelection(TextSelection.near(tr.doc.resolve(at.pos + 1)));
    dispatch(tr.scrollIntoView());
  }
  return true;
};

/** Tab in the left side goes to the right; Shift+Tab back. */
export function acrossParallel(back: boolean): Command {
  return (state, dispatch) => {
    const at = sideAt(state);
    if (!at) return false;
    const target = back ? 0 : 1;
    if (at.side === target) return false;
    if (dispatch) {
      const sidePos = at.pos + 1 + (target === 1 ? at.parallel.child(0).nodeSize : 0);
      dispatch(
        state.tr.setSelection(TextSelection.near(state.doc.resolve(sidePos + 1))).scrollIntoView(),
      );
    }
    return true;
  };
}
