import { listen } from '@tauri-apps/api/event';
import { inTauri } from './backend';

/** What the core says changed on disk (ADR 0085): what every window then reads again. */
export type Area = 'projects' | 'library' | 'files' | 'settings' | 'languages' | 'words';

/** Listens for what changed on disk, written by this window or another. Gives what ends the listening. */
export async function onChanged(heard: (area: Area) => void): Promise<() => void> {
  if (!inTauri) return () => {};
  return listen<Area>('changed', (e) => heard(e.payload));
}
