/**
 * What a line of the preview is, by what the core tells of the pages it
 * made (`Preview.spots`): a stretch of a page and what stands in it, a
 * quotation or another kind of paragraph, a heading of a level, a note,
 * the bibliography, a figure, a table, the front page, a part of the
 * document; text where nothing stands. And where Look opens for it, which
 * the chip at the edge of the page does. Pure: no words and nothing
 * reactive; the panel says it in words (ADR 0054).
 */

import type { Spot } from '$lib/api/documents';

/** Where Look opens for what a line is: a section of Look, and in it a kind, a level of heading or a subheading. */
export interface LookAim {
  section: 'type' | 'paragraphs' | 'headings' | 'notes' | 'figures' | 'front' | 'contents';
  kind?: string;
  level?: number;
  at?: string;
}

/** What a line is, taken apart: what sort of thing, and which kind, part or level of heading. */
export type What =
  | { sort: 'kind'; id: string }
  | { sort: 'part'; id: string }
  | { sort: 'heading'; level: number }
  | { sort: 'note' | 'bibliography' | 'figure' | 'table' | 'front' | 'text' };

/** What the core names, of a line that stands in nothing it names. */
export const TEXT = 'text';

/**
 * How far a baseline may stand outside a spot and still be within it, in
 * points: where the type has no room below its baseline, the last line of
 * a block has its baseline where the block ends.
 */
const NEAR = 0.5;

/** The spots of a page, in their order. */
export function spotsOn(spots: readonly Spot[], page: number): Spot[] {
  return spots.filter((s) => s.page === page);
}

/**
 * What a line is, by the spots of its page: the innermost spot whose top
 * and bottom hold the line's baseline, which is the least high of those
 * that do (a heading within a part, a note at the foot of a page that a
 * quotation goes on from); of two as high, the later. `text` where none.
 */
export function whatIs(spots: readonly Spot[], page: number, baseline: number): string {
  let found: Spot | null = null;
  for (const spot of spots) {
    if (spot.page !== page || baseline < spot.top - NEAR || baseline > spot.bottom + NEAR) continue;
    if (!found || spot.bottom - spot.top <= found.bottom - found.top) found = spot;
  }
  return found?.what ?? TEXT;
}

/** What a line is, taken apart; text for what is not known. */
export function readWhat(what: string): What {
  const colon = what.indexOf(':');
  const sort = colon < 0 ? what : what.slice(0, colon);
  const rest = colon < 0 ? '' : what.slice(colon + 1);
  switch (sort) {
    case 'kind':
    case 'part':
      return rest ? { sort, id: rest } : { sort: 'text' };
    case 'heading': {
      const level = Number(rest);
      return Number.isInteger(level) && level > 0 ? { sort, level } : { sort: 'text' };
    }
    case 'note':
    case 'bibliography':
    case 'figure':
    case 'table':
    case 'front':
      return colon < 0 ? { sort } : { sort: 'text' };
    default:
      return { sort: 'text' };
  }
}

/** Where Look opens for what a line is. */
export function lookFor(what: string): LookAim {
  const read = readWhat(what);
  switch (read.sort) {
    case 'kind':
      return { section: 'paragraphs', kind: read.id };
    case 'part':
      return { section: 'contents' };
    case 'heading':
      return { section: 'headings', level: read.level };
    case 'note':
      return { section: 'notes' };
    case 'bibliography':
      return { section: 'notes', at: 'bibliography' };
    case 'figure':
    case 'table':
      return { section: 'figures' };
    case 'front':
      return { section: 'front' };
    case 'text':
      return { section: 'type' };
  }
}
