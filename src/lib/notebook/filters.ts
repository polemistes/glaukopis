/**
 * The filters of the notebook's list (`docs/plans/the-notebook.md`,
 * "Finding"), beside the words searched for, the box and the tags, as the
 * library has its own beside its search: what a note holds, when it was
 * collected, where it came from, whether it has been looked at, whether it
 * has been used. What is chosen, how many filters are on, and what passes;
 * not kept across runs.
 */

import type { LinkRecord } from '$lib/project/model/types';
import type { NoteRecord, Source } from './model/types';

/** What a note may be asked to hold: an image, a file, words taken in, a link to another note. */
export type Held = 'pictures' | 'files' | 'passages' | 'links';
export const HELD: readonly Held[] = ['pictures', 'files', 'passages', 'links'];

/** Where a note may have come from: the sorts of its sources, or none. */
export type Came = Source['sort'] | 'none';
export const CAME: readonly Came[] = ['web', 'reference', 'file', 'words', 'none'];

/** Whether a note has been used in a project: all, used, or not used. */
export type Use = 'all' | 'used' | 'unused';

export interface NoteFilters {
  /** What a note must hold, every one of them; none asks nothing. */
  holds: Held[];
  /** The first and the last day it may have been collected, as `2026-11-16`; none for no bound. */
  from: string | null;
  to: string | null;
  /** Where it may have come from, any one of them; none asks nothing. */
  came: Came[];
  /** Only the notes not looked at. */
  unseen: boolean;
  use: Use;
}

export const noFilters: NoteFilters = {
  holds: [],
  from: null,
  to: null,
  came: [],
  unseen: false,
  use: 'all',
};

/** How many of the filters are on: what is held counts as one, the days as one, where it came from as one. */
export function activeFilters(f: NoteFilters): number {
  return (
    (f.holds.length ? 1 : 0) +
    (f.from || f.to ? 1 : 0) +
    (f.came.length ? 1 : 0) +
    (f.unseen ? 1 : 0) +
    (f.use !== 'all' ? 1 : 0)
  );
}

/** The day of a time, on this computer's clock, as `2026-11-16`; empty where it is none. */
export function dayKey(iso: string): string {
  const d = new Date(iso);
  if (!iso || Number.isNaN(d.getTime())) return '';
  const two = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())}`;
}

/**
 * A day as it is typed into a field of the filters, as a bound: a year
 * (`2026`), a month (`2026-11`) or a day (`2026-11-16`), the first day of
 * it, or with `last` the last. None where nothing is typed, or what is
 * typed is no day.
 */
export function parseDay(typed: string, last = false): string | null {
  const m = /^\s*(\d{4})(?:[-./](\d{1,2})(?:[-./](\d{1,2}))?)?\s*$/.exec(typed);
  if (!m) return null;
  const [, year, month, day] = m;
  const mm = month ? Number(month) : last ? 12 : 1;
  if (mm < 1 || mm > 12) return null;
  const lastDay = new Date(Number(year), mm, 0).getDate();
  const dd = day ? Number(day) : last ? lastDay : 1;
  if (dd < 1 || dd > lastDay) return null;
  const two = (n: number) => String(n).padStart(2, '0');
  return `${year}-${two(mm)}-${two(dd)}`;
}

/** The first and the last day notes were collected on; none where there are none. */
export function daySpan(notes: readonly NoteRecord[]): [string, string] | null {
  let lo = '';
  let hi = '';
  for (const n of notes) {
    const day = dayKey(n.made);
    if (!day) continue;
    if (!lo || day < lo) lo = day;
    if (!hi || day > hi) hi = day;
  }
  return lo ? [lo, hi] : null;
}

/** The notes that have a link to another note. */
export function linkedNotes(links: readonly Pick<LinkRecord, 'from' | 'to'>[]): Set<string> {
  const out = new Set<string>();
  for (const l of links) {
    out.add(l.from);
    out.add(l.to);
  }
  return out;
}

/** What the filters ask of the notebook beyond a note's record. */
export interface FilterContext {
  /** The sort of a source, by its id; none where it is not there. */
  sortOf: (source: string) => Source['sort'] | undefined;
  /** The notes that have a link to another note. */
  linked: ReadonlySet<string>;
  /**
   * Notes looked at since the filters were last changed, which still count
   * as not looked at: chosen while only those are shown, a note stays in
   * the list until the filters change.
   */
  lookedNow?: ReadonlySet<string>;
}

/** Where a note came from: the sorts of its sources, and none where something in it has none, or nothing in it was taken in. */
export function cameFrom(note: NoteRecord, sortOf: FilterContext['sortOf']): Set<Came> {
  const out = new Set<Came>();
  if (!note.sources.length) out.add('none');
  for (const id of note.sources) {
    const sort = id ? sortOf(id) : undefined;
    out.add(sort ?? 'none');
  }
  return out;
}

/** Whether a note passes every filter that is on. */
export function passes(note: NoteRecord, f: NoteFilters, ctx: FilterContext): boolean {
  for (const held of f.holds) {
    if (held === 'links' ? !ctx.linked.has(note.id) : !note.holds[held]) return false;
  }
  if (f.from || f.to) {
    const day = dayKey(note.made);
    if (!day) return false;
    if (f.from && day < f.from) return false;
    if (f.to && day > f.to) return false;
  }
  if (f.came.length) {
    const came = cameFrom(note, ctx.sortOf);
    if (!f.came.some((c) => came.has(c))) return false;
  }
  if (f.unseen && note.seen && !ctx.lookedNow?.has(note.id)) return false;
  if (f.use === 'used' && !note.went.length) return false;
  if (f.use === 'unused' && note.went.length) return false;
  return true;
}

/** The notes that pass every filter that is on, in the order given. */
export function applyFilters(
  notes: NoteRecord[],
  f: NoteFilters,
  ctx: FilterContext,
): NoteRecord[] {
  if (!activeFilters(f)) return notes;
  return notes.filter((n) => passes(n, f, ctx));
}
