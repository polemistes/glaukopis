/** Brief messages at the foot of the window. */

export interface Toast {
  id: number;
  kind: 'info' | 'ok' | 'error';
  message: string;
  detail?: string;
  action?: { label: string; run: () => void };
}

class Toasts {
  list = $state<Toast[]>([]);
  #next = 1;

  show(toast: Omit<Toast, 'id'>, ms = 4500): number {
    const id = this.#next++;
    this.list.push({ id, ...toast });
    if (ms > 0) setTimeout(() => this.dismiss(id), ms);
    return id;
  }

  dismiss(id: number) {
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
