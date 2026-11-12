/** How citations and notes appear in the text. */

import { baseKeymap } from 'prosemirror-commands';
import { inputRules, InputRule } from 'prosemirror-inputrules';
import { keymap } from 'prosemirror-keymap';
import type { Node } from 'prosemirror-model';
import { EditorState, NodeSelection, Plugin, TextSelection, type Command } from 'prosemirror-state';
import { StepMap } from 'prosemirror-transform';
import { EditorView, type NodeView } from 'prosemirror-view';
import { t } from '$lib/i18n';
import { place } from '$lib/ui/floating';
import { insertMath, splitCitation, toggle, updateCitation } from './commands';
import { openSelected, passes, placeholder, type EditorHooks } from './plugins';
import { pressedFound } from '$lib/found/found.svelte';
import { pastedTextSlice } from './clipboard';
import { refMarkKey, RefMarkView } from './refmarks';
import { citationLabel, currentProject, isMissing, languageOf } from './references.svelte';
import { notePlace, type CiteItem, type CiteMode } from './schema';
import { NO_NOTES_BEFORE, numberNotes, type NotesBefore } from './notes';
import { untrack } from 'svelte';
import { editorUi, hooksOf, OPEN, passing, SHOW, viewsByDom, type ShowIn } from './ui.svelte';
import { numbering, topOf } from '$lib/figures/numbering.svelte';
import { CrossRefView, FormulaView } from '$lib/figures/views.svelte';
import { markIn, searchMarks } from '$lib/search/decorations';
import { spellingOptions } from '$lib/spelling/menu';
import { spellingPlugin } from '$lib/spelling/plugin';

export { hooksOf };

/**
 * The element in view the text of an editor is seen in: as the editor was
 * told, or else the tree under the project its element stands in. Nothing,
 * where the editor holds no element's text.
 */
