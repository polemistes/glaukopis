/**
 * Elements copied, to be pasted: within a project, or into another (ADR
 * 0033). Within the project they came from, what is held is the elements
 * themselves, not a copy of them: the copies are made when they are pasted,
 * as copies that remember their original (see `copies.svelte.ts`). For
 * another project, what they were when they were copied is held as well, in
 * a form that project can take (`model/portable.ts`), so that they can be
 * pasted there after the one they came from is closed.
 *
 * Elements cut are held as those copied are, and stay where they are until
 * they are pasted: then they are moved, in the project they came from, as one
 * step that one undo takes back; in another, they are made there and taken
 * away from the one they came from. What was cut is pasted once.
 */

import { t } from '$lib/i18n';
import { router } from '$lib/state/router.svelte';
import { notifyError } from '$lib/ui/toast.svelte';
import { idOf, writeElsewhere } from './elsewhere';
import type { Project } from './model/project.svelte';
import { makePortable, portable, type Place, type Portable } from './model/portable';
import { isAncestor, topmost } from './model/tree';
import { PROJECT } from './model/types';

export interface Held {
  project: Project;
  /** The id of the project they came from, so that it is known again when it is opened anew. */
  from: string | null;
  /** The topmost of what was copied: each with all that is under it. */
  ids: string[];
  /** What they were when they were copied, for another project. */
  portable: Portable;
  /** Cut, to be moved where they are pasted, rather than copied. */
  cut: boolean;
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
  const here =
    held.project === project || (!!held.from && held.from === (idOf(project) ?? openId()));
  return here && held.ids.every((id) => project.node(id));
}

class Clipboard {
  /** Held as it is, not watched within: what is held is not changed, only replaced. */
  held = $state.raw<Held | null>(null);
}

export const clipboard = new Clipboard();

/** Holds the elements, each with all under it; the project itself is never copied. Returns how many are held. */
export function copyElements(project: Project, ids: string[], cut = false): number {
  const tree = project.tree();
  const top = topmost(
    tree,
    ids.filter((id) => project.node(id)),
  ).filter((id) => id !== PROJECT);
  clipboard.held = top.length
    ? { project, from: idOf(project) ?? openId(), ids: top, portable: portable(project, top), cut }
    : null;
  return top.length;
}

/** Holds the elements to be moved where they are pasted. Returns how many are held. */
export function cutElements(project: Project, ids: string[]): number {
  return copyElements(project, ids, true);
}

/** Whether an element is held as cut, to be shown so. */
export function isCut(project: Project, id: string): boolean {
  const held = clipboard.held;
  return !!held && held.cut && held.project === project && held.ids.includes(id);
}

/** Whether what is held can be pasted into this project: as copies, or made anew. */
export function canPaste(project: Project): boolean {
  const held = clipboard.held;
  return !!held && (asCopies(held, project) || held.portable.elements.length > 0);
}

/**
 * Pastes what is held under the element given, at the end of what is under
 * it: at the position given, relative to that element, or placed
 * automatically. Within the project they came from as copies; in another,
 * or where they are gone, made anew.
 */
export function pasteElements(project: Project, place: Place): string[] {
  if (!canPaste(project) || !project.node(place.under)) return [];
  const held = clipboard.held!;
  if (held.cut) return pasteCut(held, project, place);
  if (!asCopies(held, project)) return makePortable(project, held.portable, place);
  return project.copy(held.ids, place.under, undefined, { pos: place.pos });
}

/**
 * Pastes what was cut: moved, where it came from this project; made here,
 * and taken away from the project it came from, where it came from another.
 */
function pasteCut(held: Held, project: Project, place: Place): string[] {
  clipboard.held = null;
  if (asCopies(held, project)) {
    // Under one of what was cut, or under what is under it, it cannot go.
    const tree = project.tree();
    if (held.ids.some((id) => id === place.under || isAncestor(tree, id, place.under))) return [];
    return project.move(held.ids, place.under, undefined, { pos: place.pos ?? null });
  }
  const made = makePortable(project, held.portable, place);
  if (made.length && held.from) {
    const from = held.from;
    const ids = held.ids;
    void writeElsewhere(from, (there) => there.remove(ids)).catch((error) =>
      notifyError(t('project-cut-not-removed'), error),
    );
  }
  return made;
}
