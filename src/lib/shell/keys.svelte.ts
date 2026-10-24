/**
 * The keys of the application, in one table: what each does, and where it
 * holds. The table is what the sheet of keys (Ctrl+/) and the palette of
 * commands (Ctrl+K) show, and what a test looks through for two that clash.
 *
 * The keys that hold everywhere and in a project are also done from here:
 * a view binds what a key does while it is there (`bind`), and the window
 * hands every key to `handle`. The keys of the diagram, of the text and of
 * the editors are done where they are, by those who know the element or the
 * cursor; they are in the table so that they are shown, and seen to clash.
 *
 * The table writes the keys as they are on a PC: `Ctrl` is the key commands
 * are given with, which is Cmd on a Mac. What is shown of them, in a menu,
 * a tooltip or the sheet, is written by `keyLabel`, as the computer names
 * them; a menu takes the keys of an entry from here by `keysFor`, so that
 * the table is the one place a key is written.
 */

import { onMac } from './platform.svelte';

/** Where a key holds. */
export type Place =
  | 'everywhere'
  | 'project'
  | 'review'
  | 'tree'
  | 'diagram'
  | 'list'
  | 'text'
  | 'writing'
  | 'library'
  | 'store'
  | 'files';

export interface KeyEntry {
  /** What it is called, and the words for it: `keys-<id>` in keys.ftl. */
  id: string;
  /** As they are pressed and shown: `Ctrl+Shift+R`, `F8`, `Alt+Shift+↑↓←→`. Empty for what has no key, and is done from the palette. */
  keys: string;
  place: Place;
  /** Done here, where the view binds it; otherwise by the view itself, and only shown here. */
  bound?: boolean;
  /** Not taken while one writes in a field or a text, which has a key of its own for it. */
  notInFields?: boolean;
  /** Keys of other entries that hold where this one does, and that this one takes precedence over. */
  over?: readonly string[];
}

/**
 * Places whose keys are in force together: a key must mean one thing in
 * each. Each pair is named on both sides, which a test holds to.
 */
export const TOGETHER: Readonly<Record<Place, readonly Place[]>> = {
  everywhere: [
    'everywhere',
    'project',
    'review',
    'tree',
    'diagram',
    'list',
    'text',
    'writing',
    'library',
    'store',
    'files',
  ],
  project: ['everywhere', 'project', 'review', 'tree', 'diagram', 'list', 'text', 'writing'],
  review: ['everywhere', 'project', 'review', 'tree', 'text', 'writing'],
  tree: ['everywhere', 'project', 'review', 'tree', 'diagram', 'list', 'text', 'writing'],
  diagram: ['everywhere', 'project', 'tree', 'diagram'],
  list: ['everywhere', 'project', 'tree', 'list'],
  text: ['everywhere', 'project', 'review', 'tree', 'text', 'writing'],
  writing: ['everywhere', 'project', 'review', 'tree', 'text', 'writing'],
  library: ['everywhere', 'library'],
  store: ['everywhere', 'store'],
  files: ['everywhere', 'files'],
};

