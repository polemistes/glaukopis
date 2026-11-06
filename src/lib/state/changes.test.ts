import { describe, expect, it, vi } from 'vitest';

const projectsLoad = vi.fn(async () => {});
vi.mock('./projects.svelte', () => ({ projects: { load: projectsLoad, trashed: 0 } }));
vi.mock('./library.svelte', () => ({ library: { loaded: false, reload: vi.fn() } }));
vi.mock('$lib/files/store.svelte', () => ({ files: { loaded: false, reload: vi.fn() } }));
vi.mock('./settings.svelte', () => ({ settings: { reload: vi.fn(async () => {}) } }));
vi.mock('$lib/words/own', () => ({ readOwnWords: vi.fn(async () => []) }));

const { changes, SETTLE_MS } = await import('./changes.svelte');

describe('what another window changed', () => {
  it('is read again once, a moment after a run of writes to it', async () => {
    vi.useFakeTimers();
    for (let i = 0; i < 5; i++) changes.heard('projects');
    expect(projectsLoad).not.toHaveBeenCalled();
    vi.advanceTimersByTime(SETTLE_MS);
    expect(projectsLoad).toHaveBeenCalledTimes(1);
    expect(changes.counts.projects).toBe(1);
    // Another area is waited out on its own.
    changes.heard('languages');
    vi.advanceTimersByTime(SETTLE_MS);
    expect(changes.counts.languages).toBe(1);
    expect(projectsLoad).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
});
