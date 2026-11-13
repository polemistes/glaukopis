/**
 * The document of a side printed, with the typesetting pane open or not
 * (records 0075 and 0091). Where the pane is open and shows the side's
 * document, its pages are made already and the pane prints them; otherwise
 * the document is set out of sight, printed, and let go of. Fetching the
 * pages in batches and handing them to the page is one function, used by
 * both ways.
 */

import {
  documentPreviewStop,
  documentPreviewWhole,
  documentPrintPages,
  type DocumentRequest,
} from '$lib/api/documents';
import { t } from '$lib/i18n';
import { documentRequest, documents } from '$lib/preview/documents.svelte';
import type { Project } from '$lib/project/model/project.svelte';
import { panes } from '$lib/project/panes.svelte';
import { notifyError, toasts } from '$lib/ui/toast.svelte';
import { printPages, svgSize, type PrintablePage } from './pages';

/** So many pages are asked of the core at a time for printing. */
export const PRINT_BATCH = 24;

/** What was printed: how many pages, and the size of the first in points. */
export interface Printed {
  count: number;
  width: number;
  height: number;
}

/**
 * The pages of a document the core has set for `key`, printed through the
 * system's dialog: fetched `PRINT_BATCH` at a time, with a notice that counts
 * them, and handed to the page, which takes over their pictures. `size` is
 * that of a page where a page does not say its own. With `cancelled`, the
 * fetching ends where it says so, and nothing is printed. `fetched` is
 * waited for once every page is fetched and before the dialog opens, which
 * may stay open as long as the writer likes: what kept the document set may
 * let go of it then. With `toFile`, to a PDF there with no dialog, for the
 * e2e scripts. Fails with what failed; the notice and the pictures are let
 * go of in every case.
 */
export async function printSetPages(
  key: string,
  count: number,
  size: { width: number; height: number },
  name: string,
  {
    toFile,
    cancelled,
    fetched,
  }: { toFile?: string; cancelled?: () => boolean; fetched?: () => Promise<void> } = {},
): Promise<Printed | null> {
  const notice = toasts.show({ kind: 'info', message: t('preview-print-preparing', { count }) }, 0);
  const urls: string[] = [];
  try {
    const pages: PrintablePage[] = [];
    for (let from = 1; from <= count; from += PRINT_BATCH) {
      const got = await documentPrintPages(key, from, Math.min(count, from + PRINT_BATCH - 1));
      if (cancelled?.()) return null;
      for (const page of got) {
        const url = URL.createObjectURL(new Blob([page.svg], { type: 'image/svg+xml' }));
        urls.push(url);
        const [width, height] = svgSize(page.svg) ?? [size.width, size.height];
        pages.push({ url, width, height });
      }
    }
    toasts.dismiss(notice);
    await fetched?.();
    // The pictures are the printing's from here: it lets go of them when it is over.
    urls.length = 0;
    await printPages(pages, name, { toFile });
    return { count: pages.length, width: pages[0]?.width ?? 0, height: pages[0]?.height ?? 0 };
  } finally {
    toasts.dismiss(notice);
    for (const url of urls) URL.revokeObjectURL(url);
  }
}

/**
 * A page that no document has. The core sets a document when it is asked
 * for pages of it, and draws, with the runs of their text, those it is asked
 * for, and all of them where it is asked for none; asked for this one it sets
 * the document, says how many pages it has, and draws none. The pages for the
 * printing are fetched afterwards, as they are wanted (`documentPrintPages`).
 */
export const NO_PAGE = 4_294_967_295;

/**
 * The key a document is set under to be printed out of sight: its own, so
 * that the document the typesetting pane keeps for the project is not
 * replaced.
 */
export const printKey = (projectId: string) => `${projectId}-print`;

/**
 * The request for the document of an element, once what it is made by (its
 * template, its layout and the styles) has been read: what an export and the
 * printing out of sight are made from.
 */
export async function requestOf(
  project: Project,
  projectId: string,
  at: string,
): Promise<DocumentRequest> {
  await documents.choiceRead(project.documentOf(at).settings, project);
  return documentRequest(project, projectId, at);
}

/** Whether a document is being set for printing out of sight: never two at once. */
let printing = false;

/**
 * Prints the document of an element without the typesetting pane: set out of
 * sight under a key of its own, printed through the system's dialog, and
 * let go of in every case, as soon as its pages are fetched or at the latest
 * when the printing is over or has failed, so that the core does not go on
 * keeping the set document of a whole book (record 0087). A notice says at once that the
 * pages are being set; where they cannot be, a notice says so and nothing is
 * printed. Nothing while another is being set. With `toFile`, to a PDF there
 * with no dialog, for the e2e scripts. What was printed: how many pages, and
 * the size of the first.
 */
export async function printDocument(
  project: Project,
  projectId: string,
  at: string,
  toFile?: string,
): Promise<Printed | null> {
  if (printing) return null;
  printing = true;
  const key = printKey(projectId);
  const notice = toasts.show({ kind: 'info', message: t('project-print-setting') }, 0);
  let kept = false;
  const letGo = async () => {
    if (!kept) return;
    kept = false;
    await documentPreviewStop(key).catch(() => {});
  };
  try {
    const request = await requestOf(project, projectId, at);
    kept = true;
    const set = await documentPreviewWhole({ ...request, key }, [NO_PAGE]);
    toasts.dismiss(notice);
    if (!set.count) return null;
    return await printSetPages(
      key,
      set.count,
      { width: set.width, height: set.height },
      project.node(at)?.title || t('preview-file-name'),
      { toFile, fetched: letGo },
    );
  } catch (e) {
    notifyError(t('preview-print-failed'), e);
    return null;
  } finally {
    toasts.dismiss(notice);
    // Let go of whatever is not yet, before another printing may begin: it sets under the same key.
    await letGo();
    printing = false;
  }
}

/** What the typesetting pane does for printing, while it is open. */
export interface PrintingPane {
  /** Prints the document the pane shows, as its pages are made. */
  print(toFile?: string): Promise<Printed | null>;
}

/** The typesetting pane, while it is open. */
let pane: PrintingPane | null = null;

/** Says that the typesetting pane is open and prints; the function it gives back says that it is not. */
export function paneOpened(open: PrintingPane): () => void {
  pane = open;
  return () => {
    if (pane === open) pane = null;
  };
}

/**
 * Prints the document of a side: through the typesetting pane where it is
 * open for this side, its pages being made; else out of sight, the pane
 * staying as it is (record 0091). `at` is the document of the side.
 */
export function printSide(
  side: { key: string; project: string },
  project: Project,
  at: string,
  toFile?: string,
): Promise<Printed | null> {
  if (pane && panes.typesetting === side.key) return pane.print(toFile);
  return printDocument(project, side.project, at, toFile);
}
