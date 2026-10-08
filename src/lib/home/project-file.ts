/**
 * A project as one file (ADR 0036): a project saved as a `.glaukopis`
 * file, to be carried elsewhere; and a new project made of one, whose
 * works are resolved against the library first. The file is written and
 * read by the core (`projectfile.rs`); the document, which the core does
 * not read, is the interface's, here.
 */

import * as Y from 'yjs';
import { libraryGetMany } from '$lib/api/library';
import {
  projectDescribe,
  projectFileRead,
  projectFileReferences,
  projectFileSettle,
  projectFileWrite,
  projectLoad,
  projectSaveState,
  type FileChoice,
  type Finding,
  type FoundWork,
  type ProjectInfo,
} from '$lib/api/projects';
import { recordOf } from '$lib/editor/references.svelte';
import { TIDY } from '$lib/project/model/origins';
import { Project } from '$lib/project/model/project.svelte';
import {
  citedIds,
  citedRecords,
  keepRecords,
  rewriteReferences,
} from '$lib/project/model/rewrite-refs';
import { library } from '$lib/state/library.svelte';
import { projects } from '$lib/state/projects.svelte';

/** What the name of a project file ends in. */
export const ENDING = 'glaukopis';

/** A name a file may have on every system: what it may not hold becomes a space. */
export function fileName(name: string): string {
  // eslint-disable-next-line no-control-regex
  const clean = name
    .replace(/[\\/:*?"<>|\u0000-\u001f]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return `${clean.replace(/^\.+/, '') || 'project'}.${ENDING}`;
}

/** A name no project has: the one given, or it with a number, " (2)" and on. */
export function freeName(name: string, taken: Iterable<string>): string {
  const names = new Set([...taken].map((n) => n.trim().toLowerCase()));
  const wanted = name.replace(/\s+/g, ' ').trim();
  if (!names.has(wanted.toLowerCase())) return wanted;
  for (let n = 2; ; n++) {
    const numbered = `${wanted} (${n})`;
    if (!names.has(numbered.toLowerCase())) return numbered;
  }
}

/** What is chosen for a work where nothing is said; nothing for one that is not asked about. */
export function given(finding: Finding): FileChoice | null {
  switch (finding.kind) {
    case 'differs':
      return 'library';
    case 'alike':
      return finding.certainty === 'certain' ? 'cite' : 'another';
    default:
      return null;
  }
}

/** A project as it is on disk, read and not written. */
async function read(id: string): Promise<Project> {
  await projects.closed(id);
  const loaded = await projectLoad(id);
  const project = new Project(null);
  project.load(loaded.state, loaded.updates);
  return project;
}

/**
 * Writes a project as a file at `path`. What is written is the project as
 * it is on disk: one that is open is written there first (`flush`). The
 * works it cites are written as the library has them; those it lacks, as
 * the project has them.
 */
export async function writeProjectFile(
  info: ProjectInfo,
  path: string,
  flush?: () => Promise<void>,
): Promise<void> {
  await flush?.();
  const project = await read(info.id);
  try {
    const cited = [...citedIds(project)];
    // An entry that was merged into another is found under the other's id: the
    // project keeps its own record of it, which the library finds again.
    const known = cited.length ? await libraryGetMany(cited) : [];
    keepRecords(project, known.filter((r) => cited.includes(r.id)).map(recordOf));
    await projectFileWrite(
      path,
      {
        name: info.name,
        description: info.description,
        pictures: project.usedPictures().map((p) => p.hash),
        records: citedRecords(project),
      },
      Y.encodeStateAsUpdate(project.doc),
    );
  } finally {
    await project.close();
  }
}

/** What was made of a project file. */
export interface Made {
  info: ProjectInfo;
  /** How many works were added to the library. */
  added: number;
  /** How many pictures were added to the store. */
  pictures: number;
  /** What could not be done with the works, in words. */
  problems: string[];
}

/**
 * Makes a new project of a project file. Its pictures are taken into the
 * store; its works are compared with the library, and where something is
 * to be chosen, `ask` is asked, which gives the choices, or nothing to
 * make nothing. Where a work is to be cited by another id than in the
 * file, its citations are written anew. The project is on disk, and is
 * among the projects, when this returns.
 */
export async function makeFromFile(
  path: string,
  ask: (name: string, works: FoundWork[]) => Promise<Record<string, FileChoice> | null>,
): Promise<Made | null> {
  const file = await projectFileRead(path);
  const project = new Project(null);
  try {
    project.load(file.state, []);
    const name = freeName(
      file.manifest.name || project.name || path.replace(/^.*[\\/]/, '').replace(/\.[^.]*$/, ''),
      projects.list.map((p) => p.name),
    );
    const records = citedRecords(project);
    const found = records.length ? await projectFileReferences(records) : [];
    let choices: Record<string, FileChoice> = {};
    if (found.some((w) => given(w.finding))) {
      const chosen = await ask(name, found);
      if (!chosen) return null;
      choices = chosen;
    }
    const settlement = records.length ? await projectFileSettle(records, choices) : null;
    if (settlement)
      rewriteReferences(
        project,
        settlement.settled.map((s) => ({
          from: s.from,
          to: s.to,
          record: s.reference ? recordOf(s.reference) : null,
        })),
      );
    project.doc.transact(() => project.yMeta.set('name', name), TIDY);

    if (settlement && (settlement.added.length || settlement.changed.length)) void library.reload();

    const made = await projects.create(name);
    let info: ProjectInfo;
    try {
      info = await projectSaveState(made.id, Y.encodeStateAsUpdate(project.doc), project.summary());
      const description = file.manifest.description.trim();
      if (description) info = await projectDescribe(made.id, description);
    } catch (error) {
      // A project that holds nothing of the file is not left behind.
      await projects.remove(made.id).catch(() => {});
      throw error;
    }
    projects.put(info);
    return {
      info,
      added: settlement?.added.length ?? 0,
      pictures: file.pictures,
      problems: settlement?.problems ?? [],
    };
  } finally {
    await project.close();
  }
}
