/**
 * A box of rich text as the editor draws it (ADR 0112): a sheet with a head
 * that is the box's own and no part of the text, and under it what the box
 * holds, which the editor writes in as it writes in any text.
 */

import BoxSelect from '@lucide/svelte/icons/box-select';
import Palette from '@lucide/svelte/icons/palette';
import Pilcrow from '@lucide/svelte/icons/pilcrow';
import Trash2 from '@lucide/svelte/icons/trash-2';
import type { Node } from 'prosemirror-model';
import type { Command } from 'prosemirror-state';
import type { EditorView, NodeView } from 'prosemirror-view';
import { mount, unmount } from 'svelte';
import { hooksOf } from '$lib/editor/ui.svelte';
import { t } from '$lib/i18n';
import { lookUi } from '$lib/look/look.svelte';
import { confirm } from '$lib/ui/confirm.svelte';
import { openMenu, type MenuItem } from '$lib/ui/menu.svelte';
import { BOX, deleteBox, selectBox, unwrapBox } from './box';
import BoxHead from './BoxHead.svelte';
import { holdsHand } from './rule';

/** The events of a drag that is over the head, or ends. */
const DRAGGED_OVER = new Set(['dragenter', 'dragover', 'dragleave', 'drop', 'dragend']);

export class BoxView implements NodeView {
  dom: HTMLElement;
  contentDOM: HTMLElement;
  #head: HTMLElement;
  #mounted: ReturnType<typeof mount> | null;
  #view: EditorView;
  #getPos: () => number | undefined;

  constructor(_node: Node, view: EditorView, getPos: () => number | undefined) {
    this.#view = view;
    this.#getPos = getPos;
    this.dom = document.createElement('div');
    this.dom.className = 'rich';
    this.dom.dataset.rich = '';
    this.#head = document.createElement('div');
    this.#head.className = 'rich-head';
    this.#head.contentEditable = 'false';
    this.contentDOM = document.createElement('div');
    this.contentDOM.className = 'rich-body';
    this.dom.append(this.#head, this.contentDOM);
    this.#mounted = mount(BoxHead, {
      target: this.#head,
      props: { view, getPos, menu: this.#menu },
    });
  }

  /** The menu of the box: each of its entries acts on the box where it stands when the entry is chosen. */
  #menu = (anchor: HTMLElement) => {
    const view = this.#view;
    const exec = (command: (pos: number) => Command) => {
      const pos = this.#getPos();
      if (view.isDestroyed || pos === undefined) return;
      command(pos)(view.state, view.dispatch, view);
      view.focus();
    };
    // Where the text is of a document, its look is set in the Look: the font and the size of all of it, with its notes and headings.
    const ofDocument = !!hooksOf.get(view)?.element;
    const items: MenuItem[] = [
      { label: t('byhand-select'), icon: BoxSelect, action: () => exec(selectBox) },
      { label: t('byhand-to-text'), icon: Pilcrow, action: () => void this.#toText() },
      { kind: 'separator' },
      { label: t('byhand-delete'), icon: Trash2, action: () => exec(deleteBox) },
      ...(ofDocument
        ? ([
            { kind: 'separator' },
            {
              label: t('byhand-whole'),
              icon: Palette,
              action: () => lookUi.open({ section: 'type' }),
            },
          ] satisfies MenuItem[])
        : []),
    ];
    openMenu(anchor, items, { align: 'end', onclose: () => view.focus() });
  };

  /**
   * Makes the box ordinary text. Where anything in it is set by hand, that
   * is taken away with the box (`rule.ts`), and it is asked first.
   */
  async #toText() {
    const view = this.#view;
    const pos = this.#getPos();
    const box = pos === undefined ? null : view.state.doc.nodeAt(pos);
    if (view.isDestroyed || pos === undefined || !box) return;
    if (holdsHand(box)) {
      const yes = await confirm({
        title: t('byhand-to-text-title'),
        message: t('byhand-to-text-warning'),
        confirm: t('byhand-to-text'),
      });
      if (!yes || view.isDestroyed) return;
    }
    const at = this.#getPos();
    if (at === undefined) return;
    unwrapBox(at)(view.state, view.dispatch, view);
    view.focus();
  }

  update(node: Node): boolean {
    return node.type.name === BOX;
  }

  /**
   * What is done in the head is the head's, and nothing for the editor to
   * read as writing. What is dragged over the head or dropped on it is the
   * text's, as is the end of a drag that began at the grip (the drag itself
   * is begun by the head: `BoxHead.svelte`).
   */
  stopEvent(event: Event): boolean {
    if (DRAGGED_OVER.has(event.type)) return false;
    return event.target instanceof globalThis.Node && this.#head.contains(event.target);
  }

  ignoreMutation(mutation: { type: string; target: globalThis.Node }): boolean {
    if (mutation.type === 'selection') return false;
    return !this.contentDOM.contains(mutation.target);
  }

  destroy() {
    if (this.#mounted) void unmount(this.#mounted);
    this.#mounted = null;
  }
}
