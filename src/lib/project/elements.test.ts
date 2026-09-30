import { describe, expect, it } from 'vitest';
import { indent, outdent, shift } from './elements';
import { Project } from './model/project.svelte';

function project() {
  const p = new Project(null);
  const map = p.createMap('Wrath');
  const root = p.map(map)!.root;
  const a = p.addChild(root, { title: 'A' })!;
  const b = p.addChild(root, { title: 'B' })!;
  const c = p.addChild(root, { title: 'C' })!;
  const names = () => {
    const tree = p.tree(map);
    return tree.sequence
      .map((id) => `${'-'.repeat(tree.depth.get(id) ?? 0)}${p.node(id)!.title}`)
      .join(' ');
  };
  return { p, map, a, b, c, names };
}

describe('moving an element by the keys', () => {
  it('up and down among those beside it, and no further', () => {
    const { p, map, b, c, names } = project();
    expect(shift(p, p.tree(map), b, -1)).toBe(true);
    expect(names()).toBe('Wrath -B -A -C');
    expect(shift(p, p.tree(map), b, -1)).toBe(false);
    expect(shift(p, p.tree(map), c, 1)).toBe(false);
    expect(shift(p, p.tree(map), b, 1)).toBe(true);
    expect(names()).toBe('Wrath -A -B -C');
  });

  it('under the one before it, and out again after its parent', () => {
    const { p, map, a, b, c, names } = project();
    expect(indent(p, p.tree(map), a)).toBe(false);
    expect(indent(p, p.tree(map), b)).toBe(true);
    expect(indent(p, p.tree(map), c)).toBe(true);
    expect(names()).toBe('Wrath -A --B --C');
    expect(outdent(p, p.tree(map), b)).toBe(true);
    expect(names()).toBe('Wrath -A --C -B');
    // The centre has nothing beside it to go out to.
    expect(outdent(p, p.tree(map), a)).toBe(false);
  });

  it('is one step to undo', () => {
    const { p, map, b, names } = project();
    p.checkpoint();
    indent(p, p.tree(map), b);
    p.undo();
    expect(names()).toBe('Wrath -A -B -C');
  });
});
