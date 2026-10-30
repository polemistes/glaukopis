import { describe, expect, it } from 'vitest';
import { buildTree, viewOf, type FlatNode } from '../model/tree';
import type { NodeRecord } from '../model/types';
import {
  associationCurve,
  balance,
  H_GAP,
  hierarchyLine,
  layout,
  neighbour,
  V_GAP,
  type Layout,
  type Size,
} from './layout';

/** The pairs of boxes that lie over each other. */
function overlaps(l: Layout): string[] {
  const out: string[] = [];
  const boxes = [...l.placed.values()];
  for (const x of boxes) {
    for (const y of boxes) {
      if (x.id >= y.id) continue;
      const apart =
        Math.abs(x.x - y.x) >= (x.w + y.w) / 2 || Math.abs(x.y - y.y) >= (x.h + y.h) / 2;
      if (!apart) out.push(`${x.id} and ${y.id}`);
    }
  }
  return out;
}

/** The lines from an element to one under it that pass through some other box. */
function crossings(l: Layout): string[] {
  const out: string[] = [];
  for (const p of l.placed.values()) {
    if (!p.parent) continue;
    const q = l.placed.get(p.parent)!;
    const [a, b] = hierarchyLine(q, p);
    for (const z of l.placed.values()) {
      if (z.id === p.id || z.id === q.id) continue;
      for (let t = 0; t <= 1; t += 0.005) {
        const x = a.x + (b.x - a.x) * t;
        const y = a.y + (b.y - a.y) * t;
        if (Math.abs(x - z.x) < z.w / 2 && Math.abs(y - z.y) < z.h / 2) {
          out.push(`${q.id} to ${p.id} through ${z.id}`);
          break;
        }
      }
    }
  }
  return out;
}

/** A tree with `root` at the top, the elements in the order given. */
function make(spec: Record<string, Partial<NodeRecord> & { parent: string | null }>, root = 'r') {
  const flat: FlatNode[] = [];
  const nodes = new Map<string, NodeRecord>();
  const sizes = new Map<string, Size>();
  let i = 0;
  for (const [id, s] of Object.entries(spec)) {
    const order = `a${String(i++).padStart(2, '0')}`;
    flat.push({ id, parent: s.parent, order });
    nodes.set(id, {
      id,
      order,
      pos: null,
      collapsed: false,
      heading: true,
      excluded: false,
      include: null,
      origin: null,
      status: null,
      kind: null,
      when: null,
      document: {},
      timeline: {},
      title: id,
      titleHtml: id,
      empty: true,
      words: 0,
      cited: [],
      notes: 0,
      noteWords: 0,
      set: [],
      uses: [],
      ...s,
    });
    sizes.set(id, { w: 100, h: 40 });
  }
  return { tree: buildTree(flat, root), nodes, sizes };
}

