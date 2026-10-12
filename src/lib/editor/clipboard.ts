/**
 * What goes through the clipboard. Text is copied as Org (ADR 0041), so
 * that what is pasted elsewhere as text keeps the shape of the text: its
 * kinds, its marks, its citations by their keys, its notes. Text pasted
 * as text is read as Org where it holds a sign of Org at the start of a
 * line, a block of Org, a citation or a note; otherwise it keeps every
 * line break: a lone one is a break in the paragraph, a blank line parts
 * paragraphs, and each further blank line is an empty paragraph. Where
 * only inline text can stand, as in a note, every line break is a break.
 * The HTML that is copied is as the schema writes it, with the citations
 * as they are shown.
 */

import {
  DOMParser,
  DOMSerializer,
  Fragment,
  Slice,
  type Node,
  type ResolvedPos,
  type Schema,
} from 'prosemirror-model';
import { prosemirrorToYXmlFragment, yXmlFragmentToProseMirrorRootNode } from 'y-prosemirror';
import * as Y from 'yjs';
import { readBlocks } from '$lib/org/read';
import type { OrgTextOptions } from '$lib/org/types';
import { writeBlocks } from '$lib/org/write';
import { blockElements } from '$lib/project/model/blocks';
import { readBody, type Block } from '$lib/project/model/text';
import { citationLabel } from './references.svelte';
import type { CiteItem, CiteMode } from './schema';

/**
 * Whether pasted text is Org: a block of Org, a headline, an item of a
 * list, a line of a table, a speaker, a citation or a note of Org's.
 * A line that begins "> " is not taken for a sign: mail quotes so.
 */
const ORG_SIGN =
  /^(?:[ \t]*#\+(?:begin_|attr_glaukopis|caption|name)|\*+ |[ \t]*[-+] |[ \t]*\d+[.)] |[ \t]*\|.*\|[ \t]*$|@ |-{5,}[ \t]*$)|\[cite[:/]|\[fn:/im;

export function looksLikeOrg(text: string): boolean {
  return ORG_SIGN.test(text);
}

/** Blocks as an editor holds them. */
function blocksNode(blocks: Block[], schema: Schema): Node {
  const held = new Y.Doc().getXmlFragment('pasted');
  held.insert(0, blockElements(blocks));
  return yXmlFragmentToProseMirrorRootNode(held, schema);
}

/**
 * Text pasted as text, as an editor takes it: read as Org where it is
 * (`looksLikeOrg`), with `org` saying the kinds of the writer's own and
 * the works cited; otherwise line by line.
 */
export function pastedTextSlice(
  text: string,
  $context: ResolvedPos,
  schema: Schema,
  org?: () => OrgTextOptions,
): Slice {
  const inline = $context.depth === 0 && $context.parent.inlineContent;
  if (!inline && schema.nodes.paragraph && looksLikeOrg(text)) {
    try {
      const blocks = readBlocks(text.replace(/\r\n?/g, '\n'), org?.() ?? {});
      if (blocks.length) {
        const open = Slice.maxOpen(blocksNode(blocks, schema).content);
        // Into an empty paragraph, the first paragraph pasted comes whole, of its own kind.
        return $context.parent.isTextblock && !$context.parent.content.size
          ? new Slice(open.content, 0, open.openEnd)
          : open;
      }
    } catch (error) {
      console.warn('the text pasted could not be read as Org', error);
    }
  }
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

/** What is copied as the blocks of a text; nothing where it cannot be read so. */
export function copiedBlocks(slice: Slice, schema: Schema): Block[] | null {
  try {
    const content = slice.content.firstChild?.isInline
      ? Fragment.from(schema.nodes.paragraph.create(null, slice.content))
      : slice.content;
    const held = new Y.Doc().getXmlFragment('copied');
    prosemirrorToYXmlFragment(schema.topNodeType.create(null, content), held);
    const blocks = readBody(held);
    return blocks.length ? blocks : null;
  } catch {
    return null;
  }
}

/**
 * The text of what is copied: its Org form, with `org` saying the kinds
 * of the writer's own and the works cited, by whose keys the citations
 * are written. Where it cannot be written so, its words: the citations as
 * they are shown, a break as a newline, the paragraphs apart, and a note's
 * words where it stands, in brackets.
 */
export function copiedText(
  slice: Slice,
  language: string | null | undefined,
  org?: () => OrgTextOptions,
): string {
  const schema = slice.content.firstChild?.type.schema;
  const blocks = schema ? copiedBlocks(slice, schema) : null;
  if (blocks) {
    try {
      return writeBlocks(blocks, org?.() ?? {}).replace(/\n$/, '');
    } catch (error) {
      console.warn('what was copied could not be written as Org', error);
    }
  }
  return wordsOf(slice, language);
}

/**
 * The words of what is copied, with the citations as they are shown, a
 * break as a newline and the paragraphs apart; a note's words follow where
 * it stands, in brackets.
 */
export function wordsOf(slice: Slice, language: string | null | undefined): string {
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
