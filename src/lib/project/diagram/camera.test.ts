import { describe, expect, it } from 'vitest';
import { bringing, centred, fitting, kept, MAX_ZOOM, MIN_ZOOM, wheeled, zoomedAt } from './camera';
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

  it('zooms a little for a notch of the wheel with Ctrl, and moves without', () => {
    const view = { x: 50, y: 20, k: 1 };
    const turn = (deltaY: number, more: Partial<WheelEvent> = {}) =>
      wheeled(
        view,
        { deltaX: 0, deltaY, deltaMode: 0, ctrlKey: true, ...more } as WheelEvent,
        300,
        200,
      );
    // A notch as the web view of Linux tells it: forty pixels, or sixty.
    expect(turn(-40).k).toBeCloseTo(1.041, 3);
    expect(turn(40).k).toBeCloseTo(0.961, 3);
    expect(turn(-60).k).toBeCloseTo(1.062, 3);
    // A notch told larger zooms no further; a touchpad's small turn as little as it is.
    expect(turn(-100).k).toBe(turn(-60).k);
    expect(turn(-1000).k).toBe(turn(-60).k);
    expect(turn(-2).k).toBeCloseTo(1.002, 3);
    // Lines are taken as pixels.
    expect(turn(-1, { deltaMode: 1 }).k).toBe(turn(-40).k);
    // About the pointer, which stays over the same point.
    const zoomed = turn(-60);
    expect((300 - zoomed.x) / zoomed.k).toBeCloseTo(250);
    expect((200 - zoomed.y) / zoomed.k).toBeCloseTo(180);
    // Without Ctrl the view moves, as large as it was.
    expect(turn(40, { ctrlKey: false, deltaX: 10 })).toEqual({ x: 40, y: -20, k: 1 });
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
