/**
 * The tree of a map, read from the flat table of elements.
 *
 * Elements name their parent and carry an order key. Two people moving
 * elements at the same moment can leave a parent that is gone, or a cycle.
 * Reading repairs both in a way that every copy of the project arrives at
 * alike, without writing anything.
 */

export interface FlatNode {
  id: string;
  map: string;
  parent: string | null;
  order: string;
}

export interface Tree {
  /** The element at the centre of the map. */
  root: string | null;
  /** Children of each element, in order. */
  children: Map<string, string[]>;
  /** The parent of each element as the tree has it, which after a repair may differ from what the element says. */
  parent: Map<string, string | null>;
  /** Elements without a parent, other than the root, in order. */
  loose: string[];
  /** Depth of each element: the root and loose elements have 0. */
  depth: Map<string, number>;
  /** Every element of the map, in the order of the text: the root's branch first, then the loose ones. */
  sequence: string[];
}

export function compareOrder(a: FlatNode, b: FlatNode): number {
  return a.order < b.order ? -1 : a.order > b.order ? 1 : a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

export function buildTree(nodes: Iterable<FlatNode>, mapId: string, rootId: string | null): Tree {
  const own = new Map<string, FlatNode>();
  for (const n of nodes) if (n.map === mapId) own.set(n.id, n);

  // The parent each element will have: the one it names, if that exists in this map.
  const parent = new Map<string, string | null>();
  for (const n of own.values()) {
    const p = n.parent;
    parent.set(n.id, p && p !== n.id && own.has(p) ? p : null);
  }

  // The root cannot have a parent. Settled first, so that a cycle through the
  // root is broken at the root.
  const root = rootId && own.has(rootId) ? rootId : null;
  if (root) parent.set(root, null);

  // Break cycles: follow parents from each element; an element met twice is in
  // a cycle, and the member of the cycle with the smallest id is cut loose.
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

  const children = new Map<string, string[]>();
  const loose: FlatNode[] = [];
  for (const n of own.values()) {
    const p = parent.get(n.id) ?? null;
    if (p === null) {
      if (n.id !== root) loose.push(n);
    } else {
      let list = children.get(p);
      if (!list) children.set(p, (list = []));
      list.push(n.id);
    }
  }
  for (const list of children.values()) {
    list.sort((a, b) => compareOrder(own.get(a)!, own.get(b)!));
  }
  loose.sort(compareOrder);

  const depth = new Map<string, number>();
  const sequence: string[] = [];
  const walk = (id: string, d: number) => {
    depth.set(id, d);
    sequence.push(id);
    for (const c of children.get(id) ?? []) walk(c, d + 1);
  };
  if (root) walk(root, 0);
  for (const n of loose) walk(n.id, 0);

  return { root, children, parent, loose: loose.map((n) => n.id), depth, sequence };
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

/** From the top of the branch down to the element itself. */
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
