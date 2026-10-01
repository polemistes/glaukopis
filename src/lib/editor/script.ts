/**
 * The kinds of paragraph that lead to one another as one writes: the parts
 * of a screenplay, a headword and its gloss, an epigraph and its
 * attribution. Enter at the end of a paragraph of such a kind begins the
 * kind that follows it, as the programs of screenwriters have it: a
 * character to dialogue, dialogue to action. Tab goes to the other kind
 * that commonly follows. Backspace at the start of an empty one makes it a
 * paragraph of text again. What follows what, the catalogue says
 * (`kinds.ts`); a kind of the writer's own does as the kind it is based on.
 *
 * A part of a script is kept as the node `script`, every other kind of
 * paragraph as the node `passage`.
 */

import type { Node, Schema } from 'prosemirror-model';
import { TextSelection, type Command, type EditorState } from 'prosemirror-state';
import { SCRIPT_PARTS, type ScriptPart } from '$lib/project/model/text';
import { nextOf, specOf, tabOf, type OwnKindLike } from './kinds';

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

/** The paragraph of a kind the cursor is in, a part of a script or a passage: its kind, the node, and where it begins. */
export function passageAt(state: EditorState): { kind: string; node: Node; pos: number } | null {
  const { $from } = state.selection;
  for (let d = $from.depth; d > 0; d--) {
    const node = $from.node(d);
    if (node.type.name === 'script')
      return { kind: node.attrs.part as string, node, pos: $from.before(d) };
    if (node.type.name === 'passage')
      return { kind: node.attrs.name as string, node, pos: $from.before(d) };
  }
  return null;
}

/** An empty paragraph of a kind: a part of a script, a passage, or, for a kind that is none, a paragraph of text. */
export function blockOfKind(schema: Schema, kind: string): Node | null {
  const { paragraph, script, passage } = schema.nodes;
  if (SCRIPT_PARTS.includes(kind as ScriptPart)) return script?.create({ part: kind }) ?? null;
  const structure = specOf(kind)?.structure ?? 'passage';
  if (structure === 'passage') return passage?.create({ name: kind }) ?? null;
  return paragraph?.create() ?? null;
}

/** Makes the paragraph the cursor is in a part of a script; a paragraph of any kind becomes one. */
export function setScriptPart(part: ScriptPart): Command {
  return (state, dispatch) => {
    const { script, paragraph, passage } = state.schema.nodes;
    if (!script || !paragraph) return false;
    const { $from } = state.selection;
    let depth = $from.depth;
    while (depth > 0 && !$from.node(depth).isTextblock) depth--;
    if (!depth) return false;
    const node = $from.node(depth);
    if (node.type !== script && node.type !== paragraph && node.type !== passage) return false;
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

/** The paragraph of a kind the cursor is in made a paragraph of text again. */
export const unsetPassage: Command = (state, dispatch) => {
  const at = passageAt(state);
  const { paragraph } = state.schema.nodes;
  if (!at || !paragraph) return false;
  if (dispatch) dispatch(state.tr.setNodeMarkup(at.pos, paragraph));
  return true;
};

/** A new paragraph of a kind after the one at `pos`, with the cursor in it. */
function begin(kind: string, after: number): Command {
  return (state, dispatch) => {
    const block = blockOfKind(state.schema, kind);
    if (!block) return false;
    if (dispatch) {
      const tr = state.tr.insert(after, block);
      tr.setSelection(TextSelection.near(tr.doc.resolve(after + 1)));
      dispatch(tr.scrollIntoView());
    }
    return true;
  };
}

/** Enter at the end of a paragraph of a kind begins the kind that follows it. */
export function nextPassage(own: () => OwnKindLike[] = () => []): Command {
  return (state, dispatch) => {
    const at = passageAt(state);
    if (!at || !state.selection.empty) return false;
    const { $from } = state.selection;
    if ($from.parent !== at.node || $from.parentOffset !== at.node.content.size) return false;
    return begin(nextOf(at.kind, own()), at.pos + at.node.nodeSize)(state, dispatch);
  };
}

/**
 * Tab goes to the kind that commonly follows: an empty paragraph becomes
 * it; one with text in it is followed by a new paragraph of it. Nothing
 * for a kind Tab means nothing to.
 */
export function tabPassage(own: () => OwnKindLike[] = () => []): Command {
  return (state, dispatch) => {
    const at = passageAt(state);
    if (!at || state.selection.$from.parent !== at.node) return false;
    const tab = tabOf(at.kind, own());
    if (!tab) return false;
    if (at.node.content.size > 0) return begin(tab, at.pos + at.node.nodeSize)(state, dispatch);
    const block = blockOfKind(state.schema, tab);
    if (!block) return false;
    if (dispatch) dispatch(state.tr.setNodeMarkup(at.pos, block.type, block.attrs));
    return true;
  };
}

/** Backspace at the start of an empty paragraph of a kind makes it a paragraph of text. */
export const backOutOfPassage: Command = (state, dispatch) => {
  const at = passageAt(state);
  if (!at || !state.selection.empty) return false;
  const { $from } = state.selection;
  if ($from.parent !== at.node || $from.parentOffset !== 0 || at.node.content.size !== 0)
    return false;
  return unsetPassage(state, dispatch);
};
