import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Settings, SettingsLoaded } from '$lib/api/system';

const writes: { settings: Settings; resolve: () => void; reject: (e: unknown) => void }[] = [];

vi.mock('$lib/api/system', async (original) => ({
  ...(await original<typeof import('$lib/api/system')>()),
  settingsLoad: vi.fn(async (): Promise<SettingsLoaded> => ({ settings: {}, setAside: null })),
  settingsSave: vi.fn(
    (settings: Settings) =>
      new Promise<void>((resolve, reject) => writes.push({ settings, resolve, reject })),
  ),
}));

const { authorOf, settings } = await import('./settings.svelte');
const { settingsLoad } = await import('$lib/api/system');
const { toasts } = await import('$lib/ui/toast.svelte');
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

describe('the settings as they are read', () => {
  beforeEach(() => {
    writes.length = 0;
    for (const toast of [...toasts.list]) toasts.dismiss(toast.id);
    vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener: () => {} }));
  });

  it('that were damaged and set aside are told, and the person read from them is kept', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(settingsLoad).mockResolvedValueOnce({
      settings: { person: 'kept-id' },
      setAside: {
        path: '/data/settings.json.broken-20261018T120000Z',
        reason: 'expected `,` or `}` at line 3 column 3',
        personKept: true,
      },
    });
    await settings.load();
    expect(settings.value.person).toBe('kept-id');
    expect(settings.value.theme).toBe('system');
    // Nothing is written at once: the person is the one that was.
    expect(writes).toHaveLength(0);
    const told = toasts.list.find((t) => t.kind === 'error');
    expect(told?.message).toContain('/data/settings.json.broken-20261018T120000Z');
    expect(told?.detail).toContain('line 3');
    error.mockRestore();
  });

  it('that were damaged with no person in them make a new one, and write it', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(settingsLoad).mockResolvedValueOnce({
      settings: {},
      setAside: {
        path: '/data/settings.json.broken-x',
        reason: 'not an object',
        personKept: false,
      },
    });
    const loading = settings.load();
    await settle();
    expect(writes).toHaveLength(1);
    expect(writes[0].settings.person).toBeTruthy();
    writes[0].resolve();
    await loading;
    expect(toasts.list.find((t) => t.kind === 'error')?.message).toMatch(/new person/);
    error.mockRestore();
  });

  it('name the lines of the preview unless that was turned off, and keep it as it was set', async () => {
    const kept = (more: object): Partial<Settings> => ({ person: 'kept-id', ...more });
    vi.mocked(settingsLoad).mockResolvedValueOnce({ settings: kept({}), setAside: null });
    await settings.load();
    expect(settings.value.pageChips).toBe(true);
    vi.mocked(settingsLoad).mockResolvedValueOnce({
      settings: kept({ pageChips: false }),
      setAside: null,
    });
    await settings.load();
    expect(settings.value.pageChips).toBe(false);
    vi.mocked(settingsLoad).mockResolvedValueOnce({
      settings: kept({ pageChips: 'no' }),
      setAside: null,
    });
    await settings.load();
    expect(settings.value.pageChips).toBe(true);
    expect(writes).toHaveLength(0);
  });

  it('whose first writing fails are said to be unsaved, not unread', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(settingsLoad).mockResolvedValueOnce({ settings: {}, setAside: null });
    const loading = settings.load();
    await settle();
    writes[0].reject(new Error('read-only'));
    await loading;
    expect(toasts.list.find((t) => t.kind === 'error')?.message).toBe(
      'The settings could not be saved',
    );
    expect(settings.loaded).toBe(true);
    error.mockRestore();
  });
});

describe('the writer as an author', () => {
  it('is their name, organisation, email and ORCID, and nobody without a name', async () => {
    const { defaultSettings } = await import('$lib/api/system');
    expect(
      authorOf({
        ...defaultSettings,
        firstName: ' Anna ',
        lastName: 'Lind',
        organization: 'University of Oslo',
        position: 'Professor',
        address: 'Blindern',
        phone: '+47 22 85 50 50',
        contactEmail: 'anna@example.org',
        orcid: '0000-0002-1825-0097',
      }),
    ).toEqual({
      name: 'Anna Lind',
      affiliation: 'University of Oslo',
      email: 'anna@example.org',
      orcid: '0000-0002-1825-0097',
    });
    expect(authorOf({ ...defaultSettings, lastName: 'Lind' })).toEqual({ name: 'Lind' });
    expect(authorOf({ ...defaultSettings, organization: 'Oslo', firstName: ' ' })).toBeNull();
  });
});
