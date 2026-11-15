import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FirefoxSetup } from '$lib/api/notebook';

// Mounted, and changed under it: with the browser's Svelte.
vi.mock(
  'svelte',
  // @ts-expect-error: the browser's Svelte, as a file, has no types of its own.
  () => import('../../../node_modules/svelte/src/index-client.js'),
);

const MANIFEST = '/home/u/.mozilla/native-messaging-hosts/org.glaukopis.notebook.json';
const at = (over: Partial<FirefoxSetup>): FirefoxSetup => ({
  installed: false,
  manifest: MANIFEST,
  other: null,
  ...over,
});

const api = vi.hoisted(() => ({
  firefoxSetup: vi.fn(),
  firefoxSetUp: vi.fn(),
  firefoxRemove: vi.fn(),
}));
vi.mock('$lib/api/notebook', () => api);
vi.mock('$lib/ui/toast.svelte', () => ({ notifyError: vi.fn() }));

const { flushSync, mount, unmount } = await import('svelte');
const { default: FirefoxSettings } = await import('./FirefoxSettings.svelte');
const { notifyError } = await import('$lib/ui/toast.svelte');

let done = () => {};

beforeEach(() => vi.clearAllMocks());
afterEach(() => {
  done();
  done = () => {};
  document.body.innerHTML = '';
});

/** The row, once what Firefox is told has been read. */
async function shown() {
  const target = document.body.appendChild(document.createElement('div'));
  const row = mount(FirefoxSettings, { target });
  done = () => unmount(row);
  await new Promise((r) => setTimeout(r, 0));
  flushSync();
  return target;
}

const button = (target: HTMLElement, what: string) =>
  target.querySelector<HTMLButtonElement>(`[data-firefox-${what}]`);

describe('Firefox in the settings', () => {
  it('says it is not set up, and Set up sets it up', async () => {
    api.firefoxSetup.mockResolvedValue(at({}));
    api.firefoxSetUp.mockResolvedValue(at({ installed: true }));
    const target = await shown();
    expect(target.querySelector('[data-firefox-setup]')!.getAttribute('data-firefox-setup')).toBe(
      'none',
    );
    expect(target.textContent).toContain('Firefox is not set up');
    expect(button(target, 'remove')).toBeNull();
    button(target, 'set-up')!.click();
    await new Promise((r) => setTimeout(r, 0));
    flushSync();
    expect(api.firefoxSetUp).toHaveBeenCalledTimes(1);
    expect(target.textContent).toContain('Firefox is set up');
    expect(target.querySelector('[data-firefox-manifest]')!.textContent).toBe(MANIFEST);
    expect(button(target, 'set-up')).toBeNull();
  });

  it('set up, Remove removes it', async () => {
    api.firefoxSetup.mockResolvedValue(at({ installed: true }));
    api.firefoxRemove.mockResolvedValue(at({}));
    const target = await shown();
    button(target, 'remove')!.click();
    await new Promise((r) => setTimeout(r, 0));
    flushSync();
    expect(api.firefoxRemove).toHaveBeenCalledTimes(1);
    expect(target.textContent).toContain('Firefox is not set up');
  });

  it('names another installation where Firefox is told of it, and Set up makes it this one', async () => {
    api.firefoxSetup.mockResolvedValue(at({ other: '/opt/old/glaukopis' }));
    const target = await shown();
    expect(target.querySelector('[data-firefox-other]')!.textContent).toBe('/opt/old/glaukopis');
    expect(button(target, 'set-up')).not.toBeNull();
    expect(button(target, 'remove')).not.toBeNull();
  });

  it('says it where Firefox could not be set up', async () => {
    api.firefoxSetup.mockResolvedValue(at({}));
    api.firefoxSetUp.mockRejectedValue(new Error('read-only'));
    const target = await shown();
    button(target, 'set-up')!.click();
    await new Promise((r) => setTimeout(r, 0));
    expect(notifyError).toHaveBeenCalledWith('Firefox could not be set up', expect.any(Error));
  });
});
