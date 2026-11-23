/**
 * The tools of the row over the phone's keyboard (stage 2 of
 * `docs/plans/an-app-for-android.md`, part D): what each does to the text
 * of a note, and whether it is on where the cursor is. The marks are
 * toggled as the row of the window of a note toggles them; a list and a
 * point to tick are the kind of the paragraph, set, or set back to text
 * where the paragraph is of that kind already. Undo is the notebook's, and
 * not here.
 */

import type { Command, EditorState } from 'prosemirror-state';
import { kindOf, markActive, setKind, toggle } from '$lib/editor/commands';

/** The tools of the row, in their order, as the scripts name them (`data-phone-tool`). */
export const TOOLS = ['bold', 'italic', 'list', 'todo', 'undo'] as const;

export type Tool = (typeof TOOLS)[number];

/** The tools that act on the text where the cursor is: all but Undo. */
export type TextTool = Exclude<Tool, 'undo'>;

/** The mark each tool of the words toggles. */
const MARKS = { bold: 'strong', italic: 'em' } as const;

/** The kind of paragraph each tool of the paragraphs sets. */
const KINDS = { list: 'item', todo: 'todo' } as const;

/** What a tool does to the text. */
export function toolCommand(tool: TextTool): Command {
  if (tool === 'bold' || tool === 'italic') return toggle(MARKS[tool]);
  const kind = KINDS[tool];
  return (state, dispatch, view) =>
    setKind(kindOf(state) === kind ? 'text' : kind)(state, dispatch, view);
}

/** Whether a tool is on where the cursor is: its mark, or its kind of paragraph. */
export function toolOn(state: EditorState | null, tool: TextTool): boolean {
  if (!state) return false;
  if (tool === 'bold' || tool === 'italic') {
    const type = state.schema.marks[MARKS[tool]];
    return !!type && markActive(state, type);
  }
  return kindOf(state) === KINDS[tool];
}
