import { describe, expect, it } from 'vitest';
import { buildTree, isAncestor, pathTo, subtree, topmost, viewOf, type FlatNode } from './tree';
import { PROJECT } from './types';

const n = (id: string, parent: string | null, order = 'a'): FlatNode => ({ id, parent, order });
const root = n(PROJECT, null);

describe('the tree of a project', () => {
  it('orders children by their keys, then by id', () => {
    const t = buildTree([
      root,
      n('b', PROJECT, 'a2'),
      n('a', PROJECT, 'a1'),
      n('d', PROJECT, 'a1'),
      n('c', 'a'),
    ]);
    expect(t.root).toBe(PROJECT);
    expect(t.children.get(PROJECT)).toEqual(['a', 'd', 'b']);
    expect(t.sequence).toEqual([PROJECT, 'a', 'c', 'd', 'b']);
    expect(t.depth.get('c')).toBe(2);
  });

  it('has its root even where no element of that id is', () => {
    const t = buildTree([n('a', PROJECT), n('b', 'a')]);
    expect(t.sequence).toEqual([PROJECT, 'a', 'b']);
    expect(t.parent.get(PROJECT)).toBeNull();
  });

  it('puts elements without a parent, or with one that is gone, under the root', () => {
    const t = buildTree([root, n('l', null, 'b'), n('o', 'gone', 'a'), n('k', 'l')]);
    expect(t.children.get(PROJECT)).toEqual(['o', 'l']);
    expect(t.sequence).toEqual([PROJECT, 'o', 'l', 'k']);
    expect(t.parent.get('o')).toBe(PROJECT);
  });

  it('breaks a cycle at the member with the smallest id', () => {
    // b -> c -> d -> b, and e under d.
    const t = buildTree([root, n('b', 'd'), n('c', 'b'), n('d', 'c'), n('e', 'd')]);
    expect(t.children.get(PROJECT)).toEqual(['b']);
    expect(t.sequence).toEqual([PROJECT, 'b', 'c', 'd', 'e']);
    // The same whatever order the elements arrive in.
    const u = buildTree([n('e', 'd'), n('d', 'c'), n('c', 'b'), n('b', 'd'), root]);
    expect(u.sequence).toEqual(t.sequence);
  });

  it('does not let the root be under anything', () => {
    const t = buildTree([n(PROJECT, 'a'), n('a', PROJECT)]);
    expect(t.parent.get(PROJECT)).toBeNull();
    expect(t.children.get(PROJECT)).toEqual(['a']);
    expect(t.sequence).toEqual([PROJECT, 'a']);
  });

  it('an element cannot be its own parent', () => {
    const t = buildTree([root, n('s', 's')]);
    expect(t.children.get(PROJECT)).toEqual(['s']);
  });

  it('is seen from any element, with the way up still known', () => {
    const t = buildTree([root, n('a', PROJECT), n('b', 'a'), n('c', 'b'), n('d', PROJECT, 'b')]);
    const v = viewOf(t, 'a');
    expect(v.root).toBe('a');
    expect(v.sequence).toEqual(['a', 'b', 'c']);
    expect(v.depth.get('a')).toBe(0);
    expect(v.depth.get('c')).toBe(2);
    expect(v.parent.get('a')).toBe(PROJECT);
    expect(pathTo(v, 'c')).toEqual([PROJECT, 'a', 'b', 'c']);
    expect(viewOf(t, PROJECT)).toBe(t);
  });

  it('answers questions about kinship', () => {
    const t = buildTree([root, n('a', PROJECT), n('b', 'a'), n('c', 'b'), n('d', PROJECT, 'b')]);
    expect(subtree(t, 'a')).toEqual(['a', 'b', 'c']);
    expect(isAncestor(t, 'a', 'c')).toBe(true);
    expect(isAncestor(t, 'c', 'a')).toBe(false);
    expect(isAncestor(t, 'a', 'a')).toBe(false);
    expect(pathTo(t, 'c')).toEqual([PROJECT, 'a', 'b', 'c']);
    expect(topmost(t, ['c', 'a', 'd', 'b'])).toEqual(['a', 'd']);
  });
});
