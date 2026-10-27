import { describe, expect, it, vi } from 'vitest';
import type { FileView } from '$lib/api/files';
import type { Summary } from '$lib/api/library';

vi.mock('./store.svelte', async (actual) => {
  const store = await actual<typeof import('./store.svelte')>();
  return { ...store, referenceWords: vi.fn(store.referenceWords) };
});

const { referenceWords } = await import('./store.svelte');
const { forChoosing, sortFiles } = await import('./order');

const reference = (authors: string, year: string) =>
  ({ id: authors, key: authors, authors, year, title: '' }) as unknown as Summary;

const file = (
  name: string,
  references: Summary[] = [],
  more: Partial<FileView> = {},
): FileView => ({
  hash: name,
  path: name,
  name,
  kind: 'pdf',
  size: 1,
  exists: true,
  folder: null,
  origin: null,
  added: '2026-10-18',
  width: null,
  height: null,
  alt: '',
  madeFrom: null,
  references,
  ...more,
});

describe('the order of the files', () => {
  it('by reference, makes the words of each file’s reference once, and puts those with none last', () => {
    const many = Array.from({ length: 200 }, (_, i) =>
      file(`f${i}.pdf`, i % 10 ? [reference(`Author ${i % 37}`, '1979')] : []),
    );
    vi.mocked(referenceWords).mockClear();
    const sorted = sortFiles(many, 'reference', false);
    // Once for each file that has a reference, not twice for every comparison.
    expect(vi.mocked(referenceWords).mock.calls.length).toBe(180);
    expect(sorted.slice(-20).every((f) => !f.references.length)).toBe(true);
    expect(sorted[0].references[0].authors).toBe('Author 0');

    const down = sortFiles(many, 'reference', true);
    expect(down.slice(-20).every((f) => !f.references.length)).toBe(true);
    expect(down[0].references[0].authors).toBe('Author 36');
  });

  it('by name, by when added and by size, either way', () => {
    const list = [
      file('b.pdf', [], { size: 3, added: '2026-01-02' }),
      file('a10.pdf', [], { size: 1, added: '2026-01-03' }),
      file('a9.pdf', [], { size: 2, added: '2026-01-01' }),
    ];
    const names = (fs: FileView[]) => fs.map((f) => f.name);
    expect(names(sortFiles(list, 'name', false))).toEqual(['a9.pdf', 'a10.pdf', 'b.pdf']);
    expect(names(sortFiles(list, 'name', true))).toEqual(['b.pdf', 'a10.pdf', 'a9.pdf']);
    expect(names(sortFiles(list, 'added', false))).toEqual(['a9.pdf', 'b.pdf', 'a10.pdf']);
    expect(names(sortFiles(list, 'size', true))).toEqual(['b.pdf', 'a9.pdf', 'a10.pdf']);
    expect(names(list)).toEqual(['b.pdf', 'a10.pdf', 'a9.pdf']);
  });

  it('to choose from, has the files that belong to no reference first', () => {
    const list = [file('a.pdf', [reference('Nagy', '1979')]), file('c.pdf'), file('b.pdf')];
    expect(forChoosing(list).map((f) => f.name)).toEqual(['b.pdf', 'c.pdf', 'a.pdf']);
  });
});
