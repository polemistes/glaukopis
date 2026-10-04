/**
 * Text pasted as text, with every line break kept: a lone one is a break in
 * the paragraph, a blank line parts paragraphs, and each further blank line
 * is an empty paragraph. Where only inline text can stand, as in a note,
 * every line break is a break.
 */

import {
  DOMParser,
  DOMSerializer,
  type ResolvedPos,
  type Schema,
  type Slice,
} from 'prosemirror-model';

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
