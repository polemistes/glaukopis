/**
 * Templates: what a document of a kind consists of (ADR 0038). Mirrors
 * `commands/templates.rs` and `crates/core/src/templates/`.
 */

import { call } from './backend';
import type { Align } from './documents';

export type TemplateGroup =
  | 'plain'
  | 'article'
  | 'book'
  | 'fiction'
  | 'stage'
  | 'poetry'
  | 'other'
  | 'journal'
  | 'publisher'
  | 'style-guide'
  | 'own';

/** The parts of a document the core makes itself, by what the settings and the text hold. */
export type GeneratedPart =
  | 'half-title'
  | 'title-page'
  | 'keywords'
  | 'contents'
  | 'list-of-figures'
  | 'list-of-tables'
  | 'body'
  | 'notes'
  | 'bibliography';

/** One item of the order of a document: a generated part, or every element of a kind. */
export type ContentsItem = { part: GeneratedPart } | { kind: string };

export interface Requirements {
  words: number | null;
  abstractWords: number | null;
  keywords: number | null;
  /** The authors are not to be named: for review. */
  anonymous: boolean;
  note: string;
}

export type OutputTarget =
  'pdf' | 'pdf-latex' | 'docx' | 'odt' | 'latex' | 'typst' | 'markdown' | 'html' | 'epub';

/** A file the template makes: the document itself, or a cover (a later piece). */
export interface Output {
  id: string;
  /** Nothing for the document itself, which is named by the interface. */
  name?: string;
  targets: OutputTarget[];
  /** A layout of its own; nothing for the document's. */
  layout?: string;
  /** The places it prints: nothing for front, body and back. */
  places?: PartPlace[];
}

export interface TemplateSummary {
  id: string;
  name: string;
  group: TemplateGroup;
  description: string;
  own: boolean;
  confidence: string;
  checked: string;
  /** What it was made from: the template it is based on. */
  basedOn?: string;
}

/** A template whole: what a built-in one leaves to its base is filled in by the core on reading. */
export interface Template {
  id: string;
  name: string;
  group: TemplateGroup;
  description: string;
  source?: { name: string; url: string; checked: string; confidence: string; notes: string };
  /** What it was made from. */
  basedOn?: string;
  /** The layout (format) it brings; nothing for the writer's usual. */
  layout?: string;
  /** The reference style it brings; nothing for the writer's usual. */
  style?: string;
  contents: ContentsItem[];
  /** The kinds of elements it puts in hand, by catalogue id. */
  kinds: string[];
  /** The kinds of paragraph and of words it puts in hand, by id. */
  passageKinds: string[];
  /**
   * The kinds of paragraph Ctrl+Alt with a digit gives, by the digit, "1"
   * to "9" (ADR 0066); Ctrl+Alt+0 is text, said or not. Nothing where no
   * digit gives a kind.
   */
  kindKeys?: Record<string, string>;
  requirements: Requirements;
  outputs: Output[];
}

// ---- the catalogue of kinds of elements that make a document ----

export type PartPlace = 'front' | 'back' | 'here' | 'cover' | 'none';
export type PartGroup = 'front' | 'back' | 'cover';

/** How a part kind differs from the kind it is based on; what is not said is as the base has it. */
export interface PartLook {
  /** Whether the element's name is printed as a heading. */
  heading?: boolean;
  /** On a page of its own. */
  ownPage?: boolean;
  newPage?: boolean;
  align?: Align;
  italic?: boolean;
  /** In points; 0 for the size of the text. */
  size?: number;
  /** Numbered by letters, as appendices are. */
  lettered?: boolean;
}

/** A kind of element of the catalogue, as the core has it: see `templates/kinds.rs`. */
export interface PartKindEntry {
  id: string;
  group: PartGroup;
  basedOn: string | null;
  place: PartPlace;
  /** Whether a document has one of it, or many. */
  one: boolean;
  /** The name of its style in Word and Writer. */
  style: string;
  look: PartLook;
}

export const templatesList = () => call<TemplateSummary[]>('templates_list');
export const templatesGet = (id: string) => call<Template>('templates_get', { id });
export const templatesSave = (template: Template) => call<Template>('templates_save', { template });
export const templatesDelete = (id: string) => call<void>('templates_delete', { id });