function viewedAt(hooks: EditorHooks | undefined): string | null {
  if (hooks?.inView) return hooks.inView;
  if (hooks?.at) return hooks.at;
  const project = currentProject();
  return hooks?.element && project?.node(hooks.element) ? topOf(project, hooks.element) : null;
}

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
    // text shows it without being touched. What a locator counts is said in
    // the language of the text, which is read anew at every change to it:
    // the label is written only when it is not what it was.
    this.#stop = $effect.root(() => {
      $effect(() => {
        const { items, mode } = this.#attrs;
        const language = languageOf(hooksOf.get(this.#view)?.element);
        const label = citationLabel(items, mode, language);
        if (this.dom.textContent !== label) this.dom.textContent = label;
        this.dom.classList.toggle('missing', isMissing(items));
      });
    });

    this.dom.addEventListener('click', this.#open);
    // Selected, it is opened by Enter.
    this.dom.addEventListener(OPEN, this.#open);
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
      onsplit: () => {
        const at = this.#getPos();
        if (at !== undefined) splitCitation(at)(view.state, view.dispatch);
      },
      oncopy: (items, mode) => hooksOf.get(view)?.copyCitation?.({ items, mode }),
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
    this.dom.removeEventListener(OPEN, this.#open);
    this.#stop();
  }
}

const PLACES = (): [string, string][] => [
  ['', t('editor-note-place-format')],
  ['foot', t('editor-note-place-foot')],
  ['end', t('editor-note-place-end')],
];

const noteRules = inputRules({
  rules: [new InputRule(/–-$/, '—'), new InputRule(/--$/, '–'), new InputRule(/\.\.\.$/, '…')],
});

/** The notes of each editor's text, by what is drawn of them. */
const noteViews = new WeakMap<HTMLElement, FootnoteView>();

/**
 * The notes before the element of an editor in the document it is part of:
 * none, where the element is not in it, or the editor holds no element's text.
 */
function notesBefore(view: EditorView): NotesBefore {
  const hooks = hooksOf.get(view);
  const element = hooks?.element;
  const project = currentProject();
  // That the element is there, not what it is: see `documentOf` in `figures/views.svelte.ts`.
  if (!element || !project || !untrack(() => project.node(element))) return NO_NOTES_BEFORE;
  const at = hooks?.at ?? topOf(project, element);
  return numbering.of(project, at).within.get(element)?.notes ?? NO_NOTES_BEFORE;
}

/**
 * Numbers the notes of the text of an editor as the document numbers them
 * (`notes.ts`): when the text has changed, and when the notes before it in
 * the document have.
 */
export function noteNumbers(): Plugin {
  return new Plugin({
    view(view) {
      const number = () =>
        numberNotes(view.dom, notesBefore(view), (note) => noteViews.get(note)?.numbered());
      const stop = $effect.root(() => {
        $effect(number);
      });
      number();
      return {
        update: (v, before) => {
          if (v.state.doc !== before.doc) untrack(number);
        },
        destroy: stop,
      };
    },
  });
}

/**
 * A note. In the text it is its number and what it says, to be read without
 * opening it; selected, it opens as a small panel in which its own text is
 * written. The panel holds an editor of its own, whose changes are passed
 * on to the text the note is in.
 */
export class FootnoteView implements NodeView {
  dom: HTMLElement;
  #node: Node;
  #outer: EditorView;
  #getPos: () => number | undefined;
  #panel: HTMLElement | null = null;
  #inner: EditorView | null = null;
  /** What the note says, as it is drawn in the text: an editor that is only read. */
  #shownText: EditorView;

  constructor(node: Node, view: EditorView, getPos: () => number | undefined) {
    this.#node = node;
    this.#outer = view;
    this.#getPos = getPos;
    this.dom = document.createElement('span');
    this.dom.className = 'footnote';
    this.dom.contentEditable = 'false';
    const mark = document.createElement('span');
    mark.className = 'note-mark';
    const text = document.createElement('span');
    text.className = 'note-text';
    // A line may break before it, as in the text drawn without an editor (`model/html.ts`).
    this.dom.append(document.createElement('wbr'), mark, text);
    this.#shownText = new EditorView(
      { mount: text },
      {
        state: EditorState.create({ doc: node }),
        editable: () => false,
        // Citations, formulas and words that point, as the text shows them.
        nodeViews: {
          citation: (n, v, getPos) => new CitationView(n, v, getPos),
          math: (n, v, getPos) => new FormulaView(n, v, getPos),
          crossref: (n, v, getPos) => new CrossRefView(n, v, getPos),
          refmark: (n, v, getPos) => new RefMarkView(n, v, getPos),
        },
        attributes: { spellcheck: 'false' },
      },
    );
    hooksOf.within(this.#shownText, view);
    noteViews.set(this.dom, this);
    this.dom.addEventListener(OPEN, this.#asked);
    this.dom.addEventListener(SHOW, this.#shown);
    this.#number();
  }

  /** Its number has been given it (`noteNumbers`): the open panel says it. */
  numbered() {
    this.#number();
  }

  /**
   * The number is not kept in the text: it is given by `noteNumbers`, from
   * where the note stands in the document.
   */
  #number() {
    this.dom.classList.toggle('blank', this.#node.content.size === 0);
    const place = notePlace(this.#node.attrs.place);
    if (place) this.dom.dataset.place = place;
    else delete this.dom.dataset.place;
    if (!this.#panel) return;
    if (place) this.#panel.dataset.place = place;
    else delete this.#panel.dataset.place;
    const number = this.dom.dataset.number;
    const heading = this.#panel.querySelector('.note-number');
    if (heading)
      heading.textContent = number ? t('editor-note-numbered', { number }) : t('editor-note');
    const select = this.#panel.querySelector<HTMLSelectElement>('.note-place');
    if (select && select.value !== place) select.value = place;
  }

  selectNode() {
    this.dom.classList.add('selected');
    // The cursor on its way through the text selects the note and does not
    // open it: Enter does, and pressing it.
    if (passing(this.#outer)) return;
    if (!this.#inner && this.#outer.editable) this.#open();
  }

  #asked = () => {
    if (!this.#inner && this.#outer.editable) this.#open();
  };

  /** Opened by a search, with what it found selected; the cursor goes there only when asked. */
  #shown = (event: Event) => {
    const { from, to, focus } = (event as CustomEvent<ShowIn>).detail;
    if (!this.#inner && this.#outer.editable) this.#open(focus);
    const inner = this.#inner;
    if (!inner) return;
    const size = inner.state.doc.content.size;
    const at = (n: number) => Math.max(0, Math.min(n, size));
    inner.dispatch(
      inner.state.tr
        .setSelection(TextSelection.create(inner.state.doc, at(from), at(to)))
        .scrollIntoView()
        .setMeta('fromOutside', true),
    );
    // Marked while the cursor is elsewhere; where the cursor goes, it is seen selected.
    markIn(inner, focus ? [] : [{ from: at(from), to: at(to), current: true }]);
    if (focus) inner.focus();
  };

  deselectNode() {
    this.dom.classList.remove('selected');
    this.#close();
  }

  #open(focus = true) {
    const outer = this.#outer;
    const hooks = hooksOf.get(outer);

    const panel = document.createElement('div');
    panel.className = 'note-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', t('editor-note'));
    const head = document.createElement('div');
    head.className = 'note-head';
    const heading = document.createElement('div');
    heading.className = 'note-number';
    // Most notes stand where the format has its notes. One that must stand
    // elsewhere, as when the author's own notes are kept at the foot of the
    // page and the sources at the end, is told here where.
    const select = document.createElement('select');
    select.className = 'note-place';
    select.setAttribute('aria-label', t('editor-note-place'));
    for (const [value, words] of PLACES()) {
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
      'Mod-Alt-k': refMarkKey,
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
          passes(),
          noteRules,
          cite,
          keymap({ Enter: openSelected }),
          keymap(keys),
          keymap(baseKeymap),
          placeholder(() => t('editor-note-placeholder')),
          searchMarks(),
          // In the language of the document of the element the note is in.
          spellingPlugin(
            spellingOptions(
              () => currentProject(),
              () => hooks?.element,
            ),
          ),
        ],
      }),
      attributes: { class: 'prose note', spellcheck: 'false' },
      // Text pasted as text keeps every line break, as breaks: a note has no paragraphs.
      clipboardTextParser: (text, $context) => pastedTextSlice(text, $context, outer.state.schema),
      // A citation that was found is gone through where it is pressed.
      handleClick: (_v, _pos, event) =>
        event.button === 0 && pressedFound(event.target, viewedAt(hooks)),
      nodeViews: {
        citation: (node, v, getPos) => new CitationView(node, v, getPos),
        math: (node, v, getPos) => new FormulaView(node, v, getPos),
        crossref: (node, v, getPos) => new CrossRefView(node, v, getPos),
        refmark: (node, v, getPos) => new RefMarkView(node, v, getPos),
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
    // What is found in the note by a search is marked where it is written.
    viewsByDom.set(this.#inner.dom, this.#inner);

    this.#number();
    place(panel, this.dom.getBoundingClientRect(), { side: 'bottom', align: 'start', gap: 8 });
    const inner = this.#inner;
    inner.dispatch(
      inner.state.tr
        .setSelection(TextSelection.atEnd(inner.state.doc))
        .setMeta('fromOutside', true),
    );
    if (focus) inner.focus();
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
    if (this.#shownText.state.doc !== node)
      this.#shownText.updateState(EditorState.create({ doc: node }));
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
    this.dom.removeEventListener(OPEN, this.#asked);
    this.dom.removeEventListener(SHOW, this.#shown);
    this.#close();
    this.#shownText.destroy();
  }
}

/**
 * A break of the page or of the column, where one writes: a dashed line
 * with its name across it. What it is named is the interface's; the
 * document sets the break itself.
 */
export class PageBreakView implements NodeView {
  dom: HTMLElement;
  #what: string;

  constructor(node: Node) {
    this.#what = node.attrs.what === 'column' ? 'column' : 'page';
    this.dom = document.createElement('div');
    this.dom.className = 'pagebreak';
    this.dom.contentEditable = 'false';
    this.#draw();
  }

  #draw() {
    const label = t(this.#what === 'column' ? 'editor-column-break' : 'editor-page-break');
    this.dom.dataset.what = this.#what;
    this.dom.dataset.label = label;
    const words = document.createElement('span');
    words.className = 'pagebreak-label';
    words.textContent = label;
    this.dom.replaceChildren(words);
  }

  update(node: Node): boolean {
    if (node.type.name !== 'pagebreak') return false;
    const what = node.attrs.what === 'column' ? 'column' : 'page';
    if (what !== this.#what) {
      this.#what = what;
      this.#draw();
    }
    return true;
  }

  ignoreMutation(): boolean {
    return true;
  }
}
