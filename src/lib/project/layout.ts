/**
 * What a project keeps of how it was looked at, from one opening to the next
 * (ADR 0064): where each diagram was looked at, what is folded away in its
 * text, where the text of each element was read, how wide its outline
 * stands, and where it was left, the element and the way it was shown. What
 * the window shows, its sides and its panes, is the window's, kept with the
 * settings (`sides.svelte.ts`).
 */

import type { MapMode } from '$lib/state/router.svelte';
import type { Camera } from './diagram/camera';
import { PROJECT } from './model/types';

/** The elements there are, by id: `project.nodes` will do. */
export interface Elements {
  has(id: string): boolean;
}

/** Where a project was left: the element in view of the side that showed it last, and how. */
export interface Left {
  at: string;
  mode: MapMode;
}

/** What a project keeps of how it was looked at, as it is written with it. */
export interface StoredView {
  /** By the element in view. */
  cameras?: Record<string, Camera>;
  /** The elements under which the text is folded away. */
  folded?: string[];
  /**
   * The element at the top of the text of each element in view, by that
   * element. An element, not a pixel: a pixel does not hold across sizes of
   * the window, fonts and edits. Kept by the place of a pane before
   * 2026-10-23: such a list is passed over.
   */
  tops?: Record<string, string> | unknown[];
  outlineWidth?: number;
  /** Where the project was left. */
  at?: string;
  mode?: MapMode;
  /** As the view was kept before the sides were the window's: the first pane says where it was left. */
  panes?: { at?: string; mode?: MapMode }[];
}

/** What a project keeps of how it was looked at, as it is held while it is open. */
export interface Memory {
  cameras: Record<string, Camera>;
  tops: Record<string, string>;
  outlineWidth: number;
  left: Left | null;
}

export const OUTLINE_WIDTH = 240;
const MODES: readonly MapMode[] = ['diagram', 'text', 'timeline'];

/** Whether an element can be in view: the project itself always can, before its element has arrived. */
const inView = (elements: Elements, id: string | undefined): id is string =>
  !!id && (id === PROJECT || elements.has(id));

/** What was kept, read with care: what cannot be read is as a project first met. */
export function readMemory(stored: unknown): Memory {
  const s = (stored && typeof stored === 'object' ? stored : {}) as StoredView;
  const cameras: Record<string, Camera> = {};
  if (s.cameras && typeof s.cameras === 'object')
    for (const [id, c] of Object.entries(s.cameras))
      if (c && Number.isFinite(c.cx) && Number.isFinite(c.cy) && Number.isFinite(c.k))
        cameras[id] = c;
  const tops: Record<string, string> = {};
  if (s.tops && typeof s.tops === 'object' && !Array.isArray(s.tops))
    for (const [at, top] of Object.entries(s.tops)) if (typeof top === 'string') tops[at] = top;
  const at = typeof s.at === 'string' ? s.at : s.panes?.[0]?.at;
  const mode = MODES.includes(s.mode as MapMode) ? s.mode : s.panes?.[0]?.mode;
  return {
    cameras,
    tops,
    outlineWidth:
      typeof s.outlineWidth === 'number' && s.outlineWidth >= 160 && s.outlineWidth <= 520
        ? s.outlineWidth
        : OUTLINE_WIDTH,
    left: at ? { at, mode: MODES.includes(mode as MapMode) ? (mode as MapMode) : 'diagram' } : null,
  };
}

/** Where the project is to be shown, of what was kept: the element it was left at, where it is still there. */
export function leftAt(memory: Memory, elements: Elements): Left {
  const left = memory.left;
  return left && inView(elements, left.at) ? left : { at: PROJECT, mode: left?.mode ?? 'diagram' };
}

/** What is kept: the cameras and the tops of elements that are there, and the folds given. */
export function toStore(memory: Memory, elements: Elements, folded: string[]): StoredView {
  const cameras: Record<string, Camera> = {};
  for (const [id, c] of Object.entries(memory.cameras)) if (inView(elements, id)) cameras[id] = c;
  const tops: Record<string, string> = {};
  for (const [at, top] of Object.entries(memory.tops))
    if (inView(elements, at) && inView(elements, top)) tops[at] = top;
  return {
    cameras,
    folded,
    tops,
    outlineWidth: memory.outlineWidth,
    ...(memory.left && inView(elements, memory.left.at) ? memory.left : {}),
  };
}

export const clamp = (value: number, least: number, most: number) =>
  Math.min(Math.max(value, least), most);

/** The width of a pane beside the sides, dragged by so much, within what the room of the window allows. */
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
