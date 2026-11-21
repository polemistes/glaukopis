/**
 * The sizes of the elements of a diagram as they are drawn: those that have
 * come, those whose size has changed and those that have gone are told
 * together, once the page has been drawn with them, and never one at a time.
 *
 * Together, since what is told lays the diagram out anew. Where each element
 * was measured as it was put on the page, the next one put there asked for
 * the layout, which was made anew for it: once for every element, each time
 * over all of them, so that the window stood still for minutes with a few
 * thousand. Measured together they also ask the page for its own layout
 * once, not once each.
 */

import type { Size } from './layout';

/** An element measured, or one that has gone. */
export type Measured = [id: string, size: Size | null];

const sizeOf = (el: HTMLElement): Size => ({ w: el.offsetWidth, h: el.offsetHeight });

export class Measuring {
  readonly #told: (measured: Measured[]) => void;
  #observer: ResizeObserver | null = null;
  /** What is watched, by the element each is. */
  #watched = new Map<string, HTMLElement>();
  /** Which element each of them is, for what says that a size has changed. */
  #ids = new WeakMap<Element, string>();
  /** The elements to be told of: those to measure, and those that have gone. */
  #waiting = new Set<string>();
  /** Whether what waits is told as soon as what is being done is done. */
  #soon = false;
  #frame = 0;
  #stopped = false;

  /** `told` is given all that is measured in one go, and those that went. */
  constructor(told: (measured: Measured[]) => void) {
    this.#told = told;
  }

  /**
   * Measures an element as soon as what is being drawn is drawn, and again
   * whenever its size changes, until the function returned is called, which
   * says that it has gone.
   */
  watch(id: string, el: HTMLElement): () => void {
    this.#watched.set(id, el);
    if (typeof ResizeObserver === 'function') {
      this.#observer ??= new ResizeObserver((entries) => {
        for (const entry of entries) {
          const id = this.#ids.get(entry.target);
          if (id !== undefined && this.#watched.get(id) === entry.target) this.#waiting.add(id);
        }
        // Not before the page is drawn as it is now: what is read then is what is seen.
        cancelAnimationFrame(this.#frame);
        this.#frame = requestAnimationFrame(() => this.#tell());
      });
      this.#ids.set(el, id);
      this.#observer.observe(el);
    }
    this.#later(id);
    return () => {
      this.#observer?.unobserve(el);
      // Another may have come in its place meanwhile, under the same id: that one stays.
      if (this.#watched.get(id) !== el) return;
      this.#watched.delete(id);
      this.#later(id);
    };
  }

  /** An element is told of when what is being done now is done, with all the others of then. */
  #later(id: string) {
    if (this.#stopped) return;
    this.#waiting.add(id);
    if (this.#soon) return;
    this.#soon = true;
    queueMicrotask(() => {
      this.#soon = false;
      this.#tell();
    });
  }

  /** Every element is measured before anything is told, so that the page is laid out once for them all. */
  #tell() {
    if (this.#stopped || !this.#waiting.size) return;
    const measured: Measured[] = [];
    for (const id of this.#waiting) {
      const el = this.#watched.get(id);
      measured.push([id, el ? sizeOf(el) : null]);
    }
    this.#waiting.clear();
    this.#told(measured);
  }

  /** Nothing more is measured or told. */
  stop() {
    this.#stopped = true;
    cancelAnimationFrame(this.#frame);
    this.#observer?.disconnect();
    this.#observer = null;
    this.#watched.clear();
    this.#waiting.clear();
  }
}
