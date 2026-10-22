/**
 * What the keys do in a diagram that has the focus: the keys of the tree,
 * as they are in the text, the map of all projects and the list at the
 * left (Alt+Enter a new element after, Alt+Shift+Enter one under, Tab to
 * fold, Shift+Tab to fold or unfold all, Alt and the arrows to move,
 * Alt+Shift+Down to enter, Enter to open the text, F2 to rename), and the
 * diagram's own: associating, copying, pasting and zooming. A letter begins
 * a new name for the element selected. What is typed while a name cannot
 * yet be written in is the diagram's.
 */

import { openMenu, type MenuItem } from '$lib/ui/menu.svelte';
import { indent, outdent, removeElements, shift, type ElementActions } from '../elements';
import type { Project } from '../model/project.svelte';
import type { Tree } from '../model/tree';
import { neighbour, type Layout } from './layout';
import { keyOf } from '$lib/shell/keys.svelte';

/** What the keys read of a diagram, and ask of it. */
export interface Diagram {
  readonly project: Project;
  /** The tree as seen from the element in view, which is its root. */
  readonly tree: Tree;
  readonly lay: Layout;
  readonly selection: string[];
  /** The element an association was begun at: it ends at the one selected. */
  linkFrom: string | null;
  /** The association that is selected. */
  selectedLink: string | null;
  readonly actions: ElementActions;
  select(ids: string[]): void;
  add(kind: 'child' | 'sibling', at: string): void;
  /** Holds what is selected, copied or cut, to be pasted; pastes what is held, under what is selected. */
  copy(): void;
  cut(): void;
  paste(): void;
  open(id: string): void;
  /** Unfolds all that is folded under the element in view, or folds everything at the first level: see `foldAll`. */
  foldAll(): void;
  /** Makes the element the one in view. */
  enter(id: string): void;
  rename(id: string): void;
  /** The menu of elements, as the diagram assembles it. */
  menu(ids: string[], anchor: HTMLElement): MenuItem[];
  /** A letter begins a new name for an element: the letter is its beginning. */
  beginName(id: string, letter: string): void;
  fit(): void;
  zoomBy(factor: number): void;
  bringIntoView(id: string): void;
  /** An element as it stands on the screen, for its menu. */
  elementAt(id: string): HTMLElement | null;
  /** The menu was opened by a key: the event the key sends after it is let be. */
  openedByKey(): void;
}

/**
 * Where anything under the element in view is folded, unfolds all of it;
 * else folds every element at the first level that has something under it.
 * The fold of an element is one flag, kept in the project, so there are
 * these two states and no third.
 */
export function foldAll(project: Project, tree: Tree) {
  const has = (id: string) => (tree.children.get(id)?.length ?? 0) > 0;
  const folded = tree.sequence.filter(
    (id) => id !== tree.root && has(id) && project.node(id)?.collapsed,
  );
  project.transact(() => {
    if (folded.length) for (const id of folded) project.setCollapsed(id, false);
    else
      for (const id of tree.children.get(tree.root) ?? [])
        if (has(id)) project.setCollapsed(id, true);
  });
}

