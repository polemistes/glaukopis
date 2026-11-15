/**
 * Links between notes (`docs/plans/the-notebook.md`, stage 2): the same
 * thing as an association of a project, kept under `links` as a project
 * keeps them (`project/model/changing/links.ts`), with `from`, `to`, its
 * words, arrow and colour. One for a pair of notes, whichever way it was
 * drawn; none from a note to itself. What changes a link once it is made is
 * the project's own, taken in as it is. These are methods of `Notebook`,
 * which takes them in (see there).
 */

import * as Y from 'yjs';
import { linkLookChanges, makeLink, readLink } from '$lib/project/model/changing/links';
import type { LinkRecord } from '$lib/project/model/types';
import type { Notebook } from './notebook.svelte';

/** The links the document holds between notes that are there, by their ids. */
export function linksOf(
  yLinks: Y.Map<Y.Map<unknown>>,
  yNotes: { has(id: string): boolean },
): LinkRecord[] {
  const list: LinkRecord[] = [];
  for (const [id, l] of yLinks) {
    if (!(l instanceof Y.Map)) continue;
    const link = readLink(id, l);
    if (link && yNotes.has(link.from) && yNotes.has(link.to)) list.push(link);
  }
  return list.sort((a, b) => (a.id < b.id ? -1 : 1));
}

/** The ids of the links of the document that end at one of the notes, read or not. */
export function linksTouching(yLinks: Y.Map<Y.Map<unknown>>, notes: Set<string>): string[] {
  const out: string[] = [];
  for (const [id, l] of yLinks) {
    if (!(l instanceof Y.Map)) continue;
    if (notes.has(l.get('from') as string) || notes.has(l.get('to') as string)) out.push(id);
  }
  return out.sort();
}

export const noteLinkChanges = {
  /** Links two notes. Gives the id of the link, or of the one that was there, whichever way it was drawn; none to itself or to a note that is not there. */
  addLink(this: Notebook, from: string, to: string): string | null {
    if (from === to || !this.yNotes.has(from) || !this.yNotes.has(to)) return null;
    const there = this.links.find(
      (l) => (l.from === from && l.to === to) || (l.from === to && l.to === from),
    );
    if (there) return there.id;
    return this.transact(() => makeLink(this, from, to));
  },

  /** The links of a note, either way. */
  linksAt(this: Notebook, note: string): LinkRecord[] {
    return this.links.filter((l) => l.from === note || l.to === note);
  },

  ...linkLookChanges,
};
