/**
 * What the going-through found out of each file, and what was decided of
 * it, is kept for the session, across every reload of the files: a reload
 * follows a move, a taking in, the files view entered, a going-through
 * done, and each would otherwise throw away minutes of lookups. Only what
 * no longer holds is forgotten: both of a file that is gone; what was
 * decided of a file whose references changed, since that is done, or
 * undone, and its going-through comes anew from what was found out of it.
 */

import type { FileView } from '$lib/api/files';

/** The references a file belongs to, as one string that compares. */
const referencesOf = (f: FileView) =>
  f.references
    .map((r) => r.id)
    .sort()
    .join('\n');

/** Forgets, of what is kept by hash, what no longer holds once the files before are the files after. */
export function forgetStale(
  before: readonly FileView[],
  after: readonly FileView[],
  found: Map<string, unknown>,
  decided: Map<string, unknown>,
): void {
  const was = new Map(before.map((f) => [f.hash, referencesOf(f)]));
  const now = new Map(after.map((f) => [f.hash, referencesOf(f)]));
  for (const hash of [...found.keys()]) if (!now.has(hash)) found.delete(hash);
  for (const hash of [...decided.keys()]) {
    const refs = now.get(hash);
    const old = was.get(hash);
    if (refs === undefined || (old !== undefined && old !== refs)) decided.delete(hash);
  }
}

/** Forgets what was decided of one file put anew, where its references changed. */
export function forgetChanged(
  old: FileView | undefined,
  view: FileView,
  decided: Map<string, unknown>,
): void {
  if (old && referencesOf(old) !== referencesOf(view)) decided.delete(view.hash);
}
