/**
 * Pages printed through the window's own page (record 0075). The pictures of
 * the pages are laid into the page in a container that the screen never
 * shows, and a style for print shows that container alone, each page one
 * sheet of its size with no margins; the system's dialog prints it, and the
 * container leaves the page when the printing is over. Since the page has no
 * margins, no browser has room to write a title or a date on it.
 */

import { printPagesCommand } from '$lib/api/printing';

/** A page to be printed: its picture, and its size in points. */
export interface PrintablePage {
  url: string;
  width: number;
  height: number;
}

/** The id of the container of the pages. */
export const PRINT_PAGES_ID = 'print-pages';

/** A length in points, as CSS writes it. */
function pt(n: number): string {
  return `${Math.round(n * 100) / 100}pt`;
}

/**
 * So much shorter than the paper each sheet is made: a sheet of the paper's
 * height to the last fraction spills that fraction onto a sheet of its own,
 * and every page is followed by an empty one. The point is taken from the
 * foot of the page, in its margin, rather than shrinking the page.
 */
const SLACK = 1;

/** The paper of a printing: the first page's size, or A4 where there is none. */
export function paperOf(pages: readonly { width: number; height: number }[]): [number, number] {
  const first = pages[0];
  return first ? [first.width, first.height] : [595.28, 841.89];
}

/** The style that prints the pages, on paper of the size given. */
export function printStyle([width, height]: readonly [number, number]): string {
  const id = `#${PRINT_PAGES_ID}`;
  return [
    `${id} { display: none; }`,
    '@media print {',
    `  @page { size: ${pt(width)} ${pt(height)}; margin: 0; }`,
    '  html, body { height: auto !important; min-height: 0 !important; overflow: visible !important;',
    '    margin: 0 !important; padding: 0 !important; background: white !important; }',
    `  body > :not(${id}) { display: none !important; }`,
    `  ${id} { display: block !important; }`,
    `  ${id} .page { width: ${pt(width)}; height: ${pt(height - SLACK)}; overflow: hidden;`,
    '    display: flex; align-items: flex-start; justify-content: center; }',
    `  ${id} .page + .page { break-before: page; page-break-before: always; }`,
    `  ${id} img { display: block; flex: none; }`,
    '}',
  ].join('\n');
}

/**
 * The pages as elements of the container: each at its own size where it
 * fits on the paper; one larger, made smaller to fit, keeping its proportions.
 */
export function pageElements(
  pages: readonly PrintablePage[],
  [width, height]: readonly [number, number],
): HTMLElement[] {
  return pages.map((page) => {
    const sheet = document.createElement('div');
    sheet.className = 'page';
    const fits = page.width <= width + SLACK && page.height <= height + SLACK;
    const scale = fits ? 1 : Math.min(width / page.width, (height - SLACK) / page.height);
    const picture = document.createElement('img');
    picture.alt = '';
    picture.style.width = pt(page.width * scale);
    picture.style.height = pt(page.height * scale);
    picture.src = page.url;
    sheet.append(picture);
    return sheet;
  });
}

/** The container of the last printing and the URLs it holds, until it is let go. */
let held: { container: HTMLElement; urls: string[] } | null = null;

/** Takes the pages of the last printing out of the page, and lets go of their pictures. */
function letGo() {
  if (!held) return;
  held.container.remove();
  for (const url of held.urls) URL.revokeObjectURL(url);
  held = null;
}

/**
 * Prints the pages through the system's dialog, the job named `name`. The
 * pages' URLs are taken over: they are let go of when the pages leave the
 * page. Where the system says when the printing is over (Linux), the pages
 * leave then; elsewhere when the page is told it was printed, or at the next
 * printing, so that the system never draws from pages that are gone. With
 * `toFile`, on Linux, to a PDF at that path with no dialog.
 */
export async function printPages(
  pages: readonly PrintablePage[],
  name: string,
  toFile?: string,
): Promise<void> {
  letGo();
  const container = document.createElement('div');
  container.id = PRINT_PAGES_ID;
  container.setAttribute('aria-hidden', 'true');
  const paper = paperOf(pages);
  const style = document.createElement('style');
  style.textContent = printStyle(paper);
  container.append(style, ...pageElements(pages, paper));
  document.body.append(container);
  held = { container, urls: pages.map((p) => p.url) };
  const mine = held;

  await Promise.all(
    [...container.querySelectorAll('img')].map((img) => img.decode().catch(() => {})),
  );
  const title = document.title;
  document.title = name;
  let over: boolean;
  try {
    over = await printPagesCommand({ width: paper[0], height: paper[1] }, toFile ?? null);
  } catch (e) {
    if (held === mine) letGo();
    throw e;
  } finally {
    document.title = title;
  }
  if (over) {
    if (held === mine) letGo();
  } else {
    window.addEventListener('afterprint', () => held === mine && letGo(), { once: true });
  }
}

/**
 * The size of a page drawn as SVG, in points, from its `viewBox`, which Typst
 * writes in points; nothing where it has none.
 */
export function svgSize(svg: string): [number, number] | null {
  const head = svg.slice(0, 600);
  const box = /viewBox="\s*[-\d.]+[\s,]+[-\d.]+[\s,]+([\d.]+)[\s,]+([\d.]+)\s*"/.exec(head);
  if (!box) return null;
  const width = Number(box[1]);
  const height = Number(box[2]);
  return width > 0 && height > 0 ? [width, height] : null;
}
