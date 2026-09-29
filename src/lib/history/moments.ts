/**
 * Moments of a document that keeps what was deleted (`gc: false`), and
 * reading it as it was at one.
 *
 * A moment is what was made by then and not yet deleted: a snapshot of
 * Yjs, or the document as it is. Items of Yjs that were made one after
 * another are kept as one, and a moment can fall within one: before a
 * document is read at a moment it is split there (`split`), within a
 * transaction, at the end of which Yjs joins what it split.
 */

import * as Y from 'yjs';

type DeleteSet = ReturnType<typeof Y.createDeleteSet>;

/** A moment, as it is asked of each item. */
export interface At {
  /** Whether what a copy made at this clock had been made by then. */
  made(client: number, clock: number): boolean;
  /** Whether an item was there to be seen: made, and not yet deleted. */
  seen(item: Y.Item): boolean;
  /** The snapshot it is, where it is not the document as it is. */
  snapshot: Y.Snapshot | null;
}

/** The document as it is. */
export const NOW: At = {
  made: () => true,
  seen: (item) => !item.deleted,
  snapshot: null,
};

export function atSnapshot(snapshot: Y.Snapshot): At {
  return {
    made: (client, clock) => (snapshot.sv.get(client) ?? 0) > clock,
    seen: (item) =>
      (snapshot.sv.get(item.id.client) ?? 0) > item.id.clock && !Y.isDeleted(snapshot.ds, item.id),
    snapshot,
  };
}

/** Splits the items of a document where a moment falls within them. Within a transaction. */
export function split(transaction: Y.Transaction, at: At) {
  const snapshot = at.snapshot;
  if (!snapshot) return;
  const store = transaction.doc.store;
  for (const [client, clock] of snapshot.sv) {
    if (clock > 0 && clock < Y.getState(store, client))
      Y.getItemCleanStart(transaction, Y.createID(client, clock));
  }
  Y.iterateDeletedStructs(transaction, snapshot.ds as DeleteSet, () => {});
}

/** Splits the items of a document where ranges of items begin and end. Within a transaction. */
export function splitAt(
  transaction: Y.Transaction,
  ranges: Record<number, [number, number][]> | Map<number, [number, number][]>,
) {
  const store = transaction.doc.store;
  const entries = ranges instanceof Map ? [...ranges] : Object.entries(ranges);
  for (const [key, list] of entries) {
    const client = Number(key);
    const state = Y.getState(store, client);
    for (const [from, to] of list) {
      for (const clock of [from, to]) {
        if (clock > 0 && clock < state) Y.getItemCleanStart(transaction, Y.createID(client, clock));
      }
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyType = Y.AbstractType<any>;

/** The value of a key of a map (or the attribute of an element) at a moment, and the item it is in. */
export function entryAt(type: AnyType, key: string, at: At): Y.Item | null {
  let item = (type._map.get(key) as Y.Item | undefined) ?? null;
  while (item !== null && !at.made(item.id.client, item.id.clock)) item = item.left;
  return item !== null && at.seen(item) ? item : null;
}

export function valueAt(type: AnyType, key: string, at: At): unknown {
  const item = entryAt(type, key, at);
  if (!item) return undefined;
  const content = item.content.getContent();
  return content[content.length - 1];
}

/** The keys a map has ever had. */
export function keysOf(type: AnyType): string[] {
  return [...type._map.keys()];
}

/** The attributes of an element at a moment. */
export function attributesAt(element: AnyType, at: At): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of keysOf(element)) {
    const value = valueAt(element, key, at);
    if (value !== undefined && value !== null) out[key] = value;
  }
  return out;
}

/** The item a type is the content of: where it stands in its parent. */
export function itemOf(type: AnyType): Y.Item | null {
  return type._item;
}

/** The children of a type in the order they stand, those that are deleted among them. */
export function* children(type: AnyType): Generator<Y.Item> {
  for (let item = type._start; item !== null; item = item.right) yield item;
}

/** An id as a word: `client:clock`. */
export function idWord(id: Y.ID): string {
  return `${id.client}:${id.clock}`;
}

export function wordId(word: string): Y.ID | null {
  const m = /^(\d+):(\d+)$/.exec(word);
  return m ? Y.createID(Number(m[1]), Number(m[2])) : null;
}

/** The item of a document by its id, with the item it is split from where the id falls within one. */
export function findItem(doc: Y.Doc, id: Y.ID): Y.Item | null {
  if (Y.getState(doc.store, id.client) <= id.clock) return null;
  const structs = doc.store.clients.get(id.client);
  if (!structs) return null;
  const struct = structs[Y.findIndexSS(structs, id.clock)];
  return struct instanceof Y.Item ? struct : null;
}
