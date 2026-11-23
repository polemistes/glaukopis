/**
 * What waits in the notebook's inbox, taken in on the phone: when the page
 * starts and when the app comes back to the front (stage 2 of
 * `docs/plans/an-app-for-android.md`). What the page of a note sent in the
 * trial and in stage 1 lies there and becomes notes. Nothing is said: the
 * notes stand at the top of the list, not looked at. One taking at a time,
 * as on a computer (`notebook/arriving.svelte.ts`): what is asked while one
 * is made is taken right after it. Where nothing waits, the notebook is not
 * even opened.
 */

import { notebookInboxTake, notebookInboxWaiting, type InboxItem } from '$lib/api/notebook';
import { notesOfInbox } from '$lib/notebook/inbox';
import type { Notebook } from '$lib/notebook/model/notebook.svelte';
import { theNotebook } from '$lib/notebook/open.svelte';

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
    const ids = notesOfInbox(notebook, items);
    await notebook.flush().catch(() => {});
    return ids;
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
