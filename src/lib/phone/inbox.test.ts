import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { InboxItem } from '$lib/api/notebook';

const api = vi.hoisted(() => ({
  notebookInboxTake: vi.fn(),
  notebookInboxWaiting: vi.fn(),
}));
vi.mock('$lib/api/notebook', () => ({
  notebookInboxTake: api.notebookInboxTake,
  notebookInboxWaiting: api.notebookInboxWaiting,
  notebookTakeFiles: vi.fn(),
  notebookTakeImage: vi.fn(),
}));

const opened = vi.hoisted(() => ({ open: vi.fn() }));
vi.mock('$lib/notebook/open.svelte', () => ({ theNotebook: opened }));

const shown = vi.hoisted(() => ({ show: vi.fn(), notifyError: vi.fn() }));
vi.mock('$lib/ui/toast.svelte', () => ({
  toasts: { show: shown.show },
  notifyError: shown.notifyError,
}));

const { takeInbox } = await import('./inbox');
const { Notebook } = await import('$lib/notebook/model/notebook.svelte');

/** What the page of a note left in the inbox: its words, as lines, and no document. */
const note = (text: string, when = '2026-11-23T08:00:00.000Z'): InboxItem => ({
  kind: 'note',
  url: '',
  title: '',
  when,
  text,
  html: '',
  alt: '',
  image: null,
  doc: null,
  files: [],
});

let notebook: InstanceType<typeof Notebook>;

beforeEach(() => {
  vi.clearAllMocks();
  notebook = new Notebook();
  opened.open.mockResolvedValue(notebook);
  api.notebookInboxTake.mockResolvedValue([]);
  api.notebookInboxWaiting.mockResolvedValue(1);
});

describe('the inbox, on the phone', () => {
  it('is looked at, and the notebook not even opened, where nothing waits', async () => {
    api.notebookInboxWaiting.mockResolvedValue(0);
    await takeInbox();
    expect(api.notebookInboxWaiting).toHaveBeenCalledTimes(1);
    expect(opened.open).not.toHaveBeenCalled();
    expect(api.notebookInboxTake).not.toHaveBeenCalled();
  });

  it('becomes notes not looked at, at the top of the list, with nothing said', async () => {
    api.notebookInboxTake.mockResolvedValueOnce([note('Seen on the way home\nA second line')]);
    const flush = vi.spyOn(notebook, 'flush');
    await takeInbox();
    expect(opened.open).toHaveBeenCalledTimes(1);
    const [first] = notebook.list;
    expect(first.seen).toBe(false);
    expect(first.words).toContain('seen on the way home');
    expect(flush).toHaveBeenCalled();
    expect(shown.show).not.toHaveBeenCalled();
    expect(shown.notifyError).not.toHaveBeenCalled();
  });

  it('is taken once at a time: asked while it is taken, it is taken again after', async () => {
    let free: () => void = () => {};
    api.notebookInboxTake
      .mockImplementationOnce(
        () =>
          new Promise<InboxItem[]>((resolve) => {
            free = () => resolve([note('One')]);
          }),
      )
      .mockResolvedValueOnce([note('Two', '2026-11-23T09:00:00.000Z')]);
    const first = takeInbox();
    await vi.waitFor(() => expect(api.notebookInboxTake).toHaveBeenCalledTimes(1));
    const second = takeInbox();
    free();
    await Promise.all([first, second]);
    expect(api.notebookInboxTake).toHaveBeenCalledTimes(2);
    expect(notebook.list.map((n) => n.begins)).toEqual(['Two', 'One']);
  });

  it('waits where the notebook cannot be read, and takes nothing out of the inbox', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    opened.open.mockRejectedValueOnce(new Error('unreadable'));
    await takeInbox();
    expect(api.notebookInboxTake).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
