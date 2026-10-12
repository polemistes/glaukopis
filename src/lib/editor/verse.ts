/**
 * Passages in the editor: the one the cursor is in, how its paragraphs are
 * numbered, what is said by hand of one paragraph, and the numbers drawn in
 * the margin (ADR 0039 and 0040). And texts side by side: a block of two
 * sides, each a text of its own (ADR 0027).
 */

import { NodeRange, type Node } from 'prosemirror-model';
import {
  Plugin,
  PluginKey,
  TextSelection,
  type Command,
  type EditorState,
  type Transaction,
} from 'prosemirror-state';
import { Decoration, DecorationSet, type EditorView } from 'prosemirror-view';
import { t } from '$lib/i18n';
import {
  countedKind,
  renamed,
  type BasedKind,
  type Numbering,
  type Side,
} from '$lib/project/model/families';
import { lineNumbers, type Shown } from '$lib/project/model/lines';
import { blank } from './stanzas';

/** The passage the cursor is in, with where it begins, and the paragraph within it. */
export function passageAt(state: EditorState): {
  passage: Node;
  pos: number;
  paragraph: Node;
  paragraphPos: number;
  /** Which paragraph of the passage it is. */
  index: number;
} | null {
  const { $from } = state.selection;
  for (let d = $from.depth; d > 0; d--) {
    const node = $from.node(d);
    if (node.type.name === 'passage') {
      const paragraph = $from.node(d + 1);
      if (!paragraph || paragraph.type.name !== 'paragraph') return null;
      return {
        passage: node,
        pos: $from.before(d),
        paragraph,
        paragraphPos: $from.before(d + 1),
        index: $from.index(d),
      };
    }
  }
  return null;
}

/** How a passage numbers its paragraphs: see `passage` in `schema.ts`. */
export interface PassageNumbering {
  numbering: Numbering;
  /** Every how many a counted number is shown; nothing for the layout's. */
  every: number | null;
  /** The side the numbers stand on; nothing for the layout's. */
  side: Side | null;
}

/** Numbers the paragraphs of the passage the cursor is in as said; with `none`, numbers them no more. */
export function numberLines(how: PassageNumbering): Command {
  return (state, dispatch) => {
    const at = passageAt(state);
    if (!at) return false;
    const attrs = {
      ...at.passage.attrs,
      numbering: how.numbering,
      every: how.every && how.every >= 1 ? Math.round(how.every) : null,
      side: how.side === 'left' || how.side === 'right' ? how.side : null,
    };
    const same = (['numbering', 'every', 'side'] as const).every(
      (k) => (at.passage.attrs[k] ?? null) === attrs[k],
    );
    if (dispatch && !same) dispatch(state.tr.setNodeMarkup(at.pos, undefined, attrs));
    return true;
  };
}

/** Whether a paragraph is counted by a numbering: its kind is counted, and the writer did not say otherwise. */
export function isCounted(paragraph: Node, own: readonly BasedKind[] = []): boolean {
  return (
    countedKind(renamed((paragraph.attrs.kind as string) || 'text'), own) &&
    paragraph.attrs.counted !== false &&
    // An empty paragraph is never counted: in verse it is the break between two stanzas.
    !blank(paragraph)
  );
}

/** The first counted paragraph of a passage, with where it begins within the passage's content; nothing where none is counted. */
export function firstCounted(
  passage: Node,
  own: readonly BasedKind[] = [],
): { node: Node; offset: number; index: number } | null {
  let found: { node: Node; offset: number; index: number } | null = null;
  passage.forEach((node, offset, index) => {
    if (!found && isCounted(node, own)) found = { node, offset, index };
  });
  return found;
}

/**
 * Numbers the passage the cursor is in from a number: the first counted
 * paragraph is given it, from which the count goes on. With nothing, the
 * number it had is taken away. `own` is the kinds of the writer's own, for
 * which paragraphs are counted.
 */
export function numberFrom(from: string | null, own: readonly BasedKind[] = []): Command {
  return (state, dispatch) => {
    const at = passageAt(state);
    if (!at) return false;
    const first = firstCounted(at.passage, own);
    if (!first) return false;
    const number = from?.trim() || null;
    if (dispatch && (first.node.attrs.number ?? null) !== number)
      dispatch(
        state.tr.setNodeMarkup(at.pos + 1 + first.offset, undefined, {
          ...first.node.attrs,
          number,
        }),
      );
    return true;
  };
}

