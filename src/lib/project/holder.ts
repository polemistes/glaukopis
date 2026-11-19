/**
 * A project as the holder of the texts of its elements: what an editor
 * asks of whatever holds its text (`editor/holder.ts`), answered by the
 * project, its documents and their layouts. One holder for each project,
 * the same whenever it is asked for, so that an editor is not made anew.
 */

import type { TextHolder } from '$lib/editor/holder';
import { kindKeysOf } from '$lib/editor/kinds';
import { topOf } from '$lib/figures/numbering.svelte';
import { pictures } from '$lib/figures/pictures.svelte';
import { citationWrittenIn } from '$lib/library/copying';
import { draggedPieces, NOTE_PIECES, piecesIntoText, receivedFromNotes } from '$lib/notebook/out';
import { documents, templateUsedCached } from '$lib/preview/documents.svelte';
import type { Project } from './model/project.svelte';

const holders = new WeakMap<Project, TextHolder>();

/** The project as what holds the texts of its elements. */
export function holderOf(project: Project): TextHolder {
  let holder = holders.get(project);
  if (!holder) {
    holder = made(project);
    holders.set(project, holder);
  }
  return holder;
}

function made(project: Project): TextHolder {
  const has = (element: string | null | undefined) => !!element && !!project.node(element);
  return {
    undo: () => project.undo(),
    redo: () => project.redo(),
    get undoManager() {
      return project.undoManager;
    },
    get awareness() {
      return project.awareness;
    },
    get passageKinds() {
      return project.passageKinds;
    },
    get refs() {
      return project.refs;
    },
    get ignored() {
      return project.ignored;
    },
    ignoreWord: (word) => project.ignoreWord(word),
    ownerOf: (fragment) => project.ownerOf(fragment),
    has,
    languageOf: (element) =>
      element && has(element) ? (project.documentOf(element).settings.language ?? null) : null,
    formatOf: (element) => documents.formatForCached(project, element),
    kindKeysOf: (element) =>
      kindKeysOf(element && has(element) ? templateUsedCached(project, element) : null),
    topOf: (element) => topOf(project, element),
    depthOf: (element, at) => {
      const path = project.pathTo(element);
      const from = at ? path.indexOf(at) : -1;
      return Math.max(0, path.length - 1 - (from >= 0 ? from : 1));
    },
    threadsOf: (element) => project.threadsOf(element),
    citationWritten: (element, said) => citationWrittenIn(project, element, said),
    // An image of a text of a project is one of the library's images (record 0070).
    pictureFromFile: (path) => pictures.addFile(path),
    pictureFromBlob: (blob, name) => pictures.addBlob(blob, name),
    // What comes from a note of the notebook: taken words a quotation with
    // its citation, a picture a figure of the library's (record 0101).
    received: (slice) => receivedFromNotes(project, slice),
    drops: {
      accepts: [NOTE_PIECES],
      ondrop(view, at, payload) {
        const dragged = draggedPieces(payload);
        if (dragged) void piecesIntoText(project, view, at, dragged);
      },
    },
  };
}
