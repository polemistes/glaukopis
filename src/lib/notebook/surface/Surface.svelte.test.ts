import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

// The surface is mounted and pressed, so with the browser's Svelte: the
// tests otherwise run with the server's, in which nothing is followed.
vi.mock(
  'svelte',
  // @ts-expect-error: the browser's Svelte, as a file, has no types of its own.
  () => import('../../../../node_modules/svelte/src/index-client.js'),
);
vi.mock(
  'svelte/reactivity',
  // @ts-expect-error: the same.
  () => import('../../../../node_modules/svelte/src/reactivity/index-client.js'),
);

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const { flushSync, mount, unmount } = await import('svelte');
const { Notebook } = await import('../model/notebook.svelte');
const { FIRST_BOX } = await import('../model/boxes');
const { menuState } = await import('$lib/ui/menu.svelte');
const { default: Surface } = await import('./Surface.svelte');

type NotebookType = InstanceType<typeof Notebook>;

// The viewport is a thousand pixels by eight hundred: jsdom lays nothing out.
beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
    configurable: true,
    get: () => 1000,
  });
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
    configurable: true,
    get: () => 800,
  });
});

let done: (() => void) | null = null;
afterEach(() => {
  done?.();
  done = null;
  menuState.current = null;
});

/**
 * The surface of the first box, looked at with the origin of the surface in
 * the middle of the viewport at the actual size: a point of the surface is
 * at (500 + x, 400 + y) in the window.
 */
function setUp(fill: (nb: NotebookType) => void) {
  const nb = new Notebook();
  fill(nb);
  nb.checkpoint();
  // Kept as the page keeps it, so that the surface follows what it is set to.
  let selection = $state<string[]>([]);
  const opened: string[] = [];
  const deleted: string[][] = [];
  const context: string[][] = [];
  const target = document.body.appendChild(document.createElement('div'));
  const surface = mount(Surface, {
    target,
    props: {
      notebook: nb,
      box: FIRST_BOX,
      get selection() {
        return selection;
      },
      set selection(value: string[]) {
        selection = value;
      },
      camera: { cx: 0, cy: 0, k: 1 },
      onopen: (id: string) => opened.push(id),
      ondelete: (ids: string[]) => deleted.push(ids),
      oncontext: (_e: MouseEvent, ids: string[]) => context.push(ids),
    },
  });
  flushSync();
  done = () => {
    unmount(surface);
    target.remove();
  };
  const viewport = target.querySelector<HTMLElement>('[data-surface]')!;
  return {
    nb,
    target,
    viewport,
    opened,
    deleted,
    context,
    selection: () => selection,
    card: (id: string) => target.querySelector<HTMLElement>(`[data-card="${id}"]`),
  };
}

function pointer(el: EventTarget, type: string, x: number, y: number, more: MouseEventInit = {}) {
  el.dispatchEvent(
    new MouseEvent(type, {
      bubbles: true,
      cancelable: true,
      clientX: x,
      clientY: y,
      button: 0,
      ...more,
    }),
  );
  flushSync();
}

function key(el: HTMLElement, k: string, more: KeyboardEventInit = {}) {
  el.dispatchEvent(
    new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...more }),
  );
  flushSync();
}

