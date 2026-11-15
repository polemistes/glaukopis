/**
 * What the strip of a surface hands over when a note is dragged from it
 * onto the ground (`Strip.svelte`), and which notes stand in it.
 */

import type { DragPayload } from '$lib/ui/drag.svelte';
import type { Notebook } from '../model/notebook.svelte';
import type { NoteRecord } from '../model/types';

/** What a note dragged from the strip is, for what takes it. */
export const NOTE_UNPLACED = 'notebook-unplaced';

/** What is dragged from the strip: the note, of which notebook. */
export interface UnplacedPayload {
  notebook: Notebook;
  note: string;
}

/** The note dragged from the strip of this notebook, if that is what is dragged. */
export function unplacedOf(payload: DragPayload, notebook: Notebook): string | null {
  if (payload.kind !== NOTE_UNPLACED) return null;
  const data = payload.data as UnplacedPayload;
  return data.notebook === notebook ? data.note : null;
}

/**
 * The notes of a box, newest first, parted into those whose cards lie on its
 * surface (the oldest first, so that the newest lie on top) and those that
 * stand in the strip (the newest first).
 */
export function partNotes(
  list: NoteRecord[],
  box: string,
): { placed: NoteRecord[]; unplaced: NoteRecord[] } {
  const placed: NoteRecord[] = [];
  const unplaced: NoteRecord[] = [];
  for (const note of list) {
    if (note.box !== box) continue;
    if (note.at) placed.push(note);
    else unplaced.push(note);
  }
  return { placed: placed.reverse(), unplaced };
}
