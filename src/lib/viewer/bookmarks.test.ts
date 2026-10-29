import { describe, expect, it } from 'vitest';
import { defaultName, MOST, renamed, withBookmark, without } from './bookmarks';

describe('the bookmarks of a file', () => {
  it('are kept in the order their places stand, a name made one line', () => {
    const a = withBookmark([], { page: 7, at: 0.5 }, '  The\n proof ')!;
    const b = withBookmark(a.list, { page: 2, at: 0.1 }, 'Start')!;
    const c = withBookmark(b.list, { page: 7, at: 0.2 }, 'Lemma')!;
    expect(c.list.map((m) => m.name)).toEqual(['Start', 'Lemma', 'The proof']);
    expect(c.list.find((m) => m.id === a.id)).toMatchObject({ page: 7, at: 0.5 });
  });

  it('are named after the page as it is numbered in print, by default', () => {
    const page = (label: string) => `Page ${label}`;
    expect(defaultName({ page: 2, at: 0 }, ['i', 'ii', '1'], page)).toBe('Page ii');
    expect(defaultName({ page: 9, at: 0 }, ['i'], page)).toBe('Page 9');
  });

  it('are renamed, a blank name keeping the old, and taken away', () => {
    const { list, id } = withBookmark([], { page: 1, at: 0 }, 'Old')!;
    expect(renamed(list, id, ' New  name ')[0].name).toBe('New name');
    expect(renamed(list, id, '   ')[0].name).toBe('Old');
    expect(without(list, id)).toEqual([]);
  });

  it('are no more than a file may keep', () => {
    let list = withBookmark([], { page: 1, at: 0 }, 'x')!.list;
    list = Array.from({ length: MOST }, () => list[0]);
    expect(withBookmark(list, { page: 2, at: 0 }, 'y')).toBeNull();
  });
});
