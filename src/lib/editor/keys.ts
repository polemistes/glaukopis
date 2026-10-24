/**
 * The keys of a text, the same in every kind of paragraph (ADR 0041):
 *
 * - Enter parts the paragraph where the cursor is; the new one is of the
 *   same kind, with the same indent and numbering. On an empty paragraph of
 *   a kind it makes the paragraph text instead, which is how one leaves a
 *   list, a verse or a dialogue.
 * - Shift+Enter begins a new line within the paragraph.
 * - Backspace at the start of a line joins it to the line before; at the
 *   start of a paragraph, to the paragraph before, whose kind holds.
 * - Tab and Shift+Tab indent and outdent: a line of verse by itself, any
 *   other paragraph as a whole.
 *
 * And the line marks kept where they belong: at the start of a line, with
 * the cursor after them, never before.
 */

import { joinBackward } from 'prosemirror-commands';
import type { Node } from 'prosemirror-model';
import {
  EditorState,
  Plugin,
  PluginKey,
  Selection,
  TextSelection,
  type Command,
  type Transaction,
} from 'prosemirror-state';
import { ySyncPluginKey } from 'y-prosemirror';
import { type BasedKind } from '$lib/project/model/families';
import { catalogueKindOf } from './kinds';
import { changedRanges } from './changes';
import { kindOfNode, linesOfNode, marksAnything, STRETCH_ATTRS, type LineAt } from './shape';

/** The paragraph a place is in, with where it begins, its lines, and the line the place is in; nothing outside a paragraph. */
export function lineAtPos(
  doc: Node,
  at: number,
): { paragraph: Node; pos: number; lines: LineAt[]; line: LineAt } | null {
  const $at = doc.resolve(at);
  if ($at.parent.type.name !== 'paragraph' || $at.depth === 0) return null;
  const pos = $at.before();
  const lines = linesOfNode($at.parent, pos);
  const line = lines.find((l) => l.start <= at && at <= l.end) ?? lines[lines.length - 1];
  return { paragraph: $at.parent, pos, lines, line };
}

/** The paragraph the cursor is in, with its lines and the line the cursor is in. */
export const cursorLine = (state: EditorState) => lineAtPos(state.doc, state.selection.head);

/** Whether nothing but line marks stands between the start of a line and a place in it. */
function onlyMarksBefore(doc: Node, line: LineAt, at: number): boolean {
  if (at < line.start) return false;
  let only = true;
  doc.nodesBetween(line.start, at, (node) => {
    if (node.type.name !== 'linemark' && node.isInline) only = false;
    return true;
  });
  return only;
}

/** Whether a paragraph holds nothing but line marks. */
function emptyParagraph(paragraph: Node): boolean {
  let empty = true;
  paragraph.forEach((child) => {
    if (child.type.name !== 'linemark') empty = false;
  });
  return empty;
}

/**
 * Enter: the paragraph parted at the cursor, the part after of the same
 * kind, indent and numbering; a line mark at the start of the line goes
 * with the line it begins. A line break right at the cursor becomes the
 * break between the two paragraphs, so that no empty line is left. On an
 * empty paragraph of a kind, the paragraph is made text.
 */
export const enterKey: Command = (state, dispatch) => {
  const { selection } = state;
  if (!(selection instanceof TextSelection)) return false;
  const { $from, $to } = selection;
  if (!$from.sameParent($to) || $from.parent.type.name !== 'paragraph') return false;
  const paragraph = $from.parent;
  if (selection.empty && emptyParagraph(paragraph) && kindOfNode(paragraph) !== 'text') {
    // Leaving a list, a verse or a dialogue leaves its numbering too, where
    // the paragraph is the last of its stretch: what is written after it is
    // not numbered unless the writer says so.
    const next = $from.node(-1).maybeChild($from.index(-1) + 1);
    const sameStretch =
      next?.type.name === 'paragraph' &&
      STRETCH_ATTRS.every((k) => (next.attrs[k] ?? null) === (paragraph.attrs[k] ?? null));
    const leaves = sameStretch ? {} : { numbering: null, every: null, side: null, only: null };
    if (dispatch)
      dispatch(
        state.tr
          .setNodeMarkup($from.before(), undefined, {
            ...paragraph.attrs,
            kind: 'text',
            indent: 0,
            ...leaves,
          })
          .scrollIntoView(),
      );
    return true;
  }
  if (!dispatch) return true;
  const tr = state.tr;
  if (!selection.empty) tr.deleteSelection();
  const at = tr.selection.from;
  const found = lineAtPos(tr.doc, at);
  if (!found) return false;
  const { line } = found;
  let cut = onlyMarksBefore(tr.doc, line, at) ? line.start : at;
  const before = tr.doc.resolve(cut).nodeBefore;
  const after = tr.doc.resolve(at).nodeAfter;
  if (before?.type.name === 'hard_break') {
    tr.delete(cut - 1, cut);
    cut -= 1;
  } else if (after?.type.name === 'hard_break' && at === line.end) {
    tr.delete(at, at + 1);
  }
  const attrs = { ...found.paragraph.attrs, new: null };
  tr.split(cut, 1, [{ type: found.paragraph.type, attrs }]);
  // The cursor at the start of the new paragraph, after its line mark if it has one.
  const $start = tr.doc.resolve(cut + 2);
  const mark = $start.nodeAfter?.type.name === 'linemark' ? 1 : 0;
  tr.setSelection(TextSelection.create(tr.doc, cut + 2 + mark));
  dispatch(tr.scrollIntoView());
  return true;
};

