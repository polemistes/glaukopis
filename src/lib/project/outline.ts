/**
 * The outline of a map: every element by its name, as deep as it stands,
 * for the pane beside any view of the map (`Outline.svelte`). What is
 * folded away in the text is marked as such; what is folded in the outline
 * itself is kept here, for each map, for as long as the application runs:
 * it is about the one who looks, as the text's folding is (ADR 0014), and
 * lighter still.
 */

import { SvelteSet } from 'svelte/reactivity';
import type { Project } from './model/project.svelte';
import type { Folding } from './text/folding.svelte';

export interface OutlineItem {
  id: string;
  level: number;
  /** Folded away in the text, under another. */
  away: boolean;
  loose: boolean;
  excluded: boolean;
  /** How many elements stand directly under it. */
  children: number;
}

/** Every element of a map, those that are folded away in the text as well, in the order of the text. */
export function outlineItems(project: Project, mapId: string, folding: Folding): OutlineItem[] {
  const tree = project.tree(mapId);
  const out: OutlineItem[] = [];
  const walk = (
    id: string,
    level: number,
    excluded: boolean,
    loose: boolean,
    top: boolean,
    away: boolean,
  ) => {
    const node = project.nodes.get(id);
    if (!node) return;
    const left = excluded || node.excluded;
    const under = tree.children.get(id) ?? [];
    const hides = !away && folding.hides(tree, id);
    out.push({ id, level, away, loose: loose && top, excluded: left, children: under.length });
    // An element whose name is not printed does not deepen what is under it.
    const next = top && !loose ? 1 : node.heading ? level + 1 : level;
    for (const c of under) walk(c, Math.max(1, next), left, loose, false, away || hides);
  };
  if (tree.root) walk(tree.root, 0, false, false, true, false);
  for (const id of tree.loose) walk(id, 2, true, true, true, false);
  return out;
}

const folds = new Map<string, SvelteSet<string>>();

/** The elements folded in the outline of a map: their children are not listed. */
export function outlineFolds(mapId: string): SvelteSet<string> {
  let set = folds.get(mapId);
  if (!set) {
    set = new SvelteSet();
    folds.set(mapId, set);
  }
  return set;
}

/**
 * The items that are listed, given what is folded: those under a folded
 * item are left out, however deep; the loose elements begin anew.
 */
export function listed(items: OutlineItem[], folded: ReadonlySet<string>): OutlineItem[] {
  const out: OutlineItem[] = [];
  let under: number | null = null;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.loose && !items[i - 1]?.loose) under = null;
    if (under !== null && item.level > under) continue;
    under = folded.has(item.id) && item.children > 0 ? item.level : null;
    out.push(item);
  }
  return out;
}
