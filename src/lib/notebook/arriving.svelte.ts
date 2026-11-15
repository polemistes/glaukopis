/**
 * What arrives from the plugin for Firefox (record 0102): the first window
 * of the application asks for what lies in the notebook's inbox when it
 * starts and whenever the shell says something has come, makes notes of
 * it, and says what arrived at the foot of the window, with **Show**,
 * which goes to the note. One taking at a time: what comes while one is
 * made is taken right after it. Where nothing has come, the notebook is
 * not even read.
 */

import {
  notebookInboxTake,
  notebookInboxWaiting,
  onNotebookInbox,
  type InboxItem,
} from '$lib/api/notebook';
import { t } from '$lib/i18n';
import { router } from '$lib/state/router.svelte';
import { notifyError, toasts } from '$lib/ui/toast.svelte';
import { notesOfInbox } from './inbox';
import { theNotebook } from './open.svelte';

/** What is said of what arrived: the page's title where one thing came, else how many. */
export function arrivedWords(items: InboxItem[], count: number): string {
  if (count !== 1) return t('notebook-arrived-many', { count });
  const title = items.find((i) => i.kind !== 'image' || i.image)?.title.trim() ?? '';
  return title ? t('notebook-arrived-from', { title }) : t('notebook-arrived');
}

/** Takes what lies in the inbox, once: notes made of it, and said. */
async function takeOnce() {
  // Nothing there: the notebook is not even read.
  try {
    if (!(await notebookInboxWaiting())) return;
  } catch (error) {
    console.warn('the inbox of the notebook could not be looked at', error);
    return;
  }
  // The notebook first: what lies in the inbox stays there until the
  // notebook is there to receive it.
  let notebook;
  try {
    notebook = await theNotebook.open();
  } catch (error) {
    notifyError(t('notebook-unreadable'), error);
    return;
  }
  let items: InboxItem[];
  try {
    items = await notebookInboxTake();
  } catch (error) {
    console.warn('what came into the notebook could not be taken', error);
    return;
  }
  if (!items.length) return;
  let ids: string[];
  try {
    ids = notesOfInbox(notebook, items);
    void notebook.flush().catch(() => {});
  } catch (error) {
    notifyError(t('notebook-unreadable'), error);
    return;
  }
  if (!ids.length) return;
  // The newest of them, on top of the list.
  const note = ids[ids.length - 1];
  toasts.show(
    {
      kind: 'ok',
      message: arrivedWords(items, ids.length),
      action: { label: t('common-show'), run: () => router.go({ view: 'notebook', note }) },
    },
    8000,
  );
}

let taking = false;
let again = false;

/** Takes what lies in the inbox; asked while a taking is made, it takes again right after. */
export async function takeInbox(): Promise<void> {
  if (taking) {
    again = true;
    return;
  }
  taking = true;
  try {
    do {
      again = false;
      await takeOnce();
    } while (again);
  } finally {
    taking = false;
  }
}

/**
 * Watches the inbox, for the first window: what lies there now is taken,
 * and what comes while the window is open. Gives what ends the watching.
 */
export function watchInbox(): () => void {
  let stop: (() => void) | null = null;
  let stopped = false;
  void takeInbox();
  onNotebookInbox(() => void takeInbox())
    .then((unlisten) => {
      if (stopped) unlisten();
      else stop = unlisten;
    })
    .catch((error) => console.warn('what comes into the notebook is not heard', error));
  return () => {
    stopped = true;
    stop?.();
  };
}
