/**
 * The logic of the page of the notebook (record 0101), apart from its
 * markup: which notes are selected, what a row of the list says of a note,
 * the sources of what a note holds and how one is given or changed, and
 * what became of a note, a line to each project and kind.
 */

import type { ProjectInfo } from '$lib/api/projects';
import { languages } from '$lib/i18n';
import { nowIso } from '$lib/project/model/origins';
import type { Notebook } from './model/notebook.svelte';
import { metOf } from './model/pieces';
import type { NewSource, NoteRecord, Passage, Source, SourceChange, Went } from './model/types';

// =====================================================================
// The rows of the list
// =====================================================================

/** What a row of the list says of a note. */
export interface NoteRow {
  /** Its name, or how it begins; empty where it has neither. */
  title: string;
  /** Whether it has neither a name nor words. */
  empty: boolean;
  /** The day it was collected. */
  day: string;
  pictures: boolean;
  files: boolean;
  passages: boolean;
  /** The first picture it holds, shown small at the right of the row. */
  picture: { hash: string; extension: string } | null;
}

/** A day, as the list of the library's files says one: `15 Nov 2026`, in the language of the interface. */
export function dayOf(iso: string): string {
  const d = new Date(iso);
  if (!iso || Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat(languages.current, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d);
}

export function rowOf(note: NoteRecord): NoteRow {
  const title = note.name || note.begins;
  return {
    title,
    empty: !title,
    day: dayOf(note.made),
    pictures: note.holds.pictures,
    files: note.holds.files,
    passages: note.holds.passages,
    picture: note.picture,
  };
}

// =====================================================================
// The selection
// =====================================================================

export interface Modifiers {
  shiftKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
}

/**
 * The notes selected, in the order they were selected, as the library's
 * list selects: a press chooses one, Ctrl adds or takes away, Shift takes
 * the range from where the last press was.
 */
export class NoteSelection {
  ids = $state<string[]>([]);
  /** Where a range selected with Shift begins. */
  anchor: string | null = null;

  /** The one note chosen; none where none or several are selected. */
  get single(): string | null {
    return this.ids.length === 1 ? this.ids[0] : null;
  }

  /** The note selected last, which the keys move from. */
  get focused(): string | null {
    return this.ids.length ? this.ids[this.ids.length - 1] : null;
  }

  has(id: string): boolean {
    return this.ids.includes(id);
  }

  /** Selects one note alone. */
  only(id: string | null) {
    this.ids = id ? [id] : [];
    this.anchor = id;
  }

  /** Selects these notes. */
  set(ids: string[]) {
    this.ids = [...ids];
    this.anchor = ids[ids.length - 1] ?? null;
  }

  /** The notes in `order` from one to another, ending with the second. */
  #range(order: string[], from: number, to: number): string[] {
    const [lo, hi] = from < to ? [from, to] : [to, from];
    const ids = order.slice(lo, hi + 1);
    return from < to ? ids : ids.reverse();
  }

  /** A note pressed, with the keys held. */
  press(id: string, mods: Modifiers, order: string[]) {
    if (mods.shiftKey && this.anchor) {
      const a = order.indexOf(this.anchor);
      const b = order.indexOf(id);
      if (a >= 0 && b >= 0) {
        this.ids = this.#range(order, a, b);
        return;
      }
    }
    if (mods.ctrlKey || mods.metaKey) {
      this.ids = this.has(id) ? this.ids.filter((x) => x !== id) : [...this.ids, id];
      this.anchor = id;
      return;
    }
    this.only(id);
  }

  /**
   * A key pressed while the list has the focus: the arrows, Page Up and
   * Down, Home and End move the choice, with Shift the range. Gives the note
   * moved to; none where the key moves nothing.
   */
  key(key: string, shift: boolean, order: string[], page = 10): string | null {
    if (!order.length) return null;
    const current = this.focused ? order.indexOf(this.focused) : -1;
    let next: number;
    switch (key) {
      case 'ArrowDown':
        next = Math.min(order.length - 1, current + 1);
        break;
      case 'ArrowUp':
        next = current < 0 ? 0 : Math.max(0, current - 1);
        break;
      case 'PageDown':
        next = Math.min(order.length - 1, Math.max(0, current) + page);
        break;
      case 'PageUp':
        next = Math.max(0, current - page);
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = order.length - 1;
        break;
      default:
        return null;
    }
    if (shift && this.anchor) {
      const a = order.indexOf(this.anchor);
      this.ids = this.#range(order, a >= 0 ? a : next, next);
    } else this.only(order[next]);
    return order[next];
  }

  /** Only what is there stays selected. */
  keep(present: (id: string) => boolean) {
    const kept = this.ids.filter(present);
    if (kept.length !== this.ids.length) this.ids = kept;
    if (this.anchor && !present(this.anchor)) this.anchor = kept[kept.length - 1] ?? null;
  }
}

/** The note to choose once these are deleted: the one after the last of them in the list, else the one before the first. */
export function neighbourOf(order: string[], removed: string[]): string | null {
  const gone = new Set(removed);
  const places = order.flatMap((id, i) => (gone.has(id) ? [i] : []));
  if (!places.length) return null;
  const after = order.slice(places[places.length - 1] + 1).find((id) => !gone.has(id));
  if (after) return after;
  return (
    order
      .slice(0, places[0])
      .reverse()
      .find((id) => !gone.has(id)) ?? null
  );
}

// =====================================================================
// The sources of a note
// =====================================================================

/** A source of what a note holds, as a chip under its text: none, for what was taken in and has no source. */
export interface SourceChip {
  id: string | null;
  source: Source | null;
}

