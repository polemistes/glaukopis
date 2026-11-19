/**
 * Setting the look by hand in a box of rich text (ADR 0113): the font, the
 * size and the colour of words, and how the paragraphs stand; what is set
 * of what is selected, for the tools to show; and taking it all away.
 *
 * Each acts on what is selected. With nothing selected, a font, a size or a
 * colour is set for what is written next, as bold is; how a paragraph
 * stands is set of the paragraph the cursor is in.
 */

import type { Node } from 'prosemirror-model';
import type { Command, EditorState } from 'prosemirror-state';
import { boxAt } from './box';
import { handMarkAttrs, handOf, HAND_MARKS, type HandLook, type HandMark } from './hand';

/** What a mark set by hand holds, by its one attribute. */
const HELD: Record<HandMark, string> = { font: 'family', size: 'pt', colour: 'value' };

/**
 * Sets a font, a size or a colour of what is selected, or of what is
 * written next where nothing is; with nothing given, takes it away, so that
 * the words are as the document sets them. Only in a box.
 */
export function setHandMark(name: HandMark, value: unknown): Command {
  return (state, dispatch) => {
    const type = state.schema.marks[name];
    if (!type || !boxAt(state)) return false;
    const attrs = value == null || value === '' ? null : handMarkAttrs(name, value);
    if (value != null && value !== '' && !attrs) return false;
    if (dispatch) {
      const { from, to, empty } = state.selection;
      const tr = state.tr;
      if (empty) {
        if (attrs) tr.addStoredMark(type.create(attrs));
        else tr.removeStoredMark(type);
      } else if (attrs) tr.addMark(from, to, type.create(attrs));
      else tr.removeMark(from, to, type);
      dispatch(tr.scrollIntoView());
    }
    return true;
  };
}

/**
 * What is set by hand of the words selected: the font, the size or the
 * colour all of them have; `null` where none has any; `undefined` where
 * they differ. With nothing selected, what is written next would have.
 */
export function handMarkAt(state: EditorState, name: HandMark): string | number | null | undefined {
  const type = state.schema.marks[name];
  if (!type) return null;
  const held = (marks: readonly { type: unknown; attrs: Record<string, unknown> }[]) => {
    const mark = marks.find((m) => m.type === type);
    return mark ? (mark.attrs[HELD[name]] as string | number) : null;
  };
  const { from, to, empty, $from } = state.selection;
  if (empty) return held(state.storedMarks ?? $from.marks());
  let found: string | number | null | undefined;
  let any = false;
  state.doc.nodesBetween(from, to, (node) => {
    if (!node.isText) return true;
    const value = held(node.marks);
    if (!any) found = value;
    else if (found !== value) found = undefined;
    any = true;
    return false;
  });
  return any ? found : null;
}

/** The paragraphs of a box that the selection touches, with where each stands. */
function paragraphsAt(state: EditorState): { node: Node; pos: number }[] {
  const at = boxAt(state);
  if (!at) return [];
  const { from, to } = state.selection;
  const out: { node: Node; pos: number }[] = [];
  const end = at.pos + at.box.nodeSize;
  state.doc.nodesBetween(Math.max(from, at.pos), Math.min(to, end), (node, pos) => {
    if (node.type.name !== 'paragraph') return true;
    // Of the box itself: not of a cell of a table in it, nor of what is said of a figure.
    if (state.doc.resolve(pos).parent === at.box) out.push({ node, pos });
    return false;
  });
  return out;
}

/**
 * Says how the paragraphs selected stand, laid over what each has by hand
 * already: `{ align: 'center' }` centres them and leaves their spacing as
 * it was. A measure given as `null` is taken away, and is the layout's
 * again. Only in a box.
 */
export function setHand(said: { [K in keyof HandLook]?: HandLook[K] | null }): Command {
  return (state, dispatch) => {
    const paragraphs = paragraphsAt(state);
    if (!paragraphs.length) return false;
    if (dispatch) {
      const tr = state.tr;
      for (const { node, pos } of paragraphs) {
        const now: Record<string, unknown> = { ...(handOf(node.attrs.hand) ?? {}) };
        for (const [key, value] of Object.entries(said)) {
          if (value == null) delete now[key];
          else now[key] = value;
        }
        tr.setNodeAttribute(pos, 'hand', handOf(now));
      }
      dispatch(tr.scrollIntoView());
    }
    return true;
  };
}

/**
 * How the paragraphs selected stand by hand: each measure that all of them
 * say alike. A measure they say differently, or that none says, is not
 * there; `mixed` names those they say differently.
 */
export function handAt(state: EditorState): { look: HandLook; mixed: (keyof HandLook)[] } {
  const paragraphs = paragraphsAt(state).map((p) => handOf(p.node.attrs.hand) ?? {});
  const look: Record<string, unknown> = {};
  const mixed: (keyof HandLook)[] = [];
  const keys = new Set(paragraphs.flatMap((p) => Object.keys(p))) as Set<keyof HandLook>;
  for (const key of keys) {
    const first = paragraphs[0][key];
    if (paragraphs.every((p) => p[key] === first)) look[key] = first;
    else mixed.push(key);
  }
  return { look: look as HandLook, mixed };
}

/**
 * Takes away everything set by hand of what is selected: the fonts, sizes
 * and colours of its words, and how its paragraphs stand. With nothing
 * selected, of the paragraph the cursor is in. The marks there are in every
 * text, bold and italic and the rest, are left.
 */
export const clearHand: Command = (state, dispatch) => {
  const at = boxAt(state);
  if (!at) return false;
  if (dispatch) {
    const { empty, $from } = state.selection;
    const from = empty ? $from.start() : state.selection.from;
    const to = empty ? $from.end() : state.selection.to;
    const tr = state.tr;
    for (const name of HAND_MARKS) {
      const type = state.schema.marks[name];
      if (!type) continue;
      tr.removeMark(from, to, type);
      tr.removeStoredMark(type);
    }
    for (const { node, pos } of paragraphsAt(state))
      if (node.attrs.hand != null) tr.setNodeAttribute(pos, 'hand', null);
    dispatch(tr.scrollIntoView());
  }
  return true;
};
