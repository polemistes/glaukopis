/**
 * The Org form of a project, as the writer and the reader of it have it
 * (ADR 0041, section 6): everything that is text or meaning, and nothing
 * that is only for the program's own displays. The module is pure: it
 * reads no words of the interface and no state of the program, so that the
 * thread of the search can read an Org file too.
 */

import type { Block, Inline } from '$lib/project/model/text';
import type {
  DocumentSettings,
  KindRecord,
  PassageKindRecord,
  Position,
  RefRecord,
  Status,
  TimelineSettings,
} from '$lib/project/model/types';
import type { When } from '$lib/timeline/solve';
import type { Template } from '$lib/api/templates';

/** One element of the project: a headline at the depth it has in the tree. */
export interface OrgElement {
  id: string;
  /** The project itself is at depth 0, what stands under it at 1, and so on. */
  depth: number;
  name: Inline[];
  blocks: Block[];
  /** The id of its kind of element (`OrgProject.elementKinds`); written by the kind's name. */
  kind: string | null;
  status: Status | null;
  when: When | null;
  heading: boolean;
  excluded: boolean;
  include: string | null;
  origin: string | null;
  pos: Position | null;
  collapsed: boolean;
  document: DocumentSettings;
  timeline: TimelineSettings | null;
}

/** An association between two elements, written on the element it goes from. */
export interface OrgLink {
  from: string;
  to: string;
  label: string;
}

/** One note of a comment: who wrote it, on which day, and what it says. */
export interface OrgNote {
  /** The name of the one who wrote it. */
  author: string;
  /** The day it was written, as `2026-10-12`; whatever it is, without spaces. */
  date: string;
  text: string;
}

/**
 * A comment on an element, or on words of its text: the first note and the
 * answers to it. Where it stands in the text is not written, only the words
 * it is on; it is found again by those words when a project is made of it.
 */
export interface OrgThread {
  element: string;
  /** The words it is on; nothing for a comment on the element itself. */
  words: string | null;
  resolved: boolean;
  notes: OrgNote[];
}

export interface OrgProject {
  title: string;
  language: string | null;
  /** In tree order, each with its depth; the first is the project itself. */
  elements: OrgElement[];
  elementKinds: KindRecord[];
  paragraphKinds: PassageKindRecord[];
  templates: Record<string, Template>;
  links: OrgLink[];
  comments: OrgThread[];
  /** Written to `references.bib` by the core, not here; used to write citations by their keys. */
  references: RefRecord[];
}

/** What reading and writing a text needs to know of the project it belongs to. */
export interface OrgTextOptions {
  /** The kinds of paragraph and of words of the writer's own: written by their names. */
  paragraphKinds?: PassageKindRecord[];
  /** The references, by whose keys citations are written and read. */
  references?: RefRecord[];
  /**
   * What a cross-reference points to, by its target: a figure, a table, an
   * equation; anything else is taken for an element. Found in the blocks
   * written where not given.
   */
  targets?: Map<string, 'fig' | 'tab' | 'eq'>;
}
