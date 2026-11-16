/**
 * A paragraph made an element (Alt+Enter in the text of an element): the
 * paragraph the cursor is in becomes the name of a new element, wherever in
 * it the cursor stands, and the paragraphs below it, to the end of the text,
 * become the new element's text. With words selected, what is selected
 * becomes the name: what stands before it stays in the old text, and what
 * stands after it in its paragraph becomes the first paragraph of the new
 * element's text, before the paragraphs below. In an empty paragraph the
 * name is empty, so that Enter and then Alt+Enter begins an empty element.
 *
 * A name holds italics, small capitals, raised and lowered text, and nothing
 * else: where what would be the name holds a citation, a note, a picture, a
 * formula, a reference mark, a line break or a mark a name cannot have, it
 * becomes the first paragraph of the new element's text instead, and the
 * name stays empty.
 */

import { Fragment, type Node } from 'prosemirror-model';
import { TextSelection, type Selection } from 'prosemirror-state';
import { titleSchema } from '$lib/editor/schema';

/** The marks a name may have: those of the title's schema. */
const NAME_MARKS = new Set(Object.keys(titleSchema.marks));

/** What a name may hold: text with the title's marks (em, smallcaps, sup, sub) and nothing else. */
export function nameable(fragment: Fragment): boolean {
  let ok = true;
  fragment.forEach((node) => {
    if (!node.isText || node.marks.some((m) => !NAME_MARKS.has(m.type.name))) ok = false;
  });
  return ok;
}

/** How many spaces begin a fragment of inline content: those of its first text nodes, never those inside a note. */
function startSpaces(fragment: Fragment): number {
  let spaces = 0;
  for (let i = 0; i < fragment.childCount; i++) {
    const node = fragment.child(i);
    if (!node.isText) break;
    const text = node.text ?? '';
    const here = text.length - text.trimStart().length;
    spaces += here;
    if (here < text.length) break;
  }
  return spaces;
}

/** How many spaces end a fragment of inline content: those of its last text nodes, never those inside a note. */
function endSpaces(fragment: Fragment): number {
  let spaces = 0;
  for (let i = fragment.childCount - 1; i >= 0; i--) {
    const node = fragment.child(i);
    if (!node.isText) break;
    const text = node.text ?? '';
    const here = text.length - text.trimEnd().length;
    spaces += here;
    if (here < text.length) break;
  }
  return spaces;
}

/** Text without the spaces at its two ends, as a name is kept. */
function trimmed(fragment: Fragment): Fragment {
  const start = startSpaces(fragment);
  return start >= fragment.size
    ? Fragment.empty
    : fragment.cut(start, fragment.size - endSpaces(fragment));
}

/** Text without the spaces it begins with, as a paragraph begins. */
function trimmedStart(fragment: Fragment): Fragment {
  return fragment.cut(startSpaces(fragment));
}

/** The name as the editors of names hold it: a title of the title's schema, the marks kept. */
export function nameDoc(name: Fragment): Node {
  const inline: Node[] = [];
  name.forEach((node) => {
    if (!node.isText || !node.text) return;
    const marks = node.marks
      .filter((m) => NAME_MARKS.has(m.type.name))
      .map((m) => titleSchema.marks[m.type.name].create(m.attrs));
    inline.push(titleSchema.text(node.text, marks));
  });
  return titleSchema.node('doc', null, [titleSchema.node('title', null, inline)]);
}

export interface Heading {
  /** The name of the new element, which may be empty; null where what was to be the name could not be one. */
  name: Fragment | null;
  /** The new element's text: the paragraphs after the first one, and before them what stood after the name in its paragraph, or the paragraph that could not be a name. */
  body: Fragment;
  /** What was to be the name held what a name cannot, and is the first paragraph of the body instead. */
  keptAsParagraph: boolean;
  /** The position from which the old text is cut to its end: the end of what stays of the paragraph, or the start of the paragraph where nothing of it stays. */
  cutFrom: number;
}

/**
 * Where a heading begins for a selection from `from` to `to`: where the
 * selection begins, but in the next paragraph where it begins at the very
 * end of a paragraph and goes on into the next, since someone who dragged
 * over a whole line from the end of the line above means that line.
 */
function beginning(doc: Node, from: number, to: number): number {
  if (to <= from) return from;
  const $from = doc.resolve(from);
  if (
    $from.depth !== 1 ||
    !$from.parent.isTextblock ||
    $from.parentOffset < $from.parent.content.size
  ) {
    return from;
  }
  return doc.resolve($from.after(1)).nodeAfter?.isTextblock ? $from.after(1) + 1 : from;
}

/**
 * A text parted for a new element, by the cursor at `from` or by the
 * selection from `from` to `to`. With a cursor, the whole paragraph it is in
 * is the name, where a name can hold it; with a selection, what is selected
 * of its first paragraph (to the paragraph's end where it goes on into the
 * next), and what follows that in the paragraph is the first paragraph of
 * the body. The paragraphs after the first are the rest of the body, whole.
 * Where the cursor is within something that stands as one block, as a text
 * side by side with another or a table, the block stays whole, the name is
 * empty, and what follows the block is the body.
 */
export function headingAt(doc: Node, from: number, to: number = from): Heading {
  const start = beginning(doc, from, to);
  const end = Math.max(to, start);
  const $from = doc.resolve(start);
  const block = $from.parent;
  if (!block.isTextblock || $from.depth !== 1) {
    const after = $from.depth === 0 ? start : $from.after(1);
    return {
      name: Fragment.empty,
      body: doc.content.cut(after),
      keptAsParagraph: false,
      cutFrom: after,
    };
  }
  // With a cursor the paragraph is the name, all of it; with a selection,
  // what is selected of it, to its end where the selection goes further.
  const collapsed = end === start;
  const first = collapsed ? 0 : $from.parentOffset;
  const last = collapsed || end > $from.end() ? block.content.size : end - $from.start();
  const head = block.content.cut(0, first);
  const rest = doc.content.cut($from.after(1));
  // The paragraph goes whole where nothing but spaces stands before the name;
  // else the cut begins at the name, with the spaces before it, which would
  // otherwise be left at the end of the line.
  const cutFrom =
    startSpaces(head) >= head.size ? $from.before(1) : $from.start() + first - endSpaces(head);

  const selected = block.content.cut(first, last);
  if (nameable(selected)) {
    const after = trimmedStart(block.content.cut(last));
    return {
      name: trimmed(selected),
      body: (after.size ? Fragment.from(block.copy(after)) : Fragment.empty).append(rest),
      keptAsParagraph: false,
      cutFrom,
    };
  }
  return {
    name: null,
    body: Fragment.from(block.copy(trimmedStart(block.content.cut(first)))).append(rest),
    keptAsParagraph: true,
    cutFrom,
  };
}

/** Whether words are selected: a selection of text that is not empty, not a picture, the cells of a table or everything at once. */
export function selectsWords(selection: Selection): boolean {
  return selection instanceof TextSelection && !selection.empty;
}

/**
 * A text parted for a new element by what is selected in it: the words
 * selected where there are any, else the cursor at the start of the
 * selection.
 */
export function headingOfSelection(doc: Node, selection: Selection): Heading {
  return headingAt(doc, selection.from, selectsWords(selection) ? selection.to : selection.from);
}
