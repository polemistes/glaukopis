import { EditorState, TextSelection } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { ySyncPlugin, yUndoPlugin, yXmlFragmentToProseMirrorRootNode } from 'y-prosemirror';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as Y from 'yjs';
import type { NotebookSummary } from '$lib/api/notebook';
import { bodySchema } from '$lib/editor/schema';
import { Notebook, type NotebookPersistence } from './notebook.svelte';

const HASH = 'a'.repeat(64);
const OTHER = 'b'.repeat(64);
const THIRD = 'c'.repeat(64);

/** Two copies of one notebook, that see each other's changes when they are passed. */
function two() {
  const a = new Notebook();
  const b = new Notebook();
  b.load(Y.encodeStateAsUpdate(a.doc), []);
  const sync = () => {
    Y.applyUpdate(b.doc, Y.encodeStateAsUpdate(a.doc, Y.encodeStateVector(b.doc)), 'remote');
    Y.applyUpdate(a.doc, Y.encodeStateAsUpdate(b.doc, Y.encodeStateVector(a.doc)), 'remote');
  };
  return { a, b, sync };
}

/** The text of a note as the editor reads it, checked against the schema. */
function asEditorReads(nb: Notebook, id: string) {
  const node = yXmlFragmentToProseMirrorRootNode(nb.fragment(id)!, bodySchema);
  node.check();
  return node;
}

let views: EditorView[] = [];

/** An editor bound to the text of a note, as the page of the notebook binds one. */
function editor(nb: Notebook, id: string): EditorView {
  const place = document.body.appendChild(document.createElement('div'));
  const view = new EditorView(place, {
    state: EditorState.create({
      schema: bodySchema,
      plugins: [ySyncPlugin(nb.fragment(id)!), yUndoPlugin({ undoManager: nb.undoManager })],
    }),
  });
  views.push(view);
  return view;
}

afterEach(() => {
  for (const v of views) v.destroy();
  views = [];
  document.body.innerHTML = '';
});

