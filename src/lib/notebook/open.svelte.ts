/**
 * The one notebook of the window (record 0101): read from disk once, when
 * it is first asked for, and kept open while the window is. What another
 * window writes into it comes to it, and what a round of the
 * synchronization writes, also while it is being read; what is written
 * here is appended to its log, and before the window closes what is not
 * yet written is. A moment after its whole state is saved, its readable
 * copy is written into its folder as Org (`org.ts`). Which files its notes
 * hold is said to the core as that changes (`sayHeld`).
 */

import {
  notebookAppend,
  notebookHold,
  notebookLoad,
  notebookReadableWrite,
  notebookSaveState,
  notebookSayHeld,
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

/** How long after a change to the notebook it is looked at which files its notes hold. */
const SAY_HELD_AFTER = 1000;

/** The files the notes held when that was last said to the core, or saved with the whole notebook. */
interface Said {
  files: string[];
}

/**
 * Says to the core which files the notes hold as that changes, and not
 * only when the whole notebook is saved: the synchronization judges by it
 * what is not to be taken from this device, and the sweep of the next run
 * what is to stay in the store. A second after any change to the document,
 * whoever made it, the list is worked out, and said where it is another
 * than was last said or saved.
 *
 * Nothing is said before `ready`, which is when the sweep of this run has
 * answered: the sweep judges by what was said before as well, so that a
 * page that read less than there is takes nothing a saved note holds. For
 * the same reason what the notes held when the notebook was read is not
 * said: `said` begins as that.
 */
function sayHeld(notebook: Notebook, said: Said, ready: Promise<void>) {
  let begun = false;
  let changed = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const look = () => {
    timer = undefined;
    if (notebook.closed) return;
    const files = notebook.summary().files;
    const before = said.files;
    if (files.length === before.length && files.every((hash, i) => hash === before[i])) return;
    said.files = files;
    notebookSayHeld(files).catch((error) => {
      // Not said: it is said with the next change.
      if (said.files === files) said.files = before;
      console.warn('which files the notes hold could not be said', error);
    });
  };
  const soon = () => {
    timer ??= setTimeout(look, SAY_HELD_AFTER);
  };
  notebook.doc.on('update', () => {
    if (begun) soon();
    else changed = true;
  });
  void ready.then(() => {
    begun = true;
    if (changed) soon();
  });
}

class TheNotebook {
  /** The notebook, once it has been read. */
  current = $state.raw<Notebook | null>(null);
  /** Why it could not be read, where it could not. */
  failure = $state<string | null>(null);
  /**
   * Whether its readable copy is written, and whether the files no note
   * holds are swept out of the store: both, but on a phone (stage 2 of
   * `docs/plans/an-app-for-android.md`), whose page sets them before
   * `open()`: nobody reads a copy in the app's own folder, and a phone
   * sweeps no file.
   */
  readable = true;
  sweeps = true;
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
    // It listens before it reads. What a round of the synchronization
    // writes while the notebook is read is in its log, perhaps after what
    // was read of it, and is told once: heard here and kept, it is applied
    // when the notebook has been read.
    const heard: Uint8Array[] = [];
    let read: Notebook | null = null;
    const unlisten = await onNotebookUpdate((update) => {
      if (read) read.applyFromWindow(update);
      else heard.push(update);
    }).catch((error) => {
      console.warn('the changes of other windows to the notebook are not heard', error);
      return () => {};
    });
    const said: Said = { files: [] };
    let notebook: Notebook;
    try {
      const loaded = await notebookLoad();
      // A notebook of a later form of the texts is not opened, as a project is not (ADR 0111).
      if (formOfStored(loaded.state, loaded.updates) > FORM)
        throw new LaterForm(t('notebook-later'));
      notebook = this.#made(said);
      notebook.load(loaded.state, loaded.updates);
    } catch (error) {
      // Asked again, it listens again.
      unlisten();
      throw error;
    }
    said.files = notebook.summary().files;
    let swept!: () => void;
    sayHeld(notebook, said, new Promise<void>((resolve) => (swept = resolve)));
    // What was heard meanwhile, and from now on every change as it comes.
    read = notebook;
    for (const update of heard) {
      try {
        notebook.applyFromWindow(update);
      } catch (error) {
        console.error('a change heard while the notebook was read could not be applied', error);
      }
    }
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
    // The notebook is given to whoever asked for it without waiting for the sweep.
    if (this.sweeps)
      notebookSweep(notebook.summary().files)
        .catch((error) => console.warn('the files no note holds could not be swept', error))
        .then(() => swept());
    else swept();
    this.failure = null;
    this.current = notebook;
    return notebook;
  }

  /** A notebook that is written through the shell, with nothing read into it yet. */
  #made(said: Said): Notebook {
    return new Notebook(
      {
        append: (update, _here, time) => notebookAppend(update, time),
        saveState: async (state, summary) => {
          await notebookSaveState(state, summary);
          said.files = summary.files;
        },
        ...(this.readable && {
          readable: (nb: Notebook) => {
            const { org, pictures, files } = orgOfNotebook(nb);
            return notebookReadableWrite(org, pictures, files);
          },
        }),
      },
      {
        hold: (hashes) => {
          notebookHold(hashes).catch((error) =>
            console.warn('the files a note holds could not be said to the store', error),
          );
        },
      },
    );
  }

  /** The notebook as the holder of the texts of its notes, once it is open. */
  holder(): TextHolder | null {
    return this.current ? holderOfNotebook(this.current) : null;
  }
}

export const theNotebook = new TheNotebook();
