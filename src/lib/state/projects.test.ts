import { describe, expect, it, vi } from 'vitest';
import * as Y from 'yjs';
import type { LoadedProject, ProjectInfo } from '$lib/api/projects';
import { Project } from '$lib/project/model/project.svelte';
import { PROJECT } from '$lib/project/model/types';

/** What each project is on disk, by its id: a project begun under its name. */
function onDisk(id: string): LoadedProject {
  const p = new Project(null);
  p.begin(id);
  return {
    info: { id, name: id } as ProjectInfo,
    state: null,
    updates: [new Uint8Array(Y.encodeStateAsUpdate(p.doc))],
  };
}

vi.mock('$lib/api/projects', async (original) => ({
  ...(await original<typeof import('$lib/api/projects')>()),
  projectLoad: vi.fn(async (id: string) => onDisk(id)),
  projectAppend: vi.fn(async () => {}),
  onProjectUpdate: vi.fn(async () => () => {}),
}));

const { fromAnotherWindow, openProject } = await import('./projects.svelte');

describe('a project open in two windows', () => {
  it('takes what the other window wrote, where it is open here, and leaves the rest', async () => {
    const { project: here } = await openProject('one');
    const { project: other } = await openProject('two');
    // The other window: a copy of the same project, a change made in it.
    const there = new Project(null);
    there.load(Y.encodeStateAsUpdate(here.doc), []);
    const written: Uint8Array[] = [];
    there.doc.on('update', (u: Uint8Array) => written.push(u));
    const a = there.addChild(PROJECT, { title: 'From the other window' })!;
    for (const u of written) fromAnotherWindow('one', u);
    expect(here.node(a)?.title).toBe('From the other window');
    expect(other.node(a)).toBeUndefined();
    // A project closed here takes nothing more.
    await here.close();
    expect(() => fromAnotherWindow('one', written[0])).not.toThrow();
  });
});
