import { describe, expect, it } from 'vitest';
import { associationMenu } from '$lib/project/associations';
import type { MenuItem } from '$lib/ui/menu.svelte';
import { Notebook } from '../model/notebook.svelte';
import { cardBox } from './geometry';
import { linkBeingDrawn, linksDrawn, notebookLinkHolder, noteCalled } from './links';

/** The item of a menu, or of a submenu in it, whose words begin so. */
function item(items: MenuItem[], begins: string): MenuItem & { action?: () => void } {
  for (const i of items) {
    if ('label' in i && i.label.startsWith(begins)) return i as MenuItem & { action?: () => void };
    if ('items' in i && Array.isArray(i.items)) {
      const found = (i.items as MenuItem[]).find((s) => 'label' in s && s.label.startsWith(begins));
      if (found) return found as MenuItem & { action?: () => void };
    }
  }
  throw new Error(`no item ${begins}`);
}

describe('the links of a surface', () => {
  it('are drawn between the boxes of the cards, and not where an end is no card here', () => {
    const boxes = new Map([
      ['a', cardBox('a', { x: 0, y: 0 }, 200, 100)],
      ['b', cardBox('b', { x: 600, y: 0 }, 200, 100)],
    ]);
    const drawn = linksDrawn(
      [
        { id: 'ab', from: 'a', to: 'b', label: 'so', arrow: 'to', colour: 'teal' },
        { id: 'ac', from: 'a', to: 'c', label: '' },
      ],
      boxes,
    );
    expect(drawn.map((d) => d.id)).toEqual(['ab']);
    expect(drawn[0].label).toBe('so');
    expect(drawn[0].heads).toHaveLength(1);
    expect(drawn[0].colour).toBeTruthy();
    expect(drawn[0].faint).toBe(false);
    // It leaves the first card at its right edge, and meets the second at its left.
    const [, x0] = /^M ([\d.-]+)/.exec(drawn[0].path)!;
    expect(Number(x0)).toBeGreaterThanOrEqual(200);
  });

  it('being drawn goes to the pointer, or to the card it is over', () => {
    const from = cardBox('a', { x: 0, y: 0 }, 200, 100);
    expect(linkBeingDrawn(from, { x: 500, y: 50 }, null)).toMatch(/^M 203 50 L 500 50$/);
    expect(
      linkBeingDrawn(from, { x: 500, y: 50 }, cardBox('b', { x: 400, y: 0 }, 200, 100)),
    ).toMatch(/^M .* Q /);
  });
});

describe('the notebook as what holds the links', () => {
  it('names an end by the name of its note, or how it begins', () => {
    const nb = new Notebook();
    const a = nb.addNote({ name: 'Owls' });
    const b = nb.addNote();
    nb.addText(b, 'The grey-eyed goddess');
    expect(noteCalled(nb, a)).toBe('Owls');
    expect(noteCalled(nb, b)).toMatch(/^The grey-eyed goddess/);
    expect(noteCalled(nb, 'gone')).toBe('');
    expect(notebookLinkHolder(nb)).toBe(notebookLinkHolder(nb));
  });

  it('answers the menu of an association, each change one step of undo', () => {
    const nb = new Notebook();
    const a = nb.addNote({ name: 'Owls' });
    const b = nb.addNote({ name: 'Athens' });
    nb.checkpoint();
    const id = nb.addLink(a, b)!;
    nb.checkpoint();
    const link = () => nb.links.find((l) => l.id === id)!;
    const menu = () => associationMenu(notebookLinkHolder(nb), link(), { write: () => {} });

    item(menu(), 'To “Athens').action!();
    expect(link().arrow).toBe('to');
    item(menu(), 'Teal').action!();
    expect(link().colour).toBe('teal');
    nb.undo();
    expect(link().colour).toBeUndefined();
    expect(link().arrow).toBe('to');
    nb.undo();
    expect(link().arrow).toBeUndefined();

    item(menu(), 'Remove').action!();
    expect(nb.links).toEqual([]);
    nb.undo();
    expect(nb.links.map((l) => l.id)).toEqual([id]);
  });
});
