/**
 * Things that lie in a tree (folders of projects and of files, collections
 * of the library) as a menu or a list to choose one from: each before what
 * lies in it, by name, indented by how deep it lies. The menus of moving and
 * adding to were written once per kind of thing, and most were indented by
 * repeated spaces, which HTML runs together into one, so that what lay in
 * another stood flush with it; two had em spaces, which it does not. A
 * menu item carries its depth, which the menu shows as a margin; a native
 * option, which shows only text, is indented by em spaces.
 */

import type { Component } from 'svelte';
import type { MenuItem } from './menu.svelte';

/** Something that lies in a tree: under its parent, or at the top. */
export interface TreeNode {
  id: string;
  name: string;
  parent?: string | null;
}

const collator = new Intl.Collator(undefined, { sensitivity: 'base', numeric: true });

/** By name, as people sort: without regard to case or accents, and 2 before 10. */
export const byName = (a: { name: string }, b: { name: string }) =>
  collator.compare(a.name, b.name);

/**
 * The nodes in their tree, the outermost first and each before what lies in
 * it, siblings by name, with their depth. One whose parent is not among them
 * stands at the top, so that it is never lost. What `leave` names is left
 * out, with all that lies in it.
 */
export function inTreeOrder<T extends TreeNode>(
  nodes: readonly T[],
  leave?: (node: T) => boolean,
): { node: T; depth: number }[] {
  const ids = new Set(nodes.map((n) => n.id));
  const under = new Map<string | null, T[]>();
  for (const n of nodes) {
    const parent = n.parent && ids.has(n.parent) ? n.parent : null;
    under.set(parent, [...(under.get(parent) ?? []), n]);
  }
  const out: { node: T; depth: number }[] = [];
  const seen = new Set<string>();
  const walk = (parent: string | null, depth: number) => {
    for (const n of (under.get(parent) ?? []).sort(byName)) {
      if (seen.has(n.id) || leave?.(n)) continue;
      seen.add(n.id);
      out.push({ node: n, depth });
      walk(n.id, depth + 1);
    }
  };
  walk(null, 0);
  return out;
}

/** What an item of a tree's menu does: all but its label, its depth and its icon, which the tree gives. */
export type TreeItem = Omit<Extract<MenuItem, { action: () => void }>, 'label' | 'depth' | 'icon'>;

/**
 * The nodes of a tree as items of a menu, in tree order, each indented by
 * its depth; those at the top with `icon`, where one is given.
 */
export function treeMenu<T extends TreeNode>(
  nodes: readonly T[],
  item: (node: T) => TreeItem,
  options: { leave?: (node: T) => boolean; icon?: Component<{ size?: number | string }> } = {},
): MenuItem[] {
  return inTreeOrder(nodes, options.leave).map(({ node, depth }) => ({
    ...item(node),
    label: node.name,
    depth,
    icon: depth ? undefined : options.icon,
  }));
}

/**
 * A label indented by its depth for where only text is shown, as in a
 * native option: by em spaces, which are not run together.
 */
export const indented = (label: string, depth: number) =>
  '\u2003'.repeat(Math.max(0, depth)) + label;
