/**
 * A project that is not open, opened to be written in, and let go when what
 * was written is on disk: for elements sent or moved to it (ADR 0033).
 */

import { openProject, projects } from '$lib/state/projects.svelte';
import type { Project } from './model/project.svelte';

export interface Elsewhere {
  project: Project;
  close(): Promise<void>;
}

export async function openElsewhere(id: string): Promise<Elsewhere> {
  // A project that is being closed is opened when what was written in it is on disk.
  await projects.closed(id);
  // It is opened only to be written in: not the project last opened.
  const last = projects.lastOpened;
  const { project } = await openProject(id);
  projects.lastOpened = last;
  return { project, close: () => project.close() };
}

/**
 * Writes in a project that is not open: opens it, does what is to be done,
 * makes sure it is on disk, and lets it go. What reads it meanwhile waits.
 */
export async function writeElsewhere<T>(id: string, what: (project: Project) => T): Promise<T> {
  const there = await openElsewhere(id);
  const done = (async () => {
    try {
      const result = what(there.project);
      there.project.undoManager.clear();
      await there.project.flush();
      if (there.project.status === 'error') throw new Error(there.project.saveError ?? '');
      return result;
    } finally {
      await there.close();
    }
  })();
  projects.closing(id, done);
  return done;
}
