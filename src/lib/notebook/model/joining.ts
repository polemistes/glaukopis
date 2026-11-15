/**
 * Join (`docs/plans/the-notebook.md`, stage 2): notes become one, the first
 * of them, and nothing of the others is lost. Their texts follow its own as
 * they are, cloned part by part, so that their kinds, marks, figures and
 * files stay, and with them their sources, which go by passage and by hash;
 * it has the tags of all, every link of the others, and what became of
 * them. A method of `Notebook`, which takes it in (see there).
 */

import * as Y from 'yjs';
import { str } from '$lib/project/model/origins';
import type { Notebook } from './notebook.svelte';
import { holdsNothing } from './pieces';
import { tagSetOf, tagsIn } from './tags';

export const joinChanges = {
  /**
   * Joins notes into the first of them, in the order given: the texts of
   * the others after its own, in order; the tags of all; every link of the
   * others its own from then (one that would join it to itself, or double
   * another, goes, and of two that would be one the first is kept, the
   * links of the first note before those of the others, in the order
   * given); what became of the others added to its own. It keeps its box,
   * its place and its width, and its name, or takes the first name among
   * the others where it has none. The others are gone. One step of undo.
   * Gives the id of the note that stands; none where fewer than two notes
   * that are there are given.
   */
  join(this: Notebook, ids: string[]): string | null {
    const notes = [...new Set(ids)].filter((id) => this.yNotes.get(id) instanceof Y.Map);
    if (notes.length < 2) return null;
    const [first, ...others] = notes;
    const keep = this.yNotes.get(first)!;
    this.checkpoint();
    this.transact(() => {
      // The texts.
      let into = this.fragment(first);
      if (!into) {
        into = new Y.XmlFragment();
        keep.set('body', into);
      }
      const parts = others.flatMap((id) => {
        const text = this.fragment(id);
        if (!text || holdsNothing(text)) return [];
        return text.toArray().map((c) => (c as Y.XmlElement | Y.XmlText).clone());
      });
      if (parts.length) {
        if (holdsNothing(into)) into.delete(0, into.length);
        into.insert(into.length, parts);
      }

      // The tags.
      const tags = others.flatMap((id) => tagsIn(this.yNotes.get(id)!));
      if (tags.length) {
        const set = tagSetOf(keep);
        for (const tag of tags) if (!set.has(tag)) set.set(tag, true);
      }

      // The links: those of the first, then those of each of the others.
      const joined = new Set(notes);
      const pairs = new Set<string>();
      const done = new Set<string>();
      const links = [...this.yLinks].sort(([a], [b]) => (a < b ? -1 : 1));
      for (const id of notes)
        for (const [linkId, l] of links) {
          if (done.has(linkId) || !(l instanceof Y.Map)) continue;
          const from = str(l.get('from'));
          const to = str(l.get('to'));
          if (from !== id && to !== id) continue;
          done.add(linkId);
          const ends = [joined.has(from) ? first : from, joined.has(to) ? first : to];
          const pair = [...ends].sort().join('\n');
          if (ends[0] === ends[1] || pairs.has(pair)) {
            this.yLinks.delete(linkId);
            continue;
          }
          pairs.add(pair);
          if (ends[0] !== from) l.set('from', ends[0]);
          if (ends[1] !== to) l.set('to', ends[1]);
        }

      // What became of the others.
      const went = others.flatMap((id) => {
        const list = this.yNotes.get(id)!.get('went');
        return list instanceof Y.Array ? (list.toArray() as unknown[]) : [];
      });
      if (went.length) {
        let list = keep.get('went');
        if (!(list instanceof Y.Array)) {
          list = new Y.Array<unknown>();
          keep.set('went', list);
        }
        (list as Y.Array<unknown>).push(went);
      }

      // The name.
      if (!str(keep.get('name'))) {
        const name = others.map((id) => str(this.yNotes.get(id)!.get('name'))).find(Boolean);
        if (name) keep.set('name', name);
      }

      for (const id of others) this.yNotes.delete(id);
    });
    this.checkpoint();
    return first;
  },
};
