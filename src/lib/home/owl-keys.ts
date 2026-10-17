/**
 * What the keys do on the owl map that has the focus, as they do in a
 * project's diagram: go from one folder, project or element to the next,
 * make a project or a folder and name it in place, rename, put deeper and
 * less deep, fold, delete, open the menu, enter a folder or open a project
 * at the element selected, go up, and zoom; and undo and redo what was
 * done on the home. A letter begins a new name for what is selected. The
 * elements of a project's map, shown under its card, are gone through,
 * folded and opened, but not changed: that is done in the project.
 */

import type { Layout } from '$lib/project/diagram/layout';
import { neighbour } from '$lib/project/diagram/layout';
import type { Tree } from '$lib/project/model/tree';
import { keyed, PROVISIONAL } from './owl';

/** What the keys read of the owl map, and ask of it. */
export interface OwlSurface {
  /** The tree as seen from the centre: the owl, or a folder entered. */
  readonly tree: Tree;
  readonly lay: Layout;
  readonly selection: string[];
  select(keys: string[]): void;
  /** A project opens at its top; a folder is entered. */
  open(key: string): void;
  /** To what holds the folder at the centre. */
  up(): void;
  /** Opens the name for writing; with a letter, a new name begun by it. */
  rename(key: string, startingWith?: string): void;
  make(kind: 'project' | 'folder'): void;
  deeper(keys: string[]): void;
  shallower(keys: string[]): void;
  fold(key: string): void;
  remove(keys: string[]): void;
  /** The menu of what is selected, or of the map where nothing is. */
  menu(key: string | null): void;
  fit(): void;
  zoomBy(factor: number): void;
  bringIntoView(key: string): void;
  undo(): void;
  redo(): void;
}

/** Whether a key names what can be renamed, moved and deleted: a folder or a project. */
const thing = (key: string) => {
  const k = keyed(key).kind;
  return k === 'folder' || k === 'project';
};

/** Does what a key does on the owl map. Whether it did something. */
export function pressed(event: KeyboardEvent, owl: OwlSurface): boolean {
  const { tree, lay } = owl;
  // What is being named is not acted on.
  const selection = owl.selection.filter((k) => k !== PROVISIONAL);
  const mod = event.ctrlKey || event.metaKey;
  const last = selection[selection.length - 1] ?? null;
  // What stands at the centre is where one is: it is renamed, but not moved or deleted from here.
  const things = selection.filter((k) => thing(k) && k !== tree.root);
  const onElement = !!last && keyed(last).kind === 'element';

  if (mod && !event.altKey) {
    const key = event.key.toLowerCase();
    if (key === 'z' && !event.shiftKey) owl.undo();
    else if (key === 'y' || (key === 'z' && event.shiftKey)) owl.redo();
    else if (key === 'a') owl.select(lay.order.filter((k) => k !== tree.root));
    else if (key === '0') owl.fit();
    else if (key === '=' || key === '+') owl.zoomBy(1.2);
    else if (key === '-') owl.zoomBy(1 / 1.2);
    // Ctrl+Enter a new project, and with Shift a new folder, as the new element after and under.
    else if (key === 'enter') owl.make(event.shiftKey ? 'folder' : 'project');
    else return false;
    return true;
  }

  // Alt+Shift and the arrows up and down go in and out.
  if (event.altKey && event.shiftKey && !mod && event.key.startsWith('Arrow')) {
    if (event.key === 'ArrowUp') owl.up();
    else if (event.key === 'ArrowDown' && last && last !== tree.root && (thing(last) || onElement))
      owl.open(last);
    return true;
  }

  // Alt and the arrows sideways put deeper and less deep, as the arrow
  // points on the screen. Up and down change no order: folders and projects
  // stand by their names. Elements are moved in their project, not here.
  if (event.altKey && !event.shiftKey && !mod && event.key.startsWith('Arrow')) {
    if (!last || onElement || !things.length) return true;
    const outwards = lay.placed.get(last)?.side === 'left' ? 'ArrowLeft' : 'ArrowRight';
    const inwards = outwards === 'ArrowLeft' ? 'ArrowRight' : 'ArrowLeft';
    if (event.key === outwards) owl.deeper(things);
    else if (event.key === inwards) owl.shallower(things);
    return true;
  }

  if (event.key === 'ContextMenu' || (event.key === 'F10' && event.shiftKey)) {
    owl.menu(last);
    return true;
  }

  switch (event.key) {
    case 'Enter':
      if (event.altKey) return false;
      // An element is its project's: what is made on this map is not made in a project.
      if (!onElement) owl.make('project');
      break;
    case 'Tab':
      if (event.shiftKey) return false;
      if (!onElement) owl.make('folder');
      break;
    case 'F2':
      if (last && thing(last)) owl.rename(last);
      break;
    case ' ':
      // A folder folded, a project's map shown or hidden, an element folded.
      if (last && last !== tree.root && keyed(last).kind !== 'owl') owl.fold(last);
      break;
    case 'Delete':
    case 'Backspace':
      if (things.length) owl.remove(things);
      break;
    case 'Escape':
      if (!selection.length) return false;
      owl.select([]);
      break;
    case 'ArrowLeft':
    case 'ArrowRight':
    case 'ArrowUp':
    case 'ArrowDown': {
      if (!last) {
        owl.select([tree.root]);
        break;
      }
      const direction = event.key.slice(5).toLowerCase() as 'left' | 'right' | 'up' | 'down';
      const next = neighbour(lay, last, direction);
      if (next) {
        owl.select(event.shiftKey ? [...selection.filter((s) => s !== next), next] : [next]);
        owl.bringIntoView(next);
      }
      break;
    }
    default:
      // A letter begins a new name for what is selected.
      if (
        last &&
        thing(last) &&
        selection.length === 1 &&
        event.key.length === 1 &&
        !event.altKey &&
        /\S/.test(event.key)
      ) {
        owl.rename(last, event.key);
        break;
      }
      return false;
  }
  return true;
}
