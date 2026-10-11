/**
 * The outline of an element in view: it and every element under it by its
 * name, as deep as it stands, for the pane beside any view of it
 * (`Outline.svelte`). What is folded away in the text is marked as such;
 * what is folded in the outline itself is kept here, for each element
 * viewed, for as long as the application runs: it is about the one who
 * looks, as the text's folding is (ADR 0014), and lighter still.
 */

import { SvelteSet } from 'svelte/reactivity';
import type { Project } from './model/project.svelte';
import type { Folding } from './text/folding.svelte';

export interface OutlineItem {
  id: string;
  level: number;
  /** Folded away in the text, under another. */
  away: boolean;
  excluded: boolean;
  /** How many elements stand directly under it. */
  children: number;
}

/** The branch of the element in view, those that are folded away in the text as well, in the order of the text. */
export function outlineItems(project: Project, at: string, folding: Folding): OutlineItem[] {
  const tree = project.tree(at);
  const out: OutlineItem[] = [];
  const walk = (id: string, level: number, excluded: boolean, top: boolean, away: boolean) => {
    const node = project.nodes.get(id);
    if (!node) return;
    const left = excluded || node.excluded;
    const under = tree.children.get(id) ?? [];
    const hides = !away && folding.hides(tree, id);
    out.push({ id, level, away, excluded: left, children: under.length });
    // An element whose name is not printed does not deepen what is under it.
    const next = top ? 1 : node.heading ? level + 1 : level;
    for (const c of under) walk(c, Math.max(1, next), left, false, away || hides);
  };
  walk(tree.root, 0, false, true, false);
  return out;
}

const folds = new Map<string, SvelteSet<string>>();

/** The elements folded in the outline of an element in view: their children are not listed. */
export function outlineFolds(at: string): SvelteSet<string> {
  let set = folds.get(at);
  if (!set) {
    set = new SvelteSet();
    folds.set(at, set);
  }
  return set;
}

/** The items that are listed, given what is folded: those under a folded item are left out, however deep. */
export function listed(items: OutlineItem[], folded: ReadonlySet<string>): OutlineItem[] {
  const out: OutlineItem[] = [];
  let under: number | null = null;
  for (const item of items) {
    if (under !== null && item.level > under) continue;
    under = folded.has(item.id) && item.children > 0 ? item.level : null;
    out.push(item);
  }
  return out;
}
