/**
 * What goes through the clipboard. Text pasted as text keeps every line
 * break: a lone one is a break in the paragraph, a blank line parts
 * paragraphs, and each further blank line is an empty paragraph; where only
 * inline text can stand, as in a note, every line break is a break. Text
 * copied carries its citations as they are shown.
 */

import {
  DOMParser,
  DOMSerializer,
  type Fragment,
  type Node,
  type ResolvedPos,
  type Schema,
  type Slice,
} from 'prosemirror-model';
import { citationLabel } from './references.svelte';
import type { CiteItem, CiteMode } from './schema';

export function pastedTextSlice(text: string, $context: ResolvedPos, schema: Schema): Slice {
  const marks = $context.marks();
  const serializer = DOMSerializer.fromSchema(schema);
  const dom = document.createElement('div');
  const lines = (into: HTMLElement, block: string) => {
    block.split('\n').forEach((line, i) => {
      if (i) into.appendChild(document.createElement('br'));
      if (line) into.appendChild(serializer.serializeNode(schema.text(line, marks)));
    });
  };
  // The newline that ends the last line copied is not a break after it.
  const given = text.replace(/\r\n?/g, '\n').replace(/\n+$/, '');
  const inline = $context.depth === 0 && $context.parent.inlineContent;
  if (inline || !schema.nodes.paragraph) {
    lines(dom, given);
  } else {
    // Between the parts stand the runs of newlines that part them.
    const parts = given.split(/(\n{2,})/);
    for (let i = 0; i < parts.length; i++) {
      if (i % 2) {
        for (let n = 2; n < parts[i].length; n++) dom.appendChild(document.createElement('p'));
        continue;
      }
      lines(dom.appendChild(document.createElement('p')), parts[i]);
    }
  }
  return DOMParser.fromSchema(schema).parseSlice(dom, {
    preserveWhitespace: true,
    context: $context,
  });
}

/**
 * What a citation reads as where it is copied: as it is shown in the text,
 * "(Nagy 1979, 73)", in the language of the map.
 */
function citationText(node: Node, language: string | null | undefined): string {
  return citationLabel(node.attrs.items as CiteItem[], node.attrs.mode as CiteMode, language);
}

/**
 * The text of what is copied, with the citations as they are shown, a
 * break as a newline and the paragraphs apart; a note's words follow where
 * it stands, in brackets.
 */
export function copiedText(slice: Slice, language: string | null | undefined): string {
  const line = (fragment: Fragment): string => {
    let out = '';
    fragment.forEach((child) => {
      if (child.isText) out += child.text ?? '';
      else if (child.type.name === 'citation') out += citationText(child, language);
      else if (child.type.name === 'hard_break') out += '\n';
      else if (child.type.name === 'footnote') out += ` [${line(child.content)}]`;
      else if (child.content.size) out += line(child.content);
    });
    return out;
  };
  const blocks: string[] = [];
  const walk = (fragment: Fragment) => {
    fragment.forEach((child) => {
      if (child.isTextblock) blocks.push(line(child.content));
      else if (child.isBlock) walk(child.content);
    });
  };
  // What is copied within one paragraph is inline content, a line of its own.
  if (slice.content.firstChild?.isInline) blocks.push(line(slice.content));
  else walk(slice.content);
  return blocks.join('\n\n');
}

/**
 * The HTML of what is copied, for other programs: as the schema writes it,
 * but a citation with its words inside its span, so that what is pasted
 * elsewhere reads as the text does; pasted back here, the span is read by
 * its attributes as before.
 */
export function copiedHtml(
  schema: Schema,
  language: () => string | null | undefined,
): DOMSerializer {
  const base = DOMSerializer.fromSchema(schema);
  const nodes = { ...base.nodes };
  const citation = schema.nodes.citation;
  if (citation) {
    nodes.citation = (node) => [
      'span',
      {
        'data-citation': JSON.stringify(node.attrs.items),
        'data-mode': node.attrs.mode,
        class: 'citation',
      },
      citationText(node, language()),
    ];
  }
  return new DOMSerializer(nodes, base.marks);
}
