/** How formulas and figures appear in the text, and how they are changed there. */

import { open as openFile } from '@tauri-apps/plugin-dialog';
import type { Node } from 'prosemirror-model';
import { NodeSelection, Selection, TextSelection } from 'prosemirror-state';
import type { EditorView, NodeView } from 'prosemirror-view';
import { mount, unmount } from 'svelte';
import { figureWidth } from '$lib/editor/schema';
import { place } from '$lib/ui/floating';
import FigurePanel from './FigurePanel.svelte';
import FormulaPanel from './FormulaPanel.svelte';
import { showFormula } from './math.svelte';
import { pictures, PICTURE_ENDINGS } from './pictures.svelte';

/** What the panel of a formula can be asked. */
interface Written {
  written: () => { tex: string; numbered: boolean };
  focus: () => void;
}

/**
 * A panel beside something in the text, of the kind a note is written in.
 * It stays beside what it belongs to as it grows and shrinks itself.
 */
class Panel {
  readonly el: HTMLElement;
  #anchor: HTMLElement;
  #watch: ResizeObserver | null = null;

  constructor(anchor: HTMLElement, label: string, kind: string) {
    this.#anchor = anchor;
    this.el = document.createElement('div');
    this.el.className = `note-panel ${kind}`;
    this.el.setAttribute('role', 'dialog');
    this.el.setAttribute('aria-label', label);
    document.body.append(this.el);
    this.place();
    if (typeof ResizeObserver !== 'undefined') {
      this.#watch = new ResizeObserver(() => this.place());
      this.#watch.observe(this.el);
    }
  }

  place() {
    place(this.el, this.#anchor.getBoundingClientRect(), {
      side: 'bottom',
      align: 'start',
      gap: 8,
    });
  }

  remove() {
    this.#watch?.disconnect();
    this.el.remove();
  }
}

/** Whether a pointer that went down did so in something that belongs to a panel. */
function belongs(target: HTMLElement, panel: HTMLElement, dom: HTMLElement): boolean {
  if (panel.contains(target) || dom.contains(target)) return true;
  return !!target.closest('.popover, .menu, dialog, .backdrop');
}

/** Puts the cursor after a block, in a paragraph that is made if there is none. */
function cursorAfter(view: EditorView, pos: number) {
  const { state } = view;
  const node = state.doc.nodeAt(pos);
  if (!node) return;
  const after = pos + node.nodeSize;
  const resolved = state.doc.resolve(after);
  const tr = state.tr;
  if (
    !resolved.nodeAfter ||
    !resolved.nodeAfter.isTextblock ||
    resolved.nodeAfter.type.spec.isolating
  ) {
    const paragraph = state.schema.nodes.paragraph;
    if (paragraph && resolved.parent.canReplaceWith(resolved.index(), resolved.index(), paragraph))
      tr.insert(after, paragraph.create());
  }
  tr.setSelection(Selection.near(tr.doc.resolve(Math.min(after + 1, tr.doc.content.size)), 1));
  view.dispatch(tr.scrollIntoView());
}

/**
 * A formula: in the line, or on a line of its own. In the text it is shown
 * as mathematics; selected, it opens as a panel in which it is written.
 */
export class FormulaView implements NodeView {
  dom: HTMLElement;
  #body: HTMLElement;
  #node: Node;
  #view: EditorView;
  #getPos: () => number | undefined;
  #display: boolean;
  #tex = $state('');
  #stop: () => void;
  #panel: Panel | null = null;
  #written: Written | null = null;
  #mounted: Record<string, unknown> | null = null;

