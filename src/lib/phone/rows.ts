/**
 * What a row of the phone's list says of a note, beyond what a row of the
 * computer's list says (`rowOf`): the source of what it took in, in a line,
 * and its tags. A row on a phone is pressed to open its note, and says more
 * than one on a computer, where the note is shown beside the list.
 */

import type { Notebook } from '$lib/notebook/model/notebook.svelte';
import type { NoteRecord } from '$lib/notebook/model/types';
import { chipsOf, rowOf, type NoteRow } from '$lib/notebook/page.svelte';
import { sourceLabel } from '$lib/notebook/sources';

/** A note in its row on the phone. */
export interface PhoneRow extends NoteRow {
  /** The source of the first of what it took in, in a line; *No source* where that has none; none where it took in nothing. */
  source: string | null;
  /** Its tags, as words are sorted. */
  tags: string[];
}

/** The source of what a note took in, in a line: that of the first, where it took in anything. Reactive, as `t` is. */
export function sourceOf(notebook: Notebook, note: NoteRecord): string | null {
  const first = chipsOf(notebook, note)[0];
  return first ? sourceLabel(first.source) : null;
}

/** A note in its row on the phone. */
export function phoneRowOf(notebook: Notebook, note: NoteRecord): PhoneRow {
  return { ...rowOf(note), source: sourceOf(notebook, note), tags: note.tags };
}
