import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const inbox = vi.hoisted(() => ({ takeInbox: vi.fn(), noteOfThing: vi.fn() }));
vi.mock('./inbox', () => inbox);

const opened = vi.hoisted(() => ({ open: vi.fn(), current: null as unknown }));
vi.mock('$lib/notebook/open.svelte', () => ({ theNotebook: opened }));

const { answer, followAsked, readAsked, takeAsked } = await import('./asked');
const { phoneHooks } = await import('./hooks');
const { places } = await import('./places.svelte');
const { Notebook } = await import('$lib/notebook/model/notebook.svelte');

const leave = vi.fn();
const asked = vi.fn();

let notebook: InstanceType<typeof Notebook>;

/** What the inbox does as it is taken in: a note made of each thing, by the name of the thing. */
function takesIn(things: Record<string, string>) {
  inbox.noteOfThing.mockImplementation((thing: string) => things[thing]);
}

beforeEach(() => {
  vi.clearAllMocks();
  notebook = new Notebook();
  opened.open.mockResolvedValue(notebook);
  opened.current = notebook;
  inbox.takeInbox.mockResolvedValue(undefined);
  inbox.noteOfThing.mockReturnValue(undefined);
  window.glaukopisAndroid = { ground: () => {}, leave, asked, photographed: () => {} };
  places.begin();
});

afterEach(() => {
  delete window.glaukopisAndroid;
});

describe('what the Android part says was asked', () => {
  it('is read from a string of JSON', () => {
    expect(readAsked('{"arrived":["a","b"],"note":true}')).toEqual({
      arrived: ['a', 'b'],
      note: true,
    });
  });

  it('is read from the thing itself', () => {
    expect(readAsked({ arrived: ['a'], note: false })).toEqual({ arrived: ['a'], note: false });
  });

  it('leaves out what is not told', () => {
    expect(readAsked('{}')).toEqual({ arrived: [], note: false });
    expect(readAsked('{"arrived":["a"]}')).toEqual({ arrived: ['a'], note: false });
    expect(readAsked('{"note":true}')).toEqual({ arrived: [], note: true });
  });

  it('takes the strings of the list, and a note only where it says true', () => {
    expect(readAsked({ arrived: ['a', 1, null, {}, 'b'], note: 'true' })).toEqual({
      arrived: ['a', 'b'],
      note: false,
    });
    expect(readAsked({ arrived: 'a', note: 1 })).toEqual({ arrived: [], note: false });
  });

  it('is nothing asked where it is anything else', () => {
    for (const said of ['not json', '', '[1]', '"text"', '3', 'null', [], 3, true, null, undefined])
      expect(readAsked(said), String(said)).toEqual({ arrived: [], note: false });
  });
});

