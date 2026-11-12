import { describe, expect, it } from 'vitest';
import { Project } from './model/project.svelte';
import { PROJECT } from './model/types';
import {
  depthWanted,
  DRAG_STEP,
  listed,
  OUTLINE_STEP,
  outlineFolds,
  outlineIndent,
  outlineItems,
  outlinePlace,
} from './outline';
import { Folding } from './text/folding.svelte';

describe('the outline', () => {
  it('lists every element as deep as it stands, and leaves out what is under a folded one', () => {
    const p = new Project(null);
    p.begin('Wrath');
    const a = p.addChild(PROJECT, { title: 'A' })!;
    const a1 = p.addChild(a, { title: 'A1' })!;
    p.addChild(a1, { title: 'A1a' });
    const b = p.addChild(PROJECT, { title: 'B' })!;
    const items = outlineItems(p, PROJECT, new Folding());
    expect(items.map((i) => `${i.level}:${p.node(i.id)!.title}`)).toEqual([
      '0:Wrath',
      '1:A',
      '2:A1',
      '3:A1a',
      '1:B',
    ]);
    expect(items.find((i) => i.id === a)!.children).toBe(1);
    expect(items.find((i) => i.id === b)!.children).toBe(0);
    const folded = outlineFolds(PROJECT);
    folded.add(a);
    expect(listed(items, folded).map((i) => p.node(i.id)!.title)).toEqual(['Wrath', 'A', 'B']);
    folded.delete(a);
    folded.add(a1);
    expect(listed(items, folded).map((i) => p.node(i.id)!.title)).toEqual([
      'Wrath',
      'A',
      'A1',
      'B',
    ]);
    // Folding one without children hides nothing.
    folded.add(b);
    expect(listed(items, folded).length).toBe(4);
  });

  it('is of the element in view, which stands at the top', () => {
    const p = new Project(null);
    p.begin('Wrath');
    const a = p.addChild(PROJECT, { title: 'A' })!;
    const a1 = p.addChild(a, { title: 'A1' })!;
    p.addChild(a1, { title: 'A1a' });
    p.addChild(PROJECT, { title: 'B' });
    const items = outlineItems(p, a, new Folding());
    expect(items.map((i) => `${i.level}:${p.node(i.id)!.title}`)).toEqual(['0:A', '1:A1', '2:A1a']);
  });
});

describe('elements dragged over the outline', () => {
  function book() {
    const p = new Project(null);
    p.begin('Wrath');
    const a = p.addChild(PROJECT, { title: 'A' })!;
    const a1 = p.addChild(a, { title: 'A1' })!;
    const a2 = p.addChild(a, { title: 'A2' })!;
    const b = p.addChild(PROJECT, { title: 'B' })!;
    const c = p.addChild(PROJECT, { title: 'C' })!;
    return { p, a, a1, a2, b, c };
  }

  it('stand as deep as the rows are set in, the deepest no further in than the sixth', () => {
    expect(outlineIndent(0)).toBe(4);
    expect(outlineIndent(2) - outlineIndent(1)).toBe(OUTLINE_STEP);
    expect(outlineIndent(9)).toBe(outlineIndent(6));
  });

  it('are wanted as deep as they stood, and a level more or less for each step sideways', () => {
    const grabbed = { x: 200, depth: 2 };
    expect(depthWanted(200, grabbed, 38)).toBe(2);
    expect(depthWanted(200 + DRAG_STEP / 2 - 1, grabbed, 38)).toBe(2);
    expect(depthWanted(200 + DRAG_STEP, grabbed, 38)).toBe(3);
    expect(depthWanted(200 - 2 * DRAG_STEP, grabbed, 38)).toBe(0);
    // From elsewhere: as deep as the names the pointer is over.
    expect(depthWanted(38, null, 38)).toBe(1);
    expect(depthWanted(38 + 2 * OUTLINE_STEP, null, 38)).toBe(3);
  });

  it('go between two rows, as deep as is wanted among the depths the place allows', () => {
    const { p, a, a1, a2, b, c } = book();
    // B is dragged: the rows are those without it, and the place is under A2.
    const rows = [PROJECT, a, a1, a2, c];
    const at = (wanted: number) => outlinePlace(p, PROJECT, rows, 3, wanted, [b]);
    expect(at(3)).toMatchObject({ parent: a2, index: 0, depth: 3 });
    expect(at(2)).toMatchObject({ parent: a, index: 2, depth: 2 });
    // Where it stands already: after A, before C.
    expect(at(1)).toMatchObject({ parent: PROJECT, index: 1, depth: 1 });
    // No deeper than under the row above, no less deep than the row below.
    expect(at(9)).toMatchObject({ parent: a2, depth: 3 });
    expect(at(-4)).toMatchObject({ parent: PROJECT, depth: 1 });
    // Between A and A1 there is one place: the first under A.
    expect(outlinePlace(p, PROJECT, rows, 1, 1, [b])).toMatchObject({ parent: a, index: 0 });
    // Under the element in view, at the top.
    expect(outlinePlace(p, PROJECT, rows, 0, 1, [b])).toMatchObject({ parent: PROJECT, index: 0 });
    // After the last, as far out as the first level.
    expect(outlinePlace(p, PROJECT, rows, 4, 1, [b])).toMatchObject({ parent: PROJECT, index: 3 });
    expect(outlinePlace(p, PROJECT, rows, 4, 2, [b])).toMatchObject({ parent: c, index: 0 });
  });

  it('go under none of themselves, wherever in the project they stand', () => {
    const { p, a, a1, a2 } = book();
    // A dragged from another view of the project over the outline of A1, which is under it.
    expect(outlinePlace(p, a1, [a1], 0, 1, [a])).toBeNull();
    // The elements of another project go anywhere.
    expect(outlinePlace(p, a1, [a1], 0, 1, null)).toMatchObject({ parent: a1, index: 0 });
    // A2 dragged in the outline of A: under A1, or beside it.
    expect(outlinePlace(p, a, [a, a1], 1, 2, [a2])).toMatchObject({ parent: a1, index: 0 });
    expect(outlinePlace(p, a, [a, a1], 1, 1, [a2])).toMatchObject({ parent: a, index: 1 });
  });
});
