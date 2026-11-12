import { afterEach, describe, expect, it } from 'vitest';
import { toasts } from '$lib/ui/toast.svelte';
import {
  indent,
  outdent,
  putDragged,
  removeElements,
  shift,
  standsAt,
  type ElementsPayload,
} from './elements';
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

describe('elements dragged to a place in the order', () => {
  const dragged = (p: Project, ids: string[]): ElementsPayload => ({
    project: p,
    at: PROJECT,
    ids,
    grab: { x: 0, y: 0 },
  });

  it('are moved there, or copied, in one step', () => {
    const { p, a, b, c, names } = project();
    p.checkpoint();
    expect(putDragged(p, dragged(p, [c]), { parent: a, index: 0 }, false)).toEqual([c]);
    expect(names()).toBe('Wrath -A --C -B');
    expect(putDragged(p, dragged(p, [a]), { parent: PROJECT, index: 2 }, false)).toEqual([a]);
    expect(names()).toBe('Wrath -B -A --C');
    p.undo();
    expect(names()).toBe('Wrath -A --C -B');
    const made = putDragged(p, dragged(p, [b]), { parent: a, index: 1 }, true);
    expect(made.length).toBe(1);
    expect(made[0]).not.toBe(b);
    expect(names()).toBe('Wrath -A --C --B -B');
  });

  it('are left as they are where one would stand where it stands', () => {
    const { p, a, b, names } = project();
    expect(standsAt(p.tree(), b, PROJECT, 1)).toBe(true);
    expect(standsAt(p.tree(), b, PROJECT, 2)).toBe(true);
    expect(standsAt(p.tree(), b, PROJECT, 0)).toBe(false);
    expect(standsAt(p.tree(), b, PROJECT, 3)).toBe(false);
    expect(standsAt(p.tree(), b, a, 0)).toBe(false);
    p.checkpoint();
    const steps = p.undoManager.undoStack.length;
    expect(putDragged(p, dragged(p, [b]), { parent: PROJECT, index: 2 }, false)).toEqual([]);
    expect(p.undoManager.undoStack.length).toBe(steps);
    expect(names()).toBe('Wrath -A -B -C');
    // A copy made there is a copy all the same.
    expect(putDragged(p, dragged(p, [b]), { parent: PROJECT, index: 2 }, true).length).toBe(1);
    expect(names()).toBe('Wrath -A -B -B -C');
  });

  it('are carried across from the project beside, and taken away there', () => {
    const { p, a, names } = project();
    const other = project();
    const made = putDragged(p, dragged(other.p, [other.b]), { parent: a, index: 0 }, false);
    expect(made.length).toBe(1);
    expect(names()).toBe('Wrath -A --B -B -C');
    expect(other.names()).toBe('Wrath -A -C');
  });
});

describe('deleting one element', () => {
  afterEach(() => {
    for (const toast of [...toasts.list]) toasts.dismiss(toast.id);
  });

  it('with text offers its undo, though the element is gone when that is asked', () => {
    const p = new Project(null);
    p.begin('Wrath');
    const a = p.addChild(PROJECT, { title: 'A', body: 'Sing, goddess, the wrath.' })!;
    expect(removeElements(p, [a])).toBe(1);
    expect(toasts.list.filter((toast) => toast.action)).toHaveLength(1);
  });

  it('with no text and nothing under it goes without a word', () => {
    const p = new Project(null);
    p.begin('Wrath');
    const a = p.addChild(PROJECT, { title: 'A' })!;
    expect(removeElements(p, [a])).toBe(1);
    expect(toasts.list).toEqual([]);
  });
});
