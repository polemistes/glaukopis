/**
 * Spelling in the text that is drawn without an editor (ADR 0019): its
 * misspelt words are wrapped in spans that underline them as the editors
 * do. The text is put in whole by Svelte (`{@html}` is the only child of its
 * element), which sweeps the spans away with the old text when it is drawn
 * anew; they are then made again.
 *
 * A text is looked at when it comes into view, and again when it changes;
 * one that waits for words to be answered is looked at again when they are.
 * A long map is looked at in pieces, as it is scrolled through, when there
 * is time.
 *
 * The CSS Custom Highlight API, which marks words without changing the page,
 * was tried first. WebKitGTK 2.52 draws it, but each range it holds made
 * every change of the page slower, wherever it was: with five hundred words
 * marked in view, a key took some thirty milliseconds more in a long map. A
 * span costs nothing when the page changes elsewhere.
 */

import type { Project } from '$lib/project/model/project.svelte';
import { pointRect } from '$lib/ui/floating';
import { openWordMenu } from './menu';
import { isIgnored, spelling } from './spelling.svelte';
import { findWords, NOT_TEXT } from './words';
import './spelling.css';

/** A text drawn without an editor. */
export interface Drawn {
  project: Project;
  /** The element whose name or text it is. */
  element: string;
  part: 'title' | 'body';
  /** The language of its map. */
  language: string | null | undefined;
  /** The words ignored in the project. */
  ignored: ReadonlySet<string>;
  /** What was put into it: given anew, it is looked at anew. */
  html: string;
}

interface Shown {
  drawn: Drawn;
  visible: boolean;
  /** Whether it is to be looked at when it is seen. */
  stale: boolean;
  /** Whether it waits for words to be answered. */
  waits: boolean;
  /** The spans that mark its misspelt words. */
  spans: HTMLElement[];
  /** What sees it change; it is told to forget the changes made here. */
  changes: MutationObserver;
}

/** How long one piece of looking may take, in milliseconds. */
const PIECE = 8;

/** What is not text, whose words are not checked. */
const NOT_WORDS =
  '.citation, .math, [data-math], .crossref, .found, .footnote, .equation, code, svg';

/** Elements that are blocks, between which words do not run on. */
const BLOCKS = new Set([
  'P',
  'LI',
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'BLOCKQUOTE',
  'FIGCAPTION',
  'FIGURE',
  'TD',
  'TH',
  'DIV',
  'PRE',
]);

const shown = new Map<HTMLElement, Shown>();
const queue = new Set<HTMLElement>();
let seen: IntersectionObserver | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;
let listening = false;

function observer(): IntersectionObserver {
  seen ??= new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const el = entry.target as HTMLElement;
      const s = shown.get(el);
      if (!s) continue;
      s.visible = entry.isIntersecting;
      if (s.visible && s.stale) want(el);
    }
  });
  return seen;
}

function listen() {
  if (listening) return;
  listening = true;
  spelling.listen((change) => {
    for (const [el, s] of shown) {
      if (change === 'anew' || s.waits) {
        s.stale = true;
        if (s.visible) want(el);
      }
    }
  });
}

/** Has a text looked at when there is time. */
function want(el: HTMLElement) {
  queue.add(el);
  timer ??= setTimeout(work, 0);
}

function work() {
  timer = undefined;
  const until = performance.now() + PIECE;
  for (const el of queue) {
    if (performance.now() > until) break;
    queue.delete(el);
    const s = shown.get(el);
    if (s?.stale && s.visible) look(el, s);
  }
  if (queue.size) timer = setTimeout(work, 0);
}

/** The nearest block around a node of text, within the text. */
function blockOf(el: Element, root: HTMLElement): Element {
  for (let at: Element | null = el; at && at !== root; at = at.parentElement) {
    if (BLOCKS.has(at.tagName)) return at;
  }
  return root;
}

/** Takes the marks away, and joins again the text they had parted. */
function unmark(s: Shown) {
  const parents = new Set<Node>();
  for (const span of s.spans) {
    // A span that is gone went with the text it was in.
    const parent = span.parentNode;
    if (!parent) continue;
    parents.add(parent);
    span.replaceWith(...span.childNodes);
  }
  for (const parent of parents) parent.normalize();
  s.spans = [];
}

