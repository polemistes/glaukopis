/**
 * A file of the library shown in a side of the window (ADR 0069): what the
 * core tells of it, its pages drawn at a width, and the lines of a page with
 * their places. Mirrors `src-tauri/src/commands/viewer.rs`.
 */

import { call } from './backend';

/** What is known of a file before its pages are drawn. */
export interface FileFacts {
  /** What it is called in the library. */
  name: string;
  /** Whether it is a picture, shown as its one page, and not a PDF. */
  picture: boolean;
  /** How many pages; 1 for a picture. */
  pages: number;
  /** The size of each page, in points; of a picture, in its pixels. */
  sizes: [number, number][];
  /** The number each page has in print, where the file tells it; its count, from one, where it does not. */
  labels: string[];
  /** Whether it asks for a password, and cannot be shown. */
  locked: boolean;
}

/** A page drawn at a width, or why it could not be. */
export interface PageAt {
  /** Counted from one. */
  number: number;
  /** The page in colour, as a data URL of a PNG (`data:image/png;base64,…`), where it could be drawn. */
  png: string | null;
  /** Why it could not be drawn, where it could not. */
  failed: string | null;
}

/** A line of the text a page has, and where it stands, in points from the top left of the page. */
export interface PageLine {
  text: string;
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/** The text a page has, as lines with their places. */
export interface PageLines {
  /** Counted from one. */
  number: number;
  /** The number it has in print. */
  label: string;
  /** The size of the page, in points: what the places are counted in. */
  width: number;
  height: number;
  /** In the order they stand; none for a page without text, or a picture. */
  lines: PageLine[];
}

/** What is known of a file of the library, by its hash: `not-found` where the library has it no longer. */
export const fileFacts = (hash: string) => call<FileFacts>('file_facts', { hash });

/**
 * Pages of a PDF of the library, counted from one, each drawn `width` dots
 * wide, in colour: from the cache where they were drawn before. With a
 * ticket, it can be stopped by `ocrStop`.
 */
export const filePages = (hash: string, pages: number[], width: number, ticket?: string) =>
  call<PageAt[]>('file_pages', { hash, pages, width, ticket });

/** The lines of a page of a PDF of the library, counted from one. */
export const filePageLines = (hash: string, page: number) =>
  call<PageLines>('file_page_lines', { hash, page });
