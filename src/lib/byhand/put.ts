/**
 * Putting a box of rich text into a text from the tools (ADR 0112): where
 * the cursor is, or about what is selected. Nothing is asked first: the
 * project comes to be of the second form of the texts (ADR 0111), and
 * those who share it with an earlier version are kept out of it until they
 * have updated, which the owner chose not to ask about (2026-11-19, in the
 * brief: there are two or three test users, and nothing made that must be
 * kept).
 */

import type { EditorView } from 'prosemirror-view';
import { insertBox } from './box';

/** Puts a box where the cursor is. */
export function putBox(view: EditorView): void {
  if (view.isDestroyed || !insertBox(view.state)) return;
  insertBox(view.state, view.dispatch, view);
  view.focus();
}
