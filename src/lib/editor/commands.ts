/** What can be done to the text, as ProseMirror commands. */

import { lift, toggleMark, wrapIn } from 'prosemirror-commands';
import {
  Fragment,
  type Attrs,
  type Mark,
  type MarkType,
  type Node,
  type NodeType,
  type Schema,
} from 'prosemirror-model';
import { liftListItem, wrapInList } from 'prosemirror-schema-list';
import { specOf } from './kinds';
import { makeVerse, setLineKind, unmakeVerse, verseAt } from './verse';
import {
  NodeSelection,
  Selection,
  TextSelection,
  type Command,
  type EditorState,
} from 'prosemirror-state';
import { SCRIPT_PARTS, type Inline, type RefForm, type ScriptPart } from '$lib/project/model/text';
import { newId } from '$lib/util/id';
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

/**
 * The id of the kind of paragraph the cursor is in: text, a quotation, a
 * list, a line of verse or its speaker or stage direction, a part of a
 * script, or the kind of a passage, of the catalogue or the writer's own.
 * See `editor/kinds.ts`.
 */
export function kindOf(state: EditorState): string {
  const { $from } = state.selection;
  for (let d = $from.depth; d > 0; d--) {
    const node = $from.node(d);
    const name = node.type.name;
    if (name === 'script') return node.attrs.part as string;
    if (name === 'passage') return (node.attrs.name as string) || 'text';
    if (name === 'verse_line')
      return node.attrs.kind === 'speaker'
        ? 'speaker'
        : node.attrs.kind === 'direction'
          ? 'direction'
          : 'verse';
    if (name === 'ordered_list') return 'numbered';
    if (name === 'bullet_list') return 'list';
    if (name === 'blockquote') return 'quote';
  }
  return 'text';
}

/** The kinds that hold paragraphs, out of which a paragraph is lifted to be plain text. */
const HOLDERS = ['quote', 'list', 'numbered'];

/** The paragraphs of a kind, which can be made another: a paragraph, a part of a script, a passage. */
const RETYPED = ['paragraph', 'script', 'passage'];

/**
 * The paragraphs the selection touches made of a type, where what holds
 * them allows it: paragraphs, parts of a script and passages, and nothing
 * else that holds text, which is left as it is.
 */
function retype(type: NodeType, attrs: Attrs | null = null): Command {
  return (state, dispatch) => {
    const { from, to } = state.selection;
    const tr = state.tr;
    let changed = false;
    state.doc.nodesBetween(from, to, (node, pos) => {
      if (!node.isTextblock) return true;
      if (!RETYPED.includes(node.type.name) || node.hasMarkup(type, attrs)) return false;
      const $pos = state.doc.resolve(pos);
      const index = $pos.index();
      if (!$pos.parent.canReplaceWith(index, index + 1, type)) return false;
      // The paragraph keeps its size: the positions after it stand.
      tr.setNodeMarkup(pos, type, attrs);
      changed = true;
      return false;
    });
    if (!changed) return false;
    if (dispatch) dispatch(tr.scrollIntoView());
    return true;
  };
}

/**
 * Makes the paragraphs that are selected of one kind, whatever they were:
 * out of the verse, the script or the kind they were of, and out of
 * whatever list or quotation they stand in, then into the kind. A kind of
 * words is toggled on the words instead, as `toggleKind` does. An id that
 * is not in the catalogue is a kind of the writer's own: a passage of
 * that name.
 */
export function setKind(id: string): Command {
  return (state, dispatch, view) => {
    const spec = specOf(id);
    if (spec?.structure === 'mark') return toggleKind(id)(state, dispatch, view);
    const { blockquote, bullet_list, ordered_list, list_item, paragraph, passage, script } =
      state.schema.nodes;
    if (
      !blockquote ||
      !bullet_list ||
      !ordered_list ||
      !list_item ||
      !paragraph ||
      !passage ||
      !script
    )
      return false;
    if (!dispatch || !view) return true;
    const run = (command: Command) => command(view.state, view.dispatch, view);
    const structure = spec?.structure ?? 'passage';
    const toLine = structure === 'verse' || structure === 'speaker' || structure === 'direction';
    // Within a verse, a line is only said to be what it is: the verse stays whole.
    if (toLine && verseAt(view.state)) {
      run(setLineKind(structure === 'verse' ? 'line' : structure));
      return true;
    }
    // Back to paragraphs of text first.
    if (verseAt(view.state)) run(unmakeVerse);
    run(retype(paragraph));
    for (let i = 0; i < 6 && HOLDERS.includes(kindOf(view.state)); i++) {
      const lifted = insideNode(view.state, list_item)
        ? liftListItem(list_item)(view.state, view.dispatch)
        : lift(view.state, view.dispatch);
      if (!lifted) break;
    }
    switch (structure) {
      case 'quote':
        run(wrapIn(blockquote));
        break;
      case 'list':
        run(wrapInList(bullet_list));
        break;
      case 'numbered':
        run(wrapInList(ordered_list));
        break;
      case 'verse':
      case 'speaker':
      case 'direction':
        // A verse is made of the paragraphs, and the line is said to be what it is.
        run(makeVerse);
        run(setLineKind(structure === 'verse' ? 'line' : structure));
        break;
      case 'script':
        run(retype(script, { part: id }));
        break;
      case 'passage':
        run(retype(passage, { name: id }));
        break;
    }
    return true;
  };
}

