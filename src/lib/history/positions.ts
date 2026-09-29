/**
 * Positions in a passage, as the contract has them (`Accepted`, `versions`,
 * `restore`): relative positions of Yjs, made of the items of its pieces.
 *
 * An offset counts the signs of the text of the passage as its pieces give
 * it, one after another, those removed among them: each sign of text one,
 * each object one.
 */

import * as Y from 'yjs';
import { addItems, tidyItems } from './reading';
import type { Items, Passage, Piece } from './types';

/** The item of the sign at an offset: the copy that made it, and its clock. */
function itemAt(passage: Passage, offset: number): { client: number; clock: number } | null {
  let at = 0;
  for (const piece of passage.pieces) {
    for (const [client, clock, length] of piece.runs) {
      if (offset < at + length) return { client, clock: clock + (offset - at) };
      at += length;
    }
  }
  return null;
}

function encode(item: { client: number; clock: number }, assoc: number): Uint8Array {
  return Y.encodeRelativePosition(
    Y.createRelativePositionFromJSON({ type: null, tname: null, item, assoc }),
  );
}

/** How many signs the passage has, those removed among them. */
export function lengthOf(passage: Passage): number {
  return passage.pieces.reduce((n, p) => n + p.runs.reduce((m, r) => m + r[2], 0), 0);
}

/**
 * The stretch of a passage from one offset to another (the end not in it),
 * as relative positions: before its first sign, and after its last.
 */
export function stretch(
  passage: Passage,
  start: number,
  end: number,
): { from: Uint8Array; to: Uint8Array } | null {
  if (end <= start) return null;
  const first = itemAt(passage, start);
  const last = itemAt(passage, end - 1);
  if (!first || !last) return null;
  return { from: encode(first, 0), to: encode(last, -1) };
}

/** The whole of a passage, as a stretch. */
export function whole(passage: Passage): { from: Uint8Array; to: Uint8Array } | null {
  return stretch(passage, 0, lengthOf(passage));
}

/**
 * The items to be seen in a stretch of a passage, as `Accepted.visible`
 * wants them: of the pieces that are there now, and what formats them.
 */
export function visibleIn(passage: Passage, start = 0, end = lengthOf(passage)): Items {
  const items: Items = {};
  let at = 0;
  for (const piece of passage.pieces) {
    const length = piece.runs.reduce((n, r) => n + r[2], 0);
    const inside = at < end && at + length > start;
    if (inside && piece.status !== 'removed')
      take(items, piece, Math.max(start - at, 0), Math.min(end - at, length));
    at += length;
  }
  return tidyItems(items);
}

/** The items of a piece from one offset in it to another, and all that formats it. */
function take(items: Items, piece: Piece, from: number, to: number) {
  let at = 0;
  const texts = new Set<string>();
  for (const [client, clock, length] of piece.runs) {
    const a = Math.max(from - at, 0);
    const b = Math.min(to - at, length);
    if (b > a) addItems(items, client, clock + a, b - a);
    for (let i = 0; i < length; i++) texts.add(`${client}:${clock + i}`);
    at += length;
  }
  // What formats the piece is not text: all of it is taken.
  for (const [client, ranges] of Object.entries(piece.items))
    for (const [first, after] of ranges)
      for (let clock = first; clock < after; clock++)
        if (!texts.has(`${client}:${clock}`)) addItems(items, Number(client), clock, 1);
}
