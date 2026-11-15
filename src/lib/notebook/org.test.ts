import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { languages } from '$lib/i18n';
import { Notebook, type NotebookPersistence } from './model/notebook.svelte';
import type { Source } from './model/types';
import { orgOfNotebook, orgTag, type OrgWords } from './org';

const HASH = 'a'.repeat(64);
const OTHER = 'b'.repeat(64);

beforeEach(() => {
  languages.current = 'en';
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-11-05T12:00:00.000Z'));
});
afterEach(() => vi.useRealTimers());

/**
 * A small notebook of each thing: a box of its own beside the first; a
 * named note with tags, words of the writer's own, a passage from a page of
 * the web, and what became of it; a note of a picture and a file; and a
 * link between the two.
 */
function made() {
  const nb = new Notebook();
  nb.load(null, []);
  const box = nb.addBox('Reading');
  const a = nb.addNote({
    name: 'On wrath',
    made: '2026-11-01T10:00:00.000Z',
    tags: ['Homer', 'epic poetry'],
  });
  nb.addText(a, 'The first word is wrath.');
  const web = nb.addSource({
    sort: 'web',
    url: 'https://example.org/iliad',
    title: 'The Iliad online',
    read: '2026-11-01T09:00:00.000Z',
  });
  const passage = nb.addPassage(web, 'Sing, goddess, the wrath');
  nb.addText(a, 'Sing, goddess, the wrath', passage);
  nb.went(a, { what: 'quotation', project: 'p1', name: 'The poem' });
  const b = nb.addNote({ made: '2026-11-02T10:00:00.000Z', box });
  nb.addFigure(b, { hash: HASH, name: 'owl.png', extension: 'png' });
  nb.addFile(b, { hash: OTHER, name: 'notes.pdf', extension: 'pdf' });
  const link = nb.addLink(a, b)!;
  nb.setLinkLabel(link, 'seen together');
  return { nb, a, b, box };
}

/** The id of the first figure of a note, which is made anew each time. */
function figureId(nb: Notebook, note: string): string {
  const piece = nb.note(note)!.pieces.find((p) => p.kind === 'figure');
  const block = piece && piece.kind === 'figure' ? piece.blocks[0] : null;
  return block?.kind === 'figure' ? (block.id ?? '') : '';
}

