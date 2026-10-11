/**
 * What the list of projects keeps while the application runs, the same on
 * the home page and in the pane of projects (ADR 0033): which folders are
 * closed; and on the owl map, which folders were folded or unfolded by
 * hand (ADR 0037). And the pane itself: whether it is open and how wide, which the
 * settings remember.
 */

import { settings } from '$lib/state/settings.svelte';

class ListUi {
  /** The folders that are closed, by id. */
  collapsed = $state(new Set<string>());

  toggle(id: string) {
    const next = new Set(this.collapsed);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    this.collapsed = next;
  }

  /**
   * The folders of the owl map folded (true) or unfolded (false) by hand.
   * One not here is folded as it starts: where it holds many projects.
   */
  owlFolds = $state.raw(new Map<string, boolean>());

  /** Folds a folder of the owl map, or unfolds it. */
  owlFold(id: string, folded: boolean) {
    const next = new Map(this.owlFolds);
    next.set(id, folded);
    this.owlFolds = next;
  }

  /** Opens the folders given, so that what is in them is seen. */
  reveal(ids: (string | null)[]) {
    if (!ids.some((id) => id && this.collapsed.has(id))) return;
    const next = new Set(this.collapsed);
    for (const id of ids) if (id) next.delete(id);
    this.collapsed = next;
  }
}

export const listUi = new ListUi();

/** How wide the pane of projects is when nothing else is said, and how narrow and wide it may be dragged. */
export const PANE_WIDTH = 240;
export const PANE_MIN = 180;
export const PANE_MAX = 480;

/** The width of the pane after a drag of `dx` pixels, within its limits; a width not known is the given one. */
export function paneWidth(width: number, dx: number): number {
  const from = Number.isFinite(width) && width > 0 ? width : PANE_WIDTH;
  return Math.round(Math.min(PANE_MAX, Math.max(PANE_MIN, from + dx)));
}

/** Opens the pane of projects, or closes it. */
export function toggleProjectsPane() {
  settings.set('projectsPane', !settings.value.projectsPane);
}
