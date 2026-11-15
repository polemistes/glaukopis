/**
 * The notebook as the holder of the texts of its notes: what an editor asks
 * of whatever holds its text (`editor/holder.ts`), answered in the
 * notebook's own small way (record 0101). A note is no element and stands
 * in no document: what is asked by element is answered as it holds for
 * every note. One holder for each notebook, the same whenever asked for.
 */

import { Fragment, Slice, type Mark, type Node, type NodeType } from 'prosemirror-model';
import { notebookTakeFiles, notebookTakeImage } from '$lib/api/notebook';
import type { FigureOf } from '$lib/editor/commands';
import type { TextHolder } from '$lib/editor/holder';
import { kindKeysOf } from '$lib/editor/kinds';
import { bodySchema } from '$lib/editor/schema';
import { newTextLanguage, t } from '$lib/i18n';
import { citationWrittenIn } from '$lib/library/copying';
import { nowIso } from '$lib/project/model/origins';
import type { PassageKindRecord, RefRecord, Thread } from '$lib/project/model/types';
import { notifyError } from '$lib/ui/toast.svelte';
import { toBase64 } from '$lib/util/base64';
import type { Notebook } from './model/notebook.svelte';
import { figureOf, fileSourceOf, holdTaken } from './taking';
import { takenLines } from './taken-lines';

const holders = new WeakMap<Notebook, TextHolder>();

/** The notebook as what holds the texts of its notes. */
export function holderOfNotebook(notebook: Notebook): TextHolder {
  let holder = holders.get(notebook);
  if (!holder) {
    holder = made(notebook);
    holders.set(notebook, holder);
  }
  return holder;
}

const NO_KINDS: PassageKindRecord[] = [];
const NO_REFS: ReadonlyMap<string, RefRecord> = new Map();
const NO_WORDS: ReadonlySet<string> = new Set();
const NO_THREADS: readonly Thread[] = [];

/** The words of a slice as plain text: paragraphs parted by line breaks, and lines within them so. */
export function sliceText(slice: Slice): string {
  return slice.content.textBetween(0, slice.content.size, '\n', (leaf) =>
    leaf.type.name === 'hard_break' ? '\n' : '',
  );
}

/** Whether a slice holds words that carry no mark `taken`. */
function holdsWordsNotTaken(fragment: Fragment): boolean {
  let found = false;
  fragment.descendants((node) => {
    if (found) return false;
    if (node.isText && node.text?.trim() && !node.marks.some((m) => m.type.name === 'taken'))
      found = true;
    return !found;
  });
  return found;
}

/** The content with every word marked as taken in the passage, where the word may carry the mark and carries none of it yet. */
function marked(fragment: Fragment, mark: Mark, parent: NodeType | null): Fragment {
  const nodes: Node[] = [];
  fragment.forEach((node) => {
    if (node.isText)
      nodes.push(
        node.marks.some((m) => m.type === mark.type) ||
          (parent && !parent.allowsMarkType(mark.type))
          ? node
          : node.mark(mark.addToSet(node.marks)),
      );
    else nodes.push(node.copy(marked(node.content, mark, node.type)));
  });
  return Fragment.from(nodes);
}

function made(notebook: Notebook): TextHolder {
  return {
    undo: () => notebook.undo(),
    redo: () => notebook.redo(),
    get undoManager() {
      return notebook.undoManager;
    },
    get awareness() {
      return notebook.awareness;
    },
    passageKinds: NO_KINDS,
    refs: NO_REFS,
    ignored: NO_WORDS,
    ownerOf: () => null,
    has: () => false,
    // Spelling is checked in the language new texts are given.
    languageOf: () => newTextLanguage(),
    formatOf: () => undefined,
    kindKeysOf: () => kindKeysOf(null),
    topOf: () => '',
    threadsOf: () => NO_THREADS,
    citationWritten: (_element, said) => citationWrittenIn(null, null, said),

    async pictureFromFile(path: string): Promise<FigureOf | null> {
      try {
        const { files, problems } = await notebookTakeFiles([path]);
        const taken = files[0];
        if (!taken?.shown) {
          notifyError(t('figures-picture-not-taken'), problems[0]);
          return null;
        }
        notebook.transact(() =>
          holdTaken(notebook, taken, notebook.addSource(fileSourceOf(taken))),
        );
        return figureOf(taken.shown);
      } catch (error) {
        notifyError(t('figures-picture-not-taken'), error);
        return null;
      }
    },

    async pictureFromBlob(blob: Blob, name: string): Promise<FigureOf | null> {
      try {
        const content = toBase64(new Uint8Array(await blob.arrayBuffer()));
        const taken = await notebookTakeImage(name, content);
        if (!taken.shown) {
          notifyError(t('figures-picture-not-taken'));
          return null;
        }
        // Pasted: where it came from is given by hand.
        holdTaken(notebook, taken, null);
        return figureOf(taken.shown);
      } catch (error) {
        notifyError(t('figures-picture-not-taken'), error);
        return null;
      }
    },

    received(slice, came) {
      // From a text of Glaukopis it goes in as it is, its marks with it.
      if (came.fromGlaukopis || !holdsWordsNotTaken(slice.content)) return null;
      const passage = notebook.transact(() => {
        const source = came.page
          ? notebook.addSource({ sort: 'web', url: came.page, title: '', read: nowIso() })
          : null;
        // As the paragraphs will hold it: empty ones hold no words of it.
        const text = sliceText(slice)
          .split('\n')
          .filter((l) => l !== '')
          .join('\n');
        return notebook.addPassage(source, text.trim());
      });
      const mark = bodySchema.marks.taken.create({ passage });
      return new Slice(marked(slice.content, mark, null), slice.openStart, slice.openEnd);
    },

    plugins: () => [takenLines()],
  };
}
