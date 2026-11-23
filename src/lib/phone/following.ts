/**
 * What changes on disk, as the phone's page takes it (the core's `changed`,
 * ADR 0085): a tenth of a second after the last of a run, the references
 * are read again where they were read, and the pictures that were not here
 * are tried again, since a round may have brought them. The other areas are
 * passed over: a phone has no projects, follows no setting of the writer's,
 * and lists no files of the library.
 */

import { onChanged, type Area } from '$lib/api/changes';
import { pictures } from '$lib/figures/pictures.svelte';
import { library } from '$lib/state/library.svelte';

/** How long after the last change of a run it is taken up. */
export const SETTLE_MS = 100;

/** What is done when an area has changed; none where it is passed over. */
function taken(area: Area): (() => Promise<void>) | null {
  switch (area) {
    case 'library':
      return () => (library.loaded ? library.reload() : Promise.resolve());
    case 'files':
      return () => pictures.again();
    default:
      return null;
  }
}

/** Follows what changes on disk; gives what ends the following. */
export function followChanges(): () => void {
  const timers = new Map<Area, ReturnType<typeof setTimeout>>();
  let stop: (() => void) | null = null;
  let stopped = false;
  onChanged((area) => {
    const take = taken(area);
    if (!take) return;
    clearTimeout(timers.get(area));
    timers.set(
      area,
      setTimeout(() => {
        timers.delete(area);
        take().catch((error) => console.warn(`What changed in ${area} was not taken up`, error));
      }, SETTLE_MS),
    );
  })
    .then((unlisten) => {
      if (stopped) unlisten();
      else stop = unlisten;
    })
    .catch((error) => console.warn('What changes on disk is not heard', error));
  return () => {
    stopped = true;
    stop?.();
    for (const timer of timers.values()) clearTimeout(timer);
    timers.clear();
  };
}