/** What is said of one paragraph by hand: see `paragraph` in `schema.ts`. */
export interface LineMarks {
  number: string | null;
  counted: boolean;
  /** Counted, and its number not shown. */
  hidden: boolean;
  margin: string | null;
}

/** What the dialog of the numbers asks about: see `LineNumbersDialog.svelte`. */
export interface NumbersAsked {
  /** Whether the cursor stands in text, which is made a numbered passage of text when the dialog says to number it. */
  text?: boolean;
  passage: PassageNumbering;
  /** The number the first counted paragraph has, and whether it is the one the cursor is in; nothing where none is counted. */
  from: { number: string | null; here: boolean } | null;
  /** The paragraph the cursor is in: what is said of it, its words, and whether its kind is counted at all. */
  line: LineMarks & { kind: string; words: string; countable: boolean };
}

/**
 * How the passage the cursor is in is numbered, and what is said of the
 * paragraph the cursor is in, as the dialog asks about them; nothing
 * outside a passage. `own` is the kinds of the writer's own, for which
 * paragraphs are counted.
 */
export function numbersAsked(
  state: EditorState,
  own: readonly BasedKind[] = [],
): NumbersAsked | null {
  const at = passageAt(state);
  if (!at) {
    // In text: its paragraphs are to be numbered, every one, counted from 1 unless the writer says otherwise.
    const run = textRun(state);
    if (!run) return null;
    const { attrs } = run.paragraph;
    return {
      text: true,
      passage: { numbering: 'counted', every: 1, side: null },
      from: { number: '1', here: run.here },
      line: {
        kind: 'text',
        number: run.here ? '1' : ((attrs.number as string | null) ?? null),
        counted: attrs.counted !== false,
        hidden: attrs.hidden === true,
        margin: (attrs.margin as string | null) ?? null,
        words: run.paragraph.textContent,
        countable: true,
      },
    };
  }
  const { attrs } = at.paragraph;
  const first = firstCounted(at.passage, own);
  return {
    passage: {
      numbering: (at.passage.attrs.numbering as Numbering) ?? 'none',
      every: (at.passage.attrs.every as number | null) ?? null,
      side: (at.passage.attrs.side as Side | null) ?? null,
    },
    from: first
      ? {
          number: (first.node.attrs.number as string | null) ?? null,
          here: first.index === at.index,
        }
      : null,
    line: {
      kind: String(attrs.kind ?? 'text'),
      number: (attrs.number as string | null) ?? null,
      counted: attrs.counted !== false,
      hidden: attrs.hidden === true,
      margin: (attrs.margin as string | null) ?? null,
      words: at.paragraph.textContent,
      // Whether its kind is counted at all: only then can it be given a number, or left out of the count.
      countable: countedKind(renamed(String(attrs.kind ?? 'text')), own),
    },
  };
}

/**
 * The paragraphs of text the cursor stands among, outside any passage: those
 * the selection touches, or, where nothing is selected, the run of
 * paragraphs of text the cursor is in, up to whatever is not one. With the
 * paragraph the cursor is in, and whether it is the first of them. Nothing
 * where the cursor is in a passage, or in a paragraph of a kind, or where a
 * passage cannot stand.
 */
export function textRun(
  state: EditorState,
): { from: number; to: number; depth: number; paragraph: Node; here: boolean } | null {
  const { $from, $to, empty } = state.selection;
  let d = $from.depth;
  while (d > 0 && $from.node(d).type.name !== 'paragraph') d--;
  if (!d) return null;
  const parent = $from.node(d - 1);
  const passage = state.schema.nodes.passage;
  if (!passage || parent.type === passage) return null;
  const isText = (n: Node | null | undefined) =>
    !!n && n.type.name === 'paragraph' && renamed((n.attrs.kind as string) || 'text') === 'text';
  const at = $from.index(d - 1);
  if (!isText(parent.child(at))) return null;
  let first = at;
  let last = at;
  if (!empty && $to.depth >= d && $to.node(d - 1) === parent) last = $to.index(d - 1);
  if (empty) {
    while (first > 0 && isText(parent.child(first - 1))) first--;
    while (last + 1 < parent.childCount && isText(parent.child(last + 1))) last++;
  }
  for (let i = first; i <= last; i++) if (!isText(parent.child(i))) return null;
  if (!parent.canReplaceWith(first, last + 1, passage)) return null;
  let from = $from.start(d - 1);
  for (let i = 0; i < first; i++) from += parent.child(i).nodeSize;
  let to = from;
  for (let i = first; i <= last; i++) to += parent.child(i).nodeSize;
  return { from, to, depth: d - 1, paragraph: parent.child(at), here: at === first };
}