const ENTRIES = [
  // Everywhere.
  { id: 'projects', keys: 'Ctrl+1', place: 'everywhere', bound: true },
  { id: 'library', keys: 'Ctrl+2', place: 'everywhere', bound: true },
  { id: 'pictures', keys: 'Ctrl+3', place: 'everywhere', bound: true },
  { id: 'files', keys: 'Ctrl+4', place: 'everywhere', bound: true },
  { id: 'settings', keys: 'Ctrl+,', place: 'everywhere', bound: true },
  { id: 'search-everything', keys: 'Ctrl+Shift+F', place: 'everywhere', bound: true },
  { id: 'palette', keys: 'Ctrl+K', place: 'everywhere', bound: true },
  { id: 'sheet', keys: 'Ctrl+/', place: 'everywhere', bound: true },

  // In a project.
  { id: 'diagram-or-text', keys: 'Ctrl+D', place: 'project', bound: true },
  // L for the list of projects.
  { id: 'projects-pane', keys: 'Ctrl+Shift+L', place: 'project', bound: true },
  { id: 'preview', keys: 'Ctrl+P', place: 'project', bound: true },
  { id: 'document-settings', keys: 'Ctrl+Shift+D', place: 'project', bound: true },
  { id: 'what-document', keys: '', place: 'project', bound: true },
  { id: 'side-look', keys: 'Ctrl+Shift+A', place: 'project', bound: true },
  { id: 'look-type', keys: '', place: 'project', bound: true },
  { id: 'side-references', keys: 'Ctrl+Shift+R', place: 'project', bound: true },
  { id: 'side-pictures', keys: 'Ctrl+Shift+P', place: 'project', bound: true },
  { id: 'side-comments', keys: 'Ctrl+Shift+M', place: 'project', bound: true },
  { id: 'comment', keys: 'Ctrl+Alt+C', place: 'project', bound: true },
  { id: 'side-history', keys: 'Ctrl+Shift+H', place: 'project', bound: true },
  { id: 'side-changes', keys: 'Ctrl+Shift+E', place: 'project', bound: true },
  // Not Ctrl+Shift+U, which the input methods of Linux keep for writing a sign by its number.
  { id: 'side-found', keys: 'Ctrl+Shift+T', place: 'project', bound: true },
  { id: 'find', keys: 'Ctrl+F', place: 'project', bound: true },
  { id: 'replace', keys: 'Ctrl+H', place: 'project', bound: true },
  { id: 'undo', keys: 'Ctrl+Z', place: 'project', bound: true, notInFields: true },
  { id: 'redo', keys: 'Ctrl+Shift+Z', place: 'project', bound: true, notInFields: true },
  { id: 'redo-y', keys: 'Ctrl+Y', place: 'project', bound: true, notInFields: true },
  { id: 'side-by-side', keys: 'Ctrl+Shift+S', place: 'project', bound: true },
  // The side that has the focus closes, as a document closes in every program; with one, the project.
  { id: 'close-side', keys: 'Ctrl+W', place: 'project', bound: true },
  { id: 'switch-sides', keys: '', place: 'project', bound: true },
  { id: 'side-panel', keys: '', place: 'project', bound: true },
  // The marks of whitespace, shown or not in every text of the window: from the palette, and the button of the bar.
  { id: 'writing-marks', keys: '', place: 'project', bound: true },

  // While changes are reviewed.
  { id: 'review-next', keys: 'F8', place: 'review', bound: true },
  { id: 'review-previous', keys: 'Shift+F8', place: 'review', bound: true },
  { id: 'review-accept', keys: 'Ctrl+Alt+Y', place: 'review', bound: true },
  { id: 'review-reject', keys: 'Ctrl+Alt+N', place: 'review', bound: true },

  // In the tree, wherever it is shown: the diagram, the text, the list at
  // the left. One key for each act; Alt+Shift+Up
  // is bound by the project view itself, since the table cannot match an arrow.
  { id: 'tree-new', keys: 'Alt+Enter', place: 'tree' },
  { id: 'tree-new-under', keys: 'Alt+Shift+Enter', place: 'tree' },
  { id: 'tree-fold', keys: 'Tab', place: 'tree', over: ['writing-list-in'] },
  { id: 'tree-fold-all', keys: 'Shift+Tab', place: 'tree', over: ['writing-list-out'] },
  { id: 'tree-shift', keys: 'Alt+↑↓', place: 'tree' },
  { id: 'tree-depth', keys: 'Alt+←→', place: 'tree' },
  { id: 'tree-enter', keys: 'Alt+Shift+↓', place: 'tree' },
  { id: 'tree-up', keys: 'Alt+Shift+↑', place: 'tree' },
  { id: 'tree-open', keys: 'Enter', place: 'tree' },
  { id: 'tree-rename', keys: 'F2', place: 'tree' },
  { id: 'tree-delete', keys: 'Delete', place: 'tree' },
  { id: 'tree-go', keys: '↑↓←→', place: 'tree' },
  { id: 'tree-more', keys: 'Shift+↑↓←→', place: 'tree' },
  { id: 'tree-menu', keys: 'Shift+F10', place: 'tree' },
  { id: 'tree-all', keys: 'Ctrl+A', place: 'tree' },

  // In the diagram, besides the keys of the tree.
  { id: 'diagram-copy', keys: 'Ctrl+C', place: 'diagram' },
  { id: 'diagram-cut', keys: 'Ctrl+X', place: 'diagram' },
  { id: 'diagram-paste', keys: 'Ctrl+V', place: 'diagram' },
  { id: 'diagram-whole', keys: 'Ctrl+0', place: 'diagram' },
  { id: 'diagram-closer', keys: 'Ctrl+=', place: 'diagram' },
  { id: 'diagram-farther', keys: 'Ctrl+-', place: 'diagram' },

  // In the list of projects at the left: the changes of folders and
  // projects are undone there, not those of the project open beside it.
  { id: 'list-undo', keys: 'Ctrl+Z', place: 'list', over: ['undo'] },
  { id: 'list-redo', keys: 'Ctrl+Shift+Z', place: 'list', over: ['redo'] },

  // In the text of a map, besides the keys of the tree.
  { id: 'text-outline', keys: 'Ctrl+Shift+O', place: 'project', bound: true },
  { id: 'text-found-next', keys: 'F3', place: 'text' },
  { id: 'text-found-previous', keys: 'Shift+F3', place: 'text' },

  // Writing, in the text and in the box of an element.
  { id: 'writing-cite', keys: '@', place: 'writing' },
  { id: 'writing-cite-keys', keys: 'Ctrl+Shift+C', place: 'writing' },
  { id: 'writing-italic', keys: 'Ctrl+I', place: 'writing' },
  { id: 'writing-bold', keys: 'Ctrl+B', place: 'writing' },
  { id: 'writing-underline', keys: 'Ctrl+U', place: 'writing' },
  { id: 'writing-smallcaps', keys: 'Ctrl+Shift+K', place: 'writing' },
  { id: 'writing-strike', keys: 'Ctrl+Shift+X', place: 'writing' },
  { id: 'writing-raised', keys: 'Ctrl+.', place: 'writing' },
  { id: 'writing-lowered', keys: 'Ctrl+,', place: 'writing', over: ['settings'] },
  { id: 'writing-quotation', keys: "Ctrl+'", place: 'writing' },
  { id: 'writing-list', keys: 'Ctrl+Shift+8', place: 'writing' },
  { id: 'writing-numbered', keys: 'Ctrl+Shift+7', place: 'writing' },
  { id: 'writing-list-in', keys: 'Tab', place: 'writing' },
  { id: 'writing-list-out', keys: 'Shift+Tab', place: 'writing' },
  { id: 'writing-line', keys: 'Shift+Enter', place: 'writing' },
  // A space at which a line does not break, as every word processor has it.
  { id: 'writing-hard-space', keys: 'Ctrl+Shift+Space', place: 'writing' },
  { id: 'writing-note', keys: 'Ctrl+Alt+F', place: 'writing' },
  { id: 'writing-picture', keys: 'Ctrl+Alt+P', place: 'writing' },
  { id: 'writing-table', keys: 'Ctrl+Alt+T', place: 'writing' },
  { id: 'writing-formula', keys: 'Ctrl+Alt+M', place: 'writing' },
  { id: 'writing-equation', keys: 'Ctrl+Alt+E', place: 'writing' },
  { id: 'writing-crossref', keys: 'Ctrl+Alt+R', place: 'writing' },
  { id: 'writing-refmark', keys: 'Ctrl+Alt+K', place: 'writing' },
  { id: 'writing-spelling', keys: 'F7', place: 'writing' },
  { id: 'writing-spelling-back', keys: 'Shift+F7', place: 'writing' },
  // The editor's own; the project's undo is the same undo.
  { id: 'writing-undo', keys: 'Ctrl+Z', place: 'writing', over: ['undo'] },
  { id: 'writing-redo', keys: 'Ctrl+Shift+Z', place: 'writing', over: ['redo'] },
  { id: 'writing-redo-y', keys: 'Ctrl+Y', place: 'writing', over: ['redo-y'] },

  // Stage 4 of the settings, the zoom and the keys of the kinds: the kinds
  // of paragraph the document type gives the digits, 0 being text (ADR
  // 0066). Done by the editor (`kindKeyOf`), as Word and Google Docs have them.
  { id: 'writing-kind-0', keys: 'Ctrl+Alt+0', place: 'writing' },
  { id: 'writing-kind-1', keys: 'Ctrl+Alt+1', place: 'writing' },
  { id: 'writing-kind-2', keys: 'Ctrl+Alt+2', place: 'writing' },
  { id: 'writing-kind-3', keys: 'Ctrl+Alt+3', place: 'writing' },
  { id: 'writing-kind-4', keys: 'Ctrl+Alt+4', place: 'writing' },
  { id: 'writing-kind-5', keys: 'Ctrl+Alt+5', place: 'writing' },
  { id: 'writing-kind-6', keys: 'Ctrl+Alt+6', place: 'writing' },
  { id: 'writing-kind-7', keys: 'Ctrl+Alt+7', place: 'writing' },
  { id: 'writing-kind-8', keys: 'Ctrl+Alt+8', place: 'writing' },
  { id: 'writing-kind-9', keys: 'Ctrl+Alt+9', place: 'writing' },

  // In the library.
  { id: 'library-find', keys: 'Ctrl+F', place: 'library', bound: true },
  { id: 'library-new', keys: 'Ctrl+N', place: 'library', bound: true },

  // In the store of pictures.
  { id: 'store-find', keys: 'Ctrl+F', place: 'store', bound: true },

  // Among the files of the library.
  { id: 'files-find', keys: 'Ctrl+F', place: 'files', bound: true },
] as const satisfies readonly KeyEntry[];

