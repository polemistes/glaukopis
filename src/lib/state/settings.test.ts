import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Settings } from '$lib/api/system';

const writes: { settings: Settings; resolve: () => void; reject: (e: unknown) => void }[] = [];

vi.mock('$lib/api/system', async (original) => ({
  ...(await original<typeof import('$lib/api/system')>()),
  settingsLoad: vi.fn(async () => ({})),
  settingsSave: vi.fn(
    (settings: Settings) =>
      new Promise<void>((resolve, reject) => writes.push({ settings, resolve, reject })),
  ),
}));

const { settings } = await import('./settings.svelte');
const { finishBeforeClose } = await import('./closing');

/** Lets what waits on settled promises go on. */
const settle = () => new Promise((r) => setTimeout(r, 0));

describe('the settings as they are written', () => {
  beforeEach(() => {
    writes.length = 0;
  });

  it('are written one after another, in the order they were asked for', async () => {
    vi.useFakeTimers();
    settings.set('theme', 'dark');
    vi.advanceTimersByTime(300);
    vi.useRealTimers();
    await settle();
    expect(writes).toHaveLength(1);
    settings.set('theme', 'mellow');
    const now = settings.saveNow();
    await settle();
    // The second waits for the first, which is still being written.
    expect(writes).toHaveLength(1);
    writes[0].resolve();
    await settle();
    expect(writes).toHaveLength(2);
    expect(writes[1].settings.theme).toBe('mellow');
    writes[1].resolve();
    await now;
  });

  it('are written before the window closes, when changed a moment before', async () => {
    settings.set('theme', 'light');
    const closing = finishBeforeClose();
    await settle();
    expect(writes).toHaveLength(1);
    expect(writes[0].settings.theme).toBe('light');
    writes[0].resolve();
    expect(await closing).toEqual([]);
    // Nothing more to write: closing asks for nothing.
    const again = finishBeforeClose();
    await settle();
    expect(writes).toHaveLength(1);
    expect(await again).toEqual([]);
  });

  it('that could not be written keep the window open, and are tried again', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    settings.set('theme', 'dark');
    const closing = finishBeforeClose();
    await settle();
    writes[0].reject(new Error('read-only'));
    expect(await closing).toEqual([new Error('read-only')]);
    const again = finishBeforeClose();
    await settle();
    expect(writes).toHaveLength(2);
    writes[1].resolve();
    expect(await again).toEqual([]);
    error.mockRestore();
  });
});
