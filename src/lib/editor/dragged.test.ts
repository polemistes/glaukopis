import type { Node } from 'prosemirror-model';
import { Slice } from 'prosemirror-model';
import { EditorState, TextSelection } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { dragWhole, draggedIn, movesDragged } from './dragged';
import { bodySchema } from './schema';

const { paragraph, rich } = bodySchema.nodes;
const p = (words = '') => paragraph.create({ kind: 'text' }, words ? bodySchema.text(words) : null);
const box = (...blocks: Node[]) => rich.create(null, blocks);
const text = (...blocks: Node[]) => bodySchema.node('doc', null, blocks);

/** A text as its blocks, a box in brackets. */
const shape = (doc: Node): string => {
  const one = (n: Node): string =>
    n.type.name === 'rich'
      ? `[${Array.from({ length: n.childCount }, (_, i) => one(n.child(i))).join(' | ')}]`
      : n.textContent;
  return Array.from({ length: doc.childCount }, (_, i) => one(doc.child(i))).join(' | ');
};

const plugin = movesDragged();
let view: EditorView;

/** The editor of a text, which says the pointer is at `at.pos`. */
function editor(doc: Node, at: { pos: number }, from = 1, to = from): EditorView {
  view = new EditorView(document.createElement('div'), {
    state: EditorState.create({
      doc,
      selection: TextSelection.create(doc, from, to),
      plugins: [plugin],
    }),
  });
  view.posAtCoords = () => ({ pos: at.pos, inside: -1 });
  return view;
}

/** The event of a drag, as far as it is read here. */
const event = () =>
  ({
    clientX: 0,
    clientY: 0,
    dataTransfer: { clearData() {}, setData() {}, setDragImage() {}, effectAllowed: 'none' },
  }) as unknown as DragEvent;

const begin = (v: EditorView) => {
  plugin.props.handleDOMEvents!.dragstart!.call(plugin, v, event());
  vi.runAllTimers();
};
const drop = (v: EditorView, moved = true) =>
  plugin.props.handleDrop!.call(plugin, v, event(), Slice.empty, moved);

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  view?.destroy();
  vi.useRealTimers();
});

describe('words that are dragged', () => {
  it('are kept from where the drag begins, and selected again before the editor reads the drop', () => {
    // "alpha beta gamma": beta is at 7 to 11.
    const at = { pos: 9 };
    const v = editor(text(p('alpha beta gamma'), p('delta')), at, 7, 11);
    begin(v);
    expect(draggedIn(v)).toEqual({ from: 7, to: 11, whole: false });
    // The web view lets the selection go when the drag has begun.
    v.dispatch(v.state.tr.setSelection(TextSelection.create(v.state.doc, 9)));
    at.pos = 23;
    // The editor goes on, and takes its selection away.
    expect(drop(v)).toBe(false);
    expect([v.state.selection.from, v.state.selection.to]).toEqual([7, 11]);
    expect(draggedIn(v)).toBeNull();
  });

  it('are found where they stand after the text was changed meanwhile', () => {
    const at = { pos: 9 };
    const v = editor(text(p('alpha beta gamma'), p('delta')), at, 7, 11);
    begin(v);
    v.dispatch(v.state.tr.insertText('Now ', 1));
    expect(draggedIn(v)).toEqual({ from: 11, to: 15, whole: false });
    v.dispatch(v.state.tr.delete(10, 16));
    expect(draggedIn(v)).toBeNull();
  });

  it('stay where they are when they are dropped on themselves', () => {
    const at = { pos: 9 };
    const v = editor(text(p('alpha beta gamma')), at, 7, 11);
    begin(v);
    v.dispatch(v.state.tr.setSelection(TextSelection.create(v.state.doc, 9)));
    expect(drop(v)).toBe(true);
    expect(shape(v.state.doc)).toBe('alpha beta gamma');
    expect(draggedIn(v)).toBeNull();
  });

  it('are left to the editor where they are copied, and where nothing of this text is dragged', () => {
    const at = { pos: 9 };
    const v = editor(text(p('alpha beta gamma'), p('delta')), at, 7, 11);
    expect(drop(v)).toBe(false);
    begin(v);
    v.dispatch(v.state.tr.setSelection(TextSelection.create(v.state.doc, 9)));
    at.pos = 23;
    expect(drop(v, false)).toBe(false);
    expect(v.state.selection.empty).toBe(true);
  });

  it('are not kept where the press was beside the selection, or nothing is selected', () => {
    const v = editor(text(p('alpha beta gamma')), { pos: 14 }, 7, 11);
    begin(v);
    expect(draggedIn(v)).toBeNull();
    const w = editor(text(p('alpha beta gamma')), { pos: 9 }, 9);
    begin(w);
    expect(draggedIn(w)).toBeNull();
  });
});

