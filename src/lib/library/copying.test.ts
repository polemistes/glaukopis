import { afterEach, describe, expect, it, vi } from 'vitest';
import { toasts } from '$lib/ui/toast.svelte';
import { copyOut, copyWritten } from './copying';

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

describe('copying what a style wrote', () => {
  /** A clipboard that takes words and HTML together, as a web view's does: what it was given, once it has come. */
  function rich() {
    const taken: Record<string, string>[] = [];
    const words: string[] = [];
    class Item {
      constructor(readonly parts: Record<string, Promise<Blob>>) {}
    }
    vi.stubGlobal('ClipboardItem', Item);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        write: async (items: Item[]) => {
          const out: Record<string, string> = {};
          for (const [type, part] of Object.entries(items[0].parts))
            out[type] = await (await part).text();
          taken.push(out);
        },
        writeText: async (text: string) => void words.push(text),
      },
    });
    return { taken, words };
  }

  afterEach(() => vi.unstubAllGlobals());

  it('gives the clipboard the words and the HTML, asked for at once', async () => {
    const { taken, words } = rich();
    let asked = false;
    const copying = copyWritten(async () => {
      asked = true;
      return { text: 'Nagy 1979', html: '<p><em>Nagy</em> 1979</p>' };
    }, 'Copied');
    // The clipboard is asked while the key or the press is still answered.
    expect(asked).toBe(true);
    expect(await copying).toBe(true);
    expect(taken).toEqual([
      { 'text/plain': 'Nagy 1979', 'text/html': '<p><em>Nagy</em> 1979</p>' },
    ]);
    expect(words).toEqual([]);
  });

  it('gives the words where the clipboard will not take the two', async () => {
    const { taken, words } = rich();
    (navigator.clipboard as unknown as { write: unknown }).write = async () => {
      throw new Error('not allowed');
    };
    expect(
      await copyWritten(async () => ({ text: 'Nagy 1979', html: '<p>Nagy 1979</p>' }), null),
    ).toBe(true);
    expect(taken).toEqual([]);
    expect(words).toEqual(['Nagy 1979']);
  });

  it('says why where nothing could be written, and copies nothing', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { taken, words } = rich();
    const shown = vi.spyOn(toasts, 'show');
    expect(
      await copyWritten(
        () => Promise.reject({ kind: 'not-found', message: 'not found' }),
        'Copied',
      ),
    ).toBe(false);
    expect(taken).toEqual([]);
    expect(words).toEqual([]);
    expect(shown).toHaveBeenCalledOnce();
    expect(shown.mock.calls[0][0]).toMatchObject({ kind: 'error', detail: 'not found' });
  });
});
