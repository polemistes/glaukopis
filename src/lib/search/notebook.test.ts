import { describe, expect, it } from 'vitest';
import * as Y from 'yjs';
import { Notebook } from '$lib/notebook/model/notebook.svelte';
import { Engine } from './engine';
import { NO_OPTIONS, type SearchOptions } from './matching';
import { readNotebook, searchNotebook, type NotebookFound } from './notebook';

const HASH = 'a'.repeat(64);

const options = (change: Partial<SearchOptions> = {}): SearchOptions => ({
  ...NO_OPTIONS,
  ...change,
});

/** A small notebook: a named note, an unnamed one with words taken in, and one holding a file. */
function made() {
  const nb = new Notebook();
  nb.load(null, []);
  const named = nb.addNote({ name: 'On wrath', made: '2026-11-01T10:00:00.000Z' });
  nb.addText(named, 'The wrath of Achilles is the first word.\nIt returns at the end.');
  const taken = nb.addNote({ made: '2026-11-02T10:00:00.000Z' });
  const passage = nb.addPassage(null, 'Sing, goddess, the wrath');
  nb.addText(taken, 'Sing, goddess, the wrath', passage);
  const filed = nb.addNote({ made: '2026-11-03T10:00:00.000Z' });
  nb.addFile(filed, { hash: HASH, name: 'wrath-notes.pdf', extension: 'pdf' });
  return { nb, named, taken, filed };
}

function found(result: ReturnType<typeof searchNotebook>): NotebookFound {
  if (!result || 'error' in result) throw new Error('nothing found');
  return result;
}

describe('the notebook in the search through everything', () => {
  it('reads the notebook as the disk keeps it: each note with how it is called, the newest first', () => {
    const { nb, named, taken, filed } = made();
    const read = readNotebook(Y.encodeStateAsUpdate(nb.doc), []);
    expect(read.unapplied).toBe(0);
    expect(read.notes.map((n) => n.id)).toEqual([filed, taken, named]);
    // A note of no name and no words is called by the file it holds.
    expect(read.notes.map((n) => n.called)).toEqual([
      'wrath-notes.pdf',
      'Sing, goddess, the wrath',
      'On wrath',
    ]);
    // A note that holds nothing to read is called nothing: the list says it is untitled.
    nb.addNote({ made: '2026-11-04T10:00:00.000Z' });
    expect(readNotebook(Y.encodeStateAsUpdate(nb.doc), []).notes[0].called).toBe('');
  });

  it('finds in the name and the text of each note, paragraph by paragraph, with the words around', () => {
    const { nb, named, taken, filed } = made();
    const read = readNotebook(Y.encodeStateAsUpdate(nb.doc), []);
    const result = found(searchNotebook(read, 'wrath', options()));
    expect(result.count).toBe(4);
    expect(result.found.map((f) => [f.note, f.part, f.passage])).toEqual([
      [filed, 'text', 0],
      [taken, 'text', 0],
      [named, 'name', 0],
      [named, 'text', 0],
    ]);
    const [, inTaken, inName, inText] = result.found;
    expect(inTaken).toMatchObject({
      called: 'Sing, goddess, the wrath',
      before: 'Sing, goddess, the ',
      text: 'wrath',
      after: '',
    });
    expect(inName).toMatchObject({ called: 'On wrath', before: 'On ', text: 'wrath' });
    expect(inText).toMatchObject({
      before: 'The ',
      text: 'wrath',
      after: ' of Achilles is the first word.',
    });
    // The second paragraph of a note is its own passage.
    expect(found(searchNotebook(read, 'returns', options())).found[0]).toMatchObject({
      note: named,
      passage: 1,
      start: 3,
      end: 10,
    });
  });

  it('searches with the options of the texts: case, whole words, and across paragraphs', () => {
    const { nb } = made();
    const read = readNotebook(Y.encodeStateAsUpdate(nb.doc), []);
    expect(found(searchNotebook(read, 'Wrath', options({ caseSensitive: true }))).count).toBe(0);
    expect(found(searchNotebook(read, 'wrat', options({ wholeWords: true }))).count).toBe(0);
    const across = found(searchNotebook(read, 'word.\\pIt', options({ regex: true })));
    expect(across.count).toBe(1);
    expect(searchNotebook(read, '(', options({ regex: true }))).toMatchObject({
      error: expect.any(String),
    });
    expect(searchNotebook(read, '', options())).toBeNull();
  });

  it('keeps so many of what was found, and counts the rest', () => {
    const { nb } = made();
    const read = readNotebook(Y.encodeStateAsUpdate(nb.doc), []);
    const result = found(searchNotebook(read, 'wrath', options(), 2));
    expect(result.count).toBe(4);
    expect(result.found).toHaveLength(2);
  });

  it('says how many of the changes given could not be applied, and reads the rest', () => {
    const { nb } = made();
    const read = readNotebook(Y.encodeStateAsUpdate(nb.doc), [new Uint8Array([1, 2, 3])]);
    expect(read.unapplied).toBe(1);
    expect(read.notes).toHaveLength(3);
  });

  it('is read and searched by the engine, and read anew when it is given anew', async () => {
    const { nb, named } = made();
    const engine = new Engine();
    expect(await engine.searchNotebook('wrath', options())).toBeNull();
    expect(await engine.readNotebook(Y.encodeStateAsUpdate(nb.doc), [])).toBe(0);
    expect(await engine.searchNotebook('wrath', options())).toMatchObject({ count: 4 });
    nb.addText(named, 'More wrath.');
    await engine.readNotebook(Y.encodeStateAsUpdate(nb.doc), []);
    expect(await engine.searchNotebook('wrath', options())).toMatchObject({ count: 5 });
    engine.close();
  });
});
