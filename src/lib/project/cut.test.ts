import { describe, expect, it } from 'vitest';
import { canPaste, clipboard, cutElements, isCut, pasteElements } from './clipboard.svelte';
import { Project } from './model/project.svelte';
import { PROJECT } from './model/types';

describe('elements cut', () => {
  it('stay where they are until pasted, are then moved as one step, and are pasted once', () => {
    const p = new Project(null);
    p.begin('Iliad');
    const one = p.addChild(PROJECT, { title: 'One' })!;
    const two = p.addChild(PROJECT, { title: 'Two' })!;
    const a = p.addChild(one, { title: 'Achilles' })!;
    const a1 = p.addChild(a, { title: 'Peleus' })!;
    p.undoManager.clear();

    expect(cutElements(p, [a])).toBe(1);
    expect(isCut(p, a)).toBe(true);
    expect(p.tree().parent.get(a)).toBe(one);
    expect(canPaste(p)).toBe(true);

    p.checkpoint();
    const moved = pasteElements(p, { under: two });
    p.checkpoint();
    expect(moved).toEqual([a]);
    expect(p.tree().parent.get(a)).toBe(two);
    expect(p.tree().parent.get(a1)).toBe(a);
    expect(p.tree().children.get(two)).toEqual([a]);
    expect(clipboard.held).toBeNull();
    expect(p.copyOf(a)).toBeFalsy();

    // One undo takes it back where it was.
    p.undo();
    expect(p.tree().children.get(one)).toEqual([a]);
  });

  it('are pasted where they are asked to go, and not under themselves', () => {
    const p = new Project(null);
    p.begin('Iliad');
    const one = p.addChild(PROJECT, { title: 'One' })!;
    const a = p.addChild(one, { title: 'Achilles' })!;
    const a1 = p.addChild(a, { title: 'Peleus' })!;
    cutElements(p, [a]);
    expect(pasteElements(p, { under: a1 })).toEqual([]);
    cutElements(p, [a]);
    expect(pasteElements(p, { under: PROJECT, pos: { x: 420, y: 180 } })).toEqual([a]);
    expect(p.tree().children.get(PROJECT)).toEqual([one, a]);
    expect(p.node(a)?.pos).toEqual({ x: 420, y: 180 });
    // The project itself is never cut.
    expect(cutElements(p, [PROJECT])).toBe(0);
    expect(clipboard.held).toBeNull();
  });
});
