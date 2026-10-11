import type { KindFamily, Look } from '$lib/api/documents';
import type { When } from '$lib/timeline/solve';
import type { SetOff } from './text';
/** The records of a project, as the interface reads them from the document. */

/**
 * The id of the element at the top of every project: the project itself,
 * whose name is the project's name and whose text its preamble. It has no
 * parent, and everything else stands under it (ADR 0037).
 */
export const PROJECT = 'project';

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

/**
 * What belongs to an element as a document (ADR 0037). Shown only with
 * preview and export. What an element does not set it takes from the
 * nearest element over it that does (`Project.documentOf`), but for what is
 * its own: see `OWN_SETTINGS`.
 */
export interface DocumentSettings {
  /** When empty, the name of the element is the title. */
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
  /** Id of the template (ADR 0038). */
  template?: string;
  /** ISBN, edition, publisher, place, DOI, and what else the writer names. */
  identifiers?: Record<string, string>;
  /** Language of the text, as a BCP 47 tag: en-GB, nb, de, el. */
  language?: string;
  /** The cover of the e-book: a picture of the store, by its hash, and its kind of file. */
  cover?: { hash: string; extension: string };
}

/** The settings an element has of its own, never from one over it: a chapter printed alone is not titled as the book. */
export const OWN_SETTINGS: readonly (keyof DocumentSettings)[] = ['title', 'subtitle', 'abstract'];

/**
 * The kinds of paragraph and of words the writer has pinned to the hand of
 * the project, by id, and those taken out of it: see `editor/kinds.ts`, `inHand`.
 */
export interface Hand {
  pinned: string[];
  unpinned: string[];
}

/**
 * A lane of a timeline: an element, whose branch the lane holds, or each of
 * its children a lane of their own; or a kind of element, every element of
 * which is a lane.
 */
export interface Lane {
  element?: string;
  each?: boolean;
  kind?: string;
}

/** How an element is shown as a timeline, when it is the element in view: its axis, and its lanes. */
export interface TimelineSettings {
  /** Dates of the world, or the units of an invented one. */
  axis?: 'dates' | 'units';
  /** What a unit is called, on the axis of units: "year", "day", or a word of the writer's. */
  unit?: string;
  /** The lanes; none for each child of the element in view a lane. */
  lanes?: Lane[];
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
  /** The kind of paragraph the text of an element of the kind is written in (`editor/kinds.ts`); nothing for text. */
  begins?: string;
  order: string;
}

/**
 * A kind of paragraph or of words of the writer's own: a name, what it is
 * based on, and how it differs from that, by the measures a format uses.
 * Kept in the project, as the kinds of elements are. See ADR 0029.
 */
export interface PassageKindRecord {
  id: string;
  name: string;
  family: KindFamily;
  /** The id of the kind it is based on: of the catalogue, or another of the writer's own. */
  basedOn: string;
  look: Look;
  order: string;
}

/** Where an element was copied from: another element of the project. */
export interface Origin {
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
  /** The element it stands under; nothing for the project itself. */
  parent: string | null;
  order: string;
  /**
   * Where the user put the element, relative to its parent. Null when the
   * element is placed automatically. The element in view stands at the
   * origin whatever this says.
   */
  pos: Position | null;
  collapsed: boolean;
  /** Whether the name is printed as a heading in the document. */
  heading: boolean;
  /** Whether the element is left out of the document. */
  excluded: boolean;
  /** An element whose branch stands in this element's place in the document. */
  include: string | null;
  /** Where the element was copied from. */
  origin: Origin | null;
  /** How far its writing has come; nothing where that is not said. */
  status: Status | null;
  /** The id of its kind (`KindRecord`); nothing where it has none. */
  kind: string | null;
  /** When it is, in time; nothing where that is not said. See `timeline/solve.ts`. */
  when: When | null;
  /** What is said of it as a document, of its own: see `Project.documentOf` for what it inherits. */
  document: DocumentSettings;
  /** How it is shown as a timeline, when it is the element in view. */
  timeline: TimelineSettings;

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
  /** The ids of the kinds of paragraph and of words the text uses, each once, in the order of first use. */
  uses: string[];
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