describe('the notes of the notebook', () => {
  it('a note is made, named, found and deleted', () => {
    const nb = new Notebook();
    const first = nb.addNote({ made: '2026-11-14T10:00:00Z' });
    const second = nb.addNote({ name: 'Owls', made: '2026-11-15T10:00:00Z' });
    expect(nb.list.map((n) => n.id)).toEqual([second, first]);
    expect(nb.note(second)!.name).toBe('Owls');
    // It begins with one empty paragraph to write in.
    const node = asEditorReads(nb, first);
    expect(node.childCount).toBe(1);
    expect(node.firstChild!.type.name).toBe('paragraph');
    expect(nb.note(first)!.pieces).toEqual([]);

    nb.addText(first, 'Athena is grey-eyed.\n\nShe has an owl.');
    expect(nb.find('owl').map((n) => n.id)).toEqual([second, first]);
    expect(nb.find('GREY owl').map((n) => n.id)).toEqual([first]);
    expect(nb.find('').length).toBe(2);
    expect(nb.note(first)!.begins).toBe('Athena is grey-eyed. She has an owl.');
    // The empty paragraph it began with is gone: the words are all it holds.
    expect(asEditorReads(nb, first).childCount).toBe(2);

    nb.setName(first, '  Athena ');
    expect(nb.note(first)!.name).toBe('Athena');
    nb.setName(first, '');
    expect(nb.note(first)!.name).toBe('');
    nb.deleteNotes([second]);
    expect(nb.list.map((n) => n.id)).toEqual([first]);
  });

  it('a note added is undone as one step', async () => {
    const nb = new Notebook();
    const id = nb.addNote();
    expect(nb.canUndo).toBe(true);
    nb.undo();
    expect(nb.note(id)).toBeUndefined();
    nb.redo();
    expect(nb.note(id)).toBeDefined();
  });

  it('a note is read again when it changes, and only it', () => {
    const nb = new Notebook();
    const a = nb.addNote();
    const b = nb.addNote();
    nb.addText(a, 'One');
    const before = nb.note(b);
    const beforeA = nb.note(a);
    nb.addText(a, 'Two');
    expect(nb.note(b)).toBe(before);
    expect(nb.note(a)).not.toBe(beforeA);
    expect(nb.note(a)!.words).toContain('two');
  });

  it('what is put in without an editor is what the editor reads', () => {
    const nb = new Notebook();
    const id = nb.addNote();
    const passage = nb.addPassage(null, 'Sing, goddess');
    nb.addText(id, 'Sing, goddess', passage);
    nb.addFigure(id, { hash: HASH, name: 'owl.png', extension: 'png', width: 400, alt: 'An owl' });
    nb.addFile(id, { hash: OTHER, name: 'letter.pdf', extension: 'pdf' });
    const node = asEditorReads(nb, id);
    expect(node.childCount).toBe(3);
    const [p, figure, file] = [node.child(0), node.child(1), node.child(2)];
    expect(p.textContent).toBe('Sing, goddess');
    expect(p.firstChild!.marks.map((m) => [m.type.name, m.attrs.passage])).toEqual([
      ['taken', passage],
    ]);
    expect(figure.type.name).toBe('figure');
    expect(figure.attrs).toMatchObject({
      file: HASH,
      extension: 'png',
      name: 'owl.png',
      alt: 'An owl',
      numbered: true,
    });
    expect(figure.attrs.width).toBeGreaterThan(0);
    expect(figure.attrs.id).not.toBe('');
    expect(file.type.name).toBe('file');
    expect(file.attrs).toEqual({ hash: OTHER, name: 'letter.pdf', extension: 'pdf' });

    const record = nb.note(id)!;
    expect(record.pieces.map((x) => x.kind)).toEqual(['passage', 'figure', 'file']);
    expect(record.holds).toEqual({
      own: false,
      passages: true,
      pictures: true,
      files: true,
      links: false,
    });
    expect(record.picture).toEqual({ hash: HASH, extension: 'png' });
  });

  it('what the editor writes is read', () => {
    const nb = new Notebook();
    const id = nb.addNote();
    const view = editor(nb, id);
    view.dispatch(view.state.tr.insertText('Written in the editor', 1));
    expect(nb.note(id)!.begins).toBe('Written in the editor');
    expect(nb.note(id)!.holds.own).toBe(true);
    const passage = nb.addPassage(null, 'taken');
    const mark = bodySchema.marks.taken.create({ passage });
    const end = view.state.doc.content.size - 1;
    view.dispatch(view.state.tr.insert(end, bodySchema.text(' taken', [mark])));
    expect(nb.note(id)!.holds.passages).toBe(true);
    expect(nb.readsNow(id, passage)).toBe(' taken');
    // What the editor reads is what it wrote.
    expect(asEditorReads(nb, id).textContent).toBe('Written in the editor taken');
    view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, 1)));
  });

  it('two copies see each other’s changes', () => {
    const { a, b, sync } = two();
    const id = a.addNote({ name: 'From a' });
    a.addText(id, 'Words of a');
    sync();
    expect(b.note(id)!.name).toBe('From a');
    expect(b.note(id)!.words).toContain('words of a');
    const source = b.addSource({ sort: 'words', words: 'A broadcast' });
    b.setName(id, 'From b');
    sync();
    expect(a.note(id)!.name).toBe('From b');
    expect(a.sources.get(source)).toMatchObject({ sort: 'words', words: 'A broadcast' });
  });
});

