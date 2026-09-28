/**
 * Spelling in the text that is drawn without an editor (ADR 0019): its
 * misspelt words are underlined by the CSS Custom Highlight API, which marks
 * ranges of the page without changing the page, so that nothing else that
 * works on the text is disturbed.
 *
 * A text is looked at when it comes into view, and again when it changes;
 * one that waits for words to be answered is looked at again when they are.
 * A long map is looked at in pieces, as it is scrolled through, when there
 * is time. Where the web view does not have the API, words are underlined
 * in the editors only.
 */

import type { Project } from '$lib/project/model/project.svelte';
import { pointRect } from '$lib/ui/floating';
import { openWordMenu } from './menu';
import { isIgnored, spelling } from './spelling.svelte';
import { findWords, NOT_TEXT } from './words';

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

interface Mark {
  word: string;
  range: Range;
}

interface Shown {
  drawn: Drawn;
  visible: boolean;
  /** Whether it is to be looked at when it is seen. */
  stale: boolean;
  /** Whether it waits for words to be answered. */
  waits: boolean;
  marks: Mark[];
}

/** The name the highlight is known by in the style (`::highlight(misspelt)`). */
const NAME = 'misspelt';
/** How long one piece of looking may take, in milliseconds. */
const PIECE = 8;

/** Whether the web view can mark words without changing the page. */
export const canHighlight =
  typeof CSS !== 'undefined' && 'highlights' in CSS && typeof Highlight !== 'undefined';

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
let highlight: Highlight | null = null;
let seen: IntersectionObserver | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;
let listening = false;

function theHighlight(): Highlight {
  if (!highlight) {
    highlight = new Highlight();
    CSS.highlights.set(NAME, highlight);
  }
  return highlight;
}

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

function clear(s: Shown) {
  if (s.marks.length) {
    const h = theHighlight();
    for (const m of s.marks) h.delete(m.range);
  }
  s.marks = [];
}

/** Looks at the words of a text, and marks those that are misspelt. */
function look(el: HTMLElement, s: Shown) {
  s.stale = false;
  s.waits = false;
  clear(s);
  if (!spelling.on) return;
  const { language, ignored } = s.drawn;
  const checking = spelling.checkingOf(language);
  if (checking === undefined) {
    s.waits = true;
    return;
  }
  if (checking === null) return;

  // The text, and where each of its pieces begins in it.
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

  const h = theHighlight();
  for (const w of findWords(text, language ?? '', checking.script)) {
    const right = spelling.judge(language, w.asked);
    if (right === undefined) {
      s.waits = true;
      continue;
    }
    if (right || isIgnored(ignored, w.word)) continue;
    const range = rangeOf(pieces, w.from, w.to);
    if (!range) continue;
    s.marks.push({ word: w.word, range });
    h.add(range);
  }
}

/** A range of the page for a part of the text, which may go over several nodes. */
function rangeOf(pieces: { node: Text; at: number }[], from: number, to: number): Range | null {
  const start = pieces.findLast((p) => p.at <= from);
  const end = pieces.findLast((p) => p.at < to);
  if (!start || !end) return null;
  const range = document.createRange();
  range.setStart(start.node, Math.min(from - start.at, start.node.data.length));
  range.setEnd(end.node, Math.min(to - end.at, end.node.data.length));
  return range;
}

/** For an element whose name or text is drawn without an editor. */
export function spellingMarks(el: HTMLElement, drawn: Drawn) {
  if (!canHighlight) return {};
  const s: Shown = { drawn, visible: false, stale: true, waits: false, marks: [] };
  shown.set(el, s);
  listen();
  observer().observe(el);
  // Put in anew, or filled in afterwards, as formulas are: looked at again.
  const changes = new MutationObserver(() => {
    s.stale = true;
    if (s.visible) want(el);
  });
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
      clear(s);
      shown.delete(el);
      queue.delete(el);
    },
  };
}

/** The misspelt word under a point of the window, in text drawn without an editor. */
export function drawnWordAt(x: number, y: number): { drawn: Drawn; word: string } | null {
  for (const [el, s] of shown) {
    if (!s.marks.length) continue;
    const box = el.getBoundingClientRect();
    if (x < box.left || x > box.right || y < box.top || y > box.bottom) continue;
    for (const m of s.marks) {
      for (const r of m.range.getClientRects()) {
        if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom)
          return { drawn: s.drawn, word: m.word };
      }
    }
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

/** The words marked in the text drawn without an editor, for tests. */
export function drawnMisspelt(): string[] {
  return [...shown.values()].flatMap((s) => s.marks.map((m) => m.word));
}
