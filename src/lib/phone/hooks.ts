/**
 * The hooks the e2e scripts reach the phone's page by
 * (`window.__glaukopisPhone`), set only where the harness asked for hooks
 * (`shell/testing.ts`). Each acts through the model, as the page does, and
 * each is one step of undo. `back` is what Android's Back does, which a
 * computer has no key for; `asked` answers as if the Android part had said
 * what was asked of the page. A note adds `picture` and `file` to the same
 * object, which put a picture and a file into the note in view
 * (`NoteView.svelte`).
 */

import type { Notebook } from '$lib/notebook/model/notebook.svelte';
import { theNotebook } from '$lib/notebook/open.svelte';
import { testHook } from '$lib/shell/testing';
import { answer, type Asked } from './asked';
import { places } from './places.svelte';

/** What a note is made with by the hook. */
export interface MadeNote {
  name?: string;
  words?: string;
  box?: string;
  tags?: string[];
}

/** The notebook, which a hook needs read. */
function read(): Notebook {
  const notebook = theNotebook.current;
  if (!notebook) throw new Error('the notebook is not read yet');
  return notebook;
}

/** A change to the notebook in one step of undo. */
function step<T>(notebook: Notebook, change: () => T): T {
  notebook.checkpoint();
  const done = change();
  notebook.checkpoint();
  return done;
}

/** The hooks, as they are set on `window`. */
export const phoneHooks = {
  /** Makes a box, and gives its id. */
  box(name: string): string {
    const notebook = read();
    return step(notebook, () => notebook.addBox(name));
  },
  /** Makes a note, its words each line a paragraph, and gives its id. */
  note(made: MadeNote): string {
    const notebook = read();
    return step(notebook, () => {
      const id = notebook.addNote({ name: made.name, box: made.box, tags: made.tags });
      if (made.words) notebook.addText(id, made.words);
      return id;
    });
  },
  /** Deletes a note. */
  remove(note: string): void {
    const notebook = read();
    step(notebook, () => notebook.deleteNotes([note]));
  },
  /** Android's Back. */
  back(): void {
    places.back();
  },
  /** Answers what the Android part would say was asked: the things arrived, and whether a new note is asked for. */
  asked(asked: Partial<Asked>): Promise<void> {
    return answer({ arrived: asked.arrived ?? [], note: asked.note ?? false });
  },
};

/** Sets the hooks, where the harness asked for them. */
export function setPhoneHooks() {
  testHook('__glaukopisPhone', { ...phoneHooks });
}
