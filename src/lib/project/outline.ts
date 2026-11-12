/**
 * The outline of an element in view: it and every element under it by its
 * name, as deep as it stands, for the pane beside any view of it
 * (`Outline.svelte`). What is folded away in the text is marked as such;
 * what is folded in the outline itself is kept here, for each element
 * viewed, for as long as the application runs: it is about the one who
 * looks, as the text's folding is (ADR 0014), and lighter still. Where
 * elements dragged over it would go is worked out here as well, from plain
 * data; the pane measures its rows.
 */

import { SvelteSet } from 'svelte/reactivity';
import type { Project } from './model/project.svelte';
import { isAncestor } from './model/tree';
import type { Folding } from './text/folding.svelte';
import { dropChoices, nearestChoice, type DropChoice } from './text/layout';

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
    const next = top ? 1 : level + 1;
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

// ---- where elements dragged over the outline would go ----

/** How far in each level stands, and the deepest that stands further in than the one over it. */
export const OUTLINE_STEP = 12;
const DEEPEST_SET_IN = 6;
/** How far the pointer goes sideways for one level, as an element is dragged by its name. */
export const DRAG_STEP = 16;

/** How far in the row of a level begins, from the edge of the rows. */
export function outlineIndent(level: number): number {
  return 4 + Math.min(level, DEEPEST_SET_IN) * OUTLINE_STEP;
}

/**
 * How deep what is dragged is wanted, by where the pointer is sideways. An
 * element taken by its name in the outline (`grabbed`: where the pointer
 * took it, and how deep it stood) stays as deep while the pointer goes
 * straight up or down, and is a level deeper or less deep for each step to
 * the right or the left. What comes from elsewhere is as deep as the names
 * the pointer is over, the names of the first level beginning at `names`.
 */
export function depthWanted(
  x: number,
  grabbed: { x: number; depth: number } | null,
  names: number,
): number {
  if (grabbed) return grabbed.depth + Math.round((x - grabbed.x) / DRAG_STEP);
  return 1 + Math.round((x - names) / OUTLINE_STEP);
}

/**
 * Where elements dragged over the outline of the element in view would go:
 * between two of the rows listed, as deep as is wanted among the depths
 * that place allows (`dropChoices`, as in the text). `rows` are the
 * elements listed without those dragged and what is under them, which are
 * no places for themselves; `above` is the place among them of the row
 * over the pointer's. `dragged` are the elements dragged where they are of
 * this project: they go under none of themselves, wherever in the project
 * they stand. Nothing where the place allows none.
 */
export function outlinePlace(
  project: Project,
  at: string,
  rows: string[],
  above: number,
  wanted: number,
  dragged: string[] | null,
): DropChoice | null {
  const whole = project.tree();
  const inside = (id: string) =>
    !!dragged && dragged.some((d) => d === id || isAncestor(whole, d, id));
  const choices = dropChoices(project.tree(at), rows[above], rows[above + 1] ?? null, inside);
  return choices.length ? nearestChoice(choices, wanted) : null;
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
