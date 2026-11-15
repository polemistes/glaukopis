/**
 * What is taken into the notebook as whole notes: files added or dropped,
 * each a note of its own, and a paste outside any text (record 0101). What
 * is pasted or dropped into a text of a note is the holder's
 * (`holder.ts`); this is for what comes in beside the texts.
 */

import type { FileView } from '$lib/api/files';
import { notebookTakeFiles, notebookTakeImage, type NotebookFile } from '$lib/api/notebook';
import type { FigureOf } from '$lib/editor/commands';
import { t } from '$lib/i18n';
import { nowIso } from '$lib/project/model/origins';
import { notifyError } from '$lib/ui/toast.svelte';
import { toBase64 } from '$lib/util/base64';
import { fileEnding } from '$lib/util/file-name';
import { pastedPage, pastedPaths } from '$lib/util/paste';
import type { Notebook } from './model/notebook.svelte';
import type { NewSource } from './model/types';

/** What a figure shows of a file of the store. */
export function figureOf(file: FileView): FigureOf {
  return {
    hash: file.hash,
    extension: fileEnding(file.name),
    name: file.name,
    // In its pixels, as the library's images give it to a figure.
    width: file.width,
    alt: file.alt,
  };
}

/** The source a file taken in is: itself, as it says of itself. */
export function fileSourceOf(taken: NotebookFile): NewSource {
  return {
    sort: 'file',
    name: taken.file.name,
    ...(taken.time ? { time: taken.time } : {}),
    ...(taken.taken ? { taken: taken.taken } : {}),
    ...(taken.place ? { place: taken.place } : {}),
  };
}

/** Holds a file taken in, and the copy a figure shows of it where that is another, with one source. */
export function holdTaken(notebook: Notebook, taken: NotebookFile, source: string | null) {
  notebook.transact(() => {
    const { file, shown } = taken;
    notebook.holdFile(
      { hash: file.hash, name: file.name, extension: fileEnding(file.name) },
      source,
    );
    if (shown && shown.hash !== file.hash)
      notebook.holdFile(
        {
          hash: shown.hash,
          name: shown.name,
          extension: fileEnding(shown.name),
          madeFrom: shown.madeFrom ?? file.hash,
        },
        source,
      );
  });
}

/** Says what could not be taken in, in one message. */
function sayProblems(problems: string[]) {
  if (problems.length) notifyError(t('notebook-files-not-taken'), problems.slice(0, 4).join('\n'));
}

/**
 * Takes files of this computer into the notebook, each a note of its own
 * with the file as its source: an image a figure of what a figure shows
 * of it, any other file a file in the note. All in one step of undo. Gives
 * the ids of the notes, in the order of the files.
 */
export async function takeFiles(notebook: Notebook, paths: string[]): Promise<string[]> {
  if (!paths.length) return [];
  let taken: Awaited<ReturnType<typeof notebookTakeFiles>>;
  try {
    taken = await notebookTakeFiles(paths);
  } catch (error) {
    notifyError(t('notebook-files-not-taken'), error);
    return [];
  }
  // Made together, they stand in the list in the order they were given: the first of them on top.
  const now = Date.now();
  const made = (i: number) => new Date(now + taken.files.length - 1 - i).toISOString();
  const ids = notebook.transact(() =>
    taken.files.map((f, i) => {
      const id = notebook.addNote({ made: made(i) });
      const source = notebook.addSource(fileSourceOf(f));
      holdTaken(notebook, f, source);
      if (f.shown) notebook.addFigure(id, figureOf(f.shown));
      else
        notebook.addFile(id, {
          hash: f.file.hash,
          name: f.file.name,
          extension: fileEnding(f.file.name),
        });
      return id;
    }),
  );
  sayProblems(taken.problems);
  return ids;
}

/** The elements whose end begins a new line of the text of HTML. */
const BLOCKS = new Set([
  'P',
  'DIV',
  'LI',
  'TR',
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'BLOCKQUOTE',
  'PRE',
  'SECTION',
  'ARTICLE',
  'DT',
  'DD',
  'FIGCAPTION',
]);

/** The words of HTML as plain text: a line to each block and line break. */
export function htmlText(html: string): string {
  const body = new DOMParser().parseFromString(html, 'text/html').body;
  let out = '';
  const visit = (node: globalThis.Node) => {
    if (node.nodeType === 3) out += node.textContent ?? '';
    else if (node instanceof Element) {
      if (node.tagName === 'SCRIPT' || node.tagName === 'STYLE') return;
      if (node.tagName === 'BR') {
        out += '\n';
        return;
      }
      node.childNodes.forEach(visit);
      if (BLOCKS.has(node.tagName)) out += '\n';
    }
  };
  visit(body);
  return out
    .split('\n')
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n');
}

/** The pictures among the files of a paste, each with where it is on this computer, where it was copied as a file. */
function picturesOf(data: DataTransfer): { file: File; path: string | null }[] {
  const paths = pastedPaths(data);
  return Array.from(data.files ?? [])
    .map((file, i) => ({ file, path: paths[i] ?? null }))
    .filter(({ file, path }) => file.type.startsWith('image/') || !!path);
}

/**
 * A paste outside any text is a new note: the pictures among its files
 * figures in it, else its words its text, taken in one passage whose
 * source is the page the paste says it came from. Nothing where it holds
 * neither. Gives the id of the note.
 */
export async function takePasted(notebook: Notebook, data: DataTransfer): Promise<string | null> {
  const pictures = picturesOf(data);
  if (pictures.length) {
    const fromPaths: NotebookFile[] = [];
    const pasted: NotebookFile[] = [];
    const problems: string[] = [];
    const paths = pictures.flatMap((p) => (p.path ? [p.path] : []));
    try {
      if (paths.length) {
        const taken = await notebookTakeFiles(paths);
        fromPaths.push(...taken.files);
        problems.push(...taken.problems);
      }
      for (const { file } of pictures.filter((p) => !p.path)) {
        const content = toBase64(new Uint8Array(await file.arrayBuffer()));
        pasted.push(await notebookTakeImage(file.name || 'image.png', content));
      }
    } catch (error) {
      problems.push(error instanceof Error ? error.message : String(error));
    }
    const shown = [...fromPaths, ...pasted].filter((f) => f.shown);
    sayProblems(problems);
    if (!shown.length) return null;
    return notebook.transact(() => {
      const id = notebook.addNote();
      for (const f of fromPaths) holdTaken(notebook, f, notebook.addSource(fileSourceOf(f)));
      // Pasted as a picture: where it came from is given by hand.
      for (const f of pasted) holdTaken(notebook, f, null);
      for (const f of shown) notebook.addFigure(id, figureOf(f.shown!));
      return id;
    });
  }
  const plain = data.getData('text/plain');
  const html = data.getData('text/html');
  const words = (plain.trim() ? plain : html ? htmlText(html) : '').trim();
  if (!words) return null;
  const page = pastedPage(data);
  return notebook.transact(() => {
    const id = notebook.addNote();
    const source = page
      ? notebook.addSource({ sort: 'web', url: page, title: '', read: nowIso() })
      : null;
    // As the note's paragraphs hold it: a line to each, none empty.
    const lines = words.split(/\r?\n/).filter((l) => l.trim());
    const passage = notebook.addPassage(source, lines.join('\n'));
    notebook.addText(id, lines.join('\n'), passage);
    return id;
  });
}
