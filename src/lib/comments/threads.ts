/**
 * The model's threads of comments, by their id, with an index by the
 * element they are on. What is shown of an element's comments (the marks
 * in its editor, the count on its box) asks for the threads of that one
 * element; read from the whole map it would depend on every thread of the
 * project, and be worked out again, sorted and drawn, for a note written in
 * any of them. The index keeps each element's threads sorted, in an array
 * that stays the same until one of that element's own threads changes, and
 * a reader of it depends on that element alone.
 */

import { SvelteMap } from 'svelte/reactivity';
import type { Thread } from '$lib/project/model/types';

/** What an element without threads has: always the same, so that nothing changes when nothing does. */
const NONE: readonly Thread[] = Object.freeze([]);

const oldestFirst = (a: Thread, b: Thread) =>
  (a.notes[0]?.created ?? '').localeCompare(b.notes[0]?.created ?? '');

export class ThreadMap extends SvelteMap<string, Thread> {
  /** The threads of each element, unsorted; not watched, only kept. */
  #of = new Map<string, Map<string, Thread>>();
  /** The threads of each element, sorted, the oldest first: what is read, and watched by element. */
  #sorted = new SvelteMap<string, readonly Thread[]>();

  override set(id: string, thread: Thread): this {
    // Read without being watched: the map is written from the observers of the shared document.
    const before = Map.prototype.get.call(this, id) as Thread | undefined;
    super.set(id, thread);
    if (before && before.element !== thread.element) this.#leave(before);
    let threads = this.#of.get(thread.element);
    if (!threads) this.#of.set(thread.element, (threads = new Map()));
    threads.set(id, thread);
    this.#sort(thread.element);
    return this;
  }

  override delete(id: string): boolean {
    const before = Map.prototype.get.call(this, id) as Thread | undefined;
    const had = super.delete(id);
    if (before) this.#leave(before);
    return had;
  }

  override clear() {
    super.clear();
    this.#of.clear();
    this.#sorted.clear();
  }

  /** The threads on an element, the oldest first; the same array until one of them changes. */
  on(element: string): readonly Thread[] {
    return this.#sorted.get(element) ?? NONE;
  }

  #leave(thread: Thread) {
    const threads = this.#of.get(thread.element);
    if (!threads?.delete(thread.id)) return;
    if (threads.size) this.#sort(thread.element);
    else {
      this.#of.delete(thread.element);
      this.#sorted.delete(thread.element);
    }
  }

  #sort(element: string) {
    const threads = this.#of.get(element);
    if (threads) this.#sorted.set(element, Object.freeze([...threads.values()].sort(oldestFirst)));
  }
}
