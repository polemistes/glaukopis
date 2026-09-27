/**
 * Reading the text of elements straight from the project document, without an
 * editor. The shape is that of `editor/schema.ts`, as y-prosemirror stores it:
 * nodes are XML elements named after their type, text is XML text whose
 * formatting attributes are the marks.
 */

import * as Y from 'yjs';
import type { CiteItem, CiteMode } from '$lib/editor/schema';

export interface InlineText {
  kind: 'text';
  text: string;
  marks: Record<string, Record<string, unknown> | true>;
}
export interface InlineCitation {
  kind: 'citation';
  items: CiteItem[];
  mode: CiteMode;
}
export interface InlineFootnote {
  kind: 'footnote';
  content: Inline[];
}
export interface InlineBreak {
  kind: 'break';
}
export type Inline = InlineText | InlineCitation | InlineFootnote | InlineBreak;

export type Block =
  | { kind: 'paragraph'; content: Inline[] }
  | { kind: 'blockquote'; content: Block[] }
  | { kind: 'bullet_list'; items: Block[][] }
  | { kind: 'ordered_list'; start: number; items: Block[][] };

function inlinesOf(parent: Y.XmlElement | Y.XmlFragment): Inline[] {
  const out: Inline[] = [];
  for (const child of parent.toArray()) {
    if (child instanceof Y.XmlText) {
      for (const op of child.toDelta() as {
        insert: unknown;
        attributes?: Record<string, unknown>;
      }[]) {
        if (typeof op.insert !== 'string' || !op.insert) continue;
        const marks: InlineText['marks'] = {};
        for (const [name, value] of Object.entries(op.attributes ?? {})) {
          if (value == null || value === false) continue;
          marks[name] = typeof value === 'object' ? (value as Record<string, unknown>) : true;
        }
        out.push({ kind: 'text', text: op.insert, marks });
      }
    } else if (child instanceof Y.XmlElement) {
      switch (child.nodeName) {
        case 'citation': {
          const items = child.getAttribute('items') as unknown;
          out.push({
            kind: 'citation',
            items: Array.isArray(items)
              ? (items as CiteItem[]).filter((i) => i && typeof i.id === 'string')
              : [],
            mode: (child.getAttribute('mode') as unknown) === 'intext' ? 'intext' : 'normal',
          });
          break;
        }
        case 'footnote':
          out.push({ kind: 'footnote', content: inlinesOf(child) });
          break;
        case 'hard_break':
          out.push({ kind: 'break' });
          break;
        default:
          out.push(...inlinesOf(child));
      }
    }
  }
  return out;
}

function blocksOf(parent: Y.XmlElement | Y.XmlFragment): Block[] {
  const out: Block[] = [];
  for (const child of parent.toArray()) {
    if (!(child instanceof Y.XmlElement)) continue;
    switch (child.nodeName) {
      case 'paragraph':
      case 'title':
        out.push({ kind: 'paragraph', content: inlinesOf(child) });
        break;
      case 'blockquote':
        out.push({ kind: 'blockquote', content: blocksOf(child) });
        break;
      case 'bullet_list':
        out.push({ kind: 'bullet_list', items: itemsOf(child) });
        break;
      case 'ordered_list':
        out.push({
          kind: 'ordered_list',
          start: Number(child.getAttribute('start') as unknown) || 1,
          items: itemsOf(child),
        });
        break;
      default:
        // Something a later version added: keep its text.
        out.push({ kind: 'paragraph', content: inlinesOf(child) });
    }
  }
  return out;
}

function itemsOf(list: Y.XmlElement): Block[][] {
  return list
    .toArray()
    .filter((c): c is Y.XmlElement => c instanceof Y.XmlElement)
    .map((item) => blocksOf(item));
}

