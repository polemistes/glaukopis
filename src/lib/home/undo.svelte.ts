/**
 * The changes made to folders and projects on the home, kept while the
 * application runs, so that each can be undone and done again: a name, a
 * move, a making, a deletion. Each is said in a message at the foot of the
 * window, with a button that undoes it. Only the latest change is said: its
 * button undoes the latest, so a message of an earlier one would undo the
 * wrong thing; each takes the place of the one before. A change that cannot
 * be undone any more, because what it changed is gone, is said so, and
 * forgotten.
 */

import { t } from '$lib/i18n';
import { notify, notifyError, toasts, type Toast } from '$lib/ui/toast.svelte';

/**
 * Thrown by an undo or a redo that cannot be done now but may be later, as
 * one that would take away a project open in the window: nothing is done,
 * the change is kept to be undone again, and its message says why.
 */
export class NotNow extends Error {}

export interface HomeChange {
  /** What was done, as the message says it: “Iliad” was moved to Greek. */
  message: string;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
}

class HomeUndo {
  done = $state.raw<HomeChange[]>([]);
  undone = $state.raw<HomeChange[]>([]);
  /** One change at a time: a second press of Ctrl+Z waits for the first. */
  #busy: Promise<void> = Promise.resolve();
  /** The message that says the latest change, while it is shown. */
  #shown: number | null = null;

  #say(toast: Omit<Toast, 'id'>) {
    if (this.#shown !== null) toasts.dismiss(this.#shown);
    this.#shown = toasts.show(toast);
  }

  /**
   * Remembers a change that was just made, and says so, with a way back;
   * quietly, where the change is the arranging of a map, which a message
   * would only disturb. Undone, it is said either way.
   */
  remember(change: HomeChange, options: { quietly?: boolean } = {}) {
    this.done = [...this.done, change];
    this.undone = [];
    if (options.quietly) return;
    this.#say({
      kind: 'ok',
      message: change.message,
      action: { label: t('common-undo'), run: () => void this.undo() },
    });
  }

  undo(): Promise<void> {
    return this.#queue(async () => {
      const change = this.done[this.done.length - 1];
      if (!change) return;
      this.done = this.done.slice(0, -1);
      try {
        await change.undo();
      } catch (error) {
        if (error instanceof NotNow) {
          this.done = [...this.done, change];
          notify(error.message);
        } else notifyError(t('home-undo-failed'), error);
        return;
      }
      this.undone = [...this.undone, change];
      this.#say({
        kind: 'info',
        message: t('home-undone', { what: change.message }),
        action: { label: t('home-redo'), run: () => void this.redo() },
      });
    });
  }

  redo(): Promise<void> {
    return this.#queue(async () => {
      const change = this.undone[this.undone.length - 1];
      if (!change) return;
      this.undone = this.undone.slice(0, -1);
      try {
        await change.redo();
      } catch (error) {
        if (error instanceof NotNow) {
          this.undone = [...this.undone, change];
          notify(error.message);
        } else notifyError(t('home-undo-failed'), error);
        return;
      }
      this.done = [...this.done, change];
      this.#say({
        kind: 'ok',
        message: change.message,
        action: { label: t('common-undo'), run: () => void this.undo() },
      });
    });
  }

  #queue(step: () => Promise<void>): Promise<void> {
    const next = this.#busy.then(step);
    this.#busy = next.catch(() => {});
    return next;
  }
}

export const homeUndo = new HomeUndo();
