/**
 * What the plugin for Firefox handed over, made notes (record 0102): each
 * thing taken out of the notebook's inbox a note of its own, with the page
 * it came from as its source. A page is a note named by its title, its
 * text the page's as it reads; a selection a note without a name, its
 * text what was selected; each taken in as one passage. An image, or a
 * part of a page, is a note holding the picture as a figure. A note
 * written in a window of its own (record 0109) is a note without a name
 * and with no source, its text as it was written, read with care
 * (`window/text.ts`). Each lies in the box that receives (`model/boxes.ts`).
 *
 * The HTML the plugin gives is not to be trusted. It is read without being
 * run, in a document of its own that is never put into the page; every
 * element is made again from what the texts can hold, without its
 * attributes, a link only where it may be followed; and then read by the
 * schema's own reading of HTML.
 */

import { DOMParser as SchemaParser, Fragment, type Mark, type Node } from 'prosemirror-model';
import { prosemirrorToYXmlFragment } from 'y-prosemirror';
import type { InboxItem } from '$lib/api/notebook';
import { formOfText, raiseForm } from '$lib/editor/form';
import { bodySchema, safeHref } from '$lib/editor/schema';
import { fileEnding } from '$lib/util/file-name';
import type { Notebook } from './model/notebook.svelte';
import { figureOf, holdTaken } from './taking';
import { readNoteDoc } from './window/text';

/** What is not read at all, with all it holds: what runs, what is drawn or loaded, what is typed into. */
const DROPPED = new Set([
  'SCRIPT',
  'STYLE',
  'NOSCRIPT',
  'TEMPLATE',
  'IFRAME',
  'FRAME',
  'FRAMESET',
  'OBJECT',
  'EMBED',
  'APPLET',
  'SVG',
  'MATH',
  'IMG',
  'PICTURE',
  'VIDEO',
  'AUDIO',
  'SOURCE',
  'TRACK',
  'CANVAS',
  'MAP',
  'AREA',
  'HEAD',
  'TITLE',
  'META',
  'LINK',
  'BASE',
  'BUTTON',
  'INPUT',
  'SELECT',
  'TEXTAREA',
  'OPTION',
  'DIALOG',
]);

/** What holds blocks: read as a block whose content is parted into paragraphs. */
const CONTAINERS = new Set([
  'BODY',
  'DIV',
  'SECTION',
  'ARTICLE',
  'MAIN',
  'HEADER',
  'FOOTER',
  'ASIDE',
  'NAV',
  'UL',
  'OL',
  'DL',
  'MENU',
  'TABLE',
  'THEAD',
  'TBODY',
  'TFOOT',
  'TR',
  'FIGURE',
  'DETAILS',
  'FORM',
  'FIELDSET',
  'BLOCKQUOTE',
  'CENTER',
  'HGROUP',
]);

/** What is one paragraph, where it holds no blocks. */
const PARAGRAPHS = new Set([
  'P',
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'PRE',
  'LI',
  'DT',
  'DD',
  'TD',
  'TH',
  'CAPTION',
  'FIGCAPTION',
  'ADDRESS',
  'SUMMARY',
  'LEGEND',
]);

/** The elements of the marks of words the texts hold, as the schema reads them. */
const MARKS = new Set(['EM', 'I', 'STRONG', 'B', 'U', 'S', 'DEL', 'STRIKE', 'SUB', 'SUP', 'CODE']);

/** A link made a whole address by the page it was on; none where it may not be followed. */
function linkOf(raw: string | null, base: string): string | null {
  if (!raw) return null;
  let href: string;
  try {
    href = new URL(raw, base || undefined).href;
  } catch {
    return null;
  }
  return safeHref(href) ? href : null;
}

/** Whether an element holds a block among what is read of it. */
function holdsBlocks(element: Element): boolean {
  for (const child of element.children) {
    if (DROPPED.has(child.tagName)) continue;
    if (CONTAINERS.has(child.tagName) || PARAGRAPHS.has(child.tagName) || holdsBlocks(child))
      return true;
  }
  return false;
}

/**
 * HTML made again from what the texts can hold, in the inert document it
 * was read into: paragraphs (of a list's kinds, and of the kind Quotation
 * within a quotation), line breaks, the marks of words, and links to whole
 * addresses that may be followed. No element keeps an attribute of its
 * own, so that nothing of the page is read as a mark or a node of
 * Glaukopis's own (a citation, a passage, a figure of the store).
 */
