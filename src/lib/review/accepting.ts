/**
 * What is accepted of a change, in the terms of the history (ADR 0021, the
 * contract in `history/types.ts`): the stretch of a block of text it is, as
 * relative positions, and the items that are to be seen in it.
 *
 * The stretch is found in the document that is worked in, as it stands:
 * from just after the sign before it, to just before the sign after it, so
 * that what was deleted at its edges is within it. At the beginning or the
 * end of a block it is the beginning or the end of the block itself. A block
 * that is no longer there, as a paragraph deleted, is found by the items of
 * its pieces instead.
 */

import * as Y from 'yjs';
import type { Accepted, Items, Piece, Place } from '$lib/history/types';

/** The block of a text a place names, in the name or the text of an element. */
export function blockAt(fragment: Y.XmlFragment | null, place: Place): Y.XmlElement | null {
  const at = nodeAt(fragment, place);
  // The text of a table as a whole is what is said of it.
  if (at?.nodeName === 'tabular') {
    const said = at
      .toArray()
      .find((c): c is Y.XmlElement => c instanceof Y.XmlElement && c.nodeName === 'table_caption');
    return said ?? null;
  }
  return at;
}

/** The node a place names, as it stands in the tree of blocks: a figure or a table as a whole. */
export function nodeAt(fragment: Y.XmlFragment | null, place: Place): Y.XmlElement | null {
  if (!fragment) return null;
  // The name of an element is one line.
  const path = place.part === 'title' && !place.path.length ? [0] : place.path;
  let at: Y.XmlFragment = fragment;
  for (let i = 0; i < path.length; i++) {
    const step = path[i];
    if (step === 'note') {
      const k = path[++i];
      const notes = at
        .toArray()
        .filter((c): c is Y.XmlElement => c instanceof Y.XmlElement && c.nodeName === 'footnote');
      const note = typeof k === 'number' ? notes[k] : undefined;
      if (!note) return null;
      at = note;
      continue;
    }
    if (typeof step !== 'number' || step < 0 || step >= at.length) return null;
    const child = at.get(step);
    if (!(child instanceof Y.XmlElement)) return null;
    at = child;
  }
  return at instanceof Y.XmlElement ? at : null;
}

/** An item of the text of a block, in order: a sign of it, or formatting that stands between signs. */
interface Entry {
  client: number;
  clock: number;
  sign: boolean;
}

/**
 * The items of the text of a block as it is, in order: each character is a
 * sign, and so is each thing in it that is no text (a citation, a formula, a
 * note), as the history counts them (U+FFFC).
 */
function entriesOf(block: Y.XmlElement): Entry[] {
  const out: Entry[] = [];
  for (let child = block._start; child !== null; child = child.right) {
    if (child.deleted || !(child.content instanceof Y.ContentType)) continue;
    const type = child.content.type;
    if (type instanceof Y.XmlText) {
      for (let item = type._start; item !== null; item = item.right) {
        if (item.deleted) continue;
        const { client, clock } = item.id;
        if (item.content instanceof Y.ContentString || item.content instanceof Y.ContentEmbed) {
          for (let i = 0; i < item.length; i++) out.push({ client, clock: clock + i, sign: true });
        } else if (item.content instanceof Y.ContentFormat) {
          out.push({ client, clock, sign: false });
        }
      }
    } else {
      out.push({ client: child.id.client, clock: child.id.clock, sign: true });
    }
  }
  return out;
}

/** Items as the history counts them: for each copy, the ranges of their clocks. */
export function itemsOf(entries: { client: number; clock: number }[]): Items {
  const byClient = new Map<number, number[]>();
  for (const e of entries) {
    const list = byClient.get(e.client);
    if (list) list.push(e.clock);
    else byClient.set(e.client, [e.clock]);
  }
  const out: Items = {};
  for (const [client, clocks] of byClient) {
    clocks.sort((a, b) => a - b);
    const ranges: [number, number][] = [];
    for (const c of clocks) {
      const last = ranges[ranges.length - 1];
      if (last && c === last[1]) last[1] = c + 1;
      else if (!last || c >= last[1]) ranges.push([c, c + 1]);
    }
    out[client] = ranges;
  }
  return out;
}

