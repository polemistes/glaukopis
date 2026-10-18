/**
 * The pictures of a project that is shared are with the others as well: when
 * the connection is there, what either side lacks is sent and fetched. That
 * is an exchange with the server, and it is asked for only when it can find
 * something new: once the connection is synced, and again when the set of
 * pictures the project uses has changed, not on every change of an element.
 */

import type { Project } from './model/project.svelte';

/** The pictures a project uses, by their hashes, sorted, as one string. */
export function pictureSet(project: Project): string {
  return project
    .usedPictures()
    .map((p) => p.hash)
    .sort()
    .join(' ');
}

/** Says when the pictures of a shared project are to be synced. */
export class PictureSync {
  /** The set that was last synced, while the connection has stayed synced. */
  #last: string | null = null;

  /**
   * Whether to sync now, with the pictures the project uses and whether its
   * connection is synced: when the connection has become synced, and when
   * the set has changed since the last sync.
   */
  wanted(set: string, synced: boolean): boolean {
    if (!synced) {
      this.#last = null;
      return false;
    }
    if (set === this.#last) return false;
    this.#last = set;
    return true;
  }
}
