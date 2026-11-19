/**
 * The text of a note written in a window of its own (record 0109), on both
 * sides of the notebook's inbox: as the window hands it over
 * (`noteTextOf`), and as the application reads it again, with care
 * (`readNoteDoc`), since what comes through the inbox is a file that
 * anything could have written. The note is a text of the body schema, as
 * the notes of the notebook are; what is read of it is what the window
 * makes: paragraphs of every kind with the lists among them, line breaks,
 * the marks of words, links, pictures and files, and boxes of rich text
 * around any of them. A citation, a note, a formula, a cross-reference, a
 * table and the like are left out.
 */

import { Node } from 'prosemirror-model';
import type { NotebookFile } from '$lib/api/notebook';
import type { NoteText } from '$lib/api/notewindow';
import { bodySchema, safeHref } from '$lib/editor/schema';
import { fileEnding } from '$lib/util/file-name';

/** The nodes the window makes, and so the nodes read of a note. */
const NODES = new Set(['doc', 'paragraph', 'text', 'hard_break', 'figure', 'row', 'file', 'rich']);

/** The marks of words the window makes, and so the marks read of a note. */
const MARKS = new Set([
  'em',
  'strong',
  'underline',
  'strike',
  'code',
  'sup',
  'sub',
  'smallcaps',
  'kind',
  'lang',
  'link',
]);

/** The endings of the files a note shows as pictures: those a figure shows as they are. */
const PICTURES = new Set(['png', 'jpg', 'jpeg', 'svg']);

/** Whether a file of a note stands in it as a picture, by the ending of its name. */
export function isPictureEnding(extension: string): boolean {
  return PICTURES.has(extension.toLowerCase());
}

/** How deep the text of a note is read: deeper is no text the window made. */
const DEEPEST = 32;

/** The words of a text as plain text: paragraphs parted by line breaks, and lines within them so; none at its ends. */
function wordsOf(doc: Node): string {
  return doc
    .textBetween(0, doc.content.size, '\n', (leaf) => (leaf.type.name === 'hard_break' ? '\n' : ''))
    .replace(/^\n+|\n+$/g, '');
}

/** The text of a note as the window hands it over: the document, its words, and the files it holds, each once. */
export function noteTextOf(doc: Node): NoteText {
  const files = new Map<string, string>();
  doc.descendants((node) => {
    if (node.type.name === 'figure' && node.attrs.file)
      files.set(String(node.attrs.file), String(node.attrs.name ?? ''));
    else if (node.type.name === 'file' && node.attrs.hash)
      files.set(String(node.attrs.hash), String(node.attrs.name ?? ''));
    return true;
  });
  return {
    doc: doc.toJSON(),
    words: wordsOf(doc),
    files: [...files].map(([hash, name]) => ({ hash, name })),
  };
}

/** Whether a note holds nothing: no words, and no file. */
export function isEmptyNote(text: Pick<NoteText, 'words' | 'files'>): boolean {
  return !text.words.trim() && !text.files.length;
}

type Json = Record<string, unknown>;

const isObject = (value: unknown): value is Json =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** The marks of a piece of text that the window makes, a link only where it may be followed. */
function keptMarks(marks: unknown): Json[] {
  if (!Array.isArray(marks)) return [];
  return marks.filter((mark): mark is Json => {
    if (!isObject(mark) || typeof mark.type !== 'string' || !MARKS.has(mark.type)) return false;
    if (mark.type !== 'link') return true;
    const href = isObject(mark.attrs) ? mark.attrs.href : null;
    return typeof href === 'string' && safeHref(href);
  });
}

/**
 * A node of the JSON of a note as it is read: of a kind the window makes,
 * a picture or a file pointing to what was taken into the store, and
 * nothing else of it; none where nothing is left.
 */
function kept(
  value: unknown,
  files: ReadonlyMap<string, NotebookFile>,
  depth: number,
): Json | null {
  if (depth > DEEPEST || !isObject(value) || typeof value.type !== 'string') return null;
  const type = value.type;
  if (!NODES.has(type)) return null;
  const attrs = isObject(value.attrs) ? { ...value.attrs } : {};
  if (type === 'text') {
    if (typeof value.text !== 'string' || !value.text) return null;
    return { type, text: value.text, marks: keptMarks(value.marks) };
  }
  if (type === 'figure') {
    const taken = files.get(String(attrs.file ?? ''));
    const shown = taken?.shown;
    if (!shown) return null;
    attrs.file = shown.hash;
    attrs.extension = fileEnding(shown.name);
    attrs.name = shown.name;
  }
  if (type === 'file') {
    const taken = files.get(String(attrs.hash ?? ''));
    if (!taken) return null;
    attrs.hash = taken.file.hash;
    attrs.name = taken.file.name;
    attrs.extension = fileEnding(taken.file.name);
    return { type, attrs };
  }
  const content = Array.isArray(value.content)
    ? value.content.flatMap((child) => kept(child, files, depth + 1) ?? [])
    : [];
  // A row of pictures side by side that has lost them all is no row, and a box of rich text that holds nothing is none.
  if ((type === 'row' || type === 'rich') && !content.length) return null;
  return { type, attrs, content };
}

/**
 * The text of a note that came through the inbox, read with care: only
 * what the window makes, its pictures and files pointing to what was taken
 * into the store (by the hash the note names each by; a picture to what a
 * figure shows of it). None where it is no text of the body schema, or
 * nothing is left of it: the words, line by line, are what is had then.
 */
export function readNoteDoc(json: unknown, files: ReadonlyMap<string, NotebookFile>): Node | null {
  const doc = kept(json, files, 0);
  if (!doc || doc.type !== 'doc') return null;
  try {
    const node = Node.fromJSON(bodySchema, doc);
    node.check();
    return node.content.size ? node : null;
  } catch {
    return null;
  }
}
