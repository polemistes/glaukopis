/**
 * The one notebook of the window (record 0101): read from disk once, when
 * it is first asked for, and kept open while the window is. What another
 * window writes into it comes to it; what is written here is appended to
 * its log, and before the window closes what is not yet written is. A
 * moment after its whole state is saved, its readable copy is written into
 * its folder as Org (`org.ts`).
 */

import {
  notebookAppend,
  notebookHold,
  notebookLoad,
  notebookReadableWrite,
  notebookSaveState,
  notebookSweep,
  onNotebookUpdate,
} from '$lib/api/notebook';
import { FORM, formOfStored, LaterForm } from '$lib/editor/form';
import type { TextHolder } from '$lib/editor/holder';
import { t } from '$lib/i18n';
import { beforeClose } from '$lib/state/closing';
import { holderOfNotebook } from './holder';
import { Notebook } from './model/notebook.svelte';
import { orgOfNotebook } from './org';

class TheNotebook {
  /** The notebook, once it has been read. */
  current = $state.raw<Notebook | null>(null);
  /** Why it could not be read, where it could not. */
  failure = $state<string | null>(null);
  #opening: Promise<Notebook> | null = null;

  /** The notebook, read once: the same promise while it is being read and after. */
  open(): Promise<Notebook> {
    this.#opening ??= this.#read().catch((error) => {
      this.failure = error instanceof Error ? error.message : String(error);
      // Asked again, it is read again.
      this.#opening = null;
      throw error;
    });
    return this.#opening;
  }

  async #read(): Promise<Notebook> {
    const loaded = await notebookLoad();
    // A notebook of a later form of the texts is not opened, as a project is not (ADR 0111).
    if (formOfStored(loaded.state, loaded.updates) > FORM) throw new LaterForm(t('notebook-later'));
    const notebook = new Notebook(
      {
        append: (update, _here, time) => notebookAppend(update, time),
        saveState: (state, summary) => notebookSaveState(state, summary),
        readable: (nb) => {
          const { org, pictures, files } = orgOfNotebook(nb);
          return notebookReadableWrite(org, pictures, files);
        },
      },
      {
        hold: (hashes) => {
          notebookHold(hashes).catch((error) =>
            console.warn('the files a note holds could not be said to the store', error),
          );
        },
      },
    );
    notebook.load(loaded.state, loaded.updates);
    await onNotebookUpdate((update) => notebook.applyFromWindow(update)).catch((error) =>
      console.warn('the changes of other windows to the notebook are not heard', error),
    );
    // What is not yet written goes to the log first; then the whole is written.
    beforeClose(async () => {
      await notebook.flush();
      const error = notebook.saveError;
      if (notebook.unwritten && error) throw new Error(error);
    }, 'first');
    // Then its readable copy, where one waits.
    beforeClose(async () => {
      await notebook.snapshot();
      await notebook.finishCopy();
    });
    notebookSweep(notebook.summary().files).catch((error) =>
      console.warn('the files no note holds could not be swept', error),
    );
    this.failure = null;
    this.current = notebook;
    return notebook;
  }

  /** The notebook as the holder of the texts of its notes, once it is open. */
  holder(): TextHolder | null {
    return this.current ? holderOfNotebook(this.current) : null;
  }
}

export const theNotebook = new TheNotebook();
