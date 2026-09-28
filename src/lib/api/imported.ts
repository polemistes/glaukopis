/** Documents that are brought in, to become maps. Mirrors `commands/reading.rs`. */

import type { Block, Inline } from '$lib/project/model/text';
import type { Person } from '$lib/project/model/types';
import { call } from './backend';

/** A part of the document: a heading with what stands under it. */
export interface ImportedSection {
  /** 1 for the parts directly under the title; 0 for what stands before the first heading. */
  level: number;
  heading: Inline[];
  blocks: Block[];
}

export interface ImportedCounts {
  /** The parts that have a heading. */
  parts: number;
  words: number;
  notes: number;
  figures: number;
  tables: number;
  equations: number;
  /** Works cited that are in the library, as often as they are cited. */
  cited: number;
  /** Works cited by keys that the library does not have, as often as they are cited. */
  notFound: number;
}

/** A document as it was read. See `crates/core/src/import/document.rs`. */
export interface Imported {
  /** What the file is called. */
  file: string;
  /** The kind of file, in words. */
  kind: string;
  title: Inline[];
  subtitle: string | null;
  authors: Person[];
  date: string | null;
  abstract: string | null;
  keywords: string[];
  language: string | null;
  sections: ImportedSection[];
  /** What the one who brings the document in should know. */
  remarks: string[];
  counts: ImportedCounts;
  /** The pictures that were taken into the store for this document and were not there before. */
  pictures: string[];
}

/** The endings of the files that are taken for documents when they are dropped. */
export const DOCUMENT_ENDINGS = [
  'docx',
  'odt',
  'md',
  'markdown',
  'mdown',
  'mkd',
  'html',
  'htm',
  'xhtml',
  'tex',
  'latex',
  'ltx',
  'rtf',
  'epub',
  'org',
  'rst',
  'typ',
];

/** Those that can be chosen besides: read, and less often met. */
export const OTHER_ENDINGS = [
  'txt',
  'text',
  'adoc',
  'asciidoc',
  'dbk',
  'docbook',
  'jats',
  'fb2',
  'opml',
  'mediawiki',
  'wiki',
  'textile',
  'dj',
  'djot',
  'muse',
  'ipynb',
];

const ending = (path: string) => path.split(/[\\/]/).pop()?.split('.').pop()?.toLowerCase() ?? '';

/** Whether a file is taken for a document by its name. */
export function isDocumentPath(path: string): boolean {
  return path.includes('.') && DOCUMENT_ENDINGS.includes(ending(path));
}

/** Text without marks: a document when nothing else claims the file. */
export function isPlainTextPath(path: string): boolean {
  return ['txt', 'text'].includes(ending(path));
}

/** Reads a document. With a ticket, the reading can be stopped while it goes on. */
export const documentRead = (path: string, ticket?: string) =>
  call<Imported>('document_read', { path, ticket });

export const documentReadStop = (ticket: string) => call<void>('document_read_stop', { ticket });

/** Takes out of the store the pictures that were taken in for a document of which no map is made. */
export const documentForget = (pictures: string[]) => call<void>('document_forget', { pictures });
