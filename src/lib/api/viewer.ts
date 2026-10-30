/**
 * A file of the library shown in a side of the window (ADR 0069, 0072): what
 * the core tells of it, a page drawn at a width as the bytes of a PNG, and
 * the lines of a page with their places. Mirrors
 * `src-tauri/src/commands/viewer.rs`.
 */

import { invoke } from '@tauri-apps/api/core';
import { t } from '$lib/i18n';
import { call, inTauri } from './backend';

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
  /** The contents the file carries of its own headings, in their order (ADR 0072). */
  outline: ContentsEntry[];
}

/** An entry of a file's own contents. */
export interface ContentsEntry {
  title: string;
  /** The page it leads to, counted from one. */
  page: number;
  /** How deep it stands, 1 at the top. */
  depth: number;
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
 * A page of a PDF or an image of the library, counted from one, drawn
 * `width` dots wide in colour, as the bytes of a PNG: from the cache where
 * it was drawn before. With a ticket, it can be stopped by `ocrStop`. A page
 * that could not be drawn is an error that says why.
 */
export async function filePage(
  hash: string,
  page: number,
  width: number,
  ticket?: string,
): Promise<ArrayBuffer> {
  if (!inTauri) throw { kind: 'no-backend', message: t('ui-no-backend') };
  return invoke<ArrayBuffer>('file_page', { hash, page, width, ticket });
}

/** The lines of a page of a PDF of the library, counted from one. */
export const filePageLines = (hash: string, page: number) =>
  call<PageLines>('file_page_lines', { hash, page });

/**
 * Says that a view still shows the file, so that the process that keeps it
 * open and draws its pages is not ended as idle while it is read: whether
 * one does keep it open.
 */
export const fileKeep = (hash: string) => call<boolean>('file_keep', { hash });
