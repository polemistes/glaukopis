import type { SetOff } from './text';
/** The records of a project, as the interface reads them from the document. */

export interface Position {
  x: number;
  y: number;
}

export type Side = 'left' | 'right';

export interface Person {
  name: string;
  affiliation?: string;
  email?: string;
  orcid?: string;
}

/** What belongs to a map as a document. Shown only with preview and export. */
export interface DocumentSettings {
  /** When empty, the name of the central element is the title. */
  title?: string;
  subtitle?: string;
  authors?: Person[];
  abstract?: string;
  keywords?: string[];
  date?: string;
  /** Id of the reference style. */
  style?: string;
  /** Id of the document format. */
  format?: string;
  /** Language of the text, as a BCP 47 tag: en-GB, nb, de, el. */
  language?: string;
}

export interface MapRecord {
  id: string;
  name: string;
  /** The element at the centre. */
  root: string;
  order: string;
  created: string;
  document: DocumentSettings;
}

/**
 * How far the writing of an element has come, as its writer says: an idea,
 * a draft, done. So that a map shows how far the book has come.
 */
export type Status = 'idea' | 'draft' | 'done';

export const STATUSES: readonly Status[] = ['idea', 'draft', 'done'];

/**
 * A kind of element, as the project's writer names it: character, place,
 * event, source, argument, or what the work needs. A name and a colour, and
 * perhaps a text that an element of the kind begins with.
 */
export interface KindRecord {
  id: string;
  name: string;
  /** One of `KIND_COLOURS`, by its name. */
  colour: string;
  /** What the text of a new element of the kind begins with: lines, one paragraph each. */
  template: string;
  order: string;
}

/** Where an element was copied from. */
export interface Origin {
  map: string;
  node: string;
  /**
   * What the original was when the copy was made, or when its change was
   * last seen, in few signs (`Project.fingerprint`). Not there in copies
   * made before this was kept.
   */
  print?: string;
}

export interface NodeRecord {
  id: string;
  map: string;
  parent: string | null;
  order: string;
  /**
   * Where the user put the element, relative to its parent; for the central
   * element and loose ones, on the canvas. Null when the element is placed
   * automatically.
   */
  pos: Position | null;
  /** For elements next to the centre: the side they are on. */
  side: Side | null;
  collapsed: boolean;
  /** Whether the name is printed as a heading in the document. */
  heading: boolean;
  /** Whether the element is left out of the document. */
  excluded: boolean;
  /** A map whose content stands in this element's place in the document. */
  include: string | null;
  /** Where the element was copied from. */
  origin: Origin | null;
  /** How far its writing has come; nothing where that is not said. */
  status: Status | null;
  /** The id of its kind (`KindRecord`); nothing where it has none. */
  kind: string | null;

  // Read from the content.
  title: string;
  titleHtml: string;
  empty: boolean;
  words: number;
  cited: string[];
  notes: number;
  /** The words that stand in notes, which are among the words. */
  noteWords: number;
  /** The figures and equations of the text, in the order they stand in. */
  set: SetOff[];
}

export interface LinkRecord {
  id: string;
  from: string;
  to: string;
  label: string;
}

/** A reference as the project carries it, so that a shared project is complete. */
export interface RefRecord {
  id: string;
  key: string;
  type: string;
  fields: Record<string, string>;
  names: Record<
    string,
    { family: string; given?: string; prefix?: string; suffix?: string; literal?: boolean }[]
  >;
  modified: string;
  authors: string;
  year: string;
  title: string;
  container: string;
}

/**
 * A comment on an element, or on a passage of its text: a thread of notes,
 * each by one person, which others answer under it. Never part of the text,
 * nor of any document made from it.
 */
export interface Thread {
  id: string;
  element: string;
  /**
   * The passage it is on, where it is on one: two positions in the text
   * that follow it through every change (Yjs's relative positions), and
   * the words that were there when the comment was made.
   */
  passage: { from: Uint8Array; to: Uint8Array; text: string } | null;
  resolved: boolean;
  /** Where its card stands in the diagram, from its element; where it was moved. */
  card: Position | null;
  /** The first note, and the answers to it, in order. */
  notes: Note[];
}

export interface Note {
  id: string;
  author: { id: string; name: string };
  /** When it was written, and when it was last changed. */
  created: string;
  edited?: string;
  text: string;
}
