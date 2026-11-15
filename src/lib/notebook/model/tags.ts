/**
 * The tags of notes (`docs/plans/the-notebook.md`, stage 2): words a note
 * has any number of, kept on it as a `Y.Map` used as a set (the tag to
 * `true`). Tags are compared as they are written: `Homer` and `homer` are
 * two. These are methods of `Notebook`, which takes them in (see there);
 * the list of all tags with how many notes have each is kept there, as
 * notes are read.
 */

import * as Y from 'yjs';
import type { Notebook } from './notebook.svelte';

/** How many signs a tag has at most. */
export const MAX_TAG_LENGTH = 60;

/** A tag as it is kept: trimmed, spaces within made one, a leading `#` taken away, at most 60 signs. `''` is no tag. */
export function cleanTag(tag: string): string {
  const words = tag.replace(/\s+/g, ' ').trim().replace(/^#/, '').trim();
  return [...words].slice(0, MAX_TAG_LENGTH).join('').trim();
}

const collator = new Intl.Collator(undefined, { sensitivity: 'base', numeric: true });

/** Words in the order words are sorted; those the order holds equal, as `Homer` and `homer`, as they are written. */
export function compareWords(a: string, b: string): number {
  return collator.compare(a, b) || (a < b ? -1 : a > b ? 1 : 0);
}

/** The tags a note has, as its document holds them: none where it has no set of them. */
export function tagsIn(note: Y.Map<unknown>): string[] {
  const set = note.get('tags');
  if (!(set instanceof Y.Map)) return [];
  const out: string[] = [];
  for (const [tag, value] of set) if (value === true && tag) out.push(tag);
  return out.sort(compareWords);
}

/** The set of a note's tags, made where it has none. */
export function tagSetOf(note: Y.Map<unknown>): Y.Map<boolean> {
  const set = note.get('tags');
  if (set instanceof Y.Map) return set as Y.Map<boolean>;
  const made = new Y.Map<boolean>();
  note.set('tags', made);
  return made;
}

export const tagChanges = {
  /** Gives notes a tag; nothing where the tag is none. */
  addTag(this: Notebook, ids: string[], tag: string) {
    const clean = cleanTag(tag);
    if (!clean) return;
    const notes = ids.flatMap((id) => {
      const n = this.yNotes.get(id);
      return n && !this.notes.get(id)?.tags.includes(clean) ? [n] : [];
    });
    if (!notes.length) return;
    this.transact(() => {
      for (const n of notes) tagSetOf(n).set(clean, true);
    });
  },

  /** Takes a tag away from notes. */
  removeTag(this: Notebook, ids: string[], tag: string) {
    const sets = ids.flatMap((id) => {
      const set = this.yNotes.get(id)?.get('tags');
      return set instanceof Y.Map && set.has(tag) ? [set] : [];
    });
    if (!sets.length) return;
    this.transact(() => {
      for (const set of sets) set.delete(tag);
    });
  },

  /** Renames a tag on every note that has it; where a note has the new name already, the two are one. */
  renameTag(this: Notebook, from: string, to: string) {
    const clean = cleanTag(to);
    if (!clean || clean === from) return;
    const sets = [...this.yNotes.values()].flatMap((n) => {
      const set = n.get('tags');
      return set instanceof Y.Map && set.has(from) ? [set as Y.Map<boolean>] : [];
    });
    if (!sets.length) return;
    this.transact(() => {
      for (const set of sets) {
        set.delete(from);
        set.set(clean, true);
      }
    });
  },

  /** Takes a tag away from every note. */
  deleteTag(this: Notebook, tag: string) {
    this.removeTag([...this.yNotes.keys()], tag);
  },
};

/**
 * How many notes have each tag, kept up as notes are read, one note at a
 * time: what a note had is taken away and what it has now is added.
 */
export class TagCounts {
  #counts = new Map<string, number>();
  /** Whether the counts changed since the list was last made. */
  #changed = false;

  /** A note had `before` and has `after`. */
  change(before: readonly string[], after: readonly string[]) {
    if (before.length === after.length && before.every((t, i) => t === after[i])) return;
    for (const tag of before) {
      const left = (this.#counts.get(tag) ?? 0) - 1;
      if (left > 0) this.#counts.set(tag, left);
      else this.#counts.delete(tag);
    }
    for (const tag of after) this.#counts.set(tag, (this.#counts.get(tag) ?? 0) + 1);
    this.#changed = true;
  }

  clear() {
    this.#counts.clear();
    this.#changed = true;
  }

  /** The list of tags with their counts, sorted as words are; null where nothing changed since it was last asked for. */
  takeList(): { tag: string; count: number }[] | null {
    if (!this.#changed) return null;
    this.#changed = false;
    return [...this.#counts]
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => compareWords(a.tag, b.tag));
  }
}