describe('sources, passages and files', () => {
  it('the same source again is the one that is there', () => {
    const nb = new Notebook();
    const web = nb.addSource({ sort: 'web', url: 'https://a.org/x', title: 'X', read: 'now' });
    expect(nb.addSource({ sort: 'web', url: 'https://a.org/x', title: '', read: 'later' })).toBe(
      web,
    );
    expect(nb.addSource({ sort: 'web', url: 'https://a.org/y', title: '', read: '' })).not.toBe(
      web,
    );
    const ref = nb.addSource({ sort: 'reference', reference: 'R1', locator: '45', label: 'page' });
    expect(nb.addSource({ sort: 'reference', reference: 'R1', locator: '45', label: 'page' })).toBe(
      ref,
    );
    expect(nb.addSource({ sort: 'reference', reference: 'R1', locator: '46' })).not.toBe(ref);
    const words = nb.addSource({ sort: 'words', words: 'NRK, 3 May' });
    expect(nb.addSource({ sort: 'words', words: ' NRK, 3 May ' })).toBe(words);
    const file = nb.addSource({ sort: 'file', name: 'a.jpg', time: '2026-01-01T00:00:00Z' });
    expect(nb.addSource({ sort: 'file', name: 'a.jpg', time: '2026-01-01T00:00:00Z' })).toBe(file);
    expect(nb.addSource({ sort: 'file', name: 'a.jpg', time: '2026-01-02T00:00:00Z' })).not.toBe(
      file,
    );
  });

  it('a source is changed, made a reference, and removed only where nothing uses it', () => {
    const nb = new Notebook();
    const web = nb.addSource({ sort: 'web', url: 'https://a.org', title: '', read: 'now' });
    nb.changeSource(web, { title: 'A page' });
    expect(nb.sources.get(web)).toMatchObject({ sort: 'web', title: 'A page' });
    nb.madeReference(web, 'R9');
    expect(nb.sources.get(web)!.reference).toBe('R9');
    const passage = nb.addPassage(web, 'words');
    expect(nb.usesOf(web)).toEqual({ passages: [passage], files: [] });
    expect(nb.removeSource(web)).toBe(false);
    nb.setPassageSource(passage, null);
    expect(nb.removeSource(web)).toBe(true);
    expect(nb.sources.has(web)).toBe(false);
  });

  it('a note says its sources in the order met, and none where something has none', () => {
    const nb = new Notebook();
    const id = nb.addNote();
    const web = nb.addSource({ sort: 'web', url: 'https://a.org', title: '', read: 'now' });
    const p1 = nb.addPassage(web, 'one');
    const p2 = nb.addPassage(null, 'two');
    nb.addText(id, 'one', p1);
    nb.addText(id, 'two', p2);
    nb.holdFile({ hash: HASH, name: 'owl.png', extension: 'png' }, web);
    nb.addFigure(id, { hash: HASH, name: 'owl.png', extension: 'png' });
    expect(nb.note(id)!.sources).toEqual([web, null]);
    expect(nb.notesOf(web)).toEqual([id]);
    expect(nb.notesFrom('R1')).toEqual([]);
    // A passage given its source: the note says it, its text not read again.
    const ref = nb.addSource({ sort: 'reference', reference: 'R1' });
    const pieces = nb.note(id)!.pieces;
    nb.setPassageSource(p2, ref);
    expect(nb.note(id)!.sources).toEqual([web, ref]);
    expect(nb.note(id)!.pieces).toBe(pieces);
    expect(nb.notesFrom('R1')).toEqual([id]);
    // And a page made a reference.
    nb.madeReference(web, 'R2');
    expect(nb.notesFrom('R2')).toEqual([id]);
  });

  it('a file a note holds that the notebook does not know is entered and told', () => {
    const hold = vi.fn();
    const nb = new Notebook(null, { hold });
    const id = nb.addNote();
    nb.holdFile({ hash: HASH, name: 'owl.png', extension: 'png' }, null);
    nb.addFigure(id, { hash: HASH, name: 'owl.png', extension: 'png' });
    expect(hold).not.toHaveBeenCalled();
    // An image of the library dropped into a note.
    nb.addFigure(id, { hash: OTHER, name: 'lib.png', extension: 'png' });
    expect(hold).toHaveBeenCalledWith([OTHER]);
    expect(nb.files.get(OTHER)).toMatchObject({ name: 'lib.png', source: null });
    // Undone, the figure goes and the file stays known.
    nb.undo();
    expect(nb.files.has(OTHER)).toBe(true);
  });

  it('the summary says the files the notes hold, with what a copy was made from', () => {
    const nb = new Notebook();
    const id = nb.addNote();
    nb.holdFile({ hash: HASH, name: 'owl.png', extension: 'png', madeFrom: THIRD }, null);
    nb.addFigure(id, { hash: HASH, name: 'owl.png', extension: 'png' });
    nb.addFile(id, { hash: OTHER, name: 'a.pdf', extension: 'pdf' });
    nb.addNote();
    expect(nb.summary()).toEqual({ notes: 2, files: [HASH, OTHER, THIRD].sort() });
  });

  it('a passage made one’s own keeps its words and loses its mark, in one step of undo', () => {
    const nb = new Notebook();
    const id = nb.addNote();
    const passage = nb.addPassage(null, 'Sing');
    nb.addText(id, 'Sing', passage);
    nb.addText(id, 'and more', passage);
    expect(nb.note(id)!.holds).toMatchObject({ passages: true, own: false });
    nb.undoManager.stopCapturing();
    nb.ownWords(id, passage);
    expect(nb.note(id)!.holds).toMatchObject({ passages: false, own: true });
    expect(nb.note(id)!.words).toContain('sing');
    nb.undo();
    expect(nb.note(id)!.holds).toMatchObject({ passages: true, own: false });
  });

  it('a passage changed since it was taken is told, and brought back', () => {
    const nb = new Notebook();
    const id = nb.addNote();
    const passage = nb.addPassage(null, 'Sing, goddess\nthe wrath');
    nb.addText(id, 'Sing, goddess\nthe wrath', passage);
    expect(nb.readsNow(id, passage)).toBe('Sing, goddess\nthe wrath');
    expect(nb.changedSince(id, passage)).toBe(false);
    // The writer changes words within it, and writes beside it.
    const view = editor(nb, id);
    const doc = view.state.doc;
    view.dispatch(view.state.tr.delete(1, 6)); // "Sing," gone
    view.dispatch(view.state.tr.insertText('Mine. ', 1));
    expect(nb.readsNow(id, passage)).toBe(' goddess\nthe wrath');
    expect(nb.changedSince(id, passage)).toBe(true);
    expect(doc).not.toBe(view.state.doc);
    nb.undoManager.stopCapturing();
    expect(nb.bringBack(id, passage)).toBe(true);
    expect(nb.readsNow(id, passage)).toBe('Sing, goddess\nthe wrath');
    expect(nb.changedSince(id, passage)).toBe(false);
    // The writer's own words stay.
    expect(asEditorReads(nb, id).textContent).toContain('Mine.');
    expect(asEditorReads(nb, id).childCount).toBe(2);
    nb.undo();
    expect(nb.changedSince(id, passage)).toBe(true);
  });

  it('what became of a piece is recorded and not undone', () => {
    const nb = new Notebook();
    const id = nb.addNote();
    nb.undoManager.stopCapturing();
    nb.went(id, { what: 'quotation', project: 'P', name: 'Wrath', element: 'E' });
    expect(nb.note(id)!.went).toEqual([
      expect.objectContaining({ what: 'quotation', project: 'P', name: 'Wrath', element: 'E' }),
    ]);
    nb.undo();
    expect(nb.note(id)).toBeUndefined();
  });
});

