import { describe, expect, it } from 'vitest';
import { indent, outdent, shift } from './elements';
import { Project } from './model/project.svelte';
import { PROJECT } from './model/types';

function project() {
  const p = new Project(null);
  p.begin('Wrath');
  const a = p.addChild(PROJECT, { title: 'A' })!;
  const b = p.addChild(PROJECT, { title: 'B' })!;
  const c = p.addChild(PROJECT, { title: 'C' })!;
  const names = () => {
    const tree = p.tree();
    return tree.sequence
      .map((id) => `${'-'.repeat(tree.depth.get(id) ?? 0)}${p.node(id)!.title}`)
      .join(' ');
  };
  return { p, a, b, c, names };
}

describe('moving an element by the keys', () => {
  it('up and down among those beside it, and no further', () => {
    const { p, b, c, names } = project();
    expect(shift(p, p.tree(), b, -1)).toBe(true);
    expect(names()).toBe('Wrath -B -A -C');
    expect(shift(p, p.tree(), b, -1)).toBe(false);
    expect(shift(p, p.tree(), c, 1)).toBe(false);
    expect(shift(p, p.tree(), b, 1)).toBe(true);
    expect(names()).toBe('Wrath -A -B -C');
  });

  it('under the one before it, and out again after its parent', () => {
    const { p, a, b, c, names } = project();
    expect(indent(p, p.tree(), a)).toBe(false);
    expect(indent(p, p.tree(), b)).toBe(true);
    expect(indent(p, p.tree(), c)).toBe(true);
    expect(names()).toBe('Wrath -A --B --C');
    expect(outdent(p, p.tree(), b)).toBe(true);
    expect(names()).toBe('Wrath -A --C -B');
    // A child of the project has nothing beside the project to go out to.
    expect(outdent(p, p.tree(), a)).toBe(false);
  });

  it('leaves the element in view where it is, and what is under it within it', () => {
    const { p, a, b, c, names } = project();
    indent(p, p.tree(), b);
    indent(p, p.tree(), c);
    // Seen from A: A is the top, and B and C are its children.
    expect(indent(p, p.tree(a), a)).toBe(false);
    expect(shift(p, p.tree(a), a, 1)).toBe(false);
    expect(outdent(p, p.tree(a), a)).toBe(false);
    expect(outdent(p, p.tree(a), b)).toBe(false);
    expect(indent(p, p.tree(a), c)).toBe(true);
    expect(names()).toBe('Wrath -A --B ---C');
    expect(outdent(p, p.tree(b), c)).toBe(false);
    expect(outdent(p, p.tree(a), c)).toBe(true);
    expect(names()).toBe('Wrath -A --B --C');
  });

  it('is one step to undo', () => {
    const { p, b, names } = project();
    p.checkpoint();
    indent(p, p.tree(), b);
    p.undo();
    expect(names()).toBe('Wrath -A -B -C');
  });
});
