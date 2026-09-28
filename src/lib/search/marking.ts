/**
 * Marking what was found where it is shown: in the editors, and in the text
 * that is drawn without one (`model/html.ts`). The marks are highlights of
 * the style sheet (the CSS Custom Highlight API), which lie over the page
 * without changing it: `::highlight(search)` for all that is found,
 * `::highlight(search-current)` for the one that is shown, and
 * `::highlight(search-scope)` for the text a search is kept to. The mark of
 * a note, whose number is drawn by the style sheet and is no text, is a
 * class of its own. The web view draws highlights only in the text that
 * flows in the page, and wrongly in a box that stands over it: there the
 * editors draw the marks themselves (`decorations.ts`).
 *
 * Only what is in view is marked: the elements that are shown near the
 * window say which they are, and are marked when they come into view.
 */

import type { EditorView } from 'prosemirror-view';
import { viewsByDom } from '$lib/editor/ui.svelte';
import { pieceAt, type Labels, type Passage } from './passages';
import { positionOf, readBodyDoc, readTitleDoc, type ReadDoc } from './prosemirror';
import { markIn, type Marked } from './decorations';
import type { Match, Part, Place, Scope, Texts } from './searching';

const ALL = 'search';
const CURRENT = 'search-current';
const SCOPE = 'search-scope';
/** The class of the number of a note in which something was found. */
export const NOTE_FOUND = 'search-found';
export const NOTE_CURRENT = 'search-current';

type Registry = {
  get(name: string): HighlightLike | undefined;
  set(name: string, h: HighlightLike): void;
};
interface HighlightLike {
  add(range: AbstractRange): void;
  delete(range: AbstractRange): boolean;
}

/** The highlights of the page, where the web view has them. */
function registry(): Registry | null {
  if (typeof CSS === 'undefined' || !('highlights' in CSS)) return null;
  return (CSS as unknown as { highlights: Registry }).highlights;
}

function highlight(name: string): HighlightLike | null {
  const all = registry();
  if (!all || typeof Highlight === 'undefined') return null;
  let h = all.get(name);
  if (!h) {
    h = new Highlight() as unknown as HighlightLike;
    all.set(name, h);
  }
  return h;
}

/** What a surface shows: where the name or the text of an element is, and which elements are in view. */
export interface Shown {
  /** The element of the page that holds the name or the text of an element: an editor, or what is drawn. */
  holder(element: string, part: Part): HTMLElement | null;
  /** The elements that are in view or near it; nothing, where all are. */
  inView(): Set<string> | null;
  /**
   * Whether the editors here draw the marks themselves: where they stand in
   * a box over the page, where the web view does not draw highlights.
   */
  editorsDraw?: boolean;
}

/** The editor that an element of the page is, if it is one. */
export function editorOf(holder: HTMLElement | null): EditorView | null {
  if (!holder) return null;
  const el = holder.classList.contains('ProseMirror')
    ? holder
    : holder.querySelector('.ProseMirror');
  return (el && viewsByDom.get(el)) || null;
}

const reads = new WeakMap<object, { labels: boolean; read: ReadDoc }>();

/** The passages of an editor as it is now; read once for each state of it. */
export function readEditor(view: EditorView, part: Part, labels: Labels | null): ReadDoc {
  const doc = view.state.doc;
  const known = reads.get(doc);
  if (known && known.labels === !!labels) return known.read;
  const read = part === 'title' ? readTitleDoc(doc) : readBodyDoc(doc, labels);
  reads.set(doc, { labels: !!labels, read });
  return read;
}

// ---- in text that is drawn without an editor ----

/**
 * The elements of drawn text that hold the passages, in the order of the
 * passages: a paragraph, what is said of a figure or a table, an equation;
 * and, after a paragraph, the numbers of its notes, whose texts are the
 * passages that follow it.
 */
