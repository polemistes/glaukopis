/**
 * What goes from a file read in Glaukopis into the notebook (the plan,
 * stage 3): words selected in the pages of a PDF, joined into running text,
 * or a part of a page or of an image marked with the pointer, as a picture.
 * Each is a new note in the first box, with the file's reference and the
 * page as its source, or the file itself and the page where it belongs to
 * no reference. The notebook does not come to hold the file read: only
 * the words, or the picture of the part marked.
 */

import { notebookTakeImage } from '$lib/api/notebook';
import { t } from '$lib/i18n';
import { router } from '$lib/state/router.svelte';
import { toasts } from '$lib/ui/toast.svelte';
import { toBase64 } from '$lib/util/base64';
import { safeFileName } from '$lib/util/file-name';
import type { NewSource } from './model/types';
import { theNotebook } from './open.svelte';
import { figureOf, holdTaken } from './taking';

// ---- the words selected ----

/** A line that ends in a hyphen after a letter: a word, or a compound, broken at the line's end. */
const BROKEN = /\p{L}[-\u2010]$/u;
/** A soft hyphen, which is never seen but where a line breaks at it. */
const SOFT = /\u00ad$/;
const SMALL = /^\p{Ll}/u;

/**
 * Lines as they read joined into running text: a line that ends in a
 * hyphen and is followed by one that begins with a small letter is joined
 * without the hyphen; one that ends in a hyphen before anything else keeps
 * it, joined without a space (a compound, as *North-American*); other lines
 * are joined with a space. An empty line parts paragraphs, which are given
 * with an empty line between them. Nothing else is changed, but the
 * whitespace at the ends of each line.
 */
export function joinLines(lines: string[]): string {
  const paragraphs: string[] = [];
  let current = '';
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      if (current) paragraphs.push(current);
      current = '';
    } else if (!current) current = line;
    else if (SOFT.test(current)) current = current.slice(0, -1) + line;
    else if (BROKEN.test(current))
      current = SMALL.test(line) ? current.slice(0, -1) + line : current + line;
    else current = `${current} ${line}`;
  }
  if (current) paragraphs.push(current);
  return paragraphs.join('\n\n');
}

/** The lines of the text over the pages within a root, in the order they stand. */
const LINES = '[data-page-text] .line';

/** Where a line stands on its page, and how high it is: in fractions of the page, as the text layer places it. */
function placed(line: HTMLElement): { page: Element | null; top: number; height: number } {
  return {
    page: line.closest('[data-page-text]'),
    top: parseFloat(line.style.top) || 0,
    height: parseFloat(line.style.height) || 0,
  };
}

/** The part of a line within a range, as it reads. */
function partIn(line: HTMLElement, range: Range): string {
  const own = line.ownerDocument.createRange();
  own.selectNodeContents(line);
  if (range.compareBoundaryPoints(Range.START_TO_START, own) > 0)
    own.setStart(range.startContainer, range.startOffset);
  if (range.compareBoundaryPoints(Range.END_TO_END, own) < 0)
    own.setEnd(range.endContainer, range.endOffset);
  return own.toString();
}

/** The lines of the text over the pages that a range reaches. */
function linesIn(root: ParentNode, range: Range): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(LINES)).filter((line) =>
    range.intersectsNode(line),
  );
}

/**
 * The lines of the pages a range takes in, each as much of it as the range
 * holds, with an empty line where a paragraph ends: where the room between
 * two lines of a page is larger than a line, and larger than the room
 * between its lines usually is. A line the range takes nothing of is left
 * out.
 */
export function selectedLines(root: ParentNode, range: Range): string[] {
  const lines = linesIn(root, range);
  const at = lines.map(placed);
  const gapOf = (i: number) =>
    i > 0 && at[i].page === at[i - 1].page ? at[i].top - (at[i - 1].top + at[i - 1].height) : null;
  const gaps = at
    .map((_, i) => gapOf(i))
    .filter((g): g is number => g !== null && g >= 0)
    .sort((a, b) => a - b);
  const usual = gaps.length ? gaps[Math.floor(gaps.length / 2)] : 0;
  const out: string[] = [];
  lines.forEach((line, i) => {
    const words = partIn(line, range);
    if (!words.trim()) return;
    const gap = gapOf(i);
    const high = Math.max(at[i].height, at[i - 1]?.height ?? 0);
    if (out.length && gap !== null && gap > 0.9 * high && gap > 1.8 * usual) out.push('');
    out.push(words);
  });
  return out;
}

/** The page a node stands on, counted from one; none for one on no page. */
function pageOf(node: Node): number | null {
  const el = node.nodeType === 1 ? (node as Element) : node.parentElement;
  const page = el?.closest<HTMLElement>('[data-page]');
  const n = Number(page?.dataset.page);
  return Number.isInteger(n) && n > 0 ? n : null;
}

/**
 * The pages a selection is on: the first and the last, from the nodes at
 * its ends; where an end lies on no page, from the lines it takes in.
 */
export function pagesOf(root: ParentNode, range: Range): [number, number] | null {
  let first = pageOf(range.startContainer);
  let last = pageOf(range.endContainer);
  if (first === null || last === null) {
    const met = linesIn(root, range)
      .map(pageOf)
      .filter((n): n is number => n !== null);
    first ??= met[0] ?? null;
    last ??= met[met.length - 1] ?? null;
  }
  if (first === null || last === null) return null;
  return first <= last ? [first, last] : [last, first];
}

