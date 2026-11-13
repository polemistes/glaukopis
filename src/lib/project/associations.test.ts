import { describe, expect, it, vi } from 'vitest';
import type { MenuItem } from '$lib/ui/menu.svelte';
import { associationMenu } from './associations';
import { KIND_COLOURS } from './kinds';
import { endsWritten } from './model/changing/links';
import { Project } from './model/project.svelte';
import { PROJECT } from './model/types';

function project() {
  const p = new Project(null);
  p.begin('Iliad');
  const a = p.addChild(PROJECT, { title: 'Achilles' })!;
  const b = p.addChild(PROJECT, { title: 'Hector' })!;
  const id = p.addLink(a, b)!;
  const link = () => p.links.find((l) => l.id === id)!;
  return { p, a, b, id, link };
}

/** The labels of a menu, a submenu's after its own, and `-` for a line between. */
function labels(items: MenuItem[]): string[] {
  return items.flatMap((i) =>
    i.kind === 'separator'
      ? ['-']
      : i.kind === 'submenu'
        ? [`${i.label} ▸`, ...labels(i.items).map((l) => `  ${l}`)]
        : i.kind === 'heading'
          ? [i.label]
          : [`${i.checked ? '✓ ' : ''}${i.label}`],
  );
}

type Item = Extract<MenuItem, { action: () => void }>;

function find(items: MenuItem[], label: string): Item | null {
  for (const i of items) {
    if (i.kind === 'submenu') {
      const found = find(i.items, label);
      if (found) return found;
    } else if ((!i.kind || i.kind === 'item') && i.label === label) return i as Item;
  }
  return null;
}

describe('the menu of an association', () => {
  it('is its words, its arrow, its colour and taking it away; in the text, the ends first', () => {
    const { p, link } = project();
    const write = vi.fn();
    expect(labels(associationMenu(p, link(), { write }))).toEqual([
      'Add a label…',
      'Arrow ▸',
      '  ✓ None',
      '  To “Hector”',
      '  To “Achilles”',
      '  Both ways',
      'Colour ▸',
      '  ✓ None',
      ...KIND_COLOURS.map((c) => `  ${c.name[0].toUpperCase()}${c.name.slice(1)}`),
      '-',
      'Remove the association',
    ]);
    const inText = labels(associationMenu(p, link(), { write, goTo: () => {} }));
    expect(inText.slice(0, 4)).toEqual(['Go to “Achilles”', 'Go to “Hector”', '-', 'Add a label…']);
  });

  it('gives the arrow and the colour, checks the one that holds, and each is undone alone', () => {
    const { p, id, link } = project();
    p.checkpoint();
    find(associationMenu(p, link(), { write: () => {} }), 'To “Achilles”')!.action();
    expect(link().arrow).toBe('from');
    find(associationMenu(p, link(), { write: () => {} }), 'Teal')!.action();
    expect(link().colour).toBe('teal');

    const now = labels(associationMenu(p, link(), { write: () => {} }));
    expect(now).toContain('  ✓ To “Achilles”');
    expect(now).toContain('  ✓ Teal');
    expect(now.filter((l) => l.includes('✓'))).toHaveLength(2);

    p.undo();
    expect(link().colour).toBeUndefined();
    expect(link().arrow).toBe('from');
    p.undo();
    expect(link().arrow).toBeUndefined();

    find(associationMenu(p, link(), { write: () => {} }), 'Both ways')!.action();
    expect(link().arrow).toBe('both');
    find(associationMenu(p, link(), { write: () => {} }), 'None')!.action();
    expect(link().arrow).toBeUndefined();
    find(associationMenu(p, link(), { write: () => {} }), 'Remove the association')!.action();
    expect(p.links.find((l) => l.id === id)).toBeUndefined();
  });

  it('opens the field of the words; with words, it says it changes them', () => {
    const { p, id, link } = project();
    const write = vi.fn();
    find(associationMenu(p, link(), { write }), 'Add a label…')!.action();
    expect(write).toHaveBeenCalledOnce();
    p.setLinkLabel(id, 'kills');
    expect(labels(associationMenu(p, link(), { write }))[0]).toBe('Change the label…');
  });

  it('writes its ends with the sign of its arrow', () => {
    expect(endsWritten('A', 'B', 'to')).toBe('A → B');
    expect(endsWritten('A', 'B', 'from')).toBe('A ← B');
    expect(endsWritten('A', 'B', 'both')).toBe('A ↔ B');
    expect(endsWritten('A', 'B', undefined)).toBe('A – B');
  });
});
