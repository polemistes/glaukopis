/**
 * What the user writes about a work: reflections and comments, which are
 * not part of what is cited.
 *
 * There are two kinds. A note for all projects is kept with the reference in
 * the library, in its field `annotation`. A note for one project is kept in
 * the project, and is with everyone the project is shared with. What is
 * written in the library is for all projects; what is written in a project
 * is for that project, until it is said to be for all.
 *
 * A project carries copies of the references it cites, with their notes. To
 * one who has the project and not the reference, such a note is a note of
 * the project.
 */

import { libraryGet, type Draft, type Reference } from '$lib/api/library';
import { currentProject } from '$lib/editor/references.svelte';
import { library } from '$lib/state/library.svelte';
import type { RectLike } from '$lib/ui/floating';

/**
 * A note as it is written, line by line. In the field its paragraphs are
 * set apart by an empty line, which is what sets them apart in BibLaTeX.
 */
export function toLines(field: string | undefined | null): string {
  return (field ?? '').replace(/\n{2,}/g, '\n').trim();
}

/** The note that came with the project, for a reference that is not in the library. */
export function carriedNote(id: string): string {
  if (library.get(id)) return '';
  return toLines(currentProject()?.refs.get(id)?.fields.annotation);
}

/** Whether anything is written about a work, that can be read here. */
export function hasNotes(id: string): boolean {
  if (library.get(id)?.hasNote) return true;
  if (currentProject()?.notes.has(id)) return true;
  return !!carriedNote(id);
}

/**
 * A form holds the reference as it was when the form was opened. If the note
 * was not changed in the form, what is kept is the note as it is now: it may
 * have been written elsewhere meanwhile.
 */
export async function withNoteAsItIs(
  id: string,
  draft: Draft,
  loaded: Reference | null,
): Promise<Draft> {
  if ((draft.fields.annotation ?? '') !== (loaded?.fields.annotation ?? '')) return draft;
  try {
    const now = (await libraryGet(id)).fields.annotation;
    const fields = { ...draft.fields };
    if (now) fields.annotation = now;
    else delete fields.annotation;
    return { ...draft, fields };
  } catch {
    return draft;
  }
}

export interface NotesRequest {
  id: string;
  anchor: RectLike;
}

class NotesUi {
  open = $state.raw<NotesRequest | null>(null);
}

export const notesUi = new NotesUi();

export function openNotes(id: string, anchor: HTMLElement | RectLike) {
  const rect = anchor instanceof HTMLElement ? anchor.getBoundingClientRect() : anchor;
  notesUi.open = { id, anchor: rect };
}
