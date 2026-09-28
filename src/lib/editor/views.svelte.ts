/** How citations and notes appear in the text. */

import { baseKeymap } from 'prosemirror-commands';
import { inputRules, InputRule } from 'prosemirror-inputrules';
import { keymap } from 'prosemirror-keymap';
import type { Node } from 'prosemirror-model';
import { EditorState, NodeSelection, Plugin, TextSelection, type Command } from 'prosemirror-state';
import { StepMap } from 'prosemirror-transform';
import { EditorView, type NodeView } from 'prosemirror-view';
import { place } from '$lib/ui/floating';
import { insertMath, toggle, updateCitation } from './commands';
import { placeholder } from './plugins';
import { citationLabel, isMissing } from './references.svelte';
import { notePlace, type CiteItem, type CiteMode } from './schema';
import { editorUi, hooksOf } from './ui.svelte';
import { CrossRefView, FormulaView } from '$lib/figures/views.svelte';

export { hooksOf };

export class CitationView implements NodeView {
  dom: HTMLElement;
  #node: Node;
  #view: EditorView;
  #getPos: () => number | undefined;
  #stop: () => void;
  #attrs = $state.raw<{ items: CiteItem[]; mode: CiteMode }>({ items: [], mode: 'normal' });

  constructor(node: Node, view: EditorView, getPos: () => number | undefined) {
    this.#node = node;
    this.#view = view;
    this.#getPos = getPos;
    this.dom = document.createElement('span');
    this.dom.className = 'citation';
    this.dom.setAttribute('role', 'button');
    this.dom.contentEditable = 'false';
    this.#attrs = { items: node.attrs.items, mode: node.attrs.mode };

    // The label follows the references: when one is changed, or arrives, the
    // text shows it without being touched.
    this.#stop = $effect.root(() => {
      $effect(() => {
        const { items, mode } = this.#attrs;
        this.dom.textContent = citationLabel(items, mode);
        this.dom.classList.toggle('missing', isMissing(items));
      });
    });

    this.dom.addEventListener('click', this.#open);
  }

  #open = (event?: Event) => {
    event?.preventDefault();
    const pos = this.#getPos();
    if (pos === undefined || !this.#view.editable) return;
    const view = this.#view;
    editorUi.editCitation({
      anchor: this.dom.getBoundingClientRect(),
      items: this.#node.attrs.items,
      mode: this.#node.attrs.mode,
      onchange: (items, mode) => {
        const at = this.#getPos();
        if (at !== undefined) updateCitation(at, items, mode)(view.state, view.dispatch);
      },
      onclose: () => view.focus(),
    });
  };

  update(node: Node): boolean {
    if (node.type !== this.#node.type) return false;
    this.#node = node;
    this.#attrs = { items: node.attrs.items, mode: node.attrs.mode };
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
    this.#stop();
  }
}

/**
 * The number a note is shown with: its place among the notes that are
 * counted with it. In the text of a map those are the notes of the map; of
 * an element that is left out of the document, or loose, its own.
 */
export function noteNumberOf(mark: HTMLElement): number {
  const own = mark.closest<HTMLElement>('.section.excluded, .section.loose');
  const scope =
    own ?? mark.closest<HTMLElement>('[data-notes]') ?? mark.closest<HTMLElement>('.prose');
  if (!scope) return 0;
  // Those that have been set to a place of their own are counted by themselves.
  const placed = mark.hasAttribute('data-place');
  let n = 0;
  for (const other of scope.querySelectorAll<HTMLElement>('.footnote')) {
    if (!own && other.closest('.section.excluded, .section.loose')) continue;
    if (other.hasAttribute('data-place') !== placed) continue;
    n++;
    if (other === mark) return n;
  }
  return 0;
}

/** a, b, … z, aa, ab, … */
export function letters(n: number): string {
  let out = '';
  while (n > 0) {
    const r = (n - 1) % 26;
    out = String.fromCharCode(97 + r) + out;
    n = (n - 1 - r) / 26;
  }
  return out;
}

const PLACES: [string, string][] = [
  ['', 'Where the format has its notes'],
  ['foot', 'At the foot of the page'],
  ['end', 'At the end of the text'],
];

const noteRules = inputRules({
  rules: [new InputRule(/–-$/, '—'), new InputRule(/--$/, '–'), new InputRule(/\.\.\.$/, '…')],
});