/** The sources of what a note holds, each once, in the order met. */
export function chipsOf(notebook: Notebook, note: NoteRecord): SourceChip[] {
  const out: SourceChip[] = [];
  const seen = new Set<string | null>();
  for (const id of note.sources) {
    const source = id ? (notebook.sources.get(id) ?? null) : null;
    const key = source ? source.id : null;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ id: key, source });
  }
  return out;
}

/** What in a note has a source, or has none: its passages, and the files it holds by their hashes. */
export function takenFrom(
  notebook: Notebook,
  note: NoteRecord,
  source: string | null,
): { passages: Passage[]; files: string[] } {
  const passages: Passage[] = [];
  const files: string[] = [];
  for (const m of metOf(note.pieces)) {
    if ('passage' in m) {
      const p = notebook.passages.get(m.passage);
      if (p && p.source === source) passages.push(p);
    } else if ((notebook.files.get(m.hash)?.source ?? null) === source) files.push(m.hash);
  }
  return { passages, files };
}

/** When the first of what a note took in was taken: the day a page given by hand was read. */
function firstTaken(notebook: Notebook, taken: { passages: Passage[]; files: string[] }): string {
  const times = [
    ...taken.passages.map((p) => p.taken),
    ...taken.files.map((h) => notebook.files.get(h)?.taken ?? ''),
  ].filter(Boolean);
  return times.sort()[0] ?? '';
}

/** What a source is given as in the window of a source: of the sorts the writer can give. */
export type GivenSource =
  | { sort: 'web'; url: string; title: string }
  | { sort: 'reference'; reference: string; locator: string; label: string }
  | { sort: 'words'; words: string };

/** Whether what is given says anything: a page an address or a title, a reference the reference, words words. */
export function givesAnything(given: GivenSource): boolean {
  switch (given.sort) {
    case 'web':
      return !!(given.url.trim() || given.title.trim());
    case 'reference':
      return !!given.reference;
    case 'words':
      return !!given.words.trim();
  }
}

/** The source of what is given: what is not said is left out. */
function newSourceOf(given: GivenSource, read: string): NewSource {
  switch (given.sort) {
    case 'web':
      return { sort: 'web', url: given.url.trim(), title: given.title.trim(), read };
    case 'reference':
      return {
        sort: 'reference',
        reference: given.reference,
        ...(given.locator.trim() ? { locator: given.locator.trim(), label: given.label } : {}),
      };
    case 'words':
      return { sort: 'words', words: given.words.trim() };
  }
}

/** The change that makes a source of its sort say what is given: what is not said goes. */
function changeOf(given: GivenSource): SourceChange {
  switch (given.sort) {
    case 'web':
      return { url: given.url.trim(), title: given.title.trim() };
    case 'reference': {
      const locator = given.locator.trim();
      return {
        reference: given.reference,
        locator: locator || undefined,
        label: locator ? given.label : undefined,
      };
    }
    case 'words':
      return { words: given.words.trim() };
  }
}

/** Gives a file and the file it was made from, where it is a copy made to be shown, a source. */
function setFile(notebook: Notebook, hash: string, source: string | null) {
  notebook.setFileSource(hash, source);
  const from = notebook.files.get(hash)?.madeFrom;
  if (from) notebook.setFileSource(from, source);
}

/**
 * Saves what the window of a source says, in one step of undo, and gives
 * the source. For what had none in the note, the source is made and given
 * to every passage and file of the note that has none. A source that is
 * there is changed, for everything that came from it in any note; where
 * its sort is another, a new source takes its place for the pieces of this
 * note, and the old one goes where nothing uses it any more.
 */
export function saveSource(
  notebook: Notebook,
  note: NoteRecord,
  from: Source | null,
  given: GivenSource,
): string {
  notebook.undoManager.stopCapturing();
  const id = notebook.transact(() => {
    if (from && from.sort === given.sort) {
      notebook.changeSource(from.id, changeOf(given));
      return from.id;
    }
    const taken = takenFrom(notebook, note, from?.id ?? null);
    const read = (from?.sort === 'web' && from.read) || firstTaken(notebook, taken) || nowIso();
    const made = notebook.addSource(newSourceOf(given, read));
    for (const p of taken.passages) notebook.setPassageSource(p.id, made);
    for (const h of taken.files) setFile(notebook, h, made);
    return made;
  });
  // What uses a source is read once the change is made: in the same step of undo.
  if (from && from.id !== id) notebook.removeSource(from.id);
  notebook.undoManager.stopCapturing();
  return id;
}

// =====================================================================
// What became of a note
// =====================================================================

/** A line of what became of a note: what it went into a project as. */
export interface WentLine {
  what: Went['what'];
  /** The project, where it is known. */
  project: string | null;
  /** What the project is called now, where it is still there; else what it was called. */
  name: string;
  /** Whether the project is still there, to be gone to. */
  here: boolean;
  /** The element it went into last. */
  element?: string;
}

/** What became of a note: one line to each project and kind, in the order they first went. */
export function wentLines(went: Went[], projects: ProjectInfo[]): WentLine[] {
  const lines = new Map<string, WentLine>();
  for (const w of went) {
    const key = `${w.project ?? w.name ?? ''}\u0000${w.what}`;
    const info = w.project ? projects.find((p) => p.id === w.project) : undefined;
    const line: WentLine = {
      what: w.what,
      project: w.project ?? null,
      name: info?.name ?? w.name ?? '',
      here: !!info,
      ...(w.element ? { element: w.element } : {}),
    };
    const before = lines.get(key);
    // The same project and kind are said once, and lead to where it went last.
    if (before) lines.set(key, { ...before, element: line.element ?? before.element });
    else lines.set(key, line);
  }
  return [...lines.values()];
}
