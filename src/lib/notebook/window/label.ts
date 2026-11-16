/**
 * Which page a window shows: the window the shell labels `note` is the
 * window of a note (record 0109), whose page is `mount.ts`; every other is
 * the application's. Kept apart from the page itself, so that knowing
 * which loads neither.
 */

import { getCurrentWindow } from '@tauri-apps/api/window';
import { inTauri } from '$lib/api/backend';

/** The label the shell gives the window of a note (`NOTE_WINDOW` in `src-tauri/src/lib.rs`). */
export const NOTE_WINDOW = 'note';

/** Whether the page is that of the window of a note. */
export function isNoteWindow(): boolean {
  if (!inTauri) return false;
  try {
    return getCurrentWindow().label === NOTE_WINDOW;
  } catch {
    return false;
  }
}
