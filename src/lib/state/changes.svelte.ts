/**
 * The windows follow each other (ADR 0085): what one window writes, the
 * others read again. The core says which area changed, at every write of
 * its file; each is read again here a moment after the last of a run of
 * writes, since bringing something in writes many times. The window that
 * wrote reads it again too, which it does after its own writes anyway.
 *
 * What is read again here is what every window holds: the projects, the
 * library, the files, the settings, the own words of the interface. What a
 * pane holds of its own (the languages imported, the own words of spelling)
 * is read again by the pane, when `changes.counts` says so.
 */

import { onChanged, type Area } from '$lib/api/changes';
import { library } from './library.svelte';
import { files } from '$lib/files/store.svelte';
import { readOwnWords } from '$lib/words/own';
import { projects } from './projects.svelte';
import { settings } from './settings.svelte';

/** How long a run of writes to one area is waited out before it is read again. */
export const SETTLE_MS = 100;

class Changes {
  /** How many times each area was read again: a pane that holds something of its own reads it again when its count moves. */
  counts = $state<Record<Area, number>>({
    projects: 0,
    library: 0,
    files: 0,
    settings: 0,
    languages: 0,
    words: 0,
  });
  #timers = new Map<Area, ReturnType<typeof setTimeout>>();

  /** A change to an area was told: it is read again once the writes have settled. */
  heard(area: Area) {
    clearTimeout(this.#timers.get(area));
    this.#timers.set(
      area,
      setTimeout(() => {
        this.#timers.delete(area);
        void readAgain(area).catch((error) => console.warn(`${area} not read again`, error));
        this.counts[area]++;
      }, SETTLE_MS),
    );
  }
}

export const changes = new Changes();

/** Reads again what every window holds of an area. */
async function readAgain(area: Area) {
  switch (area) {
    case 'projects':
      // The list, its folders and favourites; and the trash, which is read where it is shown.
      projects.trashed++;
      return projects.load();
    case 'library':
      return library.loaded ? library.reload() : undefined;
    case 'files':
      return files.loaded ? files.reload() : undefined;
    case 'settings':
      return settings.reload();
    case 'words':
      return readOwnWords();
    case 'languages':
      return;
  }
}

/** Listens, for this window, for what changes on disk. Gives what ends the listening. */
export function followChanges(): Promise<() => void> {
  return onChanged((area) => changes.heard(area));
}