function drawnHolders(root: HTMLElement): HTMLElement[] {
  const out: HTMLElement[] = [];
  for (const el of root.querySelectorAll<HTMLElement>('p, figcaption, div.equation')) {
    out.push(el);
    if (el.tagName === 'P') out.push(...el.querySelectorAll<HTMLElement>('sup.footnote'));
  }
  return out;
}

const ATOMS = 'span.citation, span.math, span.crossref, sup.footnote, br';

/**
 * Where a place of a passage is in drawn text: text is found by counting its
 * signs, and what is no text by counting what there is of it before.
 */
function drawnPoint(
  holder: HTMLElement,
  passage: Passage,
  offset: number,
  end: boolean,
): { node: Node; offset: number } | null {
  const atoms = passage.pieces.filter((p) => p.kind !== 'text');
  let at = 0;
  let k = 0;
  let found: { node: Node; offset: number } | null = null;
  const walk = (parent: Node): boolean => {
    for (let child = parent.firstChild; child; child = child.nextSibling) {
      if (child.nodeType === Node.TEXT_NODE) {
        const length = (child as Text).length;
        if (offset < at + length || (end && offset === at + length)) {
          found = { node: child, offset: offset - at };
          return true;
        }
        at += length;
      } else if (child instanceof Element) {
        if (child.matches(ATOMS)) {
          const piece = atoms[k++];
          if (!piece) continue;
          const index = [...parent.childNodes].indexOf(child as ChildNode);
          if (offset < piece.start + piece.length && !(end && offset === piece.start)) {
            // Within what is no text, the whole of it.
            found = { node: parent, offset: end ? index + 1 : index };
            return true;
          }
          if (offset === piece.start && end) {
            found = { node: parent, offset: index };
            return true;
          }
          at = piece.start + piece.length;
        } else if (walk(child)) return true;
      }
    }
    return false;
  };
  walk(holder);
  if (!found && offset >= at) found = { node: holder, offset: holder.childNodes.length };
  return found;
}

/** Where a match is in drawn text, or the number of the note it is in. */
function drawnRange(root: HTMLElement, read: Passage[], m: Match): Range | Element | null {
  const holders = m.part === 'title' ? [root] : drawnHolders(root);
  const holder = holders[m.passage];
  if (!holder) return null;
  if (m.within) return holder;
  const passage = read[m.passage];
  if (!passage) return null;
  if (holder.matches('div.equation')) {
    const range = document.createRange();
    range.selectNodeContents(holder);
    return range;
  }
  const a = drawnPoint(holder, passage, m.start, false);
  const b = drawnPoint(holder, passage, m.end, true);
  if (!a || !b) return null;
  const range = document.createRange();
  try {
    range.setStart(a.node, a.offset);
    range.setEnd(b.node, b.offset);
  } catch {
    return null;
  }
  return range;
}

// ---- in an editor ----

/** Where a match is in an editor, or the number of the note it is in. */
export function editorRange(
  view: EditorView,
  read: ReadDoc,
  m: Match,
  labels: Labels | null,
): Range | Element | null {
  if (m.within) {
    const outer = read.passages[m.within.passage];
    if (!outer) return null;
    const at = read.refs[m.within.passage][pieceAt(outer, m.within.at)];
    const dom = at && view.nodeDOM(at.pos);
    return dom instanceof Element ? dom : null;
  }
  const passage = read.passages[m.passage];
  if (!passage) return null;
  try {
    const range = document.createRange();
    if (passage.kind === 'equation') {
      const dom = view.nodeDOM(read.refs[m.passage][0]?.pos ?? -1);
      if (!(dom instanceof Element)) return null;
      range.selectNodeContents(dom);
      return range;
    }
    // Within the words of a citation or of words that point, as they are shown.
    const i = pieceAt(passage, m.start);
    const piece = passage.pieces[i];
    if (
      labels &&
      piece &&
      piece.kind !== 'text' &&
      m.end <= piece.start + piece.length &&
      (piece.kind === 'citation' || piece.kind === 'crossref')
    ) {
      const dom = view.nodeDOM(read.refs[m.passage][i].pos);
      const text = dom?.firstChild;
      if (
        text &&
        text.nodeType === Node.TEXT_NODE &&
        dom?.textContent === passage.text.slice(piece.start, piece.start + piece.length)
      ) {
        range.setStart(text, m.start - piece.start);
        range.setEnd(text, m.end - piece.start);
        return range;
      }
    }
    const from = view.domAtPos(positionOf(read, m.passage, m.start));
    const to = view.domAtPos(positionOf(read, m.passage, m.end, true));
    range.setStart(from.node, from.offset);
    range.setEnd(to.node, to.offset);
    return range;
  } catch {
    return null;
  }
}

