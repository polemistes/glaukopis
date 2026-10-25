/**
 * A mind map as the readers and writers of the formats of other programs
 * have it (Freeplane and FreeMind, XMind, OPML): a tree of topics with
 * names, notes and the few things said of each, and the associations
 * between them. A file read becomes this, and this becomes elements of a
 * project (`intoPortable`); a project becomes this (`outline.ts`), and this
 * a file. What a format holds that a project has no place for, and what a
 * project holds that a format has none for, is counted, to be told.
 */

import type { When } from '$lib/timeline/solve';
import type { Block, Inline } from '$lib/project/model/text';
import type { Status } from '$lib/project/model/types';

/** A topic of a mind map, with all under it. */
export interface Topic {
  /** Its id in the file, by which associations name it. */
  id: string;
  name: Inline[];
  text: Block[];
  folded: boolean;
  status: Status | null;
  /** The name of its kind, and the colour the file gives it, as `#rrggbb`. */
  kind: { name: string; colour: string | null } | null;
  when: When | null;
  excluded: boolean;
  /** Which side of the topic in the middle it stands on, of the first under it only. */
  side?: 'left' | 'right';
  children: Topic[];
}

/** An association between two topics, by their ids, with its words. */
export interface Association {
  from: string;
  to: string;
  label: string;
}

/** A mind map: its name, the topic in the middle, and the associations. */
export interface MindMap {
  name: string;
  root: Topic;
  links: Association[];
}

/** What had no place where it went, by what it was. */
export type LeftOutKind =
  | 'images'
  | 'clouds'
  | 'summaries'
  | 'boundaries'
  | 'hyperlinks'
  | 'icons'
  | 'attributes'
  | 'labels'
  | 'times'
  | 'associations'
  | 'pictures'
  | 'references';

/** How many of each kind of thing had no place where it went. */
export type LeftOut = Partial<Record<LeftOutKind, number>>;

/** The kinds of what is left out, in the order they are told. */
export const LEFT_OUT_KINDS: readonly LeftOutKind[] = [
  'images',
  'pictures',
  'clouds',
  'summaries',
  'boundaries',
  'hyperlinks',
  'icons',
  'attributes',
  'labels',
  'times',
  'associations',
  'references',
];

/** Counts one more, or `n` more, of a kind left out. */
export function leave(out: LeftOut, kind: LeftOutKind, n = 1) {
  if (n > 0) out[kind] = (out[kind] ?? 0) + n;
}

/** Adds what one count says to another. */
export function leaveAll(out: LeftOut, more: LeftOut) {
  for (const kind of LEFT_OUT_KINDS) leave(out, kind, more[kind] ?? 0);
}

/** A topic with nothing said of it but its name. */
export function topic(id: string, name: Inline[], children: Topic[] = []): Topic {
  return {
    id,
    name,
    text: [],
    folded: false,
    status: null,
    kind: null,
    when: null,
    excluded: false,
    children,
  };
}

/** Plain words as a name, without marks. */
export function plainName(text: string): Inline[] {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean ? [{ kind: 'text', text: clean, marks: {} }] : [];
}

/**
 * The few words a time is written in where the file has no place for it
 * but words: `1814`, `1814 – 1905`, as the timeline reads them. A time
 * that says more than that (after another element, with a margin) is
 * written as the record the project keeps, so that it reads back.
 */
export function timeWords(when: When): string {
  const simple = (b: When['start'] | undefined) =>
    !!b && !!b.at && !b.after && !b.before && !b.during && !b.margin && !b.approx;
  if (simple(when.start) && (!when.end || simple(when.end)))
    return when.end ? `${when.start.at} – ${when.end.at}` : when.start.at!;
  return JSON.stringify(when);
}

/** A time read back from its words: as `timeWords` writes it; nothing where it is not one. */
export function timeOfWords(words: string, isTime: (text: string) => boolean): When | null {
  const text = words.trim();
  if (!text) return null;
  if (text.startsWith('{')) {
    try {
      const when = JSON.parse(text) as When;
      if (when && typeof when === 'object' && when.start && typeof when.start === 'object')
        return when;
    } catch {
      return null;
    }
    return null;
  }
  const parts = text.split(/\s+[–—]\s+|\s+-\s+/);
  if (parts.length > 2 || !parts.every(isTime)) return null;
  return parts.length === 2
    ? { start: { at: parts[0] }, end: { at: parts[1] } }
    : { start: { at: parts[0] } };
}
