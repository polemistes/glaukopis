/**
 * Where the cards of notes lie on the surface of their box, and how large
 * they are (`docs/plans/the-notebook.md`, stage 2). A note keeps `at`, the
 * top left corner of its card in pixels of the surface, and none where it is
 * not yet put and stands in the strip; `width`, none for the usual; and
 * `height`, the most its card is high, none where the card is as high as
 * what it holds, up to the usual. All are whole numbers. These are methods
 * of `Notebook`, which takes them in (see there).
 */

import type { Notebook } from './notebook.svelte';
import type { Point } from './types';

/** The usual width of a card, in pixels of the surface. */
export const CARD_WIDTH = 280;
export const MIN_CARD_WIDTH = 160;
/** Wide enough for a picture to be looked at on its card. */
export const MAX_CARD_WIDTH = 1600;
/** The least a card may be made high: its name and a line; and the most. */
export const MIN_CARD_HEIGHT = 56;
export const MAX_CARD_HEIGHT = 2400;
/** The room between a card and one put beside it. */
export const CARD_GAP = 24;

/** A width as it is kept: a whole number, between the narrowest and the widest. */
export function cardWidth(width: number): number {
  return Math.min(MAX_CARD_WIDTH, Math.max(MIN_CARD_WIDTH, Math.round(width)));
}

/** A height as it is kept: a whole number, between the lowest and the highest. */
export function cardHeight(height: number): number {
  return Math.min(MAX_CARD_HEIGHT, Math.max(MIN_CARD_HEIGHT, Math.round(height)));
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

/** A height as the document holds it, or none where the card is as high as what it holds. */
export function heightOf(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? cardHeight(value) : null;
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

  /**
   * Makes a card at most as high as given, kept between the lowest and the
   * highest: it shows the note down to there, and is lower where the note
   * is shorter. With none, it is as high as what it holds, up to the usual.
   */
  setHeight(this: Notebook, id: string, height: number | null) {
    const n = this.yNotes.get(id);
    if (!n) return;
    const to = height === null || !Number.isFinite(height) ? null : cardHeight(height);
    if (to === heightOf(n.get('height')) && (to !== null || !n.has('height'))) return;
    this.transact(() => {
      if (to === null) n.delete('height');
      else n.set('height', to);
    });
  },

  /** Where a note cut from this one is put: to the right of its card, at the same height; none where it is not put itself. */
  beside(this: Notebook, id: string): Point | null {
    const record = this.notes.get(id);
    if (!record?.at) return null;
    return { x: record.at.x + (record.width ?? CARD_WIDTH) + CARD_GAP, y: record.at.y };
  },
};
