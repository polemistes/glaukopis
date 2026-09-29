/**
 * What the history of a project says of its text: the contract between the
 * history (ADR 0021), which finds it, and the review of changes (ADR 0022),
 * which groups it into changes and shows them.
 *
 * Everything here is in the terms of Yjs, which every copy of a shared
 * project understands alike: a moment is a snapshot (a state vector and the
 * deletions), a place in a text is a relative position, and a piece of text
 * is made of items, each named by the copy that made it and its clock.
 *
 * The history owns this file. What is here may be added to; changing what is
 * here is said in the report of the one who changes it.
 */

/** Someone who writes in a project: an installation of the application. */
export interface Person {
  /** Made once, kept in the settings: the same wherever the project is. */
  id: string;
  /** As the settings name them. */
  name: string;
}

/** A moment of the history. */
export interface Moment {
  /** `Y.encodeSnapshot`: what every copy understands as the same moment. */
  snapshot: Uint8Array;
  /** When this computer had it, in milliseconds since 1970. */
  time: number;
}

/**
 * Items of Yjs: for each copy that made some, the ranges of their clocks,
 * each from the first to the one after the last.
 */
export type Items = Record<number, [number, number][]>;

/** A block of text in a map: an element, its name or its text, and the path to the block. */
export interface Place {
  element: string;
  part: 'title' | 'body';
  /**
   * The indices down the tree of blocks in the text: [3] is the fourth
   * block, [3, 1] the second within it (a list item, a row, a cell). A note
   * is within the paragraph it stands in, after it: [3, 'note', 2] is the
   * third note in the fourth block.
   */
  path: (number | 'note')[];
}

/**
 * Text that a person has accepted, and is compared with there instead of
 * with the moment they review from: from and to as relative positions
 * (`Y.encodeRelativePosition`) in the text it is in, and the items that were
 * to be seen in it when it was accepted.
 */
export interface Accepted {
  place: Place;
  from: Uint8Array;
  to: Uint8Array;
  visible: Items;
}

/** What a person compares with: a moment, except where they accepted something since. */
export interface Reference {
  /** `Y.encodeSnapshot` of the moment. */
  moment: Uint8Array;
  accepted: Accepted[];
}

/** Something in a text that is not text: one piece of its own. */
export interface TextObject {
  kind: 'citation' | 'math' | 'footnote' | 'crossref' | 'hard_break' | string;
  /** As it is shown in the text: "(Nagy 1979, 73)", "Figure 3". */
  label: string;
  attrs: Record<string, unknown>;
}

/**
 * A stretch of a block of text as it was and as it is: in both, added since,
 * or removed since.
 */
export interface Piece {
  status: 'same' | 'added' | 'removed';
  /** The text; an object is one U+FFFC. */
  text: string;
  object?: TextObject;
  /** Its marks as it has them now (same, added) or had them (removed): `{ em: true }`. */
  marks: Record<string, unknown>;
  /** Of what is in both: its marks as it had them, where they were other than now. */
  marksBefore?: Record<string, unknown>;
  /** Who added or removed it, where that is known; of what is the same, nobody. */
  by: string | null;
  /** The items it is made of. */
  items: Items;
}

/** A block of text as it was and as it is, piece by piece, in order. */
export interface Passage {
  place: Place;
  /** What block it is: paragraph, name, caption, cell, note, … */
  kind: string;
  /** Whether it was there at the moment compared with, and whether it is now. */
  before: boolean;
  after: boolean;
  pieces: Piece[];
}

/** A figure, an equation, or a table as a whole: added, removed, or changed in what is not its text. */
export interface ObjectChange {
  place: Place;
  kind: 'figure' | 'equation' | 'table' | string;
  status: 'added' | 'removed' | 'changed';
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  by: string | null;
}

/** An element of a map, changed as an element: not its name or text, which are passages. */
export interface ElementChange {
  element: string;
  kind: 'added' | 'removed' | 'moved' | 'heading' | 'excluded' | 'included' | string;
  /** Under what it stood, and after what, then and now; of what is added or removed, one of them. */
  before?: { parent: string | null; after: string | null };
  after?: { parent: string | null; after: string | null };
  by: string | null;
}

/** What changed in a map between what a person compares with and now. */
export interface MapChanges {
  map: string;
  /** The passages that differ, in the order of the text; passages that do not differ are left out. */
  passages: Passage[];
  objects: ObjectChange[];
  elements: ElementChange[];
}

/** A version of a stretch of text between the moment compared with and now. */
export interface Version {
  moment: Moment;
  /** Who made it what it is, from the version before. */
  by: string[];
  /** The stretch as it was then, pieces as they differ from the version before. */
  pieces: Piece[];
}

/**
 * The history of a project, as the review asks it. Made by the history,
 * answered from a worker; what changes the project is done here, in the
 * document that is worked in, as a change of this person's.
 */
export interface History {
  /** The people of the project. */
  people(): Promise<Person[]>;
  /** The moment the project is at now. */
  now(): Promise<Moment>;
  /** What changed in a map between what is compared with and now. */
  compare(map: string, reference: Reference): Promise<MapChanges>;
  /** The versions of a stretch, from what is compared with there to now, the oldest first. */
  versions(place: Place, from: Uint8Array, to: Uint8Array, reference: Reference): Promise<Version[]>;
  /** Takes back the given pieces of a passage: what was added is taken away, what was removed is put back. */
  revert(passage: Passage, pieces: Piece[]): Promise<void>;
  /** Makes a stretch as it was at a moment again. */
  restore(place: Place, from: Uint8Array, to: Uint8Array, moment: Uint8Array): Promise<void>;
}