export function cleanHtml(html: string, base: string): HTMLElement {
  const read = new globalThis.DOMParser().parseFromString(html, 'text/html');
  const make = (tag: string) => read.createElement(tag);
  const copy = (from: globalThis.Node, into: HTMLElement, kind: string | null) => {
    for (const node of from.childNodes) {
      if (node.nodeType === 3) {
        into.appendChild(read.createTextNode(node.nodeValue ?? ''));
        continue;
      }
      if (node.nodeType !== 1) continue;
      const element = node as Element;
      const tag = element.tagName.toUpperCase();
      if (DROPPED.has(tag)) continue;
      if (tag === 'BR') {
        into.appendChild(make('br'));
        continue;
      }
      if (tag === 'A') {
        const href = linkOf(element.getAttribute('href'), base);
        if (href) {
          const a = make('a');
          a.setAttribute('href', href);
          copy(element, into.appendChild(a), kind);
        } else copy(element, into, kind);
        continue;
      }
      if (MARKS.has(tag)) {
        copy(element, into.appendChild(make(tag.toLowerCase())), kind);
        continue;
      }
      // What is within a list is of its kind, what is within a quotation a quotation.
      const within =
        tag === 'BLOCKQUOTE'
          ? 'quote'
          : tag === 'UL' || tag === 'MENU'
            ? 'item'
            : tag === 'OL'
              ? 'numbered'
              : tag === 'LI'
                ? kind === 'numbered'
                  ? 'numbered'
                  : 'item'
                : kind;
      if (CONTAINERS.has(tag) || (PARAGRAPHS.has(tag) && holdsBlocks(element))) {
        copy(element, into.appendChild(make('div')), within);
        continue;
      }
      if (PARAGRAPHS.has(tag)) {
        const p = make('p');
        if (within) p.setAttribute('data-kind', within);
        copy(element, into.appendChild(p), within);
        continue;
      }
      // Anything else is read for what it holds.
      copy(element, into, kind);
    }
  };
  const out = make('div');
  copy(read.body, out, null);
  return out;
}

/** The words of a paragraph as a passage keeps them: a line break as a new line, none at its ends. */
function paragraphWords(paragraph: Node): string {
  let out = '';
  paragraph.forEach((child) => {
    if (child.isText) out += child.text ?? '';
    else if (child.type.name === 'hard_break') out += '\n';
  });
  return out.replace(/^\n+|\n+$/g, '');
}

/** The content with every word marked as taken in a passage, where it may carry the mark. */
function markedTaken(content: Fragment, mark: Mark, parent: Node | null): Fragment {
  const nodes: Node[] = [];
  content.forEach((node) => {
    if (node.isText)
      nodes.push(
        parent && !parent.type.allowsMarkType(mark.type)
          ? node
          : node.mark(mark.addToSet(node.marks)),
      );
    else nodes.push(node.copy(markedTaken(node.content, mark, node)));
  });
  return Fragment.from(nodes);
}

/**
 * HTML the plugin gave as the paragraphs of a text: what the texts cannot
 * hold dropped, paragraphs that hold no words left out. Nothing where no
 * words are left.
 */
export function paragraphsOfHtml(html: string, base: string): Node[] {
  const doc = SchemaParser.fromSchema(bodySchema).parse(cleanHtml(html, base));
  const paragraphs: Node[] = [];
  doc.descendants((node) => {
    if (node.isTextblock) {
      if (node.textContent.trim()) paragraphs.push(node);
      return false;
    }
    return true;
  });
  return paragraphs;
}

/**
 * Writes paragraphs into the text of a note, in place of what it holds,
 * every word marked as taken in a new passage of the source, which keeps
 * them as they read now. (The model's own filling of a note from a
 * document comes with stage 2; this is the small one of the inbox.)
 */
function writeTaken(notebook: Notebook, note: string, paragraphs: Node[], source: string | null) {
  const fragment = notebook.fragment(note);
  if (!fragment) return;
  const words = paragraphs
    .map(paragraphWords)
    .filter((w) => w.trim())
    .join('\n');
  const passage = notebook.addPassage(source, words);
  const mark = bodySchema.marks.taken.create({ passage });
  const doc = bodySchema.topNodeType.create(
    null,
    markedTaken(Fragment.from(paragraphs), mark, null),
  );
  prosemirrorToYXmlFragment(doc, fragment);
}

