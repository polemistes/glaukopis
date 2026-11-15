import { describe, expect, it } from 'vitest';
import type { ProjectInfo } from '$lib/api/projects';
import { Notebook } from './model/notebook.svelte';
import {
  chipsOf,
  givesAnything,
  neighbourOf,
  NoteSelection,
  rowOf,
  saveSource,
  takenFrom,
  wentLines,
} from './page.svelte';

const HASH = 'a'.repeat(64);
const SHOWN = 'b'.repeat(64);

const none = { shiftKey: false, ctrlKey: false, metaKey: false };
const shift = { ...none, shiftKey: true };
const ctrl = { ...none, ctrlKey: true };

describe('a row of the list of notes', () => {
  it('says a note by its name, else by how it begins, else as empty, with the day and what it holds', () => {
    const nb = new Notebook();
    const named = nb.addNote({ name: 'Owls', made: '2026-11-15T10:00:00Z' });
    const words = nb.addNote({ made: '2026-11-14T10:00:00Z' });
    nb.addText(words, 'Athena is grey-eyed.');
    const empty = nb.addNote();
    const pictured = nb.addNote();
    nb.holdFile({ hash: HASH, name: 'owl.png', extension: 'png' }, null);
    nb.addFigure(pictured, { hash: HASH, name: 'owl.png', extension: 'png' });

    expect(rowOf(nb.note(named)!)).toMatchObject({ title: 'Owls', empty: false });
    expect(rowOf(nb.note(named)!).day).toMatch(/2026/);
    expect(rowOf(nb.note(words)!).title).toBe('Athena is grey-eyed.');
    expect(rowOf(nb.note(empty)!)).toMatchObject({ title: '', empty: true });
    expect(rowOf(nb.note(pictured)!)).toMatchObject({
      pictures: true,
      files: false,
      passages: false,
      picture: { hash: HASH, extension: 'png' },
    });
  });
});

describe('the selection of notes', () => {
  const order = ['a', 'b', 'c', 'd', 'e'];

  it('chooses one by a press, adds with Ctrl and takes a range with Shift', () => {
    const s = new NoteSelection();
    s.press('b', none, order);
    expect(s.ids).toEqual(['b']);
    expect(s.single).toBe('b');
    s.press('d', shift, order);
    expect(s.ids).toEqual(['b', 'c', 'd']);
    expect(s.single).toBeNull();
    s.press('c', ctrl, order);
    expect(s.ids).toEqual(['b', 'd']);
    s.press('a', ctrl, order);
    expect(s.ids).toEqual(['b', 'd', 'a']);
    s.press('e', none, order);
    expect(s.ids).toEqual(['e']);
  });

  it('moves by the arrows, Home and End, and takes a range with Shift', () => {
    const s = new NoteSelection();
    expect(s.key('ArrowDown', false, order)).toBe('a');
    expect(s.key('ArrowDown', false, order)).toBe('b');
    expect(s.key('ArrowDown', true, order)).toBe('c');
    expect(s.ids).toEqual(['b', 'c']);
    expect(s.key('End', false, order)).toBe('e');
    expect(s.ids).toEqual(['e']);
    expect(s.key('Home', false, order)).toBe('a');
    expect(s.key('ArrowUp', false, order)).toBe('a');
    expect(s.key('x', false, order)).toBeNull();
    expect(new NoteSelection().key('ArrowDown', false, [])).toBeNull();
  });

  it('keeps only what is there', () => {
    const s = new NoteSelection();
    s.set(['a', 'b', 'c']);
    s.keep((id) => id !== 'c');
    expect(s.ids).toEqual(['a', 'b']);
    expect(s.anchor).toBe('b');
  });

  it('chooses the note after those deleted, else the one before', () => {
    expect(neighbourOf(order, ['b', 'c'])).toBe('d');
    expect(neighbourOf(order, ['d', 'e'])).toBe('c');
    expect(neighbourOf(order, order)).toBeNull();
    expect(neighbourOf(order, ['x'])).toBeNull();
  });
});

