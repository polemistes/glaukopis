import { describe, expect, it } from 'vitest';
import type { FileView } from '$lib/api/files';
import type { NotebookFile } from '$lib/api/notebook';
import { bodySchema } from '$lib/editor/schema';
import { isEmptyNote, isPictureEnding, noteTextOf, readNoteDoc } from './text';

const PNG = 'a'.repeat(64);
const PDF = 'b'.repeat(64);

const view = (hash: string, name: string): FileView => ({
  hash,
  path: `files/${hash}`,
  name,
  kind: 'picture',
  size: 10,
  exists: true,
  folder: null,
  origin: null,
  added: '2026-11-16T10:00:00Z',
  width: 320,
  height: 200,
  alt: '',
  madeFrom: null,
  bookmarks: [],
  references: [],
});

const taken = (hash: string, name: string, shown: boolean): NotebookFile => ({
  file: view(hash, name),
  shown: shown ? view(hash, name) : null,
  time: null,
  taken: null,
  place: null,
});

const s = bodySchema;

describe('the text of a note as the window hands it over', () => {
  it('has the document, its words line by line, and each file it holds once', () => {
    const doc = s.node('doc', null, [
      s.node('paragraph', { kind: 'item' }, [s.text('One')]),
      s.node('paragraph', null, [s.text('Two'), s.node('hard_break'), s.text('lines')]),
      s.node('figure', { file: PNG, extension: 'png', name: 'owl.png' }),
      s.node('file', { hash: PDF, name: 'letter.pdf', extension: 'pdf' }),
      s.node('file', { hash: PDF, name: 'letter.pdf', extension: 'pdf' }),
    ]);
    const text = noteTextOf(doc);
    expect(text.words).toBe('One\nTwo\nlines');
    expect(text.files).toEqual([
      { hash: PNG, name: 'owl.png' },
      { hash: PDF, name: 'letter.pdf' },
    ]);
    expect(s.nodeFromJSON(text.doc).eq(doc)).toBe(true);
    expect(isEmptyNote(text)).toBe(false);
  });

  it('is empty where it has no words and no file; a picture alone is a note', () => {
    expect(isEmptyNote(noteTextOf(s.node('doc', null, [s.node('paragraph')])))).toBe(true);
    expect(isEmptyNote({ words: ' \n ', files: [] })).toBe(true);
    expect(isEmptyNote({ words: '', files: [{ hash: PNG, name: 'owl.png' }] })).toBe(false);
  });

  it('shows as pictures the files a figure shows as they are', () => {
    expect(['png', 'JPG', 'jpeg', 'svg'].every(isPictureEnding)).toBe(true);
    expect(['tiff', 'webp', 'pdf', ''].some(isPictureEnding)).toBe(false);
  });
});

describe('the text of a note as the application reads it', () => {
  const files = new Map([
    [PNG, taken(PNG, 'owl.png', true)],
    [PDF, taken(PDF, 'letter.pdf', false)],
  ]);

  it('reads again what the window wrote', () => {
    const doc = s.node('doc', null, [
      s.node('paragraph', { kind: 'todo' }, [s.text('Tick', [s.mark('em')])]),
      s.node('figure', { file: PNG, extension: 'png', name: 'owl.png' }),
      s.node('file', { hash: PDF, name: 'letter.pdf', extension: 'pdf' }),
    ]);
    expect(readNoteDoc(doc.toJSON(), files)!.eq(doc)).toBe(true);
  });

  it('leaves out a picture or a file that was not taken in, and a row that is left empty', () => {
    const json = {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'Words' }] },
        { type: 'row', content: [{ type: 'figure', attrs: { file: 'c'.repeat(64) } }] },
        { type: 'file', attrs: { hash: 'd'.repeat(64), name: 'gone.pdf' } },
        // A file that is no picture does not stand as a figure.
        { type: 'figure', attrs: { file: PDF } },
      ],
    };
    const read = readNoteDoc(json, files)!;
    expect(read.childCount).toBe(1);
    expect(read.textContent).toBe('Words');
  });

  it('reads nothing of what is too deep, and nothing of what is no document', () => {
    let deep: unknown = { type: 'text', text: 'x' };
    for (let i = 0; i < 100; i++) deep = { type: 'paragraph', content: [deep] };
    expect(readNoteDoc({ type: 'doc', content: [deep] }, files)).toBe(null);
    expect(readNoteDoc({ type: 'paragraph' }, files)).toBe(null);
    expect(readNoteDoc({ type: 'doc', content: [] }, files)).toBe(null);
    expect(readNoteDoc('doc', files)).toBe(null);
  });
});
