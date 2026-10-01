/**
 * The changes that are reviewed, marked in text drawn without an editor
 * (`model/html.ts`): what was added and formatted anew wrapped in spans, what
 * was deleted put in as spans that draw its words by the style sheet and
 * hold no text, so that nothing that reads the page (spelling, search,
 * copying) takes them for text. Spans, as spelling has found, cost nothing
 * when the page changes elsewhere; highlights of the style sheet do.
 *
 * The blocks are found by walking the blocks of the document and what is
 * drawn of them together, by the rules `model/text.ts` draws them by: an
 * equation without a formula, and a table without cells, are not drawn, and
 * a row of one stands without the row. A text is marked when it comes into
 * view, and again when it is drawn anew or its marks change.
 */

import * as Y from 'yjs';
import type { Mark } from './marks';
import './review.css';

/** The spans put in here. */
const OURS = 'review-mark';

/** What stands in drawn text as one sign, and is not gone into. */
const ATOMS = 'span.citation, span.math, span.crossref, sup.footnote, br';

function elements(y: Y.XmlFragment): Y.XmlElement[] {
  return y.toArray().filter((c): c is Y.XmlElement => c instanceof Y.XmlElement);
}

/** What is drawn of a container, without what is put in here. */
function drawnOf(dom: Element): Element[] {
  return [...dom.children].filter((c) => !c.classList.contains(OURS));
}

/** How many elements a block is drawn as: none, where it is not drawn. */
function drawnCount(y: Y.XmlElement): number {
  switch (y.nodeName) {
    case 'equation':
      return String(y.getAttribute('tex') ?? '').trim() ? 1 : 0;
    case 'tabular': {
      const table = elements(y).find((c) => c.nodeName === 'table');
      return table && elements(table).some((row) => elements(row).length) ? 1 : 0;
    }
    case 'row': {
      const n = elements(y).reduce((sum, c) => sum + drawnCount(c), 0);
      return n ? 1 : 0;
    }
    default:
      return 1;
  }
}

/** The elements drawn for the blocks of a container, by the place of each block in it. */
function drawnBlocks(y: Y.XmlFragment, dom: Element): (Element | null)[] {
  const drawn = drawnOf(dom);
  let at = 0;
  return elements(y).map((child) => (drawnCount(child) ? (drawn[at++] ?? null) : null));
}

/** The element drawn for a block within one that is drawn. */
function within(y: Y.XmlElement, dom: Element, index: number): [Y.XmlElement, Element] | null {
  const kids = elements(y);
  const child = kids[index];
  if (!child) return null;
  switch (y.nodeName) {
    case 'bullet_list':
    case 'ordered_list': {
      const item = drawnOf(dom)[index];
      return item ? [child, item] : null;
    }
    case 'tabular': {
      if (child.nodeName === 'table_caption') {
        const said = dom.querySelector(':scope > figcaption');
        return said ? [child, said] : null;
      }
      const body = dom.querySelector(':scope > table > tbody');
      return body ? [child, body] : null;
    }
    case 'table': {
      // Rows without cells are not drawn.
      const rows = kids.filter((r) => elements(r).length);
      const drawn = drawnOf(dom)[rows.indexOf(child)];
      return drawn ? [child, drawn] : null;
    }
    case 'table_row': {
      const cell = drawnOf(dom)[index];
      return cell ? [child, cell] : null;
    }
    case 'row': {
      // A row of one stands without the row.
      const shown = kids.filter((c) => drawnCount(c));
      if (shown.length === 1) return shown[0] === child ? [child, dom] : null;
      const drawn = drawnBlocks(y, dom)[index];
      return drawn ? [child, drawn] : null;
    }
    default: {
      const drawn = drawnBlocks(y, dom)[index];
      return drawn ? [child, drawn] : null;
    }
  }
}

/** The element that holds the text of a block, drawn: a paragraph, what is said of a figure or a table. */
export function drawnHolder(
  root: HTMLElement,
  fragment: Y.XmlFragment | null,
  part: Mark['part'],
  path: Mark['path'],
): Element | null {
  if (part === 'title') return root;
  if (!fragment || !path.length) return null;
  const first = path[0];
  if (typeof first !== 'number') return null;
  const top = elements(fragment)[first];
  const topDrawn = drawnBlocks(fragment, root)[first];
  if (!top || !topDrawn) return null;
  let y: Y.XmlElement = top;
  let dom: Element = topDrawn;
  for (let i = 1; i < path.length; i++) {
    const step = path[i];
    if (step === 'note') {
      const notes = dom.querySelectorAll('sup.footnote');
      return notes[Number(path[i + 1])] ?? null;
    }
    const next = within(y, dom, step);
    if (!next) return null;
    [y, dom] = next;
  }
  if (y.nodeName === 'figure' || y.nodeName === 'tabular')
    return dom.querySelector(':scope > figcaption');
  return dom;
}

