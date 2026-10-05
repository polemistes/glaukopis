/** The reference library. Mirrors `src-tauri/src/commands/library.rs` and `import.rs`. */

import { call } from './backend';

export interface Person {
  family: string;
  given?: string;
  prefix?: string;
  suffix?: string;
  /** An institution, or any name that is not to be inverted. */
  literal?: boolean;
}

export interface Summary {
  id: string;
  key: string;
  type: string;
  authors: string;
  authorsSort: string;
  year: string;
  yearNumber: number | null;
  title: string;
  container: string;
  /** The publisher, or the institution or organisation that stands for one. */
  publisher: string;
  attachments: number;
  /** Whether the user has written something about the work, for all projects. */
  hasNote: boolean;
  added: string;
  modified: string;
  /** Folded text for searching. */
  search: string;
}

export interface StoredFile {
  path: string;
  name: string;
  size: number;
  exists: boolean;
  hash: string;
}

export interface Reference {
  id: string;
  key: string;
  type: string;
  fields: Record<string, string>;
  names: Record<string, Person[]>;
  attachments: string[];
  added: string;
  modified: string;
  summary: Summary;
  files: StoredFile[];
  collections: string[];
}

export interface Draft {
  key: string;
  type: string;
  fields: Record<string, string>;
  names: Record<string, Person[]>;
}

export interface Collection {
  id: string;
  name: string;
  parent: string | null;
  entries: string[];
  created: string;
}

export interface LibraryListing {
  entries: Summary[];
  collections: Collection[];
  warnings: string[];
  file: string;
}

export type Certainty = 'certain' | 'probable';
/** How far two references agree in one of what tells works apart. */
export type Agreement = 'same' | 'like' | 'none';
export type Reason =
  | 'doi'
  | 'isbn'
  | 'identical'
  | 'file'
  | { alike: { title: Agreement; author: Agreement; year: Agreement } };

export interface SummaryLite {
  key: string;
  type: string;
  authors: string;
  year: string;
  title: string;
  container: string;
}

export interface Match {
  id: string;
  certainty: Certainty;
  reasons: Reason[];
  summary: SummaryLite;
  gains: string[];
}

export interface DuplicateGroup {
  ids: string[];
  certainty: Certainty;
  reasons: Reason[];
}

export interface Candidate {
  draft: Draft;
  files: string[];
  origin: string;
  collections: string[][];
  notes: string[];
}

export type ImportAction = { kind: 'add' } | { kind: 'skip' } | { kind: 'merge'; into: string };

export interface PlanItem {
  candidate: Candidate;
  summary: SummaryLite;
  matches: Match[];
  repeats: number | null;
  action: ImportAction;
}

export interface ImportPlan {
  source: string;
  items: PlanItem[];
  warnings: string[];
}

export interface ImportOutcome {
  added: string[];
  updated: string[];
  /** Added by the interface: every reference the import was about, also those that were there already. */
  concerned?: string[];
  skipped: number;
  files: number;
  problems: string[];
}

export function emptyDraft(type = 'book'): Draft {
  return { key: '', type, fields: {}, names: {} };
}

export function draftOf(reference: Reference): Draft {
  return {
    key: reference.key,
    type: reference.type,
    fields: { ...reference.fields },
    names: Object.fromEntries(
      Object.entries(reference.names).map(([k, v]) => [k, v.map((p) => ({ ...p }))]),
    ),
  };
}

export const libraryList = () => call<LibraryListing>('library_list');
export const libraryRefresh = () => call<LibraryListing | null>('library_refresh');
export const libraryGet = (id: string) => call<Reference>('library_get', { id });
export const libraryGetMany = (ids: string[]) => call<Reference[]>('library_get_many', { ids });
export const libraryAdd = (draft: Draft) => call<Reference>('library_add', { draft });
export const libraryUpdate = (id: string, draft: Draft) =>
  call<Reference>('library_update', { id, draft });
/** Gives a reference the keys of what it is in Zotero, which it may lack. */
export const libraryAddZoteroKeys = (id: string, keys: string[]) =>
  call<Reference>('library_add_zotero_keys', { id, keys });
export const librarySetNote = (id: string, text: string) =>
  call<Reference>('library_set_note', { id, text });
export const libraryRemove = (ids: string[]) => call<number>('library_remove', { ids });
export const librarySource = (id: string) => call<string>('library_source', { id });
export const libraryUpdateSource = (id: string, source: string) =>
  call<Reference>('library_update_source', { id, source });
export const libraryDraftSource = (draft: Draft) => call<string>('library_draft_source', { draft });
export const libraryParseSource = (source: string) =>
  call<Draft>('library_parse_source', { source });
export const librarySuggestKey = (draft: Draft, except?: string) =>
  call<string>('library_suggest_key', { draft, except: except ?? null });
export const libraryFindMatches = (draft: Draft, except?: string) =>
  call<Match[]>('library_find_matches', { draft, except: except ?? null });
export const libraryDuplicates = () => call<DuplicateGroup[]>('library_duplicates');
export const libraryMergePreview = (kept: string, absorbed: string) =>
  call<Draft>('library_merge_preview', { kept, absorbed });
export const libraryMerge = (kept: string, absorbed: string, draft: Draft) =>
  call<Reference>('library_merge', { kept, absorbed, draft });
export const libraryExport = (path: string, ids: string[] | null, withFiles = false) =>
  call<number>('library_export', { path, ids, withFiles });

export const collectionCreate = (name: string, parent: string | null) =>
  call<Collection>('collection_create', { name, parent });
export const collectionRename = (id: string, name: string) =>
  call<void>('collection_rename', { id, name });
export const collectionMove = (id: string, parent: string | null) =>
  call<void>('collection_move', { id, parent });
export const collectionDelete = (id: string) => call<void>('collection_delete', { id });
export const collectionAdd = (id: string, entries: string[]) =>
  call<number>('collection_add', { id, entries });
export const collectionRemove = (id: string, entries: string[]) =>
  call<void>('collection_remove', { id, entries });
export const collectionList = () => call<Collection[]>('collection_list');

export const attachmentAdd = (id: string, paths: string[]) =>
  call<Reference>('attachment_add', { id, paths });
export const attachmentRemove = (id: string, path: string) =>
  call<Reference>('attachment_remove', { id, path });
export const attachmentOpen = (path: string) => call<void>('attachment_open', { path });
export const attachmentReveal = (path: string) => call<void>('attachment_reveal', { path });

export const importBibFile = (path: string) => call<ImportPlan>('import_bib_file', { path });
export const importBibText = (text: string) => call<ImportPlan>('import_bib_text', { text });
export const importApply = (plan: ImportPlan) => call<ImportOutcome>('import_apply', { plan });