/**
 * A note. In the text it is its number; selected, it opens as a small panel
 * in which its own text is written. The panel holds an editor of its own,
 * whose changes are passed on to the text the note is in.
 */
export class FootnoteView implements NodeView {
  dom: HTMLElement;
  #node: Node;
  #outer: EditorView;
  #getPos: () => number | undefined;
  #panel: HTMLElement | null = null;
  #inner: EditorView | null = null;

  constructor(node: Node, view: EditorView, getPos: () => number | undefined) {
    this.#node = node;
    this.#outer = view;
    this.#getPos = getPos;
    this.dom = document.createElement('sup');
    this.dom.className = 'footnote';
    this.dom.contentEditable = 'false';
    this.#number();
  }

  /**
   * The number is not written into the text: it is counted by the page, from
   * where the notes stand (see app.css), so that the notes of a map are
   * numbered through all its elements.
   */
  #number() {
    this.dom.classList.toggle('blank', this.#node.content.size === 0);
    const place = notePlace(this.#node.attrs.place);
    if (place) this.dom.dataset.place = place;
    else delete this.dom.dataset.place;
    if (!this.#panel) return;
    if (place) this.#panel.dataset.place = place;
    else delete this.#panel.dataset.place;
    const n = noteNumberOf(this.dom);
    const heading = this.#panel.querySelector('.note-number');
    if (heading) heading.textContent = `Note ${n ? (place ? letters(n) : n) : ''}`.trim();
    const select = this.#panel.querySelector<HTMLSelectElement>('.note-place');
    if (select && select.value !== place) select.value = place;
  }

  selectNode() {
    this.dom.classList.add('selected');
    if (!this.#inner && this.#outer.editable) this.#open();
  }

  deselectNode() {
    this.dom.classList.remove('selected');
    this.#close();
  }

  #open() {
    const outer = this.#outer;
    const hooks = hooksOf.get(outer);

    const panel = document.createElement('div');
    panel.className = 'note-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Note');
    const head = document.createElement('div');
    head.className = 'note-head';
    const heading = document.createElement('div');
    heading.className = 'note-number';
    // Most notes stand where the format has its notes. One that must stand
    // elsewhere, as when the author's own notes are kept at the foot of the
    // page and the sources at the end, is told here where.
    const select = document.createElement('select');
    select.className = 'note-place';
    select.setAttribute('aria-label', 'Where the note stands');
    for (const [value, words] of PLACES) {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = words;
      select.append(option);
    }
    select.addEventListener('change', () => {
      const pos = this.#getPos();
      if (pos === undefined) return;
      const place = notePlace(select.value);
      const tr = outer.state.tr.setNodeMarkup(pos, undefined, { ...this.#node.attrs, place });
      // The note stays the one that is selected, and so stays open.
      outer.dispatch(tr.setSelection(NodeSelection.create(tr.doc, pos)));
      this.#inner?.focus();
    });
    head.append(heading, select);
    panel.append(head);
    const body = document.createElement('div');
    panel.append(body);
    document.body.append(panel);
    this.#panel = panel;

    const leave: Command = () => {
      this.#leave();
      return true;
    };
    const keys: Record<string, Command> = {
      'Mod-z': () => (hooks?.undo(), true),
      'Mod-y': () => (hooks?.redo(), true),
      'Shift-Mod-z': () => (hooks?.redo(), true),
      'Mod-b': toggle('strong'),
      'Mod-i': toggle('em'),
      'Mod-.': toggle('sup'),
      'Mod-,': toggle('sub'),
      'Shift-Mod-k': toggle('smallcaps'),
      'Mod-Alt-m': insertMath,
      'Mod-Alt-r': (_s, _d, v) => {
        if (v && hooks?.point) hooks.point(v);
        return true;
      },
      'Shift-Mod-c': (_s, _d, v) => {
        if (v && hooks?.cite) hooks.cite(v, false);
        return true;
      },
      Escape: leave,
      Enter: leave,
      'Mod-Enter': leave,
    };
    const cite = new Plugin({
      props: {
        handleTextInput: (v, from, _to, text) => {
          if (text !== '@' || !hooks?.cite) return false;
          const before = v.state.doc.textBetween(Math.max(0, from - 1), from, '\n', ' ');
          if (before && !/[\s(\[{“"'‘—–;,]/.test(before)) return false;
          hooks.cite(v, true);
          return true;
        },
      },
    });

    this.#inner = new EditorView(body, {
      state: EditorState.create({
        doc: this.#node,
        plugins: [
          noteRules,
          cite,
          keymap(keys),
          keymap(baseKeymap),
          placeholder(() => 'The text of the note'),
        ],
      }),
      attributes: { class: 'prose note', spellcheck: 'true' },
      nodeViews: {
        citation: (node, v, getPos) => new CitationView(node, v, getPos),
        math: (node, v, getPos) => new FormulaView(node, v, getPos),
        crossref: (node, v, getPos) => new CrossRefView(node, v, getPos),
      },
      dispatchTransaction: (tr) => {
        const inner = this.#inner;
        if (!inner) return;
        const { state, transactions } = inner.state.applyTransaction(tr);
        inner.updateState(state);
        if (!tr.getMeta('fromOutside')) {
          const pos = this.#getPos();
          if (pos === undefined) return;
          const outerTr = outer.state.tr;
          const offset = StepMap.offset(pos + 1);
          for (const t of transactions) {
            for (const step of t.steps) {
              const mapped = step.map(offset);
              if (mapped) outerTr.step(mapped);
            }
          }
          if (outerTr.docChanged) outer.dispatch(outerTr);
        }
      },
      handleDOMEvents: {
        blur: (_v, event) => {
          // Leaving for a panel that belongs to the note (a citation being
          // chosen or changed) is not leaving the note.
          const to = (event as FocusEvent).relatedTarget as HTMLElement | null;
          if (to && (panel.contains(to) || to.closest('.popover, .menu, dialog'))) return false;
          setTimeout(() => {
            if (!this.#inner || this.#inner.hasFocus()) return;
            if (editorUi.picking || editorUi.citation) return;
            if (document.activeElement?.closest('.popover, .menu, dialog')) return;
            this.#leave(false);
          }, 120);
          return false;
        },
      },
    });
    if (hooks) hooksOf.set(this.#inner, hooks);

    this.#number();
    place(panel, this.dom.getBoundingClientRect(), { side: 'bottom', align: 'start', gap: 8 });
    const inner = this.#inner;
    inner.dispatch(
      inner.state.tr
        .setSelection(TextSelection.atEnd(inner.state.doc))
        .setMeta('fromOutside', true),
    );
    inner.focus();
    window.addEventListener('pointerdown', this.#outside, true);
  }

  #outside = (event: PointerEvent) => {
    const target = event.target as HTMLElement | null;
    if (!target || !this.#panel) return;
    if (this.#panel.contains(target) || this.dom.contains(target)) return;
    if (target.closest('.popover, .menu, dialog, .backdrop')) return;
    this.#close();
  };

  /** Closes the panel and puts the cursor after the note, where writing goes on. */
  #leave(focus = true) {
    const pos = this.#getPos();
    const outer = this.#outer;
    this.#close();
    if (pos !== undefined) {
      const after = Math.min(pos + this.#node.nodeSize, outer.state.doc.content.size);
      // A note left empty was not wanted.
      if (this.#node.content.size === 0) {
        outer.dispatch(outer.state.tr.delete(pos, pos + this.#node.nodeSize));
      } else {
        outer.dispatch(outer.state.tr.setSelection(TextSelection.create(outer.state.doc, after)));
      }
    }
    if (focus) outer.focus();
  }

  #close() {
    window.removeEventListener('pointerdown', this.#outside, true);
    this.#inner?.destroy();
    this.#inner = null;
    this.#panel?.remove();
    this.#panel = null;
  }

  update(node: Node): boolean {
    if (node.type !== this.#node.type) return false;
    this.#node = node;
    const inner = this.#inner;
    if (inner) {
      const state = inner.state;
      const start = node.content.findDiffStart(state.doc.content);
      if (start != null) {
        let { a: endA, b: endB } = node.content.findDiffEnd(state.doc.content)!;
        const overlap = start - Math.min(endA, endB);
        if (overlap > 0) {
          endA += overlap;
          endB += overlap;
        }
        inner.dispatch(
          state.tr.replace(start, endB, node.slice(start, endA)).setMeta('fromOutside', true),
        );
      }
    }
    this.#number();
    return true;
  }

  stopEvent(event: Event): boolean {
    const target = event.target as globalThis.Node | null;
    return !!this.#panel && !!target && this.#panel.contains(target);
  }

  ignoreMutation(): boolean {
    return true;
  }

  destroy() {
    this.#close();
  }
}