/** The element drawn for a block as a whole: a figure, an equation, a table. */
function drawnWhole(
  root: HTMLElement,
  fragment: Y.XmlFragment | null,
  path: Mark['path'],
): Element | null {
  if (!fragment || !path.length) return null;
  const holder = drawnHolder(root, fragment, 'body', path);
  return holder?.closest('figure, div.equation') ?? holder;
}

/** Where a place of a text is in what is drawn of it: signs counted, a thing that is no text one. */
function pointIn(holder: Element, offset: number): { node: Node; offset: number } {
  let at = 0;
  let found: { node: Node; offset: number } | null = null;
  const walk = (parent: Node): boolean => {
    for (let child = parent.firstChild; child; child = child.nextSibling) {
      if (child.nodeType === Node.TEXT_NODE) {
        const length = (child as Text).length;
        if (offset < at + length) {
          found = { node: child, offset: offset - at };
          return true;
        }
        at += length;
      } else if (child instanceof Element) {
        if (child.classList.contains(OURS) && child.classList.contains('review-removed')) continue;
        if (child.matches(ATOMS)) {
          if (offset === at) {
            found = { node: parent, offset: [...parent.childNodes].indexOf(child as ChildNode) };
            return true;
          }
          at += 1;
        } else if (walk(child)) return true;
      }
    }
    return false;
  };
  walk(holder);
  return found ?? { node: holder, offset: holder.childNodes.length };
}

function span(m: Mark, kind: string): HTMLElement {
  const el = document.createElement('span');
  el.className = `${OURS} review-${kind}${m.current ? ' current' : ''}`;
  el.dataset.change = m.change;
  el.style.setProperty('--by', m.colour);
  return el;
}

/** Wraps a stretch of a text in spans, a node of text or a thing that is no text at a time. */
function wrap(holder: Element, m: Mark, kind: string, made: HTMLElement[]) {
  const pieces: { node: Node; from: number; to: number }[] = [];
  let at = 0;
  const walk = (parent: Node) => {
    for (let child = parent.firstChild; child; child = child.nextSibling) {
      if (at >= m.to) return;
      if (child.nodeType === Node.TEXT_NODE) {
        const length = (child as Text).length;
        const from = Math.max(m.from - at, 0);
        const to = Math.min(m.to - at, length);
        if (to > from) pieces.push({ node: child, from, to });
        at += length;
      } else if (child instanceof Element) {
        if (child.classList.contains(OURS) && child.classList.contains('review-removed')) continue;
        if (child.matches(ATOMS)) {
          if (at >= m.from && at < m.to) pieces.push({ node: child, from: 0, to: 1 });
          at += 1;
        } else walk(child);
      }
    }
  };
  walk(holder);
  for (const { node, from, to } of pieces) {
    let target: Node = node;
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node as Text;
      if (to < text.length) text.splitText(to);
      target = from > 0 ? text.splitText(from) : text;
    }
    const s = span(m, kind);
    target.parentNode?.replaceChild(s, target);
    s.append(target);
    made.push(s);
  }
}

