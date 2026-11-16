/**
 * Where the list of the chat stands (records 0092 and 0107): at its foot
 * while messages arrive there, if it was at its foot; at the first new
 * message when the chat comes to be shown; at one's own answer once it is
 * sent; and which of the new messages have been within what is shown, so
 * that a button can lead to the nearest of those that have not, and so that
 * the mark of a new message is taken off once it has been seen and others
 * have arrived after it: the mark is for the latest news and for what has
 * not been seen, not for everything that came while the chat was shown. The
 * panel holds one, gives it the element of the list, and tells it when the
 * messages and what is new change.
 */

import { tick } from 'svelte';
import { SvelteSet } from 'svelte/reactivity';
import { nearest, within, type Standing } from './reading';

/** Whether a list is at its foot, or near enough to it. */
const footOf = (el: HTMLElement) => el.scrollHeight - el.scrollTop - el.clientHeight < 24;

export class ListPlace {
  /** The element that scrolls: the panel binds it. */
  list = $state<HTMLElement>();
  /** How many new messages have not been within what is shown. */
  unseen = $state(0);
  /** The nearest of them, and whether it is above what is shown. */
  toNearest = $state<{ id: string; up: boolean } | null>(null);
  /** The new messages that are marked no more: seen, and others have arrived since. */
  readonly settled = new SvelteSet<string>();

  /** Whether the list was at its foot before the messages last changed. */
  #atFoot = true;
  /** Whether the list is to go to its foot when the messages are drawn: one's own message was sent. */
  #footNext = false;
  /** A message to bring into view when the messages are drawn: one's own answer, sent. */
  #bring: string | null = null;
  /** Whether the list has been placed since the chat came to be shown. */
  #placed = false;
  /** The new messages that have been within what is shown of the list. */
  readonly #seen = new Set<string>();
  #looking = 0;

  /** One's own message was sent: the list goes to its foot when it is drawn. */
  toFootNext() {
    this.#footNext = true;
  }

  /** One's own answer was sent: it is brought into view when it is drawn. */
  bringNext(id: string) {
    this.#bring = id;
  }

  /** The messages are about to be drawn anew: where the list stands now is noted, and it is placed after. */
  beforeDraw() {
    if (this.list) this.#atFoot = this.#footNext || footOf(this.list);
    this.#footNext = false;
    void tick().then(() => this.#afterDraw());
  }

  /**
   * What is new changed: where nothing is new, nothing is seen or settled
   * any more; where others have arrived, those seen before them are marked
   * no more. Then what is shown is looked at.
   */
  freshChanged(fresh: ReadonlySet<string>) {
    if (!fresh.size) {
      this.#seen.clear();
      this.settled.clear();
    } else {
      for (const id of this.#seen) if (fresh.has(id)) this.settled.add(id);
    }
    void tick().then(() => this.look());
  }

  /** Whether a new message is still marked as new. */
  marks(id: string): boolean {
    return !this.settled.has(id);
  }

  /** The list was scrolled: what is shown is looked at, once a frame. */
  onscroll = () => {
    if (this.#looking) return;
    this.#looking = requestAnimationFrame(() => {
      this.#looking = 0;
      this.look();
    });
  };

  /** Goes to the nearest new message not yet seen. */
  goToNew = () => {
    const el = this.toNearest && this.#elementOf(this.toNearest.id);
    if (!el) return;
    el.scrollIntoView?.({ block: 'center' });
    this.look();
  };

  /** Counts as seen the new messages within what is shown, and finds the nearest of those that are not. */
  look() {
    const list = this.list;
    if (!list) return;
    const view = list.getBoundingClientRect();
    const out: Standing[] = [];
    for (const el of list.querySelectorAll<HTMLElement>('[data-chat-new]')) {
      const id = el.dataset.chatMessage ?? '';
      if (!id || this.#seen.has(id)) continue;
      const at = el.getBoundingClientRect();
      if (within(at, view)) this.#seen.add(id);
      else out.push({ id, top: at.top, bottom: at.bottom });
    }
    this.unseen = out.length;
    this.toNearest = nearest(out, view);
  }

  /**
   * Once the messages are drawn: when the chat has come to be shown, the
   * first new message near the top, or else the foot; one's own answer
   * sent, into view; else the foot where the list was at its foot.
   */
  #afterDraw() {
    const list = this.list;
    if (!list) return;
    if (!this.#placed) {
      this.#placed = true;
      const first = list.querySelector<HTMLElement>('[data-chat-new]');
      if (first)
        list.scrollTop += first.getBoundingClientRect().top - list.getBoundingClientRect().top - 32;
      else list.scrollTop = list.scrollHeight;
    } else if (this.#bring) this.#elementOf(this.#bring)?.scrollIntoView?.({ block: 'nearest' });
    else if (this.#atFoot) list.scrollTop = list.scrollHeight;
    this.#bring = null;
    this.look();
  }

  /** The element of a message in the list. */
  #elementOf(id: string): HTMLElement | undefined {
    return [...(this.list?.querySelectorAll<HTMLElement>('[data-chat-message]') ?? [])].find(
      (el) => el.dataset.chatMessage === id,
    );
  }
}
