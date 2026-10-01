/**
 * Changing the kinds of elements of a project: making them, naming and
 * colouring them, giving them a text to begin with and a kind of paragraph
 * to write it in, deleting them; and saying of elements which kind they
 * are. These are methods of `Project`, which takes them in (see there).
 */

import { generateKeyBetween } from 'fractional-indexing';
import * as Y from 'yjs';
import { newId } from '$lib/util/id';
import type { Project } from '../project.svelte';
import { fillBody } from '../text';
import type { KindRecord } from '../types';

/** What can be said of a kind. */
export type KindDraft = Pick<KindRecord, 'name' | 'colour' | 'template' | 'begins'>;

function clean(draft: Partial<KindDraft>): Partial<KindDraft> {
  const out: Partial<KindDraft> = {};
  if (draft.name !== undefined) out.name = draft.name.replace(/\s+/g, ' ').trim();
  if (draft.colour !== undefined) out.colour = draft.colour;
  if (draft.template !== undefined) out.template = draft.template.replace(/\r\n?/g, '\n').trim();
  if (draft.begins !== undefined) out.begins = draft.begins.trim();
  return out;
}

export const kindChanges = {
  /** Makes a kind, last among the kinds. Returns its id; nothing without a name. */
  createKind(this: Project, draft: KindDraft): string | null {
    const given = clean(draft);
    if (!given.name) return null;
    const id = newId();
    this.transact(() => {
      const last = this.kinds.length ? this.kinds[this.kinds.length - 1].order : null;
      const k = new Y.Map<unknown>();
      k.set('name', given.name);
      k.set('colour', given.colour ?? '');
      if (given.template) k.set('template', given.template);
      if (given.begins) k.set('begins', given.begins);
      k.set('order', generateKeyBetween(last, null));
      this.yKinds.set(id, k);
    });
    return id;
  },

  /** Changes what is said of a kind: its name, its colour, its text, the kind of paragraph it writes in. */
  updateKind(this: Project, id: string, draft: Partial<KindDraft>) {
    const k = this.yKinds.get(id);
    if (!k) return;
    const given = clean(draft);
    if (given.name === '') delete given.name;
    this.transact(() => {
      for (const [key, value] of Object.entries(given)) {
        if (value === undefined || k.get(key) === value) continue;
        if (value === '') k.delete(key);
        else k.set(key, value);
      }
    });
  },

  /** Deletes a kind: the elements that were of it are of none. */
  deleteKind(this: Project, id: string) {
    if (!this.yKinds.has(id)) return;
    this.transact(() => {
      for (const n of this.yNodes.values()) if (n.get('kind') === id) n.delete('kind');
      this.yKinds.delete(id);
    });
  },

  /**
   * Says of elements which kind they are; with nothing, that they are of
   * none. An element without text that is given a kind with a text to begin
   * with begins with it, in the kind of paragraph the kind writes in; one
   * given a kind that only says the kind of paragraph begins in that.
   */
  setKind(this: Project, ids: string[], kind: string | null) {
    const record = kind ? this.kinds.find((k) => k.id === kind) : undefined;
    if (kind && !record) return;
    this.transact(() => {
      for (const id of ids) {
        const n = this.yNodes.get(id);
        if (!n) continue;
        if (kind) n.set('kind', kind);
        else n.delete('kind');
        if ((record?.template || record?.begins) && this.node(id)?.empty) {
          const body = n.get('body');
          if (body instanceof Y.XmlFragment) fillBody(body, record.template, record.begins);
        }
      }
    });
  },
};
