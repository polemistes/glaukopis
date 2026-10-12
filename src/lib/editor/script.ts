/**
 * The keys in a paragraph of a kind (ADR 0040). Enter at the end of a
 * paragraph makes the kind that follows it, as the catalogue says
 * (`project/model/families.ts`): a character to dialogue, dialogue to
 * action, a headword to its gloss, an epigraph to its attribution, a line
 * of verse to a line; a text paragraph so made is lifted out of the passage
 * by the step that keeps the shape (`passages.ts`). Enter on an empty last
 * paragraph of a passage makes it text, and so leaves the passage. Tab in a
 * line or an item indents it, Shift+Tab the other way; in a script or a
 * glossary Tab goes to the other kind that commonly follows, as the
 * programs of screenwriters have it. Backspace at the start of an empty
 * paragraph of a kind makes it text, as at the start of the first
 * paragraph of a passage. A kind of the writer's own does as the kind it
 * is based on.
 */

import type { Node } from 'prosemirror-model';
import { TextSelection, type Command, type EditorState } from 'prosemirror-state';
import { familyOf, nextOf, renamed, tabOf, type BasedKind } from '$lib/project/model/families';
import { blank } from './stanzas';
import { indentParagraph, paragraphAt, setKind, type ParagraphAt } from './commands';

/** The kind of the paragraph the cursor is in, with the paragraph; nothing where it is in none. */
function kindAt(state: EditorState): (ParagraphAt & { kind: string }) | null {
  const at = paragraphAt(state);
  return at ? { ...at, kind: renamed((at.node.attrs.kind as string) || 'text') } : null;
}

/** Whether the paragraph at a depth is the last of a passage, or stands in none. */
function lastOfPassage(state: EditorState, at: ParagraphAt): boolean {
  const { $from } = state.selection;
  const parent = $from.node(at.depth - 1);
  if (parent.type.name !== 'passage') return true;
  return $from.index(at.depth - 1) === parent.childCount - 1;
}

/** The paragraph before the one at a depth, within its passage; nothing for the first, or one that stands in none. */
function lineBefore(state: EditorState, at: ParagraphAt): { node: Node; pos: number } | null {
  const { $from } = state.selection;
  const parent = $from.node(at.depth - 1);
  const index = $from.index(at.depth - 1);
  if (parent.type.name !== 'passage' || index === 0) return null;
  const node = parent.child(index - 1);
  return { node, pos: at.pos - node.nodeSize };
}

/** Whether the paragraph at a depth is the first of a passage, or stands in none. */
function firstOfPassage(state: EditorState, at: ParagraphAt): boolean {
  const { $from } = state.selection;
  const parent = $from.node(at.depth - 1);
  if (parent.type.name !== 'passage') return true;
  return $from.index(at.depth - 1) === 0;
}

/**
 * Enter in a paragraph of a kind: at its end, a new paragraph of the kind
 * that follows; within it, the paragraph split, the part after of the same
 * kind, without the number, the margin words or the uncounted state that
 * were given to the whole; on an empty last paragraph of a passage, the
 * paragraph made text. In a text paragraph nothing: the base keys split it.
 */
export function enterKind(own: () => readonly BasedKind[] = () => []): Command {
  return (state, dispatch) => {
    const at = kindAt(state);
    if (!at || at.kind === 'text') return false;
    const { $from, $to, empty } = state.selection;
    if (!$from.sameParent($to) || $from.parent !== at.node) return false;
    const kinds = own();
    if (empty && at.node.content.size === 0 && lastOfPassage(state, at)) {
      // In verse an empty line is the break between two stanzas: Enter on the
      // empty last line begins the next stanza, and Enter again, on the empty
      // line after that break, leaves the verse.
      const before = lineBefore(state, at);
      if (familyOf(at.kind, kinds) !== 'verse' || !before)
        return setKind('text', kinds)(state, dispatch);
      if (blank(before.node)) {
        if (dispatch) {
          const tr = state.tr.delete(before.pos, before.pos + before.node.nodeSize);
          const pos = tr.mapping.map(at.pos);
          tr.setNodeMarkup(pos, undefined, { ...at.node.attrs, kind: 'text', indent: 0 });
          dispatch(tr.scrollIntoView());
        }
        return true;
      }
    }
    const atEnd = $to.parentOffset === at.node.content.size;
    if (dispatch) {
      const tr = state.tr;
      if (!empty) tr.deleteSelection();
      const next = atEnd ? nextOf(at.kind, kinds) : at.kind;
      // An indent goes on to a paragraph of the same kind, as the items of a list have it.
      const indent = next === at.kind && tabOf(next, kinds) === 'indent' ? at.node.attrs.indent : 0;
      const attrs = {
        ...at.node.attrs,
        kind: next,
        indent,
        number: null,
        counted: true,
        hidden: null,
        margin: null,
      };
      tr.split(tr.selection.from, 1, [{ type: at.node.type, attrs }]);
      dispatch(tr.scrollIntoView());
    }
    return true;
  };
}

/**
 * Tab in a paragraph of a kind: a line or an item is indented a step; in a
 * script or a glossary, an empty paragraph becomes the other kind, and one
 * with text in it is followed by a new paragraph of it. Nothing for a kind
 * Tab means nothing to.
 */
export function tabKind(own: () => readonly BasedKind[] = () => []): Command {
  return (state, dispatch) => {
    const at = kindAt(state);
    if (!at || state.selection.$from.parent !== at.node) return false;
    const kinds = own();
    const tab = tabOf(at.kind, kinds);
    if (!tab) return false;
    if (tab === 'indent') return indentParagraph(1, kinds)(state, dispatch);
    if (dispatch) {
      const attrs = {
        ...at.node.attrs,
        kind: tab,
        indent: 0,
        number: null,
        counted: true,
        hidden: null,
        margin: null,
      };
      if (at.node.content.size === 0) {
        dispatch(state.tr.setNodeMarkup(at.pos, undefined, attrs).scrollIntoView());
      } else {
        const after = at.pos + at.node.nodeSize;
        const tr = state.tr.insert(after, at.node.type.create(attrs));
        tr.setSelection(TextSelection.near(tr.doc.resolve(after + 1)));
        dispatch(tr.scrollIntoView());
      }
    }
    return true;
  };
}

/** Shift+Tab in a line or an item: a step back. */
export function untabKind(own: () => readonly BasedKind[] = () => []): Command {
  return (state, dispatch) => {
    const at = kindAt(state);
    if (!at || state.selection.$from.parent !== at.node) return false;
    const kinds = own();
    if (tabOf(at.kind, kinds) !== 'indent') return false;
    return indentParagraph(-1, kinds)(state, dispatch);
  };
}

/**
 * Backspace at the start of a paragraph of a kind: an empty one is made
 * text, wherever it stands; one with text in it is made text when it is the
 * first of its passage, since there is nothing of the passage before it to
 * join. Elsewhere the base keys join it to the paragraph before.
 */
export function backOutOfKind(own: () => readonly BasedKind[] = () => []): Command {
  return (state, dispatch) => {
    const at = kindAt(state);
    if (!at || at.kind === 'text' || !state.selection.empty) return false;
    const { $from } = state.selection;
    if ($from.parent !== at.node || $from.parentOffset !== 0) return false;
    if (at.node.content.size !== 0 && !firstOfPassage(state, at)) return false;
    // An empty line between two stanzas goes, as any empty line: the stanzas are one again.
    if (at.node.content.size === 0 && familyOf(at.kind, own()) === 'verse' && lineBefore(state, at))
      return false;
    return setKind('text', own())(state, dispatch);
  };
}
