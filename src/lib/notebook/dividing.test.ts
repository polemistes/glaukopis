import { EditorState, NodeSelection, TextSelection } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { ySyncPlugin, yUndoPlugin, yXmlFragmentToProseMirrorRootNode } from 'y-prosemirror';
import { afterEach, describe, expect, it } from 'vitest';
import { bodySchema } from '$lib/editor/schema';
import { divideAt, liftOut } from './dividing';
import { Notebook } from './model/notebook.svelte';
import { CARD_WIDTH } from './model/places';

const HASH = 'a'.repeat(64);

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

/** Puts the cursor, or a selection, in an editor. */
function select(view: EditorView, from: number, to = from) {
  view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, from, to)));
}

/** The place in the editor's document just before the given words. */
function before(view: EditorView, words: string): number {
  let at = -1;
  view.state.doc.descendants((node, pos) => {
    if (at < 0 && node.isText && node.text!.includes(words)) at = pos + node.text!.indexOf(words);
  });
  if (at < 0) throw new Error(`no ${words}`);
  return at;
}

afterEach(() => {
  for (const v of views) v.destroy();
  views = [];
  document.body.innerHTML = '';
});

/** A note of three paragraphs, the second taken in a passage, in a box, with tags, put on the surface. */
function noteToDivide() {
  const nb = new Notebook();
  const box = nb.addBox('Box');
  const id = nb.addNote({ box, tags: ['owl', 'Athena'], at: { x: 40, y: 60 }, width: 300 });
  const passage = nb.addPassage(null, 'Sing, goddess, the wrath');
  nb.addText(id, 'First paragraph');
  nb.addText(id, 'Sing, goddess, the wrath', passage);
  nb.addText(id, 'Last paragraph');
  nb.checkpoint();
  return { nb, box, id, passage, view: editor(nb, id) };
}

describe('a note divided at the cursor', () => {
  it('what follows the cursor, the paragraph split there, is a new note beside the old, in one step of undo', () => {
    const { nb, box, id, passage, view } = noteToDivide();
    select(view, before(view, 'the wrath'));
    const made = divideAt(nb, id, view)!;
    expect(made).toBeTruthy();

    const old = asEditorReads(nb, id);
    expect(old.childCount).toBe(2);
    expect(old.child(0).textContent).toBe('First paragraph');
    expect(old.child(1).textContent).toBe('Sing, goddess, ');
    const cut = asEditorReads(nb, made);
    expect(cut.childCount).toBe(2);
    expect(cut.child(0).textContent).toBe('the wrath');
    expect(cut.child(1).textContent).toBe('Last paragraph');
    // The words taken keep their passage on both sides.
    expect(cut.child(0).firstChild!.marks.map((m) => m.attrs.passage)).toEqual([passage]);
    expect(nb.note(id)!.holds.passages).toBe(true);
    expect(nb.note(made)!.holds.passages).toBe(true);
    // In the same box, with the same tags, beside the old.
    expect(nb.note(made)).toMatchObject({
      box,
      tags: ['Athena', 'owl'],
      at: { x: 40 + 300 + 24, y: 60 },
      width: null,
      height: null,
    });
    expect(nb.list[0].id).toBe(made);

    nb.undo();
    expect(nb.note(made)).toBeUndefined();
    expect(asEditorReads(nb, id).childCount).toBe(3);
    expect(asEditorReads(nb, id).textContent).toBe(
      'First paragraphSing, goddess, the wrathLast paragraph',
    );
    nb.redo();
    expect(nb.note(made)).toBeDefined();
    expect(asEditorReads(nb, id).childCount).toBe(2);
  });

  it('at the start of a paragraph, the cut is between paragraphs; a note not put has a new note not put', () => {
    const nb = new Notebook();
    const id = nb.addNote();
    nb.addText(id, 'One\nTwo');
    nb.checkpoint();
    const view = editor(nb, id);
    select(view, before(view, 'Two'));
    const made = divideAt(nb, id, view)!;
    expect(asEditorReads(nb, id).childCount).toBe(1);
    expect(asEditorReads(nb, id).textContent).toBe('One');
    expect(asEditorReads(nb, made).childCount).toBe(1);
    expect(asEditorReads(nb, made).textContent).toBe('Two');
    expect(nb.note(made)!.at).toBeNull();
  });

  it('at the end of a paragraph, the cut is after it', () => {
    const nb = new Notebook();
    const id = nb.addNote();
    nb.addText(id, 'One\nTwo');
    const view = editor(nb, id);
    select(view, before(view, 'One') + 3);
    const made = divideAt(nb, id, view)!;
    expect(asEditorReads(nb, id).childCount).toBe(1);
    expect(asEditorReads(nb, made).textContent).toBe('Two');
    expect(asEditorReads(nb, made).childCount).toBe(1);
  });

  it('nothing at the very start or the very end, or where one side would hold nothing', () => {
    const nb = new Notebook();
    const id = nb.addNote();
    nb.addText(id, 'One\nTwo');
    const view = editor(nb, id);
    select(view, 1);
    expect(divideAt(nb, id, view)).toBeNull();
    select(view, view.state.doc.content.size - 1);
    expect(divideAt(nb, id, view)).toBeNull();
    expect(nb.list.length).toBe(1);

    const empty = nb.addNote();
    const blank = editor(nb, empty);
    select(blank, 1);
    expect(divideAt(nb, empty, blank)).toBeNull();
  });

  it('a figure after the cursor goes with what follows', () => {
    const nb = new Notebook();
    const id = nb.addNote();
    nb.addText(id, 'Before the picture');
    nb.addFigure(id, { hash: HASH, name: 'owl.png', extension: 'png', alt: 'An owl' });
    const view = editor(nb, id);
    select(view, before(view, 'the picture'));
    const made = divideAt(nb, id, view)!;
    const cut = asEditorReads(nb, made);
    expect(cut.child(0).textContent).toBe('the picture');
    expect(cut.child(1).type.name).toBe('figure');
    expect(cut.child(1).attrs).toMatchObject({ file: HASH, alt: 'An owl' });
    expect(nb.note(made)!.picture).toEqual({ hash: HASH, extension: 'png' });
    expect(asEditorReads(nb, id).childCount).toBe(1);
  });
});

