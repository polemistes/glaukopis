/**
 * What the list of projects at the left keeps while the application runs
 * (ADR 0033, 0063): which folders are closed, and a row it is to put the
 * focus on. And the list itself: whether it is shown and how wide, which
 * is the window's own, since it is a matter of the room the window has
 * (ADR 0085, addendum): a new window begins as the one it came from has it,
 * and the settings keep it as the last window to close had it, for the
 * next start.
 */

import { windowNew, type ListPane } from '$lib/api/system';
import { settings } from '$lib/state/settings.svelte';
import { madeAfterTheFirst } from '$lib/state/window-place';

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
   * A row the list is to select and put the focus on once it is drawn, by
   * its key there (`p:<project>`): asked for by `toList`.
   */
  focusRow = $state<string | null>(null);

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

/** The list of projects of this window: whether it is shown, and how wide. */
class Pane {
  shown = $state(true);
  width = $state(PANE_WIDTH);

  /**
   * As it begins: as the window this one came from has it, else as the
   * settings say, which is how the last window to close had it.
   */
  begin() {
    const from = madeAfterTheFirst()?.list;
    this.shown = from?.shown ?? settings.value.projectsList;
    this.width = paneWidth(from?.width ?? settings.value.projectsPaneWidth, 0);
  }

  /** As it is now, for a new window, or for the settings as the window closes. */
  get now(): ListPane {
    return { shown: this.shown, width: this.width };
  }

  /** Kept in the settings, for the next start: done as the window closes. */
  keep() {
    if (settings.value.projectsList !== this.shown) settings.set('projectsList', this.shown);
    if (settings.value.projectsPaneWidth !== this.width)
      settings.set('projectsPaneWidth', this.width);
  }
}

export const listPane = new Pane();

/** A new window beside this one, showing `open` or the start screen, with the list as this window has it. */
export function newWindow(open: string | null = null): Promise<void> {
  return windowNew(open, listPane.now);
}

/** Opens the pane of projects, or closes it, in this window. */
export function toggleProjectsPane() {
  listPane.shown = !listPane.shown;
}

/**
 * Up from the top of a project, into the list (ADR 0063): the list is shown
 * where it was hidden, and the project's row takes the focus, so that the
 * keys of the tree go on from there.
 */
export function toList(project: string) {
  listPane.shown = true;
  listUi.focusRow = `p:${project}`;
}
