/**
 * The numbers of the notes where a text is shown, in an editor and in text
 * drawn without one. A note is numbered as it is in the document: through
 * all the elements of the document, the notes before the element counted by
 * `figures/numbering.svelte.ts`, and those in the element by where they
 * stand in it. One that has been set to a place of its own is counted with
 * the others set so, and lettered, as it is in the document when that place
 * is not where the format has its notes.
 */

/** The notes that stand before an element in its document, each kind counted by itself. */
export interface NotesBefore {
  notes: number;
  placed: number;
}

export const NO_NOTES_BEFORE: NotesBefore = { notes: 0, placed: 0 };

/** a, b, … z, aa, ab, … */
export function letters(n: number): string {
  let out = '';
  while (n > 0) {
    const r = (n - 1) % 26;
    out = String.fromCharCode(97 + r) + out;
    n = (n - 1 - r) / 26;
  }
  return out;
}

/** The number of a note as it is shown: lettered, where it has a place of its own. */
export function noteLabel(n: number, placed: boolean): string {
  return placed ? letters(n) : String(n);
}

/**
 * Gives each note in a text its number, in `data-number` and in its mark,
 * where it is not already the one it has; `numbered` is told of each note.
 */
export function numberNotes(
  root: ParentNode,
  before: NotesBefore,
  numbered?: (note: HTMLElement) => void,
) {
  let notes = before.notes;
  let placed = before.placed;
  for (const note of root.querySelectorAll<HTMLElement>('.footnote')) {
    const own = note.hasAttribute('data-place');
    const label = own ? noteLabel(++placed, true) : noteLabel(++notes, false);
    const mark = note.querySelector<HTMLElement>(':scope > .note-mark');
    if (note.dataset.number !== label) note.dataset.number = label;
    if (mark && mark.textContent !== label) mark.textContent = label;
    numbered?.(note);
  }
}
