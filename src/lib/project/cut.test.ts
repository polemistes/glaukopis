import { describe, expect, it } from 'vitest';
import { canPaste, clipboard, cutElements, isCut, pasteElements } from './clipboard.svelte';
import { Project } from './model/project.svelte';

describe('elements cut', () => {
  it('stay where they are until pasted, are then moved as one step, and are pasted once', () => {
    const p = new Project(null);
    const one = p.createMap('One');
    const two = p.createMap('Two');
    const r1 = p.map(one)!.root;
    const r2 = p.map(two)!.root;
    const a = p.addChild(r1, { title: 'Achilles' })!;
    const a1 = p.addChild(a, { title: 'Peleus' })!;
    p.undoManager.clear();

    expect(cutElements(p, one, [a])).toBe(1);
    expect(isCut(p, a)).toBe(true);
    expect(p.node(a)?.map).toBe(one);
    expect(canPaste(p)).toBe(true);

    p.checkpoint();
    const moved = pasteElements(p, two, r2);
    p.checkpoint();
    expect(moved).toEqual([a]);
    expect(p.node(a)?.map).toBe(two);
    expect(p.node(a1)?.map).toBe(two);
    expect(p.tree(two).children.get(r2)).toEqual([a]);
    expect(clipboard.held).toBeNull();
    expect(p.copyOf(a)).toBeFalsy();

    // One undo takes it back where it was.
    p.undo();
    expect(p.node(a)?.map).toBe(one);
    expect(p.tree(one).children.get(r1)).toEqual([a]);
  });

  it('are pasted loose where they are asked to go, and not under themselves', () => {
    const p = new Project(null);
    const one = p.createMap('One');
    const r1 = p.map(one)!.root;
    const a = p.addChild(r1, { title: 'Achilles' })!;
    const a1 = p.addChild(a, { title: 'Peleus' })!;
    cutElements(p, one, [a]);
    expect(pasteElements(p, one, a1)).toEqual([]);
    cutElements(p, one, [a]);
    expect(pasteElements(p, one, null, { x: 420, y: 180 })).toEqual([a]);
    expect(p.tree(one).loose).toEqual([a]);
    expect(p.node(a)?.pos).toEqual({ x: 420, y: 180 });
  });
});