/**
 * Shift+Enter: a new line within the paragraph. At the start of a line,
 * the break stands before the line's mark, which stays with its line.
 */
export const breakKey: Command = (state, dispatch) => {
  const br = state.schema.nodes.hard_break;
  if (!br) return false;
  const { $from, empty } = state.selection;
  if (!$from.parent.inlineContent) return false;
  if (!$from.parent.canReplaceWith($from.index(), $from.index(), br)) return false;
  if (dispatch) {
    const found = empty ? cursorLine(state) : null;
    if (found && found.line.mark && onlyMarksBefore(state.doc, found.line, $from.pos)) {
      const tr = state.tr.insert(found.line.start, br.create());
      tr.setSelection(TextSelection.create(tr.doc, $from.pos + 1));
      dispatch(tr.scrollIntoView());
    } else dispatch(state.tr.replaceSelectionWith(br.create()).scrollIntoView());
  }
  return true;
};

/**
 * Backspace at the start of a line: after a line break, the break goes,
 * and the line's mark with it; at the start of a paragraph, the paragraph
 * is joined to the one before as ProseMirror joins them, and the mark of
 * its first line goes too, since it no longer begins a line.
 */
export const joinLineKey: Command = (state, dispatch, view) => {
  const { selection } = state;
  if (!selection.empty) return false;
  const found = cursorLine(state);
  if (!found) return false;
  const { line } = found;
  const at = selection.head;
  if (!onlyMarksBefore(state.doc, line, at)) return false;
  const markEnd = line.start + (line.mark ? 1 : 0);
  if (line.index > 0) {
    if (dispatch) {
      const tr = state.tr.delete(line.start - 1, markEnd);
      tr.setSelection(TextSelection.create(tr.doc, line.start - 1));
      dispatch(tr.scrollIntoView());
    }
    return true;
  }
  if (!line.mark) return false;
  // The first line, with a mark: joined as ProseMirror joins, from the start of the paragraph, and the mark taken away.
  const moved = EditorState.create({
    doc: state.doc,
    selection: TextSelection.create(state.doc, line.start),
  });
  let joined: Transaction | null = null;
  if (!joinBackward(moved, (t) => (joined = t), view)) return false;
  if (dispatch && joined) {
    const done = joined as Transaction;
    const tr = state.tr;
    for (const step of done.steps) tr.step(step);
    const mark = tr.mapping.map(line.start, 1);
    if (tr.doc.nodeAt(mark)?.type.name === 'linemark' && !lineStartAt(tr.doc, mark))
      tr.delete(mark, mark + 1);
    tr.setSelection(Selection.near(tr.doc.resolve(tr.mapping.map(line.start, -1)), -1));
    dispatch(tr.scrollIntoView());
  }
  return true;
};

/** Whether a place is the start of a line: the start of a paragraph, or right after a line break. */
export function lineStartAt(doc: Node, pos: number): boolean {
  const $pos = doc.resolve(pos);
  if ($pos.parent.type.name !== 'paragraph') return false;
  return $pos.parentOffset === 0 || $pos.nodeBefore?.type.name === 'hard_break';
}

/** Whether paragraphs of a kind are lines of verse, whose lines are indented one by one. */
export function linesIndented(kind: string, own: readonly BasedKind[] = []): boolean {
  return catalogueKindOf(kind, own) === 'line';
}

/** Steps of indentation, from none to eight. */
const steps = (n: number) => Math.max(0, Math.min(8, n));

