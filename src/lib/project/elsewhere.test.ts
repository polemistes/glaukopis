import { afterEach, describe, expect, it } from 'vitest';
import {
  carryAcross,
  closedHere,
  idOf,
  openElsewhere,
  openedHere,
  openHere,
  writeElsewhere,
} from './elsewhere';
import { clipboard, cutElements, pasteElements } from './clipboard.svelte';
import { sendElements } from './elements';
import { Project } from './model/project.svelte';
import { PROJECT } from './model/types';

function begun(name: string) {
  const p = new Project(null);
  p.begin(name);
  p.undoManager.clear();
  return p;
}

const titles = (p: Project, ids: string[]) => ids.map((id) => p.node(id)?.title);

afterEach(() => {
  closedHere('iliad');
  closedHere('odyssey');
});

describe('the projects open in the view', () => {
  it('are known by id, and the one open is given, never a second from disk', async () => {
    const iliad = begun('Iliad');
    openHere('iliad', iliad);
    expect(openedHere('iliad')).toBe(iliad);
    expect(idOf(iliad)).toBe('iliad');
    const there = await openElsewhere('iliad');
    expect(there.project).toBe(iliad);
    expect(there.here).toBe(true);
    // Letting it go leaves it open.
    await there.close();
    iliad.addChild(PROJECT, { title: 'Still open' });
    expect(titles(iliad, iliad.tree().children.get(PROJECT) ?? [])).toEqual(['Still open']);
  });

  it('are let go by id, but not when another was opened since under it', () => {
    const one = begun('Iliad');
    const two = begun('Iliad');
    openHere('iliad', one);
    openHere('iliad', two);
    closedHere('iliad', one);
    expect(openedHere('iliad')).toBe(two);
    closedHere('iliad', two);
    expect(openedHere('iliad')).toBeUndefined();
    expect(idOf(two)).toBeNull();
  });

  it('are written in as one step their undo takes back, keeping what was done before', async () => {
    const iliad = begun('Iliad');
    const a = iliad.addChild(PROJECT, { title: 'Achilles' })!;
    iliad.checkpoint();
    openHere('iliad', iliad);
    await writeElsewhere('iliad', (p) => p.remove([a]));
    expect(iliad.node(a)).toBeUndefined();
    iliad.undo();
    expect(iliad.node(a)?.title).toBe('Achilles');
    // What was done before is still there to be undone.
    iliad.undo();
    expect(iliad.node(a)).toBeUndefined();
  });
});

describe('elements carried from one project to another', () => {
  function two() {
    const from = begun('Iliad');
    const book = from.addChild(PROJECT, { title: 'Book one' })!;
    const a = from.addChild(book, { title: 'Achilles' })!;
    from.addChild(a, { title: 'Peleus' });
    const h = from.addChild(book, { title: 'Hector' })!;
    from.undoManager.clear();
    const to = begun('Odyssey');
    const x = to.addChild(PROJECT, { title: 'Ithaca' })!;
    const y = to.addChild(PROJECT, { title: 'Troy' })!;
    to.undoManager.clear();
    return { from, to, book, a, h, x, y };
  }

  it('are copied there with all under them, and left here', () => {
    const { from, to, a, x } = two();
    const made = carryAcross(from, [a, PROJECT], to, { under: x }, false);
    expect(titles(to, made)).toEqual(['Achilles']);
    expect(to.tree().parent.get(made[0])).toBe(x);
    expect(titles(to, to.tree().children.get(made[0]) ?? [])).toEqual(['Peleus']);
    expect(from.node(a)?.title).toBe('Achilles');
    expect(from.canUndo).toBe(false);
    // One undo there takes the copy back.
    to.undo();
    expect(to.node(made[0])).toBeUndefined();
  });

  it('are moved: made there at the place asked for, and removed here, each one step', () => {
    const { from, to, book, a, h, x, y } = two();
    const made = carryAcross(from, [a, h], to, { under: PROJECT, index: 1 }, true);
    expect(titles(to, to.tree().children.get(PROJECT) ?? [])).toEqual([
      'Ithaca',
      'Achilles',
      'Hector',
      'Troy',
    ]);
    expect(made).toHaveLength(2);
    expect(from.tree().children.get(book) ?? []).toEqual([]);
    expect([x, y]).toHaveLength(2);
    // Undone in either, the move is undone in both, and so done again: nothing is lost between them.
    from.undo();
    expect(from.tree().children.get(book)).toEqual([a, h]);
    expect(to.tree().children.get(PROJECT)).toEqual([x, y]);
    to.redo();
    expect(from.tree().children.get(book) ?? []).toEqual([]);
    expect(titles(to, to.tree().children.get(PROJECT) ?? [])).toEqual([
      'Ithaca',
      'Achilles',
      'Hector',
      'Troy',
    ]);
    to.undo();
    expect(from.tree().children.get(book)).toEqual([a, h]);
    expect(to.tree().children.get(PROJECT)).toEqual([x, y]);
    // What was done before in either is not touched.
    expect(from.canUndo).toBe(false);
    expect(to.canUndo).toBe(false);
  });

  it('are moved by cut and paste between the panes, the two steps one, as for a drag', () => {
    const { from, to, book, a, h, x, y } = two();
    openHere('iliad', from);
    openHere('odyssey', to);
    expect(cutElements(from, [a, h])).toBe(2);
    expect(clipboard.held?.from).toBe('iliad');
    const made = pasteElements(to, { under: PROJECT });
    expect(titles(to, made)).toEqual(['Achilles', 'Hector']);
    expect(from.tree().children.get(book) ?? []).toEqual([]);
    // Undone where they were pasted, they are back where they were cut.
    to.undo();
    expect(to.tree().children.get(PROJECT)).toEqual([x, y]);
    expect(from.tree().children.get(book)).toEqual([a, h]);
    from.redo();
    expect(from.tree().children.get(book) ?? []).toEqual([]);
    expect(titles(to, to.tree().children.get(PROJECT) ?? [])).toEqual([
      'Ithaca',
      'Troy',
      'Achilles',
      'Hector',
    ]);
    from.undo();
    expect(from.tree().children.get(book)).toEqual([a, h]);
    expect(to.tree().children.get(PROJECT)).toEqual([x, y]);
  });

  it('are moved with Move to, to a project open beside, the two steps one, as for a drag', async () => {
    const { from, to, book, a, x, y } = two();
    openHere('odyssey', to);
    expect(await sendElements(from, [a], { project: 'odyssey' }, true)).toBe(1);
    expect(from.tree().children.get(book)).not.toContain(a);
    expect(titles(to, to.tree().children.get(PROJECT) ?? [])).toEqual([
      'Ithaca',
      'Troy',
      'Achilles',
    ]);
    to.undo();
    expect(to.tree().children.get(PROJECT)).toEqual([x, y]);
    expect(from.tree().children.get(book)).toContain(a);
    expect(from.node(a)?.title).toBe('Achilles');
    to.redo();
    expect(from.node(a)).toBeUndefined();
    from.undo();
    expect(from.node(a)?.title).toBe('Achilles');
    expect(to.tree().children.get(PROJECT)).toEqual([x, y]);
  });

  it('do not go where there is no element to take them', () => {
    const { from, to, a } = two();
    expect(carryAcross(from, [a], to, { under: 'gone' }, true)).toEqual([]);
    expect(from.node(a)).toBeTruthy();
  });
});
