/**
 * Elements copied, to be pasted: within the application, from one place of
 * a project to another. What is held is the elements themselves, not a
 * copy of them: the copies are made when they are pasted, as copies that
 * remember their original (see `copies.svelte.ts`). Nothing is held across
 * projects: a copy to another project is not yet provided for.
 */

import type { Project } from './model/project.svelte';
import { topmost } from './model/tree';
import type { Position } from './model/types';

export interface Held {
  project: Project;
  map: string;
  /** The topmost of what was copied: each with all that is under it. */
  ids: string[];
}

export const clipboard = $state<{ held: Held | null }>({ held: null });

/** Holds the elements, each with all under it; the centre is never copied. Returns how many are held. */
export function copyElements(project: Project, map: string, ids: string[]): number {
  const tree = project.tree(map);
  const top = topmost(tree, ids).filter((id) => id !== tree.root && project.node(id));
  clipboard.held = top.length ? { project, map, ids: top } : null;
  return top.length;
}

/** Whether what is held can be pasted into this project: it came from it, and is still there. */
export function canPaste(project: Project): boolean {
  const held = clipboard.held;
  return !!held && held.project === project && held.ids.every((id) => project.node(id));
}

/**
 * Pastes what is held as copies: under the element given, at the end; or,
 * under none, on their own in the map, at the position given.
 */
export function pasteElements(
  project: Project,
  map: string,
  under: string | null,
  pos: Position | null = null,
): string[] {
  if (!canPaste(project)) return [];
  const held = clipboard.held!;
  return under
    ? project.copy(held.ids, under)
    : project.copy(held.ids, null, undefined, { pos: pos ?? { x: 0, y: 0 }, map });
}
