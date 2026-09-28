import { describe, expect, it } from 'vitest';
import { buildTree, type FlatNode } from '../model/tree';
import { Folding } from './folding.svelte';

/**
 * book
 *   one
 *     one-a
 *       one-a-i
 *     one-b
 *   two
 *     two-a
 *   three
 */
const nodes: FlatNode[] = [
  ['book', null],
  ['one', 'book'],
  ['one-a', 'one'],
  ['one-a-i', 'one-a'],
  ['one-b', 'one'],
  ['two', 'book'],
  ['two-a', 'two'],
  ['three', 'book'],
].map(([id, parent], i) => ({
  id: id as string,
  map: 'm',
  parent: parent as string | null,
  order: String.fromCharCode(97 + i),
}));
const tree = buildTree(nodes, 'm', 'book');

describe('what is folded away in the text', () => {
  it('an element is folded, and opened again', () => {
    const f = new Folding();
    expect(f.hides(tree, 'one')).toBe(false);
    f.toggle(tree, 'one');
    expect(f.hides(tree, 'one')).toBe(true);
    f.toggle(tree, 'one');
    expect(f.hides(tree, 'one')).toBe(false);
  });

  it('an element with nothing under it is not folded', () => {
    const f = new Folding();
    f.toggle(tree, 'three');
    expect(f.has('three')).toBe(false);
    // One that was folded and has lost what was under it hides nothing.
    const g = new Folding(['three']);
    expect(g.hides(tree, 'three')).toBe(false);
  });

  it('what is folded under a folded element is as it was when that is opened', () => {
    const f = new Folding();
    f.fold('one-a');
    f.fold('one');
    f.open('one');
    expect(f.hides(tree, 'one')).toBe(false);
    expect(f.hides(tree, 'one-a')).toBe(true);
  });

  it('all that is folded under an element is opened at once, and nothing beside it', () => {
    const f = new Folding(['one', 'one-a', 'two']);
    expect(f.anyFolded(tree, 'one')).toBe(true);
    f.openAll(tree, 'one');
    expect(f.kept(() => true)).toEqual(['two']);
    expect(f.anyFolded(tree, 'one')).toBe(false);
    expect(f.anyFolded(tree, 'book')).toBe(true);
    f.openAll(tree, 'book');
    expect(f.kept(() => true)).toEqual([]);
  });

  it('all under an element is folded, and the element itself is open', () => {
    const f = new Folding(['book']);
    expect(f.anyOpen(tree, 'book')).toBe(true);
    f.foldAll(tree, 'book');
    expect(f.kept(() => true)).toEqual(['one', 'one-a', 'two']);
    expect(f.anyOpen(tree, 'book')).toBe(false);
  });

  it('an element that is hidden is shown by opening what it is folded under', () => {
    const f = new Folding(['one', 'one-a', 'two']);
    expect(f.hiddenUnder(tree, 'one-a-i')).toBe('one');
    expect(f.hiddenUnder(tree, 'one')).toBe(null);
    expect(f.reveal(tree, 'one-a-i')).toBe(true);
    expect(f.kept(() => true)).toEqual(['two']);
    expect(f.reveal(tree, 'one-a-i')).toBe(false);
  });

  it('what is kept is of the elements that there still are', () => {
    const f = new Folding(['two', 'gone', 'one']);
    expect(f.kept((id) => id !== 'gone')).toEqual(['one', 'two']);
  });

  it('all under an element, in the order of the text', () => {
    expect(new Folding().under(tree, 'one')).toEqual(['one-a', 'one-a-i', 'one-b']);
  });
});
