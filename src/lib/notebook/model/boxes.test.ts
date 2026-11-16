import { describe, expect, it } from 'vitest';
import * as Y from 'yjs';
import { FIRST_BOX } from './boxes';
import { Notebook } from './notebook.svelte';
import {
  CARD_WIDTH,
  MAX_CARD_HEIGHT,
  MAX_CARD_WIDTH,
  MIN_CARD_HEIGHT,
  MIN_CARD_WIDTH,
} from './places';

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

const names = (nb: Notebook) => nb.boxes.map((b) => [b.id === FIRST_BOX ? 'first' : b.name]);

describe('the boxes of the notebook', () => {
  it('the first box is always there, first, with no name until it is given one', () => {
    const nb = new Notebook();
    expect(nb.boxes).toEqual([{ id: FIRST_BOX, name: '', order: '' }]);
    const id = nb.addNote();
    expect(nb.note(id)!.box).toBe(FIRST_BOX);
    nb.renameBox(FIRST_BOX, '  In  tray ');
    nb.checkpoint();
    expect(nb.boxes[0]).toEqual({ id: FIRST_BOX, name: 'In tray', order: '' });
    nb.renameBox(FIRST_BOX, '');
    expect(nb.boxes[0].name).toBe('');
    nb.deleteBox(FIRST_BOX);
    expect(nb.boxes.length).toBe(1);
    // Undone, the name comes back, and then the first has none again.
    nb.undo();
    expect(nb.boxes[0].name).toBe('In tray');
  });

  it('boxes are made, named, moved and deleted, each one step of undo', () => {
    const nb = new Notebook();
    const a = nb.addBox('Athena');
    nb.checkpoint();
    const b = nb.addBox('Bia');
    nb.checkpoint();
    const c = nb.addBox(' Charis ');
    nb.checkpoint();
    expect(nb.boxes.map((x) => x.id)).toEqual([FIRST_BOX, a, b, c]);
    expect(nb.boxes[3].name).toBe('Charis');

    nb.moveBox(c, a);
    nb.checkpoint();
    expect(nb.boxes.map((x) => x.id)).toEqual([FIRST_BOX, c, a, b]);
    nb.moveBox(c, null);
    nb.checkpoint();
    expect(nb.boxes.map((x) => x.id)).toEqual([FIRST_BOX, a, b, c]);
    // Before the first is the first after it: the first stays first.
    nb.moveBox(b, FIRST_BOX);
    nb.checkpoint();
    expect(nb.boxes.map((x) => x.id)).toEqual([FIRST_BOX, b, a, c]);
    nb.moveBox(FIRST_BOX, null);
    expect(nb.boxes[0].id).toBe(FIRST_BOX);

    nb.renameBox(a, 'Athene');
    nb.checkpoint();
    expect(nb.boxes[2].name).toBe('Athene');
    // A box other than the first given nothing keeps its name.
    nb.renameBox(a, '  ');
    expect(nb.boxes[2].name).toBe('Athene');

    nb.undo();
    expect(nb.boxes[2].name).toBe('Athena');
    nb.undo();
    expect(nb.boxes.map((x) => x.id)).toEqual([FIRST_BOX, a, b, c]);
    nb.undo();
    nb.undo();
    expect(nb.boxes.map((x) => x.id)).toEqual([FIRST_BOX, a, b, c]);
    nb.undo();
    expect(nb.boxes.map((x) => x.id)).toEqual([FIRST_BOX, a, b]);
  });

  it('two boxes of one order, made at once in two windows, are put in order when one is moved', () => {
    const { a, b, sync } = two();
    const one = a.addBox('One');
    const other = b.addBox('Other');
    // Made apart, both have the first order there is.
    expect(a.yBoxes.get(one)!.get('order')).toBe(b.yBoxes.get(other)!.get('order'));
    sync();
    expect(a.boxes.length).toBe(3);
    const [, first, second] = a.boxes.map((x) => x.id);
    a.moveBox(first, null);
    expect(a.boxes.map((x) => x.id)).toEqual([FIRST_BOX, second, first]);
    a.moveBox(first, second);
    expect(a.boxes.map((x) => x.id)).toEqual([FIRST_BOX, first, second]);
  });

  it('a note is moved to a box and is not yet put there; a box deleted gives its notes to the first', () => {
    const nb = new Notebook();
    const box = nb.addBox('Owls');
    const n1 = nb.addNote({ made: '2026-11-15T10:00:00.000Z' });
    const n2 = nb.addNote({ made: '2026-11-15T11:00:00.000Z', box, at: { x: 10.4, y: 20.6 } });
    expect(nb.note(n2)).toMatchObject({ box, at: { x: 10, y: 21 } });
    nb.place([{ id: n1, at: { x: 5, y: 5 } }]);
    nb.checkpoint();
    nb.moveToBox([n1], box);
    nb.checkpoint();
    expect(nb.note(n1)).toMatchObject({ box, at: null });
    expect(nb.notesIn(box).map((n) => n.id)).toEqual([n2, n1]);
    expect(nb.notesIn(FIRST_BOX)).toEqual([]);
    // Moved to the box it is in, it stays where it lies.
    nb.moveToBox([n2], box);
    expect(nb.note(n2)!.at).toEqual({ x: 10, y: 21 });
    // Not to a box that is not there.
    nb.moveToBox([n2], 'nowhere');
    expect(nb.note(n2)!.box).toBe(box);

    nb.deleteBox(box);
    expect(nb.boxes.length).toBe(1);
    expect(nb.note(n1)).toMatchObject({ box: FIRST_BOX, at: null });
    expect(nb.note(n2)).toMatchObject({ box: FIRST_BOX, at: null });
    expect(nb.notesIn(FIRST_BOX).map((n) => n.id)).toEqual([n2, n1]);
    nb.undo();
    expect(nb.boxes.map((x) => x.id)).toEqual([FIRST_BOX, box]);
    expect(nb.note(n2)).toMatchObject({ box, at: { x: 10, y: 21 } });
    nb.undo();
    expect(nb.note(n1)).toMatchObject({ box: FIRST_BOX, at: { x: 5, y: 5 } });
  });

  it('the first box receives what is made outside the page until another is made the one; deleted, the first does again', () => {
    const nb = new Notebook();
    const a = nb.addBox('Athena');
    const b = nb.addBox('Bia');
    nb.checkpoint();
    expect(nb.receiving).toBe(FIRST_BOX);
    nb.receiveIn(b);
    nb.checkpoint();
    expect(nb.receiving).toBe(b);
    // One box at a time: the mark goes from the one that had it.
    nb.receiveIn(a);
    nb.checkpoint();
    expect(nb.receiving).toBe(a);
    expect(nb.yBoxes.get(b)!.has('receives')).toBe(false);
    nb.undo();
    expect(nb.receiving).toBe(b);
    nb.redo();
    // A box that is not there is not made the one.
    nb.receiveIn('no such box');
    expect(nb.receiving).toBe(a);
    nb.receiveIn(FIRST_BOX);
    nb.checkpoint();
    expect(nb.receiving).toBe(FIRST_BOX);
    expect(nb.yBoxes.get(a)!.has('receives')).toBe(false);
    nb.receiveIn(a);
    nb.checkpoint();
    nb.deleteBox(a);
    expect(nb.receiving).toBe(FIRST_BOX);
    // Read again from what was kept, the box that receives is known.
    nb.receiveIn(b);
    const again = new Notebook();
    again.load(Y.encodeStateAsUpdate(nb.doc), []);
    expect(again.receiving).toBe(b);
  });

  it('two boxes made the one that receives at once in two windows: the first of them in their order is', () => {
    const { a, b, sync } = two();
    const athena = a.addBox('Athena');
    const bia = a.addBox('Bia');
    sync();
    a.receiveIn(bia);
    b.receiveIn(athena);
    sync();
    expect(a.receiving).toBe(athena);
    expect(b.receiving).toBe(athena);
    // Made the one again, it alone has the mark.
    a.receiveIn(bia);
    sync();
    expect(b.receiving).toBe(bia);
    expect(b.yBoxes.get(athena)!.has('receives')).toBe(false);
  });

  it('two copies see each other’s boxes, and a note in a box deleted in the other lies in the first', () => {
    const { a, b, sync } = two();
    const box = a.addBox('Shared');
    const id = a.addNote({ box });
    sync();
    expect(b.boxes.map((x) => x.name)).toEqual(['', 'Shared']);
    expect(b.note(id)!.box).toBe(box);
    b.renameBox(box, 'Shared too');
    b.renameBox(FIRST_BOX, 'Inbox');
    sync();
    expect(a.boxes.map((x) => x.name)).toEqual(['Inbox', 'Shared too']);
    // A box deleted in one copy while a note was moved into it in the other.
    const late = b.addNote();
    sync();
    a.yBoxes.delete(box);
    b.moveToBox([late], box);
    sync();
    expect(a.boxes.length).toBe(1);
    expect(a.note(late)!.box).toBe(FIRST_BOX);
    expect(b.note(late)!.box).toBe(FIRST_BOX);
    expect(names(a)).toEqual([['first']]);
  });
});