/** The name of an entry of the table. */
export type KeyId = (typeof ENTRIES)[number]['id'];

export const KEYS: readonly KeyEntry[] = ENTRIES;

/** The keys of an entry, as the table writes them: for a menu or a tooltip, which show them by `keyLabel`. */
export function keysFor(id: KeyId): string {
  return KEYS.find((e) => e.id === id)!.keys;
}

/** The entries of the keys of the kinds, by their digit. */
const KIND_KEY = /^writing-kind-(\d)$/;

/** The digit of an entry of the keys of the kinds; nothing for another. */
export function kindDigitOf(id: string): string | null {
  return KIND_KEY.exec(id)?.[1] ?? null;
}

/** The keys that give a kind of paragraph by a digit, Ctrl+Alt+0 to Ctrl+Alt+9, as the table writes them. */
export function kindKeys(digit: string): string {
  return keysFor(`writing-kind-${digit}` as KeyId);
}

/**
 * The name of the words of an entry in keys.ftl: `keys-<id>`, and one for
 * the ten keys of the kinds, which a sheet shows by the kinds they give.
 */
export function wordsOf(id: string): string {
  return kindDigitOf(id) === null ? `keys-${id}` : 'keys-writing-kind';
}

/**
 * The digit of Ctrl+Alt with a digit, by which the editor gives a
 * paragraph the kind the document type gives the digit; nothing for
 * another key. On Windows, AltGr comes as Ctrl+Alt, and on a Norwegian
 * keyboard AltGr with 2 writes @: what AltGr writes is typing, not a key.
 */
