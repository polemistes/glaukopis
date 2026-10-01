/**
 * Dragging within the application, by pointer events.
 *
 * The browser's own drag and drop is not used: in a Tauri window it conflicts
 * with files dropped from the desktop. Anything can be dragged by calling
 * `startDrag` from a `pointerdown` handler; anything can receive by
 * `use:dropTarget`.
 */

export interface DragPayload {
  /** What is dragged: 'references', 'elements', 'collection', … */
  kind: string;
  data: unknown;
  /** Shown beside the pointer. */
  label: string;
}

export interface DropEvent {
  payload: DragPayload;
  x: number;
  y: number;
  /** Ctrl or Alt was held: copy rather than move, where that has a meaning. */
  copy: boolean;
  /** Shift was held: the thing alone, without what is under it, where that has a meaning. */
  alone: boolean;
  target: HTMLElement;
}

export interface DropTargetOptions {
  accepts: string[] | ((payload: DragPayload) => boolean);
  ondrop: (event: DropEvent) => void;
  /** Called while something acceptable is over the target, and with null when it leaves. */
  onover?: (event: DropEvent | null) => void;
  disabled?: boolean;
  /** The target shows what is dragged itself; the label beside the pointer is not wanted over it. */
  quiet?: boolean | ((payload: DragPayload) => boolean);
}

class DragState {
  payload = $state<DragPayload | null>(null);
  x = $state(0);
  y = $state(0);
  copy = $state(false);
  alone = $state(false);
  /** Whether the pointer is over something that would take the drop. */
  welcome = $state(false);
  /** Whether the label beside the pointer is hidden. */
  quiet = $state(false);
}

export const drag = new DragState();

const targets = new Map<HTMLElement, DropTargetOptions>();
let over: HTMLElement | null = null;

function accepts(options: DropTargetOptions, payload: DragPayload): boolean {
  if (options.disabled) return false;
  return typeof options.accepts === 'function'
    ? options.accepts(payload)
    : options.accepts.includes(payload.kind);
}

function targetAt(x: number, y: number, payload: DragPayload): HTMLElement | null {
  let el = document.elementFromPoint(x, y) as HTMLElement | null;
  while (el) {
    const options = targets.get(el);
    if (options && accepts(options, payload)) return el;
    el = el.parentElement;
  }
  return null;
}

function eventFor(target: HTMLElement): DropEvent {
  return {
    payload: drag.payload!,
    x: drag.x,
    y: drag.y,
    copy: drag.copy,
    alone: drag.alone,
    target,
  };
}

function setOver(next: HTMLElement | null) {
  if (next === over) {
    if (over) targets.get(over)?.onover?.(eventFor(over));
    return;
  }
  if (over) {
    over.removeAttribute('data-drop-over');
    targets.get(over)?.onover?.(null);
  }
  over = next;
  if (over) {
    over.setAttribute('data-drop-over', 'true');
    targets.get(over)?.onover?.(eventFor(over));
  }
  drag.welcome = !!over;
  const options = over ? targets.get(over) : undefined;
  drag.quiet =
    !!options?.quiet &&
    !!drag.payload &&
    (typeof options.quiet === 'function' ? options.quiet(drag.payload) : true);
}

/**
 * Call from `pointerdown`. The drag begins once the pointer has moved a few
 * pixels, so that a click remains a click. `payload` is asked for at that
 * moment. Returns nothing; `onend` tells whether the drop was taken.
 */
export function startDrag(
  event: PointerEvent,
  payload: () => DragPayload | null,
  onend?: (dropped: boolean) => void,
) {
  if (event.button !== 0) return;
  const startX = event.clientX;
  const startY = event.clientY;
  let started = false;

  const move = (e: PointerEvent) => {
    if (!started) {
      if (Math.hypot(e.clientX - startX, e.clientY - startY) < 6) return;
      const p = payload();
      if (!p) {
        finish();
        return;
      }
      started = true;
      drag.payload = p;
      document.body.classList.add('dragging');
      window.getSelection()?.removeAllRanges();
    }
    drag.x = e.clientX;
    drag.y = e.clientY;
    drag.copy = e.ctrlKey || e.altKey;
    drag.alone = e.shiftKey;
    setOver(targetAt(e.clientX, e.clientY, drag.payload!));
    e.preventDefault();
  };

  const finish = () => {
    window.removeEventListener('pointermove', move, true);
    window.removeEventListener('pointerup', up, true);
    window.removeEventListener('pointercancel', cancel, true);
    window.removeEventListener('keydown', key, true);
    document.body.classList.remove('dragging');
  };

  const end = (dropped: boolean) => {
    const target = over;
    const p = drag.payload;
    let taken = false;
    if (dropped && target && p) {
      const e = eventFor(target);
      setOver(null);
      targets.get(target)?.ondrop(e);
      taken = true;
    } else {
      setOver(null);
    }
    drag.payload = null;
    drag.quiet = false;
    finish();
    if (started) {
      // The click that follows a drag must not act.
      const swallow = (e: MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
      };
      window.addEventListener('click', swallow, { capture: true, once: true });
      setTimeout(() => window.removeEventListener('click', swallow, true), 0);
      onend?.(taken);
    }
  };

  const up = () => end(true);
  const cancel = () => end(false);
  const key = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && started) {
      e.preventDefault();
      e.stopPropagation();
      end(false);
    }
  };

  window.addEventListener('pointermove', move, true);
  window.addEventListener('pointerup', up, true);
  window.addEventListener('pointercancel', cancel, true);
  window.addEventListener('keydown', key, true);
}

/**
 * What is dragged in from outside the application, such as files from the
 * desktop, is told of by the window and not by the pointer.
 */
export function outsideOver(payload: DragPayload, x: number, y: number) {
  drag.payload = payload;
  drag.x = x;
  drag.y = y;
  drag.copy = true;
  document.body.classList.add('dragging');
  setOver(targetAt(x, y, payload));
}

export function outsideLeave() {
  setOver(null);
  drag.payload = null;
  drag.quiet = false;
  document.body.classList.remove('dragging');
}

/** Returns whether something took what was dropped. */
export function outsideDrop(payload: DragPayload, x: number, y: number): boolean {
  outsideOver(payload, x, y);
  const target = over;
  const event = target ? eventFor(target) : null;
  outsideLeave();
  if (!target || !event) return false;
  targets.get(target)?.ondrop(event);
  return true;
}

export function dropTarget(node: HTMLElement, options: DropTargetOptions) {
  targets.set(node, options);
  return {
    update(next: DropTargetOptions) {
      targets.set(node, next);
    },
    destroy() {
      if (over === node) setOver(null);
      targets.delete(node);
    },
  };
}
