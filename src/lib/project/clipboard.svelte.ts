/**
 * Elements copied, to be pasted: within a project, or into another (ADR
 * 0033). Within the project they came from, what is held is the elements
 * themselves, not a copy of them: the copies are made when they are pasted,
 * as copies that remember their original (see `copies.svelte.ts`). For
 * another project, what they were when they were copied is held as well, in
 * a form that project can take (`model/portable.ts`), so that they can be
 * pasted there after the one they came from is closed.
 */

import { router } from '$lib/state/router.svelte';
import type { Project } from './model/project.svelte';
import { makePortable, portable, type Portable } from './model/portable';
import { topmost } from './model/tree';
import type { Position } from './model/types';

export interface Held {
  project: Project;
  /** The id of the project they came from, so that it is known again when it is opened anew. */
  from: string | null;
  map: string;
  /** The topmost of what was copied: each with all that is under it. */
  ids: string[];
  /** What they were when they were copied, for another project. */
  portable: Portable;
}

/** The id of the project that is open, as the route names it. */
function openId(): string | null {
  const route = router.route;
  return route.view === 'project' ? route.project : null;
}

/**
 * Whether what is held is pasted as copies of the elements themselves: it
 * came from this project (the same, or the same opened anew since, which is
 * another object holding the same elements), and they are all still there.
 * Otherwise it is made anew, as it was when it was copied.
 */
function asCopies(held: Held, project: Project): boolean {
  const here = held.project === project || (!!held.from && held.from === openId());
  return here && held.ids.every((id) => project.node(id));
}

class Clipboard {
  /** Held as it is, not watched within: what is held is not changed, only replaced. */
  held = $state.raw<Held | null>(null);
}

export const clipboard = new Clipboard();

/** Holds the elements, each with all under it; the centre is never copied. Returns how many are held. */
export function copyElements(project: Project, map: string, ids: string[]): number {
  const tree = project.tree(map);
  const top = topmost(tree, ids).filter((id) => id !== tree.root && project.node(id));
  clipboard.held = top.length
    ? { project, from: openId(), map, ids: top, portable: portable(project, top) }
    : null;
  return top.length;
}

/** Whether what is held can be pasted into this project: as copies, or made anew. */
export function canPaste(project: Project): boolean {
  const held = clipboard.held;
  return !!held && (asCopies(held, project) || held.portable.elements.length > 0);
}

/**
 * Pastes what is held: under the element given, at the end; or, under
 * none, on their own in the map, at the position given. Within the project
 * they came from as copies; in another, or where they are gone, made anew.
 */
export function pasteElements(
  project: Project,
  map: string,
  under: string | null,
  pos: Position | null = null,
): string[] {
  if (!canPaste(project)) return [];
  const held = clipboard.held!;
  if (!asCopies(held, project))
    return makePortable(
      project,
      held.portable,
      under ? { under } : { map, pos: pos ?? { x: 0, y: 0 } },
    );
  return under
    ? project.copy(held.ids, under)
    : project.copy(held.ids, null, undefined, { pos: pos ?? { x: 0, y: 0 }, map });
}
