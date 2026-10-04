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
 */

/** Where a key holds. */
export type Place =
  'everywhere' | 'project' | 'review' | 'diagram' | 'text' | 'writing' | 'library' | 'store';

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
  over?: string[];
}

/** Places whose keys are in force together: a key must mean one thing in each. */
const TOGETHER: Record<Place, Place[]> = {
  everywhere: ['everywhere', 'project', 'review', 'diagram', 'text', 'writing', 'library'],
  project: ['everywhere', 'project', 'review', 'diagram', 'text', 'writing'],
  review: ['everywhere', 'project', 'review', 'text', 'writing'],
  diagram: ['everywhere', 'project', 'diagram'],
  text: ['everywhere', 'project', 'review', 'text', 'writing'],
  writing: ['everywhere', 'project', 'review', 'text', 'writing'],
  library: ['everywhere', 'library'],
  store: ['everywhere', 'store'],
};

export const KEYS: KeyEntry[] = [
  // Everywhere.
  { id: 'projects', keys: 'Ctrl+1', place: 'everywhere', bound: true },
  { id: 'library', keys: 'Ctrl+2', place: 'everywhere', bound: true },
  { id: 'pictures', keys: 'Ctrl+3', place: 'everywhere', bound: true },
  { id: 'settings', keys: 'Ctrl+,', place: 'everywhere', bound: true },
  { id: 'search-everything', keys: 'Ctrl+Shift+F', place: 'everywhere', bound: true },
  { id: 'palette', keys: 'Ctrl+K', place: 'everywhere', bound: true },
  { id: 'sheet', keys: 'Ctrl+/', place: 'everywhere', bound: true },

  // In a project.
  { id: 'diagram-or-text', keys: 'Ctrl+D', place: 'project', bound: true },
  { id: 'preview', keys: 'Ctrl+P', place: 'project', bound: true },
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
  { id: 'side-by-side', keys: '', place: 'project', bound: true },
  { id: 'side-panel', keys: '', place: 'project', bound: true },
  { id: 'share', keys: '', place: 'project', bound: true },

  // While changes are reviewed.
  { id: 'review-next', keys: 'F8', place: 'review', bound: true },
  { id: 'review-previous', keys: 'Shift+F8', place: 'review', bound: true },
  { id: 'review-accept', keys: 'Ctrl+Alt+Y', place: 'review', bound: true },
  { id: 'review-reject', keys: 'Ctrl+Alt+N', place: 'review', bound: true },

  // In the diagram.
  { id: 'diagram-child', keys: 'Tab', place: 'diagram' },
  { id: 'diagram-sibling', keys: 'Enter', place: 'diagram' },
  { id: 'diagram-open', keys: 'Alt+Enter', place: 'diagram' },
  { id: 'diagram-rename', keys: 'F2', place: 'diagram' },
  { id: 'diagram-fold', keys: 'Space', place: 'diagram' },
  { id: 'diagram-delete', keys: 'Delete', place: 'diagram' },
  { id: 'diagram-go', keys: '↑↓←→', place: 'diagram' },
  { id: 'diagram-more', keys: 'Shift+↑↓←→', place: 'diagram' },
  { id: 'diagram-move', keys: 'Alt+Shift+↑↓←→', place: 'diagram' },
  { id: 'diagram-menu', keys: 'Shift+F10', place: 'diagram' },
  { id: 'diagram-all', keys: 'Ctrl+A', place: 'diagram' },
  { id: 'diagram-copy', keys: 'Ctrl+C', place: 'diagram' },
  { id: 'diagram-paste', keys: 'Ctrl+V', place: 'diagram' },
  { id: 'diagram-whole', keys: 'Ctrl+0', place: 'diagram' },
  { id: 'diagram-closer', keys: 'Ctrl+=', place: 'diagram' },
  { id: 'diagram-farther', keys: 'Ctrl+-', place: 'diagram' },

  // In the text of a map.
  { id: 'text-new', keys: 'Ctrl+Enter', place: 'text', over: ['writing-break'] },
  // As in Org mode: the same, and one under; the arrows with Alt alone move the element.
  { id: 'text-new-after', keys: 'Alt+Enter', place: 'text' },
  { id: 'text-new-under', keys: 'Alt+Shift+Enter', place: 'text' },
  { id: 'text-deeper', keys: 'Tab', place: 'text', over: ['writing-list-in'] },
  { id: 'text-shallower', keys: 'Shift+Tab', place: 'text', over: ['writing-list-out'] },
  { id: 'text-move', keys: 'Alt+Shift+↑↓←→', place: 'text' },
  { id: 'text-move-alt', keys: 'Alt+↑↓←→', place: 'text' },
  { id: 'text-outline', keys: 'Ctrl+Shift+O', place: 'project', bound: true },
  { id: 'text-fold', keys: 'Ctrl+Alt+U', place: 'text' },
  { id: 'text-unfold-all', keys: 'Ctrl+Alt+Shift+U', place: 'text' },
  { id: 'text-found-next', keys: 'F3', place: 'text' },
  { id: 'text-found-previous', keys: 'Shift+F3', place: 'text' },

  // Writing, in the text and in the box of an element.
  { id: 'writing-cite', keys: '@', place: 'writing' },
  { id: 'writing-cite-keys', keys: 'Ctrl+Shift+C', place: 'writing' },
  { id: 'writing-italic', keys: 'Ctrl+I', place: 'writing' },
  { id: 'writing-bold', keys: 'Ctrl+B', place: 'writing' },
  { id: 'writing-smallcaps', keys: 'Ctrl+Shift+K', place: 'writing' },
  { id: 'writing-strike', keys: 'Ctrl+Shift+X', place: 'writing' },
  { id: 'writing-raised', keys: 'Ctrl+.', place: 'writing' },
  { id: 'writing-lowered', keys: 'Ctrl+,', place: 'writing', over: ['settings'] },
  { id: 'writing-quotation', keys: "Ctrl+'", place: 'writing' },
  { id: 'writing-list', keys: 'Ctrl+Shift+8', place: 'writing' },
  { id: 'writing-numbered', keys: 'Ctrl+Shift+7', place: 'writing' },
  { id: 'writing-list-in', keys: 'Tab', place: 'writing' },
  { id: 'writing-list-out', keys: 'Shift+Tab', place: 'writing' },
  { id: 'writing-break', keys: 'Ctrl+Enter', place: 'writing' },
  { id: 'writing-line', keys: 'Shift+Enter', place: 'writing' },
  { id: 'writing-note', keys: 'Ctrl+Alt+F', place: 'writing' },
  { id: 'writing-picture', keys: 'Ctrl+Alt+P', place: 'writing' },
  { id: 'writing-table', keys: 'Ctrl+Alt+T', place: 'writing' },
  { id: 'writing-formula', keys: 'Ctrl+Alt+M', place: 'writing' },
  { id: 'writing-equation', keys: 'Ctrl+Alt+E', place: 'writing' },
  { id: 'writing-crossref', keys: 'Ctrl+Alt+R', place: 'writing' },
  { id: 'writing-spelling', keys: 'F7', place: 'writing' },
  { id: 'writing-spelling-back', keys: 'Shift+F7', place: 'writing' },
  // The editor's own; the project's undo is the same undo.
  { id: 'writing-undo', keys: 'Ctrl+Z', place: 'writing', over: ['undo'] },
  { id: 'writing-redo', keys: 'Ctrl+Shift+Z', place: 'writing', over: ['redo'] },
  { id: 'writing-redo-y', keys: 'Ctrl+Y', place: 'writing', over: ['redo-y'] },

  // In the library.
  { id: 'library-find', keys: 'Ctrl+F', place: 'library', bound: true },
  { id: 'library-new', keys: 'Ctrl+N', place: 'library', bound: true },

  // In the store of pictures.
  { id: 'store-find', keys: 'Ctrl+F', place: 'store', bound: true },
];

