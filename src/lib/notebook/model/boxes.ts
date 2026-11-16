/**
 * The boxes of the notebook (`docs/plans/the-notebook.md`, stage 2): a
 * note lies in one box. The document keeps them under `boxes`, by id, each
 * a map of its `name` and an `order` that sorts among them, made as the
 * project orders its kinds (`fractional-indexing`). The first box, where
 * everything lands, has the fixed id `first`: it is always there, whether
 * or not the document holds a record of it, stands first, cannot be
 * deleted, and is named by the interface until it is given a name. A note
 * keeps its box under `box`, and none for the first.
 *
 * One box receives what is made outside the notebook's page (a note
 * written in a window of its own, what the plugin for Firefox hands over,
 * what is sent from a file read in Glaukopis): the one that has `receives`,
 * and the first where none has.
 *
 * These are methods of `Notebook`, which takes them in (see there).
 */

import { generateKeyBetween, generateNKeysBetween } from 'fractional-indexing';
import * as Y from 'yjs';
import { str } from '$lib/project/model/origins';
import { newId } from '$lib/util/id';
import type { Notebook } from './notebook.svelte';
import type { BoxRecord, NoteRecord } from './types';

/** The id of the first box. */
export const FIRST_BOX = 'first';

/** A box's name as it is kept: spaces within made one, trimmed. */
export function cleanBoxName(name: string): string {
  return name.replace(/\s+/g, ' ').trim();
}

/** The boxes the document holds: the first, then the rest in their order. */
export function boxesOf(yBoxes: Y.Map<Y.Map<unknown>>): BoxRecord[] {
  const first = yBoxes.get(FIRST_BOX);
  const rest: BoxRecord[] = [];
  for (const [id, b] of yBoxes) {
    if (id === FIRST_BOX || !(b instanceof Y.Map)) continue;
    rest.push({ id, name: str(b.get('name')), order: str(b.get('order')) });
  }
  rest.sort((a, b) => (a.order === b.order ? (a.id < b.id ? -1 : 1) : a.order < b.order ? -1 : 1));
  return [
    {
      id: FIRST_BOX,
      name: first instanceof Y.Map ? str(first.get('name')) : '',
      order: '',
    },
    ...rest,
  ];
}

/**
 * The box that receives what is made outside the notebook's page: the one
 * marked so, the first of them in their order where there are two (marked
 * at once in two windows), else the first box.
 */
export function receivingOf(
  yBoxes: Y.Map<Y.Map<unknown>>,
  boxes: readonly BoxRecord[] = boxesOf(yBoxes),
): string {
  return (
    boxes.find((b) => b.id !== FIRST_BOX && yBoxes.get(b.id)?.get('receives') === true)?.id ??
    FIRST_BOX
  );
}

/** An order between two, or null where they are no keys to go between (two boxes of one order, made at once in two windows). */
function orderBetween(before: string | null, after: string | null): string | null {
  try {
    return generateKeyBetween(before, after);
  } catch {
    return null;
  }
}

export const boxChanges = {
  /** Makes a box, the last of them, and gives its id. */
  addBox(this: Notebook, name: string): string {
    const id = newId();
    // Read from the document, which a change not yet ended has changed already.
    const all = boxesOf(this.yBoxes);
    const last = all.length > 1 ? all[all.length - 1].order : null;
    this.transact(() => {
      const b = new Y.Map<unknown>();
      const given = cleanBoxName(name);
      if (given) b.set('name', given);
      b.set('order', orderBetween(last, null) ?? generateKeyBetween(null, null));
      this.yBoxes.set(id, b);
    });
    return id;
  },

  /**
   * Names a box. The first given nothing has no name again, and is named by
   * the interface; another given nothing keeps the name it has.
   */
  renameBox(this: Notebook, id: string, name: string) {
    const given = cleanBoxName(name);
    const b = this.yBoxes.get(id);
    if (id === FIRST_BOX) {
      if (given === str(b?.get('name'))) return;
      this.transact(() => {
        if (b instanceof Y.Map) {
          if (given) b.set('name', given);
          else b.delete('name');
        } else {
          const made = new Y.Map<unknown>();
          made.set('name', given);
          this.yBoxes.set(FIRST_BOX, made);
        }
      });
      return;
    }
    if (!(b instanceof Y.Map) || !given || given === str(b.get('name'))) return;
    this.transact(() => b.set('name', given));
  },

  /** Moves a box before another, or with none to the end. The first stays first: before it is the first after it. */
  moveBox(this: Notebook, id: string, before: string | null) {
    const b = this.yBoxes.get(id);
    if (id === FIRST_BOX || !(b instanceof Y.Map) || before === id) return;
    const rest = boxesOf(this.yBoxes)
      .slice(1)
      .filter((x) => x.id !== id);
    const at =
      before === null
        ? rest.length
        : before === FIRST_BOX
          ? 0
          : rest.findIndex((x) => x.id === before);
    if (at < 0) return;
    const order = orderBetween(rest[at - 1]?.order ?? null, rest[at]?.order ?? null);
    this.transact(() => {
      if (order !== null) {
        b.set('order', order);
        return;
      }
      // Two of one order: all are ordered anew, as they are to stand.
      const ids = [...rest.slice(0, at).map((x) => x.id), id, ...rest.slice(at).map((x) => x.id)];
      const orders = generateNKeysBetween(null, null, ids.length);
      ids.forEach((boxId, i) => this.yBoxes.get(boxId)?.set('order', orders[i]));
    });
  },

  /** Deletes a box, not the first: its notes go to the first, and are not put anywhere there. */
  deleteBox(this: Notebook, id: string) {
    if (id === FIRST_BOX || !this.yBoxes.has(id)) return;
    this.transact(() => {
      for (const n of this.yNotes.values())
        if (n.get('box') === id) {
          n.delete('box');
          n.delete('at');
        }
      this.yBoxes.delete(id);
    });
  },

  /**
   * Makes a box the one that receives what is made outside the notebook's
   * page. The first receives while no other is made so: given the first,
   * the mark is taken from the others.
   */
  receiveIn(this: Notebook, id: string) {
    if (id !== FIRST_BOX && !this.yBoxes.has(id)) return;
    if (receivingOf(this.yBoxes) === id) return;
    this.transact(() => {
      for (const [other, b] of this.yBoxes)
        if (other !== id && b instanceof Y.Map && b.has('receives')) b.delete('receives');
      if (id !== FIRST_BOX) this.yBoxes.get(id)?.set('receives', true);
    });
  },

  /** The notes of a box, the newest first. */
  notesIn(this: Notebook, box: string): NoteRecord[] {
    return this.list.filter((n) => n.box === box);
  },

  /** Moves notes to a box: one that was in another is not put anywhere in this one. */
  moveToBox(this: Notebook, ids: string[], box: string) {
    if (box !== FIRST_BOX && !this.yBoxes.has(box)) return;
    const moving = ids.filter((id) => {
      const record = this.notes.get(id);
      return record && record.box !== box;
    });
    if (!moving.length) return;
    this.transact(() => {
      for (const id of moving) {
        const n = this.yNotes.get(id);
        if (!n) continue;
        if (box === FIRST_BOX) n.delete('box');
        else n.set('box', box);
        n.delete('at');
      }
    });
  },
};