describe('the surface of a box', () => {
  it('shows the cards put, the notes not yet put in the strip, newest on top, and draws only what the view shows', () => {
    const s = setUp((nb) => {
      nb.addNote({ name: 'Owls', at: { x: 0, y: 0 }, made: '2026-01-01T00:00:00.000Z' });
      nb.addNote({ at: { x: 300, y: 0 }, made: '2026-01-02T00:00:00.000Z' });
      nb.addNote({ name: 'Far off', at: { x: 9000, y: 9000 }, made: '2026-01-03T00:00:00.000Z' });
      nb.addNote({ name: 'Older', made: '2026-01-04T00:00:00.000Z' });
      nb.addNote({ name: 'Newer', made: '2026-01-05T00:00:00.000Z' });
      nb.addNote({ name: 'Elsewhere', box: nb.addBox('Other'), made: '2026-01-06T00:00:00.000Z' });
    });
    const names = Array.from(s.target.querySelectorAll('[data-card]')).map((c) =>
      c.getAttribute('aria-label'),
    );
    expect(names).toEqual(['Owls', 'Empty note']);
    expect(s.target.querySelector('[data-card] .empty')?.textContent).toBe('Empty note');
    const strip = s.target.querySelector('[data-strip]')!;
    expect(strip.querySelector('.heading')?.textContent).toBe('Not yet placed');
    expect(
      Array.from(strip.querySelectorAll('[data-unplaced] .title')).map((t) => t.textContent),
    ).toEqual(['Newer', 'Older']);
    // A card is as wide as it was made, else as wide as usual.
    expect(s.card(s.nb.list.find((n) => n.name === 'Owls')!.id)!.style.width).toBe('280px');
  });

  it('shows no strip where every note is put', () => {
    const s = setUp((nb) => {
      nb.addNote({ name: 'Owls', at: { x: 0, y: 0 } });
    });
    expect(s.target.querySelector('[data-strip]')).toBeNull();
  });

  it('selects a card pressed, more with Ctrl, all with Ctrl+A, none with Escape', () => {
    let a = '';
    let b = '';
    const s = setUp((nb) => {
      a = nb.addNote({ name: 'A', at: { x: 0, y: 0 } });
      b = nb.addNote({ name: 'B', at: { x: 400, y: 0 } });
    });
    pointer(s.card(a)!, 'pointerdown', 510, 410);
    pointer(s.card(a)!, 'pointerup', 510, 410);
    expect(s.selection()).toEqual([a]);
    pointer(s.card(b)!, 'pointerdown', 910, 410, { ctrlKey: true });
    pointer(s.card(b)!, 'pointerup', 910, 410, { ctrlKey: true });
    expect(s.selection()).toEqual([a, b]);
    expect(s.card(b)!.classList.contains('selected')).toBe(true);
    key(s.viewport, 'Escape');
    expect(s.selection()).toEqual([]);
    key(s.viewport, 'a', { ctrlKey: true });
    expect(s.selection().sort()).toEqual([a, b].sort());
  });

  it('moves the cards selected together, in one step of undo', () => {
    let a = '';
    let b = '';
    const s = setUp((nb) => {
      a = nb.addNote({ name: 'A', at: { x: 0, y: 0 } });
      b = nb.addNote({ name: 'B', at: { x: 400, y: 0 } });
    });
    key(s.viewport, 'a', { ctrlKey: true });
    const card = s.card(a)!;
    pointer(card, 'pointerdown', 510, 410);
    pointer(card, 'pointermove', 530, 450);
    pointer(card, 'pointermove', 560, 470);
    // Shown where it goes, not kept until it is let go.
    expect(card.style.transform).toBe('translate(50px, 60px)');
    expect(s.nb.note(a)!.at).toEqual({ x: 0, y: 0 });
    pointer(card, 'pointerup', 560, 470);
    expect(s.nb.note(a)!.at).toEqual({ x: 50, y: 60 });
    expect(s.nb.note(b)!.at).toEqual({ x: 450, y: 60 });
    s.nb.undo();
    expect(s.nb.note(a)!.at).toEqual({ x: 0, y: 0 });
    expect(s.nb.note(b)!.at).toEqual({ x: 400, y: 0 });
  });

  it('makes a card wider by its right edge, kept when let go', () => {
    let a = '';
    const s = setUp((nb) => {
      a = nb.addNote({ name: 'A', at: { x: 0, y: 0 } });
    });
    const edge = s.card(a)!.querySelector('[data-card-edge]')!;
    pointer(edge, 'pointerdown', 780, 420);
    pointer(edge, 'pointermove', 900, 420);
    expect(s.card(a)!.style.width).toBe('400px');
    pointer(edge, 'pointerup', 900, 420);
    expect(s.nb.note(a)!.width).toBe(400);
  });

  it('links one card to another from its handle', () => {
    let a = '';
    let b = '';
    const s = setUp((nb) => {
      a = nb.addNote({ name: 'A', at: { x: 0, y: 0 } });
      b = nb.addNote({ name: 'B', at: { x: 400, y: 0 } });
    });
    const handle = s.card(a)!.querySelector('[data-link-handle]')!;
    pointer(handle, 'pointerdown', 640, 520);
    pointer(window, 'pointermove', 1000, 450);
    expect(s.target.querySelector('path.curve.pending')).not.toBeNull();
    pointer(window, 'pointerup', 1000, 450);
    expect(s.nb.links).toHaveLength(1);
    expect(s.nb.links[0]).toMatchObject({ from: a, to: b });
    expect(s.target.querySelectorAll('svg.lines g.association')).toHaveLength(1);
    // Selected, it is removed by Delete, one step of undo.
    key(s.viewport, 'Delete');
    expect(s.nb.links).toHaveLength(0);
    expect(s.deleted).toEqual([]);
    s.nb.undo();
    expect(s.nb.links).toHaveLength(1);
  });

  it('opens a note by two presses or Enter, and asks the page to delete with Delete', () => {
    let a = '';
    const s = setUp((nb) => {
      a = nb.addNote({ name: 'A', at: { x: 0, y: 0 } });
    });
    s.card(a)!.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    expect(s.opened).toEqual([a]);
    pointer(s.card(a)!, 'pointerdown', 510, 410);
    pointer(s.card(a)!, 'pointerup', 510, 410);
    key(s.viewport, 'Enter');
    expect(s.opened).toEqual([a, a]);
    key(s.viewport, 'Delete');
    expect(s.deleted).toEqual([[a]]);
  });

  it('moves the selection with the arrows to the nearest card that way', () => {
    let a = '';
    let b = '';
    let c = '';
    const s = setUp((nb) => {
      a = nb.addNote({ name: 'A', at: { x: 0, y: 0 } });
      b = nb.addNote({ name: 'B', at: { x: 400, y: 0 } });
      c = nb.addNote({ name: 'C', at: { x: 0, y: 300 } });
    });
    key(s.viewport, 'ArrowRight');
    expect(s.selection()).toHaveLength(1);
    s.card(a)!.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0 }));
    s.card(a)!.dispatchEvent(new MouseEvent('pointerup', { bubbles: true, button: 0 }));
    flushSync();
    key(s.viewport, 'ArrowRight');
    expect(s.selection()).toEqual([b]);
    key(s.viewport, 'ArrowLeft');
    key(s.viewport, 'ArrowDown');
    expect(s.selection()).toEqual([c]);
  });

  it('zooms with Ctrl and the wheel, and pans when the ground is dragged', () => {
    const s = setUp(() => {});
    const world = s.target.querySelector<HTMLElement>('.world')!;
    expect(world.style.transform).toBe('translate(500px, 400px) scale(1)');
    s.viewport.dispatchEvent(
      new WheelEvent('wheel', {
        deltaY: -60,
        ctrlKey: true,
        clientX: 500,
        clientY: 400,
        cancelable: true,
      }),
    );
    flushSync();
    expect(world.style.transform).toMatch(/scale\(1\.06/);
    pointer(s.viewport, 'pointerdown', 100, 100);
    pointer(window, 'pointermove', 150, 130);
    pointer(window, 'pointerup', 150, 130);
    expect(world.style.transform).toMatch(/^translate\(550px, 430px\)/);
  });

  it('makes a new note where the menu of the ground was opened, and opens it', () => {
    const s = setUp(() => {});
    s.viewport.dispatchEvent(
      new MouseEvent('contextmenu', {
        bubbles: true,
        cancelable: true,
        clientX: 600,
        clientY: 450,
      }),
    );
    flushSync();
    const items = menuState.current!.items as { label?: string; action?: () => void }[];
    expect(items.map((i) => i.label).filter(Boolean)).toEqual(['New note here', 'Show all']);
    items[0].action!();
    flushSync();
    const note = s.nb.list[0];
    expect(note.at).toEqual({ x: 100, y: 50 });
    expect(note.box).toBe(FIRST_BOX);
    expect(s.opened).toEqual([note.id]);
    expect(s.selection()).toEqual([note.id]);
  });

  it('gives the page the notes selected for its menu, selecting a card first that was not', () => {
    let a = '';
    let b = '';
    const s = setUp((nb) => {
      a = nb.addNote({ name: 'A', at: { x: 0, y: 0 } });
      b = nb.addNote({ name: 'B', at: { x: 400, y: 0 } });
    });
    s.card(b)!.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
    flushSync();
    expect(s.context).toEqual([[b]]);
    key(s.viewport, 'a', { ctrlKey: true });
    s.card(a)!.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
    expect(s.context[1].sort()).toEqual([a, b].sort());
  });
});
