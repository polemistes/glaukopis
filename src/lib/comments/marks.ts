/**
 * Comments in an editor: the passage a thread is on, as two positions in
 * the shared text that follow it through every change (Yjs's relative
 * positions, taken through y-prosemirror), and the marks an editor draws
 * over the passages: `span.comment-mark`, with `data-thread`, and `.settled`
 * where the thread is. The text itself is untouched: the marks are
 * decorations, which no document is made from.
 */

import { Plugin, PluginKey, type EditorState } from 'prosemirror-state';
import { Decoration, DecorationSet, type EditorView } from 'prosemirror-view';
import {
  absolutePositionToRelativePosition,
  relativePositionToAbsolutePosition,
  ySyncPluginKey,
} from 'y-prosemirror';
import * as Y from 'yjs';
import type { Thread } from '$lib/project/model/types';

/** What is shown of a passage: enough to know it by. */
const MOST_WORDS = 120;

/** The passage that is selected in an editor, to comment on; nothing where nothing is selected. */
export function selectedPassage(view: EditorView): Thread['passage'] {
  const sync = ySyncPluginKey.getState(view.state);
  const { from, to, empty } = view.state.selection;
  if (!sync || empty) return null;
  const text = view.state.doc.textBetween(from, to, ' ', ' ').replace(/\s+/g, ' ').trim();
  if (!text) return null;
  const rel = (pos: number) =>
    Y.encodeRelativePosition(
      absolutePositionToRelativePosition(pos, sync.type, sync.binding.mapping),
    );
  return {
    from: rel(from),
    to: rel(to),
    text: text.length > MOST_WORDS ? `${text.slice(0, MOST_WORDS).trimEnd()}…` : text,
  };
}

/** Where a passage stands in an editor now; nothing where it is gone. */
export function passageIn(state: EditorState, passage: NonNullable<Thread['passage']>) {
  const sync = ySyncPluginKey.getState(state);
  if (!sync) return null;
  const abs = (encoded: Uint8Array) => {
    try {
      return relativePositionToAbsolutePosition(
        sync.doc,
        sync.type,
        Y.decodeRelativePosition(encoded),
        sync.binding.mapping,
      );
    } catch {
      return null;
    }
  };
  const from = abs(passage.from);
  const to = abs(passage.to);
  if (from === null || to === null || to <= from) return null;
  return { from, to };
}

/**
 * Whether a passage is gone from the text, read from the shared document
 * alone, for where no editor is open on it: an end that cannot be found,
 * an end in a paragraph that was deleted, or two ends in one paragraph
 * that have come together, as they do when everything between them was
 * deleted (or cut, to be pasted elsewhere as new text). Where the ends are
 * in two paragraphs that are both still there the passage stands, in part
 * at least, as it does in an editor.
 */
export function passageGone(doc: Y.Doc, passage: NonNullable<Thread['passage']>): boolean {
  const at = (encoded: Uint8Array) => {
    try {
      return Y.createAbsolutePositionFromRelativePosition(Y.decodeRelativePosition(encoded), doc);
    } catch {
      return null;
    }
  };
  const from = at(passage.from);
  const to = at(passage.to);
  if (!from || !to) return true;
  const deleted = (type: Y.AbstractType<unknown>) => {
    for (
      let item = type._item;
      item;
      item = item.parent instanceof Y.AbstractType ? item.parent._item : null
    )
      if (item.deleted) return true;
    return false;
  };
  if (deleted(from.type) || deleted(to.type)) return true;
  return from.type === to.type && to.index <= from.index;
}

interface Marked {
  threads: readonly Thread[];
  set: DecorationSet;
}

const key = new PluginKey<Marked>('comment-marks');

function decorate(state: EditorState, threads: readonly Thread[]): DecorationSet {
  const list: Decoration[] = [];
  for (const thread of threads) {
    if (!thread.passage) continue;
    const at = passageIn(state, thread.passage);
    if (!at) continue;
    list.push(
      Decoration.inline(at.from, at.to, {
        class: thread.resolved ? 'comment-mark settled' : 'comment-mark',
        'data-thread': thread.id,
      }),
    );
  }
  return DecorationSet.create(state.doc, list);
}

/** The plugin that draws the comments an editor is given. */
export function commentMarks(): Plugin<Marked> {
  return new Plugin<Marked>({
    key,
    state: {
      init: () => ({ threads: [], set: DecorationSet.empty }),
      apply: (tr, value, _before, state) => {
        const threads = tr.getMeta(key) as readonly Thread[] | undefined;
        if (threads) return { threads, set: decorate(state, threads) };
        if (!tr.docChanged || !value.threads.length) return value;
        // The positions are in the shared text, and are read anew from it.
        return { threads: value.threads, set: decorate(state, value.threads) };
      },
    },
    props: { decorations: (state) => key.getState(state)?.set },
  });
}

/** The threads an editor was last given. */
const given = new WeakMap<EditorView, readonly Thread[]>();

const sameBytes = (a: Uint8Array, b: Uint8Array) =>
  a === b || (a.length === b.length && a.every((byte, i) => byte === b[i]));

/**
 * Whether two lists of threads draw the same marks: the same threads, each
 * on the same passage, settled or not. A thread is made anew for every note
 * written or changed in it, which changes nothing that is drawn.
 */
export function sameMarks(a: readonly Thread[], b: readonly Thread[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  return a.every((thread, i) => {
    const other = b[i];
    if (thread.id !== other.id || thread.resolved !== other.resolved) return false;
    if (!thread.passage || !other.passage) return thread.passage === other.passage;
    return (
      sameBytes(thread.passage.from, other.passage.from) &&
      sameBytes(thread.passage.to, other.passage.to)
    );
  });
}

/**
 * Gives an editor the threads on its element, in place of those it had;
 * none, to take them away. The marks are drawn again only where what they
 * show has changed.
 */
export function markComments(view: EditorView, threads: readonly Thread[]) {
  if (view.isDestroyed || !key.getState(view.state)) return;
  const had = given.get(view);
  given.set(view, threads);
  if (sameMarks(had ?? [], threads)) return;
  view.dispatch(view.state.tr.setMeta(key, threads).setMeta('addToHistory', false));
}

/** The thread whose mark was pressed, if one was. */
export function pressedThread(target: EventTarget | null): string | null {
  const mark = target instanceof Element ? target.closest<HTMLElement>('.comment-mark') : null;
  return mark?.dataset.thread ?? null;
}
