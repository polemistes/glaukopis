/**
 * Where the works of the library are cited: which projects cite each. A
 * project says what it cites when it is saved (`ProjectInfo.cited`); one
 * that was last saved before it said so is read once, as the search through
 * everything reads projects, without its being opened.
 *
 * From the library, a project that cites a work is opened at its
 * references, with that work chosen and where it is cited shown.
 */

import type { ProjectInfo } from '$lib/api/projects';
import { everything } from '$lib/search/everything.svelte';
import { projects } from '$lib/state/projects.svelte';
import { router } from '$lib/state/router.svelte';

class Citing {
  /** Whether projects that did not say what they cite are being read. */
  reading = $state(false);

  /** The projects that cite a reference, as far as is known, in the order of the list of projects. */
  of(reference: string): ProjectInfo[] {
    return projects.list.filter((p) => p.cited?.includes(reference));
  }

  /** How many projects cite one or more of these references. */
  count(references: string[]): number {
    const asked = new Set(references);
    return projects.list.filter((p) => p.cited?.some((id) => asked.has(id))).length;
  }

  /** Reads the projects that did not say what they cite when they were last saved. */
  async fill(): Promise<void> {
    if (this.reading) return;
    this.reading = true;
    try {
      if (!projects.loaded) await projects.load();
      const unknown = projects.list.filter((p) => !p.cited && p.references > 0);
      for (const info of unknown) {
        try {
          const cited = await everything.citedIn(info);
          // A project saved meanwhile has said for itself.
          const now = projects.list.find((p) => p.id === info.id);
          if (now && !now.cited) projects.put({ ...now, cited });
        } catch (error) {
          console.error(`what ${info.name} cites could not be read`, error);
        }
      }
    } finally {
      this.reading = false;
    }
  }
}

export const citing = new Citing();

/** A reference to show at the references of a project when it opens. */
let waiting: { project: string; reference: string } | null = null;

/** Opens a project at its references, with where one of them is cited. */
export function showCitations(project: string, reference: string) {
  waiting = { project, reference };
  router.go({ view: 'project', project });
}

/** The reference to show when a project opens, if one waits for it. It is taken. */
export function takeCitations(project: string): string | null {
  const reference = waiting?.project === project ? waiting.reference : null;
  if (reference) waiting = null;
  return reference;
}