/** Puts the words of a thing into its note, as one passage: by its HTML where it gave any that holds words, else line by line. */
function writeWords(notebook: Notebook, note: string, item: InboxItem, source: string | null) {
  const paragraphs = item.html.trim() ? paragraphsOfHtml(item.html, item.url) : [];
  if (paragraphs.length) {
    writeTaken(notebook, note, paragraphs, source);
    return;
  }
  const lines = item.text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (!lines.length) return;
  const passage = notebook.addPassage(source, lines.join('\n'));
  notebook.addText(note, lines.join('\n'), passage);
}

/**
 * Writes a note written in a window of its own into its note: the files it
 * holds held, with no source; its text as it was written, where it can be
 * read; else its words, a paragraph to each line that holds any, and then
 * its pictures and files, so that nothing of it is lost.
 */
function writeNote(notebook: Notebook, note: string, item: InboxItem) {
  const files = new Map(item.files.map((f) => [f.file.hash, f]));
  for (const f of item.files) holdTaken(notebook, f, null);
  const doc = readNoteDoc(item.doc, files);
  const fragment = notebook.fragment(note);
  if (doc && fragment) {
    // The notebook says the form of what the note holds, before it is written (ADR 0111).
    if (fragment.doc) raiseForm(fragment.doc, formOfText(doc));
    prosemirrorToYXmlFragment(doc, fragment);
    return;
  }
  const lines = item.text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length) notebook.addText(note, lines.join('\n'));
  for (const f of item.files) {
    if (f.shown) notebook.addFigure(note, figureOf(f.shown));
    else
      notebook.addFile(note, {
        hash: f.file.hash,
        name: f.file.name,
        extension: fileEnding(f.file.name),
      });
  }
}

/** When a thing was collected, as the note keeps it; where the browser said no time that can be read, `fallback`. */
function madeOf(when: string, fallback: string): string {
  const time = new Date(when);
  return when && !Number.isNaN(time.getTime()) ? time.toISOString() : fallback;
}

/** A note made of a thing taken from the inbox, with the thing's name there (`InboxItem.id`). */
export interface MadeOfInbox {
  thing: string;
  note: string;
}

/**
 * Makes a note of each thing in the inbox, in order, all in one step of
 * undo: of what the plugin handed over with the page as the source of what
 * is in it; of a note written in a window of its own as it was written. A
 * picture that did not come leaves nothing to make a note of. Gives the
 * ids of the notes made.
 */
export function notesOfInbox(notebook: Notebook, items: InboxItem[]): string[] {
  return madeOfInbox(notebook, items).map((made) => made.note);
}

/**
 * Makes the notes as `notesOfInbox` does, and gives each with the thing it
 * was made of, in the order of the things, one for each thing that became
 * a note.
 */
export function madeOfInbox(notebook: Notebook, items: InboxItem[]): MadeOfInbox[] {
  if (!items.length) return [];
  const now = Date.now();
  // The notebook knows a source it was given only once the step is made:
  // within it, things from one page are given its source here.
  const pages = new Map<string, string>();
  const sourceOf = (item: InboxItem, read: string): string | null => {
    const url = item.url.trim();
    if (!url) return null;
    let id = pages.get(url);
    if (!id) {
      id = notebook.addSource({ sort: 'web', url, title: item.title.trim(), read });
      pages.set(url, id);
    }
    return id;
  };
  return notebook.transact(() =>
    items.flatMap((item, i) => {
      // Of things with no time, the later stands above.
      const made = madeOf(item.when, new Date(now + i).toISOString());
      const pictured = item.kind === 'image' || item.kind === 'region';
      if (pictured && !item.image) return [];
      const source = sourceOf(item, made);
      const id = notebook.addNote({
        made,
        box: notebook.receiving,
        seen: false,
        ...(item.kind === 'page' && item.title.trim() ? { name: item.title } : {}),
      });
      if (item.kind === 'note') writeNote(notebook, id, item);
      else if (pictured) {
        const taken = item.image!;
        holdTaken(notebook, taken, source);
        if (taken.shown)
          notebook.addFigure(id, {
            ...figureOf(taken.shown),
            alt: item.alt.trim() || taken.shown.alt,
          });
        else
          notebook.addFile(id, {
            hash: taken.file.hash,
            name: taken.file.name,
            extension: fileEnding(taken.file.name),
          });
      } else writeWords(notebook, id, item, source);
      return [{ thing: item.id ?? '', note: id }];
    }),
  );
}
