/**
 * The box of rich text (ADR 0112), as the editor has it: the block `rich`
 * of the schema, and what is done with it. It is put around the blocks that
 * are selected, or put in empty; it is left as a list is left, by Enter in
 * an empty paragraph at its end; an empty one is taken away by Backspace;
 * and from its head it is selected, made ordinary text again, or deleted.
 *
 * It stands only at the top of a text, and holds neither another box nor
 * texts side by side.
 */

import { Fragment, type Node } from 'prosemirror-model';
import { TextSelection, type Command, type EditorState } from 'prosemirror-state';
import { findWrapping } from 'prosemirror-transform';

/** The name of the block in the schema, and of its block in Org. */
export const BOX = 'rich';

/** The box the cursor is in, with where it stands. */
export function boxAt(state: EditorState): { box: Node; pos: number } | null {
  const { $from } = state.selection;
  for (let d = $from.depth; d > 0; d--)
    if ($from.node(d).type.name === BOX) return { box: $from.node(d), pos: $from.before(d) };
  return null;
}

/** The box that stands at `pos`. */
function boxOn(state: EditorState, pos: number): Node | null {
  const node = pos >= 0 && pos < state.doc.content.size ? state.doc.nodeAt(pos) : null;
  return node?.type.name === BOX ? node : null;
}

/** Whether a paragraph holds nothing and is of no kind but text. */
const plainAndEmpty = (node: Node): boolean =>
  node.type.name === 'paragraph' &&
  node.content.size === 0 &&
  (node.attrs.kind ?? 'text') === 'text';

/**
 * Puts a box where the cursor is. With something selected, around the
 * blocks of the text that the selection touches, which stay as they are;
 * with nothing selected, an empty box after the block the cursor is in, or
 * in its place where that is an empty paragraph. Not within a box, and not
 * around what a box does not hold.
 */
export const insertBox: Command = (state, dispatch) => {
  const rich = state.schema.nodes[BOX];
  const { paragraph } = state.schema.nodes;
  if (!rich || !paragraph || boxAt(state)) return false;
  const { $from, $to, empty } = state.selection;
  if ($from.depth === 0) return false;

  if (!empty) {
    const range = state.doc.resolve($from.before(1)).blockRange(state.doc.resolve($to.after(1)));
    const wrapping = range && findWrapping(range, rich);
    if (!range || !wrapping) return false;
    if (dispatch) dispatch(state.tr.wrap(range, wrapping).scrollIntoView());
    return true;
  }

  const block = $from.node(1);
  const made = rich.create(null, paragraph.create());
  if (dispatch) {
    const tr = state.tr;
    let at: number;
    if ($from.depth === 1 && plainAndEmpty(block)) {
      at = $from.before(1);
      tr.replaceWith(at, $from.after(1), made);
    } else {
      at = $from.after(1);
      tr.insert(at, made);
    }
    tr.setSelection(TextSelection.create(tr.doc, at + 2));
    dispatch(tr.scrollIntoView());
  }
  return true;
};

/**
 * Enter in an empty paragraph of text that is the last of a box, and not
 * all it holds, leaves the box: the paragraph goes out of it, to stand
 * after it. So a box is left as a list is.
 */
export const leaveBox: Command = (state, dispatch) => {
  const { $from, empty } = state.selection;
  const at = boxAt(state);
  if (!at || !empty || $from.depth !== 2 || !plainAndEmpty($from.parent)) return false;
  if (at.box.childCount < 2 || $from.index(1) !== at.box.childCount - 1) return false;
  if (dispatch) {
    const { paragraph } = state.schema.nodes;
    const tr = state.tr.delete($from.before(2), $from.after(2));
    const after = tr.mapping.map(at.pos + at.box.nodeSize);
    tr.insert(after, paragraph.create());
    tr.setSelection(TextSelection.create(tr.doc, after + 1));
    dispatch(tr.scrollIntoView());
  }
  return true;
};

/** Backspace in a box that holds one empty paragraph and nothing else takes the box away, and leaves the paragraph. */
export const backOutOfBox: Command = (state, dispatch) => {
  const at = boxAt(state);
  if (!at || !state.selection.empty) return false;
  if (at.box.childCount !== 1 || !plainAndEmpty(at.box.firstChild!)) return false;
  return unwrapBox(at.pos)(state, dispatch);
};

/** Makes the box at `pos` ordinary text: what it holds stands where it stood, and the box is gone. */
export function unwrapBox(pos: number): Command {
  return (state, dispatch) => {
    const box = boxOn(state, pos);
    if (!box) return false;
    if (dispatch) {
      const { from, to } = state.selection;
      const end = pos + box.nodeSize;
      const tr = state.tr.replaceWith(pos, end, box.content);
      // What was selected within it is selected still: everything in it stands one step earlier.
      const inside = (p: number) => p > pos && p < end;
      if (inside(from) && inside(to))
        tr.setSelection(TextSelection.create(tr.doc, from - 1, to - 1));
      dispatch(tr.scrollIntoView());
    }
    return true;
  };
}

/** Selects all that the box at `pos` holds. */
export function selectBox(pos: number): Command {
  return (state, dispatch) => {
    const box = boxOn(state, pos);
    if (!box) return false;
    if (dispatch) {
      const $start = state.doc.resolve(pos + 1);
      const $end = state.doc.resolve(pos + box.nodeSize - 1);
      dispatch(state.tr.setSelection(TextSelection.between($start, $end)));
    }
    return true;
  };
}

/** Takes the box at `pos` away with all it holds. A text that held nothing else is left an empty paragraph. */
export function deleteBox(pos: number): Command {
  return (state, dispatch) => {
    const box = boxOn(state, pos);
    if (!box) return false;
    if (dispatch) {
      const { paragraph } = state.schema.nodes;
      const alone = state.doc.childCount === 1;
      const tr = state.tr.replaceWith(
        pos,
        pos + box.nodeSize,
        alone ? paragraph.create() : Fragment.empty,
      );
      tr.setSelection(TextSelection.near(tr.doc.resolve(Math.min(pos, tr.doc.content.size))));
      dispatch(tr.scrollIntoView());
    }
    return true;
  };
}

/** Whether a text holds a box. */
export function holdsBox(doc: Node): boolean {
  let found = false;
  doc.forEach((block) => {
    if (block.type.name === BOX) found = true;
  });
  return found;
}
