/**
 * The owl map (ADR 0037): the projects drawn as a map around the owl, the
 * folders under it as they nest, and the projects in each; those in no
 * folder hang from the owl itself. What is laid out here is a tree for the
 * diagram's own layout, so that the map is balanced to both sides as a
 * map's centre is. Pure, so that it can be tested without the interface.
 */

import type { Folder, Place, ProjectInfo } from '$lib/api/projects';
import type { Tree } from '$lib/project/model/tree';
import { buildTree, type FlatNode } from '$lib/project/model/tree';
import { PROJECT, type Position } from '$lib/project/model/types';
import type { ClosedTree } from './closed.svelte';
import { byName, descendants, folderOf, parentOf } from './folders';

/** The owl, at the centre. */
export const OWL = 'owl';
/** A folder that holds more projects than this starts folded. */
export const FOLD_OVER = 12;

export const folderKey = (id: string) => `folder:${id}`;
export const projectKey = (id: string) => `project:${id}`;
/** The key of an element of a project whose map is shown under its card. */
export const elementKey = (project: string, id: string) => `element:${project}/${id}`;
/** The key of a folder or a project not yet made, while its name is written. */
export const PROVISIONAL = 'new';

export type Keyed =
  | { kind: 'owl' }
  | { kind: 'folder' | 'project'; id: string }
  | { kind: 'element'; project: string; id: string }
  | { kind: 'provisional' };

/** What a key names: the owl, a folder or a project by its id, an element of a project, or the one being made. */
export function keyed(key: string): Keyed {
  if (key.startsWith('folder:')) return { kind: 'folder', id: key.slice(7) };
  if (key.startsWith('project:')) return { kind: 'project', id: key.slice(8) };
  if (key.startsWith('element:')) {
    const rest = key.slice(8);
    const cut = rest.indexOf('/');
    return { kind: 'element', project: rest.slice(0, cut), id: rest.slice(cut + 1) };
  }
  if (key === PROVISIONAL) return { kind: 'provisional' };
  return { kind: 'owl' };
}

/** A folder or a project being named, not yet made, and the folder it is to be made in. */
export interface Provisional {
  of: 'project' | 'folder';
  parent: string | null;
}

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
  | {
      kind: 'project';
      project: ProjectInfo;
      /** Its map as it is read for the top map: being read, read, or not readable. None where it was never asked for. */
      map: 'reading' | 'read' | 'failed' | null;
      /** How many trees stand under the project itself: as read, or as the project last said of itself. */
      elements: number;
      /** Whether its map is folded away under it, as a project's own map folds an element. */
      folded: boolean;
      /** Whether anything stands under it, as far as is known. */
      holds: boolean;
    }
  | {
      kind: 'element';
      project: string;
      id: string;
      name: string;
      folded: boolean;
      /** Whether anything stands under it. */
      holds: boolean;
      /** How deep it stands in its project: 1 for its trees, which stand right under the project. */
      depth: number;
      /** Whether its name is printed as a heading, and whether it is left out of the document. */
      heading: boolean;
      excluded: boolean;
    }
  | { kind: 'provisional'; of: 'project' | 'folder' };

/** The map of a project as it is shown under its card. */
export type ShownMap = ClosedTree | 'reading' | 'failed';

