/**
 * A project as Org (ADR 0041, section 7): saved as its readable copy in a
 * folder the writer chooses, and a new project made of an Org file or of
 * the folder that holds one. The Org form is written and read here; the
 * core puts the folder together and reads it back, with the works cited
 * and the pictures beside it.
 */

import {
  projectReadableRead,
  projectReadableWrite,
  type FileChoice,
  type FoundWork,
  type ProjectInfo,
} from '$lib/api/projects';
import { gather } from '$lib/org/folder';
import { intoProject } from '$lib/org/of-project';
import { readProject } from '$lib/org/read';
import { writeProject } from '$lib/org/write';
import { Project } from '$lib/project/model/project.svelte';
import type { RefRecord } from '$lib/project/model/types';
import { projects } from '$lib/state/projects.svelte';
import { newId } from '$lib/util/id';
import { baseName, freeName, make, read, withLibraryRecords, type Made } from './project-file';

/** What the name of an Org file ends in. */
export const ORG_ENDING = 'org';

/**
 * Writes a project's readable copy into the folder `path`: its Org form,
 * the works it cites and the pictures it shows. What is written is the
 * project as it is on disk: one that is open is written there first
 * (`flush`). The works are written as the library has them.
 */
export async function writeOrgFolder(
  info: ProjectInfo,
  path: string,
  flush?: () => Promise<void>,
): Promise<void> {
  await flush?.();
  const project = await read(info);
  try {
    await withLibraryRecords(project);
    const { org, beside } = gather(project);
    await projectReadableWrite({ path }, beside, writeProject(org));
  } finally {
    await project.close();
  }
}

/**
 * Makes a new project of an Org file, or of the folder that holds
 * `project.org`, as a project file is made (`make`). The works beside it
 * are cited in the Org form by their keys; each is given an id of its
 * own here, by which the library finds it, takes it in or knows it as
 * one it has.
 */
export async function makeFromOrg(
  path: string,
  ask: (name: string, works: FoundWork[]) => Promise<Record<string, FileChoice> | null>,
): Promise<Made | null> {
  const got = await projectReadableRead(path);
  const references: RefRecord[] = got.records.map((r) => ({
    ...r,
    id: newId(),
    modified: '',
    authors: '',
    year: '',
    title: r.fields.title ?? '',
    container: '',
  }));
  const org = readProject(got.org, references);
  const project = new Project(null);
  try {
    intoProject(org, project);
    const folder = baseName(path.replace(/[\\/]project\.org$/i, '').replace(/[\\/]+$/, ''));
    const name = freeName(
      project.name || org.title || folder,
      projects.list.map((p) => p.name),
    );
    project.begin(name);
    return await make(project, name, '', got.pictures, ask);
  } finally {
    await project.close();
  }
}
