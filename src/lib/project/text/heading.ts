/**
 * A paragraph made an element (Alt+Enter in the text of an element): the
 * paragraph the cursor is in becomes the name of a new element, wherever in
 * it the cursor stands, and the paragraphs below it, to the end of the text,
 * become the new element's text. Where the paragraph has line breaks, only
 * the line the cursor is in becomes the name: the lines before it stay, the
 * lines after it begin the new element's text. With words selected, what is
 * selected becomes the name, to the first line break within it: what stands
 * before it stays in the old text, and what stands after it in its paragraph
 * becomes the first paragraph of the new element's text, before the
 * paragraphs below. In an empty paragraph the name is empty, so that Enter
 * and then Alt+Enter begins an empty element.
 *
 * A name holds words, with italics, small capitals, raised and lowered text:
 * any other mark on the words is dropped and the words kept. What is not
 * words at all, a citation, a note, a formula, a reference mark or a
 * cross-reference, is taken out of the name and stands at the start of the
 * new element's text, so that nothing is lost.
 */

import { Fragment, type Node } from 'prosemirror-model';
import { TextSelection, type Selection } from 'prosemirror-state';
import { titleSchema } from '$lib/editor/schema';

/** The marks a name may have: those of the title's schema. */
const NAME_MARKS = new Set(Object.keys(titleSchema.marks));

/** How much of a fragment's start is spaces and line breaks: those of its first nodes, never those inside a note. */
function startBlank(fragment: Fragment): number {
  let size = 0;
  for (let i = 0; i < fragment.childCount; i++) {
    const node = fragment.child(i);
    if (node.type.name === 'hard_break') {
      size += node.nodeSize;
      continue;
    }
    if (!node.isText) break;
    const text = node.text ?? '';
    const here = text.length - text.trimStart().length;
    size += here;
    if (here < text.length) break;
  }
  return size;
}

/** How much of a fragment's end is spaces and line breaks: those of its last nodes, never those inside a note. */
function endBlank(fragment: Fragment): number {
  let size = 0;
  for (let i = fragment.childCount - 1; i >= 0; i--) {
    const node = fragment.child(i);
    if (node.type.name === 'hard_break') {
      size += node.nodeSize;
      continue;
    }
    if (!node.isText) break;
    const text = node.text ?? '';
    const here = text.length - text.trimEnd().length;
    size += here;
    if (here < text.length) break;
  }
  return size;
}

/** Text without the spaces at its two ends, as a name is kept. */
function trimmed(fragment: Fragment): Fragment {
  const start = startBlank(fragment);
  return start >= fragment.size
    ? Fragment.empty
    : fragment.cut(start, fragment.size - endBlank(fragment));
}

/** Text without the spaces and line breaks it begins with, as a paragraph begins. */
function trimmedStart(fragment: Fragment): Fragment {
  return fragment.cut(startBlank(fragment));
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
  /** The name of the new element, which may be empty: words with the marks a name may have, and nothing else. */
  name: Fragment;
  /** The new element's text: the paragraphs after the first one, and before them what was taken out of the name and what stood after the name in its paragraph. */
  body: Fragment;
  /** Something that is not words was taken out of the name and stands at the start of the body. */
  keptInText: boolean;
  /** The position from which the old text is cut to its end: the end of what stays of the paragraph, or the start of the paragraph where nothing of it stays. */
  cutFrom: number;
}

/**
 * Where a heading begins for a selection from `from` to `to`: where the
 * selection begins, but in the next paragraph where it begins at the very
 * end of a paragraph and goes on into the next, and after the line break
 * where it begins at the very end of a line and goes on into the next, since
 * someone who dragged over a whole line from the end of the line above means
 * that line.
 */
function beginning(doc: Node, from: number, to: number): number {
  if (to <= from) return from;
  const $from = doc.resolve(from);
  if ($from.depth !== 1 || !$from.parent.isTextblock) return from;
  if ($from.parentOffset < $from.parent.content.size) {
    let start = from;
    while (start < to && doc.resolve(start).nodeAfter?.type.name === 'hard_break') start += 1;
    return start;
  }
  return doc.resolve($from.after(1)).nodeAfter?.isTextblock ? $from.after(1) + 1 : from;
}

