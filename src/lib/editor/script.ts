/**
 * A screenplay in the editor: each paragraph a part of the script, a scene
 * heading, action, a character, dialogue, a parenthetical or a transition.
 * Enter goes from a part to the one that follows it in a script, as the
 * programs of screenwriters have it: a character to dialogue, dialogue to
 * action. Tab goes to the other part that commonly follows.
 */

import { TextSelection, type Command, type EditorState } from 'prosemirror-state';
import type { ScriptPart } from '$lib/project/model/text';

/** The part of the script the cursor is in, and where its paragraph begins. */
export function scriptAt(state: EditorState): { part: ScriptPart; pos: number } | null {
  const { $from } = state.selection;
  for (let d = $from.depth; d > 0; d--) {
    const node = $from.node(d);
    if (node.type.name === 'script')
      return { part: node.attrs.part as ScriptPart, pos: $from.before(d) };
  }
  return null;
}

/** What follows each part when a new paragraph is begun with Enter. */
const AFTER: Record<ScriptPart, ScriptPart> = {
  scene: 'action',
  action: 'action',
  character: 'dialogue',
  parenthetical: 'dialogue',
  dialogue: 'action',
  transition: 'scene',
};

/** What Tab turns a part into. */
const TAB: Record<ScriptPart, ScriptPart> = {
  scene: 'action',
  action: 'character',
  character: 'transition',
  dialogue: 'parenthetical',
  parenthetical: 'dialogue',
  transition: 'scene',
};

/** Makes the paragraph the cursor is in a part of a script; a paragraph of any kind becomes one. */
export function setScriptPart(part: ScriptPart): Command {
  return (state, dispatch) => {
    const { script, paragraph } = state.schema.nodes;
    if (!script || !paragraph) return false;
    const { $from } = state.selection;
    let depth = $from.depth;
    while (depth > 0 && !$from.node(depth).isTextblock) depth--;
    if (!depth) return false;
    const node = $from.node(depth);
    if (node.type !== script && node.type !== paragraph) return false;
    if (dispatch) dispatch(state.tr.setNodeMarkup($from.before(depth), script, { part }));
    return true;
  };
}

/** A part of a script made a paragraph of text again. */
export const unsetScript: Command = (state, dispatch) => {
  const at = scriptAt(state);
  const { paragraph } = state.schema.nodes;
  if (!at || !paragraph) return false;
  if (dispatch) dispatch(state.tr.setNodeMarkup(at.pos, paragraph));
  return true;
};

/** Enter at the end of a part begins the part that follows it. */
export const nextScriptPart: Command = (state, dispatch) => {
  const at = scriptAt(state);
  const { script } = state.schema.nodes;
  if (!at || !script || !state.selection.empty) return false;
  const { $from } = state.selection;
  const node = $from.parent;
  if (node.type !== script || $from.parentOffset !== node.content.size) return false;
  if (dispatch) {
    const after = at.pos + node.nodeSize;
    const tr = state.tr.insert(after, script.create({ part: AFTER[at.part] }));
    tr.setSelection(TextSelection.near(tr.doc.resolve(after + 1)));
    dispatch(tr.scrollIntoView());
  }
  return true;
};

/**
 * Tab goes to the part that commonly follows: an empty paragraph becomes
 * it; one with text in it is followed by a new paragraph of it.
 */
export const tabScriptPart: Command = (state, dispatch) => {
  const at = scriptAt(state);
  const { script } = state.schema.nodes;
  if (!at || !script) return false;
  const node = state.selection.$from.parent;
  if (node.type !== script) return false;
  if (node.content.size === 0) return setScriptPart(TAB[at.part])(state, dispatch);
  if (dispatch) {
    const after = at.pos + node.nodeSize;
    const tr = state.tr.insert(after, script.create({ part: TAB[at.part] }));
    tr.setSelection(TextSelection.near(tr.doc.resolve(after + 1)));
    dispatch(tr.scrollIntoView());
  }
  return true;
};

/** Backspace at the start of an empty part makes it a paragraph. */
export const backOutOfScript: Command = (state, dispatch) => {
  const at = scriptAt(state);
  if (!at || !state.selection.empty) return false;
  const { $from } = state.selection;
  if ($from.parentOffset !== 0 || $from.parent.content.size !== 0) return false;
  return unsetScript(state, dispatch);
};
