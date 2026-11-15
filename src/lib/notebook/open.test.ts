import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as Y from 'yjs';

const HASH = 'a'.repeat(64);

const api = vi.hoisted(() => ({
  loaded: { state: null as Uint8Array | null, updates: [] as Uint8Array[] },
  heard: null as ((update: Uint8Array) => void) | null,
  notebookLoad: vi.fn(),
  notebookAppend: vi.fn(async (_update: Uint8Array, _time?: number) => {}),
  notebookSaveState: vi.fn(async () => {}),
  notebookHold: vi.fn(async () => {}),
  notebookSweep: vi.fn(async () => 0),
}));

vi.mock('$lib/api/notebook', () => ({
  notebookLoad: api.notebookLoad,
  notebookAppend: api.notebookAppend,
  notebookSaveState: api.notebookSaveState,
  notebookHold: api.notebookHold,
  notebookSweep: api.notebookSweep,
  notebookTakeFiles: vi.fn(),
  notebookTakeImage: vi.fn(),
  onNotebookUpdate: vi.fn(async (heard: (update: Uint8Array) => void) => {
    api.heard = heard;
    return () => {};
  }),
}));

/** The module as a new window has it. */
async function fresh() {
  vi.resetModules();
  const { theNotebook } = await import('./open.svelte');
  const { Notebook } = await import('./model/notebook.svelte');
  const { finishBeforeClose } = await import('$lib/state/closing');
  return { theNotebook, Notebook, finishBeforeClose };
}

beforeEach(() => {
  vi.clearAllMocks();
  api.loaded = { state: null, updates: [] };
  api.notebookLoad.mockImplementation(async () => api.loaded);
  api.heard = null;
});

describe('the one notebook of the window', () => {
  it('is read once, and is the same whenever asked for', async () => {
    const { theNotebook } = await fresh();
    const first = theNotebook.open();
    expect(theNotebook.open()).toBe(first);
    const notebook = await first;
    expect(await theNotebook.open()).toBe(notebook);
    expect(theNotebook.current).toBe(notebook);
    expect(api.notebookLoad).toHaveBeenCalledTimes(1);
    expect(theNotebook.holder()!.undoManager).toBe(notebook.undoManager);
  });

  it('says why it could not be read, and is read again when asked again', async () => {
    const { theNotebook } = await fresh();
    api.notebookLoad.mockRejectedValueOnce(new Error('no disk'));
    await expect(theNotebook.open()).rejects.toThrow('no disk');
    expect(theNotebook.failure).toBe('no disk');
    await theNotebook.open();
    expect(theNotebook.failure).toBeNull();
  });

  it('what is written is appended to its log', async () => {
    const { theNotebook } = await fresh();
    const notebook = await theNotebook.open();
    notebook.addNote({ name: 'Kept' });
    await notebook.flush();
    expect(api.notebookAppend).toHaveBeenCalledTimes(1);
    const [update, time] = api.notebookAppend.mock.calls[0];
    expect(update).toBeInstanceOf(Uint8Array);
    expect(typeof time).toBe('number');
  });

  it('what another window wrote is applied, and not appended again', async () => {
    const { theNotebook, Notebook } = await fresh();
    const notebook = await theNotebook.open();
    const other = new Notebook();
    const id = other.addNote({ name: 'Elsewhere' });
    api.heard!(Y.encodeStateAsUpdate(other.doc));
    expect(notebook.note(id)!.name).toBe('Elsewhere');
    await notebook.flush();
    expect(api.notebookAppend).not.toHaveBeenCalled();
  });

  it('the store is asked once to sweep, with the files the notes hold', async () => {
    const { theNotebook, Notebook } = await fresh();
    const before = new Notebook();
    const id = before.addNote();
    before.holdFile({ hash: HASH, name: 'owl.png', extension: 'png' }, null);
    before.addFigure(id, { hash: HASH, name: 'owl.png', extension: 'png' });
    api.loaded = { state: Y.encodeStateAsUpdate(before.doc), updates: [] };
    await theNotebook.open();
    await theNotebook.open();
    expect(api.notebookSweep).toHaveBeenCalledTimes(1);
    expect(api.notebookSweep).toHaveBeenCalledWith([HASH]);
  });

  it('a file a note comes to hold is told to the store', async () => {
    const { theNotebook } = await fresh();
    const notebook = await theNotebook.open();
    const id = notebook.addNote();
    notebook.addFigure(id, { hash: HASH, name: 'lib.png', extension: 'png' });
    expect(api.notebookHold).toHaveBeenCalledWith([HASH]);
  });

  it('before the window closes, what is not yet written is written, and then the whole', async () => {
    const { theNotebook, finishBeforeClose } = await fresh();
    const notebook = await theNotebook.open();
    notebook.addNote();
    expect(await finishBeforeClose()).toEqual([]);
    expect(api.notebookAppend).toHaveBeenCalledTimes(1);
    expect(api.notebookSaveState).toHaveBeenCalledTimes(1);
    expect(api.notebookSaveState).toHaveBeenCalledWith(expect.any(Uint8Array), {
      notes: 1,
      files: [],
    });
  });

  it('a log that could not be written keeps the window open', async () => {
    const { theNotebook, finishBeforeClose } = await fresh();
    const notebook = await theNotebook.open();
    api.notebookAppend.mockRejectedValue(new Error('disk full'));
    notebook.addNote();
    const failures = await finishBeforeClose();
    expect(failures.length).toBe(1);
    expect(api.notebookSaveState).not.toHaveBeenCalled();
    api.notebookAppend.mockReset();
  });
});
