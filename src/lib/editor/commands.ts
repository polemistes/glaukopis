/** What can be done to the text, as ProseMirror commands. */

import { toggleMark } from 'prosemirror-commands';
import {
  Fragment,
  type Mark,
  type MarkType,
  type Node,
  type NodeType,
  type Schema,
} from 'prosemirror-model';
import {
  NodeSelection,
  Selection,
  TextSelection,
  type Command,
  type EditorState,
} from 'prosemirror-state';
import { renamed, tabOf, type BasedKind } from '$lib/project/model/families';
import type { Inline, RefForm } from '$lib/project/model/text';
import { newId } from '$lib/util/id';
import { specOf } from './kinds';
import { asWritten } from './stanzas';
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

/** A paragraph, with where it begins and its depth. */
export interface ParagraphAt {
  node: Node;
  pos: number;
  depth: number;
}

/** The paragraph the cursor is in, or that the selection begins in; nothing where it is in no paragraph. */
export function paragraphAt(state: EditorState): ParagraphAt | null {
  const { $from } = state.selection;
  for (let d = $from.depth; d > 0; d--) {
    const node = $from.node(d);
    if (node.type.name === 'paragraph') return { node, pos: $from.before(d), depth: d };
  }
  // A selection that begins outside every paragraph, as of the whole text: the first paragraph it touches.
  const first = paragraphsIn(state)[0];
  if (!first) return null;
  const $inside = state.doc.resolve(first.pos + 1);
  return { node: first.node, pos: first.pos, depth: $inside.depth };
}

/** The paragraphs the selection touches, each with where it begins; those of the whole text where everything is selected. */
export function paragraphsIn(state: EditorState): { node: Node; pos: number }[] {
  const { from, to } = state.selection;
  const out: { node: Node; pos: number }[] = [];
  state.doc.nodesBetween(from, to, (node, pos) => {
    if (node.type.name === 'paragraph') {
      out.push({ node, pos });
      return false;
    }
    return !node.isTextblock;
  });
  return out;
}

/**
 * The id of the kind of paragraph the cursor is in, or that the selection
 * begins in: text, or any kind of the catalogue or the writer's own. See
 * `editor/kinds.ts` and ADR 0040.
 */
export function kindOf(state: EditorState): string {
  const at = paragraphAt(state);
  return at ? renamed((at.node.attrs.kind as string) || 'text') : 'text';
}

/** The kinds of the paragraphs the selection touches, each once, in order. */
export function kindsIn(state: EditorState): string[] {
  const out: string[] = [];
  for (const { node } of paragraphsIn(state)) {
    const kind = renamed((node.attrs.kind as string) || 'text');
    if (!out.includes(kind)) out.push(kind);
  }
  return out;
}

/**
 * Makes the paragraphs the selection touches of one kind, or the one the
 * cursor is in: never more, never less. The passages follow (`passages.ts`).
 * A kind whose Tab does not indent has no indent; a number, whether the
 * paragraph is counted, and words in the margin stay. A kind of words is
 * toggled on the words instead, as `toggleKind` does. An id that is not in
 * the catalogue is a kind of the writer's own, which `own` says what it is
 * based on, so that its indent is kept or not.
 */
export function setKind(id: string, own: readonly BasedKind[] = []): Command {
  return (state, dispatch, view) => {
    const kind = renamed(id);
    if (specOf(kind)?.family === 'words') return toggleKind(kind)(state, dispatch, view);
    const paragraphs = paragraphsIn(state);
    if (!paragraphs.length) return false;
    // A poem written as paragraphs of lines broken by hand, made verse, or verse with stanzas made text: read as written.
    const written = asWritten(state.schema, paragraphs, kind, own);
    if (written) {
      if (dispatch) {
        const tr = state.tr.replaceWith(written.from, written.to, written.nodes);
        const end = written.from + written.nodes.reduce((n, node) => n + node.nodeSize, 0);
        tr.setSelection(
          TextSelection.create(tr.doc, written.from + 1, Math.max(written.from + 1, end - 1)),
        );
        dispatch(tr.scrollIntoView());
      }
      return true;
    }
    if (dispatch) {
      const tr = state.tr;
      const indents = tabOf(kind, own) === 'indent';
      for (const { node, pos } of paragraphs) {
        const attrs = { ...node.attrs, kind, indent: indents ? node.attrs.indent : 0 };
        if (attrs.kind === node.attrs.kind && attrs.indent === node.attrs.indent) continue;
        tr.setNodeMarkup(pos, undefined, attrs);
      }
      dispatch(tr.scrollIntoView());
    }
    return true;
  };
}

/**
 * Indents the paragraphs the selection touches a step more or less, where
 * their kind is indented by Tab: lines of verse, items of a list; from no
 * indent up to eight. Nothing for a paragraph of any other kind.
 */
export function indentParagraph(by: 1 | -1, own: readonly BasedKind[] = []): Command {
  return (state, dispatch) => {
    const paragraphs = paragraphsIn(state).filter(
      ({ node }) => tabOf(renamed((node.attrs.kind as string) || 'text'), own) === 'indent',
    );
    if (!paragraphs.length) return false;
    if (dispatch) {
      const tr = state.tr;
      for (const { node, pos } of paragraphs) {
        const indent = Math.max(0, Math.min(8, (Number(node.attrs.indent) || 0) + by));
        if (indent !== node.attrs.indent)
          tr.setNodeMarkup(pos, undefined, { ...node.attrs, indent });
      }
      if (tr.docChanged) dispatch(tr.scrollIntoView());
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

/**
 * The language of the passage at the cursor, or of the first words in what
 * is selected that have one, as a tag; nothing where it is the text's own.
 */
export function languageOf(state: EditorState): string | null {
  const type = state.schema.marks.lang;
  if (!type) return null;
  const { from, to, empty, $from } = state.selection;
  let found: Mark | undefined;
  if (empty) found = type.isInSet(state.storedMarks ?? $from.marks());
  else
    state.doc.nodesBetween(from, to, (node) => {
      if (found) return false;
      if (node.isText) found = type.isInSet(node.marks);
      return !found;
    });
  const tag = typeof found?.attrs.tag === 'string' ? found.attrs.tag.trim() : '';
  return tag || null;
}

/**
 * Gives the selected text a language of its own, over as many paragraphs as
 * it runs, whatever else it is marked with; or takes it away, given none,
 * so that the text is in the language of the text again. With nothing
 * selected, what is typed next is in it.
 */
export function setLanguage(tag: string | null): Command {
  return (state, dispatch) => {
    const type = state.schema.marks.lang;
    if (!type || !markApplies(state, type)) return false;
    const lang = tag?.trim() ?? '';
    if (dispatch) {
      const { from, to, empty, $from } = state.selection;
      const tr = state.tr;
      if (empty) {
        const marks = type.removeFromSet(state.storedMarks ?? $from.marks());
        tr.setStoredMarks(lang ? type.create({ tag: lang }).addToSet(marks) : marks);
      } else if (lang) tr.addMark(from, to, type.create({ tag: lang }));
      else tr.removeMark(from, to, type);
      dispatch(tr.scrollIntoView());
    }
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
