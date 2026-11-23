/**
 * Whether the page is the phone's (`docs/plans/an-app-for-android.md`): the
 * window the shell labels `phone`, on Android and in `glaukopis --phone` on
 * a computer. Kept apart from the page itself, so that knowing which loads
 * nothing of it.
 */

import { getCurrentWindow } from '@tauri-apps/api/window';
import { inTauri } from '$lib/api/backend';

/** The label the shell gives the phone's window (`WINDOW` in `src-tauri/src/phone.rs`). */
export const PHONE_WINDOW = 'phone';

/** Whether the page is that of the phone. */
export function isPhone(): boolean {
  if (!inTauri) return false;
  try {
    return getCurrentWindow().label === PHONE_WINDOW;
  } catch {
    return false;
  }
}
