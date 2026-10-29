import { describe, expect, it } from 'vitest';
import type { FileView } from '$lib/api/files';
import type { Summary } from '$lib/api/library';
import { forgetChanged, forgetStale } from './kept';

const file = (hash: string, ...references: string[]): FileView => ({
  hash,
  path: `files/${hash}.pdf`,
  name: `${hash}.pdf`,
  kind: 'pdf',
  size: 1,
  exists: true,
  folder: null,
  origin: null,
  added: '2026-10-18T00:00:00Z',
  width: null,
  height: null,
  alt: '',
  madeFrom: null,
  bookmarks: [],
  references: references.map((id) => ({ id }) as Summary),
});

describe('what the going-through keeps for the session', () => {
  it('keeps across a reload what still holds', () => {
    const found = new Map([
      ['a', 'found a'],
      ['b', 'found b'],
      ['c', 'found c'],
      ['d', 'found d'],
    ]);
    const decided = new Map([
      ['a', 'later'],
      ['b', 'later'],
      ['c', 'this'],
      ['d', 'new'],
    ]);
    const before = [file('a'), file('b', 'r1', 'r2'), file('c'), file('d')];
    // a unchanged, b's references in another order, c given to a reference, d gone, e new.
    const after = [file('a'), file('b', 'r2', 'r1'), file('c', 'r3'), file('e')];
    forgetStale(before, after, found, decided);
    // What was found out of c holds still, should the giving be undone; d is gone.
    expect([...found.keys()]).toEqual(['a', 'b', 'c']);
    expect([...decided.keys()]).toEqual(['a', 'b']);
  });

  it('keeps everything over a reload that changes nothing, as a going-through left for later', () => {
    const files = [file('a'), file('b')];
    const found = new Map([
      ['a', 1],
      ['b', 2],
    ]);
    const decided = new Map([['a', 1]]);
    forgetStale(files, files.slice(), found, decided);
    expect(found.size).toBe(2);
    expect(decided.size).toBe(1);
  });

  it('forgets what was decided of a file put anew with other references, and only then', () => {
    const decided = new Map([
      ['a', 1],
      ['b', 1],
    ]);
    forgetChanged(file('a'), file('a', 'r1'), decided);
    forgetChanged(file('b', 'r1'), { ...file('b', 'r1'), name: 'renamed.pdf' }, decided);
    forgetChanged(undefined, file('c'), decided);
    expect([...decided.keys()]).toEqual(['b']);
  });
});