describe('a block dragged whole by its grip', () => {
  /** One | [Two | Three] | Four | Five: the box is at 5 to 17. */
  const doc = () => text(p('One'), box(p('Two'), p('Three')), p('Four'), p('Five'));
  const grip = (v: EditorView, pos: number) => {
    expect(dragWhole(v, pos, event())).toBe(true);
    vi.runAllTimers();
  };

  it('is put after the block it is dropped on the later half of, and taken away where it stood', () => {
    const at = { pos: 0 };
    const v = editor(doc(), at);
    grip(v, 5);
    expect(draggedIn(v)).toEqual({ from: 5, to: 19, whole: true });
    expect(v.dragging?.slice.content.firstChild?.type.name).toBe('rich');
    // In "Five", at its end.
    at.pos = v.state.doc.content.size - 1;
    expect(drop(v)).toBe(true);
    expect(shape(v.state.doc)).toBe('One | Four | Five | [Two | Three]');
    expect(draggedIn(v)).toBeNull();
    // The cursor is in it.
    expect(v.state.selection.$from.parent.textContent).toBe('Two');
  });

  it('is put before the block it is dropped on the first half of', () => {
    const at = { pos: 0 };
    const v = editor(doc(), at);
    grip(v, 5);
    at.pos = 1;
    expect(drop(v)).toBe(true);
    expect(shape(v.state.doc)).toBe('[Two | Three] | One | Four | Five');
    expect(v.state.selection.$from.parent.textContent).toBe('Two');
  });

  it('stays where it is when it is dropped on itself', () => {
    const at = { pos: 0 };
    const v = editor(doc(), at);
    grip(v, 5);
    at.pos = 8;
    const before = v.state.doc;
    expect(drop(v)).toBe(true);
    expect(v.state.doc.eq(before)).toBe(true);
    expect(draggedIn(v)).toBeNull();
  });

  it('is put down a second time where it is copied', () => {
    const at = { pos: 0 };
    const v = editor(doc(), at);
    grip(v, 5);
    at.pos = v.state.doc.content.size - 1;
    expect(drop(v, false)).toBe(true);
    expect(shape(v.state.doc)).toBe('One | [Two | Three] | Four | Five | [Two | Three]');
  });

  it('is put beside another box, never within it', () => {
    const at = { pos: 0 };
    const v = editor(text(box(p('One')), p('Two'), box(p('Three'), p('Four'))), at);
    grip(v, 0);
    // In "Four", within the other box.
    at.pos = v.state.doc.content.size - 3;
    expect(drop(v)).toBe(true);
    expect(shape(v.state.doc)).toBe('Two | [Three | Four] | [One]');
  });

  it('is the only thing in a text and stays so', () => {
    const at = { pos: 2 };
    const v = editor(text(box(p('One'))), at, 2);
    grip(v, 0);
    expect(drop(v)).toBe(true);
    expect(shape(v.state.doc)).toBe('[One]');
  });

  it('is not dragged in a text that is not written in', () => {
    const v = editor(doc(), { pos: 0 });
    v.setProps({ editable: () => false });
    expect(dragWhole(v, 5, event())).toBe(false);
  });
});
