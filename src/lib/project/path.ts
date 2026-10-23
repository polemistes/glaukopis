/**
 * The path over a side (ADR 0063): the folders the project lies in, the
 * project, and the elements from the top of the project down to the
 * element in view; and which of them are shown where the path does not fit
 * its cell. Pure, so that it can be tested without the interface.
 */

import type { Folder, ProjectInfo } from '$lib/api/projects';
import { ancestors, folderOf } from '$lib/home/folders';
import { PROJECT } from './model/types';

export type Crumb =
  | { kind: 'folder'; id: string; name: string }
  | { kind: 'project'; id: string; name: string }
  | { kind: 'element'; id: string; name: string };

/** What the path reads of a project: the way down to an element, and the names on it. */
export interface PathSource {
  pathTo(id: string): string[];
  node(id: string): { title: string } | undefined;
}

/**
 * The path from the top folder to the element in view: the folders the
 * project lies in, the outermost first; the project, by the name its own
 * element has, else that of the list; the elements down to `at`. The
 * project itself in view ends the path at the project.
 */
export function crumbsOf(
  folders: readonly Folder[],
  info: ProjectInfo,
  project: PathSource,
  at: string,
): Crumb[] {
  const all = folders as Folder[];
  const out: Crumb[] = ancestors(all, folderOf(all, info))
    .reverse()
    .map((id) => ({ kind: 'folder', id, name: all.find((f) => f.id === id)?.name ?? '' }));
  out.push({ kind: 'project', id: info.id, name: project.node(PROJECT)?.title || info.name });
  if (at !== PROJECT)
    for (const id of project.pathTo(at)) {
      if (id === PROJECT) continue;
      out.push({ kind: 'element', id, name: project.node(id)?.title ?? '' });
    }
  return out;
}

/**
 * Which crumbs are shown in a room: the first and the last always, and
 * those `kept` (the project, so that each path says its project), then as
 * many of the rest as fit, taken from the end; each stretch of hidden ones
 * stands behind one crumb of `ellipsis` width. Widths are of the crumbs
 * drawn whole, with their separators. Where those always shown do not fit,
 * they are shown all the same, and the last is cut to the room that is left.
 */
export function fitCrumbs(
  widths: readonly number[],
  room: number,
  ellipsis: number,
  kept: readonly number[] = [],
): { shown: number[]; hidden: number[] } {
  const n = widths.length;
  const all = widths.map((_, i) => i);
  if (n <= 2 || widths.reduce((sum, w) => sum + w, 0) <= room) return { shown: all, hidden: [] };
  const shown = new Set([0, n - 1, ...kept.filter((i) => i > 0 && i < n - 1)]);
  /** What the crumbs shown take, with a crumb … for each stretch hidden between them. */
  const cost = (set: Set<number>) => {
    const sorted = [...set].sort((a, b) => a - b);
    return sorted.reduce(
      (sum, i, k) => sum + widths[i] + (k > 0 && i - sorted[k - 1] > 1 ? ellipsis : 0),
      0,
    );
  };
  // From the end towards the first, while each fits.
  for (let i = n - 2; i > 0; i--) {
    if (shown.has(i)) continue;
    const more = new Set([...shown, i]);
    if (cost(more) > room) break;
    shown.add(i);
  }
  return {
    shown: all.filter((i) => shown.has(i)),
    hidden: all.filter((i) => !shown.has(i)),
  };
}
