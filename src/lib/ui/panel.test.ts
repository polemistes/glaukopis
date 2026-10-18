import { afterEach, describe, expect, it } from 'vitest';
import { belongs, Panel } from './panel';

/** An element drawn at a place, as jsdom draws none. */
function drawn(left: number, top: number, width: number, height: number): HTMLElement {
  const el = document.createElement('div');
  el.getBoundingClientRect = () =>
    ({ left, top, width, height, right: left + width, bottom: top + height }) as DOMRect;
  document.body.append(el);
  return el;
}

/** A panel of a width, placed again now that it has it. */
function opened(anchor: HTMLElement | (() => HTMLElement | null), beside?: HTMLElement | null) {
  const panel = new Panel(anchor, 'Table', 'table-panel', beside ?? null);
  Object.defineProperty(panel.el, 'offsetWidth', { value: 300 });
  Object.defineProperty(panel.el, 'offsetHeight', { value: 200 });
  panel.place();
  return panel;
}

afterEach(() => {
  document.body.replaceChildren();
});

describe('a panel beside something in the text', () => {
  // jsdom's window is 1024 by 768.
  it('stands to the right of what it is beside where there is room', () => {
    const table = drawn(100, 100, 400, 300);
    const panel = opened(table, table);
    expect(panel.el.dataset.side).toBe('right');
    expect(panel.el.style.left).toBe('512px');
    expect(panel.el.style.top).toBe('100px');
    expect(panel.el.getAttribute('role')).toBe('dialog');
    expect(panel.el.className).toBe('note-panel table-panel');
  });

  it('stands to the left where there is room only there', () => {
    const table = drawn(400, 100, 500, 300);
    expect(opened(table, table).el.dataset.side).toBe('left');
  });

  it('stands under what it belongs to where there is room at neither side', () => {
    const table = drawn(100, 100, 800, 300);
    const panel = opened(table, table);
    expect(panel.el.dataset.side).toBe('bottom');
    expect(panel.el.style.top).toBe('408px');
  });

  it('finds what it is beside anew, where that is drawn anew while it is open', () => {
    let table = drawn(100, 100, 800, 300);
    const panel = opened(() => table, null);
    expect(panel.el.dataset.side).toBe('bottom');
    table = drawn(100, 50, 800, 100);
    panel.place();
    expect(panel.el.style.top).toBe('158px');
  });

  it('is gone from the page when it is removed', () => {
    const panel = opened(drawn(0, 0, 10, 10));
    panel.remove();
    expect(panel.el.isConnected).toBe(false);
  });
});

describe('what a press outside an open panel may press without closing it', () => {
  it('is the panel, what it is of, and what lies over the page', () => {
    const panel = drawn(0, 0, 10, 10);
    const table = drawn(0, 0, 10, 10);
    const menu = drawn(0, 0, 10, 10);
    menu.className = 'menu';
    const item = document.createElement('span');
    menu.append(item);
    const elsewhere = drawn(0, 0, 10, 10);
    expect(belongs(panel, panel, table)).toBe(true);
    expect(belongs(table, panel, table)).toBe(true);
    expect(belongs(item, panel, null)).toBe(true);
    expect(belongs(elsewhere, panel, table)).toBe(false);
    expect(belongs(elsewhere, panel, undefined)).toBe(false);
  });
});
