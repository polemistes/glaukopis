/**
 * The picker of a target: a dialog with the tree of a project, in which an
 * element is chosen to copy or move elements to, or for an element to stand
 * for. Asked by `pickElement`, answered by a promise; the host in App shows it.
 */

import { fold } from '$lib/search/matching';
import type { Project } from './model/project.svelte';
import { subtree, type Tree } from './model/tree';
import { PROJECT } from './model/types';

export interface PickOptions {
  /** What the dialog is for, as its title says it. */
  title: string;
  /** The words of the button that chooses: what will be done. */
  action: string;
  /** Why an element cannot be chosen, or null when it can. */
  refuse?: (id: string) => string | null;
  /** The element in view: the way to it stands open, and it is chosen first if it may be. */
  at?: string | null;
}

export interface Picking extends PickOptions {
  project: Project;
  resolve: (id: string | null) => void;
}

class Picker {
  current = $state<Picking | null>(null);

  ask(project: Project, options: PickOptions): Promise<string | null> {
    this.current?.resolve(null);
    return new Promise((resolve) => {
      this.current = { ...options, project, resolve };
    });
  }

  answer(id: string | null) {
    const q = this.current;
    this.current = null;
    q?.resolve(id);
  }
}

export const picker = new Picker();

/** Asks for an element of the project. Resolves to its id, or null when nothing was chosen. */
export function pickElement(project: Project, options: PickOptions): Promise<string | null> {
  return picker.ask(project, options);
}

// ---- what the dialog shows ----

export interface PickRow {
  id: string;
  depth: number;
  /** Whether it has elements under it. */
  holds: boolean;
  open: boolean;
}

/** The lines of the tree as shown: the project first, then what is under each element unfolded. */
export function pickRows(tree: Tree, isOpen: (id: string) => boolean): PickRow[] {
  const out: PickRow[] = [];
  const visit = (id: string, depth: number) => {
    const children = tree.children.get(id) ?? [];
    const holds = children.length > 0;
    const open = holds && (id === tree.root || isOpen(id));
    out.push({ id, depth, holds, open });
    if (open) for (const child of children) visit(child, depth + 1);
  };
  visit(tree.root, 0);
  return out;
}

export interface Found {
  id: string;
  /** The names of the elements over it, from the top down, the project first. */
  path: string[];
}

const folded = (text: string) => fold(text).text.toLocaleLowerCase();

/**
 * The elements whose name holds what is written, letters with and without
 * accents alike: those whose name begins so first, then the rest, each in
 * the order of the text.
 */
export function findElements(
  tree: Tree,
  nameOf: (id: string) => string,
  query: string,
  limit = 200,
): Found[] {
  const q = folded(query.trim());
  if (!q) return [];
  const first: string[] = [];
  const then: string[] = [];
  for (const id of tree.sequence) {
    const name = folded(nameOf(id));
    const i = name.indexOf(q);
    if (i === 0) first.push(id);
    else if (i > 0) then.push(id);
  }
  return [...first, ...then].slice(0, limit).map((id) => {
    const path: string[] = [];
    for (let p = tree.parent.get(id) ?? null; p !== null; p = tree.parent.get(p) ?? null)
      path.unshift(nameOf(p));
    return { id, path };
  });
}

/** The elements carried and all under them: those that cannot take them. */
export function carriedWithin(tree: Tree, ids: string[]): Set<string> {
  return new Set(ids.filter((id) => id !== PROJECT).flatMap((id) => subtree(tree, id)));
}
