/**
 * What the editors ask of the interface around them: a place to pick a work
 * to cite, to change a citation, to write a note. The panels are mounted once,
 * by `EditorHost.svelte`.
 */

import type { EditorView } from 'prosemirror-view';
import type { RectLike } from '$lib/ui/floating';
import type { Pointed } from '$lib/figures/numbering.svelte';
import type { EditorHooks } from './plugins';
import type { CiteItem, CiteMode } from './schema';

export interface PickRequest {
  anchor: RectLike;
  /** Ids that are already in the citation, and are not offered again. */
  exclude?: string[];
  /** What the panel is for, in a few words: shown above the field. */
  purpose?: string;
  /** Words that are written in the search already, to be changed. */
  query?: string;
  onpick: (id: string) => void;
  oncancel?: () => void;
}

/** A request for something to point to, in the document of a map. */
export interface TargetRequest {
  anchor: RectLike;
  /** The map whose document it is. */
  map: string;
  onpick: (target: Pointed) => void;
  oncancel?: () => void;
}

export interface CitationRequest {
  anchor: RectLike;
  items: CiteItem[];
  mode: CiteMode;
  /** The item whose place in the work is to be typed at once. */
  focus?: number;
  onchange: (items: CiteItem[], mode: CiteMode) => void;
  onclose: () => void;
}

/** The selection of the editor that has the focus, for the bar that formats it. */
export interface ActiveSelection {
  view: EditorView;
  empty: boolean;
  rect: RectLike;
  marks: Record<string, boolean>;
  quote: boolean;
  list: boolean;
  /** Whether the editor can hold notes and citations: the text of an element can, its name and a note cannot hold notes. */
  kind: 'body' | 'title' | 'note';
}

class EditorUi {
  picking = $state.raw<PickRequest | null>(null);
  citation = $state.raw<CitationRequest | null>(null);
  pointing = $state.raw<TargetRequest | null>(null);
  selection = $state.raw<ActiveSelection | null>(null);
  /** True while the pointer is held down in an editor: the bar waits for the selection to be made. */
  selecting = $state(false);

  pick(request: PickRequest) {
    this.picking?.oncancel?.();
    this.picking = request;
  }

  closePicker(cancelled = true) {
    const p = this.picking;
    this.picking = null;
    if (cancelled) p?.oncancel?.();
  }

  pickTarget(request: TargetRequest) {
    this.pointing?.oncancel?.();
    this.pointing = request;
  }

  closeTargets(cancelled = true) {
    const p = this.pointing;
    this.pointing = null;
    if (cancelled) p?.oncancel?.();
  }

  editCitation(request: CitationRequest) {
    this.citation?.onclose();
    this.citation = request;
  }

  closeCitation() {
    const c = this.citation;
    this.citation = null;
    c?.onclose();
  }

  closeAll() {
    this.closePicker();
    this.closeTargets();
    this.closeCitation();
    this.selection = null;
  }
}

export const editorUi = new EditorUi();

/**
 * The editors in which the cursor is being moved by a key, for as long as
 * the key is seen to. What the cursor selects on its way (a note, a
 * formula, a figure) is selected and not opened: see `passing`. Backspace
 * and Delete select what they come to before they take it away, and so
 * are among these keys.
 */
const moving = new WeakSet<EditorView>();

/** A key went down in an editor. */
export function keyWent(view: EditorView, event: KeyboardEvent) {
  if (!/^(Arrow|Home$|End$|PageUp$|PageDown$|Backspace$|Delete$)/.test(event.key)) return;
  moving.add(view);
  setTimeout(() => moving.delete(view), 0);
}

/**
 * Whether what is selected now was selected by the cursor passing, moved by
 * the arrows. It is then not opened: the writer is on the way through the
 * text, and Enter opens what the cursor has stopped at.
 */
export function passing(view: EditorView): boolean {
  return moving.has(view);
}

/**
 * Selects without opening what is selected: as the cursor passing does, for
 * a search that shows where something was found (`search/`).
 */
export function quietly(view: EditorView, change: () => void) {
  moving.add(view);
  try {
    change();
  } finally {
    moving.delete(view);
  }
}

/** The name of what is said to what is selected, to have it opened: see `openSelected`. */
export const OPEN = 'glaukopis-open';

/**
 * The name of what is said to a note to have it opened with a part of its
 * text selected, `{ from, to, focus }` in the note's own positions; with
 * `focus`, the cursor goes there. A search shows so what it found in a note.
 */
export const SHOW = 'glaukopis-show';

export interface ShowIn {
  from: number;
  to: number;
  focus: boolean;
}

/** What each editor was given to reach the world outside it. Notes use their editor's. */
export const hooksOf = new WeakMap<EditorView, EditorHooks>();

/** The editor that a part of the page belongs to, for what is dropped on it. */
export const viewsByDom = new WeakMap<Element, EditorView>();

export function rectAt(view: EditorView, pos: number): RectLike {
  const c = view.coordsAtPos(pos);
  return {
    left: c.left,
    right: c.right,
    top: c.top,
    bottom: c.bottom,
    width: c.right - c.left,
    height: c.bottom - c.top,
  };
}
