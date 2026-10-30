/**
 * A file of the library printed (record 0075): its pages drawn at the
 * resolution print wants and laid into the window's page for the system's
 * dialog (`pages.ts`). One way for every place a file is printed from: a side
 * of the window, the reader of the files view, and the menu of a file among
 * the files of the library.
 */

import { isBackendError } from '$lib/api/backend';
import { ocrStop } from '$lib/api/ocr';
import { printPaper } from '$lib/api/printing';
import { filePage, type FileFacts } from '$lib/api/viewer';
import { files } from '$lib/files/store.svelte';
import { t } from '$lib/i18n';
import { notifyError, toasts } from '$lib/ui/toast.svelte';
import { newId } from '$lib/util/id';
import { printPages, type PrintablePage } from './pages';

/** The resolution the pages of a file are drawn at for printing, and a picture is taken to have. */
const PRINT_DPI = 300;
/** So many pages are drawn at once, as the view draws them. */
const PRINT_AT_ONCE = 2;
/** A4, in points: the paper of a picture where the system says none. */
const A4: [number, number] = [595.28, 841.89];

/** What was printed: how many pages, and the size of the first in points. */
export interface Printed {
  count: number;
  width: number;
  height: number;
}

/** Whether a file is being drawn or printed: never two at once. */
let printing = false;

/** Whether a file can be printed at all: one that is shown, and not locked. */
export function printable(facts: FileFacts | null | undefined): facts is FileFacts {
  return !!facts && !facts.locked && facts.pages > 0;
}

/**
 * Draws the pages `from` to `to` of a file of the library at the resolution
 * print wants, and prints them through the system's dialog: a PDF on paper
 * of its first page's size, a picture on the system's paper, fitted where it
 * is larger. With `toFile`, to a PDF there with no dialog, for the e2e
 * scripts. Nothing while another file is being printed. A notice counts the
 * pages while they are drawn, and can stop them.
 */
export async function printFile(
  hash: string,
  facts: FileFacts,
  from: number,
  to: number,
  toFile?: string,
): Promise<Printed | null> {
  if (printing) return null;
  printing = true;
  const ticket = newId();
  let stopped = false;
  const numbers = Array.from({ length: Math.max(0, to - from + 1) }, (_, i) => from + i);
  const notice = toasts.show(
    {
      kind: 'info',
      message: t('viewer-print-drawing', { count: numbers.length }),
      action: {
        label: t('viewer-print-stop'),
        run: () => {
          stopped = true;
          void ocrStop(ticket).catch(() => {});
        },
      },
    },
    0,
  );
  const drawn = new Map<number, PrintablePage>();
  try {
    let next = 0;
    const drawing = async () => {
      while (!stopped && next < numbers.length) {
        const n = numbers[next++];
        const [w, h] = facts.sizes[n - 1] ?? facts.sizes[0];
        // A page of a PDF is measured in points; a picture, in its pixels.
        const dots = facts.picture ? Math.round(w) : Math.round((w / 72) * PRINT_DPI);
        const bytes = await filePage(hash, n, dots, ticket);
        const url = URL.createObjectURL(new Blob([bytes], { type: 'image/png' }));
        const size = facts.picture ? [(w * 72) / PRINT_DPI, (h * 72) / PRINT_DPI] : [w, h];
        drawn.set(n, { url, width: size[0], height: size[1] });
      }
    };
    await Promise.all(Array.from({ length: PRINT_AT_ONCE }, drawing));
    if (stopped) return null;
    toasts.dismiss(notice);
    const pages = numbers.map((n) => drawn.get(n)!);
    // The pictures are the printing's from here: it lets go of them when it is over.
    drawn.clear();
    const paper = facts.picture ? await printPaper().catch(() => null) : null;
    await printPages(pages, files.get(hash)?.name ?? facts.name, {
      toFile,
      ...(facts.picture ? { paper: paper ? [paper.width, paper.height] : A4 } : {}),
    });
    return { count: pages.length, width: pages[0].width, height: pages[0].height };
  } catch (e) {
    if (!stopped && !(isBackendError(e) && e.kind === 'stopped'))
      notifyError(t('viewer-print-failed'), e);
    return null;
  } finally {
    toasts.dismiss(notice);
    for (const page of drawn.values()) URL.revokeObjectURL(page.url);
    printing = false;
  }
}
