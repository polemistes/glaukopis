import { describe, expect, it } from 'vitest';
import { buildTree, type FlatNode } from '../model/tree';
import type { NodeRecord } from '../model/types';
import {
  associationCurve,
  balance,
  H_GAP,
  hierarchyLine,
  layout,
  neighbour,
  V_GAP,
  type Size,
} from './layout';

function make(spec: Record<string, Partial<NodeRecord> & { parent: string | null }>) {
  const flat: FlatNode[] = [];
  const nodes = new Map<string, NodeRecord>();
  const sizes = new Map<string, Size>();
  let i = 0;
  for (const [id, s] of Object.entries(spec)) {
    const order = `a${String(i++).padStart(2, '0')}`;
    flat.push({ id, map: 'm', parent: s.parent, order });
    nodes.set(id, {
      id,
      map: 'm',
      order,
      pos: null,
      side: null,
      collapsed: false,
      heading: true,
      excluded: false,
      include: null,
      refs: [],
      origin: null,
      title: id,
      titleHtml: id,
      empty: true,
      words: 0,
      cited: [],
      notes: 0,
      ...s,
    } as NodeRecord);
    sizes.set(id, { w: 100, h: 40 });
  }
  return { tree: buildTree(flat, 'm', 'r'), nodes, sizes };
}

describe('the layout of a map', () => {
  it('puts the centre in the middle and its children on their sides', () => {
    const { tree, nodes, sizes } = make({
      r: { parent: null },
      a: { parent: 'r' },
      b: { parent: 'r' },
      c: { parent: 'r' },
    });
    const l = layout(tree, nodes, sizes);
    const p = (id: string) => l.placed.get(id)!;
    expect([p('r').x, p('r').y]).toEqual([0, 0]);
    expect(p('a').x).toBe(50 + H_GAP + 50);
    expect(p('b').x).toBe(p('a').x);
    expect(p('b').y - p('a').y).toBe(40 + V_GAP);
    expect(p('a').y + p('b').y).toBe(0);
    expect(p('c').x).toBe(-(50 + H_GAP + 50));
    expect(p('c').y).toBe(0);
    expect(p('c').side).toBe('left');
  });

  it('gives each branch the room its children need', () => {
    const { tree, nodes, sizes } = make({
      r: { parent: null },
      a: { parent: 'r' },
      a1: { parent: 'a' },
      a2: { parent: 'a' },
      a3: { parent: 'a' },
      b: { parent: 'r' },
      c: { parent: 'r' },
      c1: { parent: 'c' },
      c2: { parent: 'c' },
      c3: { parent: 'c' },
      c4: { parent: 'c' },
    });
    const l = layout(tree, nodes, sizes);
    const p = (id: string) => l.placed.get(id)!;
    // a is centred on its three children, b is below the whole branch.
    expect(p('a').y).toBe(p('a2').y);
    expect(p('b').y - p('a3').y).toBe(40 + V_GAP);
    expect(p('a1').x).toBeGreaterThan(p('a').x);
    // Nothing overlaps.
    const boxes = [...l.placed.values()];
    for (const x of boxes) {
      for (const y of boxes) {
        if (x.id >= y.id) continue;
        const apart =
          Math.abs(x.x - y.x) >= (x.w + y.w) / 2 || Math.abs(x.y - y.y) >= (x.h + y.h) / 2;
        expect(apart, `${x.id} and ${y.id}`).toBe(true);
      }
    }
  });

  it('leaves an element where the user put it, and its branch follows', () => {
    const { tree, nodes, sizes } = make({
      r: { parent: null },
      a: { parent: 'r' },
      b: { parent: 'r', pos: { x: -300, y: 200 } },
      b1: { parent: 'b' },
    });
    const l = layout(tree, nodes, sizes);
    const p = (id: string) => l.placed.get(id)!;
    expect([p('b').x, p('b').y]).toEqual([-300, 200]);
    expect(p('b').pinned).toBe(true);
    expect(p('b').side).toBe('left');
    expect(p('b1').x).toBeLessThan(p('b').x);
    expect(p('b1').y).toBe(200);
    // The one that flows is centred as if alone.
    expect(p('a').y).toBe(0);
  });

  it('holds what is being dragged where the pointer has it', () => {
    const { tree, nodes, sizes } = make({
      r: { parent: null },
      a: { parent: 'r' },
      a1: { parent: 'a' },
      b: { parent: 'r' },
    });
    const l = layout(tree, nodes, sizes, new Map([['a', { x: -500, y: 300 }]]));
    const p = (id: string) => l.placed.get(id)!;
    expect([p('a').x, p('a').y]).toEqual([-500, 300]);
    expect(p('a1').x).toBeLessThan(-500);
    // What flows takes the room as if the held one were not there.
    expect(p('b').y).toBe(0);
  });

  it('divides the children of the centre so that the sides balance', () => {
    expect(balance([40, 40])).toBe(1);
    expect(balance([40, 40, 40])).toBe(2);
    expect(balance([40, 40, 40, 40])).toBe(2);
    expect(balance([200, 40, 40, 40])).toBe(1);
    expect(balance([40])).toBe(1);
    expect(balance([])).toBe(0);
  });

  it('hides what is under a collapsed element and counts it', () => {
    const { tree, nodes, sizes } = make({
      r: { parent: null },
      a: { parent: 'r', collapsed: true },
      a1: { parent: 'a' },
      a2: { parent: 'a1' },
    });
    const l = layout(tree, nodes, sizes);
    expect(l.order).toEqual(['r', 'a']);
    expect(l.placed.get('a')!.hidden).toBe(2);
  });

  it('places loose elements where they are', () => {
    const { tree, nodes, sizes } = make({
      r: { parent: null },
      l: { parent: null, pos: { x: -400, y: -100 } },
      l1: { parent: 'l' },
    });
    const l = layout(tree, nodes, sizes);
    expect(l.placed.get('l')!.x).toBe(-400);
    expect(l.placed.get('l1')!.x).toBeLessThan(-400);
    expect(l.bounds.left).toBe(l.placed.get('l1')!.x - 50);
  });
});