export function kindKeyOf(event: KeyboardEvent): string | null {
  if (event.getModifierState?.('AltGraph')) return null;
  for (const entry of KEYS) {
    const digit = kindDigitOf(entry.id);
    if (digit !== null && matches(entry, event)) return digit;
  }
  return null;
}

/** Whether the keys of two places are in force together, whichever is named first. */
function together(a: Place, b: Place): boolean {
  return TOGETHER[a].includes(b) || TOGETHER[b].includes(a);
}

/** Pairs of entries whose keys mean two things at once, where neither says it takes precedence. */
export function clashes(entries: readonly KeyEntry[] = KEYS): [KeyEntry, KeyEntry][] {
  const found: [KeyEntry, KeyEntry][] = [];
  entries.forEach((a, i) => {
    for (const b of entries.slice(i + 1)) {
      if (!a.keys || a.keys !== b.keys || !together(a.place, b.place)) continue;
      if (a.over?.includes(b.id) || b.over?.includes(a.id)) continue;
      found.push([a, b]);
    }
  });
  return found;
}

// ---- showing the keys ----

const MODIFIERS = /^((?:(?:Ctrl|Mod|Alt|Shift)\+)*)(.+)$/;

/** The names a Mac gives keys, where it has signs for them. */
const MAC_NAMES: Record<string, string> = {
  // Named alone, as a hint names them between its words.
  Ctrl: '⌘',
  Mod: '⌘',
  Alt: '⌥',
  Shift: '⇧',
  Enter: '↩',
  Tab: '⇥',
  Delete: '⌦',
  Del: '⌦',
  Backspace: '⌫',
  Esc: '⎋',
  Escape: '⎋',
};

