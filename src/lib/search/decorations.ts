/**
 * What a search found, marked in an editor by decorations, which the editor
 * draws into its text: `span.search-mark`, `span.search-mark.current` for
 * the one that is shown, and `span.search-scope` for the text a search is
 * kept to. Used where the highlights of the page are not
 * drawn where they should be: the web view draws them only in the text
 * that flows in the page, and not in a box that stands over it, as the
 * panel of a note or the edit box of an element.
 */

import { Plugin, PluginKey, type EditorState } from 'prosemirror-state';
import { Decoration, DecorationSet, type EditorView } from 'prosemirror-view';

export interface Marked {
  from: number;
  to: number;
  /** The one that is shown. */
  current?: boolean;
  /** The text a search is kept to. */
  scope?: boolean;
}

const key = new PluginKey<DecorationSet>('search-marks');

function decorate(state: EditorState, marks: Marked[]): DecorationSet {
  const size = state.doc.content.size;
  const list: Decoration[] = [];
  for (const m of marks) {
    const from = Math.max(0, Math.min(m.from, size));
    const to = Math.max(from, Math.min(m.to, size));
    const kind = m.scope ? 'search-scope' : m.current ? 'search-mark current' : 'search-mark';
    if (to > from) list.push(Decoration.inline(from, to, { class: kind }));
  }
  return DecorationSet.create(state.doc, list);
}

/** The plugin that draws the marks an editor is given. */
export function searchMarks(): Plugin<DecorationSet> {
  return new Plugin<DecorationSet>({
    key,
    state: {
      init: () => DecorationSet.empty,
      apply: (tr, set, _before, state) => {
        const marks = tr.getMeta(key) as Marked[] | undefined;
        if (marks) return marks.length ? decorate(state, marks) : DecorationSet.empty;
        return tr.docChanged ? set.map(tr.mapping, tr.doc) : set;
      },
    },
    props: { decorations: (state) => key.getState(state) },
  });
}

/** Gives an editor the marks it draws, in place of those it had; none, to take them away. */
export function markIn(view: EditorView, marks: Marked[]) {
  if (view.isDestroyed || !key.getState(view.state)) return;
  const had = key.getState(view.state);
  if (!marks.length && had === DecorationSet.empty) return;
  view.dispatch(view.state.tr.setMeta(key, marks).setMeta('addToHistory', false));
}

/** Whether an editor can be given marks. */
export function marksIn(view: EditorView): boolean {
  return !!key.getState(view.state);
}
