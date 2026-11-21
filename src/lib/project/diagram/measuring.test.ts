import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Measuring, type Measured } from './measuring';

/** An element of a size, as the page would have laid it out. */
function box(w: number, h: number): HTMLElement {
  const el = document.createElement('div');
  Object.defineProperty(el, 'offsetWidth', { get: () => w, configurable: true });
  Object.defineProperty(el, 'offsetHeight', { get: () => h, configurable: true });
  return el;
}

function resize(el: HTMLElement, w: number, h: number) {
  Object.defineProperty(el, 'offsetWidth', { get: () => w, configurable: true });
  Object.defineProperty(el, 'offsetHeight', { get: () => h, configurable: true });
}

/** What watches sizes, as the page has it: it says a change when the test does. */
class Watcher {
  static all: Watcher[] = [];
  watched = new Set<Element>();
  constructor(readonly heard: (entries: { target: Element }[]) => void) {
    Watcher.all.push(this);
  }
  observe(el: Element) {
    this.watched.add(el);
  }
  unobserve(el: Element) {
    this.watched.delete(el);
  }
  disconnect() {
    this.watched.clear();
  }
  changed(...els: Element[]) {
    this.heard(els.filter((el) => this.watched.has(el)).map((target) => ({ target })));
  }
}

const soon = () => Promise.resolve();

describe('the elements of a diagram measured', () => {
  let frames: (() => void)[] = [];
  const frame = () => {
    const run = frames;
    frames = [];
    for (const f of run) f();
  };

  beforeEach(() => {
    Watcher.all = [];
    frames = [];
    vi.stubGlobal('ResizeObserver', Watcher);
    vi.stubGlobal('requestAnimationFrame', (f: () => void) => frames.push(f));
    vi.stubGlobal('cancelAnimationFrame', (n: number) => void (frames[n - 1] = () => {}));
  });
  afterEach(() => vi.unstubAllGlobals());

  it('are told together, once what is being drawn is drawn, and not as each comes', async () => {
    const told: Measured[][] = [];
    const measuring = new Measuring((m) => told.push(m));
    measuring.watch('a', box(100, 30));
    measuring.watch('b', box(140, 30));
    measuring.watch('c', box(90, 52));
    // Nothing while the others are still being put on the page.
    expect(told).toEqual([]);
    await soon();
    expect(told).toEqual([
      [
        ['a', { w: 100, h: 30 }],
        ['b', { w: 140, h: 30 }],
        ['c', { w: 90, h: 52 }],
      ],
    ]);
  });

  it('are measured again together when sizes change, in the frame after', async () => {
    const told: Measured[][] = [];
    const measuring = new Measuring((m) => told.push(m));
    const a = box(100, 30);
    const b = box(140, 30);
    measuring.watch('a', a);
    measuring.watch('b', b);
    await soon();
    told.length = 0;

    resize(a, 120, 30);
    resize(b, 140, 48);
    Watcher.all[0].changed(a);
    Watcher.all[0].changed(b);
    expect(told).toEqual([]);
    frame();
    expect(told).toEqual([
      [
        ['a', { w: 120, h: 30 }],
        ['b', { w: 140, h: 48 }],
      ],
    ]);
  });

  it('say which have gone, with the others of the moment', async () => {
    const told: Measured[][] = [];
    const measuring = new Measuring((m) => told.push(m));
    const gone = measuring.watch('a', box(100, 30));
    measuring.watch('b', box(140, 30));
    await soon();
    told.length = 0;

    gone();
    measuring.watch('c', box(80, 30));
    await soon();
    expect(told).toEqual([
      [
        ['a', null],
        ['c', { w: 80, h: 30 }],
      ],
    ]);
  });

  it('keep an element that came in the place of another under the same name', async () => {
    const told: Measured[][] = [];
    const measuring = new Measuring((m) => told.push(m));
    const first = measuring.watch('a', box(100, 30));
    await soon();
    told.length = 0;

    // The new one comes before the old one goes.
    measuring.watch('a', box(160, 30));
    first();
    await soon();
    expect(told).toEqual([[['a', { w: 160, h: 30 }]]]);
  });

  it('tell nothing more once stopped', async () => {
    const told: Measured[][] = [];
    const measuring = new Measuring((m) => told.push(m));
    const a = box(100, 30);
    const gone = measuring.watch('a', a);
    await soon();
    told.length = 0;

    Watcher.all[0].changed(a);
    measuring.stop();
    gone();
    frame();
    await soon();
    expect(told).toEqual([]);
  });
});