describe('the places and widths of cards', () => {
  it('cards are put, taken off and made wider, in whole numbers and within bounds', () => {
    const nb = new Notebook();
    const a = nb.addNote();
    const b = nb.addNote();
    nb.checkpoint();
    expect(nb.note(a)).toMatchObject({ at: null, width: null });
    nb.place([
      { id: a, at: { x: 10.2, y: -3.7 } },
      { id: b, at: { x: 400, y: 0 } },
      { id: 'gone', at: { x: 1, y: 1 } },
    ]);
    nb.checkpoint();
    expect(nb.note(a)!.at).toEqual({ x: 10, y: -4 });
    expect(nb.note(b)!.at).toEqual({ x: 400, y: 0 });
    // All moved at once are one step of undo.
    nb.undo();
    expect(nb.note(a)!.at).toBeNull();
    expect(nb.note(b)!.at).toBeNull();
    nb.redo();

    nb.setWidth(a, 333.6);
    nb.checkpoint();
    expect(nb.note(a)!.width).toBe(334);
    nb.setWidth(a, 10);
    expect(nb.note(a)!.width).toBe(MIN_CARD_WIDTH);
    nb.setWidth(a, 10_000);
    expect(nb.note(a)!.width).toBe(MAX_CARD_WIDTH);
    nb.setWidth(a, null);
    expect(nb.note(a)!.width).toBeNull();
    expect(CARD_WIDTH).toBe(280);

    // A card has a height of its own only where it was given one.
    expect(nb.note(a)!.height).toBeNull();
    nb.setHeight(a, 211.4);
    nb.checkpoint();
    expect(nb.note(a)!.height).toBe(211);
    nb.setHeight(a, 1);
    expect(nb.note(a)!.height).toBe(MIN_CARD_HEIGHT);
    nb.setHeight(a, 100_000);
    expect(nb.note(a)!.height).toBe(MAX_CARD_HEIGHT);
    nb.setHeight(a, null);
    expect(nb.note(a)!.height).toBeNull();

    nb.unplace([a]);
    nb.checkpoint();
    expect(nb.note(a)!.at).toBeNull();
    nb.undo();
    expect(nb.note(a)!.at).toEqual({ x: 10, y: -4 });
  });

  it('a note cut from another is put to the right of its card', () => {
    const nb = new Notebook();
    const a = nb.addNote();
    expect(nb.beside(a)).toBeNull();
    nb.place([{ id: a, at: { x: 100, y: 50 } }]);
    expect(nb.beside(a)).toEqual({ x: 100 + CARD_WIDTH + 24, y: 50 });
    nb.setWidth(a, 400);
    expect(nb.beside(a)).toEqual({ x: 524, y: 50 });
  });

  it('a change to a note’s box, place or width does not read its text again', () => {
    const nb = new Notebook();
    const box = nb.addBox('Box');
    const id = nb.addNote();
    nb.addText(id, 'Some words');
    const pieces = nb.note(id)!.pieces;
    nb.place([{ id, at: { x: 1, y: 2 } }]);
    nb.setWidth(id, 300);
    nb.moveToBox([id], box);
    nb.setName(id, 'Named');
    expect(nb.note(id)!.pieces).toBe(pieces);
    expect(nb.note(id)!.words).toContain('named');
    nb.addText(id, 'More');
    expect(nb.note(id)!.pieces).not.toBe(pieces);
  });
});