  constructor(node: Node, view: EditorView, getPos: () => number | undefined) {
    this.#node = node;
    this.#view = view;
    this.#getPos = getPos;
    this.#display = node.type.name === 'equation';
    if (this.#display) {
      this.dom = document.createElement('div');
      this.dom.className = 'equation';
      this.#body = document.createElement('span');
      this.#body.className = 'equation-body math';
      this.dom.append(this.#body);
    } else {
      this.dom = document.createElement('span');
      this.dom.className = 'math';
      this.#body = this.dom;
    }
    this.dom.contentEditable = 'false';
    this.#read();
    this.#stop = $effect.root(() => {
      $effect(() => showFormula(this.#body, this.#tex, this.#display));
    });
  }

  #read() {
    this.#tex = String(this.#node.attrs.tex ?? '');
    if (this.#display) this.dom.toggleAttribute('data-numbered', !!this.#node.attrs.numbered);
  }

  selectNode() {
    this.dom.classList.add('selected');
    if (!this.#panel && this.#view.editable) this.#open();
  }

  deselectNode() {
    this.dom.classList.remove('selected');
    this.#close();
  }

  #open() {
    const panel = new Panel(this.dom, this.#display ? 'Equation' : 'Formula', 'formula-panel');
    this.#panel = panel;
    const mounted = mount(FormulaPanel, {
      target: panel.el,
      props: {
        tex: this.#tex,
        display: this.#display,
        numbered: !!this.#node.attrs.numbered,
        ondone: (tex: string, numbered: boolean) => this.#leave(tex, numbered),
        oncancel: () => this.#leave(this.#tex, !!this.#node.attrs.numbered),
      },
    });
    this.#mounted = mounted;
    this.#written = mounted as unknown as Written;
    requestAnimationFrame(() => {
      if (this.#panel === panel) this.#written?.focus();
    });
    window.addEventListener('pointerdown', this.#outside, true);
  }

  #outside = (event: PointerEvent) => {
    const target = event.target as HTMLElement | null;
    if (!target || !this.#panel || belongs(target, this.#panel.el, this.dom)) return;
    // What was written is kept; the cursor goes where the pointer puts it.
    const written = this.#written?.written();
    this.#close();
    if (written) this.#keep(written.tex, written.numbered);
  };

  /** Keeps what was written. A formula left empty was not wanted. Returns whether it is still there. */
  #keep(tex: string, numbered: boolean): boolean {
    const pos = this.#getPos();
    if (pos === undefined) return false;
    const view = this.#view;
    const node = view.state.doc.nodeAt(pos);
    if (!node || node.type !== this.#node.type) return false;
    if (!tex) {
      view.dispatch(view.state.tr.delete(pos, pos + node.nodeSize));
      return false;
    }
    if (tex !== node.attrs.tex || (this.#display && numbered !== !!node.attrs.numbered)) {
      const attrs = this.#display ? { tex, numbered } : { tex };
      view.dispatch(view.state.tr.setNodeMarkup(pos, undefined, attrs));
    }
    return true;
  }

  /** Closes the panel and goes on writing after the formula. */
  #leave(tex: string, numbered: boolean) {
    const view = this.#view;
    this.#close();
    const there = this.#keep(tex, numbered);
    const pos = this.#getPos();
    if (there && pos !== undefined) {
      if (this.#display) cursorAfter(view, pos);
      else {
        const after = Math.min(pos + 1, view.state.doc.content.size);
        view.dispatch(
          view.state.tr.setSelection(TextSelection.create(view.state.doc, after)).scrollIntoView(),
        );
      }
    }
    view.focus();
  }

  #close() {
    window.removeEventListener('pointerdown', this.#outside, true);
    if (this.#mounted) void unmount(this.#mounted);
    this.#mounted = null;
    this.#written = null;
    this.#panel?.remove();
    this.#panel = null;
  }

  update(node: Node): boolean {
    if (node.type !== this.#node.type) return false;
    this.#node = node;
    this.#read();
    return true;
  }

  stopEvent(event: Event): boolean {
    const target = event.target as globalThis.Node | null;
    return !!this.#panel && !!target && this.#panel.el.contains(target);
  }

  ignoreMutation(): boolean {
    return true;
  }

  destroy() {
    this.#close();
    this.#stop();
  }
}

/** Asks for a picture among the files of this computer, and takes it in. */
export async function choosePicture() {
  const path = await openFile({
    title: 'A picture',
    multiple: false,
    filters: [{ name: 'Pictures', extensions: PICTURE_ENDINGS }],
  });
  if (typeof path !== 'string') return null;
  return pictures.addFile(path);
}

/**
 * A figure: the picture, and under it what is said of it, which is written
 * where it stands. Pressing the picture selects the figure, and opens a panel
 * with the rest that can be said of it.
 */
export class FigureView implements NodeView {
  dom: HTMLElement;
  contentDOM: HTMLElement;
  #picture: HTMLElement;
  #img: HTMLImageElement;
  #node: Node;
  #view: EditorView;
  #getPos: () => number | undefined;
  #file = $state.raw<{ file: string; extension: string }>({ file: '', extension: '' });
  #stop: () => void;
  #panel: Panel | null = null;
  #mounted: Record<string, unknown> | null = null;

  constructor(node: Node, view: EditorView, getPos: () => number | undefined) {
    this.#node = node;
    this.#view = view;
    this.#getPos = getPos;
    this.dom = document.createElement('figure');
    this.dom.className = 'figure';
    this.#picture = document.createElement('div');
    this.#picture.className = 'picture';
    this.#picture.contentEditable = 'false';
    this.#img = document.createElement('img');
    this.#img.draggable = false;
    this.#picture.append(this.#img);
    this.contentDOM = document.createElement('figcaption');
    this.dom.append(this.#picture, this.contentDOM);
    this.#read();

    this.#stop = $effect.root(() => {
      $effect(() => {
        const { file, extension } = this.#file;
        const shown = pictures.of(file, extension);
        if (shown.url) {
          if (this.#img.getAttribute('src') !== shown.url) this.#img.src = shown.url;
          this.#picture.removeAttribute('data-state');
        } else {
          this.#img.removeAttribute('src');
          this.#picture.dataset.state = shown.state;
        }
      });
    });
    this.#picture.addEventListener('mousedown', this.#press);
  }

  #read() {
    const a = this.#node.attrs;
    if (a.file !== this.#file.file || a.extension !== this.#file.extension)
      this.#file = { file: String(a.file ?? ''), extension: String(a.extension ?? '') };
    this.#picture.style.width = `${figureWidth(a.width)}%`;
    this.#picture.dataset.name = String(a.name ?? '');
    this.#img.alt = String(a.alt ?? '');
    this.dom.toggleAttribute('data-unnumbered', !a.numbered);
    this.dom.classList.toggle('uncaptioned', this.#node.content.size === 0);
  }

  #press = (event: MouseEvent) => {
    if (event.button !== 0 || !this.#view.editable) return;
    event.preventDefault();
    const pos = this.#getPos();
    if (pos === undefined) return;
    const view = this.#view;
    view.dispatch(view.state.tr.setSelection(NodeSelection.create(view.state.doc, pos)));
    view.focus();
    // Pressed again while it is selected, the panel is there again.
    if (!this.#panel) this.#open();
  };

  selectNode() {
    this.dom.classList.add('selected');
    if (!this.#panel && this.#view.editable) this.#open();
  }

  deselectNode() {
    this.dom.classList.remove('selected');
    this.#close();
  }

  #change(change: Record<string, unknown>) {
    const pos = this.#getPos();
    if (pos === undefined) return;
    const view = this.#view;
    const node = view.state.doc.nodeAt(pos);
    if (!node || node.type !== this.#node.type) return;
    const tr = view.state.tr.setNodeMarkup(pos, undefined, { ...node.attrs, ...change });
    // The figure stays the one that is selected, and its panel open.
    view.dispatch(tr.setSelection(NodeSelection.create(tr.doc, pos)));
  }

  #open() {
    const panel = new Panel(this.#picture, 'Figure', 'figure-panel');
    this.#panel = panel;
    const a = this.#node.attrs;
    this.#mounted = mount(FigurePanel, {
      target: panel.el,
      props: {
        name: String(a.name ?? ''),
        alt: String(a.alt ?? ''),
        width: figureWidth(a.width),
        numbered: !!a.numbered,
        ontry: (width: number) => {
          this.#picture.style.width = `${figureWidth(width)}%`;
          this.#again();
        },
        onchange: (change) => {
          this.#change(change);
          this.#again();
        },
        onreplace: () => void this.#replace(),
        onremove: () => this.#remove(),
        onclose: () => this.#leave(),
      },
    });
    requestAnimationFrame(() => this.#again());
    window.addEventListener('pointerdown', this.#outside, true);
  }

  /** The panel follows the picture as it grows and shrinks. */
  #again() {
    this.#panel?.place();
  }

  async #replace() {
    const picture = await choosePicture();
    if (picture)
      this.#change({ file: picture.hash, extension: picture.extension, name: picture.name });
    this.#again();
  }

  #remove() {
    const pos = this.#getPos();
    const view = this.#view;
    this.#close();
    if (pos !== undefined) {
      const node = view.state.doc.nodeAt(pos);
      if (node) view.dispatch(view.state.tr.delete(pos, pos + node.nodeSize));
    }
    view.focus();
  }

  /** Closes the panel and puts the cursor into what is said of the figure. */
  #leave() {
    const pos = this.#getPos();
    const view = this.#view;
    this.#close();
    if (pos !== undefined) {
      const node = view.state.doc.nodeAt(pos);
      if (node) {
        const end = pos + node.nodeSize - 1;
        view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, end)));
      }
    }
    view.focus();
  }

  #outside = (event: PointerEvent) => {
    const target = event.target as HTMLElement | null;
    if (!target || !this.#panel || belongs(target, this.#panel.el, this.#picture)) return;
    // What was being typed in the panel is kept: the field is left, and says so.
    const typing = document.activeElement as HTMLElement | null;
    if (typing && this.#panel.el.contains(typing)) typing.blur();
    this.#close();
  };

  #close() {
    window.removeEventListener('pointerdown', this.#outside, true);
    if (this.#mounted) void unmount(this.#mounted);
    this.#mounted = null;
    this.#panel?.remove();
    this.#panel = null;
  }

  update(node: Node): boolean {
    if (node.type !== this.#node.type) return false;
    this.#node = node;
    this.#read();
    return true;
  }

  stopEvent(event: Event): boolean {
    const target = event.target as globalThis.Node | null;
    if (!target) return false;
    if (this.#panel?.el.contains(target)) return true;
    return this.#picture.contains(target) && event.type.startsWith('mouse');
  }

  ignoreMutation(mutation: { type: string; target: globalThis.Node }): boolean {
    // What is written in the caption is the editor's to read; the rest is set here.
    if (mutation.type === 'selection') return false;
    return !this.contentDOM.contains(mutation.target);
  }

  destroy() {
    this.#picture.removeEventListener('mousedown', this.#press);
    this.#close();
    this.#stop();
  }
}
