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

/** An element, or a map, or an association, as the document holds it. */
export type YNode = Y.Map<unknown>;

export function str(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

export function nowIso(): string {
  return new Date().toISOString().replace(/\.\d+Z$/, 'Z');
}
