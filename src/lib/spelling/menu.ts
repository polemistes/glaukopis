/**
 * The menu of a misspelt word (ADR 0019): what it may be, "Add to my
 * words", and "Ignore in this project". It is opened by the right button on
 * the word, or by F7 at the cursor, in the editors and in the text that is
 * drawn without one.
 *
 * What a word may be can take half a second to find in Norwegian, whose
 * words are long: the menu opens at once, and what is found is put into it
 * when it has been.
 */

import BookPlus from '@lucide/svelte/icons/book-plus';
import EyeOff from '@lucide/svelte/icons/eye-off';
import { TextSelection } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import { languageName, t } from '$lib/i18n';
import type { Project } from '$lib/project/model/project.svelte';
import { pointRect, type RectLike } from '$lib/ui/floating';
import { menuState, openMenu, type MenuItem } from '$lib/ui/menu.svelte';
import { notifyError } from '$lib/ui/toast.svelte';
import { wordAtPlace, type Misspelt, type SpellingOptions, type Why } from './plugin';
import { spelling } from './spelling.svelte';

/** How long the menu waits for what a word may be before it opens without it, in milliseconds. */
const WAIT = 80;

const NOTHING: ReadonlySet<string> = new Set();

export interface WordMenu {
  /** The language of the text: that of its map. */
  language: string | null | undefined;
  word: string;
  anchor: RectLike;
  /** Puts what was chosen in place of the word. */
  replace: (by: string) => void;
  project: Project | null | undefined;
  /** Gives the focus back to where the word is, when the menu closes. */
  back?: () => void;
}

const nothing = () => {};

/** Opens the menu of a misspelt word. */
export async function openWordMenu(menu: WordMenu) {
  const suggestions = spelling.suggest(menu.language, menu.word);
  const early = await Promise.race([
    suggestions.catch(() => []),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), WAIT)),
  ]);
  const found = (list: string[]): MenuItem[] =>
    list.length
      ? list.map((s) => ({ label: s, action: () => menu.replace(s) }))
      : [{ label: t('spelling-no-suggestions'), disabled: true, action: nothing }];
  const items: MenuItem[] = [
    ...(early ? found(early) : [{ label: t('spelling-looking'), disabled: true, action: nothing }]),
    { kind: 'separator' },
    {
      label: t('spelling-add-word'),
      icon: BookPlus,
      action: () =>
        void spelling
          .addWord(menu.language, menu.word)
          .catch((error) => notifyError(t('spelling-add-failed'), error)),
    },
  ];
  const project = menu.project;
  if (project) {
    items.push({
      label: t('spelling-ignore'),
      icon: EyeOff,
      action: () => project.ignoreWord(menu.word),
    });
  }
  openMenu(menu.anchor, items, { side: 'bottom', align: 'start', onclose: menu.back });
  if (early) return;
  const shown = menuState.current;
  const list = await suggestions.catch(() => []);
  // Put in where it said that it was looking, if the menu is still open.
  if (!shown || menuState.current !== shown) return;
  shown.items.splice(0, 1, ...found(list));
}

/** Says, where the menu of a word is asked for and there is none, why. */
export function openWhyMenu(
  anchor: RectLike,
  why: Why,
  language: string | null | undefined,
  back?: () => void,
) {
  const said =
    why === 'off'
      ? t('spelling-off')
      : why === 'no-dictionary'
        ? t('spelling-no-dictionary', { language: languageName(language || 'en') })
        : why === 'reading'
          ? t('spelling-not-ready')
          : t('spelling-nothing');
  openMenu(anchor, [{ label: said, disabled: true, action: nothing }], {
    side: 'bottom',
    align: 'start',
    onclose: back,
  });
}

/**
 * Gives an editor the focus again as ProseMirror does, which puts back its
 * own selection. The focus that a menu gives back when it closes is the
 * page's, which puts the cursor at the start of the text.
 */
function backTo(view: EditorView): () => void {
  return () => {
    if (!view.isDestroyed) view.focus();
  };
}

/** Where a place of an editor is on the page. */
function rectOf(view: EditorView, pos: number): RectLike {
  try {
    const c = view.coordsAtPos(pos);
    return {
      left: c.left,
      right: c.right,
      top: c.top,
      bottom: c.bottom,
      width: 0,
      height: c.bottom - c.top,
    };
  } catch {
    return view.dom.getBoundingClientRect();
  }
}

/** Puts a word in place of a misspelt one in an editor, if it still stands there. */
export function replaceIn(view: EditorView, at: Misspelt, by: string) {
  if (view.isDestroyed) return;
  const { doc } = view.state;
  if (at.to > doc.content.size || doc.textBetween(at.from, at.to) !== at.word) return;
  const tr = view.state.tr.insertText(by, at.from, at.to);
  view.dispatch(
    tr.setSelection(TextSelection.create(tr.doc, at.from + by.length)).scrollIntoView(),
  );
  view.focus();
}

/**
 * Puts a word in place of a misspelt one that was drawn without an editor,
 * in the editor that is being opened where it stood: when the editor has its
 * text, which comes a moment after it is made, the word under the point is
 * replaced, if it is that word.
 */
export function replaceWhenShown(
  view: () => EditorView | undefined,
  at: { left: number; top: number },
  word: string,
  by: string,
) {
  const until = performance.now() + 1500;
  const attempt = () => {
    const v = view();
    if (v && !v.isDestroyed && v.state.doc.textContent.includes(word)) {
      const pos = v.posAtCoords(at)?.pos;
      const found = pos === undefined ? null : wordAtPlace(v.state, pos);
      if (found?.word === word) {
        replaceIn(v, found, by);
        return;
      }
    }
    if (performance.now() < until) setTimeout(attempt, 40);
  };
  setTimeout(attempt, 0);
}

/**
 * Spelling for an editor: the language of the map of the element whose text
 * it holds, the words ignored in its project, and the menus.
 */
export function spellingOptions(
  project: () => Project | null | undefined,
  element: () => string | null | undefined,
): SpellingOptions {
  const language = () => {
    const p = project();
    return p?.map(p.node(element())?.map)?.document.language ?? null;
  };
  return {
    language,
    ignored: () => project()?.ignored ?? NOTHING,
    menu: (view, at, event) => {
      if (!event) {
        // From the keyboard: the word is selected, so that it is seen which it is.
        view.dispatch(
          view.state.tr
            .setSelection(TextSelection.create(view.state.doc, at.from, at.to))
            .scrollIntoView(),
        );
      }
      void openWordMenu({
        language: language(),
        word: at.word,
        anchor: event ? pointRect(event.clientX, event.clientY) : rectOf(view, at.to),
        replace: (by) => replaceIn(view, at, by),
        project: project(),
        back: backTo(view),
      });
    },
    none: (view, why) =>
      openWhyMenu(rectOf(view, view.state.selection.head), why, language(), backTo(view)),
  };
}
