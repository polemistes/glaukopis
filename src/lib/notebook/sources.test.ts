import { beforeEach, describe, expect, it, vi } from 'vitest';
import { languages } from '$lib/i18n';

vi.mock('$lib/editor/references.svelte', () => ({
  itemLabel: vi.fn(
    (item: { id: string; locator?: string }) =>
      `Nagy 1979${item.locator ? `, ${item.locator}` : ''}`,
  ),
  locatorWord: vi.fn((kind: string) => (kind === 'page' ? 'p.' : '')),
}));

const { draftOf, originOf, sourceDetail, sourceLabel } = await import('./sources');

beforeEach(() => {
  languages.current = 'en';
});

describe('a source said', () => {
  it('in a line', () => {
    expect(
      sourceLabel({ id: 's', sort: 'web', url: 'https://www.a.org/x', title: 'X', read: '' }),
    ).toBe('X');
    expect(
      sourceLabel({ id: 's', sort: 'web', url: 'https://www.a.org/x', title: ' ', read: '' }),
    ).toBe('a.org');
    expect(sourceLabel({ id: 's', sort: 'reference', reference: 'R', locator: '45' })).toBe(
      'Nagy 1979, 45',
    );
    expect(sourceLabel({ id: 's', sort: 'file', name: 'owl.jpg' })).toBe('owl.jpg');
    expect(sourceLabel({ id: 's', sort: 'words', words: 'NRK,  3 May' })).toBe('NRK, 3 May');
    const long = sourceLabel({ id: 's', sort: 'words', words: 'word '.repeat(40) });
    expect(long.length).toBeLessThanOrEqual(80);
    expect(long.endsWith('…')).toBe(true);
    expect(sourceLabel(null)).toBe('No source');
  });

  it('in the line under it', () => {
    expect(
      sourceDetail({
        id: 's',
        sort: 'web',
        url: 'https://a.org/x',
        title: 'X',
        read: '2026-11-15T10:00:00Z',
      }),
    ).toBe('https://a.org/x · November 15, 2026');
    expect(
      sourceDetail({
        id: 's',
        sort: 'file',
        name: 'owl.jpg',
        time: '2026-01-01T10:00:00Z',
        taken: '2025-06-02T14:03:22',
        place: { lat: 59.91391, lon: -10.75 },
      }),
    ).toBe('June 2, 2025 · 59.9139° N, 10.75° W');
    expect(sourceDetail({ id: 's', sort: 'words', words: 'x' })).toBe('');
    // The page of a file read in Glaukopis, as a citation says it.
    expect(sourceDetail({ id: 's', sort: 'file', name: 'letter.pdf', locator: '12' })).toBe(
      'p. 12',
    );
    languages.current = 'nb';
    expect(
      sourceDetail({
        id: 's',
        sort: 'file',
        name: 'owl.jpg',
        place: { lat: -33.5, lon: 151.25 },
      }),
    ).toBe('33,5° S, 151,25° Ø');
  });
});

describe('the reference a source is made', () => {
  it('a page, words and a file; a reference is one', () => {
    expect(
      draftOf({
        id: 's',
        sort: 'web',
        url: 'https://a.org/x',
        title: 'X',
        read: '2026-11-15T10:00:00Z',
      }),
    ).toEqual({
      key: '',
      type: 'online',
      fields: { title: 'X', url: 'https://a.org/x', urldate: '2026-11-15' },
      names: {},
    });
    expect(draftOf({ id: 's', sort: 'words', words: ' A broadcast ' })).toEqual({
      key: '',
      type: 'misc',
      fields: { title: 'A broadcast' },
      names: {},
    });
    expect(
      draftOf({ id: 's', sort: 'file', name: 'owl.jpg', time: '2026-01-01T10:00:00Z' }),
    ).toMatchObject({ type: 'misc', fields: { title: 'owl.jpg', date: '2026-01-01' } });
    expect(
      draftOf({ id: 's', sort: 'file', name: 'owl.jpg', taken: '2025-06-02T14:03:22' })!.fields
        .date,
    ).toBe('2025-06-02');
    expect(draftOf({ id: 's', sort: 'reference', reference: 'R' })).toBeNull();
  });
});

describe('where a file came from, for the library', () => {
  it('is said of a page, a reference and words, and not of a file', () => {
    expect(originOf({ id: 's', sort: 'web', url: 'https://a.org', title: '', read: '' })).toBe(
      'https://a.org',
    );
    expect(originOf({ id: 's', sort: 'reference', reference: 'R' })).toBe('Nagy 1979');
    expect(originOf({ id: 's', sort: 'words', words: 'NRK' })).toBe('NRK');
    expect(originOf({ id: 's', sort: 'file', name: 'a.jpg' })).toBeNull();
    expect(originOf(null)).toBeNull();
  });
});
