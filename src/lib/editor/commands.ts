/** What can be done to the text, as ProseMirror commands. */

import { lift, toggleMark, wrapIn } from 'prosemirror-commands';
import { Fragment, type MarkType, type NodeType } from 'prosemirror-model';
import { liftListItem, wrapInList } from 'prosemirror-schema-list';
import { NodeSelection, TextSelection, type Command, type EditorState } from 'prosemirror-state';
import { bodySchema, type CiteItem, type CiteMode } from './schema';

export function markActive(state: EditorState, type: MarkType): boolean {
  const { from, $from, to, empty } = state.selection;
  if (empty) return !!type.isInSet(state.storedMarks ?? $from.marks());
  return state.doc.rangeHasMark(from, to, type);
}

/** Whether the selection is inside a node of the type, at any depth. */
export function insideNode(state: EditorState, type: NodeType): boolean {
  const { $from } = state.selection;
  for (let d = $from.depth; d > 0; d--) {
    if ($from.node(d).type === type) return true;
  }
  return false;
}

export function toggle(name: keyof typeof bodySchema.marks): Command {
  return (state, dispatch, view) => {
    const type = state.schema.marks[name];
    return type ? toggleMark(type)(state, dispatch, view) : false;
  };
}

export const toggleQuote: Command = (state, dispatch, view) => {
  const type = state.schema.nodes.blockquote;
  if (!type) return false;
  if (insideNode(state, type)) return lift(state, dispatch);
  return wrapIn(type)(state, dispatch, view);
};

export function toggleList(name: 'bullet_list' | 'ordered_list'): Command {
  return (state, dispatch, view) => {
    const type = state.schema.nodes[name];
    const item = state.schema.nodes.list_item;
    if (!type || !item) return false;
    if (insideNode(state, item)) return liftListItem(item)(state, dispatch);
    return wrapInList(type)(state, dispatch, view);
  };
}

/** The kinds of paragraph there are. */
export type ParagraphStyle = 'text' | 'quote' | 'list' | 'numbered';

export function styleOf(state: EditorState): ParagraphStyle {
  const { $from } = state.selection;
  for (let d = $from.depth; d > 0; d--) {
    const name = $from.node(d).type.name;
    if (name === 'ordered_list') return 'numbered';
    if (name === 'bullet_list') return 'list';
    if (name === 'blockquote') return 'quote';
  }
  return 'text';
}

/** Makes the paragraphs that are selected of one kind, whatever they were. */
export function setStyle(style: ParagraphStyle): Command {
  return (state, dispatch, view) => {
    const { blockquote, bullet_list, ordered_list, list_item } = state.schema.nodes;
    if (!blockquote || !bullet_list || !ordered_list || !list_item) return false;
    if (!dispatch || !view) return true;
    // Back to plain text first: out of whatever list or quotation it is in.
    for (let i = 0; i < 6 && styleOf(view.state) !== 'text'; i++) {
      const lifted = insideNode(view.state, list_item)
        ? liftListItem(list_item)(view.state, view.dispatch)
        : lift(view.state, view.dispatch);
      if (!lifted) break;
    }
    if (style === 'quote') wrapIn(blockquote)(view.state, view.dispatch);
    else if (style === 'list') wrapInList(bullet_list)(view.state, view.dispatch);
    else if (style === 'numbered') wrapInList(ordered_list)(view.state, view.dispatch);
    return true;
  };
}

export function insertCitation(items: CiteItem[], mode: CiteMode = 'normal'): Command {
  return (state, dispatch) => {
    const type = state.schema.nodes.citation;
    if (!type || !items.length) return false;
    const { $from } = state.selection;
    if (!$from.parent.canReplaceWith($from.index(), $from.index(), type)) return false;
    if (dispatch) {
      const node = type.create({ items, mode });
      const tr = state.tr.replaceSelectionWith(node, false);
      dispatch(tr.scrollIntoView());
    }
    return true;
  };
}

/** Changes the citation at a position, or removes it when no items are left. */
export function updateCitation(pos: number, items: CiteItem[], mode: CiteMode): Command {
  return (state, dispatch) => {
    const node = state.doc.nodeAt(pos);
    if (!node || node.type.name !== 'citation') return false;
    if (dispatch) {
      const tr = items.length
        ? state.tr.setNodeMarkup(pos, undefined, { items, mode })
        : state.tr.delete(pos, pos + node.nodeSize);
      dispatch(tr);
    }
    return true;
  };
}

/**
 * Puts a note at the cursor. Text that is selected becomes the text of the
 * note. The note is left selected, which opens it.
 */
export const insertFootnote: Command = (state, dispatch) => {
  const type = state.schema.nodes.footnote;
  if (!type) return false;
  const { $from, $to, empty } = state.selection;
  if (!$from.sameParent($to) || !$from.parent.inlineContent) return false;
  // No note within a note.
  if (insideNode(state, type)) return false;
  if (!$from.parent.canReplaceWith($from.index(), $to.index(), type)) return false;
  if (dispatch) {
    let content = Fragment.empty;
    if (!empty) {
      const slice = state.doc.slice($from.pos, $to.pos).content;
      const kept: import('prosemirror-model').Node[] = [];
      slice.forEach((n) => {
        if (n.type !== type) kept.push(n);
      });
      content = Fragment.fromArray(kept);
    }
    const node = type.create(null, content);
    const tr = state.tr.replaceSelectionWith(node, false);
    const pos = tr.mapping.map($from.pos, -1);
    const at = tr.doc.resolve(Math.min(pos, tr.doc.content.size));
    const found = at.nodeAfter?.type === type ? at.pos : at.pos - node.nodeSize;
    if (found >= 0 && tr.doc.nodeAt(found)?.type === type) {
      tr.setSelection(NodeSelection.create(tr.doc, found));
    }
    dispatch(tr);
  }
  return true;
};

/** The cursor to the very beginning or end of the text. */
export function cursorTo(where: 'start' | 'end'): Command {
  return (state, dispatch) => {
    if (dispatch) {
      const selection =
        where === 'start' ? TextSelection.atStart(state.doc) : TextSelection.atEnd(state.doc);
      dispatch(state.tr.setSelection(selection));
    }
    return true;
  };
}

export function isAtStart(state: EditorState): boolean {
  const { selection } = state;
  return selection.empty && selection.from <= TextSelection.atStart(state.doc).from;
}

export function isAtEnd(state: EditorState): boolean {
  const { selection } = state;
  return selection.empty && selection.to >= TextSelection.atEnd(state.doc).to;
}

export function isEmptyDoc(state: EditorState): boolean {
  const { doc } = state;
  return (
    doc.childCount <= 1 &&
    (doc.firstChild?.content.size ?? 0) === 0 &&
    doc.firstChild?.type.name !== 'blockquote'
  );
}
