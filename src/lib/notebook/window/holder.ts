/**
 * The window of a note as the holder of its one text (record 0109): what
 * an editor asks of whatever holds its text (`editor/holder.ts`), answered
 * for a note that is not yet in the notebook, a third beside the project's
 * (`project/holder.ts`) and the notebook's (`notebook/holder.ts`). The text
 * is a Yjs document of its own, kept by the window until it is sent. It
 * belongs to no element and to no document, cites nothing, has no
 * comments and no words to pass over; its pictures and files are copied
 * beside it (`api/notewindow.ts`), and a figure shows its picture from
 * there (`figures/pictures.svelte.ts`).
 */

import { Awareness } from 'y-protocols/awareness';
import { ySyncPluginKey } from 'y-prosemirror';
import * as Y from 'yjs';
import { noteWindowAddBytes, noteWindowAddFiles, type Added } from '$lib/api/notewindow';
import type { FigureOf } from '$lib/editor/commands';
import type { TextHolder } from '$lib/editor/holder';
import { kindKeysOf } from '$lib/editor/kinds';
import { newTextLanguage, t } from '$lib/i18n';
import type { PassageKindRecord, RefRecord, Thread } from '$lib/project/model/types';
import { notifyError } from '$lib/ui/toast.svelte';
import { toBase64 } from '$lib/util/base64';
import { isPictureEnding } from './text';

const NO_KINDS: PassageKindRecord[] = [];
const NO_REFS: ReadonlyMap<string, RefRecord> = new Map();
const NO_WORDS: ReadonlySet<string> = new Set();
const NO_THREADS: readonly Thread[] = [];

/** What a figure shows of a file added to the note, where it is a picture it shows as it is. */
export function figureOfAdded(file: Added): FigureOf | null {
  if (!isPictureEnding(file.extension)) return null;
  return { hash: file.hash, extension: file.extension, name: file.name, width: file.width };
}

/** Says what could not be added, in one message. */
export function sayNotAdded(problems: string[]) {
  if (problems.length) notifyError(t('notebook-files-not-taken'), problems.slice(0, 4).join('\n'));
}

/** Adds files of this computer to the note; what could not be added is said. */
export async function addPaths(paths: string[]): Promise<Added[]> {
  if (!paths.length) return [];
  try {
    const added = await noteWindowAddFiles(paths);
    sayNotAdded(added.problems);
    return added.files;
  } catch (error) {
    notifyError(t('notebook-files-not-taken'), error);
    return [];
  }
}

/** Adds a file the window holds to the note: a picture pasted. Nothing where it could not be, which is said. */
export async function addBlob(blob: Blob, name: string): Promise<Added | null> {
  try {
    const content = toBase64(new Uint8Array(await blob.arrayBuffer()));
    return await noteWindowAddBytes(name, content);
  } catch (error) {
    notifyError(t('notebook-files-not-taken'), error);
    return null;
  }
}

/** The holder of the one text of the window, kept in `fragment` of `doc`. */
export function noteHolder(doc: Y.Doc, fragment: Y.XmlFragment): TextHolder {
  // What the editor writes is undone; what was there when the window opened is not.
  const undoManager = new Y.UndoManager(fragment, {
    trackedOrigins: new Set<unknown>([ySyncPluginKey]),
    captureTimeout: 600,
  });
  const awareness = new Awareness(doc);
  /** A picture added, as a figure shows it; nothing where it is no picture, which is said. */
  const pictured = (file: Added | null): FigureOf | null => {
    if (!file) return null;
    const figure = figureOfAdded(file);
    if (!figure) notifyError(t('figures-picture-not-taken'), file.name);
    return figure;
  };
  return {
    undo: () => undoManager.undo(),
    redo: () => undoManager.redo(),
    undoManager,
    awareness,
    passageKinds: NO_KINDS,
    refs: NO_REFS,
    ignored: NO_WORDS,
    ownerOf: () => null,
    has: () => false,
    languageOf: () => newTextLanguage(),
    formatOf: () => undefined,
    kindKeysOf: () => kindKeysOf(null),
    topOf: () => '',
    threadsOf: () => NO_THREADS,
    // Nothing is cited here, and so nothing is copied as a style writes it.
    citationWritten: () => Promise.reject(new Error('a note of its own window cites nothing')),
    cites: false,
    pictureFromFile: async (path) => pictured((await addPaths([path]))[0] ?? null),
    pictureFromBlob: async (blob, name) => pictured(await addBlob(blob, name)),
  };
}
