/**
 * Associations between elements, with the words that name them. These are
 * methods of `Project`, which takes them in (see there).
 */

import * as Y from 'yjs';
import { newId } from '$lib/util/id';
import type { Project } from '../project.svelte';

export function makeLink(p: Project, from: string, to: string, label = ''): string {
  const id = newId();
  const l = new Y.Map<unknown>();
  l.set('from', from);
  l.set('to', to);
  if (label) l.set('label', label);
  p.yLinks.set(id, l);
  return id;
}

export const linkChanges = {
  /** Associates two elements. Returns the id of the link, or of the one that was there. */
  addLink(this: Project, from: string, to: string): string | null {
    if (from === to || !this.yNodes.has(from) || !this.yNodes.has(to)) return null;
    const existing = this.links.find(
      (l) => (l.from === from && l.to === to) || (l.from === to && l.to === from),
    );
    if (existing) return existing.id;
    return this.transact(() => makeLink(this, from, to));
  },

  removeLink(this: Project, id: string) {
    if (!this.yLinks.has(id)) return;
    this.transact(() => this.yLinks.delete(id));
  },

  setLinkLabel(this: Project, id: string, label: string) {
    const l = this.yLinks.get(id);
    if (!l) return;
    const clean = label.replace(/\s+/g, ' ').trim();
    this.transact(() => {
      if (clean) l.set('label', clean);
      else l.delete('label');
    });
  },
};