/**
 * Where a match is shown, in an editor or in drawn text: the text of it, or
 * the number of the note it is in.
 */
export function rangeOf(
  holder: HTMLElement,
  element: string,
  part: Part,
  texts: Texts,
  labels: Labels | null,
  m: Match,
): Range | Element | null {
  const view = editorOf(holder);
  if (view) return editorRange(view, readEditor(view, part, labels), m, labels);
  const read = texts.of(element, labels);
  if (!read) return null;
  const drawn = holder.classList.contains('static')
    ? holder
    : holder.querySelector<HTMLElement>('.static');
  if (!drawn) return null;
  return drawnRange(drawn, part === 'title' ? [read.title] : read.body, m);
}

// ---- the marks ----

type Mark = Range | Element;

/**
 * The marks of one surface: a text of a map, or an edit box. The
 * highlights are shared by all of them; each takes away its own marks
 * before it puts new ones.
 */
export class Marking {
  readonly #shown: Shown;
  readonly #texts: () => Texts;
  #ranges: Range[] = [];
  #current: Range[] = [];
  #scope: Range[] = [];
  #notes: Element[] = [];
  /** The editors that draw marks they were given. */
  #drawing = new Set<EditorView>();
  /** The marks of text that is drawn without an editor, by element and part, while it is drawn the same. */
  #kept = new Map<string, { holder: HTMLElement; matches: Match[]; marks: (Mark | null)[] }>();

  constructor(shown: Shown, texts: () => Texts) {
    this.#shown = shown;
    this.#texts = texts;
  }

