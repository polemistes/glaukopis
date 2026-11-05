import { describe, expect, it } from 'vitest';
import { buildTree, type FlatNode } from '../model/tree';
import type { NodeRecord, Position } from '../model/types';
import { layout, type Size } from './layout';
import { columns, slotAt, SLOT_END, SLOT_REACH } from './slots';

const n = (id: string, parent: string | null, order: string, pos: Position | null = null) =>
  ({ id, parent, order, pos, collapsed: false }) as unknown as NodeRecord & FlatNode;

/** A project with four children, two on each side, the first with two of its own. */
function map(extra: (NodeRecord & FlatNode)[] = []) {
  const nodes = [
    n('p', null, ''),
    n('a', 'p', 'a'),
    n('b', 'p', 'b'),
    n('c', 'p', 'c'),
    n('d', 'p', 'd'),
    n('a1', 'a', 'a'),
    n('a2', 'a', 'b'),
    ...extra,
  ];
  const tree = buildTree(nodes, 'p');
  const byId = new Map(nodes.map((x) => [x.id, x]));
  const sizes = new Map<string, Size>();
  const lay = layout(tree, byId, sizes);
  return { tree, byId, lay };
}

describe('the columns of a map', () => {
  it('are the elements that flow beside each parent, on each side, from the top down', () => {
    const { lay } = map();
    const cols = columns(lay);
    const names = [...cols.entries()].map(([k, v]) => `${k}: ${v.map((p) => p.id).join(' ')}`);
    expect(names.sort()).toEqual(['a|right: a1 a2', 'p|left: c d', 'p|right: a b']);
    for (const list of cols.values()) {
      for (let i = 1; i < list.length; i++) expect(list[i].y).toBeGreaterThan(list[i - 1].y);
    }
  });

  it('leave out what is placed by hand, what is dragged and what is under it', () => {
    const { lay } = map([n('e', 'p', 'e', { x: 300, y: 200 })]);
    expect(
      columns(lay)
        .get('p|right')
        ?.map((p) => p.id),
    ).not.toContain('e');
    const without = columns(lay, new Set(['a', 'a1', 'a2']));
    const left = [...without.values()].flat().map((p) => p.id);
    expect(left.sort()).toEqual(['b', 'c', 'd']);
    expect(without.has('a|right')).toBe(false);
  });

  it('have no column of a single element under the element in view', () => {
    const nodes = [
      n('p', null, ''),
      n('book', 'p', 'a'),
      n('one', 'book', 'a'),
      n('two', 'book', 'b'),
    ];
    const tree = buildTree(nodes, 'p');
    const lay = layout(tree, new Map(nodes.map((x) => [x.id, x])), new Map());
    expect(lay.placed.get('book')!.x).toBe(0);
    expect([...columns(lay).keys()].sort()).toEqual(['book|left', 'book|right']);
  });
});

describe('the slot at a point', () => {
  it('is between the two elements the point lies between, with the line across the column', () => {
    const { tree, lay } = map();
    const a = lay.placed.get('a')!;
    const b = lay.placed.get('b')!;
    const slot = slotAt(lay, tree, { x: a.x, y: (a.y + b.y) / 2 })!;
    expect(slot).toMatchObject({ parent: 'p', index: 1, above: 'a', below: 'b', side: 'right' });
    expect(slot.y).toBeCloseTo((a.y + a.h / 2 + (b.y - b.h / 2)) / 2);
    expect(slot.x0).toBe(Math.min(a.x - a.w / 2, b.x - b.w / 2));
    expect(slot.x1).toBe(Math.max(a.x + a.w / 2, b.x + b.w / 2));
  });

  it('is over the first and under the last, within reach, and nowhere beyond', () => {
    const { tree, lay } = map();
    const a = lay.placed.get('a')!;
    const b = lay.placed.get('b')!;
    const top = a.y - a.h / 2;
    expect(slotAt(lay, tree, { x: a.x, y: top - SLOT_END + 1 })).toMatchObject({
      index: 0,
      above: null,
      below: 'a',
    });
    expect(slotAt(lay, tree, { x: a.x, y: top - SLOT_END - 1 })).toBeNull();
    const bottom = b.y + b.h / 2;
    expect(slotAt(lay, tree, { x: b.x, y: bottom + 2 })).toMatchObject({
      index: 2,
      above: 'b',
      below: null,
    });
    expect(slotAt(lay, tree, { x: a.x + a.w / 2 + SLOT_REACH + 1, y: (a.y + b.y) / 2 })).toBeNull();
  });

  it("counts the place in the parent's list as it is, past the elements placed by hand", () => {
    const { tree, lay } = map([n('e', 'p', 'bb', { x: 300, y: 200 })]);
    expect(tree.children.get('p')).toEqual(['a', 'b', 'e', 'c', 'd']);
    // With the placed element taking room on the right, the first alone goes there, the rest left.
    const a = lay.placed.get('a')!;
    const b = lay.placed.get('b')!;
    const c = lay.placed.get('c')!;
    const d = lay.placed.get('d')!;
    expect([a.side, b.side, c.side, d.side]).toEqual(['right', 'left', 'left', 'left']);
    expect(slotAt(lay, tree, { x: a.x, y: a.y - a.h / 2 - 2 })).toMatchObject({
      above: null,
      below: 'a',
      index: 0,
    });
    expect(slotAt(lay, tree, { x: b.x, y: (b.y + c.y) / 2 })).toMatchObject({
      parent: 'p',
      side: 'left',
      above: 'b',
      below: 'c',
      index: 2,
    });
    expect(slotAt(lay, tree, { x: d.x, y: d.y + d.h / 2 + 2 })).toMatchObject({
      above: 'd',
      below: null,
      index: 5,
    });
  });

  it('is of the nearer column where two reach the point, and of none a parent refuses', () => {
    const { tree, lay } = map();
    const a1 = lay.placed.get('a1')!;
    const a2 = lay.placed.get('a2')!;
    const between = { x: a1.x, y: (a1.y + a2.y) / 2 };
    expect(slotAt(lay, tree, between)).toMatchObject({ parent: 'a', above: 'a1', below: 'a2' });
    expect(slotAt(lay, tree, between, new Set(), (parent) => parent !== 'a')).toBeNull();
    // What is dragged is in no column, and its own room is a slot like any other.
    const b = lay.placed.get('b')!;
    const slot = slotAt(lay, tree, { x: b.x, y: b.y }, new Set(['b']))!;
    expect(slot).toMatchObject({ parent: 'p', above: 'a', below: null, index: 1 });
  });
});