describe('the layout of a map', () => {
  it('puts the element in view in the middle and its children on their sides', () => {
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

  it('packs each branch against the outline of the one before, not under the whole of it', () => {
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
    // a is centred on its three children; b, with nothing under it, stands
    // close under a, and a's children fan out past it.
    expect(p('a').y).toBe(p('a2').y);
    expect(p('b').y - p('a').y).toBe(40 + V_GAP);
    expect(p('b').y).toBeLessThanOrEqual(p('a3').y);
    expect(p('a1').x).toBeGreaterThan(p('a').x);
    expect(p('c').side).toBe('left');
    expect(p('c').y).toBe((p('c1').y + p('c4').y) / 2);
    expect(overlaps(l)).toEqual([]);
    expect(crossings(l)).toEqual([]);
  });

  it('an element wider than the one before stands clear of the lines that fan past it', () => {
    const { tree, nodes, sizes } = make({
      r: { parent: null },
      a: { parent: 'r' },
      a1: { parent: 'a' },
      a2: { parent: 'a' },
      a3: { parent: 'a' },
      a4: { parent: 'a' },
      b: { parent: 'r' },
      c: { parent: 'r' },
      c1: { parent: 'c' },
      c2: { parent: 'c' },
      c3: { parent: 'c' },
      c4: { parent: 'c' },
      c5: { parent: 'c' },
      c6: { parent: 'c' },
    });
    sizes.set('b', { w: 140, h: 40 });
    const l = layout(tree, nodes, sizes);
    const p = (id: string) => l.placed.get(id)!;
    expect(p('b').side).toBe('right');
    // Its top clears the line to a4 where that passes b's right edge, 40 past a's; still beside the fan.
    expect(p('b').y - p('a').y).toBeCloseTo((75 * 40) / 64 + V_GAP + 20);
    expect(p('b').y).toBeLessThan(p('a4').y + 40 + V_GAP);
    expect(overlaps(l)).toEqual([]);
    expect(crossings(l)).toEqual([]);
  });

  it('lays out a large tree of every shape and width with nothing over anything', () => {
    // A tree of a few hundred elements, the same every time.
    let seed = 7;
    const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
    const flat: FlatNode[] = [];
    const nodes = new Map<string, NodeRecord>();
    const sizes = new Map<string, Size>();
    const add = (id: string, parent: string | null) => {
      flat.push({ id, parent, order: id });
      nodes.set(id, { ...make({ x: { parent: null } }).nodes.get('x')!, id, order: id });
      sizes.set(id, { w: 60 + Math.floor(rnd() * 200), h: rnd() < 0.2 ? 53 : 34 });
    };
    const grow = (parent: string, depth: number) => {
      const kids = depth === 0 ? 9 : rnd() < 0.45 ? 1 + Math.floor(rnd() * 7) : 0;
      for (let i = 0; i < kids; i++) {
        const id = `${parent}.${i}`;
        add(id, parent);
        if (depth < 5) grow(id, depth + 1);
      }
    };
    add('r', null);
    grow('r', 0);
    const l = layout(buildTree(flat, 'r'), nodes, sizes);
    expect(l.placed.size).toBeGreaterThan(150);
    expect(overlaps(l)).toEqual([]);
    expect(crossings(l)).toEqual([]);
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

  it('the others close the gap of an element the user put somewhere, and the sides are balanced anew', () => {
    const spec = {
      r: { parent: null },
      a: { parent: 'r' },
      b: { parent: 'r' },
      c: { parent: 'r' },
      d: { parent: 'r' },
    };
    const flowing = make(spec);
    const before = layout(flowing.tree, flowing.nodes, flowing.sizes);
    const placed = make({ ...spec, c: { parent: 'r', pos: { x: -400, y: 300 } } });
    const loose = layout(placed.tree, placed.nodes, placed.sizes);
    const p = (l: Layout, id: string) => l.placed.get(id)!;
    expect([p(loose, 'c').x, p(loose, 'c').y]).toEqual([-400, 300]);
    expect(['a', 'b', 'd'].some((id) => p(loose, id).y !== p(before, id).y)).toBe(true);
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
    // The held one keeps its room on its own side; what flows on the other side stands as it did.
    expect(p('b').y).toBe(0);
  });

  it('divides the children of the centre so that the sides balance', () => {
    expect(balance([40, 40])).toBe(1);
    expect(balance([40, 40, 40])).toBe(2);
    expect(balance([40, 40, 40, 40])).toBe(2);
    expect(balance([200, 40, 40, 40])).toBe(1);
    expect(balance([40])).toBe(1);
    // What the sides hold already counts: with the right side full, the rest goes left.
    expect(balance([40, 40], 200, 0)).toBe(0);
    expect(balance([40, 40], 0, 200)).toBe(2);
    expect(balance([40], 56, 0)).toBe(0);
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

  it('keeps the element in view at the origin, whatever its place and however it is held', () => {
    const { tree, nodes, sizes } = make({
      r: { parent: null, pos: { x: 300, y: 120 } },
      a: { parent: 'r' },
    });
    const l = layout(tree, nodes, sizes, new Map([['r', { x: -500, y: 300 }]]));
    const p = (id: string) => l.placed.get(id)!;
    expect([p('r').x, p('r').y]).toEqual([0, 0]);
    expect(p('r').pinned).toBe(false);
    expect(p('a').x).toBe(50 + H_GAP + 50);
  });

  it('never folds the element in view', () => {
    const { tree, nodes, sizes } = make({
      r: { parent: null, collapsed: true },
      a: { parent: 'r' },
      a1: { parent: 'a' },
    });
    const l = layout(tree, nodes, sizes);
    expect(l.order).toEqual(['r', 'a', 'a1']);
    expect(l.placed.get('r')!.hidden).toBe(0);
  });

  it('lays out a view of the whole tree from the element in view', () => {
    const { tree, nodes, sizes } = make(
      {
        project: { parent: null },
        r: { parent: 'project', pos: { x: 300, y: 120 } },
        a: { parent: 'r' },
        b: { parent: 'r', pos: { x: -200, y: 80 } },
        other: { parent: 'project' },
      },
      'project',
    );
    const view = viewOf(tree, 'r');
    const l = layout(view, nodes, sizes);
    const p = (id: string) => l.placed.get(id)!;
    expect(l.order[0]).toBe('r');
    expect(l.order.slice().sort()).toEqual(['a', 'b', 'r']);
    expect([p('r').x, p('r').y]).toEqual([0, 0]);
    expect(p('r').depth).toBe(0);
    expect(p('a').depth).toBe(1);
    // Placed by hand, relative to the element in view, which stands at the origin.
    expect([p('b').x, p('b').y]).toEqual([-200, 80]);
    expect(l.placed.has('other')).toBe(false);
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