  #put(name: string, ranges: Range[], mine: Range[]): Range[] {
    const h = highlight(name);
    if (!h) return [];
    for (const r of mine) h.delete(r);
    for (const r of ranges) h.add(r);
    return ranges;
  }

  /**
   * Marks what was found in the elements that are in view, and the one that
   * is shown more strongly; and the text a search is kept to.
   */
  mark(matches: Match[], current: Match | null, labels: Labels | null, scope: Scope | null) {
    const byPart = new Map<string, Match[]>();
    for (const m of matches) {
      const key = `${m.element}\u0000${m.part}`;
      const list = byPart.get(key);
      if (list) list.push(m);
      else byPart.set(key, [m]);
    }
    // The one that is shown is marked wherever it is.
    if (current && !byPart.has(`${current.element}\u0000${current.part}`))
      byPart.set(`${current.element}\u0000${current.part}`, [current]);
    const scoped = scope ? `${scope.element}\u0000${scope.part}` : null;
    if (scoped && !byPart.has(scoped)) byPart.set(scoped, []);

    const inView = this.#shown.inView();
    const ranges: Range[] = [];
    const shown: Range[] = [];
    const within: Range[] = [];
    const notes: Element[] = [];
    const shownNotes: Element[] = [];
    const drawing = new Set<EditorView>();
    const kept = new Map<
      string,
      { holder: HTMLElement; matches: Match[]; marks: (Mark | null)[] }
    >();

    for (const [key, list] of byPart) {
      const { element, part } = list[0] ?? scope!;
      const isCurrent = current && current.element === element && current.part === part;
      if (inView && !inView.has(element) && !isCurrent) continue;
      const holder = this.#shown.holder(element, part);
      if (!holder) continue;
      const view = editorOf(holder);

      if (view && this.#shown.editorsDraw) {
        // An editor that draws the marks it is given.
        const read = readEditor(view, part, labels);
        const marks: Marked[] = [];
        for (const m of list) {
          if (m.within) {
            const note = editorRange(view, read, m, labels);
            if (note instanceof Element) (m === current ? shownNotes : notes).push(note);
            continue;
          }
          marks.push({
            from: positionOf(read, m.passage, m.start),
            to: positionOf(read, m.passage, m.end, true),
            current: m === current,
          });
        }
        if (key === scoped && scope)
          for (const [from, to] of scopeSpans(scope, this.#texts(), labels, part))
            marks.push({
              from: positionOf(read, from.passage, from.offset),
              to: positionOf(read, to.passage, to.offset, true),
              scope: true,
            });
        markIn(view, marks);
        drawing.add(view);
        continue;
      }

      // Highlights, over an editor or over text that is drawn.
      const before = this.#kept.get(key);
      let marks: (Mark | null)[];
      if (!view && before && before.holder === holder && same(before.matches, list)) {
        marks = before.marks;
      } else {
        marks = list.map((m) => rangeOf(holder, element, part, this.#texts(), labels, m));
      }
      if (!view) kept.set(key, { holder, matches: list, marks });
      list.forEach((m, i) => {
        const mark = marks[i];
        if (!mark) return;
        if (mark instanceof Range) (m === current ? shown : ranges).push(mark);
        else (m === current ? shownNotes : notes).push(mark);
      });
      if (key === scoped && scope)
        for (const [from, to] of scopeSpans(scope, this.#texts(), labels, part)) {
          const m: Match = {
            element,
            part,
            passage: from.passage,
            start: from.offset,
            end: to.offset,
            text: '',
            hit: { start: from.offset, end: to.offset },
          };
          const mark = rangeOf(holder, element, part, this.#texts(), labels, m);
          if (mark instanceof Range) within.push(mark);
        }
    }

    this.#kept = kept;
    this.#ranges = this.#put(ALL, [...ranges, ...shown], this.#ranges);
    this.#current = this.#put(CURRENT, shown, this.#current);
    this.#scope = this.#put(SCOPE, within, this.#scope);
    for (const el of this.#notes) el.classList.remove(NOTE_FOUND, NOTE_CURRENT);
    for (const el of notes) el.classList.add(NOTE_FOUND);
    for (const el of shownNotes) el.classList.add(NOTE_FOUND, NOTE_CURRENT);
    this.#notes = [...notes, ...shownNotes];
    for (const view of this.#drawing) if (!drawing.has(view)) markIn(view, []);
    this.#drawing = drawing;
  }

  /** Takes away all the marks of this surface. */
  clear() {
    this.#ranges = this.#put(ALL, [], this.#ranges);
    this.#current = this.#put(CURRENT, [], this.#current);
    this.#scope = this.#put(SCOPE, [], this.#scope);
    for (const el of this.#notes) el.classList.remove(NOTE_FOUND, NOTE_CURRENT);
    this.#notes = [];
    for (const view of this.#drawing) markIn(view, []);
    this.#drawing.clear();
    this.#kept.clear();
  }
}

function same(a: Match[], b: Match[]): boolean {
  return a.length === b.length && a.every((m, i) => m === b[i]);
}

/** The text a search is kept to, passage by passage: from where, to where. */
function scopeSpans(
  scope: Scope,
  texts: Texts,
  labels: Labels | null,
  part: Part,
): [Place, Place][] {
  if (scope.part !== part) return [];
  const read = texts.of(scope.element, labels);
  if (!read) return [];
  const out: [Place, Place][] = [];
  for (const p of part === 'title' ? [read.title] : read.body) {
    if (p.within || p.index < scope.from.passage || p.index > scope.to.passage) continue;
    const start = p.index === scope.from.passage ? scope.from.offset : 0;
    const end = p.index === scope.to.passage ? scope.to.offset : p.text.length;
    if (end > start)
      out.push([
        { passage: p.index, offset: start },
        { passage: p.index, offset: end },
      ]);
  }
  return out;
}
