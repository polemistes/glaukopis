import { afterEach, describe, expect, it, vi } from 'vitest';
import type { SyncHome, SyncStatus } from '$lib/api/sync';

// The section is mounted and pressed, so with the browser's Svelte: the tests
// otherwise run with the server's, in which nothing is followed.
vi.mock(
  'svelte',
  // @ts-expect-error: the browser's Svelte, as a file, has no types of its own.
  () => import('../../../node_modules/svelte/src/index-client.js'),
);

// The engine as the shell has it: asked for the name, the status and the devices.
const api = vi.hoisted(() => ({
  onSync: vi.fn(),
  syncStatus: vi.fn(),
  syncHome: vi.fn(),
  syncDevice: vi.fn(),
  syncStart: vi.fn(),
  syncJoin: vi.fn(),
  syncCode: vi.fn(),
  syncRename: vi.fn(),
  syncRemove: vi.fn(),
  syncStop: vi.fn(),
  syncNow: vi.fn(),
}));
vi.mock('$lib/api/sync', () => api);

const { flushSync, mount, tick, unmount } = await import('svelte');
const { default: SyncSettings } = await import('./SyncSettings.svelte');
const { sync } = await import('./sync.svelte');
const { confirmations } = await import('$lib/ui/confirm.svelte');
const { languages, t } = await import('$lib/i18n');

let done = () => {};

afterEach(() => {
  confirmations.current?.resolve('cancel');
  confirmations.current = null;
  languages.current = 'en';
  done();
  done = () => {};
});

const OFF: SyncStatus = {
  on: false,
  server: null,
  name: null,
  state: 'off',
  last: null,
  problem: null,
  waiting: false,
};
const ON: SyncStatus = {
  on: true,
  server: 'https://glaukopis.example.org',
  name: 'Phone',
  state: 'idle',
  last: '2026-11-23T08:00:00.000Z',
  problem: null,
  waiting: false,
};
const device = (id: string, name: string, you: boolean) => ({
  id,
  name,
  joined: 1,
  lastSeen: 1,
  you,
});
const HOME = (...devices: ReturnType<typeof device>[]): SyncHome => ({
  devices,
  codes: [],
  usedBytes: 0,
});

const settle = async () => {
  await tick();
  await new Promise((resolve) => setTimeout(resolve, 20));
  flushSync();
};

/**
 * The section, mounted with what the engine says: its status, and what the
 * server says of the devices (a home, or a refusal to be asked).
 */
async function setUp(
  options: { takes?: 'everything' | 'notes'; status?: SyncStatus; home?: SyncHome | Error } = {},
) {
  const status = options.status ?? OFF;
  api.onSync.mockImplementation(async () => () => {});
  api.syncStatus.mockImplementation(async () => status);
  api.syncDevice.mockImplementation(async () => 'SM-S908B');
  if (options.home instanceof Error) api.syncHome.mockRejectedValue(options.home);
  else api.syncHome.mockResolvedValue(options.home ?? HOME(device('a', 'Phone', true)));
  // The state is one for the window: it is told what the engine says before the section shows it.
  sync.status = status;
  sync.home = null;
  sync.homeProblem = null;
  const target = document.createElement('div');
  document.body.append(target);
  const section = mount(SyncSettings, {
    target,
    props: options.takes ? { takes: options.takes } : {},
  });
  flushSync();
  await settle();
  done = () => {
    unmount(section);
    target.remove();
  };
  const field = (name: string) => target.querySelector<HTMLInputElement>(`input[name="${name}"]`)!;
  const about = () => target.querySelector('[data-sync-about]')?.textContent?.trim();
  /** Presses the end of the section and gives the question that was put. */
  const stop = async () => {
    target.querySelector<HTMLButtonElement>('[data-sync-stop]')!.click();
    await settle();
    return confirmations.current;
  };
  return { target, field, about, stop };
}

