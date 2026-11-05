import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ProjectInfo } from '$lib/api/projects';
import { closedHere, closesHere, openedHere, openHere } from '$lib/project/elsewhere';
import { Project } from '$lib/project/model/project.svelte';
import { toasts } from '$lib/ui/toast.svelte';

const api = vi.hoisted(() => ({
  log: [] as string[],
  projects: {
    list: [] as ProjectInfo[],
    create: vi.fn(),
    duplicate: vi.fn(),
    remove: vi.fn(),
    rename: vi.fn(),
    closed: vi.fn(),
    closing: vi.fn(),
    folder: vi.fn(),
    folders: [],
  },
  router: { go: vi.fn(), route: { view: 'owl' } },
  openProject: vi.fn(),
  confirm: vi.fn(),
}));

vi.mock('$lib/state/projects.svelte', () => ({
  projects: api.projects,
  openProject: api.openProject,
}));
vi.mock('$lib/state/router.svelte', () => ({ router: api.router }));
vi.mock('$lib/ui/confirm.svelte', () => ({ confirm: api.confirm }));

const { carryElements, deleteThings, makeProject, renameProject } = await import('./changes');
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
  api.projects.rename.mockImplementation(
    async (id: string, name: string) => void api.log.push(`rename ${id} ${name}`),
  );
  api.router.go.mockReset();
  closedHere('x');
  closesHere(null);
});

describe('the undo of a project made', () => {
  it('puts it in the trash where it is not open', async () => {
    await makeProject('Iliad', null);
    await homeUndo.undo();
    expect(api.log).toEqual(['closed x', 'trash x']);
    expect(api.router.go).not.toHaveBeenCalled();
  });

  it('closes the sides that show the project first, and trashes it once it is closed', async () => {
    await makeProject('Iliad', null);
    const p = new Project(null);
    openHere('x', p);
    // The window closes the sides, which let the project go, as the application does.
    closesHere((id) => {
      api.log.push(`close ${id}`);
      setTimeout(() => closedHere(id, p), 0);
    });
    await homeUndo.undo();
    expect(api.log).toEqual(['close x', 'closed x', 'trash x']);
    expect(api.router.go).not.toHaveBeenCalled();
    expect(openedHere('x')).toBeUndefined();
  });

  it('leaves the view for the home where the window has no sides to close', async () => {
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

describe('a project deleted from the list', () => {
  it('is closed first where it is open, and goes to the trash once it is on disk (ADR 0080)', async () => {
    api.projects.list = [info('x', 'Iliad')];
    api.confirm.mockResolvedValue(true);
    const p = new Project(null);
    openHere('x', p);
    closesHere((id) => {
      api.log.push(`close ${id}`);
      setTimeout(() => closedHere(id, p), 0);
    });
    expect(await deleteThings({ projects: ['x'], folders: [] })).toBe(true);
    expect(api.log).toEqual(['close x', 'closed x', 'trash x']);
    expect(homeUndo.done).toHaveLength(1);
  });
});

describe('the name of a project', () => {
  it('is written in its own element, in the project open in the view, after the copy the list shows', async () => {
    const p = new Project(null);
    p.begin('Iliad');
    p.undoManager.clear();
    openHere('x', p);
    await renameProject(info('x', 'Iliad'), 'The Iliad');
    expect(api.log).toEqual(['rename x The Iliad']);
    expect(p.name).toBe('The Iliad');
    // Undone from the message, the element is named as it was.
    await homeUndo.undo();
    expect(p.name).toBe('Iliad');
    expect(api.log).toEqual(['rename x The Iliad', 'rename x Iliad']);
  });

  it('opens a project that is not open to name its element, and lets it go', async () => {
    const q = new Project(null);
    q.begin('Odyssey');
    const close = vi.spyOn(q, 'close');
    api.openProject.mockResolvedValue({ project: q });
    await renameProject(info('y', 'Odyssey'), 'Odysseia');
    // Opened once what was written in it before is on disk, as a project opened to be written in is.
    expect(api.log).toEqual(['rename y Odysseia', 'closed y']);
    expect(api.openProject).toHaveBeenCalledWith('y');
    expect(q.name).toBe('Odysseia');
    expect(close).toHaveBeenCalledTimes(1);
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