describe('lines', () => {
  const { tree, nodes, sizes } = make({
    r: { parent: null },
    a: { parent: 'r' },
    b: { parent: 'r' },
    c: { parent: 'r', pos: { x: 0, y: 200 } },
  });
  const l = layout(tree, nodes, sizes);
  const p = (id: string) => l.placed.get(id)!;

  it('run from side to side, or from top to bottom', () => {
    expect(hierarchyLine(p('r'), p('a'))).toEqual([
      { x: 50, y: 0 },
      { x: p('a').x - 50, y: 0 },
    ]);
    expect(hierarchyLine(p('r'), p('b'))[0]).toEqual({ x: -50, y: 0 });
    expect(hierarchyLine(p('r'), p('c'))).toEqual([
      { x: 0, y: 20 },
      { x: 0, y: 180 },
    ]);
  });

  it('associations bow, the same way from either end', () => {
    const one = associationCurve(p('a'), p('b'));
    const other = associationCurve(p('b'), p('a'));
    expect(one.path).toMatch(/^M [-\d.]+ [-\d.]+ Q /);
    expect(one.middle.y).not.toBe(0);
    expect(Math.round(one.middle.y)).toBe(Math.round(other.middle.y));
  });

  it('the arrow keys find what lies in their direction', () => {
    expect(neighbour(l, 'r', 'right')).toBe('a');
    expect(neighbour(l, 'r', 'left')).toBe('b');
    expect(neighbour(l, 'r', 'down')).toBe('c');
    expect(neighbour(l, 'a', 'left')).toBe('r');
    expect(neighbour(l, 'r', 'up')).toBeNull();
  });
});
