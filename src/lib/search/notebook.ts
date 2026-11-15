/**
 * The notebook in the search through everything (record 0101;
 * `docs/plans/the-notebook.md`, stage 4): read from its state and the
 * changes after it, as a project is (`everything.ts`), with what needs only
 * Yjs and the reading of a text (`notebook/model/pieces.ts`), so that the
 * search's worker reads it; never with the class `Notebook`, which is the
 * window's. Each note's name and its text are searched, paragraph by
 * paragraph, with the matcher and the options the texts of projects are
 * searched with.
 */

import * as Y from 'yjs';
import { beginsOf, firstFileName, piecesOf } from '$lib/notebook/model/pieces';
import type { Block } from '$lib/project/model/text';
import { around } from './everything';
import { Matcher, type SearchOptions } from './matching';
import { bodyPassages, joined, placeIn, type Joined, type Passage } from './passages';

/** A note, as it is searched. */
interface NoteRead {
  id: string;
  name: string;
  /** How it is called: its name, how it begins, or the name of the first file or picture it holds. */
  called: string;
  /** When it was collected. */
  made: string;
  title: Passage;
  body: Passage[];
}

/** The notebook as it is searched: its notes, the newest first. */
export interface NotebookRead {
  notes: NoteRead[];
  /** How many of the changes given could not be applied: the notebook is read only in part. */
  unapplied: number;
}

/** Something found in a note, with the words around it. */
export interface NoteFound {
  note: string;
  /** How the note is called, as its row in the notebook's list: its name, how it begins, or the name of the first file or picture it holds; empty where it has none. */
  called: string;
  part: 'name' | 'text';
  passage: number;
  start: number;
  end: number;
  before: string;
  text: string;
  after: string;
}

export interface NotebookFound {
  count: number;
  found: NoteFound[];
}

const str = (value: unknown): string => (typeof value === 'string' ? value : '');

/** A line of plain words, as a passage. */
function linePassage(text: string): Passage {
  return {
    index: 0,
    kind: 'line',
    text,
    pieces: text ? [{ kind: 'text', start: 0, length: text.length }] : [],
  };
}

/** A file's name as a paragraph, so that it is read where it stands among the rest. */
const nameParagraph = (name: string): Block => ({
  kind: 'paragraph',
  name: 'text',
  indent: 0,
  content: [{ kind: 'text', text: name, marks: {} }],
});

/** Reads the notebook from its state and the changes after it, as the disk keeps them. Nothing is written back. */
export function readNotebook(state: Uint8Array | null, updates: Uint8Array[]): NotebookRead {
  const doc = new Y.Doc();
  if (state) Y.applyUpdate(doc, state);
  let unapplied = 0;
  for (const update of updates) {
    try {
      Y.applyUpdate(doc, update);
    } catch {
      unapplied++;
    }
  }
  const notes: NoteRead[] = [];
  const files = doc.getMap<unknown>('files');
  for (const [id, n] of doc.getMap<unknown>('notes')) {
    if (!(n instanceof Y.Map)) continue;
    const body = n.get('body');
    const pieces = piecesOf(body instanceof Y.XmlFragment ? body : null);
    const name = str(n.get('name')).trim();
    // A file is found by its name; an image also by the words read in it, kept with the file.
    const blocks = pieces.flatMap((p) =>
      p.kind === 'file'
        ? [nameParagraph(p.name)]
        : p.kind === 'figure'
          ? [...p.blocks, ...readIn(files.get(p.hash)).map(nameParagraph)]
          : p.blocks,
    );
    notes.push({
      id,
      name,
      called: name || beginsOf(pieces) || firstFileName(pieces),
      made: str(n.get('made')),
      title: linePassage(name),
      body: bodyPassages(blocks),
    });
  }
  doc.destroy();
  // The newest first, as the notebook lists them.
  notes.sort((a, b) => (a.made === b.made ? (a.id < b.id ? 1 : -1) : a.made < b.made ? 1 : -1));
  return { notes, unapplied };
}

/** The words read in an image, line by line, from what the notebook keeps of the file; none where nothing was read. */
function readIn(file: unknown): string[] {
  const text = file && typeof file === 'object' ? (file as { text?: unknown }).text : null;
  return typeof text === 'string' ? text.split('\n').filter((line) => line.trim()) : [];
}

/** Each passage by itself, as lines read as one are. */
function alone(passages: Passage[]): Joined[] {
  return passages.map((p) => ({ text: p.text, passages: [p], starts: [0] }));
}

/**
 * Searches the notebook. What is found is counted all; so many of it are
 * kept, with the words around them, note by note, the newest first.
 */
export function searchNotebook(
  notebook: NotebookRead,
  words: string,
  options: SearchOptions,
  most = 300,
): NotebookFound | { error: string } | null {
  const made = Matcher.make(words, options);
  if (!made) return null;
  if ('error' in made) return made;
  const matcher = made.matcher;
  const out: NotebookFound = { count: 0, found: [] };
  const put = (
    found: Omit<NoteFound, 'before' | 'text' | 'after'>,
    text: string,
    at: [number, number],
  ) => {
    out.count++;
    if (out.found.length >= most) return;
    const [before, middle, after] = around(text, at[0], at[1]);
    out.found.push({ ...found, before, text: middle, after });
  };
  for (const note of notebook.notes) {
    const base = { note: note.id, called: note.called };
    for (const hit of matcher.find(note.title.text))
      put({ ...base, part: 'name', passage: 0, start: hit.start, end: hit.end }, note.title.text, [
        hit.start,
        hit.end,
      ]);
    for (const j of matcher.acrossParagraphs ? joined(note.body) : alone(note.body)) {
      if (!j.text) continue;
      for (const hit of matcher.find(j.text)) {
        const a = placeIn(j, hit.start);
        const b = placeIn(j, hit.end);
        put({ ...base, part: 'text', passage: a.passage, start: a.offset, end: b.offset }, j.text, [
          hit.start,
          hit.end,
        ]);
      }
    }
  }
  return out;
}
