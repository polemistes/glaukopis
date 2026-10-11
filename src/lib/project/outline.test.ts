import { describe, expect, it } from 'vitest';
import { Project } from './model/project.svelte';
import { PROJECT } from './model/types';
import { listed, outlineFolds, outlineItems } from './outline';
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
