import { TextSelection } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import { afterEach, describe, expect, it } from 'vitest';
import { setKind, toggleDone, toggleDoneAt } from './commands';
import { onTheBox } from './ticking';
import { editorOf, press, shapeOf, type } from './testing';

let view: EditorView | undefined;
const open = (blocks: string[]) => (view = editorOf(blocks));

afterEach(() => {
  view?.destroy();
  view = undefined;
  document.body.innerHTML = '';
});

describe('a point to tick, typed', () => {
  it('is made by a box at the start of a paragraph, ticked by an x', () => {
    const v = open(['text: |']);
    type(v, '[ ] Buy bread');
    expect(shapeOf(v)).toEqual(['todo: Buy bread|']);
    const w = open(['text: |']);
    type(w, '[x] Read the proofs');
    expect(shapeOf(w)).toEqual(['todo done: Read the proofs|']);
    const e = open(['text: |']);
    type(e, '[] Empty box');
    expect(shapeOf(e)).toEqual(['todo: Empty box|']);
  });

  it('is made after the dash of a point, keeping its indent and the mark of its line', () => {
    const v = open(['text: |']);
    type(v, '- [ ] Buy bread');
    expect(shapeOf(v)).toEqual(['todo: Buy bread|']);
    const w = open(['item>2: {n=4}|']);
    type(w, '[X] Within');
    expect(shapeOf(w)).toEqual(['todo>2 done: {n=4}Within|']);
  });

  it('is not made after words, nor in a paragraph of another kind', () => {
    const v = open(['text: So |']);
    type(v, '[ ] not');
    expect(shapeOf(v)).toEqual(['text: So [ ] not|']);
    const w = open(['quote: |']);
    type(w, '[ ] not');
    expect(shapeOf(w)).toEqual(['quote: [ ] not|']);
    const n = open(['numbered: |']);
    type(n, '[ ] not');
    expect(shapeOf(n)).toEqual(['numbered: [ ] not|']);
  });

  it('is made and unmade by its key', () => {
    const v = open(['text: Buy| bread']);
    expect(press(v, '9', { ctrlKey: true, shiftKey: true })).toBe(true);
    expect(shapeOf(v)).toEqual(['todo: Buy| bread']);
    press(v, '9', { ctrlKey: true, shiftKey: true });
    expect(shapeOf(v)).toEqual(['text: Buy| bread']);
  });
});

describe('ticking', () => {
  it('ticks and unticks the point the cursor is in by the key, in one step', () => {
    const v = open(['todo: Buy| bread', 'todo: Read']);
    expect(press(v, 'Enter', { ctrlKey: true })).toBe(true);
    expect(shapeOf(v)).toEqual(['todo done: Buy| bread', 'todo: Read']);
    press(v, 'Enter', { ctrlKey: true });
    expect(shapeOf(v)).toEqual(['todo: Buy| bread', 'todo: Read']);
  });

  it('ticks every point selected where one is not, and unticks them where all are', () => {
    const v = open(['todo done: One', 'text: Between', 'todo: Two']);
    v.dispatch(
      v.state.tr.setSelection(TextSelection.create(v.state.doc, 2, v.state.doc.content.size - 2)),
    );
    toggleDone()(v.state, v.dispatch, v);
    expect(shapeOf(v)).toEqual(['todo done: One', 'text: Between', 'todo done: Two']);
    toggleDone()(v.state, v.dispatch, v);
    expect(shapeOf(v)).toEqual(['todo: One', 'text: Between', 'todo: Two']);
  });

  it('does nothing where no point to tick is', () => {
    const v = open(['item: A |point']);
    expect(toggleDone()(v.state, v.dispatch, v)).toBe(false);
    expect(shapeOf(v)).toEqual(['item: A |point']);
  });

  it('ticks the point a press on its box fell on, and no paragraph of another kind', () => {
    const v = open(['todo: One|', 'todo: Two']);
    const second = v.state.doc.child(0).nodeSize;
    expect(toggleDoneAt(second)(v.state, v.dispatch, v)).toBe(true);
    expect(shapeOf(v)).toEqual(['todo: One|', 'todo done: Two']);
    const w = open(['item: One|']);
    expect(toggleDoneAt(0)(w.state, w.dispatch, w)).toBe(false);
  });

  it('finds the box by where the press fell: before the words, on the first line', () => {
    const place = { left: 100, top: 50, padding: 30, em: 16, line: 26 };
    // The box stands in the 1.1em before the words.
    expect(onTheBox(place, 118, 60)).toBe(true);
    expect(onTheBox(place, 129, 51)).toBe(true);
    // On the words, before the box, or below the first line, it is not.
    expect(onTheBox(place, 131, 60)).toBe(false);
    expect(onTheBox(place, 100, 60)).toBe(false);
    expect(onTheBox(place, 118, 80)).toBe(false);
  });
});

describe('a point to tick and the keys of writing', () => {
  it('gives a new point to tick, not ticked, by Enter', () => {
    const v = open(['todo done: Buy bread|']);
    press(v, 'Enter');
    expect(shapeOf(v)).toEqual(['todo done: Buy bread', 'todo: |']);
  });

  it('keeps the tick with the words where Enter is pressed before them', () => {
    const v = open(['todo done: |Buy bread']);
    press(v, 'Enter');
    expect(shapeOf(v)).toEqual(['todo: ', 'todo done: |Buy bread']);
  });

  it('leaves the list on an empty point by Enter, and the tick with it', () => {
    const v = open(['todo>1 done: |']);
    press(v, 'Enter');
    expect(shapeOf(v)).toEqual(['text: |']);
  });

  it('takes the tick away where the point becomes of another kind, and keeps its indent among the lists', () => {
    const v = open(['todo>1 done: Buy| bread']);
    setKind('item')(v.state, v.dispatch, v);
    expect(shapeOf(v)).toEqual(['item>1: Buy| bread']);
    setKind('todo')(v.state, v.dispatch, v);
    expect(shapeOf(v)).toEqual(['todo>1: Buy| bread']);
    setKind('text')(v.state, v.dispatch, v);
    expect(shapeOf(v)).toEqual(['text: Buy| bread']);
  });
});
