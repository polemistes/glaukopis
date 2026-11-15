import { describe, expect, it } from 'vitest';
import * as Y from 'yjs';
import { Notebook } from './notebook.svelte';

const HASH = 'a'.repeat(64);
const OTHER = 'b'.repeat(64);

/** A notebook read again from what another holds, as a window reads it from disk. */
function readAgain(nb: Notebook): Notebook {
  const again = new Notebook();
  again.load(Y.encodeStateAsUpdate(nb.doc), []);
  return again;
}

describe('looked at, or not', () => {
  it('counts a note as looked at where nothing is said, as every note made before was', () => {
    const nb = new Notebook();
    const id = nb.addNote();
    expect(nb.note(id)!.seen).toBe(true);
    expect(nb.yNotes.get(id)!.has('seen')).toBe(false);
  });

  it('makes a note taken in not looked at, until it is looked at', () => {
    const nb = new Notebook();
    const id = nb.addNote({ seen: false });
    expect(nb.note(id)!.seen).toBe(false);
    expect(readAgain(nb).note(id)!.seen).toBe(false);
    nb.lookedAt(id);
    expect(nb.note(id)!.seen).toBe(true);
    expect(readAgain(nb).note(id)!.seen).toBe(true);
  });

  it('keeps that a note was looked at outside undo', () => {
    const nb = new Notebook();
    nb.checkpoint();
    const id = nb.addNote({ seen: false });
    nb.checkpoint();
    nb.addText(id, 'Words');
    nb.checkpoint();
    nb.lookedAt(id);
    expect(nb.canUndo).toBe(true);
    nb.undo();
    // What was written is undone; that the note was looked at is not.
    expect(nb.note(id)!.words).not.toContain('words');
    expect(nb.note(id)!.seen).toBe(true);
  });

  it('does nothing to a note looked at already, or not there', () => {
    const nb = new Notebook();
    const id = nb.addNote();
    const before = nb.revision;
    nb.lookedAt(id);
    nb.lookedAt('gone');
    expect(nb.revision).toBe(before);
  });
});

describe('words read from images', () => {
  function pictured(nb: Notebook, hash = HASH): string {
    const id = nb.addNote();
    nb.addFigure(id, { hash, name: 'sign.png', extension: 'png' });
    return id;
  }

  it('keeps what was read with the record of the file, and finds the note by it', () => {
    const nb = new Notebook();
    const id = pictured(nb);
    expect(nb.find('Pnyx')).toEqual([]);
    nb.setFileText(HASH, 'To the Pnyx\nAgora');
    expect(nb.files.get(HASH)!.text).toBe('To the Pnyx\nAgora');
    expect(nb.find('pnyx').map((n) => n.id)).toEqual([id]);
    expect(nb.find('agora pnyx').map((n) => n.id)).toEqual([id]);
    expect(
      readAgain(nb)
        .find('pnyx')
        .map((n) => n.id),
    ).toEqual([id]);
  });

  it('replaces what was read before when read again', () => {
    const nb = new Notebook();
    const id = pictured(nb);
    nb.setFileText(HASH, 'Agora');
    nb.setFileText(HASH, 'Kerameikos');
    expect(nb.find('agora')).toEqual([]);
    expect(nb.find('kerameikos').map((n) => n.id)).toEqual([id]);
  });

  it('does not put what was read into the text of the note', () => {
    const nb = new Notebook();
    const id = pictured(nb);
    nb.setFileText(HASH, 'Agora');
    expect(nb.fragment(id)!.toString()).not.toContain('Agora');
    expect(nb.note(id)!.begins).toBe('');
  });

  it('finds every note that holds the image, and none that does not', () => {
    const nb = new Notebook();
    const one = pictured(nb);
    const two = pictured(nb);
    const other = pictured(nb, OTHER);
    nb.setFileText(HASH, 'Stoa');
    const found = nb.find('stoa').map((n) => n.id);
    expect(found.sort()).toEqual([one, two].sort());
    expect(found).not.toContain(other);
  });

  it('keeps what was read outside undo, and when the file is held again', () => {
    const nb = new Notebook();
    pictured(nb);
    nb.checkpoint();
    nb.setFileText(HASH, 'Stoa');
    expect(nb.canUndo).toBe(true); // the figure added before
    nb.holdFile({ hash: HASH, name: 'sign.png', extension: 'png' }, null);
    expect(nb.files.get(HASH)!.text).toBe('Stoa');
    nb.setFileSource(HASH, nb.addSource({ sort: 'words', words: 'A walk' }));
    expect(nb.files.get(HASH)!.text).toBe('Stoa');
  });

  it('keeps that nothing was read, apart from not being read', () => {
    const nb = new Notebook();
    pictured(nb);
    expect(nb.files.get(HASH)!.text).toBeUndefined();
    nb.setFileText(HASH, '');
    expect(nb.files.get(HASH)!.text).toBe('');
  });
});