/** Makes the paragraphs of text the cursor stands among a passage of text, numbered as said (ADR 0040). */
export function numberText(how: PassageNumbering): Command {
  return (state, dispatch) => {
    const run = textRun(state);
    const passage = state.schema.nodes.passage;
    if (!run || !passage || how.numbering === 'none') return false;
    if (dispatch) {
      const range = new NodeRange(
        state.doc.resolve(run.from + 1),
        state.doc.resolve(run.to - 1),
        run.depth,
      );
      const attrs = {
        family: 'text',
        numbering: how.numbering,
        every: how.every && how.every >= 1 ? Math.round(how.every) : null,
        side: how.side === 'left' || how.side === 'right' ? how.side : null,
      };
      dispatch(state.tr.wrap(range, [{ type: passage, attrs }]).scrollIntoView());
    }
    return true;
  };
}

/** Gives the paragraph the cursor is in a number or a label, counts it or not, and gives it words in the margin. */
export function markLine(marks: LineMarks): Command {
  return (state, dispatch) => {
    const { $from } = state.selection;
    let depth = $from.depth;
    while (depth > 0 && $from.node(depth).type.name !== 'paragraph') depth--;
    if (!depth) return false;
    const node = $from.node(depth);
    const attrs = {
      ...node.attrs,
      number: marks.number?.trim() || null,
      counted: marks.counted,
      // Nothing where it is not so, never false: see `hidden` in `schema.ts`.
      hidden: marks.counted && marks.hidden ? true : null,
      margin: marks.margin?.trim() || null,
    };
    const same = (['number', 'counted', 'hidden', 'margin'] as const).every(
      (k) => (node.attrs[k] ?? null) === attrs[k],
    );
    if (dispatch && !same) dispatch(state.tr.setNodeMarkup($from.before(depth), undefined, attrs));
    return true;
  };
}

// ---- texts side by side ----

/** The side of a parallel text the cursor is in. */
function sideAt(
  state: EditorState,
): { parallel: Node; pos: number; side: number; depth: number } | null {
  const { $from } = state.selection;
  for (let d = $from.depth; d > 0; d--) {
    if (
      $from.node(d).type.name === 'parallel_side' &&
      $from.node(d - 1)?.type.name === 'parallel'
    ) {
      return {
        parallel: $from.node(d - 1),
        pos: $from.before(d - 1),
        side: $from.index(d - 1),
        depth: d,
      };
    }
  }
  return null;
}

/** Two texts side by side where the cursor is, each a paragraph to begin with. */
export const insertParallel: Command = (state, dispatch) => {
  const { parallel, parallel_side, paragraph } = state.schema.nodes;
  if (!parallel || !parallel_side || !paragraph) return false;
  if (sideAt(state)) return false;
  if (dispatch) {
    const side = () => parallel_side.create(null, paragraph.create());
    const made = parallel.create(null, [side(), side()]);
    const { $from } = state.selection;
    const depth = $from.depth > 0 ? 1 : 0;
    const where = depth ? $from.after(depth) : $from.pos;
    const tr = state.tr.insert(where, made);
    tr.setSelection(TextSelection.near(tr.doc.resolve(where + 3)));
    dispatch(tr.scrollIntoView());
  }
  return true;
};

