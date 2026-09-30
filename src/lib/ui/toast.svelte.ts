/** Brief messages at the foot of the window. */

export interface Toast {
  id: number;
  kind: 'info' | 'ok' | 'error';
  message: string;
  detail?: string;
  action?: { label: string; run: () => void };
  /** What else was told at the same time, a line each. */
  more?: string[];
}

/** Messages that come this close after one another are told as one. */
const TOGETHER_MS = 500;
/** The most that are shown at once; the oldest go first. */
const MOST = 4;

class Toasts {
  list = $state<Toast[]>([]);
  #next = 1;
  #timers = new Map<number, ReturnType<typeof setTimeout>>();
  #last: { id: number; at: number; until: number } | null = null;

  show(toast: Omit<Toast, 'id'>, ms = 4500): number {
    const now = Date.now();
    // What one thing that was done has to tell comes as one message, not a
    // pile of them: a message and those that come right after it, where none
    // asks for anything or tells of a failure.
    const last = this.#last && this.list.find((t) => t.id === this.#last!.id);
    if (
      last &&
      now - this.#last!.at < TOGETHER_MS &&
      toast.kind !== 'error' &&
      last.kind !== 'error' &&
      !toast.action &&
      !last.action
    ) {
      const line = toast.detail ? `${toast.message}: ${toast.detail}` : toast.message;
      last.more = [...(last.more ?? []), line];
      if (toast.kind === 'ok') last.kind = 'ok';
      this.#last!.at = now;
      // One that stays until it is dismissed goes on staying.
      if (ms > 0 && Number.isFinite(this.#last!.until))
        this.#dismissAt(last.id, Math.max(this.#last!.until, now + ms));
      return last.id;
    }
    const id = this.#next++;
    this.list.push({ id, ...toast });
    while (this.list.length > MOST) this.dismiss(this.list[0].id);
    this.#last = { id, at: now, until: ms > 0 ? now + ms : Infinity };
    if (ms > 0) this.#dismissAt(id, now + ms);
    return id;
  }

  #dismissAt(id: number, when: number) {
    clearTimeout(this.#timers.get(id));
    this.#timers.set(
      id,
      setTimeout(() => this.dismiss(id), when - Date.now()),
    );
    if (this.#last?.id === id) this.#last.until = when;
  }

  dismiss(id: number) {
    clearTimeout(this.#timers.get(id));
    this.#timers.delete(id);
    const i = this.list.findIndex((t) => t.id === id);
    if (i >= 0) this.list.splice(i, 1);
  }
}

export const toasts = new Toasts();

export function notify(message: string, detail?: string) {
  return toasts.show({ kind: 'info', message, detail });
}

export function notifyOk(message: string, detail?: string) {
  return toasts.show({ kind: 'ok', message, detail });
}

/** Reports a failure. Accepts anything that was thrown. */
export function notifyError(message: string, error?: unknown) {
  const detail = describeError(error);
  console.error(message, error);
  return toasts.show({ kind: 'error', message, detail }, 9000);
}

export function describeError(error: unknown): string | undefined {
  if (error == null) return undefined;
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && 'message' in error)
    return String((error as { message: unknown }).message);
  return String(error);
}