/** Wraps a part of a node of text in a span that marks it misspelt. */
function mark(node: Text, from: number, to: number, word: string): HTMLElement {
  if (to < node.data.length) node.splitText(to);
  const middle = from > 0 ? node.splitText(from) : node;
  const span = document.createElement('span');
  span.className = 'misspelt';
  span.dataset.word = word;
  middle.replaceWith(span);
  span.append(middle);
  return span;
}

/** Looks at the words of a text, and marks those that are misspelt. */
function look(el: HTMLElement, s: Shown) {
  s.stale = false;
  s.waits = false;
  unmark(s);
  const checking = spelling.on ? spelling.checkingOf(s.drawn.language) : null;
  if (checking === undefined) s.waits = true;
  if (checking) markAll(el, s, checking.script);
  // What was changed here is not a change to be looked at again.
  s.changes.takeRecords();
}

function markAll(el: HTMLElement, s: Shown, script: string | null) {
  const { language, ignored } = s.drawn;

  // The text, and where each of its nodes of text begins in it.
  let text = '';
  const pieces: { node: Text; at: number }[] = [];
  let lastBlock: Element | null = null;
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const node = n as Text;
    const parent = node.parentElement;
    if (!parent) continue;
    const block = blockOf(parent, el);
    if (lastBlock && block !== lastBlock) text += '\n';
    lastBlock = block;
    if (parent.closest(NOT_WORDS)) {
      text += NOT_TEXT.repeat(node.data.length);
      continue;
    }
    pieces.push({ node, at: text.length });
    text += node.data;
  }

  // The parts of the nodes to be marked, the last first, so that parting a
  // node leaves the places of those before as they were.
  const parts: { piece: number; from: number; to: number; word: string }[] = [];
  let i = 0;
  for (const w of findWords(text, language ?? '', script)) {
    const right = spelling.judge(language, w.asked);
    if (right === undefined) {
      s.waits = true;
      continue;
    }
    if (right || isIgnored(ignored, w.word)) continue;
    while (i + 1 < pieces.length && pieces[i + 1].at <= w.from) i++;
    for (let p = i; p < pieces.length && pieces[p].at < w.to; p++) {
      const { node, at } = pieces[p];
      const from = Math.max(w.from - at, 0);
      const to = Math.min(w.to - at, node.data.length);
      if (to > from) parts.push({ piece: p, from, to, word: w.word });
    }
  }
  for (let n = parts.length - 1; n >= 0; n--) {
    const { piece, from, to, word } = parts[n];
    s.spans.push(mark(pieces[piece].node, from, to, word));
  }
}

/** For an element whose name or text is drawn without an editor. */
export function spellingMarks(el: HTMLElement, drawn: Drawn) {
  // Put in anew, or filled in afterwards, as formulas are: looked at again.
  const changes = new MutationObserver(() => {
    s.stale = true;
    if (s.visible) want(el);
  });
  const s: Shown = { drawn, visible: false, stale: true, waits: false, spans: [], changes };
  shown.set(el, s);
  listen();
  observer().observe(el);
  changes.observe(el, { childList: true, subtree: true, characterData: true });
  return {
    update(next: Drawn) {
      s.drawn = next;
      s.stale = true;
      if (s.visible) want(el);
    },
    destroy() {
      changes.disconnect();
      seen?.unobserve(el);
      shown.delete(el);
      queue.delete(el);
    },
  };
}

/** The misspelt word under a point of the window, in text drawn without an editor. */
export function drawnWordAt(x: number, y: number): { drawn: Drawn; word: string } | null {
  const span = document.elementFromPoint(x, y)?.closest<HTMLElement>('.misspelt[data-word]');
  if (!span) return null;
  for (const [el, s] of shown) {
    if (el.contains(span)) return { drawn: s.drawn, word: span.dataset.word ?? '' };
  }
  return null;
}

/**
 * Opens the menu of the misspelt word under the pointer, in text drawn
 * without an editor, if there is one there. What is chosen in place of the
 * word is put in by `replace`, which opens the editor. Returns whether it
 * was opened.
 */
export function openDrawnWordMenu(
  event: MouseEvent,
  replace: (drawn: Drawn, at: { left: number; top: number }, word: string, by: string) => void,
): boolean {
  const found = drawnWordAt(event.clientX, event.clientY);
  if (!found) return false;
  event.preventDefault();
  event.stopPropagation();
  const at = { left: event.clientX, top: event.clientY };
  void openWordMenu({
    language: found.drawn.language,
    word: found.word,
    anchor: pointRect(at.left, at.top),
    replace: (by) => replace(found.drawn, at, found.word, by),
    project: found.drawn.project,
  });
  return true;
}