/** Backspace in two sides that are both empty takes the block away. */
export const backOutOfParallel: Command = (state, dispatch) => {
  const at = sideAt(state);
  if (!at || !state.selection.empty) return false;
  const empty = (side: Node) => side.childCount === 1 && side.firstChild!.content.size === 0;
  if (!empty(at.parallel.child(0)) || !empty(at.parallel.child(1))) return false;
  if (dispatch) {
    const { paragraph } = state.schema.nodes;
    const tr = state.tr.replaceWith(at.pos, at.pos + at.parallel.nodeSize, paragraph.create());
    tr.setSelection(TextSelection.near(tr.doc.resolve(at.pos + 1)));
    dispatch(tr.scrollIntoView());
  }
  return true;
};

/** Tab in the left side goes to the right; Shift+Tab back. */
export function acrossParallel(back: boolean): Command {
  return (state, dispatch) => {
    const at = sideAt(state);
    if (!at) return false;
    const target = back ? 0 : 1;
    if (at.side === target) return false;
    if (dispatch) {
      const sidePos = at.pos + 1 + (target === 1 ? at.parallel.child(0).nodeSize : 0);
      dispatch(
        state.tr.setSelection(TextSelection.near(state.doc.resolve(sidePos + 1))).scrollIntoView(),
      );
    }
    return true;
  };
}

// ---- the numbers in the margin ----

/** How the layout shows the numbers of a passage that does not say: every how many, and on which side. */
export interface NumbersLayout {
  every: number;
  side: Side;
}

export const LAYOUT_NUMBERS: NumbersLayout = { every: 5, side: 'left' };

const key = new PluginKey<DecorationSet>('passage-numbers');

/**
 * Gives the paragraph that begins at `pos` a number or a label by hand, or,
 * with nothing, takes away the one it had: what the field in the margin
 * does. Whether it is counted, and its words in the margin, stay.
 */
export function giveNumber(pos: number, number: string | null): Command {
  return (state, dispatch) => {
    const node = pos >= 0 && pos < state.doc.content.size ? state.doc.nodeAt(pos) : null;
    if (!node || node.type.name !== 'paragraph') return false;
    const given = number?.trim() || null;
    if (dispatch && (node.attrs.number ?? null) !== given)
      dispatch(state.tr.setNodeMarkup(pos, undefined, { ...node.attrs, number: given }));
    return true;
  };
}

/**
 * Opens the field for the number of the paragraph a number stands by, in
 * the place of the number: Enter gives the paragraph what is written, an
 * empty field takes its number away, Escape leaves it as it was. The text
 * has the cursor again afterwards.
 */
function editNumber(view: EditorView, getPos: () => number | undefined, el: HTMLElement) {
  const at = getPos();
  if (at === undefined || !view.editable || el.classList.contains('editing')) return;
  const $at = view.state.doc.resolve(at);
  const paragraph = $at.parent;
  if (paragraph.type.name !== 'paragraph') return;
  const was = el.textContent;
  const input = document.createElement('input');
  input.className = 'line-number-field';
  input.type = 'text';
  input.value = String(paragraph.attrs.number ?? '');
  input.placeholder = '#';
  input.setAttribute('aria-label', t('editor-line-number'));
  input.spellcheck = false;
  el.classList.add('editing');
  el.replaceChildren(input);
  let done = false;
  const finish = (keep: boolean) => {
    if (done) return;
    done = true;
    const value = input.value;
    el.classList.remove('editing');
    el.textContent = was;
    if (keep && !view.isDestroyed) {
      // The paragraph may have moved while the field was open: it is found anew from the widget.
      const now = getPos();
      if (now !== undefined) {
        const $now = view.state.doc.resolve(now);
        if ($now.parent.type.name === 'paragraph')
          giveNumber($now.before(), value)(view.state, view.dispatch);
      }
    }
    if (!view.isDestroyed) view.focus();
  };
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      finish(true);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      finish(false);
    }
  });
  input.addEventListener('blur', () => finish(false));
  input.focus();
  input.select();
}

/**
 * The number in the margin of a paragraph, as a widget at its head: the
 * label, or an empty place where none is shown, which is seen when the
 * pointer rests on the paragraph; pressing either opens the field for the
 * paragraph's number.
 */