describe('finding notes', () => {
  it('by words, within a box, having every tag given', () => {
    const nb = new Notebook();
    const box = nb.addBox('Owls');
    const a = nb.addNote({ made: '2026-11-15T10:00:00.000Z', box, tags: ['bird', 'Athena'] });
    const b = nb.addNote({ made: '2026-11-15T11:00:00.000Z', tags: ['bird'] });
    const c = nb.addNote({ made: '2026-11-15T12:00:00.000Z', box });
    nb.addText(a, 'The owl of Athena');
    nb.addText(b, 'An owl in the night');
    nb.addText(c, 'Grey eyes');
    expect(nb.find('owl').map((n) => n.id)).toEqual([b, a]);
    expect(nb.find('owl', { box }).map((n) => n.id)).toEqual([a]);
    expect(nb.find('', { box }).map((n) => n.id)).toEqual([c, a]);
    expect(nb.find('', { tags: ['bird'] }).map((n) => n.id)).toEqual([b, a]);
    expect(nb.find('', { tags: ['bird', 'Athena'] }).map((n) => n.id)).toEqual([a]);
    expect(nb.find('night', { box: null, tags: ['bird'] }).map((n) => n.id)).toEqual([b]);
    expect(nb.find('', { box: FIRST_BOX }).map((n) => n.id)).toEqual([b]);
  });
});
