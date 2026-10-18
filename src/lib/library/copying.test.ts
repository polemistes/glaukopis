import { afterEach, describe, expect, it, vi } from 'vitest';
import { toasts } from '$lib/ui/toast.svelte';
import { copyOut } from './copying';

function clipboard(writeText: (text: string) => Promise<void>) {
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
}

afterEach(() => vi.restoreAllMocks());

describe('copying from the library', () => {
  it('says "Copied" once the clipboard has it', async () => {
    const written: string[] = [];
    clipboard(async (text) => void written.push(text));
    expect(await copyOut(async () => '@book{homer}', 'Copied')).toBe(true);
    expect(written).toEqual(['@book{homer}']);
  });

  it('says that nothing was copied when the clipboard refuses, and not "Copied"', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    clipboard(async () => {
      throw new Error('not allowed');
    });
    const shown = vi.spyOn(toasts, 'show');
    expect(await copyOut(() => 'homer', 'Copied')).toBe(false);
    expect(shown).toHaveBeenCalledOnce();
    expect(shown.mock.calls[0][0]).toMatchObject({ kind: 'error', detail: 'not allowed' });
  });

  it('says so when what was to be copied could not be had', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const written: string[] = [];
    clipboard(async (text) => void written.push(text));
    const shown = vi.spyOn(toasts, 'show');
    expect(
      await copyOut(() => Promise.reject({ kind: 'io', message: 'unreadable' }), 'Copied'),
    ).toBe(false);
    expect(written).toEqual([]);
    expect(shown.mock.calls[0][0]).toMatchObject({ kind: 'error', detail: 'unreadable' });
  });
});
