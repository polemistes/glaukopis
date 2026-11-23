import { afterEach, describe, expect, it, vi } from 'vitest';
import type { SystemInfo } from '$lib/api/system';

// The place is mounted and pressed, so with the browser's Svelte: the tests
// otherwise run with the server's, in which nothing is followed.
vi.mock(
  'svelte',
  // @ts-expect-error: the browser's Svelte, as a file, has no types of its own.
  () => import('../../../node_modules/svelte/src/index-client.js'),
);

// What the shell says: the version, and where a setting is written.
const system = vi.hoisted(() => ({
  systemInfo: vi.fn(),
  settingsSet: vi.fn(async (_changed: unknown) => {}),
}));
vi.mock('$lib/api/system', async (original) => ({
  ...(await original<typeof import('$lib/api/system')>()),
  ...system,
}));
// The engine, which the section of the synchronization is told of.
vi.mock('$lib/api/sync', () => ({
  onSync: vi.fn(async () => () => {}),
  syncStatus: vi.fn(async () => ({
    on: false,
    server: null,
    name: null,
    state: 'off',
    last: null,
    problem: null,
    waiting: false,
  })),
  syncHome: vi.fn(),
  syncDevice: vi.fn(async () => 'SM-S908B'),
  syncStart: vi.fn(),
  syncJoin: vi.fn(),
  syncCode: vi.fn(),
  syncRename: vi.fn(),
  syncRemove: vi.fn(),
  syncStop: vi.fn(),
  syncNow: vi.fn(),
}));

const { flushSync, mount, tick, unmount } = await import('svelte');
const { default: SettingsPlace } = await import('./SettingsPlace.svelte');
const { languages } = await import('$lib/i18n');
const { settings } = await import('$lib/state/settings.svelte');
const { sync } = await import('$lib/sync/sync.svelte');

let done = () => {};

afterEach(() => {
  done();
  done = () => {};
  languages.current = 'en';
  settings.value.language = 'system';
  settings.value.theme = 'system';
  vi.clearAllMocks();
});

const settle = async () => {
  await tick();
  await new Promise((resolve) => setTimeout(resolve, 20));
  flushSync();
};

async function setUp() {
  system.systemInfo.mockResolvedValue({ version: '0.2.15' } as SystemInfo);
  languages.interface = [
    { tag: 'sv', name: 'Svenska' },
    { tag: 'en', name: 'English' },
    { tag: 'nb', name: 'Norsk bokmål' },
    { tag: 'de', name: 'Deutsch' },
  ];
  languages.interfaceDefault = 'nb';
  sync.status = null;
  const target = document.createElement('div');
  document.body.append(target);
  const place = mount(SettingsPlace, { target });
  flushSync();
  await settle();
  done = () => {
    unmount(place);
    target.remove();
  };
  const language = () => target.querySelector<HTMLSelectElement>('[data-phone-language]')!;
  /** Chooses a language, as the system's chooser does. */
  const choose = (tag: string) => {
    const select = language();
    select.value = tag;
    select.dispatchEvent(new Event('change', { bubbles: true }));
    flushSync();
  };
  const radios = () =>
    Array.from(target.querySelectorAll<HTMLButtonElement>('[data-phone-theme] [role="radio"]'));
  const radio = (label: string) => radios().find((r) => r.textContent?.trim() === label)!;
  const checked = () =>
    radios()
      .filter((r) => r.getAttribute('aria-checked') === 'true')
      .map((r) => r.textContent?.trim());
  return { target, language, choose, radios, radio, checked };
}

