import { describe, expect, it } from 'vitest';
import { Project } from './model/project.svelte';
import { listed, outlineFolds, outlineItems } from './outline';
import { Folding } from './text/folding.svelte';

describe('the outline', () => {
  it('lists every element as deep as it stands, and leaves out what is under a folded one', () => {
    const p = new Project(null);
    const map = p.createMap('Wrath');
    const root = p.map(map)!.root;
    const a = p.addChild(root, { title: 'A' })!;
    const a1 = p.addChild(a, { title: 'A1' })!;
    p.addChild(a1, { title: 'A1a' });
    const b = p.addChild(root, { title: 'B' })!;
    const items = outlineItems(p, map, new Folding());
    expect(items.map((i) => `${i.level}:${p.node(i.id)!.title}`)).toEqual([
      '0:Wrath',
      '1:A',
      '2:A1',
      '3:A1a',
      '1:B',
    ]);
    expect(items.find((i) => i.id === a)!.children).toBe(1);
    expect(items.find((i) => i.id === b)!.children).toBe(0);
    const folded = outlineFolds(map);
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
});