/** The items of some pieces, all together. */
export function itemsOfPieces(pieces: Piece[]): Items {
  const out: Items = {};
  for (const p of pieces) {
    for (const [client, ranges] of Object.entries(p.items)) {
      const c = Number(client);
      (out[c] ??= []).push(...ranges.map((r) => [r[0], r[1]] as [number, number]));
    }
  }
  for (const ranges of Object.values(out)) ranges.sort((a, b) => a[0] - b[0]);
  return out;
}

function encode(position: Y.RelativePosition): Uint8Array {
  return Y.encodeRelativePosition(position);
}

function at(client: number, clock: number, assoc: number): Uint8Array {
  return encode(Y.createRelativePositionFromJSON({ item: { client, clock }, assoc }));
}

/** The first and the last item of some pieces, by their clocks: where no block holds them any more. */
function edges(pieces: Piece[]): { first: [number, number] | null; last: [number, number] | null } {
  const low = (p: Piece): [number, number] | null => {
    let best: [number, number] | null = null;
    for (const [client, ranges] of Object.entries(p.items))
      for (const [start] of ranges) if (!best || start < best[1]) best = [Number(client), start];
    return best;
  };
  const high = (p: Piece): [number, number] | null => {
    let best: [number, number] | null = null;
    for (const [client, ranges] of Object.entries(p.items))
      for (const [, end] of ranges)
        if (!best || end - 1 > best[1]) best = [Number(client), end - 1];
    return best;
  };
  const withItems = pieces.filter((p) => Object.keys(p.items).length);
  return {
    first: withItems.length ? low(withItems[0]) : null,
    last: withItems.length ? high(withItems[withItems.length - 1]) : null,
  };
}

/**
 * What is accepted of a stretch of a block as it stands: `from` and `to` are
 * where the stretch begins and ends in the text of the block as it is now
 * (signs counted as the history counts them), and `pieces` what the change
 * showed of it. Where the block is no longer there, it is found by the items
 * of the pieces, and nothing in it is to be seen.
 */
export function acceptStretch(
  block: Y.XmlElement | null,
  place: Place,
  from: number,
  to: number,
  pieces: Piece[],
): Accepted {
  if (!block) {
    const { first, last } = edges(pieces);
    return {
      place,
      from: first ? at(first[0], first[1], 0) : new Uint8Array(),
      to: last ? at(last[0], last[1], -1) : new Uint8Array(),
      visible: {},
    };
  }
  const entries = entriesOf(block);
  const signs: number[] = [];
  entries.forEach((e, i) => {
    if (e.sign) signs.push(i);
  });
  const a = Math.max(0, Math.min(from, signs.length));
  const b = Math.max(a, Math.min(to, signs.length));
  // What is between the sign before the stretch and the sign after it.
  const lower = a > 0 ? signs[a - 1] : -1;
  const upper = b < signs.length ? signs[b] : entries.length;
  const inside = entries.slice(lower + 1, upper);
  const before = a > 0 ? entries[signs[a - 1]] : null;
  const after = b < signs.length ? entries[signs[b]] : null;
  return {
    place,
    from: before
      ? at(before.client, before.clock, -1)
      : encode(Y.createRelativePositionFromTypeIndex(block, 0, -1)),
    to: after
      ? at(after.client, after.clock, 0)
      : encode(Y.createRelativePositionFromTypeIndex(block, block.length, 0)),
    visible: itemsOf(inside),
  };
}

/** The text of a block as it is, with each thing in it that is no text as U+FFFC: to compare with what the history said. */
export function textOf(block: Y.XmlElement): string {
  let out = '';
  for (let child = block._start; child !== null; child = child.right) {
    if (child.deleted || !(child.content instanceof Y.ContentType)) continue;
    const type = child.content.type;
    if (type instanceof Y.XmlText) {
      for (let item = type._start; item !== null; item = item.right) {
        if (item.deleted) continue;
        if (item.content instanceof Y.ContentString) out += item.content.str;
        else if (item.content instanceof Y.ContentEmbed) out += '￼';
      }
    } else out += '￼';
  }
  return out;
}
