/**
 * The tree of a project, read from the flat table of elements.
 *
 * Elements name their parent and carry an order key. The project itself
 * (`PROJECT`) is the root, and has no parent whatever is written. Two people
 * moving elements at the same moment can leave a parent that is gone, or a
 * cycle; reading repairs both in a way that every copy of the project
 * arrives at alike, without writing anything: what has no parent to stand
 * under stands under the root.
 */

import { PROJECT } from './types';

export interface FlatNode {
  id: string;
  parent: string | null;
  order: string;
}

export interface Tree {
  /** The element at the top: the project, or the element in view. */
  root: string;
  /** Children of each element, in order. */
  children: Map<string, string[]>;
  /** The parent of each element as the tree has it, which after a repair may differ from what the element says. */
  parent: Map<string, string | null>;
  /** Depth of each element from the root, which has 0. */
  depth: Map<string, number>;
  /** Every element from the root down, the root first, in the order of the text. */
  sequence: string[];
}

export function compareOrder(a: FlatNode, b: FlatNode): number {
  return a.order < b.order ? -1 : a.order > b.order ? 1 : a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/**
 * The whole tree. The root is there even where no element of that id is,
 * so that what is read holds together before the project's element has
 * been made, or when the past is read.
 */
export function buildTree(nodes: Iterable<FlatNode>, rootId: string = PROJECT): Tree {
  const own = new Map<string, FlatNode>();
  for (const n of nodes) own.set(n.id, n);
  if (!own.has(rootId)) own.set(rootId, { id: rootId, parent: null, order: '' });

  // The parent each element will have: the one it names, if that exists.
  const parent = new Map<string, string | null>();
  for (const n of own.values()) {
    const p = n.parent;
    parent.set(n.id, p && p !== n.id && own.has(p) ? p : null);
  }
  // The root cannot have a parent. Settled first, so that a cycle through
  // the root is broken at the root.
  parent.set(rootId, null);

  // Break cycles: follow parents from each element; an element met twice is in
  // a cycle, and the member of the cycle with the smallest id is cut off.
  const state = new Map<string, 0 | 1 | 2>(); // 0 unseen, 1 on the path, 2 done
  for (const start of [...own.keys()].sort()) {
    if (state.get(start) === 2) continue;
    const path: string[] = [];
    let at: string | null = start;
    while (at !== null && (state.get(at) ?? 0) === 0) {
      state.set(at, 1);
      path.push(at);
      at = parent.get(at) ?? null;
    }
    if (at !== null && state.get(at) === 1) {
      const cycle = path.slice(path.indexOf(at));
      const cut = cycle.slice().sort()[0];
      parent.set(cut, null);
    }
    for (const id of path) state.set(id, 2);
  }

  // What has nothing to stand under stands under the root.
  const children = new Map<string, string[]>();
  for (const n of own.values()) {
    if (n.id === rootId) continue;
    const p = parent.get(n.id) ?? rootId;
    parent.set(n.id, p);
    let list = children.get(p);
    if (!list) children.set(p, (list = []));
    list.push(n.id);
  }
  for (const list of children.values()) {
    list.sort((a, b) => compareOrder(own.get(a)!, own.get(b)!));
  }

  const depth = new Map<string, number>();
  const sequence: string[] = [];
  const walk = (id: string, d: number) => {
    depth.set(id, d);
    sequence.push(id);
    for (const c of children.get(id) ?? []) walk(c, d + 1);
  };
  walk(rootId, 0);

  return { root: rootId, children, parent, depth, sequence };
}

/**
 * The tree seen from an element: that element at the top, with depth 0,
 * and all under it. Children and parents are those of the whole, so that
 * the way up from the top is still known.
 */
export function viewOf(tree: Tree, rootId: string): Tree {
  if (rootId === tree.root) return tree;
  const depth = new Map<string, number>();
  const sequence: string[] = [];
  const walk = (id: string, d: number) => {
    depth.set(id, d);
    sequence.push(id);
    for (const c of tree.children.get(id) ?? []) walk(c, d + 1);
  };
  walk(rootId, 0);
  return { root: rootId, children: tree.children, parent: tree.parent, depth, sequence };
}

/** The element and all under it, the element first. */
export function subtree(tree: Tree, id: string): string[] {
  const out: string[] = [];
  const walk = (at: string) => {
    out.push(at);
    for (const c of tree.children.get(at) ?? []) walk(c);
  };
  walk(id);
  return out;
}

export function isAncestor(tree: Tree, ancestor: string, id: string): boolean {
  let at = tree.parent.get(id) ?? null;
  while (at !== null) {
    if (at === ancestor) return true;
    at = tree.parent.get(at) ?? null;
  }
  return false;
}

/** From the top of the whole tree down to the element itself. */
export function pathTo(tree: Tree, id: string): string[] {
  const out = [id];
  let at = tree.parent.get(id) ?? null;
  while (at !== null) {
    out.unshift(at);
    at = tree.parent.get(at) ?? null;
  }
  return out;
}

/** Of several elements, those that are not under another of them. */
export function topmost(tree: Tree, ids: string[]): string[] {
  const set = new Set(ids);
  return ids.filter((id) => {
    let at = tree.parent.get(id) ?? null;
    while (at !== null) {
      if (set.has(at)) return false;
      at = tree.parent.get(at) ?? null;
    }
    return true;
  });
}
