/**
 * The window's size and place on the screen, kept in the settings as the
 * window closes and given back before it is shown (ADR 0063). The
 * application keeps them itself rather than through Tauri's plugin for it,
 * which writes a file of its own outside the data folder.
 *
 * On a desktop that places windows itself, as a tiling one does, the size
 * and the place are the desktop's: what is asked for here is then only
 * asked, and nothing breaks.
 */

import {
  availableMonitors,
  LogicalPosition,
  LogicalSize,
  type Monitor,
  type Window,
} from '@tauri-apps/api/window';
import type { WindowPlace } from '$lib/api/system';

/** The least the window may be, as its configuration has it. */
const LEAST = { width: 480, height: 400 };

const finite = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);

/**
 * A place kept that can be given back, in whole pixels and no smaller than
 * the window may be; none where what was kept is not a place, as when the
 * settings were written by hand.
 */
export function usable(kept: unknown): WindowPlace | null {
  if (!kept || typeof kept !== 'object') return null;
  const { width, height, x, y, maximized } = kept as Record<string, unknown>;
  if (!finite(width) || !finite(height) || !finite(x) || !finite(y)) return null;
  return {
    width: Math.max(LEAST.width, Math.round(width)),
    height: Math.max(LEAST.height, Math.round(height)),
    x: Math.round(x),
    y: Math.round(y),
    maximized: maximized === true,
  };
}

/** A screen as it lies among the others, in logical pixels. */
export interface Screen {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Whether the window's corner would lie on one of the screens there are: a
 * screen it was on may be gone since, and a window put off every screen
 * cannot be found. A little inside the corner, so that a frame that stood a
 * pixel off the edge still counts.
 */
export function onAScreen(place: WindowPlace, screens: Screen[]): boolean {
  const x = place.x + 40;
  const y = place.y + 20;
  return screens.some((s) => x >= s.x && x < s.x + s.width && y >= s.y && y < s.y + s.height);
}

const asScreen = (m: Monitor): Screen => ({
  x: m.position.x / m.scaleFactor,
  y: m.position.y / m.scaleFactor,
  width: m.size.width / m.scaleFactor,
  height: m.size.height / m.scaleFactor,
});

/**
 * The window as it is now, to be kept. Maximised, it keeps the size and the
 * place it had before, so that it comes back to them when it is made smaller
 * again; minimised, what was kept before stays.
 */
export async function windowPlace(
  window: Window,
  before: WindowPlace | null,
): Promise<WindowPlace | null> {
  if (await window.isMinimized()) return before;
  const maximized = await window.isMaximized();
  const kept = usable(before);
  if (maximized && kept) return { ...kept, maximized };
  const factor = await window.scaleFactor();
  const size = (await window.innerSize()).toLogical(factor);
  const corner = (await window.outerPosition()).toLogical(factor);
  return usable({ width: size.width, height: size.height, x: corner.x, y: corner.y, maximized });
}

/**
 * Puts the window as it was kept, before it is shown: its size; its place,
 * where that is on a screen there is now; maximised, where it was.
 */
export async function placeWindow(window: Window, kept: unknown): Promise<void> {
  const place = usable(kept);
  if (!place) return;
  await window.setSize(new LogicalSize(place.width, place.height));
  const screens = await availableMonitors().then((all) => all.map(asScreen));
  if (onAScreen(place, screens)) await window.setPosition(new LogicalPosition(place.x, place.y));
  if (place.maximized) await window.maximize();
}
