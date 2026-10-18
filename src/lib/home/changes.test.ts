import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ProjectInfo } from '$lib/api/projects';
import { closedHere, openedHere, openHere } from '$lib/project/elsewhere';
import { Project } from '$lib/project/model/project.svelte';
import { toasts } from '$lib/ui/toast.svelte';

const api = vi.hoisted(() => ({
  log: [] as string[],
  projects: {
    list: [] as ProjectInfo[],
    create: vi.fn(),
    duplicate: vi.fn(),
    remove: vi.fn(),
    closed: vi.fn(),
    closing: vi.fn(),
    folder: vi.fn(),
    folders: [],
  },
  router: { go: vi.fn(), route: { view: 'projects' } },
  openProject: vi.fn(),
}));

vi.mock('$lib/state/projects.svelte', () => ({
  projects: api.projects,
  openProject: api.openProject,
}));
vi.mock('$lib/state/router.svelte', () => ({ router: api.router }));

const { carryElements, makeProject } = await import('./changes');
const { homeUndo } = await import('./undo.svelte');

const info = (id: string, name: string) => ({ id, name }) as ProjectInfo;

beforeEach(() => {
  api.log = [];
  homeUndo.done = [];
  homeUndo.undone = [];
  for (const t of [...toasts.list]) toasts.dismiss(t.id);
  api.projects.create.mockImplementation(async (name: string) => info('x', name));
  api.projects.remove.mockImplementation(async (id: string) => void api.log.push(`trash ${id}`));
  api.projects.closed.mockImplementation(async (id: string) => void api.log.push(`closed ${id}`));
  api.router.go.mockReset();
  closedHere('x');
});

describe('the undo of a project made', () => {
  it('puts it in the trash where it is not open', async () => {
    await makeProject('Iliad', null);
    await homeUndo.undo();
    expect(api.log).toEqual(['closed x', 'trash x']);
    expect(api.router.go).not.toHaveBeenCalled();
  });

  it('leaves the project open in the window first, and trashes it once it is closed', async () => {
    await makeProject('Iliad', null);
    const p = new Project(null);
    openHere('x', p);
    // The view goes when the home is gone to, as the application does.
    api.router.go.mockImplementation(() => {
      api.log.push('home');
      setTimeout(() => closedHere('x', p), 0);
    });
    await homeUndo.undo();
    expect(api.log).toEqual(['home', 'closed x', 'trash x']);
    expect(openedHere('x')).toBeUndefined();
  });

  it('does nothing, and keeps the change, where the project stays open', async () => {
    vi.useFakeTimers();
    try {
      await makeProject('Iliad', null);
      openHere('x', new Project(null));
      const shown = vi.spyOn(toasts, 'show');
      const undone = homeUndo.undo();
      await vi.advanceTimersByTimeAsync(20_000);
      await undone;
      expect(api.log).toEqual([]);
      expect(homeUndo.done).toHaveLength(1);
      // Said, as a message that is no failure: it can be undone once the project is closed.
      expect(shown).toHaveBeenLastCalledWith(expect.objectContaining({ kind: 'info' }));
    } finally {
      vi.useRealTimers();
      closedHere('x');
    }
  });
});

describe('elements carried between two projects that are not open', () => {
  it('let the first go where the second cannot be opened', async () => {
    const first = new Project(null);
    first.begin('Iliad');
    const close = vi.spyOn(first, 'close');
    api.openProject.mockImplementation(async (id: string) => {
      if (id === 'a') return { project: first };
      throw new Error('unreadable');
    });
    const shown = vi.spyOn(toasts, 'show');
    await carryElements('a', ['e'], 'b', 'top', { parent: 'top', before: null }, 'carried');
    expect(close).toHaveBeenCalledTimes(1);
    expect(shown.mock.lastCall?.[0]).toMatchObject({ kind: 'error' });
    expect(homeUndo.done).toEqual([]);
  });
});