/** Puts in the marks of a text, and gives the spans that were made. */
export function markDrawn(
  root: HTMLElement,
  fragment: Y.XmlFragment | null,
  marks: Mark[],
  part: Mark['part'],
): HTMLElement[] {
  const made: HTMLElement[] = [];
  // The last first, so that what is put in does not move the places of those before.
  const mine = marks.filter((m) => m.part === part).sort((a, b) => b.from - a.from);
  for (const m of mine) {
    if (m.kind === 'object') {
      const whole = drawnWhole(root, fragment, m.path);
      if (whole instanceof HTMLElement) {
        whole.classList.add('review-object', OURS + '-class');
        if (m.current) whole.classList.add('current');
        whole.style.setProperty('--by', m.colour);
        made.push(whole);
      }
      continue;
    }
    if (m.kind === 'gone') {
      const el = document.createElement('div');
      el.className = `${OURS} review-removed block${m.current ? ' current' : ''}`;
      el.dataset.text = m.text ?? '';
      el.dataset.change = m.change;
      el.style.setProperty('--by', m.colour);
      const container =
        m.path.length > 1 ? drawnHolder(root, fragment, part, m.path.slice(0, -1)) : root;
      const before = drawnHolder(root, fragment, part, m.path);
      const block =
        before?.closest(
          'p, figure, div.equation, ul, ol, blockquote, div.row-of, div.verse, div.parallel',
        ) ?? before;
      if (block?.parentNode) block.parentNode.insertBefore(el, block);
      else (container ?? root).append(el);
      made.push(el);
      continue;
    }
    if (m.kind === 'note') {
      const note = drawnHolder(root, fragment, part, [...m.path, 'note', m.from]);
      if (note instanceof HTMLElement) {
        note.classList.add('review-note', OURS + '-class');
        if (m.current) note.classList.add('current');
        note.style.setProperty('--by', m.colour);
        made.push(note);
      }
      continue;
    }
    const holder = drawnHolder(root, fragment, part, m.path);
    if (!holder) continue;
    if (m.kind === 'removed') {
      const el = span(m, 'removed');
      el.dataset.text = m.text ?? '';
      const at = pointIn(holder, m.from);
      if (at.node.nodeType === Node.TEXT_NODE) {
        const text = at.node as Text;
        const rest = at.offset > 0 ? text.splitText(at.offset) : text;
        rest.parentNode?.insertBefore(el, rest);
      } else at.node.insertBefore(el, at.node.childNodes[at.offset] ?? null);
      made.push(el);
      continue;
    }
    wrap(holder, m, m.kind, made);
  }
  return made;
}

/** Takes the marks away, and joins again the text they had parted. */
export function unmarkDrawn(made: HTMLElement[]) {
  const parents = new Set<Node>();
  for (const el of made) {
    if (el.classList.contains(OURS + '-class')) {
      el.classList.remove('review-object', 'review-note', 'current', OURS + '-class');
      el.style.removeProperty('--by');
      continue;
    }
    const parent = el.parentNode;
    if (!parent) continue;
    parents.add(parent);
    if (el.classList.contains('review-removed')) el.remove();
    else el.replaceWith(...el.childNodes);
  }
  for (const parent of parents) parent.normalize();
}

export interface DrawnMarks {
  marks: Mark[];
  part: Mark['part'];
  /** The name or the text of the element, whose blocks the paths are of. */
  fragment: Y.XmlFragment | null;
  /** What was put into it: given anew, it is marked anew. */
  html: string;
}

let seen: IntersectionObserver | null = null;
const visible = new WeakMap<Element, () => void>();

function observer(): IntersectionObserver {
  seen ??= new IntersectionObserver((entries) => {
    for (const entry of entries) if (entry.isIntersecting) visible.get(entry.target)?.();
  });
  return seen;
}

/** For an element whose name or text is drawn without an editor. */
export function reviewDrawn(el: HTMLElement, given: DrawnMarks) {
  let now = given;
  let made: HTMLElement[] = [];
  /** What is marked: the marks and the text, as they were when it was. */
  let done: { marks: Mark[]; html: string } | null = null;
  let shown = false;
  let frame = 0;

  const apply = () => {
    if (!shown) return;
    if (
      done &&
      done.marks === now.marks &&
      done.html === now.html &&
      made.every((m) => m.isConnected)
    )
      return;
    unmarkDrawn(made);
    made = now.marks.length ? markDrawn(el, now.fragment, now.marks, now.part) : [];
    done = { marks: now.marks, html: now.html };
  };
  visible.set(el, () => {
    shown = true;
    apply();
  });
  // A text is watched for coming into view only once it has marks.
  let watched = false;
  const watch = () => {
    if (watched || !now.marks.length) return;
    watched = true;
    observer().observe(el);
  };
  watch();

  return {
    update(next: DrawnMarks) {
      now = next;
      // What was put in anew swept the spans away with the old text; it is
      // marked once it has been put in, which may be after this is told.
      if (done && next.html !== done.html) made = [];
      watch();
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(apply);
    },
    destroy() {
      cancelAnimationFrame(frame);
      unmarkDrawn(made);
      seen?.unobserve(el);
      visible.delete(el);
    },
  };
}
