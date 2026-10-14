/**
 * How wide the columns of the library are: the collections or folders at the
 * left, and the pane of what is selected at the right. Kept in the settings,
 * and the same for the references and the files, so that switching between
 * them does not move the columns.
 */
import { settings } from '$lib/state/settings.svelte';

export interface Limits {
  width: number;
  min: number;
  max: number;
}

export const SIDE: Limits = { width: 224, min: 150, max: 560 };
export const DETAIL: Limits = { width: 400, min: 280, max: 820 };

/** A width after a drag of `dx` pixels, within its limits; a width not known is the given one. */
export function within(width: number, dx: number, limits: Limits): number {
  const from = Number.isFinite(width) && width > 0 ? width : limits.width;
  return Math.round(Math.min(limits.max, Math.max(limits.min, from + dx)));
}

export const columns = {
  get side(): number {
    return within(settings.value.librarySideWidth, 0, SIDE);
  },
  get detail(): number {
    return within(settings.value.libraryDetailWidth, 0, DETAIL);
  },
  /** The left column after a drag: rightwards widens it. */
  moveSide(dx: number) {
    settings.set('librarySideWidth', within(this.side, dx, SIDE));
  },
  /** The right pane after a drag: leftwards widens it. */
  moveDetail(dx: number) {
    settings.set('libraryDetailWidth', within(this.detail, -dx, DETAIL));
  },
  resetSide() {
    settings.set('librarySideWidth', SIDE.width);
  },
  resetDetail() {
    settings.set('libraryDetailWidth', DETAIL.width);
  },
};
