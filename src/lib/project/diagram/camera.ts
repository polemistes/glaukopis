/**
 * The camera of a diagram: where the world of the map stands on the screen
 * (`x`, `y`, the place of its origin in the viewport) and how large (`k`);
 * and what is kept of it with the project, the point of the world in the
 * middle and the scale, so that it is the same in a window of another size.
 */

import type { Layout, Placed } from './layout';

/** Where the world stands on the screen, and how large. */
export interface View {
  x: number;
  y: number;
  k: number;
}

/** What is kept of a view: the point of the world in the middle, and the scale. */
export interface Camera {
  cx: number;
  cy: number;
  k: number;
}

export const MIN_ZOOM = 0.25;
export const MAX_ZOOM = 2.5;

/** The view with a point of the world in the middle of a viewport, at a scale. */
export function centred(camera: Camera, width: number, height: number): View {
  return { x: width / 2 - camera.cx * camera.k, y: height / 2 - camera.cy * camera.k, k: camera.k };
}

/** What is kept of a view in a viewport. */
export function kept(view: View, width: number, height: number): Camera {
  return {
    cx: Math.round((width / 2 - view.x) / view.k),
    cy: Math.round((height / 2 - view.y) / view.k),
    k: Math.round(view.k * 1000) / 1000,
  };
}

/** The view zoomed about a point of the viewport, which stays where it is. */
export function zoomedAt(view: View, px: number, py: number, k: number): View {
  const next = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, k));
  const wx = (px - view.x) / view.k;
  const wy = (py - view.y) / view.k;
  return { x: px - wx * next, y: py - wy * next, k: next };
}

/** The view that shows all of a map, and nothing larger than it is. */
export function fitting(bounds: Layout['bounds'], width: number, height: number): View {
  const w = bounds.right - bounds.left;
  const h = bounds.bottom - bounds.top;
  const k = Math.max(
    MIN_ZOOM,
    Math.min(1, (width - 120) / Math.max(w, 1), (height - 120) / Math.max(h, 1)),
  );
  return {
    x: width / 2 - ((bounds.left + bounds.right) / 2) * k,
    y: height / 2 - ((bounds.top + bounds.bottom) / 2) * k,
    k,
  };
}

/** The view moved as little as need be for an element to be in it; nothing where it is. */
export function bringing(
  view: View,
  p: Placed,
  width: number,
  height: number,
  margin = 60,
): View | null {
  const left = view.x + (p.x - p.w / 2) * view.k;
  const right = view.x + (p.x + p.w / 2) * view.k;
  const top = view.y + (p.y - p.h / 2) * view.k;
  const bottom = view.y + (p.y + p.h / 2) * view.k;
  let dx = 0;
  let dy = 0;
  if (left < margin) dx = margin - left;
  else if (right > width - margin) dx = width - margin - right;
  if (top < margin) dy = margin - top;
  else if (bottom > height - margin) dy = height - margin - bottom;
  return dx || dy ? { ...view, x: view.x + dx, y: view.y + dy } : null;
}

/** The view after the wheel: zoomed about the pointer with Ctrl held, and moved otherwise. */
export function wheeled(view: View, event: WheelEvent, px: number, py: number): View {
  if (event.ctrlKey || event.metaKey) {
    return zoomedAt(view, px, py, view.k * Math.exp(-event.deltaY * 0.0022));
  }
  const scale = event.deltaMode === 1 ? 32 : 1;
  return { ...view, x: view.x - event.deltaX * scale, y: view.y - event.deltaY * scale };
}
