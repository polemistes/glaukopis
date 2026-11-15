/**
 * Points to tick: a paragraph of the kind `todo`, with `done` said where it
 * is ticked. The box before it is the style sheet's (`app.css`), drawn
 * where a point has its dot; a press on it ticks or unticks the point, in
 * an editor that can be written in and nowhere else. A pseudo-element has
 * no node of its own, so the press is found by where it fell: left of the
 * paragraph's words, on its first line. Typing `[ ] ` at the start of a
 * paragraph of text or of a point makes a point to tick, `[x] ` one that
 * is ticked. Ctrl+Enter ticks from the keys (`commands.ts`, `toggleDone`).
 */

import { InputRule } from 'prosemirror-inputrules';
import { Plugin } from 'prosemirror-state';
import type { BasedKind } from '$lib/project/model/families';
import { toggleDoneAt } from './commands';

/** What prosemirror-inputrules puts for a leaf, such as a line mark, in the text it matches. */
const LEAF = '\uFFFC';

/**
 * `[ ] `, `[] ` or `[x] ` typed at the very start of a paragraph of text,
 * or of a point (after `- `, which made it one): the paragraph becomes a
 * point to tick, ticked where an x was typed, and the box is taken away.
 */
export function boxRule(): InputRule {
  return new InputRule(/^\uFFFC?\[([ xX]?)\]\s$/, (state, match, from, end) => {
    const start = match[0].startsWith(LEAF) ? from + 1 : from;
    const $start = state.doc.resolve(start);
    const paragraph = $start.parent;
    if (paragraph.type.name !== 'paragraph') return null;
    if (paragraph.attrs.kind !== 'text' && paragraph.attrs.kind !== 'item') return null;
    const marks = paragraph.firstChild?.type.name === 'linemark' ? 1 : 0;
    if ($start.parentOffset !== marks) return null;
    const done = match[1] === 'x' || match[1] === 'X' ? true : null;
    return state.tr
      .delete(start, end)
      .setNodeMarkup($start.before(), undefined, { ...paragraph.attrs, kind: 'todo', done });
  });
}

/** Where a paragraph stands on the screen, as much as finding its box needs. */
export interface BoxPlace {
  /** The left edge and the top of the paragraph. */
  left: number;
  top: number;
  /** Where its words begin, from its left edge: its padding, which its indent is. */
  padding: number;
  /** The size of its letters, and the height of its first line. */
  em: number;
  line: number;
}

/**
 * Whether a press at `x`, `y` fell on the box of a point to tick: in the
 * room before its words, where the style sheet draws the box (1.1em before
 * them), and on its first line.
 */
export function onTheBox(place: BoxPlace, x: number, y: number): boolean {
  const words = place.left + place.padding;
  return x >= words - 1.3 * place.em && x < words && y >= place.top && y < place.top + place.line;
}

/** Where a paragraph drawn by the editor stands, from its element. */
function placeOf(el: HTMLElement): BoxPlace {
  const rect = el.getBoundingClientRect();
  const style = getComputedStyle(el);
  const em = parseFloat(style.fontSize) || 16;
  const line = parseFloat(style.lineHeight);
  return {
    left: rect.left,
    top: rect.top,
    padding: parseFloat(style.paddingLeft) || 0,
    em,
    line: Number.isFinite(line) && line > 0 ? line : em * 1.6,
  };
}

/** A press on the box of a point to tick ticks or unticks it, in one step of undo. */
export function ticking(own: () => readonly BasedKind[] = () => []): Plugin {
  return new Plugin({
    props: {
      handleDOMEvents: {
        mousedown(view, event) {
          if (!view.editable || event.button !== 0) return false;
          if (event.shiftKey || event.ctrlKey || event.metaKey || event.altKey) return false;
          const target = event.target as HTMLElement | null;
          const el = target?.closest?.('p[data-kind]') as HTMLElement | null;
          if (!el || !view.dom.contains(el)) return false;
          if (!onTheBox(placeOf(el), event.clientX, event.clientY)) return false;
          let pos: number;
          try {
            pos = view.posAtDOM(el, 0) - 1;
          } catch {
            return false;
          }
          if (!toggleDoneAt(pos, own())(view.state, view.dispatch, view)) return false;
          event.preventDefault();
          return true;
        },
      },
    },
  });
}