/** The text of an element as blocks. Empty paragraphs at the end are dropped. */
export function readBody(fragment: Y.XmlFragment | undefined): Block[] {
  if (!fragment) return [];
  const blocks = blocksOf(fragment);
  while (blocks.length) {
    const last = blocks[blocks.length - 1];
    if (last.kind === 'paragraph' && !last.content.length) blocks.pop();
    else break;
  }
  return blocks;
}

/** The name of an element as inline content. */
export function readTitle(fragment: Y.XmlFragment | undefined): Inline[] {
  if (!fragment) return [];
  return inlinesOf(fragment);
}

export function inlineText(inlines: Inline[], withNotes = false): string {
  let out = '';
  for (const i of inlines) {
    if (i.kind === 'text') out += i.text;
    else if (i.kind === 'break') out += '\n';
    else if (i.kind === 'footnote' && withNotes) out += ` [${inlineText(i.content, true)}]`;
  }
  return out;
}

export function blocksText(blocks: Block[], withNotes = false): string {
  const parts: string[] = [];
  for (const b of blocks) {
    if (b.kind === 'paragraph') parts.push(inlineText(b.content, withNotes));
    else if (b.kind === 'blockquote') parts.push(blocksText(b.content, withNotes));
    else for (const item of b.items) parts.push(blocksText(item, withNotes));
  }
  return parts.join('\n');
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** A name as HTML, for the labels of the diagram: only the marks a name can have. */
export function titleHtml(inlines: Inline[]): string {
  let out = '';
  for (const i of inlines) {
    if (i.kind !== 'text') continue;
    let html = escapeHtml(i.text);
    if (i.marks.em) html = `<em>${html}</em>`;
    if (i.marks.smallcaps) html = `<span class="smallcaps">${html}</span>`;
    if (i.marks.sup) html = `<sup>${html}</sup>`;
    if (i.marks.sub) html = `<sub>${html}</sub>`;
    out += html;
  }
  return out;
}

export function countWords(text: string): number {
  // Letters and digits in runs, with apostrophes and hyphens inside them.
  return text.match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu)?.length ?? 0;
}

export interface BodyFacts {
  empty: boolean;
  words: number;
  /** Ids of the references cited, each once, in the order of first citation. */
  cited: string[];
  notes: number;
}

export function bodyFacts(blocks: Block[]): BodyFacts {
  const cited: string[] = [];
  let notes = 0;
  let text = '';
  const visitInlines = (inlines: Inline[]) => {
    for (const i of inlines) {
      if (i.kind === 'text') text += i.text;
      else if (i.kind === 'break') text += ' ';
      else if (i.kind === 'citation') {
        for (const item of i.items) if (!cited.includes(item.id)) cited.push(item.id);
      } else if (i.kind === 'footnote') {
        notes++;
        text += ' ';
        visitInlines(i.content);
        text += ' ';
      }
    }
  };
  const visit = (list: Block[]) => {
    for (const b of list) {
      if (b.kind === 'paragraph') visitInlines(b.content);
      else if (b.kind === 'blockquote') visit(b.content);
      else for (const item of b.items) visit(item);
      text += '\n';
    }
  };
  visit(blocks);
  return {
    empty: !text.trim() && !cited.length && !notes,
    words: countWords(text),
    cited,
    notes,
  };
}

/** Makes the content of a name from plain text. */
export function fillTitle(fragment: Y.XmlFragment, text: string) {
  if (fragment.length) fragment.delete(0, fragment.length);
  const line = new Y.XmlElement('title');
  if (text) line.insert(0, [new Y.XmlText(text)]);
  fragment.insert(0, [line]);
}

/** Makes the content of a text from plain text: one paragraph to a line. */
export function fillBody(fragment: Y.XmlFragment, text: string) {
  if (fragment.length) fragment.delete(0, fragment.length);
  const paragraphs = text.split(/\n+/).filter((p) => p.trim());
  fragment.insert(
    0,
    paragraphs.map((p) => {
      const el = new Y.XmlElement('paragraph');
      el.insert(0, [new Y.XmlText(p)]);
      return el;
    }),
  );
}
