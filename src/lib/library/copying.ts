/**
 * What the library copies to the clipboard: a citation key, references as
 * BibLaTeX. What is copied may have to be asked of the core first, and the
 * clipboard may refuse; either way the writer is told, and "Copied" is said
 * only when it was.
 */

import { t } from '$lib/i18n';
import { notifyError, notifyOk } from '$lib/ui/toast.svelte';

export async function copyOut(
  text: () => string | Promise<string>,
  done: string,
): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(await text());
  } catch (error) {
    notifyError(t('library-copy-failed'), error);
    return false;
  }
  notifyOk(done);
  return true;
}