/**
 * Keys as the table writes them (`Ctrl+Shift+Z`), as a computer names them:
 * the same on Linux and Windows; on a Mac with its signs, in its order and
 * without plus signs, Ctrl being Cmd there (`⇧⌘Z`). What is no keys, as
 * "Double-click", is given back as it is.
 */
export function formatKeys(keys: string, mac: boolean): string {
  const m = MODIFIERS.exec(keys);
  if (!mac || !m) return keys;
  const mods = m[1].split('+');
  const has = (...names: string[]) => names.some((n) => mods.includes(n));
  // The order of a Mac's menus: Control, Option, Shift, Command.
  return (
    (has('Alt') ? '⌥' : '') +
    (has('Shift') ? '⇧' : '') +
    (has('Ctrl', 'Mod') ? '⌘' : '') +
    (MAC_NAMES[m[2]] ?? m[2])
  );
}

/** Keys as the table writes them, as this computer names them: see `formatKeys`. Reactive: it follows what the system says it is. */
export function keyLabel(keys: string): string {
  return formatKeys(keys, onMac());
}

// ---- doing the keys that are bound ----

interface Parsed {
  mod: boolean;
  shift: boolean;
  alt: boolean;
  key: string;
}

function parse(keys: string): Parsed {
  const parts = keys.split('+');
  // `Ctrl+=` and the like: the last part may be the sign itself.
  const key = parts.pop() || '+';
  return {
    mod: parts.includes('Ctrl'),
    shift: parts.includes('Shift'),
    alt: parts.includes('Alt'),
    key: key.toLowerCase(),
  };
}

/** The Latin letter or the digit of the key at a place on the keyboard (`KeyR`, `Digit1`), if it has one. */
function placedOf(code: string | undefined): string | null {
  if (!code) return null;
  if (/^Key[A-Z]$/.test(code)) return code.slice(3).toLowerCase();
  if (/^Digit\d$/.test(code)) return code.slice(5);
  return null;
}

/**
 * The keys an event may be of, as the table names them: by what it writes,
 * and by where it is on the keyboard where what it writes is no Latin
 * letter or digit. Ctrl+Shift+R is found on a Greek keyboard, whose R writes
 * ρ; Ctrl+/ on a Norwegian one, where / is over the 7; and Ctrl+1 on a
 * French one, where the 1 writes &. A key that writes a Latin letter is that
 * letter, wherever it is: Ctrl+Z on a German keyboard, whose Z is where
 * others have the Y, is not Ctrl+Y.
 */
function keysOfEvent(event: KeyboardEvent): string[] {
  const written = event.key.toLowerCase();
  if (/^[a-z0-9]$/.test(written)) return [written];
  const placed = placedOf(event.code);
  return placed && placed !== written ? [written, placed] : [written];
}