/** Does what a key does in a diagram. Whether it did something. */
export function pressed(event: KeyboardEvent, d: Diagram): boolean {
  const { project, tree, lay, selection } = d;
  const mod = event.ctrlKey || event.metaKey;
  const one = selection.length === 1 ? selection[0] : null;
  const last = selection[selection.length - 1] ?? null;
  /** A new element after one: after the element in view, which has nothing beside it, the first under it. */
  const after = (id: string) => d.add(id === tree.root ? 'child' : 'sibling', id);

  // Alt+Enter a new element after the one selected, and with Shift one
  // under it, as in the text; with nothing selected, under the element in
  // view. While an association is drawn, nothing is made.
  if (event.key === 'Enter' && event.altKey && !mod) {
    if (d.linkFrom) return true;
    if (one) {
      if (event.shiftKey) d.add('child', one);
      else after(one);
    } else if (!selection.length) d.add('child', tree.root);
    return true;
  }

  if (mod && !event.altKey) {
    const key = keyOf(event);
    if (key === 'z' && !event.shiftKey) project.undo();
    else if (key === 'y' || (key === 'z' && event.shiftKey)) project.redo();
    else if (key === 'a') d.select(lay.order.slice());
    else if (key === 'c') d.copy();
    else if (key === 'x') d.cut();
    else if (key === 'v') d.paste();
    else if (key === '0') d.fit();
    else if (key === '=' || key === '+') d.zoomBy(1.2);
    else if (key === '-') d.zoomBy(1 / 1.2);
    else return false;
    return true;
  }

  // Alt+Shift and the arrows up and down go in and out: the element selected
  // becomes the one in view; up, to the element over the one in view, is the
  // view's to do. Alt+Shift with the arrows sideways does nothing.
  if (event.altKey && event.shiftKey && !mod && event.key.startsWith('Arrow')) {
    if (event.key === 'ArrowUp') return false;
    if (event.key === 'ArrowDown' && one && one !== tree.root) d.enter(one);
    return true;
  }

  // Alt and the arrows move the element, as in the text: up and down among
  // those beside it; sideways as the arrow points on the screen, which is
  // deeper on the right of the map and less deep on the left.
  if (event.altKey && !event.shiftKey && !mod && event.key.startsWith('Arrow')) {
    if (!one) return true;
    const outwards = lay.placed.get(one)?.side === 'left' ? 'ArrowLeft' : 'ArrowRight';
    const inwards = outwards === 'ArrowLeft' ? 'ArrowRight' : 'ArrowLeft';
    const moved =
      event.key === 'ArrowUp'
        ? shift(project, tree, one, -1)
        : event.key === 'ArrowDown'
          ? shift(project, tree, one, 1)
          : event.key === outwards
            ? indent(project, tree, one)
            : event.key === inwards && outdent(project, tree, one);
    if (moved) requestAnimationFrame(() => d.bringIntoView(one));
    return true;
  }

  // The menu of what is selected, from the keys.
  if (event.key === 'ContextMenu' || (event.key === 'F10' && event.shiftKey)) {
    const at = last && d.elementAt(last);
    if (!at) return true;
    d.openedByKey();
    openMenu(at, d.menu(selection, at));
    return true;
  }

  switch (event.key) {
    case 'Tab':
      // Tab folds what is under the element, or unfolds it; with Shift, all
      // under the element in view. The focus stays in the diagram either way.
      if (event.altKey) return false;
      if (event.shiftKey) d.foldAll();
      else if (one && (tree.children.get(one)?.length ?? 0)) {
        project.setCollapsed(one, !project.node(one)?.collapsed);
      }
      break;
    case 'Enter':
      // An association that was begun ends at the element that is selected.
      if (d.linkFrom && one) {
        if (d.linkFrom !== one) project.addLink(d.linkFrom, one);
        d.linkFrom = null;
      } else if (one) d.open(one);
      else if (!selection.length) d.select([tree.root]);
      break;
    case 'F2':
      if (one) d.rename(one);
      break;
    case 'Delete':
    case 'Backspace':
      if (d.selectedLink) {
        project.removeLink(d.selectedLink);
        d.selectedLink = null;
      } else if (selection.length) {
        const parent = one ? (tree.parent.get(one) ?? null) : null;
        if (removeElements(project, selection) && parent) d.select([parent]);
      }
      break;
    case 'Escape':
      if (d.linkFrom) d.linkFrom = null;
      else d.select([]);
      break;
    case 'ArrowLeft':
    case 'ArrowRight':
    case 'ArrowUp':
    case 'ArrowDown': {
      const from = last ?? tree.root;
      if (!last) {
        d.select([from]);
        break;
      }
      const direction = event.key.slice(5).toLowerCase() as 'left' | 'right' | 'up' | 'down';
      const next = neighbour(lay, from, direction);
      if (next) {
        d.select(event.shiftKey ? [...selection.filter((s) => s !== next), next] : [next]);
        d.bringIntoView(next);
      }
      break;
    }
    default:
      // A letter begins a new name for what is selected.
      if (one && event.key.length === 1 && !event.altKey && /\S/.test(event.key)) {
        d.beginName(one, event.key);
        break;
      }
      return false;
  }
  return true;
}
