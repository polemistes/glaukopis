/**
 * The ground of words (ADR 0116): the colour behind them, a highlight. It
 * is set of the words selected, in any text, from the Marks menu of the
 * bar and from a tool in the head of a sheet of rich text. In a text it is
 * for the eye on the screen and goes into no document, as the highlight
 * there was before it, a kind of words of one colour; on a sheet of rich
 * text it is the look of the words, and every kind of document sets it.
 *
 * The mark is new to the form of the texts (`form.ts`): in a project that
 * is shared, the first is asked about, as the first sheet of rich text is.
 */

import type { Command, EditorState } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import { colourOf, GROUND, handMarkAttrs } from '$lib/byhand/hand';
import { asked } from '$lib/byhand/put';
import { t } from '$lib/i18n';
import { testHook } from '$lib/shell/testing';
import type { MenuItem } from '$lib/ui/menu.svelte';
import { formOfMark } from './form';
import { MARKER } from './schema';

/** The colours offered, those of marker pens, by their plain names. */
export const GROUNDS: readonly (readonly [string, string])[] = [
  ['yellow', MARKER],
  ['green', '#b7eb8f'],
  ['blue', '#a5d8ff'],
  ['pink', '#fcc2d7'],
  ['orange', '#ffc078'],
  ['purple', '#d0bfff'],
  ['grey', '#dee2e6'],
];

/** The highlight there was before: a kind of words, of one colour, which this takes the place of. */
const OLD_KIND = 'highlight';
const isOld = (mark: { type: { name: string }; attrs: Record<string, unknown> }) =>
  mark.type.name === 'kind' && mark.attrs.name === OLD_KIND;

/**
 * Sets the ground of what is selected, or of what is written next where
 * nothing is; with nothing given, takes it away. Words that had the
 * highlight there was before are no longer of that kind: the ground stands
 * in its place, or nothing.
 */
export function setGround(value: unknown): Command {
  return (state, dispatch) => {
    const type = state.schema.marks[GROUND];
    if (!type) return false;
    const none = value == null || value === '';
    const attrs = none ? null : handMarkAttrs(GROUND, value);
    if (!none && !attrs) return false;
    if (dispatch) {
      const { from, to, empty } = state.selection;
      const tr = state.tr;
      if (empty) {
        if (attrs) tr.addStoredMark(type.create(attrs));
        else tr.removeStoredMark(type);
      } else {
        state.doc.nodesBetween(from, to, (node, pos) => {
          if (!node.isText) return true;
          const old = node.marks.find(isOld);
          if (old) tr.removeMark(Math.max(pos, from), Math.min(pos + node.nodeSize, to), old);
          return false;
        });
        if (attrs) tr.addMark(from, to, type.create(attrs));
        else tr.removeMark(from, to, type);
      }
      dispatch(tr.scrollIntoView());
    }
    return true;
  };
}

/**
 * The ground of the words selected: the colour all of them have; `null`
 * where none has any; `undefined` where they differ. With nothing
 * selected, what is written next would have. The highlight there was
 * before counts as the yellow.
 */
export function groundAt(state: EditorState): string | null | undefined {
  const held = (marks: readonly { type: { name: string }; attrs: Record<string, unknown> }[]) => {
    const mark = marks.find((m) => m.type.name === GROUND);
    if (mark) return colourOf(mark.attrs.value) ?? MARKER;
    return marks.some(isOld) ? MARKER : null;
  };
  const { from, to, empty, $from } = state.selection;
  if (empty) return held(state.storedMarks ?? $from.marks());
  let found: string | null | undefined;
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

/**
 * Sets the ground from the tools, asking first in a shared project that
 * has had nothing an earlier version does not know: those with such a
 * version are kept out of it from then on, until they have updated.
 */
export async function putGround(view: EditorView, value: string | null): Promise<void> {
  if (view.isDestroyed) return;
  if (value) {
    const yes = await asked(view, formOfMark(GROUND), {
      title: t('editor-highlight-shared-title'),
      message: t('editor-highlight-shared'),
      confirm: t('editor-highlight'),
    });
    if (!yes || view.isDestroyed) return;
  }
  setGround(value)(view.state, view.dispatch, view);
  view.focus();
}

/** Opens the system's own chooser of colours, and gives what was chosen. */
function anyColour(from: string, chosen: (value: string) => void) {
  const field = document.createElement('input');
  field.type = 'color';
  field.value = from;
  field.tabIndex = -1;
  field.setAttribute('aria-hidden', 'true');
  field.style.cssText = 'position: fixed; width: 0; height: 0; opacity: 0; pointer-events: none;';
  field.addEventListener('change', () => {
    chosen(field.value);
    field.remove();
  });
  // Where the chooser is closed with nothing chosen, the field is taken away the next time one is asked for.
  document.querySelectorAll('input[data-any-ground]').forEach((old) => old.remove());
  field.dataset.anyGround = '';
  document.body.append(field);
  field.click();
}

/** The menu of grounds for the words selected in a text: none, those of marker pens, and any other. */
export function groundItems(view: EditorView): MenuItem[] {
  const now = groundAt(view.state);
  const put = (value: string | null) => void putGround(view, value);
  return [
    { label: t('editor-highlight-none'), checked: now === null, action: () => put(null) },
    { kind: 'separator' },
    ...GROUNDS.map(([name, value]): MenuItem => ({
      label: t(`editor-highlight-${name}`),
      colour: value,
      checked: now === value,
      action: () => put(value),
    })),
    { kind: 'separator' },
    {
      label: t('editor-highlight-other'),
      action: () => anyColour(typeof now === 'string' ? now : MARKER, put),
    },
  ];
}

// For the scripts of the running application, which cannot press the system's chooser of colours: any colour, as if chosen there, in the text that was written in last.
let last: EditorView | null = null;
/** Says which text the scripts' own way in acts on: the one whose menu of grounds was opened last. */
export function groundsOpenedIn(view: EditorView) {
  last = view;
}
testHook('__glaukopisGround', (value: string | null) => {
  if (last && !last.isDestroyed) void putGround(last, value);
});
