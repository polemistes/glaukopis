/**
 * The bracket of a passage (ADR 0040): the thin line at the left of every
 * passage, which the style sheet draws, and a small label with the name of
 * its family at its head, which is seen while the cursor is in the passage
 * or the pointer rests on it. What is said of a passage is said from the
 * label: how its paragraphs are numbered, its language, selecting it,
 * making it text, splitting it.
 *
 * The label is a widget at the start of the passage, so that it takes no
 * room from the text and is no part of it; the passage the cursor is in is
 * marked `data-current`.
 */

import Globe from '@lucide/svelte/icons/globe';
import Hash from '@lucide/svelte/icons/hash';
import Pilcrow from '@lucide/svelte/icons/pilcrow';
import SplitSquareVertical from '@lucide/svelte/icons/split-square-vertical';
import TextSelect from '@lucide/svelte/icons/box-select';
import type { Node } from 'prosemirror-model';
import {
  Plugin,
  PluginKey,
  TextSelection,
  type Command,
  type EditorState,
} from 'prosemirror-state';
import { Decoration, DecorationSet, type EditorView } from 'prosemirror-view';
import { t } from '$lib/i18n';
import type { BasedKind } from '$lib/project/model/families';
import { openMenu, type MenuItem } from '$lib/ui/menu.svelte';
import { languageItems } from './language-menu';
import { hooksOf } from './ui.svelte';
import { passageAt } from './verse';

export const bracketsKey = new PluginKey<DecorationSet>('passage-brackets');

/** The passage at a position, where there is one. */
function passageNode(state: EditorState, pos: number): Node | null {
  const node = pos >= 0 && pos < state.doc.content.size ? state.doc.nodeAt(pos) : null;
  return node?.type.name === 'passage' ? node : null;
}

/** Selects the whole passage that begins at `pos`. */
export function selectPassage(pos: number): Command {
  return (state, dispatch) => {
    const passage = passageNode(state, pos);
    if (!passage) return false;
    if (dispatch)
      dispatch(
        state.tr
          .setSelection(TextSelection.create(state.doc, pos + 1, pos + passage.nodeSize - 1))
          .scrollIntoView(),
      );
    return true;
  };
}

/**
 * Makes every paragraph of the passage that begins at `pos` text. The
 * passage then goes, since text forms none (`passages.ts`); the cursor
 * stays where it was.
 */
export function passageToText(pos: number): Command {
  return (state, dispatch) => {
    const passage = passageNode(state, pos);
    if (!passage) return false;
    if (dispatch) {
      const tr = state.tr;
      passage.forEach((paragraph, offset) => {
        if (paragraph.type.name !== 'paragraph') return;
        if (paragraph.attrs.kind === 'text' && !paragraph.attrs.indent) return;
        tr.setNodeMarkup(pos + 1 + offset, undefined, {
          ...paragraph.attrs,
          kind: 'text',
          indent: 0,
        });
      });
      dispatch(tr.scrollIntoView());
    }
    return true;
  };
}

/**
 * Whether the passage the cursor is in can be split before the paragraph
 * the cursor is in: not before its first paragraph.
 */
export function canSplitPassage(state: EditorState): boolean {
  const at = passageAt(state);
  return !!at && at.index > 0;
}

/**
 * Splits the passage the cursor is in before the paragraph the cursor is
 * in. Passages of one family that stand next to each other are always one
 * (ADR 0040, rule 2), so an empty paragraph of text is put between the two
 * halves, which keeps them apart; each half keeps the settings of the
 * whole. The cursor stays in its paragraph, which begins the second half.
 */
export const splitPassage: Command = (state, dispatch) => {
  const at = passageAt(state);
  if (!at || at.index === 0) return false;
  const paragraph = state.schema.nodes.paragraph;
  if (!paragraph) return false;
  if (dispatch) dispatch(state.tr.insert(at.paragraphPos, paragraph.create()).scrollIntoView());
  return true;
};

/** The language the passage that begins at `pos` is in, by the first of its words that have one of their own; nothing where it is the text's. */
export function passageLanguage(state: EditorState, pos: number): string | null {
  const passage = passageNode(state, pos);
  const type = state.schema.marks.lang;
  if (!passage || !type) return null;
  let found: string | null = null;
  passage.descendants((node) => {
    if (found) return false;
    if (node.isText) {
      const mark = type.isInSet(node.marks);
      const tag = typeof mark?.attrs.tag === 'string' ? mark.attrs.tag.trim() : '';
      if (tag) found = tag;
    }
    return !found;
  });
  return found;
}

/**
 * Gives the whole passage that begins at `pos` a language of its own, or,
 * with nothing, takes it away, so that it is in the language of the text
 * again. The passage is left selected, so that what was given it is seen.
 */
export function languageOverPassage(pos: number, tag: string | null): Command {
  return (state, dispatch) => {
    const passage = passageNode(state, pos);
    const type = state.schema.marks.lang;
    if (!passage || !type) return false;
    if (dispatch) {
      const from = pos + 1;
      const to = pos + passage.nodeSize - 1;
      const lang = tag?.trim() ?? '';
      const tr = state.tr;
      if (lang) tr.addMark(from, to, type.create({ tag: lang }));
      else tr.removeMark(from, to, type);
      tr.setSelection(TextSelection.create(tr.doc, from, to));
      dispatch(tr.scrollIntoView());
    }
    return true;
  };
}

