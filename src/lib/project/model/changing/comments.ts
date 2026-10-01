/**
 * Changing the comments of a project: beginning a thread on an element or
 * on a passage of its text, answering in it, changing and taking back one's
 * own notes, and settling a thread. These are methods of `Project`, which
 * takes them in (see there).
 *
 * A note is its author's: only they change or take it back, which the
 * interface sees to, as it does every other rule of a shared project. The
 * comments are outside undo: they are not the text, and Ctrl+Z while one
 * writes must not take a comment away.
 */

import * as Y from 'yjs';
import { newId } from '$lib/util/id';
import { nowIso } from '../origins';
import type { Project } from '../project.svelte';
import type { Note, Position, Thread } from '../types';

/** The notes of a thread as the document holds them. */
type YNotes = Y.Array<Note>;

function notesOf(thread: Y.Map<unknown> | undefined): YNotes | null {
  const notes = thread?.get('notes');
  return notes instanceof Y.Array ? (notes as YNotes) : null;
}

/** Who writes here, as a note names them. */
function author(p: Project): Note['author'] {
  return { id: p.me?.id ?? '', name: p.me?.name ?? '' };
}

export const commentChanges = {
  /**
   * Begins a thread on an element, or on a passage of its text, with its
   * first note. Returns the id of the thread.
   */
  comment(this: Project, element: string, passage: Thread['passage'], text: string): string | null {
    const clean = text.trim();
    if (!clean || !this.yNodes.has(element)) return null;
    const id = newId();
    this.transact(() => {
      const thread = new Y.Map<unknown>();
      thread.set('element', element);
      if (passage)
        thread.set('passage', { from: passage.from, to: passage.to, text: passage.text });
      const notes = new Y.Array<Note>();
      notes.push([{ id: newId(), author: author(this), created: nowIso(), text: clean }]);
      thread.set('notes', notes);
      this.yComments.set(id, thread);
    });
    return id;
  },

  /** Answers in a thread, under what was said. */
  reply(this: Project, thread: string, text: string): string | null {
    const clean = text.trim();
    const notes = notesOf(this.yComments.get(thread));
    if (!clean || !notes) return null;
    const id = newId();
    this.transact(() => notes.push([{ id, author: author(this), created: nowIso(), text: clean }]));
    return id;
  },

  /** Changes a note: its author's own. */
  editNote(this: Project, thread: string, note: string, text: string) {
    const clean = text.trim();
    const notes = notesOf(this.yComments.get(thread));
    if (!clean || !notes) return;
    const i = notes.toArray().findIndex((n) => n.id === note);
    if (i < 0) return;
    const before = notes.get(i);
    if (before.text === clean) return;
    this.transact(() => {
      notes.delete(i, 1);
      notes.insert(i, [{ ...before, text: clean, edited: nowIso() }]);
    });
  },

  /**
   * Takes a note back: its author's own. The thread goes with its last
   * note. Returns what was taken, so that it can be put back.
   */
  deleteNote(this: Project, thread: string, note: string): { index: number; note: Note } | null {
    const notes = notesOf(this.yComments.get(thread));
    if (!notes) return null;
    const index = notes.toArray().findIndex((n) => n.id === note);
    if (index < 0) return null;
    const taken = notes.get(index);
    this.transact(() => {
      if (notes.length === 1) this.yComments.delete(thread);
      else notes.delete(index, 1);
    });
    return { index, note: taken };
  },

  /** Puts a note back where it was taken from; or the thread anew, where the note was its last. */
  restoreNote(this: Project, thread: string, taken: { index: number; note: Note }, as: Thread) {
    this.transact(() => {
      let notes = notesOf(this.yComments.get(thread));
      if (!notes) {
        if (!this.yNodes.has(as.element)) return;
        const made = new Y.Map<unknown>();
        made.set('element', as.element);
        if (as.passage) made.set('passage', as.passage);
        if (as.resolved) made.set('resolved', true);
        if (as.card) made.set('card', as.card);
        notes = new Y.Array<Note>();
        made.set('notes', notes);
        this.yComments.set(thread, made);
      }
      notes.insert(Math.min(taken.index, notes.length), [taken.note]);
    });
  },

  /** Settles a thread, or opens it again: anyone may. */
  setResolved(this: Project, thread: string, resolved: boolean) {
    const y = this.yComments.get(thread);
    if (!y || (y.get('resolved') === true) === resolved) return;
    this.transact(() => {
      if (resolved) y.set('resolved', true);
      else y.delete('resolved');
    });
  },

  /** Moves the card of a thread in the diagram, from its element; with nothing, puts it back. */
  setCard(this: Project, thread: string, card: Position | null) {
    const y = this.yComments.get(thread);
    if (!y) return;
    this.transact(() => {
      if (card) y.set('card', { x: Math.round(card.x), y: Math.round(card.y) });
      else y.delete('card');
    });
  },
};

/** Takes away the threads of elements that go. */
export function deleteComments(p: Project, elements: Set<string>) {
  for (const [id, thread] of p.yComments) {
    if (elements.has(String(thread.get('element')))) p.yComments.delete(id);
  }
}
