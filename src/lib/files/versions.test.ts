import { describe, expect, it } from 'vitest';
import type { FileView } from '$lib/api/files';
import { versionsOf } from './versions';

const file = (
  hash: string,
  added: string,
  madeFrom: string | null = null,
  exists = true,
): FileView => ({
  hash,
  path: `attachments/${hash}`,
  name: `${hash}.png`,
  kind: 'picture',
  size: 1,
  exists,
  folder: null,
  origin: null,
  added,
  width: 4,
  height: 3,
  alt: '',
  madeFrom,
  bookmarks: [],
  references: [],
});

describe('the versions of an image', () => {
  const all = [
    file('copy2', '2026-10-28T12:00:00Z', 'copy'),
    file('root', '2026-10-28T10:00:00Z'),
    file('other', '2026-10-28T09:00:00Z'),
    file('copy', '2026-10-28T11:00:00Z', 'root'),
    file('beside', '2026-10-28T11:30:00Z', 'root'),
  ];

  it('are the original and every copy of it, of a copy too, in the order they were made', () => {
    const names = (h: string) => versionsOf(h, all).map((f) => f.hash);
    expect(names('root')).toEqual(['root', 'copy', 'beside', 'copy2']);
    expect(names('copy2')).toEqual(['root', 'copy', 'beside', 'copy2']);
    expect(names('other')).toEqual(['other']);
    expect(names('none')).toEqual([]);
  });

  it('made within one second, put a copy before the copies made from it', () => {
    const same = [file('copy2', '5', 'copy'), file('root', '1'), file('copy', '5', 'root')];
    expect(versionsOf('root', same).map((f) => f.hash)).toEqual(['root', 'copy', 'copy2']);
  });

  it('begin where the library no longer has the source, and leave out what is not there', () => {
    const some = [file('copy', '1', 'gone'), file('copy2', '2', 'copy', false)];
    expect(versionsOf('copy', some).map((f) => f.hash)).toEqual(['copy']);
  });

  it('do not go round for ever where a file says it was made from its own copy', () => {
    const round = [file('a', '1', 'b'), file('b', '2', 'a')];
    expect(
      versionsOf('a', round)
        .map((f) => f.hash)
        .sort(),
    ).toEqual(['a', 'b']);
  });
});
