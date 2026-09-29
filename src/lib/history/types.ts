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

/**
 * The items of a piece of text in the order of the text: for each run of
 * items one copy made one after another, the copy, the clock of the first,
 * and how many (as many as the signs of the text they stand for, an object
 * one). Positions in the text are made of them: see `positions.ts`.
 */
export type Run = [client: number, clock: number, length: number];

/** A block of text in a map: an element, its name or its text, and the path to the block. */
export interface Place {
  element: string;
  part: 'title' | 'body';
  /**
   * The indices down the tree of blocks in the text: [3] is the fourth
   * block, [3, 1] the second within it (a list item, a row, a cell). A note
   * is within the paragraph it stands in, after it: [3, 'note', 2] is the
   * third note in the fourth block.
   *
   * The indices are those of the tree of Yjs, which is ProseMirror's: a
   * table is [3], what is said of it [3, 0], its rows [3, 1, r], a cell
   * [3, 1, r, c] and a paragraph in it [3, 1, r, c, p]; the paragraph of a
   * list item is [3, i, p]. They count what is there in the later of the two
   * moments compared (now, in `compare`); a block that is there no more has
   * the index it would have: it stood before the block that has that index.
   */
  path: (number | 'note')[];
}

/**
 * Text that a person has accepted, and is compared with there instead of
 * with the moment they review from: from and to as relative positions
 * (`Y.encodeRelativePosition`) in the text it is in, and the items that were
 * to be seen in it when it was accepted.
 *
 * A position is known by the item it is at: before it, or with an `assoc`
 * below nought after it, as Yjs and y-prosemirror make them; one at the end
 * of a text of Yjs, by that text. `positions.ts` makes them of pieces, and
 * `visible` of the pieces as they are (their `items`, which hold what
 * formats them as well).
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
  /**
   * The items it is made of: those of its text, and those of Yjs that
   * format it (an item that formats is counted with the piece after it).
   */
  items: Items;
  /** The items of its text, in the order of the text. */
  runs: Run[];
  /** Of what is in both with its marks changed: who changed them, where that is known. */
  marksBy?: string | null;
  /** Of an object in both that was changed (a citation, a formula): what it was. */
  objectBefore?: TextObject;
}

/** A block of text as it was and as it is, piece by piece, in order. */
export interface Passage {
  place: Place;
  /**
   * The block of Yjs it is, as `client:clock` of its item: the same in
   * every answer, while the path may change as blocks come and go.
   */
  block: string;
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
 * What one person did before a pause: records of the history one after
 * another. Its moment is that after its last record.
 */
export interface Session {
  /** The place of its last record in the history as it is read now: see `History.moment`. */
  last: number;
  /** The place of its first record. */
  first: number;
  person: string | null;
  /** When it began and ended, in milliseconds since 1970. */
  time: number;
  until: number;
  /** How much was written and deleted, in signs. */
  added: number;
  removed: number;
  /** Whether older history was merged here, so that moments within it are gone. */
  merged: boolean;
}

/** A moment that was given a name. Kept in the project (`moments`), for every copy. */
export interface Named {
  id: string;
  name: string;
  moment: Moment;
  /** Who named it. */
  by: string | null;
}

/**
 * What the review keeps of a person in the project, in the map `reviews`
 * by the person's id: the history keeps these moments and items when it
 * keeps older history less finely, and asks before it takes history out
 * that they need.
 */
export interface KeptReview {
  /** `Y.encodeSnapshot` of the moment they review from. */
  moment: Uint8Array;
  accepted: Accepted[];
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
  /**
   * The moment where the history on this computer begins. What changed
   * before it cannot be told apart; a moment before it is compared as it.
   */
  begins(): Promise<Moment>;
  /** What one person did before a pause, the oldest first. */
  sessions(): Promise<Session[]>;
  /** The moment after a record of the history: the `last` of a session. */
  moment(record: number): Promise<Moment>;
  /** The moments that were given a name, the oldest first. */
  named(): Promise<Named[]>;
  /**
   * What changed in a map between what is compared with and now. With
   * `elements`, in those elements alone: quicker, where only they are wanted.
   */
  compare(map: string, reference: Reference, elements?: string[]): Promise<MapChanges>;
  /** The versions of a stretch, from what is compared with there to now, the oldest first. */
  versions(
    place: Place,
    from: Uint8Array,
    to: Uint8Array,
    reference: Reference,
  ): Promise<Version[]>;
  /** Takes back the given pieces of a passage: what was added is taken away, what was removed is put back. */
  revert(passage: Passage, pieces: Piece[]): Promise<void>;
  /** Makes a stretch as it was at a moment again. */
  restore(place: Place, from: Uint8Array, to: Uint8Array, moment: Uint8Array): Promise<void>;
}