export interface OwlTree {
  tree: Tree;
  /** What each place of the tree is, by its key. */
  items: Map<string, OwlItem>;
  /** What the layout asks of each place: whether it is folded, and where it was put by hand. */
  nodes: Map<string, { collapsed?: boolean; pos?: Position | null }>;
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

export interface OwlOptions {
  /** What stands at the centre: the owl, or a folder entered, by its key. */
  at?: string;
  /** A folder or a project being named, shown first among its kind in its folder. */
  provisional?: Provisional | null;
  /** Where folders and projects were put by hand, by key, from what holds them. */
  places?: Readonly<Record<string, Place>>;
  /** The maps of projects as they are read for the top map, by the project's id. */
  maps?: ReadonlyMap<string, ShownMap>;
  /** The projects whose maps are unfolded under them, by id; the others keep theirs folded away. */
  openMaps?: ReadonlySet<string>;
  /** The elements folded or unfolded on the map, by key; one not here is as its project has it. */
  elementFolds?: ReadonlyMap<string, boolean>;
}

/**
 * The tree of the owl map: the owl at the top, under it the folders that
 * lie in none and the projects in no folder; under each folder its folders,
 * then its projects, each by name. A folder is folded as `chosen` says, or
 * else as `startsFolded` says. At a folder entered, the tree is what lies
 * under that folder, with the folder at the top; a folder that is not there
 * is taken for the owl.
 */
export function owlTree(
  folders: Folder[],
  projects: ProjectInfo[],
  chosen: ReadonlyMap<string, boolean> = new Map(),
  options: OwlOptions = {},
): OwlTree {
  const at = centreOf(folders, options.at);
  const atFolder = at === OWL ? null : keyed(at);
  const within = atFolder && atFolder.kind === 'folder' ? descendants(folders, atFolder.id) : null;
  const provisional = options.provisional ?? null;
  const counts = projectCounts(folders, projects);
  const items = new Map<string, OwlItem>([[OWL, { kind: 'owl' }]]);
  const nodes = new Map<string, { collapsed?: boolean; pos?: Position | null }>([[OWL, {}]]);
  const places = options.places ?? {};
  const placed = (key: string) => places[key] ?? null;
  const maps = options.maps ?? new Map<string, ShownMap>();
  const openMaps = options.openMaps ?? new Set<string>();
  const elementFolds = options.elementFolds ?? new Map<string, boolean>();
  const flat: FlatNode[] = [{ id: OWL, parent: null, order: '' }];
  const order = (prefix: string, i: number) => prefix + String(i).padStart(6, '0');
  // What has no folder, or none that exists, stands under the owl.
  const under = (folder: string | null) => (folder ? folderKey(folder) : OWL);

  const sortedFolders = folders.slice().sort(byName);
  sortedFolders.forEach((f, i) => {
    if (within && !within.has(f.id)) return;
    const key = folderKey(f.id);
    const parent = parentOf(folders, f);
    const n = counts.get(f.id) ?? 0;
    const holds = n > 0 || folders.some((x) => parentOf(folders, x) === f.id);
    // The folder something is being made in is open, so that it is seen.
    const opened = provisional !== null && provisional.parent === f.id;
    const folded = holds && !opened && (chosen.get(f.id) ?? startsFolded(n));
    items.set(key, { kind: 'folder', folder: f, projects: n, folded, holds });
    nodes.set(key, { collapsed: folded, pos: placed(key) });
    flat.push({ id: key, parent: key === at ? null : under(parent), order: order('a', i) });
  });

  const sortedProjects = projects.slice().sort(byName);
  sortedProjects.forEach((p, i) => {
    const folder = folderOf(folders, p);
    if (within && !(folder && within.has(folder))) return;
    const key = projectKey(p.id);
    const shown = maps.get(p.id);
    const read = shown && typeof shown === 'object' ? shown : null;
    const trees = read ? (read.tree.children.get(PROJECT)?.length ?? 0) : (p.maps?.length ?? 0);
    const open = openMaps.has(p.id);
    items.set(key, {
      kind: 'project',
      project: p,
      map: !shown ? null : read ? 'read' : (shown as 'reading' | 'failed'),
      elements: trees,
      folded: !open,
      holds: trees > 0,
    });
    // Its map, once read, is in the tree whether or not it is unfolded, so that what is folded away is counted.
    nodes.set(key, { pos: placed(key), collapsed: !open });
    flat.push({ id: key, parent: under(folder), order: order('b', i) });
    if (read) mapUnder(p.id, key, read);
  });

  /**
   * The map of a project, under it: the project itself stands for its own
   * element, the top of its map, and its trees stand right under it, in the
   * order of the project, each folded as the project has it and placed
   * where the project put it.
   */
  function mapUnder(project: string, top: string, map: ClosedTree) {
    const add = (id: string, parentKey: string, order: string, depth: number) => {
      const key = elementKey(project, id);
      const holds = (map.tree.children.get(id)?.length ?? 0) > 0;
      const look = map.places.get(id);
      const folded = holds && (elementFolds.get(key) ?? look?.collapsed ?? false);
      items.set(key, {
        kind: 'element',
        project,
        id,
        name: map.names.get(id) ?? '',
        folded,
        holds,
        depth,
        heading: look?.heading ?? true,
        excluded: look?.excluded ?? false,
      });
      nodes.set(key, { collapsed: folded, pos: look?.pos ?? null });
      flat.push({ id: key, parent: parentKey, order });
      (map.tree.children.get(id) ?? []).forEach((child, i) =>
        add(child, key, 'c' + String(i).padStart(6, '0'), depth + 1),
      );
    };
    (map.tree.children.get(PROJECT) ?? []).forEach((child, i) =>
      add(child, top, 'c' + String(i).padStart(6, '0'), 1),
    );
  }

  if (provisional) {
    const parent = provisional.parent ? folderKey(provisional.parent) : at;
    items.set(PROVISIONAL, { kind: 'provisional', of: provisional.of });
    nodes.set(PROVISIONAL, {});
    // First among its kind: folders before projects, as everywhere.
    flat.push({
      id: PROVISIONAL,
      parent: items.has(parent) ? parent : at,
      order: provisional.of === 'folder' ? 'a' : 'b',
    });
  }

  if (at !== OWL) {
    items.delete(OWL);
    nodes.delete(OWL);
    flat.shift();
  }
  return { tree: buildTree(flat, at), items, nodes };
}

/** The key at the centre: the folder asked for, where it is there; else the owl. */
export function centreOf(folders: Folder[], at: string | null | undefined): string {
  if (!at || at === OWL) return OWL;
  const k = keyed(at);
  return k.kind === 'folder' && folders.some((f) => f.id === k.id) ? at : OWL;
}

/** The key of what holds a folder or a project: a folder, or the owl. The owl has none. */
export function parentKey(key: string, folders: Folder[], projects: ProjectInfo[]): string | null {
  const k = keyed(key);
  if (k.kind === 'folder') {
    const f = folders.find((x) => x.id === k.id);
    const parent = f ? parentOf(folders, f) : null;
    return parent ? folderKey(parent) : OWL;
  }
  if (k.kind === 'project') {
    const p = projects.find((x) => x.id === k.id);
    const folder = p ? folderOf(folders, p) : null;
    return folder ? folderKey(folder) : OWL;
  }
  return null;
}

/** What stands beside a key under the same folder, the key among them, in the order of the map. */
export function siblingsOf(key: string, tree: Tree): string[] {
  const parent = tree.parent.get(key) ?? null;
  return parent ? (tree.children.get(parent) ?? []) : [];
}

/**
 * The folder a key goes into when it is put deeper: the nearest folder
 * before it among those beside it. None for the first, and none for what
 * stands at the centre.
 */
export function folderBefore(key: string, tree: Tree): string | null {
  if (key === tree.root) return null;
  const siblings = siblingsOf(key, tree);
  for (let i = siblings.indexOf(key) - 1; i >= 0; i--) {
    if (keyed(siblings[i]).kind === 'folder') return siblings[i];
  }
  return null;
}

/**
 * The folder a key goes into when it is put less deep: the one over the
 * folder that holds it. None for what stands right under the centre, which
 * stays in view, as the diagram keeps what is under the element in view.
 */
export function folderAbove(key: string, tree: Tree): string | null {
  const parent = tree.parent.get(key) ?? null;
  if (!parent || parent === tree.root) return null;
  return tree.parent.get(parent) ?? null;
}

/**
 * Where a new folder or project is made: in the folder selected, in the
 * folder of the project selected, or in the folder at the centre; at the
 * top where the owl or nothing is selected at the owl. Of several selected,
 * the last. A folder's id, or null for the top.
 */
export function whereNew(selection: string[], tree: Tree): string | null {
  // The nearest folder from what is selected up: the folder itself, the
  // folder of a project, or that of the project an element is of.
  let at: string | null = selection[selection.length - 1] ?? tree.root;
  while (at) {
    const k = keyed(at);
    if (k.kind === 'folder') return k.id;
    at = tree.parent.get(at) ?? null;
  }
  return null;
}