describe('the notebook as Org', () => {
  it('is a heading for each box, under it one for each note, with its pieces and its links', () => {
    const { nb, a, b } = made();
    const { org, pictures, files } = orgOfNotebook(nb);
    expect(org.split('\n')).toEqual([
      '#+TITLE: Notebook',
      '',
      '* Unsorted',
      '',
      '** On wrath :epic_poetry:Homer:',
      ':PROPERTIES:',
      `:ID:   ${a}`,
      ':MADE: 2026-11-01T10:00:00.000Z',
      ':WENT: quotation · The poem · 2026-11-05T12:00:00Z',
      ':END:',
      '',
      'The first word is wrath.',
      '',
      '#+BEGIN_QUOTE',
      'Sing, goddess, the wrath',
      '#+END_QUOTE',
      '— The Iliad online, https://example.org/iliad',
      '',
      `[[id:${b}][owl.png]] seen together`,
      '',
      '* Reading',
      '',
      '** owl.png',
      ':PROPERTIES:',
      `:ID:   ${b}`,
      ':MADE: 2026-11-02T10:00:00.000Z',
      ':END:',
      '',
      `#+NAME: fig:${figureId(nb, b)}`,
      '#+ATTR_GLAUKOPIS: :width 100 :file-name owl.png',
      `[[file:pictures/${HASH}.png]]`,
      '',
      '[[file:files/notes.pdf][notes.pdf]]',
      '',
      `[[id:${a}][On wrath]] seen together`,
      '',
    ]);
    expect(pictures).toEqual([HASH]);
    expect(files).toEqual([{ hash: OTHER, name: 'notes.pdf' }]);
  });

  it('writes the notes of a box the newest first, and each thing it became once more under WENT+', () => {
    const { nb, a } = made();
    const later = nb.addNote({ name: 'Later', made: '2026-11-03T10:00:00.000Z' });
    nb.went(a, { what: 'text', name: 'Another' });
    const lines = orgOfNotebook(nb).org.split('\n');
    expect(lines.indexOf('** Later')).toBeLessThan(
      lines.indexOf('** On wrath :epic_poetry:Homer:'),
    );
    expect(lines).toContain(`:ID:   ${later}`);
    expect(lines).toContain(':WENT+: text · Another · 2026-11-05T12:00:00Z');
  });

  it('keeps names from reading as Org’s signs, and gives two files of one name two names', () => {
    const nb = new Notebook();
    nb.load(null, []);
    nb.renameBox('first', 'Inbox');
    const n = nb.addNote({ name: 'TODO list :x:', made: '2026-11-01T10:00:00.000Z' });
    nb.addFile(n, { hash: HASH, name: 'notes.pdf', extension: 'pdf' });
    nb.addFile(n, { hash: OTHER, name: 'notes.pdf', extension: 'pdf' });
    const m = nb.addNote({ made: '2026-11-02T10:00:00.000Z' });
    nb.addFile(m, { hash: 'c'.repeat(64), name: '../../away', extension: '' });
    const { org, files } = orgOfNotebook(nb);
    const lines = org.split('\n');
    expect(lines[2]).toBe('* Inbox');
    expect(lines).toContain('** \\TODO list :x\\:');
    expect(lines).toContain('[[file:files/notes (2).pdf][notes (2).pdf]]');
    expect(files.map((f) => f.name)).toEqual(['.._.._away', 'notes.pdf', 'notes (2).pdf']);
  });

  it('names the source of a passage taken from a reference by its key, where the library knows it', () => {
    const nb = new Notebook();
    nb.load(null, []);
    const n = nb.addNote({ name: 'Nagy', made: '2026-11-01T10:00:00.000Z' });
    const source = nb.addSource({ sort: 'reference', reference: 'r1', locator: '73' });
    nb.addText(n, 'The best of the Achaeans', nb.addPassage(source, 'The best of the Achaeans'));
    const words: OrgWords = {
      title: 'Notebook',
      firstBox: 'Unsorted',
      emptyNote: 'Empty note',
      went: (what) => what,
      source: (s: Source | null) => (s?.sort === 'reference' ? `Nagy 1979, ${s.locator}` : '?'),
      key: (reference) => (reference === 'r1' ? 'nagy1979' : null),
    };
    expect(orgOfNotebook(nb, words).org).toContain(
      '#+END_QUOTE\n— Nagy 1979, 73, [cite:@nagy1979]\n',
    );
  });

  it('makes a tag what Org’s tags can hold', () => {
    expect(orgTag('epic poetry')).toBe('epic_poetry');
    expect(orgTag('Ὅμηρος')).toBe('Ὅμηρος');
    expect(orgTag('a-b:c@d#e%f')).toBe('a_b_c@d#e%f');
  });

  it('is written a moment after the whole notebook is saved, once for saves close together, and a failure only said in the log', async () => {
    const written: Notebook[] = [];
    let fail = false;
    const persistence: NotebookPersistence = {
      append: async () => {},
      saveState: async () => {},
      readable: async (nb) => {
        if (fail) throw new Error('no room on the disk');
        written.push(nb);
      },
    };
    const nb = new Notebook(persistence);
    nb.load(null, []);
    nb.addNote({ name: 'One' });
    await nb.snapshot();
    nb.addNote({ name: 'Two' });
    await nb.snapshot();
    await vi.advanceTimersByTimeAsync(10);
    expect(written).toEqual([nb]);
    fail = true;
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    nb.addNote({ name: 'Three' });
    await nb.snapshot();
    await vi.advanceTimersByTimeAsync(6000);
    expect(warn).toHaveBeenCalledWith(
      'the readable copy of the notebook could not be written',
      expect.any(Error),
    );
    expect(nb.status).not.toBe('error');
    warn.mockRestore();
    // What waits is written at once when the notebook is closed.
    fail = false;
    nb.addNote({ name: 'Four' });
    await nb.close();
    expect(written).toHaveLength(2);
  });
});
