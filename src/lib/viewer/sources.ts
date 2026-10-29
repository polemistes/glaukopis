/**
 * The sources of a project (ADR 0072): the tabs of the file side beside its
 * text, each a place in a file of the library, and which of them is active.
 * Plain functions over plain values, tested on their own: each gives a new
 * value and leaves the one it was given as it was.
 */

import { FILE, keptZoom } from '$lib/preview/zoom';
import { newId } from '$lib/util/id';
import type { Place } from './pages';

/** A tab: a file of the library, by its hash, the place in it, and how large its pages are shown. */
export interface SourceTab {
  id: string;
  file: string;
  place: Place;
  /** A factor of the size on paper; none for the width of the side. */
  zoom: number | null;
}

export interface Sources {
  tabs: SourceTab[];
  /** The tab shown; none only where there are no tabs. */
  active: string | null;
}

export const emptySources = (): Sources => ({ tabs: [], active: null });

/** The top of the first page. */
export const START: Place = { page: 1, at: 0 };

function readPlace(kept: unknown): Place {
  const p = (kept && typeof kept === 'object' ? kept : {}) as Partial<Place>;
  const page = Number.isInteger(p.page) && (p.page as number) > 0 ? (p.page as number) : 1;
  const at = typeof p.at === 'number' && Number.isFinite(p.at) ? Math.min(1, Math.max(0, p.at)) : 0;
  return { page, at };
}

/** Sources as they were kept, read with care: what is not a tab is left out, and the active one is one of them. */
export function readSources(kept: unknown): Sources {
  const k = (kept && typeof kept === 'object' ? kept : {}) as Partial<Sources>;
  const seen = new Set<string>();
  const tabs: SourceTab[] = [];
  for (const t of Array.isArray(k.tabs) ? (k.tabs as Partial<SourceTab>[]) : []) {
    if (!t || typeof t.file !== 'string' || !t.file) continue;
    const id = typeof t.id === 'string' && t.id && !seen.has(t.id) ? t.id : newId();
    seen.add(id);
    tabs.push({ id, file: t.file, place: readPlace(t.place), zoom: keptZoom(t.zoom, FILE) });
  }
  const active = tabs.some((t) => t.id === k.active) ? (k.active as string) : (tabs[0]?.id ?? null);
  return { tabs, active };
}

/** The tab shown. */
export const activeTab = (s: Sources): SourceTab | undefined =>
  s.tabs.find((t) => t.id === s.active) ?? s.tabs[0];

/**
 * A file shown: its tab made active where it has one, the one shown first,
 * else a tab of its own after the active one, at `place` or the top. With `again`, a tab of
 * its own all the same: a second place in the same file.
 */
export function withFile(
  s: Sources,
  file: string,
  place: Place = START,
  again = false,
): { sources: Sources; id: string } {
  // The tab shown, where it is of the file; else the first of it.
  const shown = activeTab(s);
  const there = again
    ? undefined
    : shown?.file === file
      ? shown
      : s.tabs.find((t) => t.file === file);
  if (there) return { sources: { ...s, active: there.id }, id: there.id };
  const tab: SourceTab = { id: newId(), file, place: { ...place }, zoom: null };
  const at = s.tabs.findIndex((t) => t.id === s.active);
  const tabs = [...s.tabs];
  tabs.splice(at < 0 ? tabs.length : at + 1, 0, tab);
  return { sources: { tabs, active: tab.id }, id: tab.id };
}

/** A tab closed: the one after it is shown where it was the active one, else the one before. */
export function without(s: Sources, id: string): Sources {
  const at = s.tabs.findIndex((t) => t.id === id);
  if (at < 0) return s;
  const tabs = s.tabs.filter((t) => t.id !== id);
  const active = s.active === id ? ((tabs[at] ?? tabs[at - 1])?.id ?? null) : s.active;
  return { tabs, active };
}

/** Every tab closed but one, which is shown. */
export function withoutOthers(s: Sources, id: string): Sources {
  const tab = s.tabs.find((t) => t.id === id);
  return tab ? { tabs: [tab], active: id } : s;
}

/** A tab moved to stand at `to` among the tabs. */
export function moved(s: Sources, id: string, to: number): Sources {
  const at = s.tabs.findIndex((t) => t.id === id);
  if (at < 0) return s;
  const tabs = [...s.tabs];
  const [tab] = tabs.splice(at, 1);
  tabs.splice(Math.min(Math.max(0, to), tabs.length), 0, tab);
  return { ...s, tabs };
}

/** A tab shown. */
export const activated = (s: Sources, id: string): Sources =>
  s.tabs.some((t) => t.id === id) ? { ...s, active: id } : s;

/** The tab after the one shown, or before it, round to the other end. */
export function stepped(s: Sources, by: 1 | -1): Sources {
  if (s.tabs.length < 2) return s;
  const at = Math.max(
    0,
    s.tabs.findIndex((t) => t.id === s.active),
  );
  const n = s.tabs.length;
  return { ...s, active: s.tabs[(at + by + n) % n].id };
}

function changedTab(s: Sources, id: string, change: (t: SourceTab) => SourceTab): Sources {
  if (!s.tabs.some((t) => t.id === id)) return s;
  return { ...s, tabs: s.tabs.map((t) => (t.id === id ? change(t) : t)) };
}

/** A tab at another place. */
export const placed = (s: Sources, id: string, place: Place): Sources =>
  changedTab(s, id, (t) => ({ ...t, place: { ...place } }));

/** A tab's pages shown larger or smaller; none for the width of the side. */
export const zoomed = (s: Sources, id: string, zoom: number | null): Sources =>
  changedTab(s, id, (t) => ({ ...t, zoom }));

/** A tab showing another file in the stead of its own, at its top and fitted: an image edited, kept as a new file. */
export const replaced = (s: Sources, id: string, file: string): Sources =>
  changedTab(s, id, (t) => ({ ...t, file, place: { ...START }, zoom: null }));

/**
 * The tabs of a side that belonged to no project, given to one: after its
 * own, each keeping its place; the one shown there is shown. A file the
 * project has a tab of already is not given twice.
 */
export function merged(s: Sources, own: Sources): Sources {
  const files = new Set(s.tabs.map((t) => t.file));
  const ids = new Set(s.tabs.map((t) => t.id));
  const given = own.tabs.filter((t) => !files.has(t.file) && !ids.has(t.id));
  const tabs = [...s.tabs, ...given];
  const shown = own.tabs.find((t) => t.id === own.active);
  const active =
    (shown && tabs.find((t) => t.id === shown.id || t.file === shown.file)?.id) ??
    s.active ??
    tabs[0]?.id ??
    null;
  return { tabs, active };
}
