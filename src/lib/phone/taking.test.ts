import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NotebookFile } from '$lib/api/notebook';

const api = vi.hoisted(() => ({
  notebookTakePiece: vi.fn(),
  notebookTakeWhole: vi.fn(),
  notebookTakeDropped: vi.fn(),
}));
vi.mock('$lib/api/notebook', () => ({
  ...api,
  notebookTakeFiles: vi.fn(),
  notebookTakeImage: vi.fn(),
}));

const { MOST, PIECE, putTaken, takeFile } = await import('./taking');
const { Notebook } = await import('$lib/notebook/model/notebook.svelte');

/** What the core says of a file taken in, as the store keeps it. */
function taken(name: string, picture: boolean): NotebookFile {
  const file = {
    hash: 'a'.repeat(64),
    name,
    size: 10,
    width: null,
    alt: '',
  } as NotebookFile['file'];
  return {
    file,
    shown: picture ? file : null,
    time: null,
    taken: '2026-11-15T14:03:22',
    place: null,
  };
}

/** A file of these bytes, made of a few pieces that differ, so that a piece out of its order shows. */
function fileOf(size: number, name = 'plate.png'): File {
  const bytes = new Uint8Array(size);
  for (let i = 0; i < size; i++) bytes[i] = (i * 7 + (i >> 10)) & 0xff;
  return new File([bytes], name, { type: 'image/png' });
}

beforeEach(() => {
  vi.clearAllMocks();
  api.notebookTakePiece.mockResolvedValue(undefined);
  api.notebookTakeDropped.mockResolvedValue(undefined);
  api.notebookTakeWhole.mockResolvedValue(taken('plate.png', true));
});

describe('a file taken in, in pieces', () => {
  it('is sent as three pieces, in order, under one ticket, and then asked for whole', async () => {
    const file = fileOf(Math.round(2.5 * PIECE));
    const got = await takeFile(file);
    expect(got.file.name).toBe('plate.png');
    expect(api.notebookTakePiece).toHaveBeenCalledTimes(3);
    const calls = api.notebookTakePiece.mock.calls as [string, string, string][];
    const tickets = new Set(calls.map((c) => c[0]));
    expect(tickets.size).toBe(1);
    const [ticket] = [...tickets];
    expect(ticket).toMatch(/^[A-Za-z0-9]{1,64}$/);
    expect(calls.every((c) => c[1] === 'plate.png')).toBe(true);
    const sent = calls.map((c) => Buffer.from(c[2], 'base64'));
    expect(sent.map((p) => p.length)).toEqual([PIECE, PIECE, PIECE / 2]);
    // Put together in the order they were sent, they are the file.
    const whole = new Uint8Array(file.size);
    let at = 0;
    for (const piece of sent) {
      whole.set(piece, at);
      at += piece.length;
    }
    expect(Buffer.from(whole).equals(Buffer.from(await file.arrayBuffer()))).toBe(true);
    expect(api.notebookTakeWhole).toHaveBeenCalledTimes(1);
    expect(api.notebookTakeWhole).toHaveBeenCalledWith(ticket, 'plate.png');
    expect(api.notebookTakeDropped).not.toHaveBeenCalled();
  });

  it('is sent as one piece where it is smaller than one, and called file where it has no name', async () => {
    await takeFile(fileOf(1000, ''));
    expect(api.notebookTakePiece).toHaveBeenCalledTimes(1);
    expect(api.notebookTakePiece.mock.calls[0][1]).toBe('file');
    expect(api.notebookTakeWhole.mock.calls[0][1]).toBe('file');
  });

  it('is refused with its name alone where it is empty, before anything is sent', async () => {
    await expect(takeFile(new File([], 'nothing.txt'))).rejects.toThrow(/^nothing\.txt$/);
    expect(api.notebookTakePiece).not.toHaveBeenCalled();
    expect(api.notebookTakeWhole).not.toHaveBeenCalled();
    expect(api.notebookTakeDropped).not.toHaveBeenCalled();
  });

  it('is refused with words where it is larger than a note takes, before anything is sent', async () => {
    const film = { name: 'film.mov', size: MOST + 1, slice: vi.fn() } as unknown as File;
    await expect(takeFile(film)).rejects.toThrow('film.mov is larger than 50 MB');
    expect(film.slice).not.toHaveBeenCalled();
    expect(api.notebookTakePiece).not.toHaveBeenCalled();
    expect(api.notebookTakeDropped).not.toHaveBeenCalled();
  });

  it('is taken at the most the core takes', async () => {
    // Not read whole: only its size is asked of it, and what is sent is counted.
    const most = {
      name: 'big.bin',
      size: MOST,
      slice: () => ({ arrayBuffer: async () => new ArrayBuffer(8) }),
    } as unknown as File;
    await takeFile(most);
    expect(api.notebookTakePiece).toHaveBeenCalledTimes(MOST / PIECE);
    expect(api.notebookTakeWhole).toHaveBeenCalledTimes(1);
  });

  it('drops the ticket where a piece fails, and sends nothing more', async () => {
    api.notebookTakePiece
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('the store is full'));
    await expect(takeFile(fileOf(3 * PIECE))).rejects.toThrow('the store is full');
    expect(api.notebookTakePiece).toHaveBeenCalledTimes(2);
    expect(api.notebookTakeWhole).not.toHaveBeenCalled();
    expect(api.notebookTakeDropped).toHaveBeenCalledTimes(1);
    const [ticket] = api.notebookTakePiece.mock.calls[0];
    expect(api.notebookTakeDropped).toHaveBeenCalledWith(ticket);
  });

  it('drops the ticket where the whole cannot be taken, and passes the failure on', async () => {
    api.notebookTakeWhole.mockRejectedValueOnce(new Error('not a file'));
    await expect(takeFile(fileOf(100))).rejects.toThrow('not a file');
    expect(api.notebookTakeDropped).toHaveBeenCalledTimes(1);
  });

  it('is told of as it was where dropping the ticket fails too', async () => {
    api.notebookTakePiece.mockRejectedValueOnce(new Error('first'));
    api.notebookTakeDropped.mockRejectedValueOnce(new Error('second'));
    await expect(takeFile(fileOf(100))).rejects.toThrow('first');
  });
});

