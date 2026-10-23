import { describe, expect, it } from 'vitest';
import { onAScreen, usable } from './window-place';

const place = { width: 1200, height: 800, x: 100, y: 50, maximized: false };

describe('the window as it was left', () => {
  it('is given back in whole pixels, never smaller than the window may be', () => {
    expect(usable(place)).toEqual(place);
    expect(usable({ ...place, width: 1200.4, x: -7.6, maximized: true })).toEqual({
      ...place,
      x: -8,
      maximized: true,
    });
    expect(usable({ ...place, width: 10, height: 10 })).toMatchObject({ width: 480, height: 400 });
  });

  it('is not given back where what was kept is not a place', () => {
    for (const kept of [
      null,
      undefined,
      'big',
      3,
      {},
      { ...place, x: 'left' },
      { ...place, y: NaN },
    ])
      expect(usable(kept), JSON.stringify(kept)).toBeNull();
    // Maximised only where it says so.
    expect(usable({ ...place, maximized: 'yes' })?.maximized).toBe(false);
  });

  it('is put where it was only where that is on a screen there is now', () => {
    const left = { x: 0, y: 0, width: 1920, height: 1080 };
    const right = { x: 1920, y: 0, width: 1280, height: 1024 };
    expect(onAScreen(place, [left])).toBe(true);
    // On the screen at the right, which was taken away.
    const there = { ...place, x: 2000 };
    expect(onAScreen(there, [left, right])).toBe(true);
    expect(onAScreen(there, [left])).toBe(false);
    // A frame that stood a little off the edge still counts; one far above it does not.
    expect(onAScreen({ ...place, x: -10, y: -5 }, [left])).toBe(true);
    expect(onAScreen({ ...place, y: -400 }, [left])).toBe(false);
    expect(onAScreen(place, [])).toBe(false);
  });
});
