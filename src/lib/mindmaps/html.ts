/**
 * The text of an element as HTML that other programs read, and HTML of
 * theirs read back into a text, for the notes of mind maps; and a name
 * with the four marks a name can have, both ways.
 *
 * The HTML is made by the writer the text view has (`blocksHtml`), from the
 * text with its citations turned into their words (there is nothing in a
 * mind map to cite with) and its notes into their words in square brackets
 * where they stand; what is the page's own is then taken out of it. It is
 * written as XML, which is HTML as well, so that it can stand inside the
 * file of Freeplane. HTML read back is parsed as the editor parses what is
 * pasted, and read as the model's text.
 */

import { DOMParser as SchemaParser } from 'prosemirror-model';
import { prosemirrorToYXmlFragment } from 'y-prosemirror';
import * as Y from 'yjs';
import type { CiteItem, CiteMode } from '$lib/editor/schema';
import { bodySchema } from '$lib/editor/schema';
import { blocksHtml } from '$lib/project/model/html';
import { paragraph, readBody, type Block, type Inline } from '$lib/project/model/text';
import { tablesOfHtml } from '$lib/tables/commands';
import { leave, type LeftOut } from './map';

/** How a citation reads where there is nothing to cite with: "(Nagy 1979, 12)". */
export type Cite = (items: CiteItem[], mode: CiteMode) => string;

const text = (
  words: string,
  marks: Record<string, Record<string, unknown> | true> = {},
): Inline => ({
  kind: 'text',
  text: words,
  marks,
});

/**
 * The text with what a mind map cannot hold turned into words: citations
 * into what they read as, notes into their words in square brackets where
 * they stand, a reference mark into its label. Words that point to a
 * figure or a part have nothing to point to, and are counted.
 */
export function spoken(blocks: Block[], cite: Cite, left: LeftOut): Block[] {
  const line = (list: Inline[]): Inline[] =>
    list.flatMap((i): Inline[] => {
      switch (i.kind) {
        case 'citation':
          return [text(cite(i.items, i.mode))];
        case 'footnote':
          return [text(' ['), ...line(i.content), text(']')];
        case 'refmark':
          return [text(`${i.label} `)];
        case 'crossref':
          leave(left, 'references');
          return [];
        case 'linemark':
          return [];
        default:
          return [i];
      }
    });
  const list = (bs: Block[]): Block[] => bs.map(block);
  function block(b: Block): Block {
    switch (b.kind) {
      case 'paragraph':
        return { ...b, content: line(b.content) };
      case 'parallel':
        return { ...b, left: list(b.left), right: list(b.right) };
      case 'figure':
        if (b.file) leave(left, 'pictures');
        return { ...b, caption: line(b.caption) };
      case 'table':
        return {
          ...b,
          caption: line(b.caption),
          rows: b.rows.map((row) => row.map((cell) => ({ ...cell, content: list(cell.content) }))),
        };
      case 'row':
        return { ...b, items: list(b.items) };
      default:
        return b;
    }
  }
  return list(blocks);
}

/** Elements that are written without an end. */
const EMPTY = new Set(['br', 'hr', 'img']);

/** The attributes kept on an element, by its name: the rest are the page's own. */
const KEPT: Record<string, string[]> = {
  td: ['colspan', 'rowspan', 'style'],
  th: ['colspan', 'rowspan', 'style'],
  li: ['value'],
  span: ['style'],
};

