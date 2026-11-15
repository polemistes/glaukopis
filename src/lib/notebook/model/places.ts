/**
 * Where the cards of notes lie on the surface of their box, and how wide
 * they are (`docs/plans/the-notebook.md`, stage 2). A note keeps `at`, the
 * top left corner of its card in pixels of the surface, and none where it is
 * not yet put and stands in the strip; and `width`, none for the usual.
 * Both are whole numbers. These are methods of `Notebook`, which takes them
 * in (see there).
 */

import type { Notebook } from './notebook.svelte';
import type { Point } from './types';

/** The usual width of a card, in pixels of the surface. */
export const CARD_WIDTH = 280;
export const MIN_CARD_WIDTH = 160;
export const MAX_CARD_WIDTH = 720;
/** The room between a card and one put beside it. */
export const CARD_GAP = 24;

/** A width as it is kept: a whole number, between the narrowest and the widest. */
export function cardWidth(width: number): number {
  return Math.min(MAX_CARD_WIDTH, Math.max(MIN_CARD_WIDTH, Math.round(width)));
}

/** A place as the document holds it, or none where it is none. */
export function pointOf(value: unknown): Point | null {
  if (!value || typeof value !== 'object') return null;
  const { x, y } = value as { x?: unknown; y?: unknown };
  return typeof x === 'number' && typeof y === 'number' && Number.isFinite(x) && Number.isFinite(y)
    ? { x, y }
    : null;
}

/** A width as the document holds it, or none for the usual. */
export function widthOf(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? cardWidth(value) : null;
}

export const placeChanges = {
  /** Puts cards where they are to lie, all in one step of undo; places are made whole numbers. */
  place(this: Notebook, moves: { id: string; at: Point }[]) {
    const changes = moves.flatMap(({ id, at }) => {
      const n = this.yNotes.get(id);
      if (!n || !Number.isFinite(at.x) || !Number.isFinite(at.y)) return [];
      const to = { x: Math.round(at.x), y: Math.round(at.y) };
      const now = pointOf(n.get('at'));
      return now && now.x === to.x && now.y === to.y ? [] : [{ n, to }];
    });
    if (!changes.length) return;
    this.transact(() => {
      for (const { n, to } of changes) n.set('at', to);
    });
  },

  /** Takes cards off the surface: they stand in the strip again. */
  unplace(this: Notebook, ids: string[]) {
    const notes = ids.flatMap((id) => {
      const n = this.yNotes.get(id);
      return n && n.has('at') ? [n] : [];
    });
    if (!notes.length) return;
    this.transact(() => {
      for (const n of notes) n.delete('at');
    });
  },

  /** Makes a card as wide as given, kept between the narrowest and the widest; with none, the usual. */
  setWidth(this: Notebook, id: string, width: number | null) {
    const n = this.yNotes.get(id);
    if (!n) return;
    const to = width === null || !Number.isFinite(width) ? null : cardWidth(width);
    if (to === widthOf(n.get('width')) && (to !== null || !n.has('width'))) return;
    this.transact(() => {
      if (to === null) n.delete('width');
      else n.set('width', to);
    });
  },

  /** Where a note cut from this one is put: to the right of its card, at the same height; none where it is not put itself. */
  beside(this: Notebook, id: string): Point | null {
    const record = this.notes.get(id);
    if (!record?.at) return null;
    return { x: record.at.x + (record.width ?? CARD_WIDTH) + CARD_GAP, y: record.at.y };
  },
};