/** The offsets within a paragraph's content of its line breaks. */
function breaksOf(content: Fragment): number[] {
  const offsets: number[] = [];
  content.forEach((node, offset) => {
    if (node.type.name === 'hard_break') offsets.push(offset);
  });
  return offsets;
}

/**
 * What is words of a stretch of one line, and what is not. The words keep the
 * marks a name may have; where taking something out leaves two spaces
 * together, one stays. A line mark says something of the line, not in it, and
 * a name is no line of verse: it is dropped, and nothing is said of it.
 */
function wordsAndThings(line: Fragment): { words: Fragment; things: Node[] } {
  const words: Node[] = [];
  const things: Node[] = [];
  let last = '';
  let gap = false;
  line.forEach((node) => {
    if (!node.isText) {
      if (node.type.name !== 'linemark' && node.type.name !== 'hard_break') {
        things.push(node);
        gap = true;
      }
      return;
    }
    let text = node.text ?? '';
    if (gap && /\s$/.test(last) && /^\s/.test(text)) text = text.slice(1);
    if (!text) return;
    gap = false;
    last = text;
    const marks = node.marks.filter((m) => NAME_MARKS.has(m.type.name));
    words.push(node.type.schema.text(text, marks));
  });
  return { words: trimmed(Fragment.fromArray(words)), things };
}

/**
 * A text parted for a new element, by the cursor at `from` or by the
 * selection from `from` to `to`. With a cursor, the line it is in is the
 * name, the whole paragraph where it has no line breaks; with a selection,
 * what is selected of its first paragraph, to the first line break within it
 * and to the paragraph's end where it goes on into the next. What follows the
 * name in its paragraph is the first paragraph of the body, and the
 * paragraphs after the first are the rest of the body, whole. Where the
 * cursor is within something that stands as one block, as a text side by
 * side with another, a table or a figure, the block stays whole, the name is
 * empty, and what follows the block is the body.
 */
export function headingAt(doc: Node, from: number, to: number = from): Heading {
  const start = beginning(doc, from, to);
  const end = Math.max(to, start);
  const $from = doc.resolve(start);
  const block = $from.parent;
  if (block.type.name !== 'paragraph' || $from.depth !== 1) {
    const after = $from.depth === 0 ? start : $from.after(1);
    return {
      name: Fragment.empty,
      body: doc.content.cut(after),
      keptInText: false,
      cutFrom: after,
    };
  }
  const content = block.content;
  const breaks = breaksOf(content);
  // Where the name is within the paragraph: with a cursor, its line; with a
  // selection, what is selected, to the first line break within it.
  const cursor = start - $from.start();
  let first = cursor;
  let last: number;
  if (end === start) {
    first = (breaks.filter((b) => b < cursor).pop() ?? -1) + 1;
    last = breaks.find((b) => b >= cursor) ?? content.size;
  } else {
    const selectedTo = end > $from.end() ? content.size : end - $from.start();
    last = Math.min(selectedTo, breaks.find((b) => b >= first) ?? content.size);
  }
  // Where the name's line ends at a line break, that break is not kept.
  const endsAtBreak = breaks.includes(last);
  const head = content.cut(0, first);
  // The paragraph goes whole where nothing but spaces and breaks stand before
  // the name; else the cut begins at the name, with the spaces and the break
  // before it, which would otherwise be left at the end of what stays.
  const cutFrom =
    startBlank(head) >= head.size ? $from.before(1) : $from.start() + first - endBlank(head);

  const { words, things } = wordsAndThings(content.cut(first, last));
  const tail = content.cut(endsAtBreak ? last + 1 : last);
  let paragraph: Fragment;
  if (!things.length) {
    paragraph = trimmedStart(tail);
  } else if (endsAtBreak) {
    // What was taken out stood in a line of its own, and the lines after it stay after it.
    const lines = trimmedStart(tail);
    const line = Fragment.from(things);
    paragraph = lines.size
      ? line.addToEnd(block.type.schema.nodes.hard_break.create()).append(lines)
      : line;
  } else {
    paragraph = Fragment.from(things).append(tail);
  }
  return {
    name: words,
    body: (paragraph.size ? Fragment.from(block.copy(paragraph)) : Fragment.empty).append(
      doc.content.cut($from.after(1)),
    ),
    keptInText: things.length > 0,
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
