/**
 * The engine of the history (ADR 0021): the history of a project played into
 * a document that keeps what was deleted, and what it answers. It runs in a
 * worker (`engine.worker.ts`), so that the window never stands still; the
 * tests use it as it is.
 *
 * Each record of the history is applied in transactions of its own, and what
 * they did is noted: what was made (for each copy, the clocks from and to)
 * and what was deleted. The moment after a record is then the state vector of
 * all that was made up to it and all that was deleted: a snapshot of Yjs,
 * which every copy of the project understands alike.
 *
 * What the engine answers that would change the project it answers as edits
 * (`Edit`): what a block of text is to be made, as ProseMirror's JSON, which
 * the window makes it in the document that is worked in.
 */

import * as Y from 'yjs';
import {
  atSnapshot,
  attributesAt,
  findItem,
  idWord,
  NOW,
  split,
  splitAt,
  type At,
} from './moments';
import { addItems, has, readMap, readPieces, units, type Unit, type Who } from './reading';
import type { HistoryRecord, RecordKind } from './records';
import type {
  Accepted,
  Items,
  MapChanges,
  Moment,
  Named,
  Passage,
  Person,
  Piece,
  Place,
  Reference,
  Session,
  Version,
} from './types';

type DeleteSet = ReturnType<typeof Y.createDeleteSet>;

/** What applying some changes did. */
interface Effect {
  /** For each copy, the clocks of what was made: from, and to. */
  made: Map<number, [number, number]>;
  deleted: DeleteSet[];
}

/** A record of the history, with what it did. */
export interface Kept {
  kind: RecordKind;
  here: boolean;
  time: number;
  until: number;
  made: Map<number, [number, number]>;
  deleted: DeleteSet;
  added: number;
  removed: number;
  /** Where it is in the store on disk; nothing for what was written while it was looked at. */
  stored: boolean;
}

/** ProseMirror's JSON of a node. */
export interface NodeJSON {
  type: string;
  attrs?: Record<string, unknown>;
  content?: NodeJSON[];
  text?: string;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
}

/**
 * What is to be done to the document that is worked in. A block is known by
 * its item (`client:clock`), and made what `node` says. A block that is gone
 * is made anew where it stood: in its container (a block, or the name or
 * text of an element), before what stood after it.
 */
export type Edit =
  | { kind: 'block'; block: string; part: 'title' | 'body'; node: NodeJSON }
  | {
      kind: 'insert';
      part: 'title' | 'body';
      container: { block: string } | { element: string };
      /** The item of the block that is gone, which still stands in the list where it stood. */
      at: string;
      node: NodeJSON;
    };

/** A session is a person's until they pause this long, in milliseconds. */
export const PAUSE = 10 * 60 * 1000;

const OVERRIDE_NONE = new Map();

export class Engine {
  readonly doc = new Y.Doc({ gc: false });
  readonly records: Kept[] = [];
  readonly #users: Y.Map<Y.Map<unknown>>;
  readonly #pud: Y.PermanentUserData;
  /** The person who works here. */
  me: string | null = null;
  #capture: Effect | null = null;
  /** Changes followed as they were made, until the batch they are in is written. */
  #following: { effect: Effect; here: boolean }[] = [];
  /** Snapshots of moments, by the record they follow, once they have been made. */
  #snapshots = new Map<number, Y.Snapshot>();

  constructor() {
    this.#users = this.doc.getMap('users');
    this.#pud = new Y.PermanentUserData(this.doc, this.#users);
    this.doc.on('afterTransaction', (transaction: Y.Transaction) => {
      // Yjs tidies the formatting of text that came from elsewhere by
      // deleting what it finds twice, as changes of this document's own.
      // Here nothing is to be changed that was not changed in the project.
      (transaction as unknown as { _needFormattingCleanup: boolean })._needFormattingCleanup =
        false;
      const effect = this.#capture;
      if (!effect) return;
      for (const [client, clock] of transaction.afterState) {
        const before = transaction.beforeState.get(client) ?? 0;
        if (clock <= before) continue;
        const range = effect.made.get(client);
        if (range) range[1] = Math.max(range[1], clock);
        else effect.made.set(client, [before, clock]);
      }
      if (transaction.deleteSet.clients.size) effect.deleted.push(transaction.deleteSet);
    });
  }

