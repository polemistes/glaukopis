/** Text read from PDFs and pictures. Mirrors `commands/ocr.rs`. */

import { listen } from '@tauri-apps/api/event';
import { fileEnding } from '$lib/util/file-name';
import { call, inTauri } from './backend';
import type { Told } from './backend';
import type { Imported } from './imported';
import type { Reference, StoredFile } from './library';

/**
 * How a page is laid out, where Tesseract is told rather than left to judge:
 * one column, one block of text, or text that stands sparse on the page.
 */
export type Layout = '' | 'column' | 'block' | 'sparse';

/** How the pages are read, when the way they are read at first goes badly. */
export interface How {
  /** The dots to the inch the pages are drawn at: 300, 400 or 600; 0 for 300, as before. */
  dpi: number;
  /** How the page is laid out; '' leaves it to Tesseract. */
  layout: Layout;
  /** Whether the picture is made black and white before it is read. */
  contrast: boolean;
}

/** What a reading is asked to do. */
export interface Asked extends How {
  /** Tesseract's names of the languages the text is in, the likeliest first: `nor`, `eng`. */
  languages: string[];
  /**
   * What becomes of the text the PDF has: kept, translated by what its fonts
   * say of their glyphs, or not taken from any page, every page read anew by
   * Tesseract (in a searchable PDF, the old unseen text is then taken away).
   */
  text: TextChoice;
  /**
   * Whether the shape of the pages is kept: headings, lines kept as lines,
   * numbers in the margin, the styles that recur. Without it, plain paragraphs.
   */
  shape: boolean;
  /** With the shape kept: the document's tree by its headings, or an element for each page. */
  structure?: 'headings' | 'pages';
  /** By its headings: whether a mark with the page's number stands where each page begins. */
  pageMarks?: boolean;
}

/** What becomes of the text a PDF has. */
export type TextChoice = 'keep' | 'translate' | 'anew';

/** How a font or a text keeps its letters, where it can be translated (ADR 0044). */
export type Scheme = 'greek-names' | 'expert-names' | 'beta-code';

/** A scheme that applies in a PDF: in which fonts, on how many pages. */
export interface SchemeFound {
  scheme: Scheme;
  fonts: string[];
  pages: number;
}

/** The first lines of the text a page has. */
export interface Sample {
  /** The number the page has in print, or counted from one. */
  page: string;
  /** As the PDF has them. */
  lines: string[];
  /** As translated, where the page has a translation. */
  translated: string[] | null;
}

/** The text of a page, for the preview: as the PDF has it, and as translated. */
export interface PageTextView {
  /** Counted from one. */
  number: number;
  /** The number it has in print, or counted from one. */
  label: string;
  lines: string[];
  translated: string[] | null;
  /** Whether it has text enough to be taken. */
  hasText: boolean;
}

/** How far a reading has come. */
export interface Progress {
  /** The pages that are read, of those that are to be. */
  done: number;
  total: number;
  /** The number of the page that was read last, counted from one. */
  page: number;
}

/** What a file was found to be, before it is read. */
export interface Looked {
  file: string;
  /** Whether it is a picture, and not a PDF. */
  picture: boolean;
  pages: number;
  /** The pages that have text already, which are taken as they are unless all are to be read. */
  withText: number;
  /** Those of them whose text does not read as text, as translated where it can be. */
  poor: number;
  /** The fonts of the text, those with most glyphs first. */
  fonts: string[];
  /** The schemes that apply: how the text keeps its letters, where it can be translated. */
  schemes: SchemeFound[];
  /** The first lines of the first page that has text, to be seen before they are taken. */
  sample: Sample | null;
  /** The title the file gives itself, where it looks like one. */
  title: string | null;
  /** Whether it can be made searchable: a PDF that is not locked, and can be taken apart to be changed. */
  searchable: boolean;
  /** Whether it is locked (encrypted), and cannot be made searchable for that. */
  locked: boolean;
}

/** What came of making a PDF of the library searchable. */
export interface MadeSearchable {
  /** The reference it was asked for, which points to the file that has the text. */
  reference: Reference | null;
  /** The file that has the text, as it stands in the store now. */
  file: StoredFile;
  read: number;
  withText: number;
  /** The pages that could not be read, counted from one, with why. */
  failed: [number, string][];
  /** How many fonts were given their letters, where the text was translated. */
  remapped: number;
}

/** The endings of the names of the pictures whose text is read. */
export const PICTURE_ENDINGS = ['png', 'jpg', 'jpeg', 'tif', 'tiff', 'webp', 'gif', 'bmp'];

/** Whether a file is read by Tesseract when it is brought in: a PDF, or a picture. */
export function isReadPath(path: string): boolean {
  const e = fileEnding(path);
  return e === 'pdf' || PICTURE_ENDINGS.includes(e);
}

/** Looks at a file before it is read: with `stored`, one of the library, by its path in the store. */
export const ocrLook = (path: string, stored = false) => call<Looked>('ocr_look', { path, stored });

/** The text a PDF has, `count` pages from `from` (counted from nought), as it is and as translated. */
export const ocrText = (path: string, stored: boolean, from: number, count: number) =>
  call<PageTextView[]>('ocr_text', { path, stored, from, count });

/**
 * Reads a PDF or a picture, to become a map. With a ticket, it can be stopped
 * and tells how far it has come; with `stored`, the path is one of the library.
 */
export const ocrRead = (path: string, asked: Asked, ticket?: string, stored?: boolean) =>
  call<Imported>('ocr_read', { path, asked, ticket, stored });

export const ocrStop = (ticket: string) => call<void>('ocr_stop', { ticket });

/** Makes a PDF attached to a reference searchable, by its path in the store. */
export const ocrSearchable = (id: string | null, path: string, asked: Asked, ticket?: string) =>
  call<MadeSearchable>('ocr_searchable', { id, path, asked, ticket });

/** Reads the text of a picture of the store. */
export const ocrPicture = (hash: string, asked: Asked, ticket?: string) =>
  call<Imported>('ocr_picture', { hash, asked, ticket });

/** A small picture of a page, for the strip of pages: drawn, or why it could not be. */
export interface PagePicture {
  /** Counted from one. */
  number: number;
  /** The page in grey, as a data URL of a PNG (`data:image/png;base64,…`), where it could be drawn. */
  picture: string | null;
  /** Why it could not be drawn, where it could not. */
  failed: string | null;
}

/**
 * Small pictures of `count` pages of a PDF from `from` (counted from nought),
 * as many as it has, each `width` dots wide, in grey: at most a hundred at a
 * time. With `stored`, the path is one of the library; with a ticket, it can
 * be stopped by `ocrStop`.
 */
export const ocrPages = (
  path: string,
  stored: boolean,
  from: number,
  count: number,
  width: number,
  ticket?: string,
) => call<PagePicture[]>('ocr_pages', { path, stored, from, count, width, ticket });

/** Listens to how far the reading with a ticket has come. Gives what ends the listening. */
export async function onProgress(
  ticket: string,
  told: (progress: Progress) => void,
): Promise<() => void> {
  if (!inTauri) return () => {};
  return listen<Told<Progress>>('ocr-progress', (event) => {
    if (event.payload.ticket === ticket) told(event.payload);
  });
}