function numberWidget(
  shown: Shown | null,
  held = false,
): (view: EditorView, getPos: () => number | undefined) => HTMLElement {
  return (view, getPos) => {
    const el = document.createElement('span');
    el.className = shown ? (held ? 'line-number held' : 'line-number') : 'line-number blank';
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '-1');
    if (shown) {
      el.textContent = shown.label;
      el.dataset.label = shown.label;
      if (shown.set) el.dataset.given = '';
      // Counted, and not shown in the document: seen here, in parentheses, so that the writer knows it is there.
      if (held) el.dataset.held = '';
    }
    el.title = held ? t('editor-line-number-held') : t('editor-line-number-press');
    el.addEventListener('mousedown', (event) => {
      // The text keeps its cursor: the number is not a place in it.
      if (!(event.target instanceof HTMLInputElement)) event.preventDefault();
    });
    el.addEventListener('click', (event) => {
      if (event.target instanceof HTMLInputElement) return;
      event.preventDefault();
      editNumber(view, getPos, el);
    });
    return el;
  };
}

/**
 * The numbers of every numbered passage, as decorations: `data-n` on each
 * paragraph that shows one, `data-n-set` where it was given by hand, so
 * that it is drawn as dark as the text; a widget at the head of each
 * paragraph that draws the number, or the place for one, by which it is
 * edited; and on the passage the side its numbers stand on, the passage's
 * own or the layout's. A passage that is not numbered gets nothing but
 * the side.
 */
function numbers(doc: Node, own: readonly BasedKind[], layout: NumbersLayout): DecorationSet {
  const list: Decoration[] = [];
  doc.descendants((node, pos) => {
    if (node.type.name !== 'passage') return !node.isTextblock;
    const side = (node.attrs.side as Side | null) ?? layout.side;
    list.push(Decoration.node(pos, pos + node.nodeSize, { 'data-numbers': side }));
    if (node.attrs.numbering === 'none' || !node.attrs.numbering) return false;
    const lines: { counted: boolean; number: string | null }[] = [];
    node.forEach((paragraph) =>
      lines.push({
        counted: isCounted(paragraph, own),
        number: paragraph.attrs.number as string | null,
      }),
    );
    const every = (node.attrs.every as number | null) ?? layout.every;
    const shown = lineNumbers(node.attrs.numbering as Numbering, every, lines);
    let at = pos + 1;
    node.forEach((paragraph, _offset, i) => {
      const s = shown[i];
      // A number held back is counted, and shows nothing in the document.
      const held = paragraph.attrs.hidden === true;
      if (s && !held)
        list.push(
          Decoration.node(
            at,
            at + paragraph.nodeSize,
            s.set ? { 'data-n': s.label, 'data-n-set': '' } : { 'data-n': s.label },
          ),
        );
      list.push(
        Decoration.widget(at + 1, numberWidget(s, held), {
          side: -1,
          key: s
            ? `line-number:${s.label}${s.set ? ':given' : ''}${held ? ':held' : ''}`
            : 'line-number:blank',
          ignoreSelection: true,
          stopEvent: () => true,
        }),
      );
      at += paragraph.nodeSize;
    });
    return false;
  });
  return DecorationSet.create(doc, list);
}

/**
 * Draws the numbers of the paragraphs of the passages that are numbered.
 * `own` gives the kinds of the writer's own, for which paragraphs are
 * counted; `layout` what the document's layout says of the numbers, which
 * the editor is told anew by `relayoutNumbers` when it changes.
 */
export function passageNumbers(
  own: () => readonly BasedKind[] = () => [],
  layout: () => NumbersLayout = () => LAYOUT_NUMBERS,
): Plugin<DecorationSet> {
  return new Plugin<DecorationSet>({
    key,
    state: {
      init: (_config, state) => numbers(state.doc, own(), layout()),
      apply: (tr, set) =>
        tr.docChanged || tr.getMeta(key) ? numbers(tr.doc, own(), layout()) : set,
    },
    props: { decorations: (state) => key.getState(state) },
  });
}

/** Has the numbers drawn anew, as when the layout or the kinds of the writer's own have changed. */
export function relayoutNumbers(view: { state: EditorState; dispatch: (tr: Transaction) => void }) {
  view.dispatch(view.state.tr.setMeta(key, true).setMeta('addToHistory', false));
}
