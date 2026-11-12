/**
 * What is copied of references and of a citation, read from what a
 * reference style wrote of them (`styleWritten`, where the core has Pandoc
 * write HTML): as words, and as HTML for the programs that take it, which
 * carries only what type can look like: italics, bold, small capitals,
 * raised and lowered letters. Nothing here looks at the clipboard.
 */

import type { Cited } from '$lib/api/documents';

/** What is copied, as words and as HTML. */
export interface Written {
  text: string;
  html: string;
}

/** The marks that are kept as they are. */
const KEPT = new Set(['I', 'EM', 'B', 'STRONG', 'SUP', 'SUB', 'U', 'S']);
/** What holds no words of the work: left out with all in it. */
const LEFT_OUT = new Set(['SCRIPT', 'STYLE', 'TEMPLATE', 'IFRAME', 'OBJECT']);
/** The blocks of an entry that stand beside each other: a number, and what it numbers. */
const BESIDE = /^csl-(left-margin|right-inline|block|indent)$/;

const squeezed = (text: string | null | undefined) => (text ?? '').replace(/\s+/g, ' ').trim();

/**
 * Carries what type can look like from one node into another. A note made
 * by the style is the citation itself where it stands `alone`; beside other
 * words it follows them in brackets, as the note of a text that is copied
 * does.
 */
function carry(from: Node, into: Element, alone: boolean) {
  const doc = into.ownerDocument;
  for (const child of Array.from(from.childNodes)) {
    if (child.nodeType === 3) {
      into.appendChild(doc.createTextNode(child.textContent ?? ''));
      continue;
    }
    if (child.nodeType !== 1) continue;
    const el = child as Element;
    if (LEFT_OUT.has(el.tagName)) continue;
    const classes = (el.getAttribute('class') ?? '').split(/\s+/);
    if (classes.includes('gk-note') && !alone) {
      into.appendChild(doc.createTextNode(' ['));
      carry(el, into, alone);
      into.appendChild(doc.createTextNode(']'));
    } else if (KEPT.has(el.tagName)) {
      const kept = doc.createElement(el.tagName.toLowerCase());
      carry(el, kept, alone);
      if (kept.childNodes.length) into.appendChild(kept);
    } else if (classes.includes('smallcaps')) {
      const small = doc.createElement('span');
      small.setAttribute('style', 'font-variant: small-caps');
      carry(el, small, alone);
      if (small.childNodes.length) into.appendChild(small);
    } else {
      // Two blocks beside each other are words apart.
      if (classes.some((c) => BESIDE.test(c))) into.appendChild(doc.createTextNode(' '));
      carry(el, into, alone);
    }
  }
}

/** What a part of what the style wrote reads as, in a holder of its own. */
function read(from: Element, alone: boolean): Written {
  const holder = document.createElement('span');
  carry(from, holder, alone);
  return { text: squeezed(holder.textContent), html: squeezed(holder.innerHTML) };
}

const parsed = (html: string) => new DOMParser().parseFromString(html, 'text/html');

/** A citation the style wrote, from the block it stands in. */
function citationIn(block: Element): Written {
  const line = block.querySelector('p') ?? block;
  const notes = line.querySelectorAll('.gk-note');
  const alone = notes.length === 1 && squeezed(notes[0].textContent) === squeezed(line.textContent);
  return read(line, alone);
}

/**
 * The works as the style writes them: the entries of its bibliography, each
 * a paragraph, in the style's order; in a style that has no bibliography,
 * each as it is cited the first time. Nothing where the style wrote nothing.
 */
export function entriesWritten(html: string): Written | null {
  const doc = parsed(html);
  let entries = Array.from(doc.querySelectorAll('#refs .csl-entry')).map((e) => read(e, true));
  if (!entries.length)
    entries = Array.from(doc.querySelectorAll('[id^="gk-sample-"]')).map(citationIn);
  entries = entries.filter((e) => e.text);
  if (!entries.length) return null;
  return {
    text: entries.map((e) => e.text).join('\n'),
    html: entries.map((e) => `<p>${e.html}</p>`).join(''),
  };
}

/**
 * A citation as the style writes it. Its HTML says which citation it is, as
 * the HTML of a text that is copied does, so that pasted into a text here it
 * is the citation again, and elsewhere the words.
 */
export function citationWritten(html: string, said: Cited): Written | null {
  const block = parsed(html).querySelector('#gk-sample-1');
  const written = block ? citationIn(block) : null;
  if (!written?.text) return null;
  const span = document.createElement('span');
  span.className = 'citation';
  span.setAttribute('data-citation', JSON.stringify(said.items));
  span.setAttribute('data-mode', said.mode);
  span.innerHTML = written.html;
  return { text: written.text, html: span.outerHTML };
}
