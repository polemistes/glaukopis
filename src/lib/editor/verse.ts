/**
 * Verse in the editor: paragraphs made lines of verse and lines made
 * paragraphs again, the kind of a line (a line, a speaker, a stage
 * direction), its indentation, the numbering of the lines, and the
 * numbers drawn in the margin. And texts side by side: a block of two
 * sides, each a text of its own.
 */

import type { Node } from 'prosemirror-model';
import {
  Plugin,
  PluginKey,
  TextSelection,
  type Command,
  type EditorState,
} from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';
import type { VerseLineKind } from '$lib/project/model/text';

/** The verse the cursor is in, with where it begins, and the line within it. */
export function verseAt(
  state: EditorState,
): { verse: Node; pos: number; line: Node; linePos: number } | null {
  const { $from } = state.selection;
  for (let d = $from.depth; d > 0; d--) {
    const node = $from.node(d);
    if (node.type.name === 'verse') {
      const line = $from.node(d + 1);
      if (!line || line.type.name !== 'verse_line') return null;
      return { verse: node, pos: $from.before(d), line, linePos: $from.before(d + 1) };
    }
  }
  return null;
}

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

/** The paragraphs the selection touches, side by side in what holds them: made lines of one verse. */
export const makeVerse: Command = (state, dispatch) => {
  const { verse, verse_line, paragraph } = state.schema.nodes;
  if (!verse || !verse_line || !paragraph) return false;
  if (verseAt(state)) return false;
  // Everything selected stands at the top: the ends are taken within the blocks.
  const { doc } = state;
  const $from =
    state.selection.$from.depth === 0 && doc.content.size
      ? doc.resolve(Math.min(state.selection.from + 1, doc.content.size))
      : state.selection.$from;
  const $to =
    state.selection.$to.depth === 0 && state.selection.to > 0
      ? doc.resolve(Math.max(state.selection.to - 1, 0))
      : state.selection.$to;
  let depth = $from.depth;
  while (depth > 0 && $from.node(depth).type !== paragraph) depth--;
  if (!depth) return false;
  const parent = $from.node(depth - 1);
  const first = $from.index(depth - 1);
  const last =
    $to.depth >= depth - 1 && $to.node(depth - 1) === parent ? $to.index(depth - 1) : first;
  const lines: Node[] = [];
  let size = 0;
  for (let i = first; i <= last; i++) {
    const child = parent.child(i);
    if (child.type !== paragraph) break;
    lines.push(verse_line.create(null, child.content));
    size += child.nodeSize;
  }
  if (!lines.length) return false;
  if (dispatch) {
    const from = $from.before(depth);
    const tr = state.tr.replaceWith(from, from + size, verse.create(null, lines));
    tr.setSelection(TextSelection.near(tr.doc.resolve(from + 2)));
    dispatch(tr.scrollIntoView());
  }
  return true;
};

/** The verse the cursor is in made paragraphs again. */
export const unmakeVerse: Command = (state, dispatch) => {
  const at = verseAt(state);
  const { paragraph } = state.schema.nodes;
  if (!at || !paragraph) return false;
  if (dispatch) {
    const paragraphs: Node[] = [];
    at.verse.forEach((line) => paragraphs.push(paragraph.create(null, line.content)));
    const offset = state.selection.from - at.pos;
    const tr = state.tr.replaceWith(at.pos, at.pos + at.verse.nodeSize, paragraphs);
    tr.setSelection(
      TextSelection.near(tr.doc.resolve(Math.min(at.pos + offset, tr.doc.content.size))),
    );
    dispatch(tr.scrollIntoView());
  }
  return true;
};

/** Says what the line the cursor is in is. */
export function setLineKind(kind: VerseLineKind): Command {
  return (state, dispatch) => {
    const at = verseAt(state);
    if (!at) return false;
    if (dispatch && at.line.attrs.kind !== kind)
      dispatch(state.tr.setNodeMarkup(at.linePos, undefined, { ...at.line.attrs, kind }));
    return true;
  };
}

/** The line the cursor is in indented a step more, or less. */
export function indentLine(by: 1 | -1): Command {
  return (state, dispatch) => {
    const at = verseAt(state);
    if (!at) return false;
    const indent = Math.max(0, Math.min(8, (at.line.attrs.indent as number) + by));
    if (dispatch && indent !== at.line.attrs.indent)
      dispatch(state.tr.setNodeMarkup(at.linePos, undefined, { ...at.line.attrs, indent }));
    return true;
  };
}

/** Numbers the lines of the verse the cursor is in from `start` every `by`; with nothing, numbers them no more. */
export function numberLines(start: number | null, by: number): Command {
  return (state, dispatch) => {
    const at = verseAt(state);
    if (!at) return false;
    if (dispatch)
      dispatch(
        state.tr.setNodeMarkup(at.pos, undefined, { start, by: Math.max(1, Math.round(by) || 5) }),
      );
    return true;
  };
}

/** Enter on an empty last line leaves the verse: a paragraph after it. */
export const leaveVerse: Command = (state, dispatch) => {
  const at = verseAt(state);
  const { paragraph } = state.schema.nodes;
  if (!at || !paragraph || at.line.content.size || !state.selection.empty) return false;
  const last = at.verse.lastChild === at.line;
  if (!last) return false;
  if (dispatch) {
    const after = at.pos + at.verse.nodeSize;
    let tr = state.tr;
    if (at.verse.childCount > 1) tr = tr.delete(at.linePos, at.linePos + at.line.nodeSize);
    const where = at.verse.childCount > 1 ? after - at.line.nodeSize : after;
    tr = tr.insert(where, paragraph.create());
    tr.setSelection(TextSelection.near(tr.doc.resolve(where + 1)));
    // A verse of one empty line is nothing.
    if (at.verse.childCount === 1) tr = tr.delete(at.pos, at.pos + at.verse.nodeSize);
    dispatch(tr.scrollIntoView());
  }
  return true;
};

/** Backspace at the start of the first line of a verse makes it a paragraph. */
export const backOutOfVerse: Command = (state, dispatch) => {
  const at = verseAt(state);
  if (!at || !state.selection.empty || state.selection.from !== at.linePos + 1) return false;
  if (at.verse.firstChild !== at.line) return false;
  return unmakeVerse(state, dispatch);
};

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

const key = new PluginKey<DecorationSet>('verse-numbers');

function numbers(doc: Node): DecorationSet {
  const list: Decoration[] = [];
  doc.descendants((node, pos) => {
    if (node.type.name !== 'verse') return true;
    const start = node.attrs.start as number | null;
    if (start === null) return false;
    const by = Math.max(1, node.attrs.by as number);
    let n = start;
    let at = pos + 1;
    node.forEach((line) => {
      if (line.type.name === 'verse_line' && line.attrs.kind === 'line') {
        if (n === start || n % by === 0)
          list.push(Decoration.node(at, at + line.nodeSize, { 'data-n': String(n) }));
        n++;
      }
      at += line.nodeSize;
    });
    return false;
  });
  return DecorationSet.create(doc, list);
}

/** Draws the numbers of the lines of verse, where the lines are numbered. */
export function verseNumbers(): Plugin<DecorationSet> {
  return new Plugin<DecorationSet>({
    key,
    state: {
      init: (_config, state) => numbers(state.doc),
      apply: (tr, set) => (tr.docChanged ? numbers(tr.doc) : set),
    },
    props: { decorations: (state) => key.getState(state) },
  });
}
