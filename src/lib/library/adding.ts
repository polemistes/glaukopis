/**
 * The ways references are brought in from files and text, as the items of a
 * menu. The Library page and the lists of the document pane add references
 * in the same ways (record 0095), so the four stand here and both call them.
 */

import ClipboardPaste from '@lucide/svelte/icons/clipboard-paste';
import FileText from '@lucide/svelte/icons/file-text';
import FileUp from '@lucide/svelte/icons/file-up';
import LibraryBig from '@lucide/svelte/icons/library-big';
import type { ImportOutcome } from '$lib/api/library';
import { t } from '$lib/i18n';
import type { MenuItem } from '$lib/ui/menu.svelte';
import { importFile, importFromZotero, importPasted, importPdfFiles } from './references.svelte';

/**
 * Import Bib(La)TeX…, Import from Zotero…, Paste… and Add PDF files…, in this
 * order. What is brought in goes into the collection, where there is one.
 * `then` is told what came of each, once it is done: `null` where nothing was
 * brought in or the import was given up.
 */
export function addingItems(
  collection?: string | null,
  then?: (outcome: ImportOutcome | null) => void,
): MenuItem[] {
  const done = (outcome: Promise<ImportOutcome | null>) => void outcome.then((o) => then?.(o));
  return [
    {
      label: t('library-import-bibtex'),
      icon: FileUp,
      action: () => done(importFile(collection)),
    },
    {
      label: t('library-import-zotero'),
      icon: LibraryBig,
      action: () => done(importFromZotero(collection)),
    },
    {
      label: t('library-paste'),
      icon: ClipboardPaste,
      action: () => done(importPasted(collection)),
    },
    {
      label: t('library-add-pdfs'),
      icon: FileText,
      action: () => done(importPdfFiles(undefined, collection)),
    },
  ];
}
