/**
 * The owl map (ADR 0037): the projects drawn as a map around the owl, the
 * folders under it as they nest, and the projects in each; those in no
 * folder hang from the owl itself. What is laid out here is a tree for the
 * diagram's own layout, so that the map is balanced to both sides as a
 * map's centre is. Pure, so that it can be tested without the interface.
 */

import type { Folder, ProjectInfo } from '$lib/api/projects';
import type { Tree } from '$lib/project/model/tree';
import { buildTree, type FlatNode } from '$lib/project/model/tree';
import { byName, folderOf, parentOf } from './folders';

/** The owl, at the centre. */
export const OWL = 'owl';
/** A folder that holds more projects than this starts folded. */
export const FOLD_OVER = 12;

export const folderKey = (id: string) => `folder:${id}`;
export const projectKey = (id: string) => `project:${id}`;

export type OwlItem =
  | { kind: 'owl' }
  | {
      kind: 'folder';
      folder: Folder;
      /** The projects in it, and in the folders under it. */
      projects: number;
      folded: boolean;
      /** Whether anything lies in it. */
      holds: boolean;
    }
  | { kind: 'project'; project: ProjectInfo };

export interface OwlTree {
  tree: Tree;
  /** What each place of the tree is, by its key. */
  items: Map<string, OwlItem>;
  /** What the layout asks of each place: whether it is folded. */
  nodes: Map<string, { collapsed?: boolean }>;
}

/** How many projects each folder holds, with those of the folders under it. */
export function projectCounts(folders: Folder[], projects: ProjectInfo[]): Map<string, number> {
  const own = new Map<string, number>();
  for (const p of projects) {
    const f = folderOf(folders, p);
    if (f) own.set(f, (own.get(f) ?? 0) + 1);
  }
  const counts = new Map<string, number>();
  const seen = new Set<string>();
  const count = (id: string): number => {
    const known = counts.get(id);
    if (known !== undefined) return known;
    // A folder met again on its own way down is a loop: it counts nothing more.
    if (seen.has(id)) return 0;
    seen.add(id);
    let n = own.get(id) ?? 0;
    for (const f of folders) if (parentOf(folders, f) === id) n += count(f.id);
    counts.set(id, n);
    return n;
  };
  for (const f of folders) count(f.id);
  return counts;
}

/** Whether a folder starts folded: where it holds too many projects to be seen at once. */
export function startsFolded(projects: number): boolean {
  return projects > FOLD_OVER;
}

/**
 * The tree of the owl map: the owl at the top, under it the folders that
 * lie in none and the projects in no folder; under each folder its folders,
 * then its projects, each by name. A folder is folded as `chosen` says, or
 * else as `startsFolded` says.
 */
export function owlTree(
  folders: Folder[],
  projects: ProjectInfo[],
  chosen: ReadonlyMap<string, boolean> = new Map(),
): OwlTree {
  const counts = projectCounts(folders, projects);
  const items = new Map<string, OwlItem>([[OWL, { kind: 'owl' }]]);
  const nodes = new Map<string, { collapsed?: boolean }>([[OWL, {}]]);
  const flat: FlatNode[] = [{ id: OWL, parent: null, order: '' }];
  const order = (prefix: string, i: number) => prefix + String(i).padStart(6, '0');

  const sortedFolders = folders.slice().sort(byName);
  sortedFolders.forEach((f, i) => {
    const key = folderKey(f.id);
    const parent = parentOf(folders, f);
    const n = counts.get(f.id) ?? 0;
    const holds = n > 0 || folders.some((x) => parentOf(folders, x) === f.id);
    const folded = holds && (chosen.get(f.id) ?? startsFolded(n));
    items.set(key, { kind: 'folder', folder: f, projects: n, folded, holds });
    nodes.set(key, { collapsed: folded });
    flat.push({ id: key, parent: parent ? folderKey(parent) : OWL, order: order('a', i) });
  });

  const sortedProjects = projects.slice().sort(byName);
  sortedProjects.forEach((p, i) => {
    const key = projectKey(p.id);
    const folder = folderOf(folders, p);
    items.set(key, { kind: 'project', project: p });
    nodes.set(key, {});
    flat.push({ id: key, parent: folder ? folderKey(folder) : OWL, order: order('b', i) });
  });

  return { tree: buildTree(flat, OWL), items, nodes };
}
