/**
 * Changing the kinds of paragraph and of words of the writer's own: making
 * them, saying what each is based on and how it differs, deleting them.
 * These are methods of `Project`, which takes them in (see there). The
 * kinds of the catalogue are not here: see `editor/kinds.ts`. See ADR 0029.
 */

import { generateKeyBetween } from 'fractional-indexing';
import * as Y from 'yjs';
import type { KindFamily, Look } from '$lib/api/documents';
import { newId } from '$lib/util/id';
import type { Project } from '../project.svelte';
import type { Hand, PassageKindRecord } from '../types';

/** What can be said of a kind. */
export type PassageKindDraft = Pick<PassageKindRecord, 'name' | 'family' | 'basedOn' | 'look'>;

const ALIGNS = ['left', 'center', 'right', 'justified'];
const CASES = ['none', 'upper', 'smallcaps'];
/** A length as it is written: `1.27cm`, `12pt`, `0.5in`, `25mm`, or points without a unit. */
const LENGTH = /^-?\d+(?:[.,]\d+)?(?:pt|mm|cm|in)?$/i;

/** The measures of a look, each with what it is. */
const MEASURES: Record<keyof Look, 'number' | 'length' | 'boolean' | 'align' | 'case' | 'text'> = {
  size: 'number',
  lineSpacing: 'number',
  align: 'align',
  indentLeft: 'length',
  indentRight: 'length',
  firstLine: 'length',
  spaceBefore: 'length',
  spaceAfter: 'length',
  bold: 'boolean',
  italic: 'boolean',
  case: 'case',
  underline: 'boolean',
  monospace: 'boolean',
  keepWithNext: 'boolean',
  newPage: 'boolean',
  text: 'text',
};

/** A look as the document can carry it: only its measures, each as it should be. */
export function cleanLook(value: unknown): Look {
  const out: Record<string, unknown> = {};
  if (!value || typeof value !== 'object') return out;
  const given = value as Record<string, unknown>;
  for (const [key, what] of Object.entries(MEASURES)) {
    const v = given[key];
    if (v === undefined || v === null) continue;
    switch (what) {
      case 'number':
        if (typeof v === 'number' && Number.isFinite(v) && v >= 0) out[key] = v;
        break;
      case 'length':
        if (typeof v === 'string' && LENGTH.test(v.trim())) out[key] = v.trim();
        break;
      case 'boolean':
        if (typeof v === 'boolean') out[key] = v;
        break;
      case 'align':
        if (typeof v === 'string' && ALIGNS.includes(v)) out[key] = v;
        break;
      case 'case':
        if (typeof v === 'string' && CASES.includes(v)) out[key] = v;
        break;
      case 'text':
        if (typeof v === 'string') out[key] = v.slice(0, 40);
        break;
    }
  }
  return out as Look;
}

export function family(value: unknown): KindFamily {
  return value === 'words' ? 'words' : 'paragraph';
}

function clean(draft: Partial<PassageKindDraft>): Partial<PassageKindDraft> {
  const out: Partial<PassageKindDraft> = {};
  if (draft.name !== undefined) out.name = draft.name.replace(/\s+/g, ' ').trim();
  if (draft.family !== undefined) out.family = family(draft.family);
  if (draft.basedOn !== undefined) out.basedOn = draft.basedOn.trim();
  if (draft.look !== undefined) out.look = cleanLook(draft.look);
  return out;
}

export const passageKindChanges = {
  /** Makes a kind, last among the kinds. Returns its id; nothing without a name. */
  createPassageKind(this: Project, draft: PassageKindDraft): string | null {
    const given = clean(draft);
    if (!given.name) return null;
    const id = newId();
    this.transact(() => {
      const kinds = this.passageKinds;
      const last = kinds.length ? kinds[kinds.length - 1].order : null;
      const k = new Y.Map<unknown>();
      k.set('name', given.name);
      k.set('family', given.family ?? 'paragraph');
      if (given.basedOn) k.set('basedOn', given.basedOn);
      if (given.look && Object.keys(given.look).length) k.set('look', given.look);
      k.set('order', generateKeyBetween(last, null));
      this.yPassageKinds.set(id, k);
    });
    return id;
  },

  /** Changes what is said of a kind: its name, its family, what it is based on, its look as a whole. */
  updatePassageKind(this: Project, id: string, draft: Partial<PassageKindDraft>) {
    const k = this.yPassageKinds.get(id);
    if (!k) return;
    const given = clean(draft);
    if (given.name === '') delete given.name;
    this.transact(() => {
      for (const [key, value] of Object.entries(given)) {
        if (value === undefined) continue;
        const empty = value === '' || (typeof value === 'object' && !Object.keys(value).length);
        if (empty) k.delete(key);
        else if (typeof value === 'object' || k.get(key) !== value) k.set(key, value);
      }
    });
  },

  /**
   * Deletes a kind. The passages that were of it stay as they are, and
   * are set as text where a document is made; the hands of the maps let
   * it go.
   */
  deletePassageKind(this: Project, id: string) {
    if (!this.yPassageKinds.has(id)) return;
    this.transact(() => {
      for (const m of this.yMaps.values()) {
        const hand = m.get('hand') as Hand | undefined;
        if (!hand || (!hand.pinned?.includes(id) && !hand.unpinned?.includes(id))) continue;
        const next = {
          pinned: (hand.pinned ?? []).filter((k) => k !== id),
          unpinned: (hand.unpinned ?? []).filter((k) => k !== id),
        };
        if (next.pinned.length || next.unpinned.length) m.set('hand', next);
        else m.delete('hand');
      }
      this.yPassageKinds.delete(id);
    });
  },
};
