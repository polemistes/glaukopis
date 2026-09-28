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

export interface Origin {
  map: string;
  node: string;
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

  // Read from the content.
  title: string;
  titleHtml: string;
  empty: boolean;
  words: number;
  cited: string[];
  notes: number;
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
