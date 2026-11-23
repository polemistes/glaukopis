import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { over } from '$lib/ui/over';
import { places } from './places.svelte';

/** A thing that lies over a place, as a sheet does: open while it has its step. */
function opened() {
  const thing = { open: true, closed: () => {} };
  thing.closed = places.step(() => {
    thing.open = false;
    thing.closed();
  });
  return thing;
}

const leave = vi.fn();

beforeEach(() => {
  leave.mockReset();
  window.glaukopisAndroid = { ground: () => {}, leave, asked: () => '{}', photographed: () => {} };
  places.begin();
});

afterEach(() => {
  delete window.glaukopisAndroid;
});

describe('the places of the phone', () => {
  it('begin at the notes, and tell dialogs to make steps', () => {
    expect(places.current).toEqual({ at: 'notes' });
    expect(places.depth).toBe(1);
    expect(over.opened).toBeTypeOf('function');
  });

  it('go, and Back goes back', () => {
    places.go({ at: 'note', note: 'n1' });
    expect(places.current).toEqual({ at: 'note', note: 'n1' });
    places.go({ at: 'settings' });
    expect(places.current).toEqual({ at: 'settings' });
    places.back();
    expect(places.current).toEqual({ at: 'note', note: 'n1' });
    places.back();
    expect(places.current).toEqual({ at: 'notes' });
    expect(leave).not.toHaveBeenCalled();
  });

  it('make no second step where the place shown is gone to again', () => {
    places.go({ at: 'settings' });
    places.go({ at: 'settings' });
    expect(places.depth).toBe(2);
    places.back();
    expect(places.current).toEqual({ at: 'notes' });
  });

  it('close a sheet at Back, and the place stays', () => {
    places.go({ at: 'note', note: 'n1' });
    const sheet = opened();
    places.back();
    expect(sheet.open).toBe(false);
    expect(places.current).toEqual({ at: 'note', note: 'n1' });
    places.back();
    expect(places.current).toEqual({ at: 'notes' });
  });

  it('have one step fewer when a sheet closed by itself', () => {
    const before = places.depth;
    const sheet = opened();
    expect(places.depth).toBe(before + 1);
    sheet.open = false;
    sheet.closed();
    expect(places.depth).toBe(before);
    // Told twice, it takes nothing more away.
    sheet.closed();
    expect(places.depth).toBe(before);
  });

  it('end at the place gone to when a sheet is closed and a place gone to at once', () => {
    const sheet = opened();
    sheet.closed();
    places.go({ at: 'note', note: 'n2' });
    expect(places.current).toEqual({ at: 'note', note: 'n2' });
    places.back();
    expect(places.current).toEqual({ at: 'notes' });
    // The other way round: the place first, the sheet's step taken out after.
    const other = opened();
    places.go({ at: 'note', note: 'n3' });
    other.closed();
    expect(places.current).toEqual({ at: 'note', note: 'n3' });
    places.back();
    expect(places.current).toEqual({ at: 'notes' });
    expect(places.depth).toBe(1);
  });

  it('close two sheets, one over the other, one at a time', () => {
    const under = opened();
    const upper = opened();
    places.back();
    expect(upper.open).toBe(false);
    expect(under.open).toBe(true);
    places.back();
    expect(under.open).toBe(false);
    expect(places.current).toEqual({ at: 'notes' });
    expect(leave).not.toHaveBeenCalled();
  });

  it('ask to leave at Back at the notes, and change nothing else', () => {
    places.back();
    expect(leave).toHaveBeenCalledTimes(1);
    expect(places.current).toEqual({ at: 'notes' });
    expect(places.depth).toBe(1);
  });

  it('show a place arrived at', () => {
    places.arrive({ at: 'note', note: 'shared' });
    expect(places.current).toEqual({ at: 'note', note: 'shared' });
    expect(places.depth).toBe(2);
  });

  it('show the place under one arrived at, and ask to leave once, at Back from it', () => {
    places.arrive({ at: 'note', note: 'shared' });
    places.back();
    expect(places.current).toEqual({ at: 'notes' });
    expect(leave).toHaveBeenCalledTimes(1);
    // The notes are the place now, and Back from them leaves as it always did.
    places.back();
    expect(leave).toHaveBeenCalledTimes(2);
  });

  it('show the place under one arrived at at the arrow, and not ask to leave', () => {
    places.go({ at: 'note', note: 'before' });
    places.arrive({ at: 'note', note: 'shared' });
    places.up();
    expect(places.current).toEqual({ at: 'note', note: 'before' });
    expect(leave).not.toHaveBeenCalled();
    places.up();
    expect(places.current).toEqual({ at: 'notes' });
    // At the notes the arrow does nothing, and never leaves the app.
    places.up();
    expect(places.current).toEqual({ at: 'notes' });
    expect(places.depth).toBe(1);
    expect(leave).not.toHaveBeenCalled();
  });

  it('go on from a place gone to by hand, which Back shows before it leaves the app', () => {
    places.go({ at: 'note', note: 'before' });
    places.arrive({ at: 'note', note: 'shared' });
    places.back();
    expect(places.current).toEqual({ at: 'note', note: 'before' });
    expect(leave).toHaveBeenCalledTimes(1);
    places.back();
    expect(places.current).toEqual({ at: 'notes' });
    expect(leave).toHaveBeenCalledTimes(1);
  });

  it('close a sheet that lies over the place when a place is arrived at', () => {
    places.go({ at: 'note', note: 'before' });
    const first = opened();
    const second = opened();
    places.arrive({ at: 'note', note: 'shared' });
    expect(first.open).toBe(false);
    expect(second.open).toBe(false);
    expect(places.current).toEqual({ at: 'note', note: 'shared' });
    expect(places.depth).toBe(3);
    places.up();
    expect(places.current).toEqual({ at: 'note', note: 'before' });
  });

  it('leave one step where a place is arrived at twice, and Back then shows the place from before', () => {
    places.arrive({ at: 'note', note: 'first' });
    places.arrive({ at: 'note', note: 'second' });
    expect(places.current).toEqual({ at: 'note', note: 'second' });
    expect(places.depth).toBe(2);
    places.back();
    expect(places.current).toEqual({ at: 'notes' });
    expect(leave).toHaveBeenCalledTimes(1);
  });

  it('leave a place arrived at with leaves false as any place is left', () => {
    places.arrive({ at: 'note', note: 'new', fresh: true }, false);
    expect(places.current).toEqual({ at: 'note', note: 'new', fresh: true });
    places.back();
    expect(places.current).toEqual({ at: 'notes' });
    expect(leave).not.toHaveBeenCalled();
  });

  it('close a sheet opened over a place arrived at at Back, and the place stays', () => {
    places.arrive({ at: 'note', note: 'shared' });
    const sheet = opened();
    places.back();
    expect(sheet.open).toBe(false);
    expect(places.current).toEqual({ at: 'note', note: 'shared' });
    expect(leave).not.toHaveBeenCalled();
    places.back();
    expect(places.current).toEqual({ at: 'notes' });
    expect(leave).toHaveBeenCalledTimes(1);
  });

  it('close a sheet at the arrow, as Back does, and the place stays', () => {
    places.arrive({ at: 'note', note: 'shared' });
    const sheet = opened();
    places.up();
    expect(sheet.open).toBe(false);
    expect(places.current).toEqual({ at: 'note', note: 'shared' });
    expect(leave).not.toHaveBeenCalled();
  });

  it('let a dialog make a step through what lies over the window', () => {
    let open = true;
    const closed = over.opened!(() => (open = false));
    places.back();
    expect(open).toBe(false);
    closed();
    expect(places.depth).toBe(1);
  });
});