  #apply(update: Uint8Array): Effect {
    const effect: Effect = { made: new Map(), deleted: [] };
    this.#capture = effect;
    try {
      Y.applyUpdate(this.doc, update);
    } catch (error) {
      console.error('a change of the history could not be applied', error);
    } finally {
      this.#capture = null;
    }
    return effect;
  }

  #keep(effects: Effect[], record: Omit<Kept, 'made' | 'deleted' | 'added' | 'removed'>) {
    const made = new Map<number, [number, number]>();
    const deleted: DeleteSet[] = [];
    for (const e of effects) {
      for (const [client, [from, to]] of e.made) {
        const range = made.get(client);
        if (range) {
          range[0] = Math.min(range[0], from);
          range[1] = Math.max(range[1], to);
        } else made.set(client, [from, to]);
      }
      deleted.push(...e.deleted);
    }
    const ds = deleted.length === 1 ? deleted[0] : Y.mergeDeleteSets(deleted);
    const kept: Kept = { ...record, made, deleted: ds, added: 0, removed: 0 };
    kept.added = this.#signsMade(made);
    kept.removed = this.#signsDeleted(ds);
    this.records.push(kept);
    return kept;
  }

  /** Reads the history as it is on disk. */
  load(records: HistoryRecord[]) {
    for (const r of records) {
      const effect = this.#apply(r.update);
      this.#keep([effect], {
        kind: r.kind,
        here: r.here,
        time: r.time,
        until: r.until,
        stored: true,
      });
    }
  }

  /** A change made in the project since it was read, as it is made. */
  change(update: Uint8Array, here: boolean) {
    this.#following.push({ effect: this.#apply(update), here });
    this.#snapshots.clear();
  }

  /** A batch of the changes followed has been written: it is a record of the history. */
  written(time: number, here: boolean, changes: number) {
    const taken = this.#following.splice(0, changes).map((f) => f.effect);
    // Changes that were read with the history already did nothing again.
    if (taken.every((e) => !e.made.size && !e.deleted.length)) return;
    this.#keep(taken, { kind: 'change', here, time, until: time, stored: false });
  }

  // =====================================================================
  // Who is who
  // =====================================================================

  readonly who: Who = {
    maker: (client) => this.#pud.getUserByClientId(client) ?? null,
    deleter: (id) => this.#pud.getUserByDeletedId(id) ?? null,
  };

  people(): Person[] {
    const out: Person[] = [];
    for (const [id, user] of this.#users) {
      const name = user instanceof Y.Map ? user.get('name') : null;
      out.push({ id, name: typeof name === 'string' ? name : '' });
    }
    return out;
  }

  /** Whose a record is: this person's, where it was made here; otherwise, who made most of it, or deleted in it. */
  personOf(record: Kept): string | null {
    if (record.here && this.me && record.kind === 'change') return this.me;
    let most = 0;
    let person: string | null = null;
    for (const [client, [from, to]] of record.made) {
      const who = this.who.maker(client);
      if (who && to - from > most) {
        most = to - from;
        person = who;
      }
    }
    if (person) return person;
    for (const [client, list] of record.deleted.clients) {
      const first = list[0];
      if (first) return this.who.deleter(Y.createID(client, first.clock));
    }
    return record.here ? this.me : null;
  }

  // =====================================================================
  // Moments
  // =====================================================================

  /** The snapshot of the moment after a record. */
  snapshot(record: number): Y.Snapshot {
    const index = Math.max(0, Math.min(record, this.records.length - 1));
    const known = this.#snapshots.get(index);
    if (known) return known;
    const sv = new Map<number, number>();
    const deleted: DeleteSet[] = [];
    for (let i = 0; i <= index; i++) {
      const r = this.records[i];
      for (const [client, [, to]] of r.made) sv.set(client, Math.max(sv.get(client) ?? 0, to));
      if (r.deleted.clients.size) deleted.push(r.deleted);
    }
    const snapshot = Y.createSnapshot(Y.mergeDeleteSets(deleted), sv);
    this.#snapshots.set(index, snapshot);
    return snapshot;
  }

  moment(record: number): Moment {
    const r = this.records[Math.max(0, Math.min(record, this.records.length - 1))];
    return { snapshot: Y.encodeSnapshot(this.snapshot(record)), time: r?.until ?? Date.now() };
  }

  now(): Moment {
    return { snapshot: Y.encodeSnapshot(Y.snapshot(this.doc)), time: Date.now() };
  }

  begins(): Moment {
    return this.moment(0);
  }

  sessions(): Session[] {
    const out: Session[] = [];
    this.records.forEach((r, i) => {
      if (r.kind !== 'start' && !r.made.size && !r.deleted.clients.size) return;
      const person = r.kind === 'start' ? null : this.personOf(r);
      const last = out[out.length - 1];
      if (
        last &&
        r.kind !== 'start' &&
        this.records[last.first].kind !== 'start' &&
        last.person === person &&
        r.time - last.until < PAUSE
      ) {
        last.last = i;
        last.until = r.until;
        last.added += r.added;
        last.removed += r.removed;
        last.merged ||= r.kind === 'merged';
        return;
      }
      out.push({
        first: i,
        last: i,
        person,
        time: r.time,
        until: r.until,
        added: r.added,
        removed: r.removed,
        merged: r.kind === 'merged',
      });
    });
    return out;
  }

  named(): Named[] {
    const out: Named[] = [];
    for (const [id, value] of this.doc.getMap('moments')) {
      const v = value as { name?: unknown; time?: unknown; by?: unknown; snapshot?: unknown };
      if (!(v.snapshot instanceof Uint8Array) || typeof v.name !== 'string') continue;
      out.push({
        id,
        name: v.name,
        moment: { snapshot: v.snapshot, time: typeof v.time === 'number' ? v.time : 0 },
        by: typeof v.by === 'string' ? v.by : null,
      });
    }
    return out.sort((a, b) => a.moment.time - b.moment.time);
  }

  // =====================================================================
  // Comparing
  // =====================================================================

  /** What was accepted, by the block it is in, as positions among its units. */
  #overrides(accepted: Accepted[], transaction: Y.Transaction) {
    const out = new Map<string, { from: number; to: number; visible: Items }[]>();
    for (const a of accepted) splitAt(transaction, a.visible);
    for (const a of accepted) {
      const from = this.#position(a.from, transaction);
      const to = this.#position(a.to, transaction);
      if (!from || !to || from.block !== to.block) continue;
      const list = out.get(idWord(from.block._item!.id)) ?? [];
      list.push({ from: from.index, to: to.index, visible: a.visible });
      out.set(idWord(from.block._item!.id), list);
    }
    return out;
  }

  /**
   * A relative position as a block and a place among its units: before the
   * unit that has the index.
   */
  #position(
    encoded: Uint8Array,
    transaction: Y.Transaction,
  ): { block: Y.XmlElement; index: number; units: Unit[] } | null {
    const rpos = Y.decodeRelativePosition(encoded);
    let type: Y.AbstractType<unknown> | null = null;
    let target: Y.Item | null = null;
    if (rpos.item) {
      const { client, clock } = rpos.item;
      if (Y.getState(this.doc.store, client) <= clock) return null;
      // Split so that the item begins where the position is (and ends there, of one after it).
      Y.getItemCleanStart(transaction, Y.createID(client, clock));
      if (rpos.assoc < 0 && clock + 1 < Y.getState(this.doc.store, client))
        Y.getItemCleanStart(transaction, Y.createID(client, clock + 1));
      target = findItem(this.doc, rpos.item);
      type = (target?.parent as Y.AbstractType<unknown>) ?? null;
    } else if (rpos.type) {
      const item = findItem(this.doc, rpos.type);
      type = item?.content instanceof Y.ContentType ? item.content.type : null;
    }
    if (!type) return null;
    const block = (type instanceof Y.XmlText ? type.parent : type) as Y.XmlElement | null;
    if (!(block instanceof Y.XmlElement)) return null;
    const list = units(block);
    let index: number;
    if (target) {
      const at = list.findIndex((u) => u.item === target);
      if (at < 0) return null;
      index = at + (rpos.assoc < 0 ? 1 : 0);
    } else if (type instanceof Y.XmlText) {
      const own = list.map((u, i) => [u, i] as const).filter(([u]) => u.text === type);
      if (rpos.assoc >= 0) index = own.length ? own[own.length - 1][1] + 1 : 0;
      else index = own.length ? own[0][1] : 0;
    } else index = rpos.assoc >= 0 ? list.length : 0;
    return { block, index, units: list };
  }

  compare(map: string, reference: Reference, elements?: string[]): MapChanges {
    const before = atSnapshot(Y.decodeSnapshot(reference.moment));
    let result!: MapChanges;
    this.doc.transact((transaction) => {
      split(transaction, before);
      const overrides = this.#overrides(reference.accepted, transaction);
      const reading = readMap(this.doc, map, before, NOW, this.who, {
        elements: elements ? new Set(elements) : undefined,
        overrides,
      });
      result = {
        map,
        passages: reading.passages,
        objects: reading.objects,
        elements: reading.elements,
      };
    });
    return result;
  }

  /** The whole map at one moment, compared with another: for looking at the history. */
  mapAt(map: string, record: number, since: number | null) {
    const after = atSnapshot(this.snapshot(record));
    const before = since === null ? after : atSnapshot(this.snapshot(since));
    let result!: ReturnType<typeof readMap>;
    this.doc.transact((transaction) => {
      split(transaction, after);
      split(transaction, before);
      result = readMap(this.doc, map, before, after, this.who, { overrides: OVERRIDE_NONE });
    });
    return result;
  }

  versions(place: Place, from: Uint8Array, to: Uint8Array, reference: Reference): Version[] {
    const out: Version[] = [];
    this.doc.transact((transaction) => {
      const refAt = atSnapshot(Y.decodeSnapshot(reference.moment));
      split(transaction, refAt);
      const start = this.#position(from, transaction);
      const end = this.#position(to, transaction);
      if (!start || !end || start.block !== end.block) return;
      const block = start.block;
      const overrides = this.#overrides(reference.accepted, transaction).get(
        idWord(block._item!.id),
      );
      // The records that made or deleted something in the stretch, after the reference.
      const touched: number[] = [];
      const span = units(block).slice(start.index, end.index);
      this.records.forEach((r, i) => {
        const hit = span.some((u) => {
          const { client, clock } = u.item.id;
          const made = r.made.get(client);
          if (
            made &&
            clock + u.item.length > made[0] &&
            clock < made[1] &&
            !refAt.made(client, clock)
          )
            return true;
          return Y.isDeleted(r.deleted, u.item.id) && refAt.seen(u.item);
        });
        if (hit) touched.push(i);
      });
      for (const i of touched) split(transaction, atSnapshot(this.snapshot(i)));
      const range = (list: Unit[]) => {
        // The stretch among the units as they are after splitting.
        const first = list.findIndex((u) => u.item === start.units[start.index]?.item);
        const last =
          end.index > 0 ? list.findIndex((u) => u.item === end.units[end.index - 1]?.item) : -1;
        return [first < 0 ? 0 : first, last < 0 ? list.length : last + 1] as [number, number];
      };
      const piecesOf = (before: At, after: At, first: boolean) => {
        const list = units(block);
        const [a, b] = range(list);
        return readPieces(
          block,
          before,
          after,
          this.who,
          first ? (overrides ?? []) : [],
          undefined,
          [a, b],
        );
      };
      out.push({
        moment: { snapshot: reference.moment, time: 0 },
        by: [],
        pieces: piecesOf(refAt, refAt, true).map((p) => ({ ...p, status: 'same' as const })),
      });
      let previous: At = refAt;
      let first = true;
      const push = (at: At, moment: Moment) => {
        const pieces = piecesOf(previous, at, first);
        if (!pieces.some((p) => p.status !== 'same' || p.marksBefore || p.objectBefore)) return;
        const by = new Set<string>();
        for (const p of pieces) {
          if (p.by) by.add(p.by);
          if (p.marksBy) by.add(p.marksBy);
        }
        out.push({ moment, by: [...by], pieces });
        previous = at;
        first = false;
      };
      for (const i of touched) push(atSnapshot(this.snapshot(i)), this.moment(i));
      push(NOW, this.now());
    });
    return out;
  }

  // =====================================================================
  // Changing: worked out here, done in the window
  // =====================================================================

  /** Takes back pieces of a passage: what was added goes, what was removed comes back. */
  revert(passage: Passage, pieces: Piece[]): Edit[] {
    const given: { items: Items; piece: Piece }[] = pieces.map((piece) => {
      const items: Items = {};
      for (const [client, clock, length] of piece.runs) addItems(items, client, clock, length);
      return { items, piece };
    });
    let edits: Edit[] = [];
    this.doc.transact((transaction) => {
      for (const g of given) splitAt(transaction, g.items);
      const block = this.#block(passage.block);
      if (!block) return;
      const choose = (unit: Unit): Choice | null => {
        const g = given.find((x) => has(x.items, unit.item.id));
        const now = !unit.item.deleted;
        if (!g) return now ? { at: NOW } : null;
        const p = g.piece;
        if (p.status === 'added') return null;
        if (p.status === 'removed')
          return { at: this.#justBefore(unit.item), marks: p.marks, attrs: p.object?.attrs };
        return { at: NOW, marks: p.marksBefore ?? p.marks, attrs: p.objectBefore?.attrs };
      };
      edits = this.#edit(block, passage, choose);
    });
    return edits;
  }

  /** Makes a stretch as it was at a moment. */
  restore(place: Place, from: Uint8Array, to: Uint8Array, moment: Uint8Array): Edit[] {
    let edits: Edit[] = [];
    this.doc.transact((transaction) => {
      const then = atSnapshot(Y.decodeSnapshot(moment));
      split(transaction, then);
      const start = this.#position(from, transaction);
      const end = this.#position(to, transaction);
      if (!start || !end || start.block !== end.block) return;
      const inside = new Set(
        units(start.block)
          .slice(start.index, end.index)
          .map((u) => u.item),
      );
      const choose = (unit: Unit): Choice | null => {
        if (inside.has(unit.item)) return then.seen(unit.item) ? { at: then } : null;
        return unit.item.deleted ? null : { at: NOW };
      };
      const passage = { place, block: idWord(start.block._item!.id), after: true } as Passage;
      edits = this.#edit(start.block, passage, choose);
    });
    return edits;
  }

  /** The moment just before an item was deleted: that before the record that deleted it. */
  #justBefore(item: Y.Item): At {
    const index = this.records.findIndex((r) => Y.isDeleted(r.deleted, item.id));
    return index > 0 ? atSnapshot(this.snapshot(index - 1)) : index === 0 ? NOW : NOW;
  }

  #block(word: string): Y.XmlElement | null {
    const m = /^(\d+):(\d+)$/.exec(word);
    if (!m) return null;
    const item = findItem(this.doc, Y.createID(Number(m[1]), Number(m[2])));
    return item?.content instanceof Y.ContentType && item.content.type instanceof Y.XmlElement
      ? item.content.type
      : null;
  }

  #edit(block: Y.XmlElement, passage: Passage, choose: (unit: Unit) => Choice | null): Edit[] {
    const part = partOf(block);
    const node = blockJSON(block, choose, NOW);
    const item = block._item!;
    if (!item.deleted) return [{ kind: 'block', block: idWord(item.id), part, node }];
    // A block that is gone is made anew where it stood, in what holds it.
    const parent = block.parent;
    if (parent instanceof Y.XmlElement && parent._item) {
      return [
        {
          kind: 'insert',
          part,
          container: { block: idWord(parent._item.id) },
          at: idWord(item.id),
          node,
        },
      ];
    }
    return [
      {
        kind: 'insert',
        part,
        container: { element: passage.place?.element ?? '' },
        at: idWord(item.id),
        node,
      },
    ];
  }

  // =====================================================================
  // Sizes
  // =====================================================================

  #signsMade(made: Map<number, [number, number]>): number {
    let n = 0;
    for (const [client, [from, to]] of made) n += this.#signs(client, from, to);
    return n;
  }

  #signsDeleted(ds: DeleteSet): number {
    let n = 0;
    for (const [client, list] of ds.clients)
      for (const d of list) n += this.#signs(client, d.clock, d.clock + d.len);
    return n;
  }

  /** The signs of text among the items a copy made between two clocks. */
  #signs(client: number, from: number, to: number): number {
    const structs = this.doc.store.clients.get(client);
    if (!structs || from >= to) return 0;
    let n = 0;
    for (
      let i = Y.findIndexSS(structs, Math.min(from, Y.getState(this.doc.store, client) - 1));
      i < structs.length;
      i++
    ) {
      const s = structs[i];
      if (s.id.clock >= to) break;
      if (s instanceof Y.Item && s.content instanceof Y.ContentString)
        n += Math.min(to, s.id.clock + s.length) - Math.max(from, s.id.clock);
    }
    return n;
  }
}

