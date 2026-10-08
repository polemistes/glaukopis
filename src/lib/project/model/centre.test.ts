import { describe, expect, it } from 'vitest';
import { Project } from './project.svelte';

describe('a loose element made the centre', () => {
  it('becomes the centre, and the centre that was goes under it with all under it', () => {
    const p = new Project(null);
    const map = p.createMap('Wrath');
    const old = p.map(map)!.root;
    const a = p.addChild(old, { title: 'Achilles' })!;
    const loose = p.addLoose(map, { x: 300, y: 200 }, 'The Iliad')!;
    const under = p.addChild(loose, { title: 'Homer' })!;
    p.checkpoint();
    expect(p.makeCentre(loose)).toBe(true);
    const tree = p.tree(map);
    expect(tree.root).toBe(loose);
    expect(tree.children.get(loose)).toEqual([under, old]);
    expect(tree.children.get(old)).toEqual([a]);
    expect(tree.loose).toEqual([]);
    expect(p.node(loose)?.pos ?? null).toBeNull();
    // An element under another, or the centre, cannot be made the centre.
    expect(p.makeCentre(a)).toBe(false);
    expect(p.makeCentre(loose)).toBe(false);
    p.undo();
    expect(p.tree(map).root).toBe(old);
    expect(p.tree(map).loose).toEqual([loose]);
  });
});