describe('a file taken in, put into a note', () => {
  it('is held with itself as its source, and a file that is no picture stands at the end of the note', () => {
    const notebook = new Notebook();
    const note = notebook.addNote();
    const file = taken('paper.pdf', false);
    expect(putTaken(notebook, note, file, null, false)).toBe(true);
    const held = notebook.files.get(file.file.hash);
    expect(held?.name).toBe('paper.pdf');
    expect(notebook.sources.get(held!.source!)).toMatchObject({
      sort: 'file',
      name: 'paper.pdf',
      taken: '2026-11-15T14:03:22',
    });
    expect(notebook.fragment(note)!.toString()).toContain('<file');
  });

  it('is a figure at the end of the note where the text is not there to put it in', () => {
    const notebook = new Notebook();
    const note = notebook.addNote();
    expect(putTaken(notebook, note, taken('plate.png', true), undefined, true)).toBe(true);
    expect(notebook.fragment(note)!.toString()).toContain('<figure');
  });

  it('is put in one step of undo, and undone with it', () => {
    const notebook = new Notebook();
    const note = notebook.addNote();
    notebook.undoManager.clear();
    putTaken(notebook, note, taken('paper.pdf', false), null, false);
    expect(notebook.fragment(note)!.toString()).toContain('<file');
    notebook.undo();
    expect(notebook.fragment(note)!.toString()).not.toContain('<file');
  });

  it('puts nothing where the note is gone meanwhile', () => {
    const notebook = new Notebook();
    const note = notebook.addNote();
    notebook.deleteNotes([note]);
    const file = taken('paper.pdf', false);
    expect(putTaken(notebook, note, file, null, false)).toBe(false);
    expect(notebook.files.has(file.file.hash)).toBe(false);
  });
});
