/**
 * How the page of the notebook is looked at, kept on this computer as one
 * setting (`notebookView`): the box in view or all notes, the tags that are
 * on, each box as a list or as its surface with where its surface was
 * looked at, and how wide the column of the boxes, the list and the note
 * beside the surface are, each within the limits of a column.
 */
import { within, type Limits } from '$lib/library/columns.svelte';
import { settings, type NotebookViewSettings } from '$lib/state/settings.svelte';
import type { Camera } from '$lib/ui/camera';

export const COLUMN: Limits = { width: 200, min: 150, max: 400 };
export const LIST: Limits = { width: 320, min: 220, max: 640 };
export const NOTE: Limits = { width: 460, min: 320, max: 900 };

/** How a box is shown. */
export type BoxMode = 'surface' | 'list';

function current(): NotebookViewSettings {
  return settings.value.notebookView;
}

function change(c: Partial<NotebookViewSettings>) {
  settings.set('notebookView', { ...$state.snapshot(current()), ...c });
}

export const pageView = {
  /** The box in view as it was kept; null for all notes. */
  get box(): string | null {
    return current().box;
  },
  /** The tags that are on, as they were kept. */
  get tags(): string[] {
    return current().tags;
  },
  /** How a box is shown: as its surface, unless it was last shown as a list. */
  modeOf(box: string): BoxMode {
    return current().boxes[box]?.list ? 'list' : 'surface';
  },
  /** Where the surface of a box was looked at; none where it never was. */
  cameraOf(box: string): Camera | null {
    return current().boxes[box]?.camera ?? null;
  },

  setBox(box: string | null) {
    if (box !== current().box) change({ box });
  },
  setTags(tags: string[]) {
    change({ tags: [...tags] });
  },
  setMode(box: string, mode: BoxMode) {
    if (mode === this.modeOf(box)) return;
    const boxes = $state.snapshot(current().boxes);
    boxes[box] = { list: mode === 'list', camera: boxes[box]?.camera ?? null };
    change({ boxes });
  },
  setCamera(box: string, camera: Camera) {
    const was = current().boxes[box]?.camera;
    if (was && was.cx === camera.cx && was.cy === camera.cy && was.k === camera.k) return;
    const boxes = $state.snapshot(current().boxes);
    boxes[box] = { list: boxes[box]?.list ?? false, camera: { ...camera } };
    change({ boxes });
  },
  /** A box deleted: what was kept of it goes. */
  forget(box: string) {
    if (!(box in current().boxes)) return;
    const boxes = $state.snapshot(current().boxes);
    delete boxes[box];
    change({ boxes });
  },

  get column(): number {
    return within(current().column, 0, COLUMN);
  },
  get list(): number {
    return within(current().list, 0, LIST);
  },
  get note(): number {
    return within(current().note, 0, NOTE);
  },
  /** The column of the boxes after a drag: rightwards widens it. */
  moveColumn(dx: number) {
    change({ column: within(this.column, dx, COLUMN) });
  },
  /** The list after a drag: rightwards widens it. */
  moveList(dx: number) {
    change({ list: within(this.list, dx, LIST) });
  },
  /** The note beside the surface after a drag: leftwards widens it. */
  moveNote(dx: number) {
    change({ note: within(this.note, -dx, NOTE) });
  },
  resetColumn() {
    change({ column: COLUMN.width });
  },
  resetList() {
    change({ list: LIST.width });
  },
  resetNote() {
    change({ note: NOTE.width });
  },
};
