/** Placing a floating element (menu, popover, tooltip) beside an anchor. */

export type Side = 'top' | 'bottom' | 'left' | 'right';
export type Align = 'start' | 'center' | 'end';

export interface PlaceOptions {
  side?: Side;
  align?: Align;
  gap?: number;
  /** Distance kept from the edge of the window. */
  margin?: number;
}

export interface RectLike {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

export function pointRect(x: number, y: number): RectLike {
  return { left: x, top: y, right: x, bottom: y, width: 0, height: 0 };
}

/**
 * Positions `el` (which must be `position: fixed`) beside `anchor`, flipping
 * to the opposite side when there is no room, and keeping it in the window.
 */
export function place(el: HTMLElement, anchor: RectLike, options: PlaceOptions = {}): Side {
  const { side = 'bottom', align = 'center', gap = 6, margin = 8 } = options;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const w = el.offsetWidth;
  const h = el.offsetHeight;

  const room: Record<Side, number> = {
    top: anchor.top - gap - margin,
    bottom: vh - anchor.bottom - gap - margin,
    left: anchor.left - gap - margin,
    right: vw - anchor.right - gap - margin,
  };
  const opposite: Record<Side, Side> = {
    top: 'bottom',
    bottom: 'top',
    left: 'right',
    right: 'left',
  };
  const needed = side === 'top' || side === 'bottom' ? h : w;
  let chosen = side;
  if (room[side] < needed && room[opposite[side]] > room[side]) chosen = opposite[side];

  let x: number;
  let y: number;
  const along = (start: number, end: number, size: number) =>
    align === 'start' ? start : align === 'end' ? end - size : (start + end) / 2 - size / 2;

  if (chosen === 'top' || chosen === 'bottom') {
    x = along(anchor.left, anchor.right, w);
    y = chosen === 'bottom' ? anchor.bottom + gap : anchor.top - gap - h;
  } else {
    y = along(anchor.top, anchor.bottom, h);
    x = chosen === 'right' ? anchor.right + gap : anchor.left - gap - w;
  }

  x = Math.max(margin, Math.min(x, vw - w - margin));
  y = Math.max(margin, Math.min(y, vh - h - margin));
  el.style.left = `${Math.round(x)}px`;
  el.style.top = `${Math.round(y)}px`;
  el.dataset.side = chosen;
  return chosen;
}
