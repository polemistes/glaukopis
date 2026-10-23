/**
 * How the view of a project is laid out, and kept from one opening to the
 * next: which elements the panes show and how, what the panel at the side
 * shows, whether the outline and the preview stand beside the text, how the
 * room is shared, where each diagram was looked at, where each text was read,
 * which side had the focus and whether the sides were switched.
 */

import type { MapMode } from '$lib/state/router.svelte';
import type { Camera } from './diagram/camera';
import { PROJECT } from './model/types';
import type { SideKind } from './SideTabs.svelte';

export interface Pane {
  /** The element in view. */
  at: string;
  mode: MapMode;
  /**
   * Another project the pane shows, beside the one of the view: the second
   * pane only. None for the project of the view.
   */
  project?: string;
}

/** What a pane showing another project shows: its diagram or its text. */
export const guestMode = (mode: MapMode): MapMode => (mode === 'text' ? 'text' : 'diagram');

/** The elements there are, by id: `project.nodes` will do. */
export interface Elements {
  has(id: string): boolean;
}

/** How the room is shared between the parts of the view. Nought for what is given. */
export interface Sizes {
  /** The part of the width the first of two panes has. */
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
  /** By the element in view. */
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
  /**
   * The element at the top of the text of each pane, by its place among the
   * panes; none where the pane shows no text. An element, not a pixel: a
   * pixel does not hold across sizes of the window, fonts and edits.
   */
  tops?: (string | null)[];
  /** Which pane had the focus, by its place among the panes. */
  focused?: number;
  /** Whether the two sides were switched, the second shown at the left. */
  mirrored?: boolean;
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
  /** The element at the top of the text of each pane, where it shows the text. */
  tops: (string | null)[];
  /** The pane that has the focus. */
  focused: number;
  /** Whether the sides are switched: the second pane is drawn at the left. */
  mirrored: boolean;
}

/** Whether an element can be in view: the project itself always can, before its element has arrived. */
const inView = (elements: Elements, id: string | undefined): id is string =>
  !!id && (id === PROJECT || elements.has(id));

/**
 * The view as it was left, or as a project is first met. An element the
 * place in the application names is shown first, and then alone; where
 * nothing names one, the project itself. A view kept before the project
 * was one tree (ADR 0037) named maps, which are gone: it opens at the
 * project.
 */
export function arranged(
  elements: Elements,
  stored: StoredView,
  route: { at?: string; mode?: MapMode } | null,
): Layout {
  const known = (id: string | undefined) => (inView(elements, id) ? id : undefined);
  const first: Pane = {
    at: known(route?.at) ?? known(stored.panes?.[0]?.at) ?? PROJECT,
    mode: route?.mode ?? stored.panes?.[0]?.mode ?? 'diagram',
  };
  const panes = [first];
  const second = stored.panes?.[1];
  // Another project is opened beside as it was left: what is in view there is looked for when it is open.
  if (!route?.at && second?.project)
    panes.push({ at: second.at || PROJECT, mode: guestMode(second.mode), project: second.project });
  else if (!route?.at && second && known(second.at))
    panes.push({ at: second.at, mode: second.mode });
  // The text of a pane is read again where it was, while the pane shows the
  // element and the text it showed; an element of another project beside is
  // looked for there.
  const keptTops = Array.isArray(stored.tops) ? stored.tops : [];
  const tops = panes.map((pane, i) => {
    const was = stored.panes?.[i];
    const top = keptTops[i];
    if (typeof top !== 'string' || pane.mode !== 'text' || !was) return null;
    if (pane.at !== was.at || pane.mode !== was.mode) return null;
    return pane.project || inView(elements, top) ? top : null;
  });
  const focused =
    Number.isInteger(stored.focused) && stored.focused! > 0
      ? Math.min(stored.focused!, panes.length - 1)
      : 0;
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
    tops,
    focused,
    // One side has nothing to be switched with.
    mirrored: panes.length > 1 && stored.mirrored === true,
  };
}

/**
 * What is kept of a view: the cameras of elements that are there, and not
 * the changes, which are opened when asked for; the element at the top of
 * the text only of a pane that shows the text.
 */
export function toStore(layout: Layout, elements: Elements, folded: string[]): StoredView {
  const cameras: Record<string, Camera> = {};
  for (const [id, c] of Object.entries(layout.cameras)) {
    if (inView(elements, id)) cameras[id] = c;
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
    tops: layout.panes.map((pane, i) => {
      const top = layout.tops[i] ?? null;
      if (!top || pane.mode !== 'text') return null;
      return pane.project || inView(elements, top) ? top : null;
    }),
    focused: clamp(layout.focused, 0, Math.max(0, layout.panes.length - 1)),
    mirrored: layout.panes.length > 1 && layout.mirrored,
  };
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