describe('the settings of the phone', () => {
  it('has its row at the top with Back, and under it the synchronization, the language, the colours and what this is, in that order', async () => {
    const { target } = await setUp();
    const root = target.querySelector('[data-phone-settings]')!;
    expect(root).not.toBeNull();
    expect(root.querySelector('[data-phone-bar]')?.textContent).toContain('Settings');
    expect(root.querySelector('[data-phone-back]')).not.toBeNull();
    expect(Array.from(root.querySelectorAll('h2')).map((h) => h.textContent)).toEqual([
      'Synchronization',
      'Language',
      'Colours',
      'About',
    ]);
    // The section of the synchronization is told that this device takes the notes.
    expect(root.querySelector('[data-synchronization]')?.getAttribute('data-sync-takes')).toBe(
      'notes',
    );
  });

  describe('the language', () => {
    it('offers the system’s first, with the language that is, then each language by its own name in order', async () => {
      const { language } = await setUp();
      const shown = Array.from(language().options).map((o) => [o.value, o.textContent]);
      expect(shown).toEqual([
        ['system', 'As the system (Norsk bokmål)'],
        ['de', 'Deutsch'],
        ['en', 'English'],
        ['nb', 'Norsk bokmål'],
        ['sv', 'Svenska'],
      ]);
      expect(language().value).toBe('system');
    });

    it('is kept when chosen, and As the system is kept as system', async () => {
      const { language, choose } = await setUp();
      choose('sv');
      expect(settings.value.language).toBe('sv');
      expect(language().value).toBe('sv');
      choose('system');
      expect(settings.value.language).toBe('system');
      expect(language().value).toBe('system');
      // It is written, after a moment, to the file of the settings.
      await new Promise((resolve) => setTimeout(resolve, 350));
      expect(system.settingsSet).toHaveBeenCalledWith({ language: 'system' });
    });

    it('shows a language chosen once and no longer offered as the system’s', async () => {
      settings.value.language = 'fi';
      const { language } = await setUp();
      expect(language().value).toBe('system');
    });

    it('is shown as the chosen one where the settings say so', async () => {
      settings.value.language = 'de';
      const { language } = await setUp();
      expect(language().value).toBe('de');
    });
  });

  describe('the colours', () => {
    it('are three, and the one kept is shown as chosen', async () => {
      const { radios, checked } = await setUp();
      expect(radios().map((r) => r.textContent?.trim())).toEqual([
        'As the system',
        'Light',
        'Dark',
      ]);
      expect(checked()).toEqual(['As the system']);
    });

    it('are kept when dark, light and the system’s are chosen', async () => {
      const { radio, checked, target } = await setUp();
      radio('Dark').click();
      flushSync();
      expect(settings.value.theme).toBe('dark');
      expect(checked()).toEqual(['Dark']);
      expect(target.querySelector('[data-phone-theme]')?.getAttribute('data-phone-theme')).toBe(
        'dark',
      );
      radio('Light').click();
      flushSync();
      expect(settings.value.theme).toBe('light');
      radio('As the system').click();
      flushSync();
      expect(settings.value.theme).toBe('system');
      await new Promise((resolve) => setTimeout(resolve, 350));
      expect(system.settingsSet).toHaveBeenCalledWith({ theme: 'system' });
    });

    it('show none as chosen where the file says Mellow or one’s own', async () => {
      settings.value.theme = 'mellow';
      const mellow = await setUp();
      expect(mellow.radios()).toHaveLength(3);
      expect(mellow.checked()).toEqual([]);
      done();
      done = () => {};
      settings.value.theme = 'own';
      const own = await setUp();
      expect(own.checked()).toEqual([]);
      // Chosen, one of the three takes its place.
      own.radio('Dark').click();
      flushSync();
      expect(settings.value.theme).toBe('dark');
    });
  });

  it('says what the program is, with its version, and under it the licence', async () => {
    const { target } = await setUp();
    const about = target.querySelector('[data-phone-about]')!;
    expect(about.textContent).toContain('Glaukopis 0.2.15');
    expect(about.textContent).toContain('Free software under the GNU General Public License');
  });

  it('says the program’s name alone where the version cannot be asked', async () => {
    system.systemInfo.mockRejectedValue(new Error('not here'));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const target = document.createElement('div');
    document.body.append(target);
    const place = mount(SettingsPlace, { target });
    flushSync();
    await settle();
    done = () => {
      unmount(place);
      target.remove();
      warn.mockRestore();
    };
    expect(target.querySelector('[data-phone-about] .name')?.textContent).toBe('Glaukopis');
  });

  it('speaks Bokmål when the interface does', async () => {
    const { target } = await setUp();
    languages.current = 'nb';
    flushSync();
    expect(Array.from(target.querySelectorAll('h2')).map((h) => h.textContent)).toEqual([
      'Synkronisering',
      'Språk',
      'Farger',
      'Om programmet',
    ]);
  });
});
