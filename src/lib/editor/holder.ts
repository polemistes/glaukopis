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

import type { Awareness } from 'y-protocols/awareness';
import type * as Y from 'yjs';
import type { Cited, DocumentFormat } from '$lib/api/documents';
import type { Written } from '$lib/library/written';
import type { PassageKindRecord, RefRecord, Thread } from '$lib/project/model/types';

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
}
