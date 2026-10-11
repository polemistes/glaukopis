/**
 * A map of the projects (ADR 0031): a new project that has the folders as
 * elements, nested as the folders are, and under each folder the projects
 * in it; or, when everything is wanted, under each project its trees and
 * under each tree its whole branch of elements, names and texts. Since a
 * project is one tree (ADR 0037), it is all under the new project's own
 * element.
 */

import * as Y from 'yjs';
import { projectLoad, type Folder, type ProjectInfo } from '$lib/api/projects';
import { Project } from '$lib/project/model/project.svelte';
import { PROJECT } from '$lib/project/model/types';
import { openProject, projects } from '$lib/state/projects.svelte';
import { byName, folderOf, parentOf } from './folders';

export interface Outline {
  kind: 'folder' | 'project';
  name: string;
  /** The description of a project, which becomes the text of its element. */
  text: string;
  project?: ProjectInfo;
  children: Outline[];
}

/** What the map will hold: the folders as they are nested, and in each its projects, by name. */
export function outline(folders: Folder[], list: ProjectInfo[]): Outline[] {
  const walk = (parent: string | null): Outline[] => {
    const out: Outline[] = folders
      .filter((f) => parentOf(folders, f) === parent)
      .sort(byName)
      .map((f) => ({ kind: 'folder', name: f.name, text: '', children: walk(f.id) }));
    for (const p of list.filter((p) => folderOf(folders, p) === parent).sort(byName)) {
      out.push({ kind: 'project', name: p.name, text: p.description, project: p, children: [] });
    }
    return out;
  };
  return walk(null);
}

/** Replaces what a name or a text holds by a copy of what another holds, marks, citations and all. */
function copyFragment(from: Y.XmlFragment | null, to: Y.XmlFragment | null) {
  if (!from || !to) return;
  const parts = from.toArray().map((part) => (part as Y.XmlElement | Y.XmlText).clone());
  if (to.length) to.delete(0, to.length);
  to.insert(0, parts);
}

/**
 * A project as it is on disk, read and not written: brought into one tree
 * as it is when opened (ADR 0037), which is not written back.
 */
async function read(info: ProjectInfo): Promise<Project> {
  await projects.closed(info.id);
  const loaded = await projectLoad(info.id);
  const source = new Project(null);
  source.load(loaded.state, loaded.updates);
  source.begin(info.name);
  return source;
}

/**
 * Writes everything a project holds under its element in the new one: the
 * text of its own element, and under it its trees, each with all under it,
 * with the names and texts of the elements. The references the project
 * carries come with it, so that the citations in the texts find them.
 */
async function copyEverything(into: Project, under: string, info: ProjectInfo) {
  const source = await read(info);
  try {
    const tree = source.tree();
    // The project's own text goes to its element, in place of its description.
    if (source.node(PROJECT)?.empty === false)
      into.transact(() =>
        copyFragment(source.fragment(PROJECT, 'body'), into.fragment(under, 'body')),
      );
    const copy = (from: string, parent: string) => {
      const made = into.addChild(parent);
      if (!made) return;
      into.transact(() => {
        copyFragment(source.fragment(from, 'title'), into.fragment(made, 'title'));
        copyFragment(source.fragment(from, 'body'), into.fragment(made, 'body'));
      });
      for (const child of tree.children.get(from) ?? []) copy(child, made);
    };
    for (const child of tree.children.get(PROJECT) ?? []) copy(child, under);
    for (const record of source.refs.values()) into.putReference(record);
  } finally {
    await source.close();
  }
}

export interface MapOptions {
  name: string;
  /** Under each project its trees and all their elements, not only its name. */
  everything: boolean;
  folders: Folder[];
  list: ProjectInfo[];
  /** Told the name of each project as it is read, when everything is wanted. */
  onprogress?: (name: string) => void;
}

/**
 * Makes the map in a new project, written to disk before this returns, and
 * says which project to open, and at which element: its own.
 */
export async function makeProjectsMap(
  options: MapOptions,
): Promise<{ project: string; at: string }> {
  const made = await projects.create(options.name);
  const { project } = await openProject(made.id);
  const closing = (async () => {
    try {
      const write = async (items: Outline[], under: string) => {
        for (const item of items) {
          const element = project.addChild(under, {
            title: item.name,
            body: item.text.trim() || undefined,
          });
          if (!element) continue;
          if (item.kind === 'folder') await write(item.children, element);
          else if (options.everything && item.project) {
            options.onprogress?.(item.name);
            await copyEverything(project, element, item.project);
          }
        }
      };
      await write(outline(options.folders, options.list), PROJECT);
      project.undoManager.clear();
      return PROJECT;
    } finally {
      await project.close();
    }
  })();
  projects.closing(made.id, closing);
  return { project: made.id, at: await closing };
}
