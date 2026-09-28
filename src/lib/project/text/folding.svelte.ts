/**
 * What is folded away in the text of a project: the elements of which the
 * name is shown and nothing else, neither their own text nor what is under
 * them.
 *
 * It is about the one who reads, and not about the document: it is kept
 * with the view of the project on this computer, and not in the project,
 * so that what one folds away is not folded away for those the project is
 * shared with. Each element is folded or open by itself: what is folded
 * under an element that is folded is as it was when that is opened again.
 */

import { SvelteSet } from 'svelte/reactivity';
import type { Tree } from '../model/tree';

/** What is hidden under an element that is folded. */
export interface Hidden {
  /** The elements, all of them, however deep. */
  ids: string[];
}

export class Folding {
  /** The elements that are folded, whether they have something to fold away or not. */
  readonly folded = new SvelteSet<string>();
  /** Whether an element has text of its own. */
  holds: (id: string) => boolean;

  constructor(folded: Iterable<string> = [], holds: (id: string) => boolean = () => false) {
    for (const id of folded) this.folded.add(id);
    this.holds = holds;
  }

  has(id: string): boolean {
    return this.folded.has(id);
  }

  /** Whether there is something to fold away: text of its own, or something under it. */
  can(tree: Tree, id: string): boolean {
    return (tree.children.get(id)?.length ?? 0) > 0 || this.holds(id);
  }

  /** Whether an element hides something: it is folded, and there is something. */
  hides(tree: Tree, id: string): boolean {
    return this.folded.has(id) && this.can(tree, id);
  }

  fold(id: string) {
    this.folded.add(id);
  }

  open(id: string) {
    this.folded.delete(id);
  }

  toggle(tree: Tree, id: string) {
    if (this.hides(tree, id)) this.open(id);
    else if (this.can(tree, id)) this.fold(id);
  }

  /** All that is under an element, however deep, in the order of the text. */
  under(tree: Tree, id: string): string[] {
    const out: string[] = [];
    const walk = (at: string) => {
      for (const child of tree.children.get(at) ?? []) {
        out.push(child);
        walk(child);
      }
    };
    walk(id);
    return out;
  }

  /** Whether the element, or anything under it, is folded and hides something. */
  anyFolded(tree: Tree, id: string): boolean {
    return this.hides(tree, id) || this.under(tree, id).some((one) => this.hides(tree, one));
  }

  /** Whether anything under the element is folded and hides something. */
  anyFoldedUnder(tree: Tree, id: string): boolean {
    return this.under(tree, id).some((one) => this.hides(tree, one));
  }

  /** Whether something under the element could be folded and is not. */
  anyOpen(tree: Tree, id: string): boolean {
    return this.under(tree, id).some((one) => this.can(tree, one) && !this.folded.has(one));
  }

  /** Opens the element and all that is folded under it. */
  openAll(tree: Tree, id: string) {
    this.folded.delete(id);
    for (const one of this.under(tree, id)) this.folded.delete(one);
  }

  /**
   * Folds all that can be folded under the element, which itself stays
   * open: of what is directly under it the names are shown, and nothing
   * deeper.
   */
  foldAll(tree: Tree, id: string) {
    this.folded.delete(id);
    for (const one of this.under(tree, id)) if (this.can(tree, one)) this.folded.add(one);
  }

  /** The element an element is hidden under: the outermost that is folded over it. */
  hiddenUnder(tree: Tree, id: string): string | null {
    let found: string | null = null;
    const seen = new Set<string>([id]);
    for (
      let at = tree.parent.get(id) ?? null;
      at && !seen.has(at);
      at = tree.parent.get(at) ?? null
    ) {
      seen.add(at);
      if (this.folded.has(at)) found = at;
    }
    return found;
  }

  /** Opens what an element is folded under, so that it is shown. Whether anything was opened. */
  reveal(tree: Tree, id: string): boolean {
    let opened = false;
    const seen = new Set<string>([id]);
    for (
      let at = tree.parent.get(id) ?? null;
      at && !seen.has(at);
      at = tree.parent.get(at) ?? null
    ) {
      seen.add(at);
      if (this.folded.delete(at)) opened = true;
    }
    return opened;
  }

  /** What is kept: the folded elements that there still are, in an order that does not change by itself. */
  kept(exists: (id: string) => boolean): string[] {
    return [...this.folded].filter(exists).sort();
  }
}