describe('answering what was asked', () => {
  it('takes the inbox in whatever was asked', async () => {
    await answer({ arrived: [], note: false });
    expect(inbox.takeInbox).toHaveBeenCalledTimes(1);
    expect(places.current).toEqual({ at: 'notes' });
  });

  it('makes a new note in the box that receives, with no tag, so that Back from it stays in the app', async () => {
    const box = notebook.addBox('Ideas');
    notebook.receiveIn(box);
    const before = notebook.list.length;
    await answer({ arrived: [], note: true });
    expect(notebook.list).toHaveLength(before + 1);
    const here = places.current;
    expect(here).toMatchObject({ at: 'note', fresh: true });
    if (here.at !== 'note') throw new Error('not a note');
    expect(notebook.note(here.note)).toMatchObject({ box, tags: [] });
    expect(leave).not.toHaveBeenCalled();
    places.back();
    expect(places.current).toEqual({ at: 'notes' });
    expect(leave).not.toHaveBeenCalled();
  });

  it('asks the Android part for the keyboard once a new note asked for is shown, since no touch brought it', async () => {
    vi.useFakeTimers();
    const keyboard = vi.fn();
    window.glaukopisAndroid = { ground: () => {}, leave, asked, photographed: () => {}, keyboard };
    try {
      await answer({ arrived: [], note: true });
      expect(keyboard).not.toHaveBeenCalled();
      vi.advanceTimersByTime(1000);
      expect(keyboard).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('makes the new note after the inbox was taken in, between two steps of undo', async () => {
    const order: string[] = [];
    inbox.takeInbox.mockImplementation(async () => order.push('taken'));
    const before = notebook.list.length;
    notebook.undoManager.clear();
    await answer({ arrived: [], note: true });
    expect(order).toEqual(['taken']);
    expect(notebook.list).toHaveLength(before + 1);
    // One step of its own: a change after it is not undone with it.
    notebook.addNote();
    notebook.undo();
    expect(notebook.list).toHaveLength(before + 1);
    notebook.undo();
    expect(notebook.list).toHaveLength(before);
  });

  it('makes no note where the notebook cannot be read', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    opened.open.mockRejectedValue(new Error('unreadable'));
    await answer({ arrived: [], note: true });
    expect(places.current).toEqual({ at: 'notes' });
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('shows the note of a thing that arrived, after the inbox was taken in, and without the keyboard', async () => {
    const note = notebook.addNote({ seen: false });
    const order: string[] = [];
    inbox.takeInbox.mockImplementation(async () => {
      order.push('taken');
      takesIn({ 'thing-a': note });
    });
    await answer({ arrived: ['thing-a'], note: false });
    expect(order).toEqual(['taken']);
    expect(places.current).toEqual({ at: 'note', note });
    // Back from it puts the app behind the others, the app shared from is in front again.
    places.back();
    expect(places.current).toEqual({ at: 'notes' });
    expect(leave).toHaveBeenCalledTimes(1);
  });

  it('shows the last of the things that arrived of which a note was made', async () => {
    const first = notebook.addNote();
    const second = notebook.addNote();
    takesIn({ 'thing-a': first, 'thing-b': second });
    await answer({ arrived: ['thing-a', 'thing-b', 'thing-none'], note: false });
    expect(places.current).toEqual({ at: 'note', note: second });
  });

  it('changes nothing where no note was made of the thing', async () => {
    await answer({ arrived: ['thing-none'], note: false });
    expect(places.current).toEqual({ at: 'notes' });
    expect(places.depth).toBe(1);
    expect(leave).not.toHaveBeenCalled();
  });

  it('changes nothing where the note made of the thing is not there any more', async () => {
    const gone = notebook.addNote();
    notebook.deleteNotes([gone]);
    takesIn({ 'thing-a': gone });
    await answer({ arrived: ['thing-a'], note: false });
    expect(places.current).toEqual({ at: 'notes' });
  });

  it('answers two things asked at once one after the other', async () => {
    let free: () => void = () => {};
    const note = notebook.addNote();
    inbox.takeInbox
      .mockImplementationOnce(() => new Promise<void>((resolve) => (free = resolve)))
      .mockResolvedValueOnce(undefined);
    takesIn({ 'thing-a': note });
    const first = answer({ arrived: [], note: true });
    const second = answer({ arrived: ['thing-a'], note: false });
    await vi.waitFor(() => expect(inbox.takeInbox).toHaveBeenCalledTimes(1));
    // The second waits for the first.
    expect(places.current).toEqual({ at: 'notes' });
    free();
    await Promise.all([first, second]);
    expect(inbox.takeInbox).toHaveBeenCalledTimes(2);
    expect(places.current).toEqual({ at: 'note', note });
    // The note asked for is under it, which the arrow then shows.
    places.up();
    expect(places.current).toMatchObject({ at: 'note', fresh: true });
  });

  it('is answered by a hook of the scripts as the Android part would ask it', async () => {
    const note = notebook.addNote();
    takesIn({ 'thing-a': note });
    await phoneHooks.asked({ arrived: ['thing-a'] });
    expect(places.current).toEqual({ at: 'note', note });
    await phoneHooks.asked({});
    expect(inbox.takeInbox).toHaveBeenCalledTimes(2);
  });
});

describe('asking the Android part', () => {
  it('answers what it says, which it forgets once told', async () => {
    const note = notebook.addNote();
    takesIn({ 'thing-a': note });
    asked.mockReturnValueOnce('{"arrived":["thing-a"]}').mockReturnValue('{}');
    await takeAsked();
    expect(places.current).toEqual({ at: 'note', note });
    await takeAsked();
    expect(inbox.takeInbox).toHaveBeenCalledTimes(2);
    expect(places.current).toEqual({ at: 'note', note });
  });

  it('takes the inbox in all the same where the Android part cannot be asked', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    asked.mockImplementation(() => {
      throw new Error('no answer');
    });
    await takeAsked();
    expect(inbox.takeInbox).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('answers nothing asked, and takes the inbox in, where there is no Android part', async () => {
    delete window.glaukopisAndroid;
    await takeAsked();
    expect(inbox.takeInbox).toHaveBeenCalledTimes(1);
    expect(places.current).toEqual({ at: 'notes' });
  });

  it('is asked when the Android part says something was asked, until the listening ends', async () => {
    asked.mockReturnValue('{}');
    const ends = followAsked();
    window.dispatchEvent(new Event('glaukopis-asked'));
    await vi.waitFor(() => expect(asked).toHaveBeenCalledTimes(1));
    ends();
    window.dispatchEvent(new Event('glaukopis-asked'));
    expect(asked).toHaveBeenCalledTimes(1);
  });
});
