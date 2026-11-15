/**
 * Divide (`docs/plans/the-notebook.md`, stage 2): a note divided where the
 * cursor is in its editor, or what is selected in it lifted out, each a new
 * note in the same box with the same tags, made now and put beside the old
 * where the old is put. The new note is filled from the editor's document
 * and what it holds is cut from the old through the editor, as an element
 * of a project is divided (`split` in `project/text/MapText.svelte`); the
 * two are one step of undo.
 */

import type { Node as PMNode } from 'prosemirror-model';
import { Selection } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import { bodySchema } from '$lib/editor/schema';
import type { Notebook } from './model/notebook.svelte';

/** Whether a document of a text holds nothing but empty paragraphs. */
function holdsNothing(doc: PMNode): boolean {
  let nothing = true;
  doc.forEach((block) => {
    if (block.type.name !== 'paragraph') nothing = false;
    else
      block.forEach((inline) => {
        const blank = inline.isText
          ? !inline.text?.trim()
          : inline.type.name === 'hard_break' || inline.type.name === 'linemark';
        if (!blank) nothing = false;
      });
  });
  return nothing;
}

/** A document of the texts holding what is given, or none where it cannot hold it. */
function textOf(content: PMNode['content']): PMNode | null {
  const doc = bodySchema.topNodeType.createAndFill(null, content);
  if (!doc) return null;
  try {
    doc.check();
  } catch {
    return null;
  }
  return holdsNothing(doc) ? null : doc;
}

/** A new note of what is given, beside the old, and what it holds cut from the old by `cut`: one step of undo. */
function divide(notebook: Notebook, note: string, text: PMNode, cut: () => void): string | null {
  const old = notebook.note(note);
  if (!old) return null;
  notebook.checkpoint();
  const made = notebook.transact(() => {
    const id = notebook.addNote({
      box: old.box,
      tags: old.tags,
      at: notebook.beside(note),
    });
    notebook.fillFrom(id, text);
    return id;
  });
  cut();
  notebook.checkpoint();
  return made;
}

/**
 * Divides a note where the cursor is: what follows it, to the end of the
 * text, the paragraph split at the cursor, becomes a new note; the old
 * keeps what was before. Nothing where the cursor is at the very start or
 * the very end, or where either side would hold nothing. Gives the id of
 * the new note.
 */
export function divideAt(notebook: Notebook, note: string, view: EditorView): string | null {
  const { state } = view;
  const { doc } = state;
  const $at = state.selection.$head;
  if (
    $at.pos <= Selection.atStart(doc).from ||
    $at.pos >= Selection.atEnd(doc).from ||
    !$at.parent.isTextblock
  )
    return null;
  // At the edge of a paragraph, the cut is between paragraphs: none is left empty.
  const at =
    $at.parentOffset === 0
      ? $at.before()
      : $at.parentOffset === $at.parent.content.size
        ? $at.after()
        : $at.pos;
  const end = doc.content.size;
  const text = textOf(doc.cut(at, end).content);
  if (!text || !textOf(doc.cut(0, at).content)) return null;
  return divide(notebook, note, text, () => view.dispatch(view.state.tr.delete(at, end)));
}

/**
 * Lifts what is selected out of a note: it becomes a new note and is cut
 * from the old. Nothing where nothing is selected, or what is selected
 * holds nothing. Gives the id of the new note.
 */
export function liftOut(notebook: Notebook, note: string, view: EditorView): string | null {
  const { state } = view;
  const { from, to, empty } = state.selection;
  if (empty) return null;
  const text = textOf(state.doc.cut(from, to).content);
  if (!text) return null;
  return divide(notebook, note, text, () => view.dispatch(view.state.tr.deleteSelection()));
}
