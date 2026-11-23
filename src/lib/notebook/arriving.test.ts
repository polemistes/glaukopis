import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { InboxItem } from '$lib/api/notebook';

const api = vi.hoisted(() => ({
  heard: null as (() => void) | null,
  notebookInboxTake: vi.fn(),
  notebookInboxWaiting: vi.fn(),
  onNotebookInbox: vi.fn(async (heard: () => void) => {
    api.heard = heard;
    return () => {
      api.heard = null;
    };
  }),
}));
vi.mock('$lib/api/notebook', () => ({
  notebookInboxTake: api.notebookInboxTake,
  notebookInboxWaiting: api.notebookInboxWaiting,
  onNotebookInbox: api.onNotebookInbox,
  notebookTakeFiles: vi.fn(),
  notebookTakeImage: vi.fn(),
}));

const opened = vi.hoisted(() => ({ open: vi.fn() }));
vi.mock('./open.svelte', () => ({ theNotebook: opened }));

const shown = vi.hoisted(() => ({ show: vi.fn(), notifyError: vi.fn() }));
vi.mock('$lib/ui/toast.svelte', () => ({
  toasts: { show: shown.show },
  notifyError: shown.notifyError,
}));

const went = vi.hoisted(() => ({ go: vi.fn() }));
vi.mock('$lib/state/router.svelte', () => ({ router: went }));

const { watchInbox, takeInbox, arrivedWords } = await import('./arriving.svelte');
const { Notebook } = await import('./model/notebook.svelte');

const item = (over: Partial<InboxItem> = {}): InboxItem => ({
  id: 'thing',
  kind: 'selection',
  url: 'https://example.org/owl',
  title: 'The owl',
  when: '2026-11-15T12:00:00.000Z',
  text: 'Wise words',
  html: '',
  alt: '',
  image: null,
  doc: null,
  files: [],
  ...over,
});

/** Until what was asked has been done. */
const settled = () => new Promise((r) => setTimeout(r, 0));

let notebook: InstanceType<typeof Notebook>;

beforeEach(() => {
  vi.clearAllMocks();
  notebook = new Notebook();
  opened.open.mockResolvedValue(notebook);
  api.notebookInboxTake.mockResolvedValue([]);
  // Something waits unless a test says nothing does: what is taken says what.
  api.notebookInboxWaiting.mockResolvedValue(1);
});

describe('what arrives from the plugin', () => {
  it('nothing in the inbox: the notebook is not even read, and nothing is taken', async () => {
    api.notebookInboxWaiting.mockResolvedValue(0);
    const stop = watchInbox();
    await settled();
    expect(api.notebookInboxWaiting).toHaveBeenCalledTimes(1);
    expect(api.notebookInboxTake).not.toHaveBeenCalled();
    expect(opened.open).not.toHaveBeenCalled();
    expect(shown.show).not.toHaveBeenCalled();
    stop();
  });

  it('what lies there at the start is made notes, said, and shown when asked', async () => {
    api.notebookInboxTake.mockResolvedValueOnce([item()]);
    const stop = watchInbox();
    await settled();
    await settled();
    expect(notebook.list.length).toBe(1);
    const id = notebook.list[0].id;
    expect(shown.show).toHaveBeenCalledTimes(1);
    const [toast] = shown.show.mock.calls[0];
    expect(toast.message).toBe('Added to the notebook: The owl');
    expect(toast.action.label).toBe('Show');
    toast.action.run();
    expect(went.go).toHaveBeenCalledWith({ view: 'notebook', note: id });
    stop();
  });

  it('what comes while the window is open is taken when the shell says so', async () => {
    const stop = watchInbox();
    await settled();
    api.notebookInboxTake.mockResolvedValueOnce([item(), item({ text: 'More', kind: 'page' })]);
    api.heard!();
    await settled();
    await settled();
    expect(notebook.list.length).toBe(2);
    expect(shown.show.mock.calls[0][0].message).toBe('2 things added to the notebook');
    stop();
    expect(api.heard).toBeNull();
  });

  it('one taking at a time: what is told during one is taken right after it', async () => {
    let release!: (items: InboxItem[]) => void;
    api.notebookInboxTake.mockImplementationOnce(
      () => new Promise<InboxItem[]>((r) => (release = r)),
    );
    api.notebookInboxTake.mockResolvedValueOnce([item({ text: 'Second' })]);
    const first = takeInbox();
    void takeInbox();
    void takeInbox();
    // The inbox is looked at and the notebook read before anything is taken.
    await settled();
    expect(api.notebookInboxTake).toHaveBeenCalledTimes(1);
    release([item({ text: 'First' })]);
    await first;
    expect(api.notebookInboxTake).toHaveBeenCalledTimes(2);
    expect(notebook.list.map((n) => n.begins).sort()).toEqual(['First', 'Second']);
  });

  it('a notebook that cannot be read is said, and what waits stays in the inbox', async () => {
    api.notebookInboxTake.mockResolvedValueOnce([item()]);
    opened.open.mockRejectedValueOnce(new Error('no disk'));
    await takeInbox();
    expect(shown.notifyError).toHaveBeenCalledWith(expect.any(String), expect.any(Error));
    expect(shown.show).not.toHaveBeenCalled();
    // The notebook is read before anything is taken: nothing left the inbox.
    expect(api.notebookInboxTake).not.toHaveBeenCalled();
  });
});

describe('what is said of what arrived', () => {
  it('the title of the page where one thing came; the words alone where it has none', () => {
    expect(arrivedWords([item({ title: ' Owls ' })], 1)).toBe('Added to the notebook: Owls');
    expect(arrivedWords([item({ title: '' })], 1)).toBe('Added to the notebook');
    expect(arrivedWords([item(), item()], 2)).toBe('2 things added to the notebook');
  });
});
