/** What comes from outside: databases, PDF files, Zotero. Mirrors `src-tauri/src/commands/sources.rs`. */

import { listen } from '@tauri-apps/api/event';
import { call, inTauri } from './backend';
import type { Draft, ImportPlan, SummaryLite } from './library';

export type Query =
  | { kind: 'doi'; value: string }
  | { kind: 'isbn'; value: string }
  | { kind: 'arxiv'; value: string }
  | { kind: 'pmid'; value: string }
  | { kind: 'text'; value: string };

export type Scope = 'any' | 'articles' | 'books';

export interface Hit {
  draft: Draft;
  /** The service it came from, as the user is told. */
  source: string;
  /** A page about it at the service. */
  url: string | null;
  /** What the user should know about the record. */
  remarks: string[];
  summary: SummaryLite;
  /** The entry of the library that this is, if it is there already. */
  known: string | null;
}

export interface Found {
  /** What the words were taken to be. */
  query: Query;
  hits: Hit[];
  /** Services that did not answer, in words. */
  failures: string[];
}

export interface ZoteroLibrary {
  id: number;
  name: string;
  kind: 'user' | 'group';
  items: number;
}

export interface ZoteroInfo {
  path: string;
  items: number;
  attachments: number;
  collections: number;
  libraries: ZoteroLibrary[];
  warnings: string[];
}

export interface ZoteroCollection {
  key: string;
  name: string;
  path: string[];
  items: number;
}

export interface ZoteroOptions {
  library: number | null;
  attachments: boolean;
  notes: boolean;
  collection: string | null;
}

export const lookupFind = (input: string, scope: Scope = 'any') =>
  call<Found>('lookup_find', { input, scope });
export const lookupAcknowledgements = () =>
  call<{ service: string; words: string }[]>('lookup_acknowledgements');
/**
 * Finds out what PDF files are. With a ticket, `onPdfsProgress` tells how far
 * it has come, and `importPdfsStop` stops it: it then fails with the kind `stopped`.
 */
export const importPdfs = (paths: string[], ask = true, ticket?: string) =>
  call<ImportPlan>('import_pdfs', { paths, ask, ticket });
export const importPdfsStop = (ticket: string) => call<void>('import_pdfs_stop', { ticket });

/** How many files are done, of how many, and the one at hand. */
export interface PdfsProgress {
  done: number;
  total: number;
  name: string;
}

/** Listens to how far the finding out with a ticket has come. Gives what ends the listening. */
export async function onPdfsProgress(
  ticket: string,
  told: (progress: PdfsProgress) => void,
): Promise<() => void> {
  if (!inTauri) return () => {};
  return listen<PdfsProgress & { ticket: string }>('pdfs-progress', (event) => {
    if (event.payload.ticket === ticket) told(event.payload);
  });
}
export const zoteroFind = () => call<ZoteroInfo[]>('zotero_find');
export const zoteroInspect = (path: string) => call<ZoteroInfo>('zotero_inspect', { path });
export const zoteroCollections = (path: string, library: number | null) =>
  call<ZoteroCollection[]>('zotero_collections', { path, library });
export const importZotero = (path: string, options: ZoteroOptions) =>
  call<ImportPlan>('import_zotero', { path, options });
