/**
 * Narrowing the list of references by what they are, who published them
 * and when: the filters of the library, beside the search. They work on the
 * summaries the listing carries, so nothing is asked of the Rust side.
 */

import type { Summary } from '$lib/api/library';
import { fold } from '$lib/state/library.svelte';

export interface Filters {
  /** The entry types that are let through; none means all. */
  kinds: string[];
  /** Words of the publisher; empty means any. */
  publisher: string;
  /** The first and the last year let through, either or both. */
  from: number | null;
  to: number | null;
}

export const noFilters: Filters = { kinds: [], publisher: '', from: null, to: null };

/** How many of the filters are on: the kinds count as one. */
export function activeFilters(f: Filters): number {
  return (
    (f.kinds.length ? 1 : 0) +
    (f.publisher.trim() ? 1 : 0) +
    (f.from != null || f.to != null ? 1 : 0)
  );
}

/** The entries that pass every filter that is on. */
export function applyFilters(entries: Summary[], f: Filters): Summary[] {
  const kinds = f.kinds.length ? new Set(f.kinds) : null;
  const publisher = fold(f.publisher);
  const from = f.from;
  const to = f.to;
  if (!kinds && !publisher && from == null && to == null) return entries;
  return entries.filter((e) => {
    if (kinds && !kinds.has(e.type)) return false;
    if (publisher && !fold(e.publisher).includes(publisher)) return false;
    if (from != null || to != null) {
      // A reference whose year is not known is not of any year that is asked for.
      if (e.yearNumber == null) return false;
      if (from != null && e.yearNumber < from) return false;
      if (to != null && e.yearNumber > to) return false;
    }
    return true;
  });
}

export interface Counted {
  value: string;
  count: number;
}

/** The entry types present, the most frequent first. */
export function kindsOf(entries: Summary[]): Counted[] {
  return counted(entries.map((e) => e.type));
}

/** The publishers present, as they are written, the most frequent first. */
export function publishersOf(entries: Summary[]): Counted[] {
  return counted(entries.map((e) => e.publisher.trim()).filter(Boolean));
}

function counted(values: string[]): Counted[] {
  const counts = new Map<string, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  const collator = new Intl.Collator(undefined, { sensitivity: 'base', numeric: true });
  return [...counts]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || collator.compare(a.value, b.value));
}

/** The first and the last year among the entries that have one. */
export function yearSpan(entries: Summary[]): [number, number] | null {
  let lo = Infinity;
  let hi = -Infinity;
  for (const e of entries) {
    if (e.yearNumber == null) continue;
    if (e.yearNumber < lo) lo = e.yearNumber;
    if (e.yearNumber > hi) hi = e.yearNumber;
  }
  return lo <= hi ? [lo, hi] : null;
}

/** A year as it was typed: a number, or nothing. */
export function parseYear(text: string): number | null {
  const m = /^\s*(-?\d{1,4})\s*$/.exec(text);
  return m ? Number(m[1]) : null;
}
