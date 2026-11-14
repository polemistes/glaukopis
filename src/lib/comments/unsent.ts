/**
 * What is written in the panel of comments and not yet sent (record 0094):
 * the fields it is written in, as the project keeps them (`Drafts`), and
 * the comment that is being begun, as it is kept with the view of the
 * project from one opening to the next.
 */

import type { Thread } from '$lib/project/model/types';
import { fromBase64, toBase64 } from '$lib/util/base64';

/** A comment that is being begun: its element, and its passage where it is on one. */
export interface Beginning {
  element: string;
  passage: Thread['passage'];
}

/** A comment being begun, as it is written with the view: the two positions of its passage as text. */
export interface StoredBeginning {
  element: string;
  passage?: { from: string; to: string; text: string };
}

/** The field of the comment that is being begun. */
export const BEGINNING_FIELD = 'comment';
/** The field under a thread, where it is answered. */
export const answerField = (thread: string) => `answer:${thread}`;
/** The field of a note that is being changed. */
export const noteField = (thread: string, note: string) => `note:${thread}:${note}`;

/**
 * Whether a field still has its place: an answer while its thread is there,
 * a note being changed while the note is. Every field that is not of the
 * comments has.
 */
export function fieldThere(field: string, comments: ReadonlyMap<string, Thread>): boolean {
  const [what, thread, note] = field.split(':');
  if (what === 'answer') return comments.has(thread);
  if (what === 'note') return !!comments.get(thread)?.notes.some((n) => n.id === note);
  return true;
}

/** A comment being begun, as it is kept. */
export function keptBeginning(beginning: Beginning): StoredBeginning {
  const p = beginning.passage;
  return {
    element: beginning.element,
    ...(p ? { passage: { from: toBase64(p.from), to: toBase64(p.to), text: p.text } } : {}),
  };
}

/** What was kept of a comment being begun, read with care: none where it cannot be read. */
export function readBeginning(kept: unknown): Beginning | null {
  const k = (kept && typeof kept === 'object' ? kept : {}) as Partial<StoredBeginning>;
  if (typeof k.element !== 'string' || !k.element) return null;
  const p = k.passage;
  if (p === undefined || p === null) return { element: k.element, passage: null };
  if (typeof p?.from !== 'string' || typeof p.to !== 'string' || typeof p.text !== 'string')
    return null;
  try {
    return {
      element: k.element,
      passage: { from: fromBase64(p.from), to: fromBase64(p.to), text: p.text },
    };
  } catch {
    return null;
  }
}