/** How a unit is to stand in what a block is made: as it is at a moment, with marks or attributes as given. */
export interface Choice {
  at: At;
  marks?: Record<string, unknown>;
  attrs?: Record<string, unknown>;
}

function partOf(block: Y.XmlElement): 'title' | 'body' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let type: Y.AbstractType<any> | null = block;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  while (type && !(type.parent instanceof Y.Map)) type = type.parent as Y.AbstractType<any> | null;
  if (!type || !(type.parent instanceof Y.Map)) return 'body';
  const parent = type.parent as Y.Map<unknown>;
  for (const [key, value] of parent) if (value === type) return key === 'title' ? 'title' : 'body';
  return type._item?.parentSub === 'title' ? 'title' : 'body';
}

function marksJSON(marks: Record<string, unknown>): NodeJSON['marks'] {
  const out: NonNullable<NodeJSON['marks']> = [];
  for (const [type, value] of Object.entries(marks)) {
    if (value === true) out.push({ type });
    else if (value && typeof value === 'object')
      out.push({ type, attrs: value as Record<string, unknown> });
  }
  return out.length ? out : undefined;
}

function marksFrom(attributes: Map<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of attributes) {
    if (value === null || value === undefined || value === false) continue;
    const name = /^(.*)--[a-zA-Z0-9+/=]{8}$/.exec(key)?.[1] ?? key;
    out[name] =
      typeof value === 'object' && value !== null && Object.keys(value).length ? value : true;
  }
  return out;
}