/**
 * Opens the menu of the passage that begins at `pos`, beside `anchor`. What
 * numbers the passage and what asks for another language are the editor's
 * dialogs, reached through its hooks.
 */
export function passageMenu(view: EditorView, pos: number, anchor: HTMLElement) {
  const { state } = view;
  const passage = passageNode(state, pos);
  if (!passage) return;
  const hooks = hooksOf.get(view);
  const at = passageAt(state);
  const inside = at?.pos === pos;
  const run = (command: Command) => {
    if (view.isDestroyed) return;
    command(view.state, view.dispatch, view);
    view.focus();
  };
  /** The cursor into the passage, where it is not there, so that what is asked of the passage the cursor is in is asked of this one. */
  const enter = () => {
    if (inside || view.isDestroyed) return;
    view.dispatch(view.state.tr.setSelection(TextSelection.near(view.state.doc.resolve(pos + 1))));
  };
  const current = passageLanguage(state, pos);
  const items: MenuItem[] = [
    {
      label: t('editor-passage-numbers'),
      hint: t('editor-passage-numbers-hint'),
      icon: Hash,
      disabled: !hooks?.askNumbers,
      action: () => {
        enter();
        hooks?.askNumbers?.(view);
      },
    },
    {
      kind: 'submenu',
      label: t('editor-language'),
      icon: Globe,
      items: languageItems({
        language: hooks?.language?.() ?? null,
        current,
        set: (tag) => run(languageOverPassage(pos, tag)),
        other: () => {
          run(selectPassage(pos));
          hooks?.askLanguage?.(view, current);
        },
      }),
    },
    { kind: 'separator' },
    {
      label: t('editor-passage-select'),
      icon: TextSelect,
      action: () => run(selectPassage(pos)),
    },
    {
      label: t('editor-passage-to-text'),
      hint: t('editor-passage-to-text-hint'),
      icon: Pilcrow,
      action: () => run(passageToText(pos)),
    },
    {
      label: t('editor-passage-split'),
      hint: t('editor-passage-split-hint'),
      icon: SplitSquareVertical,
      disabled: !inside || !canSplitPassage(state),
      action: () => run(splitPassage),
    },
  ];
  openMenu(anchor, items, { align: 'start', onclose: () => view.focus() });
}

/** The label of a passage, as a widget at its head: pressing it opens the menu of the passage. */
function label(
  name: string,
  family: string,
): (view: EditorView, getPos: () => number | undefined) => HTMLElement {
  return (view, getPos) => {
    const el = document.createElement('span');
    el.className = 'passage-label';
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '-1');
    el.dataset.family = family;
    el.textContent = name;
    el.title = t('editor-passage-label-hint', { family: name });
    // The text keeps its cursor: the label is not a place in it.
    el.addEventListener('mousedown', (event) => event.preventDefault());
    el.addEventListener('click', (event) => {
      event.preventDefault();
      const pos = getPos();
      if (pos === undefined || !view.editable) return;
      passageMenu(view, view.state.doc.resolve(pos).before(), el);
    });
    return el;
  };
}

/**
 * The label of every passage, and `data-current` on the passage the
 * cursor is in. `name` gives the words for a family: of the catalogue, or
 * a kind of the writer's own.
 */
function brackets(state: EditorState, name: (family: string) => string): DecorationSet {
  const list: Decoration[] = [];
  const { $from } = state.selection;
  state.doc.descendants((node, pos) => {
    if (node.type.name !== 'passage') return !node.isTextblock;
    const family = String(node.attrs.family ?? 'text');
    const words = name(family);
    list.push(
      Decoration.widget(pos + 1, label(words, family), {
        side: -1,
        key: `passage-label:${family}:${words}`,
        ignoreSelection: true,
        stopEvent: () => true,
      }),
    );
    if ($from.pos > pos && $from.pos < pos + node.nodeSize)
      list.push(Decoration.node(pos, pos + node.nodeSize, { 'data-current': '' }));
    return false;
  });
  return DecorationSet.create(state.doc, list);
}

/**
 * Draws the brackets of the passages: their labels, and which one the
 * cursor is in. `name` gives the words for a family, which are read anew
 * whenever the decorations are, so that a kind of the writer's own that is
 * renamed is seen under its new name at the next change.
 */
export function passageBrackets(name: (family: string) => string): Plugin<DecorationSet> {
  return new Plugin<DecorationSet>({
    key: bracketsKey,
    state: {
      init: (_config, state) => brackets(state, name),
      apply: (tr, set, _old, state) =>
        tr.docChanged || tr.selectionSet || tr.getMeta(bracketsKey) ? brackets(state, name) : set,
    },
    props: { decorations: (state) => bracketsKey.getState(state) },
  });
}

/** The kinds of the writer's own, with their names, as the hooks give them. */
export type NamedKind = BasedKind & { name?: string };
