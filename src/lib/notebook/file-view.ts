/**
 * How a file a note holds appears in its text: the node `file` of the
 * schema, drawn by `HeldFile.svelte`. Enter on it, selected, opens it.
 */

import type { Node } from 'prosemirror-model';
import { NodeSelection } from 'prosemirror-state';
import type { EditorView, NodeView } from 'prosemirror-view';
import { mount, unmount } from 'svelte';
import HeldFile from './HeldFile.svelte';
import { openHeldFile } from './files';

export class HeldFileView implements NodeView {
  dom: HTMLElement;
  #hash: string;
  #name: string;
  #mounted: Record<string, unknown> | null = null;
  #view: EditorView;
  #getPos: () => number | undefined;

  constructor(node: Node, view: EditorView, getPos: () => number | undefined) {
    this.#view = view;
    this.#getPos = getPos;
    this.#hash = node.attrs.hash;
    this.#name = node.attrs.name;
    this.dom = document.createElement('div');
    this.dom.className = 'held-file';
    this.dom.contentEditable = 'false';
    this.dom.dataset.file = this.#hash;
    this.dom.addEventListener('keydown', this.#key);
    this.#draw();
  }

  #key = (event: KeyboardEvent) => {
    if (event.key !== 'Enter') return;
    const selection = this.#view.state.selection;
    if (selection instanceof NodeSelection && selection.from === this.#getPos()) {
      event.preventDefault();
      void openHeldFile(this.#hash);
    }
  };

  #draw() {
    if (this.#mounted) void unmount(this.#mounted);
    this.dom.replaceChildren();
    this.#mounted = mount(HeldFile, {
      target: this.dom,
      props: { hash: this.#hash, name: this.#name },
    });
  }

  update(node: Node): boolean {
    if (node.type.name !== 'file') return false;
    if (node.attrs.hash !== this.#hash || node.attrs.name !== this.#name) {
      this.#hash = node.attrs.hash;
      this.#name = node.attrs.name;
      this.dom.dataset.file = this.#hash;
      this.#draw();
    }
    return true;
  }

  stopEvent(): boolean {
    return false;
  }

  ignoreMutation(): boolean {
    return true;
  }

  destroy() {
    this.dom.removeEventListener('keydown', this.#key);
    if (this.#mounted) void unmount(this.#mounted);
    this.#mounted = null;
  }
}
