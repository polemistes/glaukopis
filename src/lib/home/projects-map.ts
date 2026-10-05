/**
 * A map of the projects (ADR 0031): a new project whose one map has the
 * folders as elements, nested as the folders are, and under each folder the
 * projects in it; or, when everything is wanted, under each project its
 * maps and under each map its whole tree of elements, names and texts.
 */

import * as Y from 'yjs';
import { projectLoad, type Folder, type ProjectInfo } from '$lib/api/projects';
import { Project } from '$lib/project/model/project.svelte';
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

/** A project as it is on disk, read and not written: nothing it holds is changed by reading it. */
async function read(info: ProjectInfo): Promise<Project> {
  await projects.closed(info.id);
  const loaded = await projectLoad(info.id);
  const source = new Project(null);
  source.load(loaded.state, loaded.updates);
  return source;
}

/**
 * Writes everything a project holds under an element of the new one: its
 * maps as elements, and under each the map's tree, with the names and texts
 * of the elements. The references the project carries come with it, so
 * that the citations in the texts find them.
 */
async function copyEverything(into: Project, under: string, info: ProjectInfo) {
  const source = await read(info);
  try {
    for (const map of source.maps) {
      const mapElement = into.addChild(under, { title: map.name });
      if (!mapElement) continue;
      const tree = source.tree(map.id);
      // The centre is the map itself: its text goes to the map's element.
      into.transact(() =>
        copyFragment(source.fragment(map.root, 'body'), into.fragment(mapElement, 'body')),
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
      for (const child of tree.children.get(map.root) ?? []) copy(child, mapElement);
      // Elements attached to nothing come last, with what is under them.
      for (const loose of tree.loose) copy(loose, mapElement);
    }
    for (const record of source.refs.values()) into.putReference(record);
  } finally {
    await source.close();
  }
}

export interface MapOptions {
  name: string;
  /** Under each project its maps and all their elements, not only its name. */
  everything: boolean;
  folders: Folder[];
  list: ProjectInfo[];
  /** Told the name of each project as it is read, when everything is wanted. */
  onprogress?: (name: string) => void;
}

/**
 * Makes the map in a new project, written to disk before this returns, and
 * says which project and which map to open.
 */
export async function makeProjectsMap(
  options: MapOptions,
): Promise<{ project: string; map: string }> {
  const made = await projects.create(options.name);
  const { project } = await openProject(made.id);
  const closing = (async () => {
    try {
      const mapId = project.maps[0].id;
      const centre = project.map(mapId)!.root;
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
      await write(outline(options.folders, options.list), centre);
      project.undoManager.clear();
      return mapId;
    } finally {
      await project.close();
    }
  })();
  projects.closing(made.id, closing);
  return { project: made.id, map: await closing };
}
