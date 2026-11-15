import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// The view follows its viewport through effects, so with the browser's
// Svelte: the tests otherwise run with the server's, in which nothing is
// followed.
vi.mock(
  'svelte',
  // @ts-expect-error: the browser's Svelte, as a file, has no types of its own.
  () => import('../../../node_modules/svelte/src/index-client.js'),
);

const { flushSync } = await import('svelte');
const { PanZoom } = await import('./pan-zoom.svelte');
const { centred, kept, zoomedAt } = await import('./camera');
type Camera = import('./camera').Camera;

/** The ResizeObservers made, so that a test can say the size has changed. */
let observers: (() => void)[] = [];
class Resizes {
  #seen: () => void;
  constructor(seen: () => void) {
    this.#seen = seen;
    observers.push(() => this.#seen());
  }
  observe() {}
  disconnect() {}
}

/** A viewport of a size, at a place in the window: jsdom measures nothing, so it is told. */
function viewport(width: number, height: number, left = 100, top = 50) {
  const el = document.createElement('div');
  const size = { width, height };
  Object.defineProperty(el, 'clientWidth', { get: () => size.width });
  Object.defineProperty(el, 'clientHeight', { get: () => size.height });
  el.getBoundingClientRect = () =>
    ({
      left,
      top,
      right: left + size.width,
      bottom: top + size.height,
      width: size.width,
      height: size.height,
      x: left,
      y: top,
    }) as DOMRect;
  document.body.append(el);
  return { el, size };
}

let stops: (() => void)[] = [];

/** A view on a viewport, following it. */
function shown(
  el: HTMLElement,
  options: {
    camera?: Camera | null;
    oncamera?: (c: Camera) => void;
    wheel?: (e: WheelEvent) => boolean;
  } = {},
) {
  const view = new PanZoom({
    viewport: () => el,
    camera: () => options.camera,
    oncamera: options.oncamera,
    wheel: options.wheel,
  });
  stops.push($effect.root(() => view.follow()));
  flushSync();
  return view;
}

beforeEach(() => {
  observers = [];
  vi.stubGlobal('ResizeObserver', Resizes);
  vi.stubGlobal('requestAnimationFrame', (f: FrameRequestCallback) => {
    f(0);
    return 0;
  });
});

afterEach(() => {
  for (const stop of stops) stop();
  stops = [];
  vi.useRealTimers();
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
});

describe('a view that pans and zooms', () => {
  it('is placed where it was left, the first time its size is known', () => {
    const { el } = viewport(800, 600);
    const view = shown(el, { camera: { cx: 100, cy: -40, k: 1.5 } });
    expect(view.width).toBe(800);
    expect(view.height).toBe(600);
    expect(view.view).toEqual(centred({ cx: 100, cy: -40, k: 1.5 }, 800, 600));
    expect(view.transform).toBe(
      `translate(${view.view.x}px, ${view.view.y}px) scale(${view.view.k})`,
    );
  });

  it('puts the origin in the middle where it was never left', () => {
    const { el } = viewport(800, 600);
    expect(shown(el).view).toEqual({ x: 400, y: 300, k: 1 });
  });

  it('waits for a size before it is placed', () => {
    const { el, size } = viewport(0, 0);
    const view = shown(el, { camera: { cx: 10, cy: 20, k: 2 } });
    expect(view.view).toEqual({ x: 0, y: 0, k: 1 });
    size.width = 400;
    size.height = 300;
    for (const seen of observers) seen();
    flushSync();
    expect(view.view).toEqual(centred({ cx: 10, cy: 20, k: 2 }, 400, 300));
  });

  it('reckons between the window and the world', () => {
    const { el } = viewport(800, 600, 100, 50);
    const view = shown(el, { camera: { cx: 0, cy: 0, k: 2 } });
    // The middle of the viewport is the origin of the world.
    expect(view.toWorld(500, 350)).toEqual({ x: 0, y: 0 });
    expect(view.toWorld(520, 330)).toEqual({ x: 10, y: -10 });
    expect(view.screenRect({ x: 10, y: -10, w: 40, h: 20 })).toEqual({
      left: 480,
      top: 310,
      right: 560,
      bottom: 350,
      width: 80,
      height: 40,
    });
    expect(view.pointerInside(100, 50)).toBe(true);
    expect(view.pointerInside(99, 50)).toBe(false);
    expect(view.pointerInside(900, 650)).toBe(true);
    expect(view.pointerInside(901, 650)).toBe(false);
  });

  it('zooms about the middle, which stays over the same point of the world', () => {
    const { el } = viewport(800, 600);
    const view = shown(el, { camera: { cx: 30, cy: 40, k: 1 } });
    view.zoomBy(1.25);
    expect(view.view.k).toBe(1.25);
    const middle = view.toWorld(100 + 400, 50 + 300);
    expect(middle.x).toBeCloseTo(30);
    expect(middle.y).toBeCloseTo(40);
    view.zoomTo(1);
    expect(view.view.k).toBeCloseTo(1);
    expect(view.toWorld(500, 350).x).toBeCloseTo(30);
    view.zoomAt(100, 50, 2);
    expect(view.view).toEqual(zoomedAt(centred({ cx: 30, cy: 40, k: 1 }, 800, 600), 0, 0, 2));
  });

  it('keeps what was in the middle in the middle when the viewport changes its size', () => {
    const { el, size } = viewport(800, 600);
    const view = shown(el, { camera: { cx: 70, cy: -20, k: 1.5 } });
    size.width = 500;
    size.height = 900;
    for (const seen of observers) seen();
    flushSync();
    expect(view.width).toBe(500);
    expect(view.height).toBe(900);
    expect(kept(view.view, 500, 900)).toEqual({ cx: 70, cy: -20, k: 1.5 });
  });

  it('tells the camera to be kept a moment after it comes to rest, once', () => {
    vi.useFakeTimers();
    const told: Camera[] = [];
    const { el } = viewport(800, 600);
    const view = shown(el, { camera: { cx: 5, cy: 6, k: 1 }, oncamera: (c) => told.push(c) });
    vi.advanceTimersByTime(399);
    expect(told).toEqual([]);
    vi.advanceTimersByTime(1);
    expect(told).toEqual([{ cx: 5, cy: 6, k: 1 }]);

    view.zoomBy(2);
    flushSync();
    vi.advanceTimersByTime(200);
    view.zoomBy(0.5);
    flushSync();
    vi.advanceTimersByTime(399);
    expect(told).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(told).toHaveLength(2);
    expect(told[1].k).toBe(1);
  });

  it('tells nothing after it has gone', () => {
    vi.useFakeTimers();
    const told: Camera[] = [];
    const { el } = viewport(800, 600);
    shown(el, { oncamera: (c) => told.push(c) });
    for (const stop of stops) stop();
    stops = [];
    vi.advanceTimersByTime(1000);
    expect(told).toEqual([]);
  });

  it('shows all of a world, and brings a box into it', () => {
    const { el } = viewport(800, 600);
    const view = shown(el);
    view.fit({ left: -1000, top: -100, right: 1000, bottom: 100 });
    expect(view.view.k).toBeCloseTo(680 / 2000);
    expect(view.toWorld(500, 350).x).toBeCloseTo(0);

    view.zoomTo(1);
    const before = { ...view.view };
    view.bring({ x: 0, y: 0, w: 10, h: 10 });
    expect(view.view).toEqual(before);
    view.bring({ x: 1000, y: 0, w: 100, h: 40 });
    const r = view.screenRect({ x: 1000, y: 0, w: 100, h: 40 });
    expect(r.right).toBeLessThanOrEqual(100 + 800 - 60 + 0.001);
  });

  it('zooms with Ctrl and the wheel about the pointer, and moves without', () => {
    const { el } = viewport(800, 600);
    const view = shown(el);
    const turn = (init: WheelEventInit) => {
      const event = new WheelEvent('wheel', { bubbles: true, cancelable: true, ...init });
      el.dispatchEvent(event);
      return event;
    };
    const zoomed = turn({ deltaY: -60, ctrlKey: true, clientX: 300, clientY: 200 });
    expect(zoomed.defaultPrevented).toBe(true);
    expect(view.view.k).toBeCloseTo(Math.exp(0.06));
    const moved = { ...view.view };
    turn({ deltaX: 10, deltaY: 20 });
    expect(view.view).toEqual({ ...moved, x: moved.x - 10, y: moved.y - 20 });
  });

  it('lets the wheel be where the view says so', () => {
    const { el } = viewport(800, 600);
    let asked = 0;
    const view = shown(el, {
      wheel: () => {
        asked++;
        return false;
      },
    });
    const before = { ...view.view };
    const event = new WheelEvent('wheel', { deltaY: 30, bubbles: true, cancelable: true });
    el.dispatchEvent(event);
    expect(asked).toBe(1);
    expect(event.defaultPrevented).toBe(false);
    expect(view.view).toEqual(before);
  });

  it('drags the ground from a press, once the pointer has moved a few pixels', () => {
    const { el } = viewport(800, 600);
    const view = shown(el);
    const ends: boolean[] = [];
    const at = (type: string, x: number, y: number) =>
      new MouseEvent(type, { clientX: x, clientY: y, bubbles: true }) as PointerEvent;

    view.pan(at('pointerdown', 200, 200), (moved) => ends.push(moved));
    window.dispatchEvent(at('pointermove', 202, 201));
    expect(view.panning).toBe(false);
    expect(view.view).toEqual({ x: 400, y: 300, k: 1 });
    window.dispatchEvent(at('pointermove', 230, 180));
    expect(view.panning).toBe(true);
    expect(view.view).toEqual({ x: 430, y: 280, k: 1 });
    window.dispatchEvent(at('pointerup', 230, 180));
    expect(view.panning).toBe(false);
    expect(ends).toEqual([true]);

    view.pan(at('pointerdown', 200, 200), (moved) => ends.push(moved));
    window.dispatchEvent(at('pointerup', 201, 200));
    expect(ends).toEqual([true, false]);
    window.dispatchEvent(at('pointermove', 400, 400));
    expect(view.view).toEqual({ x: 430, y: 280, k: 1 });
  });
});
