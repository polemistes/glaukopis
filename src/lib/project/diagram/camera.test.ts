import { describe, expect, it } from 'vitest';
import { bringing, centred, fitting, kept, MAX_ZOOM, MIN_ZOOM, zoomedAt } from './camera';
import type { Placed } from './layout';

describe('the camera of a diagram', () => {
  it('keeps the point in the middle and the scale, whatever the size of the window', () => {
    const view = centred({ cx: 100, cy: -40, k: 1.5 }, 800, 600);
    expect(kept(view, 800, 600)).toEqual({ cx: 100, cy: -40, k: 1.5 });
  });

  it('zooms about the pointer, which stays over the same point', () => {
    const view = { x: 50, y: 20, k: 1 };
    const world = { x: (300 - view.x) / view.k, y: (200 - view.y) / view.k };
    const zoomed = zoomedAt(view, 300, 200, 2);
    expect((300 - zoomed.x) / zoomed.k).toBeCloseTo(world.x);
    expect((200 - zoomed.y) / zoomed.k).toBeCloseTo(world.y);
    expect(zoomedAt(view, 0, 0, 100).k).toBe(MAX_ZOOM);
    expect(zoomedAt(view, 0, 0, 0.01).k).toBe(MIN_ZOOM);
  });

  it('shows all of a map, and nothing larger than it is', () => {
    const small = fitting({ left: -50, top: -20, right: 50, bottom: 20 }, 800, 600);
    expect(small.k).toBe(1);
    expect(small).toMatchObject({ x: 400, y: 300 });
    const large = fitting({ left: 0, top: 0, right: 1360, bottom: 400 }, 800, 600);
    expect(large.k).toBeCloseTo(0.5);
    // Never smaller than the camera goes.
    expect(fitting({ left: 0, top: 0, right: 30000, bottom: 400 }, 800, 600).k).toBe(MIN_ZOOM);
  });

  it('moves as little as need be for an element to be seen', () => {
    const view = { x: 0, y: 0, k: 1 };
    const at = (x: number, y: number) => ({ x, y, w: 100, h: 40 }) as Placed;
    expect(bringing(view, at(400, 300), 800, 600)).toBeNull();
    expect(bringing(view, at(20, 300), 800, 600)).toEqual({ x: 90, y: 0, k: 1 });
    expect(bringing(view, at(400, 590), 800, 600)).toEqual({ x: 0, y: -70, k: 1 });
  });
});
