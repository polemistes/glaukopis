/**
 * Verse read as it was written. A poem is often written as paragraphs of
 * lines broken by hand: a line break for each line, a paragraph for each
 * stanza. When such paragraphs are made verse, each line break makes a line
 * of its own, and between two paragraphs stands an empty line, which is the
 * break between two stanzas. When lines with stanzas among them are made
 * any other kind, each stanza becomes a paragraph again, its lines broken by
 * hand. So a poem goes to verse and back as it was (ADR 0040).
 *
 * An empty paragraph is never counted by a numbering: an empty line of
 * verse is a break between stanzas, not a line.
 */

import { Fragment, type Node, type Schema } from 'prosemirror-model';
import { familyOf, renamed, type BasedKind } from '$lib/project/model/families';

/** Whether a paragraph holds nothing to read: no words, or only spaces and breaks. */
export function blank(paragraph: Node): boolean {
  let empty = true;
  paragraph.forEach((child) => {
    if (!empty) return;
    if (child.isText) empty = !child.text?.trim();
    else if (child.type.name !== 'hard_break') empty = false;
  });
  return empty;
}

/** The kind of a paragraph, as its attributes say it. */
const kindOf = (node: Node) => renamed((node.attrs.kind as string) || 'text');

/** Whether a paragraph has a line broken by hand in it. */
function hasBreaks(paragraph: Node): boolean {
  let found = false;
  paragraph.forEach((child) => {
    if (child.type.name === 'hard_break') found = true;
  });
  return found;
}

/** The content of a paragraph cut at its line breaks: one fragment for each line. */
function linesOf(paragraph: Node): Fragment[] {
  const out: Fragment[] = [];
  let from = 0;
  let at = 0;
  paragraph.forEach((child) => {
    if (child.type.name === 'hard_break') {
      out.push(paragraph.content.cut(from, at));
      from = at + child.nodeSize;
    }
    at += child.nodeSize;
  });
  out.push(paragraph.content.cut(from, at));
  return out;
}

/** A paragraph given in the selection, with where it begins. */
export interface Given {
  node: Node;
  pos: number;
}

/**
 * What the paragraphs given become when made of a kind, where they are to
 * be read as written: the paragraphs that replace them, and the stretch of
 * the text they stand in; nothing where the kind is only to be set on each,
 * as it is for every change but these two:
 *
 * - paragraphs with lines broken by hand, made verse: a line for each, an
 *   empty line between two paragraphs that stood together;
 * - lines of verse with an empty line among them, made another kind: a
 *   paragraph for each stanza, its lines broken by hand.
 *
 * The paragraphs given are those the selection touches, in order; the
 * stretch is from the first to the last, and only paragraphs that stand
 * one after another, under one parent, are read so.
 */
export function asWritten(
  schema: Schema,
  given: readonly Given[],
  kind: string,
  own: readonly BasedKind[],
): { from: number; to: number; nodes: Node[] } | null {
  const { paragraph, hard_break } = schema.nodes;
  if (!paragraph || !hard_break || given.length === 0) return null;
  // One after another, under one parent: nothing else between them.
  for (let i = 1; i < given.length; i++)
    if (given[i].pos !== given[i - 1].pos + given[i - 1].node.nodeSize) return null;
  const toVerse = familyOf(kind, own) === 'verse';
  const fromVerse = given.every((g) => familyOf(kindOf(g.node), own) === 'verse');
  const from = given[0].pos;
  const last = given[given.length - 1];
  const to = last.pos + last.node.nodeSize;
  const made = (content?: Fragment, more: Record<string, unknown> = {}) =>
    paragraph.create(
      { kind, indent: 0, number: null, counted: true, hidden: null, margin: null, ...more },
      content,
    );

  if (toVerse && !fromVerse && given.some((g) => hasBreaks(g.node))) {
    const nodes: Node[] = [];
    given.forEach((g, i) => {
      if (i > 0) nodes.push(made());
      linesOf(g.node).forEach((line, j) => {
        // What was said of the paragraph, its number and its margin words, stays with its first line.
        nodes.push(
          j === 0
            ? made(line, { number: g.node.attrs.number, margin: g.node.attrs.margin })
            : made(line),
        );
      });
    });
    return { from, to, nodes };
  }

  if (!toVerse && fromVerse && given.some((g) => blank(g.node))) {
    const nodes: Node[] = [];
    let lines: Node[] = [];
    const close = () => {
      if (!lines.length) return;
      const parts: Node[] = [];
      lines.forEach((line, i) => {
        if (i > 0) parts.push(hard_break.create());
        line.content.forEach((child) => parts.push(child));
      });
      nodes.push(made(Fragment.from(parts), { number: lines[0].attrs.number }));
      lines = [];
    };
    for (const g of given) {
      if (blank(g.node)) close();
      else lines.push(g.node);
    }
    close();
    return { from, to, nodes };
  }
  return null;
}
