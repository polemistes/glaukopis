import { describe, expect, it } from 'vitest';
import { FIRST_BOX } from '../model/boxes';
import { Notebook } from '../model/notebook.svelte';
import { NOTE_UNPLACED, partNotes, unplacedOf } from './strip';

describe('the notes of a box on its surface', () => {
  it('are parted into the cards put, the oldest first, and the strip, the newest first', () => {
    const nb = new Notebook();
    const day = (d: number) => `2026-01-0${d}T00:00:00.000Z`;
    const old = nb.addNote({ at: { x: 0, y: 0 }, made: day(1) });
    const newer = nb.addNote({ at: { x: 10, y: 0 }, made: day(2) });
    const a = nb.addNote({ made: day(3) });
    const b = nb.addNote({ made: day(4) });
    nb.addNote({ box: nb.addBox('Other'), made: day(5) });
    const { placed, unplaced } = partNotes(nb.list, FIRST_BOX);
    expect(placed.map((n) => n.id)).toEqual([old, newer]);
    expect(unplaced.map((n) => n.id)).toEqual([b, a]);
  });
});

describe('a note dragged from the strip', () => {
  it('is taken only by the surface of its own notebook', () => {
    const nb = new Notebook();
    const other = new Notebook();
    const payload = { kind: NOTE_UNPLACED, data: { notebook: nb, note: 'n1' }, label: '' };
    expect(unplacedOf(payload, nb)).toBe('n1');
    expect(unplacedOf(payload, other)).toBeNull();
    expect(unplacedOf({ kind: 'files', data: [], label: '' }, nb)).toBeNull();
  });
});
