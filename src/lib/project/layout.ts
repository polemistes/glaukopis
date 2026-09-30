/**
 * How the view of a project is laid out, and kept from one opening to the
 * next: which maps the panes show and how, what the panel at the side shows,
 * whether the outline and the preview stand beside the text, how the room
 * is shared, and where each diagram was looked at.
 */

import type { MapMode } from '$lib/state/router.svelte';
import type { Camera } from './diagram/camera';
import type { MapRecord } from './model/types';
import type { SideKind } from './SideTabs.svelte';

export interface Pane {
  map: string;
  mode: MapMode;
}

/** How the room is shared between the parts of the view. Nought for what is given. */
export interface Sizes {
  /** The part of the width the first of two maps has. */
  split: number;
  preview: number;
  /** The panel at the side, whether it shows the references or the pictures. */
  references: number;
}

export const GIVEN: Sizes = { split: 0.5, preview: 0, references: 0 };

/** The view as it is kept with the project. */
export interface StoredView {
  sizes?: Partial<Sizes>;
  panes?: Pane[];
  cameras?: Record<string, Camera>;
  /** What the panel at the side shows; none where it is closed. */
  side?: SideKind | null;
  /** What it showed last, and shows when it is opened again. */
  lastSide?: SideKind;
  /** Whether the outline stands beside the text. */
  outline?: boolean;
  /** As the view was kept before the panel at the side had tabs. */
  references?: boolean;
  pictures?: boolean;
  history?: boolean;
  preview?: boolean;
  /** The elements under which the text is folded away. */
  folded?: string[];
}

/** The view as it is shown. */
export interface Layout {
  panes: Pane[];
  cameras: Record<string, Camera>;
  side: SideKind | null;
  lastSide: SideKind;
  outline: boolean;
  preview: boolean;
  sizes: Sizes;
}

/**
 * The view as it was left, or as a project is first met. A map the place in
 * the application names is shown first, and then alone.
 */
export function arranged(
  maps: MapRecord[],
  stored: StoredView,
  route: { map?: string; mode?: MapMode } | null,
): Layout {
  const known = (m: string | undefined) => (m && maps.some((x) => x.id === m) ? m : undefined);
  const first: Pane = {
    map: known(route?.map) ?? known(stored.panes?.[0]?.map) ?? maps[0].id,
    mode: route?.mode ?? stored.panes?.[0]?.mode ?? 'diagram',
  };
  const panes = [first];
  const second = stored.panes?.[1];
  if (!route?.map && second && known(second.map))
    panes.push({ map: second.map, mode: second.mode });
  // The changes are gone through when asked for, not when the project opens.
  const kept =
    stored.side !== undefined
      ? stored.side
      : stored.references
        ? 'references'
        : stored.pictures
          ? 'pictures'
          : stored.history
            ? 'history'
            : null;
  const side = kept === 'changes' ? null : kept;
  return {
    panes,
    cameras: stored.cameras ?? {},
    side,
    lastSide: stored.lastSide ?? side ?? 'references',
    outline: stored.outline ?? false,
    preview: stored.preview ?? false,
    sizes: { ...GIVEN, ...stored.sizes },
  };
}

/** What is kept of a view: the cameras of maps that are there, and not the changes, which are opened when asked for. */
export function toStore(layout: Layout, maps: MapRecord[], folded: string[]): StoredView {
  const cameras: Record<string, Camera> = {};
  for (const [id, c] of Object.entries(layout.cameras)) {
    if (maps.some((m) => m.id === id)) cameras[id] = c;
  }
  return {
    sizes: layout.sizes,
    panes: layout.panes,
    cameras,
    side: layout.side === 'changes' ? null : layout.side,
    lastSide: layout.lastSide,
    outline: layout.outline,
    preview: layout.preview,
    folded,
  };
}

/**
 * The panes without the maps that are gone: the first stays, with another
 * map where its own is gone. Nothing where none is gone.
 */
export function withoutGone(panes: Pane[], maps: MapRecord[]): Pane[] | null {
  if (!maps.length) return null;
  const there = (map: string) => maps.some((m) => m.id === map);
  let changed = false;
  const next = panes.filter((p, i) => {
    if (there(p.map)) return true;
    changed = true;
    return i === 0;
  });
  if (next[0] && !there(next[0].map)) {
    next[0] = { ...next[0], map: maps[0].id };
    changed = true;
  }
  return changed ? next : null;
}

export const clamp = (value: number, least: number, most: number) =>
  Math.min(Math.max(value, least), most);

/** The width of a panel at the side, dragged by so much, within what the room of the view allows. */
export function sideWidth(
  which: 'preview' | 'references',
  width: number,
  dx: number,
  room: number,
) {
  const least = which === 'preview' ? 320 : 240;
  const most = Math.max(least, which === 'preview' ? room * 0.7 : Math.min(640, room * 0.5));
  return clamp(width - dx, least, most);
}
