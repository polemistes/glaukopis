/**
 * What the keys do in the list of projects at the left, as they do in the
 * diagram and the text (ADR 0062, 0063): one row is
 * selected, and the keys go about the rows, fold, make, move, enter, rename,
 * delete and open the menu. Pure, over a surface the list gives, so that it
 * can be tested without the interface.
 */

/** A row of the list as the keys see it. */
export interface ListRow {
  key: string;
  kind: 'folder' | 'project' | 'element';
  /** The row it stands under; none at the top. */
  parent: string | null;
  /** Whether anything can be shown under it. */
  holds: boolean;
  /** Whether what is under it is shown. */
  unfolded: boolean;
  /** Whether it can be renamed and deleted from here: not a project that is shown, not an element. */
  changeable: boolean;
  /** An element of a project shown in a side, which moves as it does in the project. */
  own: boolean;
}

/** What the keys read of the list, and ask of it. */
export interface ListSurface {
  /** The rows as they stand, top to bottom. */
  readonly rows: ListRow[];
  readonly selected: string | null;
  select(key: string): void;
  /** Folds what is under the row, or unfolds it. */
  toggle(key: string): void;
  /** Where anything is unfolded, folds it all; else unfolds every folder. */
  foldAll(): void;
  /** A new project or folder, beside or in the row selected, named in place. */
  make(kind: 'project' | 'folder'): void;
  /** An element of the open project, up or down among those beside it. */
  shift(key: string, by: -1 | 1): void;
  /** Into the folder before it, or under the element before it. */
  deeper(key: string): void;
  /** Out of its folder, or one level less deep. */
  shallower(key: string): void;
  /** What a click on the row does: open a project, enter an element, fold a folder. */
  open(key: string): void;
  /** Up from where one is: over the element in view in the side that has the focus. */
  up(): void;
  rename(key: string, startingWith?: string): void;
  remove(key: string): void;
  menu(key: string): void;
  bringIntoView(key: string): void;
}

/** Does what a key does in the list. Whether it did something. */
export function pressed(event: KeyboardEvent, list: ListSurface): boolean {
  const { rows } = list;
  const mod = event.ctrlKey || event.metaKey;
  const at = rows.findIndex((r) => r.key === list.selected);
  const row = at >= 0 ? rows[at] : null;
  const go = (key: string | undefined) => {
    if (!key) return;
    list.select(key);
    list.bringIntoView(key);
  };

  if (mod) return false;

  if (event.altKey && event.key === 'Enter') {
    list.make(event.shiftKey ? 'folder' : 'project');
    return true;
  }

  // Alt+Shift and the arrows up and down go in and out.
  if (event.altKey && event.shiftKey && event.key.startsWith('Arrow')) {
    if (event.key === 'ArrowUp') list.up();
    else if (event.key === 'ArrowDown' && row) list.open(row.key);
    return true;
  }

  // Alt and the arrows move what is selected: up and down an element of the
  // open project; right deeper, left less deep.
  if (event.altKey && event.key.startsWith('Arrow')) {
    if (!row) return true;
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      if (row.own) list.shift(row.key, event.key === 'ArrowUp' ? -1 : 1);
    } else if (row.changeable || row.own) {
      if (event.key === 'ArrowRight') list.deeper(row.key);
      else list.shallower(row.key);
    }
    return true;
  }
  if (event.altKey) return false;

  if (event.key === 'ContextMenu' || (event.key === 'F10' && event.shiftKey)) {
    if (row) list.menu(row.key);
    return true;
  }

  // Under X, Shift+Tab arrives by another name: Tab is known by where it is on the keyboard.
  const key = event.code === 'Tab' ? 'Tab' : event.key;
  switch (key) {
    case 'ArrowUp':
      go(row ? rows[at - 1]?.key : rows[0]?.key);
      break;
    case 'ArrowDown':
      go(row ? rows[at + 1]?.key : rows[0]?.key);
      break;
    case 'ArrowLeft':
      if (row?.parent) go(row.parent);
      break;
    case 'ArrowRight':
      if (row?.holds && row.unfolded) go(rows[at + 1]?.key);
      break;
    case 'Tab':
      if (event.shiftKey) list.foldAll();
      else if (row?.holds) list.toggle(row.key);
      break;
    case 'Enter':
      if (row) list.open(row.key);
      break;
    case 'F2':
      if (row?.changeable) list.rename(row.key);
      break;
    case 'Delete':
      if (row?.changeable) list.remove(row.key);
      break;
    default:
      // A letter begins a new name for what is selected.
      if (row?.changeable && event.key.length === 1 && /\S/.test(event.key)) {
        list.rename(row.key, event.key);
        break;
      }
      return false;
  }
  return true;
}
