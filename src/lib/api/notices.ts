import { listen } from '@tauri-apps/api/event';
import { call, inTauri } from './backend';

/**
 * What the core has to tell without having been asked, such as a file of
 * its own that could not be read and was set aside: each in words, the
 * oldest first. Taking them forgets them.
 */
export const noticesTake = () => call<string[]>('notices_take');

/** Listens for the core having something to tell. Gives what ends the listening. */
export async function onNotices(told: () => void): Promise<() => void> {
  if (!inTauri) return () => {};
  return listen('notices', () => told());
}
