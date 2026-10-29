/**
 * The bookmarks of a file (ADR 0072): places in it with names, kept with the
 * file in the library, the same from every project. Plain functions over
 * plain values, tested on their own; the list is kept in the order the
 * places stand.
 */

import type { Bookmark } from '$lib/api/files';
import { newId } from '$lib/util/id';
import type { Place } from './pages';

/** The most bookmarks a file keeps, and the longest name of one, as the core keeps them. */
export const MOST = 500;
export const LONGEST = 200;

/** A name made one line, no longer than a name may be. */
const named = (name: string) => name.split(/\s+/).filter(Boolean).join(' ').slice(0, LONGEST);

/** In the order of their places. */
const ordered = (list: Bookmark[]) => [...list].sort((a, b) => a.page - b.page || a.at - b.at);

/** The name a bookmark is offered: the page as it is numbered in print. */
export const defaultName = (place: Place, labels: string[], page: (label: string) => string) =>
  page(labels[place.page - 1] ?? String(place.page));

/** A place marked, with a name; none where the file has as many as it may keep. */
export function withBookmark(
  list: Bookmark[],
  place: Place,
  name: string,
): { list: Bookmark[]; id: string } | null {
  if (list.length >= MOST) return null;
  const mark: Bookmark = {
    id: newId(),
    page: Math.max(1, Math.round(place.page)),
    at: Math.min(1, Math.max(0, place.at)),
    name: named(name) || String(place.page),
  };
  return { list: ordered([...list, mark]), id: mark.id };
}

/** A bookmark named anew; a name left blank keeps the one it had. */
export const renamed = (list: Bookmark[], id: string, name: string): Bookmark[] =>
  list.map((b) => (b.id === id && named(name) ? { ...b, name: named(name) } : b));

/** A bookmark taken away. */
export const without = (list: Bookmark[], id: string): Bookmark[] =>
  list.filter((b) => b.id !== id);
