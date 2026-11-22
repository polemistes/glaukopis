import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const kept = vi.hoisted(() => ({
  apart: new Map<string, { time: number; moment: string; kept: string | null }>(),
  room: new Map<string, number>(),
  seen: [] as string[],
}));

vi.mock('$lib/api/sync', () => ({
  onProjectApart: async () => () => {},
  projectApart: async (id: string) => kept.apart.get(id) ?? null,
  projectApartSeen: async (id: string) => {
    kept.seen.push(id);
    kept.apart.delete(id);
  },
}));
vi.mock('$lib/api/history', () => ({
  historyRoom: async (id: string) => kept.room.get(id) ?? 0,
}));
// The view of the projects is the window's; what is asked of it here is that no side shows the project.
vi.mock('$lib/project/ProjectView.svelte', () => ({ viewing: { sides: [], enter: null } }));
vi.mock('$lib/history/history.svelte', () => ({ historyOf: () => null }));

const { writtenApart } = await import('./apart.svelte');
const { toasts } = await import('$lib/ui/toast.svelte');
const { projects } = await import('$lib/state/projects.svelte');
const { t } = await import('$lib/i18n');

const told = () => toasts.list.map((t) => ({ message: t.message, action: t.action?.label }));

beforeEach(() => {
  projects.list = [{ id: 'p1', name: 'Wrath' } as never, { id: 'p2', name: 'Shield' } as never];
  projects.loaded = true;
});

afterEach(() => {
  for (const t of [...toasts.list]) toasts.dismiss(t.id);
  kept.apart.clear();
  kept.room.clear();
  kept.seen = [];
  writtenApart.earlier = null;
});

describe('a project written in on two computers apart', () => {
  it('is told of with Show the changes where its history is kept', async () => {
    kept.apart.set('p1', { time: 1, moment: '', kept: 'h1' });
    kept.room.set('p1', 100);
    await writtenApart.tell('p1', 'Wrath');
    expect(told()).toEqual([
      { message: t('sync-apart', { name: 'Wrath' }), action: t('sync-apart-show') },
    ]);
  });

  it('offers the earlier versions instead where its history is not kept, and they are shown and the note seen', async () => {
    kept.apart.set('p2', { time: 1, moment: '', kept: 'h1' });
    await writtenApart.tell('p2');
    // The name is the list's, where the event did not say it.
    expect(told()).toEqual([
      { message: t('sync-apart', { name: 'Shield' }), action: t('sync-apart-earlier') },
    ]);
    expect(toasts.list[0].detail).toBe(t('sync-apart-no-history'));
    toasts.list[0].action?.run();
    await vi.waitFor(() => expect(kept.seen).toEqual(['p2']));
    expect(writtenApart.earlier?.id).toBe('p2');
  });

  it('is told of once while its toast stands, however often it is heard of', async () => {
    kept.apart.set('p1', { time: 1, moment: '', kept: null });
    kept.room.set('p1', 100);
    await Promise.all([writtenApart.tell('p1'), writtenApart.tell('p1')]);
    await writtenApart.tell('p1');
    expect(told()).toHaveLength(1);
  });

  it('is told of as it is opened where it has a note, and once only', async () => {
    kept.apart.set('p1', { time: 1, moment: '', kept: null });
    kept.room.set('p1', 100);
    writtenApart.opened('p1');
    await vi.waitFor(() => expect(told()).toHaveLength(1));
    for (const t of [...toasts.list]) toasts.dismiss(t.id);
    writtenApart.opened('p1');
    await new Promise((r) => setTimeout(r, 20));
    expect(told()).toHaveLength(0);
  });

  it('is not told of where nothing is kept of it, as when it was seen on another window', async () => {
    writtenApart.opened('p2');
    await writtenApart.tell('p2');
    expect(told()).toHaveLength(0);
  });
});
