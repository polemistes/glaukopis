/**
 * *To the notebook* in the bar of a file (the plan of the notebook, stage
 * 3), for a file in a side and a file read in the library alike: with words
 * selected in the pages, they are a new note, taken in as one passage; with
 * none, a part of a page is marked with the pointer (`MarkPart.svelte`),
 * and its picture is a new note. The source is the file's reference with
 * the page, the one chosen among several (asked once for each file, by a
 * menu at the button), or the file itself with the page. The view stays as
 * it is, and the selection with it.
 */

import type { FileFacts } from '$lib/api/viewer';
import { files, referenceWords } from '$lib/files/store.svelte';
import { t } from '$lib/i18n';
import { heldFile } from '$lib/notebook/files';
import {
  cutOut,
  joinLines,
  noteOfPicture,
  noteOfWords,
  pagesOf,
  pictureName,
  placeOf,
  referenceChosen,
  sayAdded,
  selectedLines,
  sourceOf,
  type PixelRect,
} from '$lib/notebook/from-file';
import { openMenu } from '$lib/ui/menu.svelte';
import { notifyError } from '$lib/ui/toast.svelte';

/** What the button acts on: the file shown, what is known of it, and what holds its bar and its pages. */
export interface Shown {
  file: string;
  facts: FileFacts | null;
  root: HTMLElement | null | undefined;
}

/** The references of a file, and the one chosen among several. */
interface Belongs {
  file: string;
  references: string[];
  choice: string | null;
}

export class ToNotebook {
  /** Whether a part of a page is being marked. */
  marking = $state(false);
  /** What the part marked will belong to, asked when the marking began. */
  #belongs: Belongs | null = null;
  readonly #shown: () => Shown;

  constructor(shown: () => Shown) {
    this.#shown = shown;
  }

  /** The button, or its key: the words selected go; with none, a part is marked; while one is, the marking is given up. */
  async press(anchor?: HTMLElement | null) {
    if (this.marking) {
      this.cancel();
      return;
    }
    const { file, facts, root } = this.#shown();
    if (!file || !facts || facts.locked || !root) return;
    const selection = document.getSelection();
    const range =
      selection && selection.rangeCount && !selection.isCollapsed
        ? selection.getRangeAt(0).cloneRange()
        : null;
    const text = range ? joinLines(selectedLines(root, range)) : '';
    const button = anchor ?? root.querySelector<HTMLElement>('[data-viewer-notebook]');
    const belongs = await this.#belongsTo(file, button);
    if (!belongs) return;
    if (!range || !text) {
      this.#belongs = belongs;
      this.marking = true;
      return;
    }
    const pages = pagesOf(root, range);
    const place = pages ? placeOf(facts.labels, pages[0], pages[1]) : null;
    const source = sourceOf(
      { name: facts.name, references: belongs.references },
      place,
      belongs.choice,
    );
    if (!source) return;
    try {
      sayAdded(await noteOfWords(text, source));
    } catch (error) {
      notifyError(t('notebook-from-file-not-added'), error);
    }
    // The selection stays as it was, where a menu took it away.
    const now = document.getSelection();
    if (now && now.isCollapsed && range.startContainer.isConnected) {
      now.removeAllRanges();
      now.addRange(range);
    }
  }

  /** Gives the marking up. */
  cancel() {
    this.marking = false;
    this.#belongs = null;
  }

  /** A part marked: its picture a new note. */
  async marked(part: { canvas: HTMLCanvasElement; rect: PixelRect; page: number }) {
    const belongs = this.#belongs;
    this.cancel();
    const { file, facts } = this.#shown();
    if (!belongs || !facts || belongs.file !== file) return;
    // An image is one page, which no citation counts.
    const place = facts.picture ? null : placeOf(facts.labels, part.page);
    const source = sourceOf(
      { name: facts.name, references: belongs.references },
      place,
      belongs.choice,
    );
    if (!source) return;
    try {
      const png = await cutOut(part.canvas, part.rect);
      sayAdded(await noteOfPicture(pictureName(facts.name, place), png, source));
    } catch (error) {
      notifyError(t('notebook-from-file-not-added'), error);
    }
  }

  /**
   * The references a file belongs to, and the one chosen where there are
   * several: asked by a menu at the button the first time, then kept for
   * the file while the application runs. None where the menu was left
   * without a choice.
   */
  async #belongsTo(file: string, anchor: HTMLElement | null): Promise<Belongs | null> {
    const view = files.get(file) ?? (await heldFile(file));
    const all = view?.references ?? [];
    const references = all.map((r) => r.id);
    if (references.length < 2) return { file, references, choice: null };
    const kept = referenceChosen.get(file);
    if (kept && references.includes(kept)) return { file, references, choice: kept };
    if (!anchor) return null;
    const choice = await new Promise<string | null>((done) => {
      openMenu(
        anchor,
        [
          { kind: 'heading', label: t('viewer-to-notebook-which') },
          ...all.map((r) => ({
            label: referenceWords(r),
            hint: r.title || undefined,
            action: () => done(r.id),
          })),
        ],
        // The menu is closed before what is chosen in it is done: a choice comes first.
        { side: 'bottom', align: 'end', onclose: () => queueMicrotask(() => done(null)) },
      );
    });
    if (!choice) return null;
    referenceChosen.set(file, choice);
    return { file, references, choice };
  }
}