/**
 * Tab and Shift+Tab: in lines of verse, the lines the selection touches
 * are indented a step more or less, each by its mark, which is made where
 * there is none and taken away where it then says nothing; any other
 * paragraph is indented as a whole. Nothing outside a paragraph, and
 * nothing where nothing would change.
 */
export function indentKey(by: 1 | -1, own: () => readonly BasedKind[] = () => []): Command {
  return (state, dispatch) => {
    const { from, to } = state.selection;
    const mark = state.schema.nodes.linemark;
    const kinds = own();
    const tr = state.tr;
    let inside = false;
    const paragraphs: { node: Node; pos: number }[] = [];
    state.doc.nodesBetween(from, to, (node, pos) => {
      if (node.type.name === 'paragraph') {
        paragraphs.push({ node, pos });
        return false;
      }
      return !node.isTextblock;
    });
    for (const { node, pos } of paragraphs) {
      inside = true;
      if (mark && linesIndented(kindOfNode(node), kinds)) {
        for (const line of linesOfNode(node, pos)) {
          if (line.end < from || line.start > to) continue;
          const now = Number(line.mark?.attrs.indent) || 0;
          const next = steps(now + by);
          if (next === now) continue;
          const at = tr.mapping.map(line.start);
          if (line.mark) {
            const attrs = { ...line.mark.attrs, indent: next || null };
            if (marksAnything(attrs)) tr.setNodeMarkup(at, undefined, attrs);
            else tr.delete(at, at + 1);
          } else tr.insert(at, mark.create({ indent: next }));
        }
        continue;
      }
      const now = Number(node.attrs.indent) || 0;
      const next = steps(now + by);
      if (next !== now)
        tr.setNodeMarkup(tr.mapping.map(pos), undefined, { ...node.attrs, indent: next });
    }
    if (!inside || !tr.docChanged) return false;
    if (dispatch) dispatch(tr.scrollIntoView());
    return true;
  };
}

export const lineMarksKey = new PluginKey('line-marks');

/**
 * Keeps the line marks where they belong, after every change the writer
 * makes here: a mark that does not stand at the start of a line, or says
 * nothing, goes. And the cursor never stands before a mark at the start of
 * a line, where what is typed would stand before the mark: it is put after
 * it, or, coming from after it, on to the line before.
 */
export function lineMarks(): Plugin {
  return new Plugin({
    key: lineMarksKey,
    appendTransaction(transactions, before, state) {
      let tr: Transaction | null = null;
      const local = transactions.some((t) => t.docChanged && !t.getMeta(ySyncPluginKey));
      if (local) {
        // A mark becomes stray only by a change in its own paragraph: the
        // paragraphs the changes touched are looked at, and not the whole
        // text, which was gone through on every keystroke.
        const stray = new Set<number>();
        const seen = new Set<number>();
        const size = state.doc.content.size;
        for (const [from, to] of changedRanges(transactions)) {
          state.doc.nodesBetween(Math.max(0, from - 1), Math.min(size, to + 1), (node, pos) => {
            if (!node.isTextblock) return true;
            if (node.type.name === 'paragraph' && !seen.has(pos)) {
              seen.add(pos);
              let before: Node | null = null;
              node.forEach((child, offset) => {
                if (child.type.name === 'linemark') {
                  const atStart = offset === 0 || before?.type.name === 'hard_break';
                  if (!atStart || !marksAnything(child.attrs)) stray.add(pos + 1 + offset);
                }
                before = child;
              });
            }
            return false;
          });
        }
        if (stray.size) {
          tr = state.tr;
          for (const pos of [...stray].sort((a, b) => b - a)) tr.delete(pos, pos + 1);
        }
      }
      const doc = tr ? tr.doc : state.doc;
      const selection = tr ? tr.selection : state.selection;
      if (selection instanceof TextSelection && selection.empty) {
        const head = selection.head;
        const $head = doc.resolve(head);
        if ($head.nodeAfter?.type.name === 'linemark' && lineStartAt(doc, head)) {
          const was = before.selection.head;
          let to = head + 1;
          // Coming from after the mark, as the left arrow does: on to the end of the line before.
          if (was === head + 1 && !transactions.some((t) => t.docChanged)) {
            const back =
              $head.parentOffset === 0
                ? Selection.findFrom(doc.resolve($head.before()), -1, true)
                : TextSelection.create(doc, head - 1);
            if (back) to = back.head;
          }
          tr ??= state.tr;
          tr.setSelection(TextSelection.create(doc, to));
        }
      }
      return tr;
    },
  });
}
