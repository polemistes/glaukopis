import { describe, expect, it } from 'vitest';
import { buildTree, isAncestor, pathTo, subtree, topmost, type FlatNode } from './tree';

const n = (id: string, parent: string | null, order = 'a', map = 'm'): FlatNode => ({
  id,
  map,
  parent,
  order,
});

describe('the tree of a map', () => {
  it('orders children by their keys, then by id', () => {
    const t = buildTree(
      [n('r', null), n('b', 'r', 'a2'), n('a', 'r', 'a1'), n('d', 'r', 'a1'), n('c', 'a')],
      'm',
      'r',
    );
    expect(t.children.get('r')).toEqual(['a', 'd', 'b']);
    expect(t.sequence).toEqual(['r', 'a', 'c', 'd', 'b']);
    expect(t.depth.get('c')).toBe(2);
    expect(t.loose).toEqual([]);
  });

  it('keeps to its own map', () => {
    const t = buildTree([n('r', null), n('x', 'r', 'a', 'other'), n('y', 'x')], 'm', 'r');
    expect(t.sequence).toEqual(['r', 'y']);
    expect(t.loose).toEqual(['y']);
  });

  it('treats elements without a parent, or with one that is gone, as loose', () => {
    const t = buildTree(
      [n('r', null), n('l', null, 'b'), n('o', 'gone', 'a'), n('k', 'l')],
      'm',
      'r',
    );
    expect(t.loose).toEqual(['o', 'l']);
    expect(t.sequence).toEqual(['r', 'o', 'l', 'k']);
    expect(t.parent.get('o')).toBeNull();
  });

  it('breaks a cycle at the member with the smallest id', () => {
    // b -> c -> d -> b, and e under d.
    const t = buildTree(
      [n('r', null), n('b', 'd'), n('c', 'b'), n('d', 'c'), n('e', 'd')],
      'm',
      'r',
    );
    expect(t.loose).toEqual(['b']);
    expect(t.sequence).toEqual(['r', 'b', 'c', 'd', 'e']);
    // The same whatever order the elements arrive in.
    const u = buildTree(
      [n('e', 'd'), n('d', 'c'), n('c', 'b'), n('b', 'd'), n('r', null)],
      'm',
      'r',
    );
    expect(u.sequence).toEqual(t.sequence);
  });

  it('does not let the root be under anything', () => {
    const t = buildTree([n('r', 'a'), n('a', 'r')], 'm', 'r');
    expect(t.root).toBe('r');
    expect(t.children.get('r')).toEqual(['a']);
    expect(t.sequence).toEqual(['r', 'a']);
  });

  it('an element cannot be its own parent', () => {
    const t = buildTree([n('r', null), n('s', 's')], 'm', 'r');
    expect(t.loose).toEqual(['s']);
  });

  it('answers questions about kinship', () => {
    const t = buildTree(
      [n('r', null), n('a', 'r'), n('b', 'a'), n('c', 'b'), n('d', 'r', 'b')],
      'm',
      'r',
    );
    expect(subtree(t, 'a')).toEqual(['a', 'b', 'c']);
    expect(isAncestor(t, 'a', 'c')).toBe(true);
    expect(isAncestor(t, 'c', 'a')).toBe(false);
    expect(isAncestor(t, 'a', 'a')).toBe(false);
    expect(pathTo(t, 'c')).toEqual(['r', 'a', 'b', 'c']);
    expect(topmost(t, ['c', 'a', 'd', 'b'])).toEqual(['a', 'd']);
  });
});
