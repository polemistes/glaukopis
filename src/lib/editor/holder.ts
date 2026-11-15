/**
 * What an editor asks of whatever holds its text. A project answers as
 * `project/holder.ts` says; the notebook, whose texts belong to no element
 * and to no document, answers in its own small way. The editor knows
 * nothing else of where its text is kept (record 0100).
 *
 * What is asked by an element is asked for the text of that element: the
 * language its document is written in, the layout that numbers its lines,
 * the comments on it. A holder whose texts belong to no element is asked
 * with none, and answers what holds for every text it has.
 */

import type { Slice } from 'prosemirror-model';
import type { Plugin } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import type { Awareness } from 'y-protocols/awareness';
import type * as Y from 'yjs';
import type { Cited, DocumentFormat } from '$lib/api/documents';
import type { DragPayload } from '$lib/ui/drag.svelte';
import type { FigureOf } from './commands';
import type { Written } from '$lib/library/written';
import type { PassageKindRecord, RefRecord, Thread } from '$lib/project/model/types';

/** Where what is pasted came from, as much as the clipboard says. */
export interface Came {
  /** Whether it was copied in a text of Glaukopis, and not in another program. */
  fromGlaukopis: boolean;
  /**
   * The address it was copied from, where the clipboard says one. Firefox
   * says the site, not the page (`http://host`, tried with Firefox 159 on
   * Linux): the rest of the address is not known from a paste.
   */
  page: string | null;
}

/** What is dragged within the window that the texts of a holder take, beside references and images. */
export interface TextDrops {
  /** The kinds of what is dragged (`DragPayload.kind`). */
  accepts: string[];
  /** Dropped on a text: `at` is the place in it, or none where there is none under the pointer. */
  ondrop(view: EditorView, at: number | null, payload: DragPayload): void;
}

export interface TextHolder {
  // ---- one history for all its texts, and who else is in them ----

  undo(): void;
  redo(): void;
  readonly undoManager: Y.UndoManager;
  /** Who is in the text, and where: there for every holder, shared or not. */
  readonly awareness: Awareness;

  // ---- what the texts are written with ----

  /** The kinds of paragraph and of words of the writer's own. A new list whenever they change. */
  readonly passageKinds: PassageKindRecord[];
  /** The works the holder keeps a copy of, by their ids, beside those of the library. */
  readonly refs: ReadonlyMap<string, RefRecord>;
  /** The words spelling passes over in its texts. A new set whenever they change. */
  readonly ignored: ReadonlySet<string>;
  /** Has spelling pass a word over from now on; not there where the holder keeps no such words. */
  ignoreWord?(word: string): void;

  // ---- the element a text belongs to, and its document ----

  /** The element whose name or text a piece of the document is; none, where it is no element's. */
  ownerOf(fragment: Y.XmlFragment): string | null;
  /** Whether an element is there. */
  has(element: string | null | undefined): boolean;
  /** The language the text of an element is written in, as its document says; nothing where it is not known. */
  languageOf(element: string | null | undefined): string | null;
  /** The layout of the document of an element, as changed for it, when it has been read. */
  formatOf(element: string): DocumentFormat | undefined;
  /** The kinds of paragraph Ctrl+Alt with a digit gives where an element is written in, by the digit. */
  kindKeysOf(element: string | null | undefined): Readonly<Record<string, string>>;
  /** The top of the tree under the holder an element stands in: in its document what stands in the text is numbered, where none is in view. */
  topOf(element: string): string;
  /** The threads of comments on an element. */
  threadsOf(element: string): readonly Thread[];
  /** A citation as the reference style of the document of an element writes it, alone (record 0090). */
  citationWritten(element: string | null | undefined, said: Cited): Promise<Written>;

  // ---- what comes into a text ----

  /**
   * Takes in an image chosen or pasted into a text, from a file of this
   * computer or as it was pasted, and gives what a figure shows of it;
   * nothing where it could not be taken in, which is said.
   */
  pictureFromFile(path: string): Promise<FigureOf | null>;
  pictureFromBlob(blob: Blob, name: string): Promise<FigureOf | null>;
  /**
   * What the holder makes of what is pasted into one of its texts: the
   * text to put in, at once or when it has been made; nothing, where what
   * was pasted goes in as it is. Not there where the holder makes nothing
   * of any paste.
   */
  received?(slice: Slice, came: Came): Slice | Promise<Slice> | null;
  /** What more than references and images its texts take of what is dragged within the window. */
  readonly drops?: TextDrops;
  /** Plugins of the holder's own for the editors of its texts: made anew for each editor. */
  plugins?(): Plugin[];
}
