/**
 * What the editors ask of the interface around them: a place to pick a work
 * to cite, to change a citation, to write a note. The panels are mounted once,
 * by `EditorHost.svelte`.
 */

import type { EditorView } from 'prosemirror-view';
import type { RectLike } from '$lib/ui/floating';
import type { CiteItem, CiteMode } from './schema';

export interface PickRequest {
  anchor: RectLike;
  /** Ids that are already in the citation, and are not offered again. */
  exclude?: string[];
  /** What the panel is for, in a few words: shown above the field. */
  purpose?: string;
  onpick: (id: string) => void;
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
    this.closeCitation();
    this.selection = null;
  }
}

export const editorUi = new EditorUi();

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
