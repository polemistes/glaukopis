/**
 * The line over the notes (stage 2 of `docs/plans/an-app-for-android.md`):
 * there only where something waits or is wrong. Where the device is in no
 * home, and where the server is merely not reached with nothing waiting,
 * there is none. Pressed, it goes to the settings, where the section of the
 * synchronization says the rest.
 */

import type { SyncStatus } from '$lib/api/sync';

/** What the line says, as the name of its message; none where there is no line. */
export type LineWords = 'sync-refused' | 'sync-outdated' | 'phone-waiting' | 'phone-problem';

/** The line the status asks for; none where there is to be none. */
export function lineOf(status: SyncStatus | null): LineWords | null {
  if (!status || status.state === 'off') return null;
  if (status.state === 'refused') return 'sync-refused';
  // Stopped for a later form: the line says what is needed, in the owner's words.
  if (status.state === 'outdated') return 'sync-outdated';
  if (status.state === 'offline') return status.waiting ? 'phone-waiting' : null;
  if (status.problem) return 'phone-problem';
  return null;
}
