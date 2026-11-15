/**
 * What the notebook is made of, as the interface reads it: its notes, the
 * sources of what was taken in, the passages taken, and the files its
 * notes hold (record 0101; `docs/plans/the-notebook.md`).
 */

import type { Place } from '$lib/api/notebook';
import type { Block } from '$lib/project/model/text';

interface SourceBase {
  id: string;
  /** The reference of the library it has been made, or is. */
  reference?: string;
}

/** A page of the web. */
export interface WebSource extends SourceBase {
  sort: 'web';
  url: string;
  title: string;
  /** When the page was read: an ISO date-time. */
  read: string;
}

/** A reference of the library, with a place in it. */
export interface ReferenceSource extends SourceBase {
  sort: 'reference';
  reference: string;
  /** A place in it: what the locator of a citation takes, and what it counts. */
  locator?: string;
  label?: string;
}

/** A file, as it says of itself. */
export interface FileSource extends SourceBase {
  sort: 'file';
  name: string;
  /** Its own time, when it was last changed. */
  time?: string;
  /** Of a photograph, when it was taken, as it says itself. */
  taken?: string;
  /** Of a photograph, where it was taken. */
  place?: Place;
}

/** Words of the writer's: a broadcast and its day, a place, a person. */
export interface WordsSource extends SourceBase {
  sort: 'words';
  words: string;
}

export type Source = WebSource | ReferenceSource | FileSource | WordsSource;

/** A source to be made: all but its id. */
export type NewSource =
  | Omit<WebSource, 'id'>
  | Omit<ReferenceSource, 'id'>
  | Omit<FileSource, 'id'>
  | Omit<WordsSource, 'id'>;

/** A change to a source: what is given is set, what is given as undefined is taken away. Its sort stays. */
export type SourceChange =
  | Partial<Omit<WebSource, 'id' | 'sort'>>
  | Partial<Omit<ReferenceSource, 'id' | 'sort'>>
  | Partial<Omit<FileSource, 'id' | 'sort'>>
  | Partial<Omit<WordsSource, 'id' | 'sort'>>;

/** Words taken in from elsewhere: where they came from, how they read when they were taken, and when. */
export interface Passage {
  id: string;
  /** None, where that has not been given. */
  source: string | null;
  text: string;
  taken: string;
}

/** A file a note holds, by its hash. */
export interface HeldFile {
  hash: string;
  name: string;
  extension: string;
  source: string | null;
  taken: string;
  /**
   * Of a copy made to be shown in a figure (turned upright, or made into
   * PNG), the file it was made from, which the notebook holds with it.
   */
  madeFrom?: string;
}

/** What became of a piece of a note. */
export interface Went {
  what: 'text' | 'quotation' | 'figure' | 'reference' | 'file';
  /** The project it went into, and what it was called then. */
  project?: string;
  name?: string;
  element?: string;
  when: string;
}

/**
 * A piece of a note: what is dragged and what goes somewhere. `from` and
 * `to` are the places among the parts at the top of its text, `[from, to)`.
 */
export type Piece =
  | { kind: 'own'; from: number; to: number; blocks: Block[] }
  | { kind: 'passage'; from: number; to: number; blocks: Block[]; passage: string }
  | {
      kind: 'figure';
      from: number;
      to: number;
      blocks: Block[];
      hash: string;
      extension: string;
      name: string;
    }
  | { kind: 'file'; from: number; to: number; hash: string; name: string; extension: string };

/** What a note holds, for the filters. */
export interface Holds {
  /** Words of the writer's own, or anything else that was not taken in. */
  own: boolean;
  passages: boolean;
  pictures: boolean;
  files: boolean;
  links: boolean;
}

/** A note as the interface reads it. */
export interface NoteRecord {
  id: string;
  /** Given by the writer; empty where none is. */
  name: string;
  /** When it was collected: an ISO date-time. */
  made: string;
  pieces: Piece[];
  /** Its words for finding: its name and its text, in lower case. */
  words: string;
  /** How it begins: its first words, for the lists, where it has no name. */
  begins: string;
  holds: Holds;
  /** The sources of what it holds, in the order met, each once; null among them where something taken in has no source. */
  sources: (string | null)[];
  /** The first picture it holds, for the lists. */
  picture: { hash: string; extension: string } | null;
  went: Went[];
}
