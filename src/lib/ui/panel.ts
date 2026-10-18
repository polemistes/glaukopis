/**
 * A panel beside something in the text, of the kind a note is written in:
 * the panels of a formula, of a figure and of a table. Where it stands, and
 * what a pointer pressed outside it may press without closing it, are said
 * here once: the panels of figures and of tables had each their own copy of
 * the same numbers and the same list of what lies over the page.
 */

import { place } from './floating';

/** An element, or how to find it where it may be drawn anew while the panel is open. */
export type Found = HTMLElement | (() => HTMLElement | null);

const found = (at: Found | null): HTMLElement | null => (typeof at === 'function' ? at() : at);

/** The room between the panel and what it stands beside, and what is kept clear of the window's edge. */
const BESIDE_GAP = 12;
const EDGE = 8;
/** The room between the panel and what it stands under. */
const UNDER_GAP = 8;

/**
 * What lies over the page and belongs to whatever panel is open: a popover
 * of a field in it, a menu, a dialog it opened and the backdrop of one.
 */
const OVER = '.popover, .menu, dialog, .backdrop';

/**
 * A panel beside something in the text. It stays beside what it belongs to
 * as it grows and shrinks itself.
 */
export class Panel {
  readonly el: HTMLElement;
  #anchor: Found;
  /** What the panel keeps clear of, when that is wider than what it belongs to. */
  #beside: Found | null;
  #watch: ResizeObserver | null = null;

  /**
   * With `beside`, the panel stands at the side of that, level with its
   * top, where there is room: so it stays where it is while what it belongs
   * to is made larger and smaller, and does not lie over it. Where there is
   * no room at either side, or no `beside`, it stands under `anchor`.
   */
  constructor(anchor: Found, label: string, kind: string, beside: Found | null = null) {
    this.#anchor = anchor;
    this.#beside = beside;
    this.el = document.createElement('div');
    this.el.className = `note-panel ${kind}`;
    this.el.setAttribute('role', 'dialog');
    this.el.setAttribute('aria-label', label);
    document.body.append(this.el);
    this.place();
    if (typeof ResizeObserver !== 'undefined') {
      this.#watch = new ResizeObserver(() => this.place());
      this.#watch.observe(this.el);
    }
  }

  place() {
    const wide = found(this.#beside)?.getBoundingClientRect();
    if (wide) {
      const needed = this.el.offsetWidth + BESIDE_GAP + EDGE;
      const right = window.innerWidth - wide.right >= needed;
      if (right || wide.left >= needed) {
        place(this.el, wide, { side: right ? 'right' : 'left', align: 'start', gap: BESIDE_GAP });
        return;
      }
    }
    const anchor = found(this.#anchor);
    if (!anchor) return;
    place(this.el, anchor.getBoundingClientRect(), {
      side: 'bottom',
      align: 'start',
      gap: UNDER_GAP,
    });
  }

  remove() {
    this.#watch?.disconnect();
    this.el.remove();
  }
}

/**
 * Whether a pointer that went down did so in something that belongs to an
 * open panel: in one of `within` (the panel, and what it is of), or in what
 * lies over the page. A press anywhere else closes the panel.
 */
export function belongs(target: Element, ...within: (Element | null | undefined)[]): boolean {
  if (within.some((el) => el?.contains(target))) return true;
  return !!target.closest(OVER);
}