const escapeText = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export const escapeAttr = (s: string) =>
  escapeText(s).replace(/"/g, '&quot;').replace(/\n/g, '&#10;').replace(/\t/g, '&#9;');

/** HTML as XML: every element closed, nothing but the five signs escaped. */
export function serialise(node: Node): string {
  if (node.nodeType === 3) return escapeText(node.nodeValue ?? '');
  if (node.nodeType !== 1) return '';
  const el = node as Element;
  const name = el.localName.toLowerCase();
  let attrs = '';
  for (const a of KEPT[name] ?? []) {
    const value = el.getAttribute(a);
    if (value) attrs += ` ${a}="${escapeAttr(value)}"`;
  }
  if (EMPTY.has(name)) return `<${name}${attrs}/>`;
  return `<${name}${attrs}>${children(el)}</${name}>`;
}

const children = (el: Node) => [...el.childNodes].map(serialise).join('');

/** Puts an element's children where it stood. */
function unwrap(el: Element) {
  el.replaceWith(...el.childNodes);
}

/**
 * The text as HTML for another program: paragraphs, lists, tables and the
 * marks of words, nothing of the page's own. A figure is its caption, in
 * italics, the picture counted as left out; an equation its source.
 */
export function notesHtml(
  blocks: Block[],
  language: string | null,
  cite: Cite,
  left: LeftOut,
): string {
  if (!blocks.length) return '';
  const html = blocksHtml(spoken(blocks, cite, left), language);
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html');
  const body = doc.body;
  for (const el of [...body.querySelectorAll('figure.figure')]) {
    const caption = el.querySelector('figcaption');
    if (!caption?.textContent?.trim()) {
      el.remove();
      continue;
    }
    const p = doc.createElement('p');
    const em = p.appendChild(doc.createElement('em'));
    em.append(...caption.childNodes);
    el.replaceWith(p);
  }
  for (const el of [...body.querySelectorAll('figure.tabular')]) {
    const caption = el.querySelector('figcaption');
    const table = el.querySelector('table');
    const out: Node[] = [];
    if (caption?.textContent?.trim()) {
      const p = doc.createElement('p');
      p.append(...caption.childNodes);
      out.push(p);
    }
    if (table) out.push(table);
    el.replaceWith(...out);
  }
  for (const el of [...body.querySelectorAll('div.equation')]) {
    const p = doc.createElement('p');
    p.textContent = el.textContent ?? '';
    el.replaceWith(p);
  }
  for (const el of [...body.querySelectorAll('div.pagebreak, span.line-number, span.linemark')])
    el.remove();
  // A quotation is a quotation elsewhere too.
  for (const el of [...body.querySelectorAll('p[data-kind="quote"]')]) {
    const quote = doc.createElement('blockquote');
    el.replaceWith(quote);
    quote.append(el);
  }
  for (const el of [...body.querySelectorAll('span.smallcaps')]) {
    el.removeAttribute('class');
    el.setAttribute('style', 'font-variant: small-caps');
  }
  // The rest of the page's own wrappers give way to what they hold.
  for (const el of [...body.querySelectorAll('span:not([style]), a, div, figure')]) unwrap(el);
  for (const el of [...body.querySelectorAll('td, th')]) {
    const align = (el as HTMLElement).style.textAlign;
    el.removeAttribute('style');
    if (align) el.setAttribute('style', `text-align: ${align}`);
  }
  return children(body);
}

/** The text as plain words: paragraphs parted by a blank line, items of lists marked. */
export function notesPlain(blocks: Block[], cite: Cite, left: LeftOut): string {
  const words = (list: Inline[]) =>
    list
      .map((i) =>
        i.kind === 'text' ? i.text : i.kind === 'break' ? '\n' : i.kind === 'math' ? i.tex : '',
      )
      .join('');
  const parts: string[] = [];
  let numbered = 0;
  const walk = (bs: Block[]) => {
    for (const b of bs) {
      if (b.kind !== 'paragraph' || b.name !== 'numbered') numbered = 0;
      switch (b.kind) {
        case 'paragraph': {
          const said = words(b.content).trim();
          const indent = '  '.repeat(b.indent);
          if (b.name === 'item') parts.push(`${indent}• ${said}`);
          else if (b.name === 'numbered') parts.push(`${indent}${++numbered}. ${said}`);
          else if (said) parts.push(said);
          break;
        }
        case 'parallel':
          walk(b.left);
          walk(b.right);
          break;
        case 'row':
          walk(b.items);
          break;
        case 'figure':
          if (words(b.caption).trim()) parts.push(words(b.caption).trim());
          break;
        case 'equation':
          parts.push(b.tex);
          break;
        case 'table':
          if (words(b.caption).trim()) parts.push(words(b.caption).trim());
          parts.push(
            b.rows
              .map((row) =>
                row
                  .map((cell) =>
                    cell.content
                      .map((c) => (c.kind === 'paragraph' ? words(c.content) : ''))
                      .join(' '),
                  )
                  .join('\t'),
              )
              .join('\n'),
          );
          break;
      }
    }
  };
  walk(spoken(blocks, cite, left));
  return parts.join('\n\n');
}

/** Plain words read as a text: a paragraph to each run of lines parted by a blank line. */
export function plainToBlocks(words: string): Block[] {
  return words
    .replace(/\r\n?/g, '\n')
    .split(/\n\s*\n/)
    .map((part) => part.replace(/^\n+|\s+$/g, ''))
    .filter((part) => part.trim())
    .map((part) =>
      paragraph(
        part
          .split('\n')
          .flatMap((line, i): Inline[] => [
            ...(i ? [{ kind: 'break' } as Inline] : []),
            ...(line ? [text(line)] : []),
          ]),
      ),
    );
}

/**
 * Lists of another program's HTML as this text has its lists: each item a
 * paragraph of the kind of item, or numbered, indented by its depth, where
 * a list in a list would otherwise be read as plain paragraphs.
 */
function flattenLists(doc: Document) {
  const items = (list: Element, depth: number): Element[] => {
    const kind = list.localName === 'ol' ? 'numbered' : 'item';
    const out: Element[] = [];
    for (const li of [...list.children]) {
      if (li.localName !== 'li') continue;
      const p = doc.createElement('p');
      p.setAttribute('data-kind', kind);
      if (depth) p.setAttribute('data-indent', String(depth));
      const nested: Element[] = [];
      for (const child of [...li.childNodes]) {
        const el = child.nodeType === 1 ? (child as Element) : null;
        if (el && (el.localName === 'ul' || el.localName === 'ol'))
          nested.push(...items(el, depth + 1));
        else if (el && el.localName === 'p') {
          if (p.childNodes.length) p.append(doc.createElement('br'));
          p.append(...el.childNodes);
        } else p.append(child);
      }
      out.push(p, ...nested);
    }
    return out;
  };
  for (const list of [...doc.body.querySelectorAll('ul, ol')]) {
    if (!list.isConnected || list.parentElement?.closest('ul, ol')) continue;
    list.replaceWith(...items(list, 0));
  }
}

/**
 * A text read from another program's HTML, as the editor reads what is
 * pasted: paragraphs, lists, tables and the marks of words. Pictures do not
 * come with it, and are counted. HTML that is only words is read as plain
 * words.
 */
export function htmlToBlocks(html: string, left: LeftOut): Block[] {
  if (!/<[a-z][^>]*>/i.test(html)) return plainToBlocks(decodeEntities(html));
  const doc = new DOMParser().parseFromString(html, 'text/html');
  for (const img of [...doc.querySelectorAll('img')]) {
    leave(left, 'images');
    img.remove();
  }
  for (const h of [...doc.body.querySelectorAll('h1, h2, h3, h4, h5, h6')]) {
    const p = doc.createElement('p');
    p.append(...h.childNodes);
    h.replaceWith(p);
  }
  for (const quote of [...doc.body.querySelectorAll('blockquote')]) {
    const inside = [...quote.children].filter((c) => c.localName === 'p');
    if (!inside.length) {
      const p = doc.createElement('p');
      p.append(...quote.childNodes);
      inside.push(p);
    }
    for (const p of inside) p.setAttribute('data-kind', 'quote');
    quote.replaceWith(...inside);
  }
  flattenLists(doc);
  const mended = new DOMParser().parseFromString(tablesOfHtml(doc.body.innerHTML), 'text/html');
  const read = SchemaParser.fromSchema(bodySchema).parse(mended.body);
  const held = new Y.Doc().getXmlFragment('read');
  prosemirrorToYXmlFragment(read, held);
  return readBody(held);
}

/** What `&amp;` and the like stand for, in words that came as HTML without tags. */
function decodeEntities(words: string): string {
  if (!words.includes('&')) return words;
  const doc = new DOMParser().parseFromString(`<body>${words}</body>`, 'text/html');
  return doc.body.textContent ?? words;
}

/** A name with its marks as HTML for another program: small capitals as a style, not a class. */
export function nameHtml(name: Inline[]): string {
  let out = '';
  for (const i of name) {
    if (i.kind !== 'text') continue;
    let html = escapeText(i.text);
    if (i.marks.em) html = `<i>${html}</i>`;
    if (i.marks.smallcaps) html = `<span style="font-variant: small-caps">${html}</span>`;
    if (i.marks.sup) html = `<sup>${html}</sup>`;
    if (i.marks.sub) html = `<sub>${html}</sub>`;
    out += html;
  }
  return out;
}

/** Whether a name has any of the four marks, and so needs its HTML beside its words. */
export const hasMarks = (name: Inline[]) =>
  name.some(
    (i) => i.kind === 'text' && (i.marks.em || i.marks.smallcaps || i.marks.sup || i.marks.sub),
  );

/**
 * A name read from another program's HTML: its words, with the four marks
 * a name can have (italics, small capitals, raised, lowered), and the rest
 * of its markup taken as words; lines and paragraphs are parted by a space.
 */
export function nameOfHtml(root: Node): Inline[] {
  const out: Inline[] = [];
  type Marks = { em?: true; smallcaps?: true; sup?: true; sub?: true };
  const push = (words: string, marks: Marks) => {
    if (!words) return;
    const said = Object.fromEntries(Object.keys(marks).map((k) => [k, {}]));
    const last = out[out.length - 1];
    if (last?.kind === 'text' && JSON.stringify(last.marks) === JSON.stringify(said))
      last.text += words;
    else out.push(text(words, said));
  };
  const walk = (node: Node, marks: Marks) => {
    if (node.nodeType === 3) {
      push((node.nodeValue ?? '').replace(/\s+/g, ' '), marks);
      return;
    }
    if (node.nodeType !== 1) return;
    const el = node as Element;
    const name = el.localName.toLowerCase();
    if (name === 'head' || name === 'style' || name === 'script') return;
    const style = (el.getAttribute('style') ?? '').toLowerCase();
    const more: Marks = { ...marks };
    if (name === 'i' || name === 'em' || /font-style:\s*italic/.test(style)) more.em = true;
    if (/font-variant(-caps)?:\s*small-caps/.test(style) || el.classList?.contains('smallcaps'))
      more.smallcaps = true;
    if (name === 'sup' || /vertical-align:\s*super/.test(style)) more.sup = true;
    if (name === 'sub' || /vertical-align:\s*sub/.test(style)) more.sub = true;
    const block = ['p', 'div', 'br', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(name);
    if (block) push(' ', {});
    for (const child of el.childNodes) walk(child, more);
    if (block) push(' ', {});
  };
  walk(root, {});
  // Spaces at the ends, and two where one is meant, go.
  const words: Inline[] = [];
  for (const i of out) {
    if (i.kind !== 'text') continue;
    const prev = words[words.length - 1];
    let t = i.text;
    if (!prev || (prev.kind === 'text' && prev.text.endsWith(' '))) t = t.replace(/^ +/, '');
    if (t) words.push({ ...i, text: t });
  }
  const last = words[words.length - 1];
  if (last?.kind === 'text') {
    last.text = last.text.replace(/ +$/, '');
    if (!last.text) words.pop();
  }
  return words.filter((i) => i.kind !== 'text' || i.text);
}