describe('the sources of a note', () => {
  /** A note with words pasted from nowhere known. */
  function pasted(nb: Notebook, words = 'Grey-eyed Athena') {
    const note = nb.addNote();
    const passage = nb.addPassage(null, words);
    nb.addText(note, words, passage);
    return { note, passage };
  }

  it('says what was taken in with no source once, as wanting', () => {
    const nb = new Notebook();
    const { note } = pasted(nb);
    expect(chipsOf(nb, nb.note(note)!)).toEqual([{ id: null, source: null }]);
    const own = nb.addNote();
    nb.addText(own, 'My own words.');
    expect(chipsOf(nb, nb.note(own)!)).toEqual([]);
  });

  it('gives what had no source the source given, passages and files alike', () => {
    const nb = new Notebook();
    const { note, passage } = pasted(nb);
    nb.holdFile({ hash: HASH, name: 'owl.png', extension: 'png' }, null);
    nb.holdFile({ hash: SHOWN, name: 'owl.png', extension: 'png', madeFrom: HASH }, null);
    nb.addFigure(note, { hash: SHOWN, name: 'owl.png', extension: 'png' });
    const record = () => nb.note(note)!;
    expect(takenFrom(nb, record(), null)).toEqual({
      passages: [expect.objectContaining({ id: passage })],
      files: [SHOWN],
    });

    expect(givesAnything({ sort: 'web', url: ' ', title: '' })).toBe(false);
    const id = saveSource(nb, record(), null, {
      sort: 'web',
      url: 'https://example.org/owls',
      title: 'Owls of Athens',
    });
    expect(nb.sources.get(id)).toMatchObject({
      sort: 'web',
      url: 'https://example.org/owls',
      title: 'Owls of Athens',
    });
    // The day it was read is the day the words were taken in.
    expect((nb.sources.get(id) as { read: string }).read).toBe(nb.passages.get(passage)!.taken);
    expect(nb.passages.get(passage)!.source).toBe(id);
    expect(nb.files.get(SHOWN)!.source).toBe(id);
    expect(nb.files.get(HASH)!.source).toBe(id);
    expect(chipsOf(nb, record()).map((c) => c.id)).toEqual([id]);

    // One step of undo.
    nb.undoManager.stopCapturing();
    nb.undo();
    expect(nb.passages.get(passage)!.source).toBeNull();
    expect(nb.sources.has(id)).toBe(false);
  });

  it('changes a source that is there for every note, and puts a new one in its place for this note where its sort is another', () => {
    const nb = new Notebook();
    const web = nb.addSource({ sort: 'web', url: 'https://a.org', title: 'A', read: '2026-11-01' });
    const first = pasted(nb, 'One');
    const second = pasted(nb, 'Two');
    nb.setPassageSource(first.passage, web);
    nb.setPassageSource(second.passage, web);

    const same = saveSource(nb, nb.note(first.note)!, nb.sources.get(web)!, {
      sort: 'web',
      url: 'https://a.org',
      title: 'Another title',
    });
    expect(same).toBe(web);
    expect(nb.sources.get(web)).toMatchObject({ title: 'Another title', read: '2026-11-01' });
    expect(nb.passages.get(second.passage)!.source).toBe(web);

    const words = saveSource(nb, nb.note(first.note)!, nb.sources.get(web)!, {
      sort: 'words',
      words: 'A broadcast, 3 May',
    });
    expect(words).not.toBe(web);
    expect(nb.passages.get(first.passage)!.source).toBe(words);
    // The other note keeps the page, which is still used.
    expect(nb.passages.get(second.passage)!.source).toBe(web);
    expect(nb.sources.has(web)).toBe(true);

    // Given the second note too, the page is used by nothing, and goes.
    const again = saveSource(nb, nb.note(second.note)!, nb.sources.get(web)!, {
      sort: 'words',
      words: 'A broadcast, 3 May',
    });
    expect(again).toBe(words);
    expect(nb.sources.has(web)).toBe(false);
  });

  it('keeps the place of a reference only where one is given', () => {
    const nb = new Notebook();
    const { note } = pasted(nb);
    const id = saveSource(nb, nb.note(note)!, null, {
      sort: 'reference',
      reference: 'ref1',
      locator: '45',
      label: 'page',
    });
    expect(nb.sources.get(id)).toMatchObject({ reference: 'ref1', locator: '45', label: 'page' });
    saveSource(nb, nb.note(note)!, nb.sources.get(id)!, {
      sort: 'reference',
      reference: 'ref1',
      locator: '',
      label: 'page',
    });
    expect(nb.sources.get(id)).not.toHaveProperty('locator');
    expect(nb.sources.get(id)).not.toHaveProperty('label');
  });
});

describe('what became of a note', () => {
  const projects = [{ id: 'p1', name: 'The book' }] as ProjectInfo[];

  it('says each project and kind once, by the name the project has now, and whether it is still there', () => {
    const lines = wentLines(
      [
        { what: 'quotation', project: 'p1', name: 'Old name', element: 'e1', when: '1' },
        { what: 'quotation', project: 'p1', name: 'Old name', element: 'e2', when: '2' },
        { what: 'figure', project: 'p1', element: 'e3', when: '3' },
        { what: 'text', project: 'gone', name: 'A deleted project', when: '4' },
      ],
      projects,
    );
    expect(lines).toEqual([
      { what: 'quotation', project: 'p1', name: 'The book', here: true, element: 'e2' },
      { what: 'figure', project: 'p1', name: 'The book', here: true, element: 'e3' },
      { what: 'text', project: 'gone', name: 'A deleted project', here: false },
    ]);
  });
});
