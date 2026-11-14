import { describe, expect, it, vi } from 'vitest';
import type { ImportOutcome } from '$lib/api/library';

// What the items call is the library's own, which asks for files and opens
// dialogs: here each only says what it was asked, and what it brought in.
const asked = vi.hoisted(() => ({
  calls: [] as string[],
  outcome: null as ImportOutcome | null,
}));
vi.mock('./references.svelte', () => {
  const make =
    (name: string) =>
    async (...args: unknown[]) => {
      asked.calls.push(`${name}(${args.map((a) => String(a)).join(', ')})`);
      return asked.outcome;
    };
  return {
    importFile: make('file'),
    importFromZotero: make('zotero'),
    importPasted: make('pasted'),
    importPdfFiles: make('pdfs'),
  };
});

const { addingItems } = await import('./adding');

const outcome: ImportOutcome = {
  added: ['lord1960'],
  updated: [],
  skipped: 0,
  files: 0,
  problems: [],
};

/** The items that can be pressed, by their words. */
function pressable(items: ReturnType<typeof addingItems>) {
  return items.flatMap((item) => (item.kind === undefined || item.kind === 'item' ? [item] : []));
}

describe('the ways of adding references, as the items of a menu', () => {
  it('are four, in the order of the Library page, with their words and icons', () => {
    const items = pressable(addingItems());
    expect(items.map((i) => i.label)).toEqual([
      'Import Bib(La)TeX…',
      'Import from Zotero…',
      'Paste references…',
      'Add PDF files…',
    ]);
    expect(items.every((i) => !!i.icon && !i.hint && !i.shortcut)).toBe(true);
    expect(new Set(items.map((i) => i.icon)).size).toBe(4);
  });

  it('each do their own import, into the collection where there is one', () => {
    asked.calls.length = 0;
    for (const item of pressable(addingItems('poets'))) item.action();
    expect(asked.calls).toEqual([
      'file(poets)',
      'zotero(poets)',
      'pasted(poets)',
      'pdfs(undefined, poets)',
    ]);
  });

  it('put nothing into a collection where there is none', () => {
    asked.calls.length = 0;
    for (const item of pressable(addingItems())) item.action();
    expect(asked.calls).toEqual([
      'file(undefined)',
      'zotero(undefined)',
      'pasted(undefined)',
      'pdfs(undefined, undefined)',
    ]);
  });

  it('say what came of each, when they are asked to', async () => {
    const told: (ImportOutcome | null)[] = [];
    asked.outcome = outcome;
    for (const item of pressable(addingItems(null, (o) => told.push(o)))) item.action();
    await new Promise((resolve) => setTimeout(resolve));
    expect(told).toEqual([outcome, outcome, outcome, outcome]);
    asked.outcome = null;
    told.length = 0;
    pressable(addingItems(null, (o) => told.push(o)))[0].action();
    await new Promise((resolve) => setTimeout(resolve));
    expect(told).toEqual([null]);
  });
});
