/**
 * What the comments ask of the view of a project: that the panel of
 * comments open at a thread, when its mark in the text or its card in the
 * diagram is pressed; or that a thread be begun, on an element or on the
 * passage that is selected.
 */

import type { Thread } from '$lib/project/model/types';

class CommentsUi {
  /** The thread the panel is to show, when it was asked for. */
  shown = $state<string | null>(null);
  /** A thread that is being begun: its element, and its passage where it is on one. */
  composing = $state<{ element: string; passage: Thread['passage'] } | null>(null);
  /** Rises each time the panel is asked to open: the view of the project follows it. */
  asked = $state(0);
  /** Whether the diagram shows every open thread as a card under its element. */
  cards = $state(false);
  /** The thread the pointer rests on in the panel, and its element: shown where they are, without going there. */
  hovered = $state<{ thread: string; element: string } | null>(null);
  /** The elements whose threads are shown as cards, one by one, from the mark on the element. */
  shownOn = $state<ReadonlySet<string>>(new Set());

  /** Shows the cards of an element, or hides them again. */
  toggleOn(element: string) {
    const next = new Set(this.shownOn);
    if (next.has(element)) next.delete(element);
    else next.add(element);
    this.shownOn = next;
  }

  /** Asks for a thread to be shown. */
  show(thread: string) {
    this.shown = thread;
    this.composing = null;
    this.asked++;
  }

  /** Asks for a thread to be begun. */
  begin(element: string, passage: Thread['passage'] = null) {
    this.composing = { element, passage };
    this.shown = null;
    this.asked++;
  }

  /** The panel has done what was asked. */
  done() {
    this.shown = null;
    this.composing = null;
  }
}

export const commentsUi = new CommentsUi();