describe('what is selected lifted out of a note', () => {
  it('becomes a new note, and is cut from the old, in one step of undo', () => {
    const { nb, box, id, passage, view } = noteToDivide();
    select(view, before(view, 'goddess'), before(view, 'Last') + 4);
    const made = liftOut(nb, id, view)!;
    const cut = asEditorReads(nb, made);
    expect(cut.childCount).toBe(2);
    expect(cut.child(0).textContent).toBe('goddess, the wrath');
    expect(cut.child(0).firstChild!.marks.map((m) => m.attrs.passage)).toEqual([passage]);
    expect(cut.child(1).textContent).toBe('Last');
    const old = asEditorReads(nb, id);
    expect(old.textContent).toBe('First paragraphSing,  paragraph');
    expect(nb.note(made)).toMatchObject({ box, tags: ['Athena', 'owl'], at: { x: 364, y: 60 } });

    nb.undo();
    expect(nb.note(made)).toBeUndefined();
    expect(asEditorReads(nb, id).textContent).toBe(
      'First paragraphSing, goddess, the wrathLast paragraph',
    );
  });

  it('words within one paragraph keep the kind of their paragraph', () => {
    const nb = new Notebook();
    const id = nb.addNote();
    nb.addText(id, 'A long sentence here');
    const view = editor(nb, id);
    select(view, before(view, 'long'), before(view, 'long') + 4);
    const made = liftOut(nb, id, view)!;
    const cut = asEditorReads(nb, made);
    expect(cut.childCount).toBe(1);
    expect(cut.firstChild!.type.name).toBe('paragraph');
    expect(cut.textContent).toBe('long');
    expect(asEditorReads(nb, id).textContent).toBe('A  sentence here');
    expect(nb.note(made)!.at).toBeNull();
    expect(nb.beside(id)).toBeNull();
    expect(CARD_WIDTH).toBe(280);
  });

  it('a figure selected is lifted out whole', () => {
    const nb = new Notebook();
    const id = nb.addNote();
    nb.addText(id, 'Words');
    nb.addFigure(id, { hash: HASH, name: 'owl.png', extension: 'png' });
    const view = editor(nb, id);
    let figureAt = -1;
    view.state.doc.forEach((node, pos) => {
      if (node.type.name === 'figure') figureAt = pos;
    });
    view.dispatch(view.state.tr.setSelection(NodeSelection.create(view.state.doc, figureAt)));
    const made = liftOut(nb, id, view)!;
    expect(asEditorReads(nb, made).firstChild!.type.name).toBe('figure');
    expect(asEditorReads(nb, id).textContent).toBe('Words');
    expect(nb.note(id)!.holds.pictures).toBe(false);
  });

  it('nothing where nothing is selected, or only empty space', () => {
    const nb = new Notebook();
    const id = nb.addNote();
    nb.addText(id, 'One   two');
    const view = editor(nb, id);
    select(view, 2);
    expect(liftOut(nb, id, view)).toBeNull();
    select(view, before(view, '  two'), before(view, 'two'));
    expect(liftOut(nb, id, view)).toBeNull();
    expect(nb.list.length).toBe(1);
  });
});