/**
 * The place of pages as a citation takes it: the number a page has in
 * print, where the file tells it, else its count; for more than one page
 * the first and the last with a dash between (`233–234`).
 */
export function placeOf(labels: string[], first: number, last = first): string {
  const label = (n: number) => labels[n - 1]?.trim() || String(n);
  const from = label(first);
  const to = label(last);
  return from === to ? from : `${from}–${to}`;
}

// ---- the source ----

/** The reference chosen for a file that belongs to several, by its hash, while the application runs. */
const chosen = new Map<string, string>();

export const referenceChosen = {
  get: (hash: string): string | null => chosen.get(hash) ?? null,
  set: (hash: string, reference: string) => void chosen.set(hash, reference),
};

/**
 * The source of what is taken from a file: its reference, where it belongs
 * to one, or the one chosen among several, with the place as its locator
 * (a page, as a locator without a label means); the file by its name, with
 * the place, where it belongs to none. None where it belongs to several and
 * none of them is chosen.
 */
export function sourceOf(
  file: { name: string; references: string[] },
  place: string | null,
  choice: string | null = null,
): NewSource | null {
  const locator = place ? { locator: place } : {};
  const { references } = file;
  if (!references.length) return { sort: 'file', name: file.name, ...locator };
  const reference =
    references.length === 1 ? references[0] : choice && references.includes(choice) ? choice : null;
  return reference ? { sort: 'reference', reference, ...locator } : null;
}

// ---- a part marked ----

export interface Point {
  x: number;
  y: number;
}

export interface PixelRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * The rectangle between two points of a picture, as the pointer went over
 * it where it is shown, in the picture's own pixels: each point kept within
 * the picture, the rectangle taking in every pixel it touches. None where
 * it holds no pixel.
 */
export function markedRect(
  a: Point,
  b: Point,
  shown: { width: number; height: number },
  pixels: { width: number; height: number },
): PixelRect | null {
  if (shown.width <= 0 || shown.height <= 0 || pixels.width <= 0 || pixels.height <= 0) return null;
  const within = (v: number, most: number) => Math.min(Math.max(v, 0), most);
  const sx = pixels.width / shown.width;
  const sy = pixels.height / shown.height;
  const left = Math.floor(within(Math.min(a.x, b.x), shown.width) * sx);
  const right = Math.ceil(within(Math.max(a.x, b.x), shown.width) * sx);
  const top = Math.floor(within(Math.min(a.y, b.y), shown.height) * sy);
  const bottom = Math.ceil(within(Math.max(a.y, b.y), shown.height) * sy);
  const width = Math.min(right, pixels.width) - left;
  const height = Math.min(bottom, pixels.height) - top;
  return width >= 1 && height >= 1 ? { x: left, y: top, width, height } : null;
}

/** A part of what a canvas holds, as the bytes of a PNG. */
export async function cutOut(canvas: HTMLCanvasElement, rect: PixelRect): Promise<Uint8Array> {
  const part = document.createElement('canvas');
  part.width = rect.width;
  part.height = rect.height;
  const context = part.getContext('2d');
  if (!context) throw new Error('no canvas to draw in');
  context.drawImage(canvas, rect.x, rect.y, rect.width, rect.height, 0, 0, rect.width, rect.height);
  const blob = await new Promise<Blob | null>((done) => part.toBlob(done, 'image/png'));
  if (!blob) throw new Error('the part could not be made a picture');
  return new Uint8Array(await blob.arrayBuffer());
}

/** The name of the picture of a part: the file's name without its ending, and the place. */
export function pictureName(fileName: string, place: string | null): string {
  const dot = fileName.lastIndexOf('.');
  const stem = dot > 0 ? fileName.slice(0, dot) : fileName;
  return `${safeFileName(place ? `${stem} ${place}` : stem, 'image')}.png`;
}

// ---- the note ----

/**
 * Words as a new note in the first box, taken in as one passage with their
 * source: each paragraph a paragraph of the note. One step of undo. Gives
 * the id of the note.
 */
export async function noteOfWords(text: string, source: NewSource): Promise<string> {
  const notebook = await theNotebook.open();
  const words = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .join('\n');
  notebook.checkpoint();
  const id = notebook.transact(() => {
    const id = notebook.addNote();
    const passage = notebook.addPassage(notebook.addSource(source), words);
    notebook.addText(id, words, passage);
    return id;
  });
  notebook.checkpoint();
  return id;
}

/**
 * A picture, as the bytes of a PNG, as a new note in the first box: taken
 * into the store, held by the notebook with its source, and shown as a
 * figure. One step of undo. Gives the id of the note.
 */
export async function noteOfPicture(
  name: string,
  png: Uint8Array,
  source: NewSource,
): Promise<string> {
  const taken = await notebookTakeImage(name, toBase64(png));
  const shown = taken.shown;
  if (!shown) throw new Error(`${name} is no picture`);
  const notebook = await theNotebook.open();
  notebook.checkpoint();
  const id = notebook.transact(() => {
    const id = notebook.addNote();
    holdTaken(notebook, taken, notebook.addSource(source));
    notebook.addFigure(id, figureOf(shown));
    return id;
  });
  notebook.checkpoint();
  return id;
}

/** Says that a note was added, with Show, which goes to it in the notebook. */
export function sayAdded(note: string) {
  toasts.show({
    kind: 'ok',
    message: t('notebook-from-file-added'),
    action: { label: t('common-show'), run: () => router.go({ view: 'notebook', note }) },
  });
}
