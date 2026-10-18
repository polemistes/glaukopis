/**
 * Where the changes to a project come from, which says how they are saved
 * and undone; and the small things the parts of a project share.
 */

import type * as Y from 'yjs';

/** Origin of changes made by this user outside the editors. */
export const LOCAL = 'local';
/** Origin of changes read from disk: not to be saved again, nor undone. */
export const LOAD = 'load';

/** Origin of what the history writes into the document: who is who, and what they deleted. */
export const HISTORY = 'history';

/** Origin of what is put in order when a project is read: saved, but not undone. */
export const TIDY = 'tidy';

/**
 * Origin of what is written in the comments themselves: begun, answered,
 * changed, taken back, settled, moved. Saved, but not undone: Ctrl+Z while
 * one writes must not take a comment away, and the comments have an undo of
 * their own where a note is taken back. What a change of the elements does
 * to the comments, such as the threads of an element removed, is LOCAL and
 * is undone with it (ADR 0053).
 */
export const COMMENTS = 'comments';

/**
 * Origin of the copy of a template the project keeps (ADR 0038): saved,
 * but not undone. It is no change of the writer's to the project, as a work
 * cited is not: it is made afresh when the template is saved again.
 */
export const TEMPLATE_COPY = 'template-copy';

/** An element, or a map, or an association, as the document holds it. */
export type YNode = Y.Map<unknown>;

export function str(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

export function nowIso(): string {
  return new Date().toISOString().replace(/\.\d+Z$/, 'Z');
}
