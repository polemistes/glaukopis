/**
 * How wide the list of notes on the page of the notebook is: as wide as it
 * was dragged to be, kept in the settings, within the limits of a column.
 */
import { within, type Limits } from '$lib/library/columns.svelte';
import { settings } from '$lib/state/settings.svelte';

export const LIST: Limits = { width: 320, min: 220, max: 640 };

export const listWidth = {
  get width(): number {
    return within(settings.value.notebookListWidth, 0, LIST);
  },
  /** The list after a drag: rightwards widens it. */
  move(dx: number) {
    settings.set('notebookListWidth', within(this.width, dx, LIST));
  },
  reset() {
    settings.set('notebookListWidth', LIST.width);
  },
};
