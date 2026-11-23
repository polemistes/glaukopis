/**
 * A file the page holds, taken into the notebook and into a note on the
 * phone (stage 3 of `docs/plans/an-app-for-android.md`): a picture or a file
 * chosen in the system's picker, a photograph the phone's camera took. On
 * Android the page is given files and no paths, and every call of the page
 * reaches Rust as one string of JSON, through Java: a photograph of 30 MB
 * in one call is a string of 40 MB three times over, and a file of 50 MB
 * ends the app on a phone with little memory. So a file goes in pieces of
 * half a megabyte, each read when it is its turn, and the page never holds
 * more of it than one.
 */

import type { EditorView } from 'prosemirror-view';
import {
  notebookTakeDropped,
  notebookTakePiece,
  notebookTakeWhole,
  type NotebookFile,
} from '$lib/api/notebook';
import { insertFigure } from '$lib/editor/commands';
import { t } from '$lib/i18n';
import type { Notebook } from '$lib/notebook/model/notebook.svelte';
import { figureOf, fileSourceOf, holdTaken } from '$lib/notebook/taking';
import { toBase64 } from '$lib/util/base64';
import { fileEnding } from '$lib/util/file-name';
import { newId } from '$lib/util/id';

/** How much of a file goes in one call. */
export const PIECE = 512 * 1024;

/** The most a file may be, in bytes: what the core takes (`inbox::MAX_FILE`), said here so that a file too large is refused before any of it is sent. The core refuses it too. */
export const MOST = 50 * 1024 * 1024;

/**
 * Takes a file into the notebook, piece by piece under one ticket, and then
 * asks for it whole: what the core says of the file, and of what a figure
 * shows of it. A file with no name is called `file`. An empty file, and one
 * larger than the core takes, are refused with words before anything is
 * sent; where anything fails, what was sent is thrown away and the failure
 * is passed on.
 */
export async function takeFile(file: File): Promise<NotebookFile> {
  const name = file.name || 'file';
  if (file.size === 0) throw new Error(name);
  if (file.size > MOST)
    throw new Error(t('phone-file-too-large', { name, most: MOST / (1024 * 1024) }));
  const ticket = newId();
  try {
    for (let at = 0; at < file.size; at += PIECE) {
      const piece = new Uint8Array(await file.slice(at, at + PIECE).arrayBuffer());
      await notebookTakePiece(ticket, name, toBase64(piece));
    }
    return await notebookTakeWhole(ticket, name);
  } catch (error) {
    await notebookTakeDropped(ticket).catch(() => {});
    throw error;
  }
}

/**
 * Puts a file taken in into a note, with itself as its source, as a file
 * dropped into a note on a computer has: held by the notebook, each file one
 * step of undo. A picture is put into the text as a figure, where the cursor
 * is where `atCursor`, else at the end (and at the end of the note where the
 * text is not there to put it in); any other file at the end of the note.
 * Gives whether it was put: not where the note is gone meanwhile.
 */
export function putTaken(
  notebook: Notebook,
  note: string,
  taken: NotebookFile,
  view: EditorView | null | undefined,
  atCursor: boolean,
): boolean {
  if (!notebook.note(note)) return false;
  notebook.checkpoint();
  holdTaken(notebook, taken, notebook.addSource(fileSourceOf(taken)));
  const { shown, file } = taken;
  if (shown) {
    const figure = figureOf(shown);
    const put =
      !!view &&
      !view.isDestroyed &&
      insertFigure(figure, atCursor ? undefined : view.state.doc.content.size)(
        view.state,
        view.dispatch,
      );
    if (!put) notebook.addFigure(note, figure);
  } else {
    notebook.addFile(note, { hash: file.hash, name: file.name, extension: fileEnding(file.name) });
  }
  notebook.checkpoint();
  return true;
}
