import { afterEach, describe, expect, it, vi } from 'vitest';

const read = vi.fn();
vi.mock('$lib/api/files', async (original) => ({
  ...(await original<typeof import('$lib/api/files')>()),
  filePath: read,
  filesSync: vi.fn(async () => ({ sent: 0, fetched: 0, problems: [] })),
}));
vi.mock('$lib/api/system', async (original) => ({
  ...(await original<typeof import('$lib/api/system')>()),
  fileRead: vi.fn(async () => new Uint8Array()),
}));

const { pictures, showPicture } = await import('./pictures.svelte');

const hash = (n: number) => n.toString(16).padStart(64, '0');

/** What is shown of an image once it has been read. */
async function shownOf(name: string) {
  pictures.of(name, 'png');
  await vi.waitFor(() => expect(pictures.of(name, 'png').state).not.toBe('reading'));
  return pictures.of(name, 'png');
}

afterEach(() => vi.restoreAllMocks());

describe('a picture that cannot be shown', () => {
  it('is not on this computer only when the library says it is not there', async () => {
    read.mockRejectedValueOnce({ kind: 'not-found', message: 'the picture was not found' });
    expect((await shownOf(hash(1))).state).toBe('absent');
  });

  it('says why when it is there and cannot be read, and the log has it', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    read.mockRejectedValueOnce({ kind: 'io', message: 'permission denied' });
    const shown = await shownOf(hash(2));
    expect(shown).toMatchObject({ state: 'unread', why: 'permission denied' });
    expect(error).toHaveBeenCalled();

    const holder = document.createElement('div');
    const img = document.createElement('img');
    holder.append(img);
    showPicture(holder, img, shown);
    expect(holder.dataset.state).toBe('unread');
    expect(holder.dataset.why).toContain('permission denied');
    expect(holder.title).toContain('permission denied');
    showPicture(holder, img, { url: null, state: 'absent' });
    expect(holder.dataset.why).toBeUndefined();
    expect(holder.title).toBe('');
  });
});
