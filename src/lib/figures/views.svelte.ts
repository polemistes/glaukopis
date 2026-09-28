/** How formulas and figures appear in the text, and how they are changed there. */

import { open as openFile } from '@tauri-apps/plugin-dialog';
import type { Node } from 'prosemirror-model';
import { NodeSelection, Selection, TextSelection, type Command } from 'prosemirror-state';
import type { EditorView, NodeView } from 'prosemirror-view';
import { mount, unmount } from 'svelte';
import { captionOf, captionNodes } from '$lib/editor/commands';
import { currentProject } from '$lib/editor/references.svelte';
import type { DocumentFormat } from '$lib/api/documents';
import { figureWidth, flow, stand, tableWidth } from '$lib/editor/schema';
import { hooksOf, OPEN, passing } from '$lib/editor/ui.svelte';
import { refForm } from '$lib/project/model/text';
import { openMenu } from '$lib/ui/menu.svelte';
import { place } from '$lib/ui/floating';
import FigurePanel from './FigurePanel.svelte';
import FormulaPanel from './FormulaPanel.svelte';
import { showFormula } from './math.svelte';
import { formsOf, numbering, pointerText, type Counting, type Numbers } from './numbering.svelte';
import { pictures, PICTURE_ENDINGS } from './pictures.svelte';
import {
  canStandBeside,
  inRow,
  placed,
  standAlone,
  standBeside,
  usualOf,
  type Usual,
} from './placing';
import { notifyOk } from '$lib/ui/toast.svelte';

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
  /** What the panel keeps clear of, when that is wider than what it belongs to. */
  #beside: HTMLElement | null;
  #watch: ResizeObserver | null = null;

  /**
   * With `beside`, the panel stands at the side of that, level with its
   * top, where there is room: so it stays where it is while what it belongs
   * to is made larger and smaller, and does not lie over it.
   */
  constructor(anchor: HTMLElement, label: string, kind: string, beside: HTMLElement | null = null) {
    this.#anchor = anchor;
    this.#beside = beside;
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
    const wide = this.#beside?.getBoundingClientRect();
    if (wide) {
      const needed = this.el.offsetWidth + 12 + 8;
      const right = window.innerWidth - wide.right >= needed;
      if (right || wide.left >= needed) {
        place(this.el, wide, { side: right ? 'right' : 'left', align: 'start', gap: 12 });
        return;
      }
    }
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

/** The numbers of the document the text of an editor is part of, and what the document calls things. */
function documentOf(
  view: EditorView,
): { numbers: Numbers; counting: Counting; element: string; format?: DocumentFormat } | null {
  const element = hooksOf.get(view)?.element;
  const project = currentProject();
  const map = element ? project?.node(element)?.map : undefined;
  if (!element || !project || !map) return null;
  return {
    numbers: numbering.of(project, map),
    counting: numbering.countingOf(project, map),
    element,
    format: numbering.formatOf(project, map),
  };
}

/** What the format of the document says of where things of a kind stand. */
export function usualIn(view: EditorView, kind: 'figure' | 'table' | 'equation'): Usual {
  return usualOf(documentOf(view)?.format, kind);
}

/** Whether what stands at a position stands in a row, or could stand beside what is before it. */
export function besideAt(view: EditorView, pos: number | undefined): 'in' | 'can' | 'no' {
  if (pos === undefined) return 'no';
  if (inRow(view.state, pos)) return 'in';
  return canStandBeside(view.state, pos) ? 'can' : 'no';
}

/**
 * Shows on an element where it stands and whether the text flows around
 * it, as it will in the document: what is said of it, or what the format
 * says. The styles are in `placing.css`.
 */
export function showPlacing(
  el: HTMLElement,
  attrs: { align?: unknown; flow?: unknown; width?: unknown },
  usual: Usual,
  kind: 'figure' | 'table' | 'equation',
) {
  const now = placed(attrs, usual);
  const beside = el.parentElement?.classList.contains('row-of') ?? false;
  const set = (name: string, value: string | null) => {
    if (value === null) el.removeAttribute(name);
    else if (el.getAttribute(name) !== value) el.setAttribute(name, value);
  };
  set('data-stand', beside ? null : now.stand);
  const around = now.around && !beside && kind !== 'equation';
  set('data-around', around ? '' : null);
  // With the text flowing around it, it is as wide as it was said to be, and leaves room for the text.
  const share =
    kind === 'figure'
      ? Math.min(60, figureWidth(attrs.width))
      : Math.min(70, tableWidth(attrs.width) || 45);
  const width = around ? `${share}%` : '';
  if (el.style.getPropertyValue('--around') !== width) {
    if (width) el.style.setProperty('--around', width);
    else el.style.removeProperty('--around');
  }
}

/**
 * The number of a figure or an equation: that of its place among those of
 * its kind in the text it stands in. Nothing, when the text is not part of
 * the document, or the thing has no number.
 */
export function numberOf(
  view: EditorView,
  kind: 'figure' | 'table' | 'equation',
  pos: number | undefined,
) {
  const of = documentOf(view);
  if (!of || pos === undefined) return { number: null, counting: of?.counting ?? null };
  let index = 0;
  view.state.doc.nodesBetween(0, Math.min(pos, view.state.doc.content.size), (node, at) => {
    if (at >= pos) return false;
    // A table is a `tabular` in the text.
    if (node.type.name !== (kind === 'table' ? 'tabular' : kind)) return !node.isTextblock;
    // An equation in which nothing is written yet is not counted.
    if (kind !== 'equation' || String(node.attrs.tex ?? '').trim()) index++;
    return false;
  });
  return {
    number: of.numbers.within.get(of.element)?.[kind][index] ?? null,
    counting: of.counting,
  };
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
  /** Rises when the text around the equation has changed, and its number may have. */
  #moved = $state(0);
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
    this.dom.addEventListener(OPEN, this.#asked);
    this.#read();
    this.#stop = $effect.root(() => {
      $effect(() => showFormula(this.#body, this.#tex, this.#display));
      if (this.#display) {
        $effect(() => {
          void this.#moved;
          showPlacing(this.dom, this.#node.attrs, usualIn(this.#view, 'equation'), 'equation');
        });
        $effect(() => {
          void this.#moved;
          const { number, counting } = numberOf(this.#view, 'equation', this.#getPos());
          const shown =
            number && counting && this.#node.attrs.numbered
              ? `${counting.before}${number}${counting.after}`
              : '';
          if (!shown) delete this.dom.dataset.number;
          else if (this.dom.dataset.number !== shown) this.dom.dataset.number = shown;
        });
      }
    });
  }

  #read() {
    this.#tex = String(this.#node.attrs.tex ?? '');
    if (this.#display) this.dom.toggleAttribute('data-numbered', !!this.#node.attrs.numbered);
    this.#moved++;
  }

  selectNode() {
    this.dom.classList.add('selected');
    // The cursor on its way through the text selects it and does not open
    // it: Enter does, and pressing it.
    if (passing(this.#view)) return;
    if (!this.#panel && this.#view.editable) this.#open();
  }

  #asked = () => {
    if (!this.#panel && this.#view.editable) this.#open();
  };

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
        align: stand(this.#node.attrs.align),
        usual: usualIn(this.#view, 'equation'),
        beside: besideAt(this.#view, this.#getPos()),
        onplace: (change: { align?: string }) => this.#place(change),
        onbeside: () => this.#move(standBeside),
        onalone: () => this.#move(standAlone),
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

  /** Says where the equation stands. What is being written is kept first. */
  #place(change: { align?: string }) {
    const written = this.#written?.written();
    const pos = this.#getPos();
    if (pos === undefined) return;
    const view = this.#view;
    const node = view.state.doc.nodeAt(pos);
    if (!node || node.type !== this.#node.type) return;
    const tr = view.state.tr.setNodeMarkup(pos, undefined, {
      ...node.attrs,
      ...(written?.tex ? { tex: written.tex, numbered: written.numbered } : {}),
      ...change,
    });
    // The equation stays the one that is selected, and its panel open.
    view.dispatch(tr.setSelection(NodeSelection.create(tr.doc, pos)));
  }

  /** Puts the equation beside what is before it, or by itself again. */
  #move(how: (pos: number) => Command) {
    const written = this.#written?.written();
    const view = this.#view;
    this.#close();
    if (written && !this.#keep(written.tex, written.numbered)) return;
    const pos = this.#getPos();
    if (pos !== undefined) how(pos)(view.state, view.dispatch);
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
      const attrs = this.#display ? { ...node.attrs, tex, numbered } : { tex };
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
    this.dom.removeEventListener(OPEN, this.#asked);
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
  /** Rises when the figure or the text around it has changed, and its number may have. */
  #moved = $state(0);
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
    this.dom.addEventListener(OPEN, this.#asked);
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
      // Where it stands, as the document has it.
      $effect(() => {
        void this.#moved;
        showPlacing(this.dom, this.#node.attrs, usualIn(this.#view, 'figure'), 'figure');
      });
      // The word and the number before what is said of it, as the document has them.
      $effect(() => {
        void this.#moved;
        const { number, counting } = numberOf(this.#view, 'figure', this.#getPos());
        const label = figureLabel(
          !!this.#node.attrs.numbered,
          number,
          this.#node.content.size > 0,
          counting,
        );
        if (!label) delete this.contentDOM.dataset.label;
        else if (this.contentDOM.dataset.label !== label) this.contentDOM.dataset.label = label;
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
    this.#moved++;
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
    // The cursor on its way through the text selects it and does not open
    // it: Enter does, and pressing it.
    if (passing(this.#view)) return;
    if (!this.#panel && this.#view.editable) this.#open();
  }

  #asked = () => {
    if (!this.#panel && this.#view.editable) this.#open();
  };

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
    const panel = new Panel(this.#picture, 'Figure', 'figure-panel', this.dom);
    this.#panel = panel;
    const a = this.#node.attrs;
    this.#mounted = mount(FigurePanel, {
      target: panel.el,
      props: {
        name: String(a.name ?? ''),
        alt: String(a.alt ?? ''),
        width: figureWidth(a.width),
        numbered: !!a.numbered,
        align: stand(a.align),
        flow: flow(a.flow),
        usual: usualIn(this.#view, 'figure'),
        beside: besideAt(this.#view, this.#getPos()),
        onbeside: () => this.#move(standBeside),
        onalone: () => this.#move(standAlone),
        // The panel stays where it is while the width is set: if it went
        // with the picture, the bar would go from under the pointer.
        ontry: (width: number) => {
          this.#picture.style.width = `${figureWidth(width)}%`;
        },
        onchange: (change) => this.#change(change),
        kept: () => {
          const said = pictures.get(String(this.#node.attrs.file))?.caption ?? [];
          return JSON.stringify(said) === JSON.stringify(captionOf(this.#node));
        },
        own: () => !!pictures.get(String(this.#node.attrs.file))?.caption?.length,
        onkeep: () => void this.#keepCaption(),
        ontake: () => this.#takeCaption(),
        onreplace: () => void this.#replace(),
        onremove: () => this.#remove(),
        onclose: () => this.#leave(),
      },
    });
    requestAnimationFrame(() => this.#again());
    window.addEventListener('pointerdown', this.#outside, true);
    window.addEventListener('keydown', this.#escape, true);
  }

  /** Escape closes the panel wherever the cursor is: nothing in the panel need have it. */
  #escape = (event: KeyboardEvent) => {
    if (event.key !== 'Escape' || !this.#panel) return;
    const target = event.target as HTMLElement | null;
    // What lies over the panel is closed first, and a field in the panel says what it wants itself.
    if (target?.closest('.popover, .menu, dialog') || this.#panel.el.contains(target)) return;
    event.preventDefault();
    event.stopPropagation();
    this.#leave();
  };

  /** Puts the figure beside what is before it, or by itself again. */
  #move(how: (pos: number) => Command) {
    const pos = this.#getPos();
    const view = this.#view;
    this.#close();
    if (pos !== undefined) how(pos)(view.state, view.dispatch);
  }

  /** The panel follows the picture as it grows and shrinks. */
  #again() {
    this.#panel?.place();
  }

  /** What is said of the figure is kept with the picture, for the figures that are made with it after. */
  async #keepCaption() {
    const hash = String(this.#node.attrs.file);
    const kept = await pictures.update(hash, {
      caption: captionOf(this.#node),
      ...(this.#node.attrs.alt ? { alt: String(this.#node.attrs.alt) } : {}),
    });
    if (kept) notifyOk('Kept with the picture', 'Figures made with it begin with these words.');
  }

  /** What is kept with the picture is said of the figure, in place of what is said now. */
  #takeCaption() {
    const pos = this.#getPos();
    const picture = pictures.get(String(this.#node.attrs.file));
    if (pos === undefined || !picture) return;
    const view = this.#view;
    const node = view.state.doc.nodeAt(pos);
    if (!node || node.type !== this.#node.type) return;
    const tr = view.state.tr.replaceWith(
      pos + 1,
      pos + node.nodeSize - 1,
      captionNodes(view.state.schema, picture.caption),
    );
    view.dispatch(tr.setSelection(NodeSelection.create(tr.doc, pos)));
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
      if (node) {
        const tr = view.state.tr.delete(pos, pos + node.nodeSize);
        // The cursor goes into the text beside where the figure stood, and
        // not onto what stands by itself there, which would open it.
        const at = tr.doc.resolve(Math.min(pos, tr.doc.content.size));
        const beside =
          Selection.findFrom(at, -1, true) ??
          Selection.findFrom(at, 1, true) ??
          Selection.near(at, -1);
        view.dispatch(tr.setSelection(beside));
      }
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
    window.removeEventListener('keydown', this.#escape, true);
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
    // What is written in the caption is the editor's to read; the rest is
    // set here, and so is the word and the number before the caption.
    if (mutation.type === 'selection') return false;
    if (mutation.type === 'attributes' && mutation.target === this.contentDOM) return true;
    return !this.contentDOM.contains(mutation.target);
  }

  destroy() {
    this.#picture.removeEventListener('mousedown', this.#press);
    this.dom.removeEventListener(OPEN, this.#asked);
    this.#close();
    this.#stop();
  }
}

/**
 * What stands before what is said of a figure: the word and the number, as
 * the document has them, and what parts them from what follows.
 */
export function figureLabel(
  numbered: boolean,
  number: string | null,
  said: boolean,
  counting: Counting | null,
  kind: 'figure' | 'table' = 'figure',
): string {
  if (!numbered) return '';
  if (kind === 'table') {
    const label = [(counting?.tableLabel ?? 'Table').trim(), number].filter(Boolean).join('\u00a0');
    if (!label) return '';
    return said ? `${label}${counting?.tableSeparator ?? '. '}` : label;
  }
  const word = (counting?.label ?? 'Figure').trim();
  // One that is not part of the document has no number there.
  const label = [word, number].filter(Boolean).join('\u00a0');
  if (!label) return '';
  return said ? `${label}${counting?.separator ?? '. '}` : label;
}

/**
 * Words that point to a figure, an equation or a part of the document. What
 * they say follows what they point to: its number, and what the format
 * calls it.
 */
export class CrossRefView implements NodeView {
  dom: HTMLElement;
  #node: Node;
  #view: EditorView;
  #getPos: () => number | undefined;
  #attrs = $state.raw<{ target: string; form: string }>({ target: '', form: 'full' });
  #stop: () => void;

  constructor(node: Node, view: EditorView, getPos: () => number | undefined) {
    this.#node = node;
    this.#view = view;
    this.#getPos = getPos;
    this.dom = document.createElement('span');
    this.dom.className = 'crossref';
    this.dom.setAttribute('role', 'button');
    this.dom.contentEditable = 'false';
    this.#attrs = { target: node.attrs.target, form: node.attrs.form };
    this.#stop = $effect.root(() => {
      $effect(() => {
        const { target, form } = this.#attrs;
        const of = documentOf(this.#view);
        const text = of ? pointerText(of.numbers.byId.get(target), refForm(form), of.counting) : '';
        this.dom.textContent = text || '?';
        this.dom.classList.toggle('missing', !text);
        if (text) this.dom.removeAttribute('title');
        else this.dom.title = 'What this pointed to is not in the document';
      });
    });
    this.dom.addEventListener('click', this.#open);
    // Selected, it is opened by Enter.
    this.dom.addEventListener(OPEN, this.#open);
  }

  #set(change: Record<string, unknown> | null) {
    const pos = this.#getPos();
    if (pos === undefined) return;
    const view = this.#view;
    const node = view.state.doc.nodeAt(pos);
    if (!node || node.type !== this.#node.type) return;
    view.dispatch(
      change
        ? view.state.tr.setNodeMarkup(pos, undefined, { ...node.attrs, ...change })
        : view.state.tr.delete(pos, pos + node.nodeSize),
    );
    view.focus();
  }

  #open = (event: Event) => {
    event.preventDefault();
    if (!this.#view.editable) return;
    const of = documentOf(this.#view);
    const pointed = of?.numbers.byId.get(this.#attrs.target);
    const form = refForm(this.#attrs.form);
    openMenu(
      this.dom,
      [
        ...(pointed && of
          ? [
              { kind: 'heading' as const, label: 'Points by' },
              ...formsOf(pointed.kind, pointed.number !== null).map((f) => ({
                label: f.label,
                hint: pointerText(pointed, f.form, of.counting),
                checked:
                  f.form === form ||
                  (f.form === 'full' && form === 'number' && pointed.kind === 'part'),
                action: () => this.#set({ form: f.form }),
              })),
              { kind: 'separator' as const },
              {
                label: 'Go to what it points to',
                action: () => {
                  const at =
                    document.querySelector(`[data-id="${CSS.escape(pointed.id)}"]`) ??
                    document.querySelector(`[data-section="${CSS.escape(pointed.element)}"]`) ??
                    document.querySelector(`[data-node="${CSS.escape(pointed.element)}"]`);
                  at?.scrollIntoView({ block: 'center', behavior: 'smooth' });
                },
              },
            ]
          : [
              {
                label: 'What this pointed to is not in the document',
                disabled: true,
                action: () => {},
              },
            ]),
        {
          label: 'Point to something else…',
          action: () => hooksOf.get(this.#view)?.point?.(this.#view, this.#getPos()),
        },
        { label: 'Remove', action: () => this.#set(null) },
      ],
      { align: 'start' },
    );
  };

  update(node: Node): boolean {
    if (node.type !== this.#node.type) return false;
    this.#node = node;
    this.#attrs = { target: node.attrs.target, form: node.attrs.form };
    return true;
  }

  selectNode() {
    this.dom.classList.add('selected');
  }

  deselectNode() {
    this.dom.classList.remove('selected');
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
    this.#stop();
  }
}
