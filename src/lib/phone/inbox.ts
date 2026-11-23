/**
 * What waits in the notebook's inbox, taken in on the phone: when the page
 * starts and when the app comes back to the front (stage 2 of
 * `docs/plans/an-app-for-android.md`). What the page of a note sent in the
 * trial and in stage 1 lies there and becomes notes. Nothing is said: the
 * notes stand at the top of the list, not looked at. One taking at a time,
 * as on a computer (`notebook/arriving.svelte.ts`): what is asked while one
 * is made is taken right after it. Where nothing waits, the notebook is not
 * even opened.
 *
 * Which note was made of which thing is kept for the run (`noteOfThing`), so
 * that the page can go to the note of what another app shared (stage 3, `asked.ts`).
 */

import { notebookInboxTake, notebookInboxWaiting, type InboxItem } from '$lib/api/notebook';
import { madeOfInbox } from '$lib/notebook/inbox';
import type { Notebook } from '$lib/notebook/model/notebook.svelte';
import { theNotebook } from '$lib/notebook/open.svelte';

/** The note made of each thing taken from the inbox in this run, by the name of the thing there. */
const notesOfThings = new Map<string, string>();

/** The note made in this run of a thing that lay in the inbox, by its name there; none where it made none, or was not taken in this run. */
export function noteOfThing(thing: string): string | undefined {
  return notesOfThings.get(thing);
}

/** Takes what lies in the inbox, once; gives the notes made. */
async function takeOnce(): Promise<string[]> {
  try {
    if (!(await notebookInboxWaiting())) return [];
  } catch (error) {
    console.warn('the inbox of the notebook could not be looked at', error);
    return [];
  }
  // The notebook first: what lies in the inbox stays there until the
  // notebook is there to receive it. Where it cannot be read, its place says so.
  let notebook: Notebook;
  try {
    notebook = await theNotebook.open();
  } catch (error) {
    console.warn('the inbox waits: the notebook could not be read', error);
    return [];
  }
  let items: InboxItem[];
  try {
    items = await notebookInboxTake();
  } catch (error) {
    console.warn('what came into the notebook could not be taken', error);
    return [];
  }
  if (!items.length) return [];
  try {
    const made = madeOfInbox(notebook, items);
    for (const { thing, note } of made) if (thing) notesOfThings.set(thing, note);
    await notebook.flush().catch(() => {});
    return made.map((m) => m.note);
  } catch (error) {
    console.error('what came into the notebook could not be made notes', error);
    return [];
  }
}

let taking: Promise<void> | null = null;
let again = false;

/** Takes what lies in the inbox; asked while a taking is made, it takes again right after. */
export function takeInbox(): Promise<void> {
  if (taking) {
    again = true;
    return taking;
  }
  taking = (async () => {
    try {
      do {
        again = false;
        await takeOnce();
      } while (again);
    } finally {
      taking = null;
    }
  })();
  return taking;
}
