/**
 * Reference marks in the text: a verse of the Bible (3:16), a page of
 * Stephanus (327a), a number of Bekker. A mark is put in from the Insert
 * menu or by its key, with a label the writer gives, which begins as the
 * one that follows the mark before it; it is changed by clicking it. How
 * the marks are set the layout says. See ADR 0039.
 */

import type { Node } from 'prosemirror-model';
import { NodeSelection, TextSelection, type Command, type EditorState } from 'prosemirror-state';
import type { EditorView, NodeView } from 'prosemirror-view';
import { OPEN, editorUi, rectAt } from './ui.svelte';

/**
 * The label that follows another: the last number in it counted on
 * ("3:16" → "3:17", "1094a1" → "1094a2"), or the letter at its end after a
 * number ("327a" → "327b"). Nothing where neither can be.
 */
export function nextLabel(label: string): string {
  const numbered = /^(.*?)(\d+)$/.exec(label);
  if (numbered) {
    const [, before, digits] = numbered;
    const n = String(Number(digits) + 1);
    return `${before}${n.padStart(digits.length, '0')}`;
  }
  const lettered = /^(.*\d)([a-y])$/i.exec(label);
  if (lettered) return `${lettered[1]}${String.fromCharCode(lettered[2].charCodeAt(0) + 1)}`;
  return '';
}

/** The label of the last mark before `pos`, if there is one. */
export function labelBefore(doc: Node, pos: number): string | null {
  let last: string | null = null;
  doc.nodesBetween(0, Math.min(pos, doc.content.size), (node, at) => {
    if (node.type.name === 'refmark' && at < pos) last = String(node.attrs.label ?? '');
    return true;
  });
  return last;
}

/** A reference mark with this label where the cursor is, in place of what is selected. */
export function insertRefMark(label: string): Command {
  return (state, dispatch) => {
    const type = state.schema.nodes.refmark;
    const given = label.trim();
    if (!type || !given) return false;
    const { $from, $to } = state.selection;
    if (!$from.sameParent($to) || !$from.parent.inlineContent) return false;
    if (!$from.parent.canReplaceWith($from.index(), $to.index(), type)) return false;
    if (dispatch)
      dispatch(
        state.tr.replaceSelectionWith(type.create({ label: given }), false).scrollIntoView(),
      );
    return true;
  };
}

/** Whether a reference mark can stand where the cursor is. */
export function canMark(state: EditorState): boolean {
  return insertRefMark('1')(state);
}

/**
 * Asks for the label of a reference mark: of a new one where the cursor is,
 * or, with `pos`, of the one that stands there, which can then be taken away.
 */
export function askRefMark(view: EditorView, pos?: number): boolean {
  const there = pos === undefined ? null : view.state.doc.nodeAt(pos);
  const editing = there?.type.name === 'refmark' ? there : null;
  if (!editing && !canMark(view.state)) return false;
  const from = pos ?? view.state.selection.from;
  const before = labelBefore(view.state.doc, from);
  editorUi.markRef({
    anchor: rectAt(view, from),
    label: editing ? String(editing.attrs.label) : before ? nextLabel(before) : '',
    editing: !!editing,
    onset: (label) => {
      if (view.isDestroyed) return;
      if (editing && pos !== undefined) {
        const node = view.state.doc.nodeAt(pos);
        if (node?.type.name !== 'refmark') return;
        const tr = label.trim()
          ? view.state.tr.setNodeMarkup(pos, undefined, { label: label.trim() })
          : view.state.tr.delete(pos, pos + node.nodeSize);
        // The writing goes on after the mark, or where it was.
        const after = label.trim() ? pos + node.nodeSize : pos;
        view.dispatch(tr.setSelection(TextSelection.create(tr.doc, after)));
      } else insertRefMark(label)(view.state, view.dispatch);
      focusAfter(view);
    },
    oncancel: () => focusAfter(view),
  });
  return true;
}

/** Gives the editor the cursor again once the dialog is gone: while it is open, what is outside it cannot have it. */
function focusAfter(view: EditorView) {
  setTimeout(() => {
    if (!view.isDestroyed) view.focus();
  }, 0);
}

/** The key of a new reference mark. */
export const refMarkKey: Command = (_state, _dispatch, view) => (view ? askRefMark(view) : false);

/** A reference mark in an editor: its label, which is changed by clicking it. */
export class RefMarkView implements NodeView {
  dom: HTMLElement;
  #node: Node;
  #view: EditorView;
  #getPos: () => number | undefined;

  constructor(node: Node, view: EditorView, getPos: () => number | undefined) {
    this.#node = node;
    this.#view = view;
    this.#getPos = getPos;
    this.dom = document.createElement('span');
    this.dom.className = 'refmark';
    this.dom.contentEditable = 'false';
    this.dom.setAttribute('role', 'button');
    this.#draw();
    this.dom.addEventListener('click', this.#open);
    // Selected, it is opened by Enter.
    this.dom.addEventListener(OPEN, this.#open);
  }

  #draw() {
    const label = String(this.#node.attrs.label ?? '');
    this.dom.textContent = label;
    this.dom.dataset.refmark = label;
  }

  #open = (event: Event) => {
    event.preventDefault();
    if (!this.#view.editable) return;
    const pos = this.#getPos();
    if (pos === undefined) return;
    // Selected while it is asked about, so that the place is seen.
    this.#view.dispatch(
      this.#view.state.tr.setSelection(NodeSelection.create(this.#view.state.doc, pos)),
    );
    askRefMark(this.#view, pos);
  };

  update(node: Node): boolean {
    if (node.type !== this.#node.type) return false;
    if (node.attrs.label !== this.#node.attrs.label) {
      this.#node = node;
      this.#draw();
    }
    this.#node = node;
    return true;
  }

  selectNode() {
    this.dom.classList.add('ProseMirror-selectednode');
  }

  deselectNode() {
    this.dom.classList.remove('ProseMirror-selectednode');
  }

  stopEvent(event: Event): boolean {
    return event.type === 'click' || event.type === 'mousedown';
  }

  ignoreMutation(): boolean {
    return true;
  }

  destroy() {
    this.dom.removeEventListener('click', this.#open);
    this.dom.removeEventListener(OPEN, this.#open);
  }
}
