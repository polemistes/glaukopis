import { describe, expect, it } from 'vitest';
import { pastedPaths } from './paste';

/** What a paste carries, as far as `pastedPaths` reads it. */
function carrying(data: Record<string, string>): DataTransfer {
  return { getData: (type: string) => data[type] ?? '' } as unknown as DataTransfer;
}

describe('where the pictures of a paste are', () => {
  it('gives the path of a file copied in a file manager, by the order of the files', () => {
    const data = carrying({
      'application/x-glaukopis-picture-paths': JSON.stringify([null, '/home/someone/vase.png']),
    });
    expect(pastedPaths(data)).toEqual([null, '/home/someone/vase.png']);
  });

  it('gives nothing for a paste WebKit made, or one that cannot be read', () => {
    expect(pastedPaths(null)).toEqual([]);
    expect(pastedPaths(carrying({}))).toEqual([]);
    expect(pastedPaths(carrying({ 'application/x-glaukopis-picture-paths': '{not json' }))).toEqual(
      [],
    );
  });
});
