/**
 * What the keys do in a diagram that has the focus: go from one element to
 * the next, add, name, fold, move, associate and remove elements, open their
 * menu, and zoom. A letter begins a new name for the element selected.
 * What is typed while a name cannot yet be written in is the diagram's.
 */

import { openMenu } from '$lib/ui/menu.svelte';
import {
  elementMenu,
  indent,
  outdent,
  removeElements,
  shift,
  type ElementActions,
} from '../elements';
import type { Project } from '../model/project.svelte';
import type { Tree } from '../model/tree';
import { neighbour, type Layout } from './layout';

/** What the keys read of a diagram, and ask of it. */
export interface Diagram {
  readonly project: Project;
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
  /** Holds what is selected, to be pasted; pastes what is held, under what is selected. */
  copy(): void;
  paste(): void;
  open(id: string): void;
  rename(id: string): void;
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

/** Does what a key does in a diagram. Whether it did something. */
export function pressed(event: KeyboardEvent, d: Diagram): boolean {
  const { project, tree, lay, selection } = d;
  const mod = event.ctrlKey || event.metaKey;
  const one = selection.length === 1 ? selection[0] : null;
  const last = selection[selection.length - 1] ?? null;

  if (mod && !event.altKey) {
    const key = event.key.toLowerCase();
    if (key === 'z' && !event.shiftKey) project.undo();
    else if (key === 'y' || (key === 'z' && event.shiftKey)) project.redo();
    else if (key === 'a') d.select(lay.order.slice());
    else if (key === 'c') d.copy();
    else if (key === 'v') d.paste();
    else if (key === '0') d.fit();
    else if (key === '=' || key === '+') d.zoomBy(1.2);
    else if (key === '-') d.zoomBy(1 / 1.2);
    else return false;
    return true;
  }

  // Alt+Shift and the arrows move the element, as in the text: up and down
  // among those beside it, and deeper or less deep, which is outwards or
  // inwards on the side of the map where it stands.
  if (event.altKey && event.shiftKey && !mod && event.key.startsWith('Arrow')) {
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
    openMenu(at, elementMenu(project, selection, d.actions, at));
    return true;
  }

  switch (event.key) {
    case 'Tab':
      if (one) d.add('child', one);
      else if (!selection.length && tree.root) d.add('child', tree.root);
      break;
    case 'Enter':
      // An association that was begun ends at the element that is selected.
      if (d.linkFrom && one) {
        if (d.linkFrom !== one) project.addLink(d.linkFrom, one);
        d.linkFrom = null;
      } else if (one && event.altKey) d.open(one);
      else if (one) d.add('sibling', one);
      else if (!selection.length && tree.root) d.select([tree.root]);
      break;
    case 'F2':
      if (one) d.rename(one);
      break;
    case ' ':
      if (one && (tree.children.get(one)?.length ?? 0)) {
        project.setCollapsed(one, !project.node(one)?.collapsed);
      }
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
      if (!from) break;
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
