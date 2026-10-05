/**
 * The list of all projects, in folders (ADR 0031): the rows it shows, one
 * for each folder that is open and each project, in the order they stand.
 * Pure, so that it can be tested without the interface.
 */

import type { Folder, ProjectInfo } from '$lib/api/projects';

export interface FolderRow {
  kind: 'folder';
  folder: Folder;
  depth: number;
  /** The projects in it, and in the folders under it. */
  projects: number;
  /** Whether its folders and projects are shown under it. */
  open: boolean;
  /** Whether anything lies in it. */
  holds: boolean;
}

export interface ProjectRow {
  kind: 'project';
  project: ProjectInfo;
  depth: number;
}

export type Row = FolderRow | ProjectRow;

const collator = new Intl.Collator(undefined, { sensitivity: 'base', numeric: true });

export const byName = (a: { name: string }, b: { name: string }) =>
  collator.compare(a.name, b.name);

/** The parent of a folder, where that is a folder that exists; else the top. */
export function parentOf(folders: Folder[], folder: Folder): string | null {
  const parent = folder.parent ?? null;
  return parent && folders.some((f) => f.id === parent) ? parent : null;
}

/** The folder a project is in, where that is a folder that exists; else none. */
export function folderOf(folders: Folder[], project: ProjectInfo): string | null {
  const folder = project.folder ?? null;
  return folder && folders.some((f) => f.id === folder) ? folder : null;
}

/** The folder and every folder under it, by id. */
export function descendants(folders: Folder[], id: string): Set<string> {
  const out = new Set<string>([id]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const f of folders) {
      const parent = f.parent ?? null;
      if (parent && out.has(parent) && !out.has(f.id)) {
        out.add(f.id);
        grew = true;
      }
    }
  }
  return out;
}

/** The folders a folder may be moved into: every other that does not lie under it. */
export function foldersOpenTo(folders: Folder[], id: string): Folder[] {
  const under = descendants(folders, id);
  return folders.filter((f) => !under.has(f.id));
}

/** The names of a folder and of those it lies in, the outermost first: "Greek / Epic". */
export function pathOf(folders: Folder[], id: string): string {
  const names: string[] = [];
  let at: Folder | undefined = folders.find((f) => f.id === id);
  let steps = 0;
  while (at && steps++ <= folders.length) {
    names.unshift(at.name);
    const parent = parentOf(folders, at);
    at = parent ? folders.find((f) => f.id === parent) : undefined;
  }
  return names.join(' / ');
}

/**
 * The folders in their tree, the outermost first and each before what lies
 * in it, with their depth: for a menu that lists them.
 */
export function folderTree(folders: Folder[]): { folder: Folder; depth: number }[] {
  const out: { folder: Folder; depth: number }[] = [];
  const walk = (parent: string | null, depth: number) => {
    const children = folders.filter((f) => parentOf(folders, f) === parent).sort(byName);
    for (const f of children) {
      out.push({ folder: f, depth });
      walk(f.id, depth + 1);
    }
  };
  walk(null, 0);
  return out;
}

export interface RowsOptions {
  /** The folders that are closed, by id. */
  collapsed: ReadonlySet<string>;
  /** Words a project's name must hold to be shown; nothing shows all. */
  filter?: string;
}

/**
 * The rows of the list: under each folder its folders, then its projects,
 * each by name. With a filter, only the projects whose name holds the
 * words, and the folders they are in, open.
 */
export function rows(folders: Folder[], projects: ProjectInfo[], options: RowsOptions): Row[] {
  const filter = options.filter?.trim().toLocaleLowerCase() ?? '';
  const matches = (p: ProjectInfo) => !filter || p.name.toLocaleLowerCase().includes(filter);
  const inFolder = new Map<string | null, ProjectInfo[]>();
  for (const p of projects) {
    if (!matches(p)) continue;
    const id = folderOf(folders, p);
    const list = inFolder.get(id);
    if (list) list.push(p);
    else inFolder.set(id, [p]);
  }
  for (const list of inFolder.values()) list.sort(byName);

  // How many projects each folder holds, with those of the folders under it.
  const counts = new Map<string, number>();
  const count = (id: string): number => {
    const known = counts.get(id);
    if (known !== undefined) return known;
    let n = inFolder.get(id)?.length ?? 0;
    for (const f of folders) if (parentOf(folders, f) === id) n += count(f.id);
    counts.set(id, n);
    return n;
  };

  const out: Row[] = [];
  const walk = (parent: string | null, depth: number) => {
    const children = folders.filter((f) => parentOf(folders, f) === parent).sort(byName);
    for (const f of children) {
      const projectsIn = count(f.id);
      if (filter && !projectsIn) continue;
      const holds = projectsIn > 0 || folders.some((x) => parentOf(folders, x) === f.id);
      const open = filter ? true : !options.collapsed.has(f.id);
      out.push({ kind: 'folder', folder: f, depth, projects: projectsIn, open, holds });
      if (open) walk(f.id, depth + 1);
    }
    for (const p of inFolder.get(parent) ?? []) out.push({ kind: 'project', project: p, depth });
  };
  walk(null, 0);
  return out;
}