/**
 * The key an event is of, for a view that matches a letter itself
 * (Ctrl+A, Ctrl+F): what it writes, where that is a Latin letter or a
 * digit; where it writes another letter, as α on a Greek keyboard or ф on a
 * Russian one, the Latin letter the key has; otherwise the key as the event
 * names it, in small letters (`f3`, `enter`, `/`).
 */
export function keyOf(event: Pick<KeyboardEvent, 'key' | 'code'>): string {
  const written = event.key.toLowerCase();
  if (/^[a-z0-9]$/.test(written)) return written;
  const placed = /^\p{L}$/u.test(written) ? placedOf(event.code) : null;
  return placed && !/\d/.test(placed) ? placed : written;
}

export function matches(entry: KeyEntry, event: KeyboardEvent): boolean {
  if (!entry.keys) return false;
  const want = parse(entry.keys);
  // A sign is where the keyboard has it, with Shift or without: `/` is Shift+7 on a Norwegian one.
  const sign = want.key.length === 1 && !/[a-z0-9]/.test(want.key);
  return (
    want.mod === (event.ctrlKey || event.metaKey) &&
    (want.shift === event.shiftKey || (sign && !want.shift)) &&
    want.alt === event.altKey &&
    keysOfEvent(event).includes(want.key)
  );
}

export interface Binding {
  run: (event: KeyboardEvent) => void;
  /** Whether it can be done now; a key that cannot is left to others. */
  when?: () => boolean;
}

class Shortcuts {
  /** What is bound, by the id of its entry: the last bound is done. */
  #bound = new Map<string, Binding[]>();
  /** Rises when what is bound changes, for the palette. */
  revision = $state(0);

  /** Binds what keys do while a view is there. Gives what unbinds them. */
  bind(bindings: Record<string, Binding | Binding['run']>): () => void {
    const made: [string, Binding][] = Object.entries(bindings).map(([id, b]) => [
      id,
      typeof b === 'function' ? { run: b } : b,
    ]);
    for (const [id, b] of made) {
      if (!KEYS.some((e) => e.id === id)) throw new Error(`No key is called “${id}”`);
      this.#bound.set(id, [...(this.#bound.get(id) ?? []), b]);
    }
    this.revision++;
    return () => {
      for (const [id, b] of made) {
        const left = (this.#bound.get(id) ?? []).filter((x) => x !== b);
        if (left.length) this.#bound.set(id, left);
        else this.#bound.delete(id);
      }
      this.revision++;
    };
  }

  /** What is bound to an entry and can be done now. */
  binding(id: string): Binding | null {
    const list = this.#bound.get(id);
    const b = list?.[list.length - 1];
    return b && (!b.when || b.when()) ? b : null;
  }

  /** Does what a key is bound to. Returns whether it was taken. */
  handle(event: KeyboardEvent): boolean {
    // What a view nearer the focus has done with the key is not done again.
    if (event.defaultPrevented) return false;
    // On Windows, AltGr comes as Ctrl+Alt: what it writes is no key of ours.
    if (event.getModifierState?.('AltGraph')) return false;
    const target = event.target as HTMLElement | null;
    const writing = !!target?.closest?.(
      'input, textarea, select, [contenteditable="true"], .prose',
    );
    for (const entry of KEYS) {
      if (!entry.bound || (entry.notInFields && writing) || !matches(entry, event)) continue;
      const b = this.binding(entry.id);
      if (!b) continue;
      event.preventDefault();
      b.run(event);
      return true;
    }
    return false;
  }
}

export const shortcuts = new Shortcuts();

/** Whether the sheet of keys, or the palette of commands, is open: one at a time. */
class KeysUi {
  sheet = $state(false);
  palette = $state(false);

  toggleSheet() {
    this.palette = false;
    this.sheet = !this.sheet;
  }

  togglePalette() {
    this.sheet = false;
    this.palette = !this.palette;
  }
}

export const keysUi = new KeysUi();