/** The kind of words of a mark `kind`. */
function kindAttrs(mark: Mark): { name: string; lang: string } {
  return { name: String(mark.attrs.name ?? ''), lang: String(mark.attrs.lang ?? '') };
}

/**
 * The kind of words at the cursor, or the first in what is selected, with
 * the language of foreign words; nothing where the words are of no kind.
 */
export function kindMarkOf(state: EditorState): { name: string; lang: string } | null {
  const type = state.schema.marks.kind;
  if (!type) return null;
  const { from, to, empty, $from } = state.selection;
  if (empty) {
    const mark = type.isInSet(state.storedMarks ?? $from.marks());
    return mark ? kindAttrs(mark) : null;
  }
  let found: Mark | undefined;
  state.doc.nodesBetween(from, to, (node) => {
    if (found) return false;
    if (node.isText) found = type.isInSet(node.marks);
    return !found;
  });
  return found ? kindAttrs(found) : null;
}

/** Whether a mark can be put on what is selected: on text, where it is allowed. */
function markApplies(state: EditorState, type: MarkType): boolean {
  const { from, to, empty, $from } = state.selection;
  if (empty) return $from.parent.type.allowsMarkType(type);
  let can = false;
  state.doc.nodesBetween(from, to, (node) => {
    if (can) return false;
    can = node.inlineContent && node.type.allowsMarkType(type);
    return !can;
  });
  return can;
}

/**
 * Makes the selected words of a kind, in place of any kind they were of;
 * or of none, when they are of this kind already, with the same language.
 * With nothing selected, what is typed next is of the kind.
 */
export function toggleKind(name: string, lang = ''): Command {
  return (state, dispatch) => {
    const type = state.schema.marks.kind;
    if (!type || !name || !markApplies(state, type)) return false;
    const current = kindMarkOf(state);
    const same = !!current && current.name === name && current.lang === lang;
    if (dispatch) {
      const { from, to, empty, $from } = state.selection;
      const tr = state.tr;
      if (empty) {
        const marks = state.storedMarks ?? $from.marks();
        tr.setStoredMarks(
          same ? type.removeFromSet(marks) : type.create({ name, lang }).addToSet(marks),
        );
      } else if (same) tr.removeMark(from, to, type);
      else tr.addMark(from, to, type.create({ name, lang }));
      dispatch(tr.scrollIntoView());
    }
    return true;
  };
}

/** The kinds of paragraph the tools knew before the catalogue; `kindOf` and `setKind` know every kind. */
export type ParagraphStyle =
  'text' | 'quote' | 'list' | 'numbered' | 'verse' | 'speaker' | 'direction' | ScriptPart;

const STYLES: readonly string[] = [
  'text',
  'quote',
  'list',
  'numbered',
  'verse',
  'speaker',
  'direction',
  ...SCRIPT_PARTS,
];

/** As `kindOf`, naming only the kinds the tools knew before: a passage of another kind is text. */
export function styleOf(state: EditorState): ParagraphStyle {
  const kind = kindOf(state);
  return (STYLES.includes(kind) ? kind : 'text') as ParagraphStyle;
}