/**
 * A block as ProseMirror's JSON, of its units as they are chosen: each as it
 * is at a moment, or not at all. The block keeps its attributes as they are
 * at `own`.
 */
export function blockJSON(
  block: Y.XmlElement,
  choose: (unit: Unit) => Choice | null,
  own: At,
): NodeJSON {
  const list = units(block);
  const choices = list.map((u) => (u.kind === 'format' ? null : choose(u)));
  const moments = new Set<At>(choices.filter((c): c is Choice => !!c).map((c) => c.at));
  const attrs = new Map<At, Map<string, unknown>>();
  let text: Y.XmlText | null = null;
  const content: NodeJSON[] = [];
  list.forEach((unit, i) => {
    if (unit.text !== text) {
      text = unit.text;
      for (const at of moments) attrs.set(at, new Map());
    }
    if (unit.kind === 'format') {
      const format = unit.item.content as Y.ContentFormat;
      for (const at of moments)
        if (at.seen(unit.item)) attrs.get(at)!.set(format.key, format.value);
      return;
    }
    const choice = choices[i];
    if (!choice) return;
    if (unit.kind === 'text') {
      const marks = choice.marks ?? marksFrom(attrs.get(choice.at) ?? new Map());
      const str = (unit.item.content as Y.ContentString).str;
      const last = content[content.length - 1];
      const m = marksJSON(marks);
      if (last && last.type === 'text' && JSON.stringify(last.marks) === JSON.stringify(m))
        last.text += str;
      else content.push({ type: 'text', text: str, ...(m ? { marks: m } : {}) });
      return;
    }
    const content_ = unit.item.content;
    if (!(content_ instanceof Y.ContentType) || !(content_.type instanceof Y.XmlElement)) return;
    const element = content_.type;
    const a = choice.attrs ?? attributesAt(element, choice.at);
    const node: NodeJSON = { type: element.nodeName, attrs: a };
    if (element.nodeName === 'footnote') {
      const inner = blockJSON(
        element,
        (u) => (choice.at.seen(u.item) ? { at: choice.at } : null),
        choice.at,
      );
      if (inner.content?.length) node.content = inner.content;
    }
    content.push(node);
  });
  return {
    type: block.nodeName,
    attrs: attributesAt(block, own),
    ...(content.length ? { content } : {}),
  };
}
