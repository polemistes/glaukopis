/**
 * Passages in the editor: the one the cursor is in, how its paragraphs are
 * numbered, what is said by hand of one paragraph, and the numbers drawn in
 * the margin (ADR 0039 and 0040). And texts side by side: a block of two
 * sides, each a text of its own (ADR 0027).
 */

import type { Node } from 'prosemirror-model';
import {
  Plugin,
  PluginKey,
  TextSelection,
  type Command,
  type EditorState,
  type Transaction,
} from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';
import {
  countedKind,
  renamed,
  type BasedKind,
  type Numbering,
  type Side,
} from '$lib/project/model/families';
import { lineNumbers } from '$lib/project/model/lines';

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
    paragraph.attrs.counted !== false
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
  margin: string | null;
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
      margin: marks.margin?.trim() || null,
    };
    const same = (['number', 'counted', 'margin'] as const).every(
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
 * The numbers of every numbered passage, as decorations: `data-n` on each
 * paragraph that shows one, `data-n-set` where it was given by hand, so
 * that it is drawn as dark as the text; and on the passage the side its
 * numbers stand on, the passage's own or the layout's.
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
      if (s)
        list.push(
          Decoration.node(
            at,
            at + paragraph.nodeSize,
            s.set ? { 'data-n': s.label, 'data-n-set': '' } : { 'data-n': s.label },
          ),
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