/** Pairs of entries whose keys mean two things at once, where neither says it takes precedence. */
export function clashes(entries: KeyEntry[] = KEYS): [KeyEntry, KeyEntry][] {
  const found: [KeyEntry, KeyEntry][] = [];
  entries.forEach((a, i) => {
    for (const b of entries.slice(i + 1)) {
      if (!a.keys || a.keys !== b.keys || !TOGETHER[a.place].includes(b.place)) continue;
      if (a.over?.includes(b.id) || b.over?.includes(a.id)) continue;
      found.push([a, b]);
    }
  });
  return found;
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

/**
 * The key an event is of, as the table names it: by what it writes, and by
 * where it is on the keyboard. Ctrl+Shift+R is found on a Greek keyboard,
 * whose R writes ρ; Ctrl+/ on a Norwegian one, where / is over the 7; and
 * Ctrl+1 on a French one, where the 1 writes &.
 */
function keysOf(event: KeyboardEvent): string[] {
  const written = event.key.toLowerCase();
  const placed = /^Key[A-Z]$/.test(event.code)
    ? event.code.slice(3).toLowerCase()
    : /^Digit\d$/.test(event.code)
      ? event.code.slice(5)
      : null;
  return placed && placed !== written ? [written, placed] : [written];
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
    keysOf(event).includes(want.key)
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