describe('the notebook saved and loaded', () => {
  it('what is written is appended, and the state says the summary', async () => {
    const appended: Uint8Array[] = [];
    const saved: NotebookSummary[] = [];
    const persistence: NotebookPersistence = {
      append: async (update) => {
        appended.push(update);
      },
      saveState: async (_state, summary) => {
        saved.push(summary);
      },
    };
    const nb = new Notebook(persistence);
    const id = nb.addNote();
    nb.addText(id, 'Kept');
    await nb.flush();
    expect(appended.length).toBe(1);
    await nb.snapshot();
    expect(saved).toEqual([{ notes: 1, files: [] }]);

    const again = new Notebook();
    again.load(null, appended);
    expect(again.note(id)!.words).toContain('kept');
    expect(again.canUndo).toBe(false);
  });

  it('what another window wrote is applied, and not written again', async () => {
    const append = vi.fn(async () => {});
    const nb = new Notebook({ append, saveState: async () => {} });
    const other = new Notebook();
    const id = other.addNote({ name: 'Elsewhere' });
    nb.applyFromWindow(Y.encodeStateAsUpdate(other.doc));
    expect(nb.note(id)!.name).toBe('Elsewhere');
    await nb.flush();
    expect(append).not.toHaveBeenCalled();
    expect(nb.canUndo).toBe(false);
  });

  it('closed, it lets its document go', async () => {
    const nb = new Notebook();
    await nb.close();
    expect(nb.closed).toBe(true);
  });
});
