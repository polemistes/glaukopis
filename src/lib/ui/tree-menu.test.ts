import { describe, expect, it } from 'vitest';
import type { MenuItem } from './menu.svelte';
import { indented, inTreeOrder, treeMenu, type TreeNode } from './tree-menu';

const nodes: TreeNode[] = [
  { id: 'd', name: 'D' },
  { id: 'b', name: 'B', parent: 'a' },
  { id: 'a', name: 'A' },
  { id: 'c', name: 'C', parent: 'b' },
  { id: 'x10', name: 'Item 10', parent: 'a' },
  { id: 'x2', name: 'item 2', parent: 'a' },
];

const shown = (items: MenuItem[]) =>
  items.map((i) => (i.kind === undefined || i.kind === 'item' ? `${i.depth}:${i.label}` : '-'));

describe('a tree as a menu', () => {
  it('lists each before what lies in it, siblings by name as people sort, with its depth', () => {
    expect(inTreeOrder(nodes).map(({ node, depth }) => `${depth}:${node.name}`)).toEqual([
      '0:A',
      '1:B',
      '2:C',
      '1:item 2',
      '1:Item 10',
      '0:D',
    ]);
  });

  it('gives each item its depth, not spaces that HTML would run together', () => {
    const items = treeMenu(nodes, () => ({ action: () => {} }));
    expect(shown(items)).toEqual(['0:A', '1:B', '2:C', '1:item 2', '1:Item 10', '0:D']);
    expect(items.every((i) => 'label' in i && !i.label.startsWith(' '))).toBe(true);
  });

  it('leaves out what it is asked to with all that lies in it, and puts the icon on the top ones', () => {
    const Icon = (() => {}) as never;
    const items = treeMenu(nodes, () => ({ action: () => {} }), {
      leave: (n) => n.id === 'b',
      icon: Icon,
    });
    expect(shown(items)).toEqual(['0:A', '1:item 2', '1:Item 10', '0:D']);
    expect(items.map((i) => ('icon' in i ? i.icon : undefined))).toEqual([
      Icon,
      undefined,
      undefined,
      Icon,
    ]);
  });

  it('puts one whose parent is gone at the top, so that it can still be chosen', () => {
    const lost = [...nodes, { id: 'e', name: 'E', parent: 'gone' }];
    expect(inTreeOrder(lost).map(({ node, depth }) => `${depth}:${node.name}`)).toContain('0:E');
  });

  it('never walks for ever where the parents go round', () => {
    const round = [
      { id: 'p', name: 'P', parent: 'q' },
      { id: 'q', name: 'Q', parent: 'p' },
    ];
    expect(inTreeOrder(round)).toEqual([]);
  });

  it('indents a label for a native option by spaces that are kept', () => {
    expect(indented('C', 2)).toBe('  C');
    expect(indented('A', 0)).toBe('A');
    expect(indented('A', -1)).toBe('A');
  });
});