/** As `setKind`. */
export function setStyle(style: ParagraphStyle): Command {
  return setKind(style);
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
 * Parts the words before and after from the citation at a position: they
 * become text of the line, and each work a citation of its own, with its
 * place in the work and nothing else, so that a note written as one long
 * citation reads as text with citations in it. Works that have no words
 * between them are parted by a semicolon, as the styles part them.
 */
export function splitCitation(pos: number): Command {
  return (state, dispatch) => {
    const node = state.doc.nodeAt(pos);
    if (!node || node.type.name !== 'citation') return false;
    const items = node.attrs.items as CiteItem[];
    const mode = node.attrs.mode as CiteMode;
    if (!items.some((i) => i.prefix?.trim() || i.suffix?.trim()) && items.length < 2) return false;
    if (dispatch) {
      const marks = state.doc.resolve(pos).marks();
      const text = (words: string) => state.schema.text(words, marks);
      const out: Node[] = [];
      let last: 'words' | 'citation' | null = null;
      items.forEach((item, i) => {
        const before = item.prefix?.trim() ?? '';
        const after = item.suffix?.trim() ?? '';
        if (i > 0 && !before && last === 'citation') out.push(text('; '));
        if (before) out.push(text(i > 0 && last === 'citation' ? `; ${before} ` : `${before} `));
        const own: CiteItem = { id: item.id };
        if (item.locator?.trim()) own.locator = item.locator.trim();
        if (item.label && item.label !== 'page' && own.locator) own.label = item.label;
        if (item.suppressAuthor) own.suppressAuthor = true;
        out.push(
          node.type.create({ items: [own], mode: i === 0 ? mode : 'normal' }, undefined, marks),
        );
        last = 'citation';
        if (after) {
          // Words that begin with a sign of their own stand close to the citation.
          out.push(text(/^[,;:.!?)]/.test(after) ? after : ` ${after}`));
          last = 'words';
        }
      });
      dispatch(state.tr.replaceWith(pos, pos + node.nodeSize, Fragment.from(out)).scrollIntoView());
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
      const kept: Node[] = [];
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

/** A formula in the line, where the cursor is. What is selected becomes what it holds. */
export const insertMath: Command = (state, dispatch) => {
  const type = state.schema.nodes.math;
  if (!type) return false;
  const { $from, $to, empty } = state.selection;
  if (!$from.sameParent($to) || !$from.parent.inlineContent) return false;
  if (!$from.parent.canReplaceWith($from.index(), $to.index(), type)) return false;
  if (dispatch) {
    const tex = empty ? '' : state.doc.textBetween($from.pos, $to.pos, ' ').trim();
    const tr = state.tr.replaceSelectionWith(type.create({ tex }), false);
    const at = tr.mapping.map($from.pos, -1);
    // Left selected, which opens it.
    if (tr.doc.nodeAt(at)?.type === type) tr.setSelection(NodeSelection.create(tr.doc, at));
    dispatch(tr.scrollIntoView());
  }
  return true;
};

/**
 * Where something that stands by itself goes: in place of the paragraph the
 * cursor is in when that is empty, and after it otherwise. Within what is
 * said of a figure, after the figure; within a table, after the table.
 */
export function placeForBlock(
  state: EditorState,
  type: NodeType,
): { from: number; to: number } | null {
  const { selection } = state;
  if (selection instanceof NodeSelection && selection.node.isBlock) {
    const $after = state.doc.resolve(selection.to);
    return $after.parent.canReplaceWith($after.index(), $after.index(), type)
      ? { from: selection.to, to: selection.to }
      : null;
  }
  const { $from } = selection;
  for (let d = $from.depth; d > 0; d--) {
    let node = $from.node(d);
    if (!node.isTextblock && node.type.name !== 'figure') continue;
    // A table holds no tables, nor anything else that stands by itself.
    for (let up = d - 1; up > 0; up--) {
      if ($from.node(up).type.name !== 'tabular') continue;
      d = up;
      node = $from.node(up);
    }
    const parent = $from.node(d - 1);
    const index = $from.index(d - 1);
    const empty = node.type.name === 'paragraph' && node.content.size === 0;
    if (empty && parent.canReplaceWith(index, index + 1, type))
      return { from: $from.before(d), to: $from.after(d) };
    if (parent.canReplaceWith(index + 1, index + 1, type))
      return { from: $from.after(d), to: $from.after(d) };
    return null;
  }
  return null;
}

/** An equation on a line of its own. It is left selected, which opens it. */
export const insertEquation: Command = (state, dispatch) => {
  const type = state.schema.nodes.equation;
  if (!type) return false;
  const at = placeForBlock(state, type);
  if (!at) return false;
  if (dispatch) {
    const tr = state.tr.replaceWith(at.from, at.to, type.create({ id: newId() }));
    tr.setSelection(NodeSelection.create(tr.doc, at.from));
    dispatch(tr.scrollIntoView());
  }
  return true;
};

export interface FigureOf {
  hash: string;
  extension: string;
  name: string;
  /** How many points the picture itself is wide, where that is known. */
  width?: number | null;
  /** What the store has of the picture, which the figure begins with. */
  alt?: string;
  caption?: Inline[];
}

/** What is said of a picture in the store, as the content of a figure. */
export function captionNodes(schema: Schema, caption: Inline[] | undefined): Node[] {
  const out: Node[] = [];
  for (const i of caption ?? []) {
    if (i.kind === 'math' && schema.nodes.math) out.push(schema.nodes.math.create({ tex: i.tex }));
    if (i.kind !== 'text' || !i.text) continue;
    const marks = Object.keys(i.marks).flatMap((name) => {
      const type = schema.marks[name];
      return type && name !== 'link' ? [type.create()] : [];
    });
    out.push(schema.text(i.text, marks));
  }
  return out;
}

/** What is said of a figure, as the store keeps what is said of a picture: text and its marks, and formulas. */
export function captionOf(figure: Node): Inline[] {
  const out: Inline[] = [];
  figure.forEach((child) => {
    if (child.isText && child.text) {
      const marks: Record<string, true> = {};
      for (const m of child.marks) if (m.type.name !== 'link') marks[m.type.name] = true;
      out.push({ kind: 'text', text: child.text, marks });
    } else if (child.type.name === 'math' && child.attrs.tex) {
      out.push({ kind: 'math', tex: child.attrs.tex });
    } else if (child.type.name === 'hard_break') {
      out.push({ kind: 'text', text: ' ', marks: {} });
    }
  });
  return out;
}

/**
 * How wide a picture is set when nothing has been said: as wide as the text
 * if it is large, and less if it is small, so that it is not made coarse.
 */
export function widthFor(picture: FigureOf): number {
  if (!picture.width) return picture.extension === 'svg' ? 60 : 100;
  const share = Math.round(picture.width / 9.5 / 5) * 5;
  return Math.max(25, Math.min(100, share));
}

/**
 * A figure with this picture. `at` is where in the text, when that is not
 * where the cursor is. The cursor is put into what is said of the figure.
 */
export function insertFigure(picture: FigureOf, at?: number): Command {
  return (state, dispatch) => {
    const type = state.schema.nodes.figure;
    if (!type) return false;
    let from = state;
    if (at !== undefined) {
      try {
        const $at = state.doc.resolve(Math.max(0, Math.min(at, state.doc.content.size)));
        from = state.apply(state.tr.setSelection(Selection.near($at)));
      } catch {
        return false;
      }
    }
    const where = placeForBlock(from, type);
    if (!where) return false;
    if (dispatch) {
      const node = type.create(
        {
          id: newId(),
          file: picture.hash,
          extension: picture.extension,
          name: picture.name,
          alt: picture.alt ?? '',
          width: widthFor(picture),
        },
        captionNodes(state.schema, picture.caption),
      );
      const tr = state.tr.replaceWith(where.from, where.to, node);
      // The cursor is at the end of what is said of it.
      tr.setSelection(TextSelection.create(tr.doc, where.from + node.nodeSize - 1));
      dispatch(tr.scrollIntoView());
    }
    return true;
  };
}

/** Words that point to something that stands in the document, where the cursor is. */
export function insertCrossRef(target: string, form: RefForm = 'full'): Command {
  return (state, dispatch) => {
    const type = state.schema.nodes.crossref;
    if (!type || !target) return false;
    const { $from, $to } = state.selection;
    if (!$from.sameParent($to) || !$from.parent.inlineContent) return false;
    if (!$from.parent.canReplaceWith($from.index(), $to.index(), type)) return false;
    if (dispatch)
      dispatch(
        state.tr.replaceSelectionWith(type.create({ target, form }), false).scrollIntoView(),
      );
    return true;
  };
}

/**
 * Enter in what is said of a figure or of a table: the writing goes on
 * after the figure or the table.
 */
export const leaveCaption: Command = (state, dispatch) => {
  const { $from, empty } = state.selection;
  const said = $from.parent.type.name;
  if (!empty || (said !== 'figure' && said !== 'table_caption')) return false;
  const paragraph = state.schema.nodes.paragraph;
  if (!paragraph) return false;
  // What is said of a table is part of the table. And what stands beside
  // others in a row is left together with the row, which holds no text.
  let depth = said === 'figure' ? $from.depth : $from.depth - 1;
  while (
    depth > 1 &&
    !$from
      .node(depth - 1)
      .canReplaceWith($from.indexAfter(depth - 1), $from.indexAfter(depth - 1), paragraph)
  )
    depth--;
  const after = $from.after(depth);
  const $after = state.doc.resolve(after);
  if (dispatch) {
    const tr = state.tr;
    const next = $after.nodeAfter;
    if (!next || next.type !== paragraph || next.content.size > 0) {
      if (!$after.parent.canReplaceWith($after.index(), $after.index(), paragraph)) return false;
      tr.insert(after, paragraph.create());
    }
    tr.setSelection(TextSelection.create(tr.doc, after + 1));
    dispatch(tr.scrollIntoView());
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
    (doc.firstChild?.type.name ?? 'paragraph') === 'paragraph'
  );
}
