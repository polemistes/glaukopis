/**
 * The starting texts of new notes (`docs/plans/the-notebook.md`, stage 4):
 * the notebook's own, kept in its document under `starts`, by id, each a
 * map of its `name`, its `text` (lines, each a paragraph), the kind of
 * paragraph its lines are (`begins`: an id of the editor's catalogue, none
 * for text) and an `order` that sorts among them, made as the boxes are
 * ordered. Made, changed, reordered and deleted as everything else is,
 * undone with it. A note begun from one holds its lines, each a paragraph
 * of its kind, and an empty one where it has none.
 *
 * These are methods of `Notebook`, which takes them in (see there).
 */

import { generateKeyBetween, generateNKeysBetween } from 'fractional-indexing';
import * as Y from 'yjs';
import { fillBody } from '$lib/project/model/text';
import { str } from '$lib/project/model/origins';
import { newId } from '$lib/util/id';
import type { NewNote, Notebook } from './notebook.svelte';
import type { StartRecord } from './types';

/** The starting texts the document holds, in their order. */
export function startsOf(yStarts: Y.Map<Y.Map<unknown>>): StartRecord[] {
  const out: StartRecord[] = [];
  for (const [id, s] of yStarts) {
    if (!(s instanceof Y.Map)) continue;
    out.push({
      id,
      name: str(s.get('name')),
      text: str(s.get('text')),
      begins: str(s.get('begins')),
      order: str(s.get('order')),
    });
  }
  return out.sort((a, b) =>
    a.order === b.order ? (a.id < b.id ? -1 : 1) : a.order < b.order ? -1 : 1,
  );
}

/** The lines of a starting text as they are kept: line breaks of every system made one, spaces at the ends of lines gone. */
export function cleanStartText(text: string): string {
  return text
    .split(/\r?\n/)
    .map((l) => l.trimEnd())
    .join('\n')
    .replace(/^\n+|\n+$/g, '');
}

/** An order between two, or null where they are no keys to go between. */
function orderBetween(before: string | null, after: string | null): string | null {
  try {
    return generateKeyBetween(before, after);
  } catch {
    return null;
  }
}

/** A change to a starting text: what is given is set. */
export interface StartChange {
  name?: string;
  text?: string;
  begins?: string;
}

export const startChanges = {
  /** Makes a starting text, the last of them, and gives its id. */
  addStart(this: Notebook, made: StartChange = {}): string {
    const id = newId();
    const all = startsOf(this.yStarts);
    const last = all.length ? all[all.length - 1].order : null;
    this.transact(() => {
      const s = new Y.Map<unknown>();
      s.set('name', (made.name ?? '').trim());
      s.set('text', cleanStartText(made.text ?? ''));
      if (made.begins) s.set('begins', made.begins);
      s.set('order', orderBetween(last, null) ?? generateKeyBetween(null, null));
      this.yStarts.set(id, s);
    });
    return id;
  },

  /** Changes a starting text: what is given and differs is set; a kind of nothing makes its lines text. */
  changeStart(this: Notebook, id: string, change: StartChange) {
    const s = this.yStarts.get(id);
    if (!(s instanceof Y.Map)) return;
    const next: [string, string][] = [];
    if (change.name !== undefined) next.push(['name', change.name.trim()]);
    if (change.text !== undefined) next.push(['text', cleanStartText(change.text)]);
    if (change.begins !== undefined) next.push(['begins', change.begins]);
    const changed = next.filter(([key, value]) => str(s.get(key)) !== value);
    if (!changed.length) return;
    this.transact(() => {
      for (const [key, value] of changed) {
        if (key === 'begins' && !value) s.delete(key);
        else s.set(key, value);
      }
    });
  },

  /** Moves a starting text before another, or with none to the end. */
  moveStart(this: Notebook, id: string, before: string | null) {
    const s = this.yStarts.get(id);
    if (!(s instanceof Y.Map) || before === id) return;
    const rest = startsOf(this.yStarts).filter((x) => x.id !== id);
    const at = before === null ? rest.length : rest.findIndex((x) => x.id === before);
    if (at < 0) return;
    const order = orderBetween(rest[at - 1]?.order ?? null, rest[at]?.order ?? null);
    this.transact(() => {
      if (order !== null) {
        s.set('order', order);
        return;
      }
      // Two of one order: all are ordered anew, as they are to stand.
      const ids = [...rest.slice(0, at).map((x) => x.id), id, ...rest.slice(at).map((x) => x.id)];
      const orders = generateNKeysBetween(null, null, ids.length);
      ids.forEach((startId, i) => this.yStarts.get(startId)?.set('order', orders[i]));
    });
  },

  deleteStart(this: Notebook, id: string) {
    if (!this.yStarts.has(id)) return;
    this.transact(() => this.yStarts.delete(id));
  },

  /**
   * Makes a note that begins with a starting text, and gives its id; a
   * plain note, where the starting text is not there. One step with the
   * making of the note.
   */
  addNoteFrom(this: Notebook, start: string, options: NewNote = {}): string {
    const s = startsOf(this.yStarts).find((x) => x.id === start);
    return this.transact(() => {
      const id = this.addNote(options);
      const fragment = this.fragment(id);
      if (s && fragment && s.text.trim()) fillBody(fragment, s.text, s.begins);
      else if (s && fragment && s.begins) fillBody(fragment, '', s.begins);
      return id;
    });
  },
};
