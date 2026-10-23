/**
 * A heading made at the cursor in the text of an element (Alt+Enter): what
 * follows the cursor in its paragraph becomes the name of a new element, and
 * the paragraphs below it, to the end of the text, become the new element's
 * text. At the start of a paragraph the whole paragraph is the name; at its
 * end the name is empty and the paragraphs below go in; in the middle the
 * tail of the paragraph is the name.
 *
 * A name holds italics, small capitals, raised and lowered text, and nothing
 * else: where what would be the name holds a citation, a note, a picture, a
 * formula, a reference mark, a line break or a mark a name cannot have, it
 * becomes the first paragraph of the new element's text instead, and the
 * name stays empty.
 */

import { Fragment, type Node } from 'prosemirror-model';
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

/** Text without the spaces at its two ends, as a name is kept. */
function trimmed(fragment: Fragment): Fragment {
  const text = fragment.textBetween(0, fragment.size);
  const start = text.length - text.trimStart().length;
  const end = text.trimEnd().length;
  return end > start ? fragment.cut(start, end) : Fragment.empty;
}

/** Text without the spaces it begins with, as a paragraph begins. */
function trimmedStart(fragment: Fragment): Fragment {
  const first = fragment.firstChild;
  if (!first?.isText) return fragment;
  const text = first.text ?? '';
  return fragment.cut(text.length - text.trimStart().length);
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
  /** The name of the new element, which may be empty; null where what follows the cursor could not be one. */
  name: Fragment | null;
  /** The new element's text: the paragraphs after the cursor's, and before them the tail where it was kept as a paragraph. */
  body: Fragment;
  /** What follows the cursor held what a name cannot, and is the first paragraph of the body instead. */
  keptAsParagraph: boolean;
  /** The position from which the old text is cut to its end: the cursor, or the start of its paragraph when the whole paragraph goes. */
  cutFrom: number;
}

/**
 * A text parted at the cursor for a new element: the tail of the paragraph
 * the cursor is in as the name, where a name can hold it, and the paragraphs
 * after that paragraph as the body. Where the cursor is within something
 * that stands as one block, as a text side by side with another or a table,
 * the block stays whole and what follows it is the body.
 */
export function headingAt(doc: Node, from: number): Heading {
  const $from = doc.resolve(from);
  const block = $from.parent;
  if (!block.isTextblock || $from.depth !== 1) {
    const after = $from.depth === 0 ? from : $from.after(1);
    return {
      name: Fragment.empty,
      body: doc.content.cut(after),
      keptAsParagraph: false,
      cutFrom: after,
    };
  }
  const offset = $from.parentOffset;
  const tail = block.content.cut(offset);
  const rest = doc.content.cut($from.after(1));
  // The whole paragraph goes; else the cut begins at the cursor, with the
  // spaces before it, which would otherwise be left at the end of the line.
  const before = block.textBetween(0, offset, undefined, '￼');
  const cutFrom = offset === 0 ? $from.before(1) : from - (before.length - before.trimEnd().length);
  if (nameable(tail)) return { name: trimmed(tail), body: rest, keptAsParagraph: false, cutFrom };
  return {
    name: null,
    body: Fragment.from(block.copy(trimmedStart(tail))).append(rest),
    keptAsParagraph: true,
    cutFrom,
  };
}
