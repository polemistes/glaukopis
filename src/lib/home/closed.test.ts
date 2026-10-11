import { describe, expect, it, vi } from 'vitest';
import * as Y from 'yjs';

const { load } = vi.hoisted(() => ({ load: vi.fn() }));
vi.mock('$lib/api/projects', () => ({ projectLoad: load }));
vi.mock('$lib/state/projects.svelte', () => ({
  projects: { closed: () => Promise.resolve() },
}));

import { oldDocument, p, project, t } from '$lib/found/testing';
import type { ProjectInfo } from '$lib/api/projects';
import { PROJECT } from '$lib/project/model/types';
import { closedTrees, readTree } from './closed.svelte';

const info = (modified: string): ProjectInfo => ({
  id: 'p1',
  name: 'Wrath',
  description: '',
  created: '',
  modified,
  maps: [],
  words: 0,
  references: 0,
});

describe('the tree of a project that is not open', () => {
  it('is read with the names of its elements', () => {
    const { pr, elements } = project([p(t('One.'))], [p(t('Two.'))]);
    pr.addChild(elements[0], { title: 'Under' });
    const read = readTree('Wrath', Y.encodeStateAsUpdate(pr.doc), []);
    expect(read.tree.children.get(PROJECT)).toEqual(elements);
    expect(elements.map((id) => read.names.get(id))).toEqual(['Part 1', 'Part 2']);
    const under = read.tree.children.get(elements[0]) ?? [];
    expect(under.map((id) => read.names.get(id))).toEqual(['Under']);
  });

  it('is read of a project written as maps in the shape it opens in, nothing written back', () => {
    const before = Y.encodeStateAsUpdate(oldDocument());
    const read = readTree('Wrath', before, []);
    expect(read.tree.sequence).toEqual([PROJECT, 'centre', 'part', 'loose']);
    expect(read.names.get('centre')).toBe('The poem');
    // What was given is as it was.
    const again = new Y.Doc();
    Y.applyUpdate(again, before);
    expect(again.getMap('maps').size).toBe(1);
  });

  it('is read once, and again only when the project has changed', async () => {
    const { pr } = project([p(t('One.'))]);
    const bytes = Y.encodeStateAsUpdate(pr.doc);
    load.mockResolvedValue({ info: info('1'), state: bytes, updates: [] });
    closedTrees.want(info('1'));
    expect(closedTrees.get('p1')?.state).toBe('reading');
    await vi.waitFor(() => expect(closedTrees.get('p1')?.state).toBe('read'));
    closedTrees.want(info('1'));
    expect(load).toHaveBeenCalledTimes(1);
    closedTrees.want(info('2'));
    // What was read stays in view while the new is read.
    expect(closedTrees.get('p1')?.state).toBe('read');
    await vi.waitFor(() => expect(closedTrees.get('p1')?.modified).toBe('2'));
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('says so when it cannot be read', async () => {
    load.mockRejectedValueOnce(new Error('gone'));
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    closedTrees.want({ ...info('1'), id: 'p2' });
    await vi.waitFor(() => expect(closedTrees.get('p2')?.state).toBe('failed'));
    error.mockRestore();
  });
});
