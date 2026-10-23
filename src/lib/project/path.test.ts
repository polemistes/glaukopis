import { describe, expect, it } from 'vitest';
import type { Folder, ProjectInfo } from '$lib/api/projects';
import { PROJECT } from './model/types';
import { crumbsOf, fitCrumbs, type PathSource } from './path';

const folder = (id: string, name: string, parent?: string): Folder => ({
  id,
  name,
  parent,
  order: id,
});

const info = (folder?: string): ProjectInfo => ({
  id: 'p1',
  name: 'Homer, as listed',
  folder,
  description: '',
  created: '2026-01-01T00:00:00Z',
  modified: '2026-01-01T00:00:00Z',
  maps: [],
  words: 0,
  references: 0,
});

/** A project with a chain of elements: the project, then a, b, c, each under the one before. */
const chain: PathSource = (() => {
  const parent = new Map<string, string>([
    ['a', PROJECT],
    ['b', 'a'],
    ['c', 'b'],
  ]);
  const titles: Record<string, string> = { [PROJECT]: 'Homer', a: 'Iliad', b: 'Book 1', c: '' };
  return {
    pathTo(id: string) {
      const out = [id];
      for (let at = parent.get(id); at; at = parent.get(at)) out.unshift(at);
      return out;
    },
    node: (id: string) => (id in titles ? { title: titles[id] } : undefined),
  };
})();

const folders = [folder('f1', 'Greek'), folder('f2', 'Epic', 'f1'), folder('f3', 'Latin')];

describe('crumbsOf', () => {
  it('goes from the outermost folder through the project down to the element in view', () => {
    expect(crumbsOf(folders, info('f2'), chain, 'c')).toEqual([
      { kind: 'folder', id: 'f1', name: 'Greek' },
      { kind: 'folder', id: 'f2', name: 'Epic' },
      { kind: 'project', id: 'p1', name: 'Homer' },
      { kind: 'element', id: 'a', name: 'Iliad' },
      { kind: 'element', id: 'b', name: 'Book 1' },
      { kind: 'element', id: 'c', name: '' },
    ]);
  });

  it('begins at the project for a project in no folder, or in one that is gone', () => {
    expect(crumbsOf(folders, info(), chain, 'a').map((c) => c.kind)).toEqual([
      'project',
      'element',
    ]);
    expect(crumbsOf(folders, info('gone'), chain, 'a')[0].kind).toBe('project');
  });

  it('ends at the project where the project itself is in view', () => {
    expect(crumbsOf(folders, info('f3'), chain, PROJECT)).toEqual([
      { kind: 'folder', id: 'f3', name: 'Latin' },
      { kind: 'project', id: 'p1', name: 'Homer' },
    ]);
  });

  it('names the project as the list does while its own element has no name yet', () => {
    const unnamed: PathSource = { pathTo: (id) => [id], node: () => undefined };
    expect(crumbsOf([], info(), unnamed, PROJECT)[0].name).toBe('Homer, as listed');
  });
});

describe('fitCrumbs', () => {
  it('shows every crumb where all fit', () => {
    expect(fitCrumbs([50, 60, 70], 180, 20)).toEqual({ shown: [0, 1, 2], hidden: [] });
  });

  it('hides from the middle, keeping the first and as many from the end as fit', () => {
    // 40 + 50 + the ellipsis 20 leaves 90 of 200: the two before the last fit, the others do not.
    expect(fitCrumbs([40, 30, 30, 45, 45, 50], 200, 20)).toEqual({
      shown: [0, 3, 4, 5],
      hidden: [1, 2],
    });
  });

  it('hides one stretch: a small crumb nearer the first is not shown past one that did not fit', () => {
    expect(fitCrumbs([40, 10, 100, 50], 130, 20)).toEqual({ shown: [0, 3], hidden: [1, 2] });
  });

  it('shows only the first and the last where nothing else fits', () => {
    expect(fitCrumbs([40, 60, 60, 50], 120, 20)).toEqual({ shown: [0, 3], hidden: [1, 2] });
  });

  it('shows the first and the last even where they alone are too wide: the last is cut', () => {
    expect(fitCrumbs([40, 60, 300], 100, 20)).toEqual({ shown: [0, 2], hidden: [1] });
    expect(fitCrumbs([40, 300], 100, 20)).toEqual({ shown: [0, 1], hidden: [] });
    expect(fitCrumbs([300], 100, 20)).toEqual({ shown: [0], hidden: [] });
  });

  it('keeps the project shown, with the crumbs hidden on either side of it behind one each', () => {
    // Two folders, the project, four elements: the first folder, the project and the last always.
    expect(fitCrumbs([30, 30, 60, 50, 50, 50, 70], 240, 20, [2])).toEqual({
      shown: [0, 2, 6],
      hidden: [1, 3, 4, 5],
    });
    expect(fitCrumbs([30, 30, 60, 50, 50, 50, 70], 290, 20, [2])).toEqual({
      shown: [0, 2, 5, 6],
      hidden: [1, 3, 4],
    });
    // With the project next to the first, one stretch only.
    expect(fitCrumbs([30, 60, 50, 50, 70], 200, 20, [1])).toEqual({
      shown: [0, 1, 4],
      hidden: [2, 3],
    });
  });

  it('has nothing to show for no crumbs', () => {
    expect(fitCrumbs([], 100, 20)).toEqual({ shown: [], hidden: [] });
  });
});