describe('the synchronization in the settings', () => {
  it('offers the name the system gives the device, and asks for it by that call', async () => {
    const { field } = await setUp();
    expect(api.syncDevice).toHaveBeenCalled();
    expect(field('sync-name').value).toBe('SM-S908B');
  });

  it('says what a computer has under the heading, and what a phone has with takes="notes"', async () => {
    const computer = await setUp();
    expect(computer.about()).toBe(t('sync-about'));
    expect(computer.about()).toContain('on each of your computers');
    done();
    done = () => {};
    const phone = await setUp({ takes: 'notes' });
    expect(phone.about()).toBe(t('sync-about-notes'));
    expect(phone.about()).toContain('Your notebook, the same on this device as on your others');
    expect(phone.about()).not.toContain('projects');
    languages.current = 'nb';
    flushSync();
    expect(phone.about()).toContain('Notatblokken din, den samme på denne enheten');
  });

  it('says the same as without a prop where takes is "everything"', async () => {
    const { about } = await setUp({ takes: 'everything' });
    expect(about()).toBe(t('sync-about'));
  });

  it('asks the keyboard for an address, a name and a code as they are, with nothing remembered or corrected', async () => {
    const { field, target } = await setUp({ takes: 'notes' });
    const server = field('sync-server');
    expect(server.getAttribute('inputmode')).toBe('url');
    expect(server.getAttribute('autocapitalize')).toBe('off');
    expect(server.getAttribute('autocorrect')).toBe('off');
    expect(server.getAttribute('autocomplete')).toBe('off');
    expect(server.getAttribute('spellcheck')).toBe('false');
    const name = field('sync-name');
    expect(name.getAttribute('autocomplete')).toBe('off');
    expect(name.getAttribute('spellcheck')).toBe('false');
    // The code is asked for when the choice is to join.
    const join = Array.from(target.querySelectorAll<HTMLButtonElement>('[role="radio"]')).find(
      (b) => b.textContent?.trim() === t('sync-how-join'),
    )!;
    join.click();
    flushSync();
    const code = field('sync-code');
    expect(code.getAttribute('autocapitalize')).toBe('characters');
    expect(code.getAttribute('autocorrect')).toBe('off');
    expect(code.getAttribute('autocomplete')).toBe('off');
  });

  it('names the devices where it is on, this one among them', async () => {
    const { target } = await setUp({
      takes: 'notes',
      status: ON,
      home: HOME(device('a', 'Phone', true), device('b', 'Desk', false)),
    });
    const listed = Array.from(target.querySelectorAll<HTMLElement>('[data-sync-computer]'));
    expect(listed.map((d) => d.dataset.syncComputer)).toEqual(['Phone', 'Desk']);
    expect(listed[0].textContent).toContain('Phone (this device)');
    expect(target.querySelector('h3')?.textContent).toBe('Devices');
    expect(target.querySelector('[data-sync-add]')?.textContent?.trim()).toBe('Add a device…');
  });

  describe('the question before it stops', () => {
    it('is the phone’s for the last device that takes the notes', async () => {
      const { stop } = await setUp({ takes: 'notes', status: ON });
      const question = await stop();
      expect(question?.title).toBe('Stop synchronizing on this device?');
      expect(question?.message).toBe(t('sync-stop-message-alone-notes'));
      expect(question?.message).toContain('Your projects and the files of your library');
      expect(question?.message).toContain('what the server keeps of them is deleted');
    });

    it('is the computer’s for the last device that takes everything', async () => {
      const { stop } = await setUp({ status: ON });
      const question = await stop();
      expect(question?.message).toBe(t('sync-stop-message-alone'));
      expect(question?.message).not.toContain('Your projects');
    });

    it('is the usual one where there are other devices, however much the device takes', async () => {
      const others = HOME(device('a', 'Phone', true), device('b', 'Desk', false));
      const { stop } = await setUp({ takes: 'notes', status: ON, home: others });
      expect((await stop())?.message).toBe(t('sync-stop-message'));
      confirmations.current?.resolve('cancel');
      confirmations.current = null;
      done();
      done = () => {};
      const again = await setUp({ status: ON, home: others });
      expect((await again.stop())?.message).toBe(t('sync-stop-message'));
    });

    it('is the usual one where the server could not be asked which devices there are', async () => {
      const { stop, target } = await setUp({
        takes: 'notes',
        status: ON,
        home: new Error('no answer'),
      });
      expect(target.querySelector('[data-sync-computers-unread]')).not.toBeNull();
      expect((await stop())?.message).toBe(t('sync-stop-message'));
    });
  });
});
