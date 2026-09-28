/**
 * Mathematics as it is shown where it is written.
 *
 * What is written in the notation of TeX is read by Pandoc, which also reads
 * it when a document is made, and comes back as MathML, which the window
 * shows by itself. Formulas are asked for together, a moment after they were
 * first wanted, and what came of each is kept.
 */

import { SvelteMap } from 'svelte/reactivity';
import font from '@fontsource/stix-two-math/files/stix-two-math-latin-400-normal.woff2?url';
import { mathRender, type Formula } from '$lib/api/pictures';

export interface Shown {
  /** The formula as MathML that may be put into the page as it is. */
  mathml: string | null;
  /** What kept the formula from being read. */
  problem: string | null;
}

const ELEMENTS = new Set([
  'math',
  'semantics',
  'mrow',
  'mi',
  'mn',
  'mo',
  'mtext',
  'mspace',
  'ms',
  'msup',
  'msub',
  'msubsup',
  'mfrac',
  'msqrt',
  'mroot',
  'munder',
  'mover',
  'munderover',
  'mmultiscripts',
  'mprescripts',
  'none',
  'mtable',
  'mtr',
  'mtd',
  'mstyle',
  'mpadded',
  'mphantom',
  'menclose',
  'merror',
]);

const ATTRIBUTES = new Set([
  'display',
  'mathvariant',
  'mathsize',
  'displaystyle',
  'scriptlevel',
  'stretchy',
  'fence',
  'separator',
  'accent',
  'accentunder',
  'largeop',
  'movablelimits',
  'symmetric',
  'minsize',
  'maxsize',
  'lspace',
  'rspace',
  'form',
  'width',
  'height',
  'depth',
  'voffset',
  'linethickness',
  'columnalign',
  'rowalign',
  'columnspacing',
  'rowspacing',
  'columnspan',
  'rowspan',
  'notation',
  'open',
  'close',
]);

const MATHML = 'http://www.w3.org/1998/Math/MathML';

function clean(from: Element, into: Element) {
  for (const child of Array.from(from.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      into.append(document.createTextNode(child.textContent ?? ''));
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const el = child as Element;
      const name = el.localName.toLowerCase();
      // What the formula was written as is known already.
      if (name === 'annotation' || name === 'annotation-xml') continue;
      if (!ELEMENTS.has(name)) continue;
      const copy = document.createElementNS(MATHML, name);
      for (const a of Array.from(el.attributes)) {
        const attribute = a.name.toLowerCase();
        if (ATTRIBUTES.has(attribute) && a.value.length < 80) copy.setAttribute(attribute, a.value);
      }
      clean(el, copy);
      into.append(copy);
    }
  }
}

/**
 * MathML with nothing in it but mathematics: the elements and attributes
 * that set formulas, and text. Whatever else there may be is left out, so
 * that what another has written cannot do anything in the window of this one.
 */
export function sanitise(mathml: string): string | null {
  if (typeof DOMParser === 'undefined') return null;
  const parsed = new DOMParser().parseFromString(mathml, 'text/html');
  const math = parsed.querySelector('math');
  if (!math) return null;
  const holder = document.createElement('div');
  const root = document.createElementNS(MATHML, 'math');
  if (math.getAttribute('display') === 'block') root.setAttribute('display', 'block');
  clean(math, root);
  holder.append(root);
  return holder.innerHTML;
}

const keyOf = (tex: string, display: boolean) => `${display ? 'd' : 'i'}:${tex}`;

let fontAsked = false;

/** The font of the formulas comes with the application: not every computer has one. */
function withFont() {
  if (fontAsked || typeof FontFace === 'undefined' || typeof document === 'undefined') return;
  fontAsked = true;
  try {
    const face = new FontFace('STIX Two Math', `url(${font}) format('woff2')`);
    document.fonts.add(face);
    void face.load().catch(() => {});
  } catch {
    // The window shows formulas in the font it finds.
  }
}

class Mathematics {
  readonly #shown = new SvelteMap<string, Shown>();
  #wanted = new Map<string, Formula>();
  #timer: ReturnType<typeof setTimeout> | undefined;

  /**
   * What is shown for a formula, or nothing while it is not known yet. Read
   * where it is shown: what reads it is told when the formula has come.
   */
  of(tex: string, display: boolean): Shown | undefined {
    const formula = tex.trim();
    if (!formula) return { mathml: null, problem: null };
    const key = keyOf(formula, display);
    const known = this.#shown.get(key);
    if (known) return known;
    if (!this.#wanted.has(key)) {
      this.#wanted.set(key, { tex: formula, display });
      this.#timer ??= setTimeout(() => void this.#ask(), 30);
    }
    return undefined;
  }

  async #ask() {
    this.#timer = undefined;
    const wanted = [...this.#wanted.entries()];
    this.#wanted = new Map();
    if (!wanted.length) return;
    withFont();
    try {
      const rendered = await mathRender(wanted.map(([, f]) => f));
      wanted.forEach(([key], i) => {
        const r = rendered[i];
        const mathml = r?.mathml ? sanitise(r.mathml) : null;
        this.#shown.set(key, {
          mathml,
          problem: mathml ? null : (r?.problem ?? 'The formula could not be read.'),
        });
      });
    } catch {
      // Without Pandoc the formula is shown as it was written, and nothing is said of it.
      for (const [key] of wanted) this.#shown.set(key, { mathml: null, problem: null });
    }
  }
}

export const mathematics = new Mathematics();

/** Shows a formula in an element, and again when what it is shown as has come. */
export function showFormula(el: HTMLElement, tex: string, display: boolean) {
  const shown = mathematics.of(tex, display);
  el.classList.toggle('waiting', !shown);
  el.classList.toggle('unread', !!shown && !shown.mathml && !!tex.trim());
  el.classList.toggle('blank', !tex.trim());
  if (shown?.problem) el.title = shown.problem;
  else el.removeAttribute('title');
  if (shown?.mathml) {
    // Made by `sanitise`: mathematics and nothing else.
    el.innerHTML = shown.mathml;
  } else {
    el.textContent = tex.trim() || (display ? 'An equation' : 'formula');
  }
}
