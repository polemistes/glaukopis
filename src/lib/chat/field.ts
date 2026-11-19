/**
 * The field of the chat as an editor of its own (record 0107): what its keys
 * do, the marks at the cursor, and its own small undo. It is not bound to
 * the project's document, and its undo is not the project's: Ctrl+Z in the
 * chat takes back what was written in the field, never what was written in
 * the text.
 */

import { baseKeymap, splitBlock, toggleMark } from 'prosemirror-commands';
import { keymap } from 'prosemirror-keymap';
import { movesDragged } from '$lib/editor/dragged';
import type { Command, EditorState, Plugin } from 'prosemirror-state';
import { chatSchema } from '$lib/editor/schema';
import type { ChatMarkKind } from '$lib/project/model/types';

/** What the keys of the field ask of the one who holds it. */
export interface FieldHooks {
  /** Enter: send what is written, or keep the change. */
  send(): void;
  /** Escape: give up an answering or a change; whether there was one. */
  escape(): boolean;
  undo(): void;
  redo(): void;
}

/** Sets or takes away a mark where the cursor is, or over what is selected. */
export const toggle = (kind: ChatMarkKind): Command => toggleMark(chatSchema.marks[kind]);

/**
 * The keys of the field: Enter sends and Shift+Enter is a new line, as
 * everywhere in the application; the marks by the keys the text has for
 * them (code has none there, and none here); the field's own undo; and
 * Escape. The undo keys are always taken, so that they never reach the
 * project's undo.
 */
export function fieldPlugins(hooks: FieldHooks): Plugin[] {
  return [
    keymap({
      Enter: (_state, _dispatch, view) => {
        if (view?.composing) return false;
        hooks.send();
        return true;
      },
      'Shift-Enter': splitBlock,
      'Mod-z': () => (hooks.undo(), true),
      'Shift-Mod-z': () => (hooks.redo(), true),
      'Mod-y': () => (hooks.redo(), true),
      'Mod-b': toggle('strong'),
      'Mod-i': toggle('em'),
      'Mod-u': toggle('underline'),
      'Shift-Mod-x': toggle('strike'),
      Escape: () => hooks.escape(),
    }),
    keymap(baseKeymap),
    movesDragged(),
  ];
}

/** Whether a mark is on where the cursor is, or over all that is selected. */
export function markOn(state: EditorState, kind: ChatMarkKind): boolean {
  const type = chatSchema.marks[kind];
  const { from, to, empty, $from } = state.selection;
  if (empty) return !!type.isInSet(state.storedMarks ?? $from.marks());
  let all = true;
  let any = false;
  state.doc.nodesBetween(from, to, (node) => {
    if (!node.isText) return;
    any = true;
    if (!type.isInSet(node.marks)) all = false;
  });
  return any && all;
}

/** Whether the field holds nothing: one line, empty. */
export const isEmpty = (state: EditorState) =>
  state.doc.childCount === 1 && state.doc.firstChild!.content.size === 0;

/**
 * The field's own undo: the states it was in, kept as it is written in, a
 * pause making a step. The texts of a chat are a few lines, so whole states
 * are kept rather than the steps between them.
 */
export class FieldUndo<S> {
  #done: S[] = [];
  #undone: S[] = [];
  #last = -Infinity;

  constructor(
    /** How long a pause in the writing makes a new step, in milliseconds. */
    readonly pause = 600,
    /** The most steps kept. */
    readonly most = 100,
  ) {}

  /** What is written was changed, from the state `before`: a step begins where the writing had paused. */
  changed(before: S, now = Date.now()) {
    if (!this.#done.length || now - this.#last > this.pause) {
      this.#done.push(before);
      if (this.#done.length > this.most) this.#done.shift();
    }
    this.#last = now;
    this.#undone = [];
  }

  /** The state to go back to from `current`; nothing where there is none. */
  undo(current: S): S | null {
    const back = this.#done.pop();
    if (back === undefined) return null;
    this.#undone.push(current);
    this.#last = -Infinity;
    return back;
  }

  /** The state to go forward to again from `current`; nothing where there is none. */
  redo(current: S): S | null {
    const again = this.#undone.pop();
    if (again === undefined) return null;
    this.#done.push(current);
    this.#last = -Infinity;
    return again;
  }

  /** Forgets every step: what the field holds was set from outside. */
  clear() {
    this.#done = [];
    this.#undone = [];
    this.#last = -Infinity;
  }
}
