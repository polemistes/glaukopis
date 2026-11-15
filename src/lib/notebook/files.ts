/**
 * The files the notes of the notebook hold, as the interface asks for
 * them: a file of the store by its hash, whether the library lists it or
 * not, and how one is opened (record 0101).
 */

import { notebookFile } from '$lib/api/notebook';
import type { FileView } from '$lib/api/files';
import { attachmentOpen } from '$lib/api/library';
import { t } from '$lib/i18n';
import { notifyError } from '$lib/ui/toast.svelte';
import { showFile } from '$lib/viewer/show';

const asked = new Map<string, Promise<FileView | null>>();

/** A file of the store as it is, asked for once and kept; nothing where the store has it not. */
export function heldFile(hash: string): Promise<FileView | null> {
  let file = asked.get(hash);
  if (!file) {
    file = notebookFile(hash).catch(() => null);
    asked.set(hash, file);
    // One that was not there may come: it is asked for again.
    void file.then((found) => {
      if (!found) asked.delete(hash);
    });
  }
  return file;
}

/**
 * Opens a file a note holds: a PDF or an image in a view of the window,
 * anything else in the program the system opens it with.
 */
export async function openHeldFile(hash: string) {
  const file = await heldFile(hash);
  if (!file?.exists) {
    notifyError(t('notebook-file-not-here'));
    return;
  }
  if (file.kind === 'pdf' || file.kind === 'picture') showFile(hash);
  else attachmentOpen(file.path).catch((e) => notifyError(t('library-file-open-failed'), e));
}
