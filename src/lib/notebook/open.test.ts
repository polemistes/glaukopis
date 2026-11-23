import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as Y from 'yjs';

const HASH = 'a'.repeat(64);

const api = vi.hoisted(() => ({
  loaded: { state: null as Uint8Array | null, updates: [] as Uint8Array[] },
  heard: null as ((update: Uint8Array) => void) | null,
  notebookLoad: vi.fn(),
  notebookAppend: vi.fn(async (_update: Uint8Array, _time?: number) => {}),
  notebookSaveState: vi.fn(async () => {}),
  notebookHold: vi.fn(async () => {}),
  notebookSweep: vi.fn(async (_held: string[]) => 0),
  notebookSayHeld: vi.fn(async (_files: string[]) => {}),
  notebookReadableWrite: vi.fn(async () => {}),
}));

vi.mock('$lib/api/notebook', () => ({
  notebookLoad: api.notebookLoad,
  notebookAppend: api.notebookAppend,
  notebookSaveState: api.notebookSaveState,
  notebookHold: api.notebookHold,
  notebookSweep: api.notebookSweep,
  notebookSayHeld: api.notebookSayHeld,
  notebookReadableWrite: api.notebookReadableWrite,
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

afterEach(() => {
  vi.useRealTimers();
});

/** A picture as a note holds it. */
const OWL = { hash: HASH, name: 'owl.png', extension: 'png' };

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

  it('what is heard while the notebook is being read is in it once it is read', async () => {
    const { theNotebook, Notebook } = await fresh();
    let give: ((loaded: typeof api.loaded) => void) | null = null;
    api.notebookLoad.mockImplementationOnce(
      () => new Promise<typeof api.loaded>((resolve) => (give = resolve)),
    );
    const opening = theNotebook.open();
    await vi.waitFor(() => expect(give).not.toBeNull());
    // It listens before it reads: a round of the synchronization writes a note meanwhile.
    expect(api.heard).not.toBeNull();
    const other = new Notebook();
    const during = other.addNote({ name: 'Written while it was read' });
    api.heard!(Y.encodeStateAsUpdate(other.doc));
    expect(theNotebook.current).toBeNull();
    give!({ state: null, updates: [] });
    const notebook = await opening;
    expect(notebook.note(during)!.name).toBe('Written while it was read');
    // And from then on every change at once.
    const after = other.addNote({ name: 'Written after' });
    api.heard!(Y.encodeStateAsUpdate(other.doc));
    expect(notebook.note(after)!.name).toBe('Written after');
    await notebook.flush();
    expect(api.notebookAppend).not.toHaveBeenCalled();
  });

  it('a notebook that could not be read listens no more, and is listened to anew when read again', async () => {
    const { theNotebook, Notebook } = await fresh();
    api.notebookLoad.mockRejectedValueOnce(new Error('no disk'));
    await expect(theNotebook.open()).rejects.toThrow('no disk');
    const notebook = await theNotebook.open();
    const other = new Notebook();
    const id = other.addNote({ name: 'Elsewhere' });
    api.heard!(Y.encodeStateAsUpdate(other.doc));
    expect(notebook.note(id)!.name).toBe('Elsewhere');
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

  it('the sweep is not asked for where the window does not sweep', async () => {
    vi.useFakeTimers();
    const { theNotebook } = await fresh();
    theNotebook.sweeps = false;
    const notebook = await theNotebook.open();
    await vi.advanceTimersByTimeAsync(5000);
    expect(api.notebookSweep).not.toHaveBeenCalled();
    // What its notes hold is said all the same.
    notebook.addFigure(notebook.addNote(), OWL);
    await vi.advanceTimersByTimeAsync(1000);
    expect(api.notebookSayHeld).toHaveBeenCalledWith([HASH]);
  });

  it('nothing is said of what the notes hold before the sweep has answered', async () => {
    vi.useFakeTimers();
    const { theNotebook } = await fresh();
    let answer: ((swept: number) => void) | null = null;
    api.notebookSweep.mockImplementationOnce(
      () => new Promise<number>((resolve) => (answer = resolve)),
    );
    const notebook = await theNotebook.open();
    expect(answer).not.toBeNull();
    notebook.addFigure(notebook.addNote(), OWL);
    await vi.advanceTimersByTimeAsync(5000);
    expect(api.notebookSayHeld).not.toHaveBeenCalled();
    answer!(0);
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(999);
    expect(api.notebookSayHeld).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(api.notebookSayHeld).toHaveBeenCalledTimes(1);
    expect(api.notebookSayHeld).toHaveBeenCalledWith([HASH]);
  });

  it('what the notes held when the notebook was read is not said', async () => {
    vi.useFakeTimers();
    const { theNotebook, Notebook } = await fresh();
    const before = new Notebook();
    const id = before.addNote();
    before.holdFile(OWL, null);
    before.addFigure(id, OWL);
    api.loaded = { state: Y.encodeStateAsUpdate(before.doc), updates: [] };
    const notebook = await theNotebook.open();
    await vi.advanceTimersByTimeAsync(5000);
    notebook.setName(id, 'Named');
    await vi.advanceTimersByTimeAsync(5000);
    expect(api.notebookSayHeld).not.toHaveBeenCalled();
  });

  it('a picture put into a note is said within the second, and not again while the notes hold the same', async () => {
    vi.useFakeTimers();
    const { theNotebook, Notebook } = await fresh();
    const notebook = await theNotebook.open();
    await vi.advanceTimersByTimeAsync(0);
    const id = notebook.addNote();
    notebook.addFigure(id, OWL);
    await vi.advanceTimersByTimeAsync(999);
    expect(api.notebookSayHeld).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(api.notebookSayHeld).toHaveBeenCalledTimes(1);
    expect(api.notebookSayHeld).toHaveBeenLastCalledWith([HASH]);
    // A second change that leaves the list as it was.
    notebook.setName(id, 'Named');
    await vi.advanceTimersByTimeAsync(5000);
    expect(api.notebookSayHeld).toHaveBeenCalledTimes(1);
    // What another window, or a round of the synchronization, wrote is said as what is written here.
    const other = new Notebook();
    const theirs = other.addNote();
    const plate = { hash: 'b'.repeat(64), name: 'plate.png', extension: 'png' };
    other.holdFile(plate, null);
    other.addFigure(theirs, plate);
    api.heard!(Y.encodeStateAsUpdate(other.doc));
    await vi.advanceTimersByTimeAsync(1000);
    expect(api.notebookSayHeld).toHaveBeenCalledTimes(2);
    expect(api.notebookSayHeld).toHaveBeenLastCalledWith([HASH, plate.hash]);
    // What was saved with the whole notebook is said already.
    notebook.deleteNotes([id]);
    await notebook.snapshot(true);
    expect(api.notebookSaveState).toHaveBeenLastCalledWith(expect.any(Uint8Array), {
      notes: 1,
      files: [plate.hash],
    });
    await vi.advanceTimersByTimeAsync(5000);
    expect(api.notebookSayHeld).toHaveBeenCalledTimes(2);
  });

  it('what could not be said of the files is said with the next change', async () => {
    vi.useFakeTimers();
    const { theNotebook } = await fresh();
    const notebook = await theNotebook.open();
    await vi.advanceTimersByTimeAsync(0);
    api.notebookSayHeld.mockRejectedValueOnce(new Error('no disk'));
    const id = notebook.addNote();
    notebook.addFigure(id, OWL);
    await vi.advanceTimersByTimeAsync(1000);
    expect(api.notebookSayHeld).toHaveBeenCalledTimes(1);
    notebook.setName(id, 'Named');
    await vi.advanceTimersByTimeAsync(1000);
    expect(api.notebookSayHeld).toHaveBeenCalledTimes(2);
    expect(api.notebookSayHeld).toHaveBeenLastCalledWith([HASH]);
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
    expect(api.notebookReadableWrite).toHaveBeenCalledTimes(1);
  });

  it('no readable copy is written where the window keeps none', async () => {
    const { theNotebook, finishBeforeClose } = await fresh();
    theNotebook.readable = false;
    const notebook = await theNotebook.open();
    notebook.addNote();
    expect(await finishBeforeClose()).toEqual([]);
    expect(api.notebookSaveState).toHaveBeenCalledTimes(1);
    expect(api.notebookReadableWrite).not.toHaveBeenCalled();
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
