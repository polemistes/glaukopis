import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { LanguagesInfo } from '$lib/api/system';

const system = vi.hoisted(() => ({ languagesInfo: vi.fn() }));
vi.mock('$lib/api/system', async (original) => ({
  ...(await original<typeof import('$lib/api/system')>()),
  languagesInfo: system.languagesInfo,
}));

const words = vi.hoisted(() => ({ load: vi.fn() }));
vi.mock('$lib/i18n', async (original) => ({
  ...(await original<typeof import('$lib/i18n')>()),
  load: words.load,
}));

const store = vi.hoisted(() => ({ files: { loaded: false } }));
vi.mock('$lib/files/store.svelte', () => store);

const { begin, interfaceTag } = await import('./starting');
const { languages } = await import('$lib/i18n');
const { settings } = await import('$lib/state/settings.svelte');
const { theNotebook } = await import('$lib/notebook/open.svelte');
const { places } = await import('./places.svelte');

const info: LanguagesInfo = {
  system: 'nb-NO',
  interface: [
    { tag: 'en', name: 'English' },
    { tag: 'nb', name: 'Norsk bokmål' },
    { tag: 'de', name: 'Deutsch' },
  ],
  interfaceDefault: 'nb',
  texts: ['en', 'nb'],
  textDefault: 'nb-NO',
} as LanguagesInfo;

/** The settings as the file holds them. */
function kept(change: Partial<typeof settings.value>) {
  vi.spyOn(settings, 'load').mockImplementation(async () => {
    Object.assign(settings.value, change);
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  system.languagesInfo.mockResolvedValue(info);
  words.load.mockResolvedValue(undefined);
  languages.current = 'en';
  store.files.loaded = false;
});

describe('the phone’s page as it begins', () => {
  it('speaks the language chosen in the settings', async () => {
    kept({ language: 'de', spelling: true });
    await begin();
    expect(interfaceTag()).toBe('de');
    expect(words.load).toHaveBeenCalledWith('de');
    expect(languages.current).toBe('de');
  });

  it('speaks the system’s language, as the web view says it, where none is chosen', async () => {
    kept({ language: 'system' });
    await begin();
    expect(system.languagesInfo).toHaveBeenCalledWith(navigator.language);
    expect(interfaceTag()).toBe('nb');
    expect(words.load).toHaveBeenCalledWith('nb');
    expect(languages.current).toBe('nb');
  });

  it('speaks the system’s language where the one chosen is not among those there are', async () => {
    kept({ language: 'xx' });
    await begin();
    expect(languages.current).toBe('nb');
  });

  it('stays in English where the words do not come, and says so in the log', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    kept({ language: 'de' });
    words.load.mockRejectedValueOnce(new Error('not there'));
    await begin();
    expect(languages.current).toBe('en');
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('has the measures of a finger, spelling off, and the notebook as a phone opens it', async () => {
    kept({ language: 'en', spelling: true });
    const writes = vi.spyOn(settings, 'set');
    await begin();
    expect(document.documentElement.dataset.phone).toBe('');
    expect(settings.value.spelling).toBe(false);
    expect(writes).not.toHaveBeenCalled();
    expect(store.files.loaded).toBe(true);
    expect(theNotebook.readable).toBe(false);
    expect(theNotebook.sweeps).toBe(false);
    expect(places.current).toEqual({ at: 'notes' });
  });
});
