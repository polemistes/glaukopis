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
import { findItem } from '$lib/history/moments';
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
 * What is accepted between two items of a block: everything from just after
 * the one to just before the other, with what is undeleted there to be seen.
 * Where there is none on a side, the edge is the beginning or the end of the
 * block itself.
 */
function between(
  block: Y.XmlElement,
  place: Place,
  entries: Entry[],
  lower: number,
  upper: number,
): Accepted {
  const inside = entries.slice(lower + 1, upper);
  const before = lower >= 0 ? entries[lower] : null;
  const after = upper < entries.length ? entries[upper] : null;
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

/** A sign of a text, by the item it is: the copy that made it, and its clock. */
export interface Sign {
  client: number;
  clock: number;
}

/**
 * The signs on either side of a stretch of a block, as it stands now: what
 * bounds it while the text within it is changed. Nothing on a side where the
 * stretch reaches the edge of the block.
 */
export function edgesOf(
  block: Y.XmlElement | null,
  from: number,
  to: number,
): { before: Sign | null; after: Sign | null } | null {
  if (!block) return null;
  const signs = entriesOf(block).filter((e) => e.sign);
  const a = Math.max(0, Math.min(from, signs.length));
  const b = Math.max(a, Math.min(to, signs.length));
  return {
    before: a > 0 ? { client: signs[a - 1].client, clock: signs[a - 1].clock } : null,
    after: b < signs.length ? { client: signs[b].client, clock: signs[b].clock } : null,
  };
}

/**
 * What is accepted of the stretch between two signs, as the block stands
 * now: for text that has just been changed, where the signs on either side
 * are the same although what is between them is not.
 */
export function acceptBetween(
  block: Y.XmlElement,
  place: Place,
  edges: { before: Sign | null; after: Sign | null } | null,
): Accepted {
  const entries = entriesOf(block);
  const where = (sign: Sign) =>
    entries.findIndex((e) => e.client === sign.client && e.clock === sign.clock);
  const lower = edges?.before ? where(edges.before) : -1;
  const found = edges?.after ? where(edges.after) : -1;
  const upper = edges?.after && found >= 0 ? found : entries.length;
  return between(block, place, entries, lower, upper);
}

/**
 * What is accepted of a stretch of a block as it stands: `from` and `to` are
 * where the stretch begins and ends in the text of the block as it is now
 * (signs counted as the history counts them), and `pieces` what the change
 * showed of it. Where the block is no longer there, it is found by the items
 * of the pieces, and nothing in it is to be seen; where it had no pieces
 * either, there is nothing to accept, and nothing is returned: a position
 * of nothing could not be read again.
 */
export function acceptStretch(
  block: Y.XmlElement,
  place: Place,
  from: number,
  to: number,
  pieces: Piece[],
): Accepted;
export function acceptStretch(
  block: Y.XmlElement | null,
  place: Place,
  from: number,
  to: number,
  pieces: Piece[],
): Accepted | null;
export function acceptStretch(
  block: Y.XmlElement | null,
  place: Place,
  from: number,
  to: number,
  pieces: Piece[],
): Accepted | null {
  if (!block) {
    const { first, last } = edges(pieces);
    if (!first || !last) return null;
    return {
      place,
      from: at(first[0], first[1], 0),
      to: at(last[0], last[1], -1),
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
  return between(
    block,
    place,
    entries,
    a > 0 ? signs[a - 1] : -1,
    b < signs.length ? signs[b] : entries.length,
  );
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

// ---- what is kept of many acceptances ----

/**
 * The units of a block in the order they stand, every one counted, those
 * deleted among them, by the item each is (`client:clock`): the order the
 * history's units have, finer. `whole` is false where a part of the block
 * is gone from this copy (a text deleted whose items were collected), so
 * that not every unit can be counted.
 */
interface Order {
  index: Map<string, number>;
  units: { client: number; clock: number }[];
  /** Of each text in the block, its first unit and the one after its last. */
  texts: Map<Y.XmlText, [number, number]>;
  whole: boolean;
}

function orderOf(block: Y.XmlElement): Order {
  const order: Order = { index: new Map(), units: [], texts: new Map(), whole: true };
  const push = (client: number, clock: number) => {
    order.index.set(`${client}:${clock}`, order.units.length);
    order.units.push({ client, clock });
  };
  for (let child = block._start; child !== null; child = child.right) {
    if (child.content instanceof Y.ContentType && child.content.type instanceof Y.XmlText) {
      const text = child.content.type;
      const first = order.units.length;
      for (let item = text._start; item !== null; item = item.right)
        for (let i = 0; i < item.length; i++) push(item.id.client, item.id.clock + i);
      order.texts.set(text, [first, order.units.length]);
      continue;
    }
    // A thing in the text that is no text; or, deleted and collected, what
    // may have been a text, whose own units are no longer here to count.
    if (!(child.content instanceof Y.ContentType)) order.whole = false;
    for (let i = 0; i < child.length; i++) push(child.id.client, child.id.clock + i);
  }
  return order;
}

/** A relative position as the block it is in and a place among the units of the block. */
function placeOf(
  doc: Y.Doc,
  encoded: Uint8Array,
  orders: Map<Y.XmlElement, Order>,
): { block: Y.XmlElement; index: number } | null {
  let rpos: Y.RelativePosition;
  try {
    rpos = Y.decodeRelativePosition(encoded);
  } catch {
    return null;
  }
  const order = (block: Y.XmlElement) => {
    let found = orders.get(block);
    if (!found) orders.set(block, (found = orderOf(block)));
    return found;
  };
  if (rpos.item) {
    const item = findItem(doc, rpos.item);
    const parent = item?.parent;
    const block = parent instanceof Y.XmlText ? parent.parent : parent;
    if (!(block instanceof Y.XmlElement)) return null;
    const at = order(block).index.get(`${rpos.item.client}:${rpos.item.clock}`);
    if (at === undefined) return null;
    return { block, index: at + (rpos.assoc < 0 ? 1 : 0) };
  }
  if (!rpos.type) return null;
  const item = findItem(doc, rpos.type);
  const type = item?.content instanceof Y.ContentType ? item.content.type : null;
  if (type instanceof Y.XmlText) {
    const block = type.parent;
    if (!(block instanceof Y.XmlElement)) return null;
    const [first, end] = order(block).texts.get(type) ?? [0, 0];
    return { block, index: rpos.assoc >= 0 ? end : first };
  }
  if (!(type instanceof Y.XmlElement)) return null;
  return { block: type, index: rpos.assoc >= 0 ? order(type).units.length : 0 };
}

/** Where an accepted stretch lies: its block, and from its first unit to the one after its last. */
function lying(doc: Y.Doc, a: Accepted, orders: Map<Y.XmlElement, Order>) {
  const from = placeOf(doc, a.from, orders);
  const to = placeOf(doc, a.to, orders);
  if (!from || !to || from.block !== to.block) return null;
  return { block: from.block, from: from.index, to: to.index };
}

/**
 * What is kept of the stretches a person has accepted, when they accept
 * more: the entries kept (`kept`, in the order they are kept, null for
 * what is no entry) and those added now. Without this the entries only
 * grew, one for each decision, for as long as anything was left to review.
 *
 * Of each block in which something is added: where every unit of the
 * block can be counted and the moment reviewed from is known, all the
 * entries of the block become one, from the first to the end of the last,
 * which holds to be seen what the comparison would have taken from them
 * (from the one accepted last that holds a unit, as the history reads
 * them) and, between them, what the moment saw: the comparison is the
 * same, now and later. Otherwise an entry whose stretch lies within one
 * added is replaced by it, which hides it wholly. An entry that cannot be
 * found in the text is left as it is.
 *
 * The indices of `kept` to take away, and the entries to add.
 */
export function combine(
  doc: Y.Doc,
  moment: Uint8Array | null,
  kept: (Accepted | null)[],
  added: Accepted[],
): { removed: number[]; added: Accepted[] } {
  const orders = new Map<Y.XmlElement, Order>();
  let snapshot: Y.Snapshot | null = null;
  try {
    snapshot = moment ? Y.decodeSnapshot(moment) : null;
  } catch {
    snapshot = null;
  }
  type Entry = { accepted: Accepted; kept: number | null; at: ReturnType<typeof lying> };
  const entries: Entry[] = kept.map((a, i) => ({
    accepted: a!,
    kept: i,
    at: a ? lying(doc, a, orders) : null,
  }));
  const fresh: Entry[] = added.map((a) => ({ accepted: a, kept: null, at: lying(doc, a, orders) }));
  const gone = new Set<Entry>();
  const made: Accepted[] = [];
  const blocks = new Set(fresh.map((e) => e.at?.block).filter((b) => !!b));
  for (const block of blocks) {
    const order = orders.get(block!)!;
    const all = [...entries, ...fresh].filter((e) => e.at?.block === block);
    // One alone is kept as it was accepted.
    if (all.length < 2) continue;
    if (order.whole && snapshot) {
      const lo = all.reduce((m, e) => Math.min(m, e.at!.from), Infinity);
      const hi = all.reduce((m, e) => Math.max(m, e.at!.to), -Infinity);
      const sv = snapshot.sv;
      const ds = snapshot.ds;
      const seen: { client: number; clock: number }[] = [];
      for (let i = lo; i < hi; i++) {
        const unit = order.units[i];
        let holder: Entry | undefined;
        for (let k = all.length - 1; k >= 0 && !holder; k--)
          if (i >= all[k].at!.from && i < all[k].at!.to) holder = all[k];
        const was = holder
          ? hasItem(holder.accepted.visible, unit.client, unit.clock)
          : (sv.get(unit.client) ?? 0) > unit.clock &&
            !Y.isDeleted(ds, Y.createID(unit.client, unit.clock));
        if (was) seen.push(unit);
      }
      const first = all.find((e) => e.at!.from === lo)!;
      const last = all.find((e) => e.at!.to === hi)!;
      made.push({
        place: fresh.filter((e) => e.at?.block === block).at(-1)!.accepted.place,
        from: first.accepted.from,
        to: last.accepted.to,
        visible: itemsOf(seen),
      });
      for (const e of all) gone.add(e);
      continue;
    }
    // Each added hides wholly what lies within it and was accepted before it.
    all.forEach((e, k) => {
      for (const later of all.slice(k + 1))
        if (later.kept === null && later.at!.from <= e.at!.from && e.at!.to <= later.at!.to) {
          gone.add(e);
          return;
        }
    });
  }
  return {
    removed: entries.filter((e) => gone.has(e)).map((e) => e.kept!),
    added: [...fresh.filter((e) => !gone.has(e)).map((e) => e.accepted), ...made],
  };
}

/** Whether items hold the one a copy made at a clock. */
function hasItem(items: Items, client: number, clock: number): boolean {
  return (items[client] ?? []).some(([from, to]) => clock >= from && clock < to);
}
