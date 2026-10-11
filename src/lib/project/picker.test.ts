import { describe, expect, it } from 'vitest';
import { buildTree, type FlatNode } from './model/tree';
import { PROJECT } from './model/types';
import { carriedWithin, findElements, pickElement, picker, pickRows } from './picker.svelte';
import type { Project } from './model/project.svelte';

const n = (id: string, parent: string | null, order = 'a'): FlatNode => ({ id, parent, order });

// The project, two trees, and a branch under the first.
const tree = buildTree([
  n(PROJECT, null),
  n('book', PROJECT, 'a1'),
  n('notes', PROJECT, 'a2'),
  n('one', 'book', 'a1'),
  n('two', 'book', 'a2'),
  n('deep', 'one'),
]);
const names: Record<string, string> = {
  [PROJECT]: 'Essays',
  book: 'The book',
  notes: 'Notes',
  one: 'Chapter one',
  two: 'Chapter two',
  deep: 'Élan vital',
};
const nameOf = (id: string) => names[id] ?? '';

describe('the lines of the picker', () => {
  it('shows the project and its trees, the rest folded', () => {
    const rows = pickRows(tree, () => false);
    expect(rows.map((r) => r.id)).toEqual([PROJECT, 'book', 'notes']);
    expect(rows[0]).toMatchObject({ depth: 0, holds: true, open: true });
    expect(rows[1]).toMatchObject({ depth: 1, holds: true, open: false });
    expect(rows[2]).toMatchObject({ holds: false, open: false });
  });

  it('shows what is under an unfolded element, a step further in', () => {
    const open = new Set(['book', 'one']);
    const rows = pickRows(tree, (id) => open.has(id));
    expect(rows.map((r) => [r.id, r.depth])).toEqual([
      [PROJECT, 0],
      ['book', 1],
      ['one', 2],
      ['deep', 3],
      ['two', 2],
      ['notes', 1],
    ]);
  });
});

describe('finding an element by name', () => {
  it('finds names that begin so first, then those that hold it, with their way', () => {
    const found = findElements(tree, nameOf, 'cha');
    expect(found.map((f) => f.id)).toEqual(['one', 'two']);
    expect(found[0].path).toEqual(['Essays', 'The book']);
    expect(findElements(tree, nameOf, 'n').map((f) => f.id)).toEqual(['notes', 'one', 'deep']);
  });

  it('takes letters with and without accents alike, and capitals as small', () => {
    expect(findElements(tree, nameOf, 'ELAN').map((f) => f.id)).toEqual(['deep']);
    expect(findElements(tree, nameOf, 'élan')[0].path).toEqual([
      'Essays',
      'The book',
      'Chapter one',
    ]);
  });

  it('finds nothing for nothing written', () => {
    expect(findElements(tree, nameOf, '  ')).toEqual([]);
  });
});

describe('what cannot take what is carried', () => {
  it('is what is carried and all under it, never the project', () => {
    expect([...carriedWithin(tree, ['one', 'notes'])].sort()).toEqual(['deep', 'notes', 'one']);
    expect([...carriedWithin(tree, [PROJECT])]).toEqual([]);
  });
});

describe('asking for an element', () => {
  const project = {} as Project;

  it('answers with what is chosen', async () => {
    const asked = pickElement(project, { title: 'Move', action: 'Move here' });
    expect(picker.current?.title).toBe('Move');
    picker.answer('notes');
    expect(await asked).toBe('notes');
    expect(picker.current).toBeNull();
  });

  it('answers nothing to a question put aside by another', async () => {
    const first = pickElement(project, { title: 'Copy', action: 'Copy here' });
    const second = pickElement(project, { title: 'Move', action: 'Move here' });
    expect(await first).toBeNull();
    picker.answer(null);
    expect(await second).toBeNull();
  });
});
