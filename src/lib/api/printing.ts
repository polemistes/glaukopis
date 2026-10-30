/**
 * Printing (record 0075): the window's page printed through the system's
 * dialog. Mirrors `src-tauri/src/commands/printing.rs`.
 */

import { call } from './backend';

/** The size of the pages to be printed, in points. */
export interface Paper {
  width: number;
  height: number;
}

/**
 * Prints the window's page through the system's dialog, the paper set to
 * `paper` where the system lets it be; with `toFile`, on Linux, to a PDF at
 * that path with no dialog, for the e2e scripts. Whether the printing is
 * over when it returns: on Linux it is; elsewhere the dialog was only asked for.
 */
export const printPagesCommand = (paper: Paper | null, toFile: string | null) =>
  call<boolean>('print_pages', { paper, toFile });

/** The paper the system prints on where nothing else is asked, on which a picture is printed: GTK's, on Linux; nothing elsewhere. */
export const printPaper = () => call<Paper | null>('print_paper');
