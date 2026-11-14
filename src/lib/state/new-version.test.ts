import { beforeEach, describe, expect, it, vi } from 'vitest';
import { t } from '$lib/i18n';
import { toasts } from '$lib/ui/toast.svelte';

const api = vi.hoisted(() => ({
  newer: vi.fn(),
  open: vi.fn(async () => {}),
  kept: { newVersions: true, versionTold: '' } as Record<string, unknown>,
}));

vi.mock('$lib/api/system', () => ({ newerVersion: api.newer, systemInfo: vi.fn() }));
vi.mock('$lib/api/documents', () => ({ openPath: api.open }));
vi.mock('./settings.svelte', () => ({
  settings: {
    value: api.kept,
    set: (key: string, value: unknown) => (api.kept[key] = value),
  },
}));

const { DOWNLOAD_PAGE, askForNewVersion, newVersion, toldOn } =
  await import('./new-version.svelte');

describe('a newer version', () => {
  beforeEach(() => {
    for (const toast of [...toasts.list]) toasts.dismiss(toast.id);
    api.kept.versionTold = '';
    api.newer.mockReset();
    api.open.mockClear();
    newVersion.version = null;
  });

  it('is told of once, with a button to the page of the installers', async () => {
    api.newer.mockResolvedValue('0.2.12');
    await askForNewVersion();
    expect(newVersion.version).toBe('0.2.12');
    expect(toasts.list).toHaveLength(1);
    const [toast] = toasts.list;
    expect(toast.message).toBe(t('settings-new-version-out', { version: '0.2.12' }));
    expect(api.kept.versionTold).toBe('0.2.12');
    toast.action!.run();
    expect(api.open).toHaveBeenCalledWith(DOWNLOAD_PAGE);

    toasts.dismiss(toast.id);
    await askForNewVersion();
    expect(toasts.list).toHaveLength(0);
    expect(newVersion.version).toBe('0.2.12');
  });

  it('is told of again when it is another', async () => {
    api.kept.versionTold = '0.2.12';
    api.newer.mockResolvedValue('0.2.13');
    await askForNewVersion();
    expect(toasts.list).toHaveLength(1);
    expect(api.kept.versionTold).toBe('0.2.13');
  });

  it('is nothing where none is newer, or the site cannot be asked', async () => {
    api.newer.mockResolvedValue(null);
    await askForNewVersion();
    expect(toasts.list).toHaveLength(0);
    expect(newVersion.version).toBeNull();

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    api.newer.mockRejectedValue(new Error('offline'));
    await askForNewVersion();
    expect(toasts.list).toHaveLength(0);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('is asked for on Windows and macOS only', () => {
    expect(toldOn('windows')).toBe(true);
    expect(toldOn('macos')).toBe(true);
    expect(toldOn('linux')).toBe(false);
    expect(toldOn(undefined)).toBe(false);
  });
});
