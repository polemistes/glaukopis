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
   * Whether the shape of the pages is found as they are read: headings, lines
   * kept as lines, numbers in the margin, the styles that recur. What is made
   * of it is chosen after the reading (`Making`).
   */
  shape: boolean;
  /**
   * Stretches of the pages read with settings of their own, in the order of
   * their pages; the pages before the first are read with the settings of
   * the whole.
   */
  stretches?: Stretch[];
  /**
   * The pages Tesseract reads, counted from one. Where given, exactly these,
   * and any page without text, which cannot take what is not there; the
   * others take the text the PDF has, as `text` says. Where not given, as
   * `text` says for every page: all with `anew`, those without text otherwise.
   */
  read?: number[] | null;
}

/** A stretch of a PDF's pages read with settings of their own, to the next stretch or the end. */
export interface Stretch extends How {
  /** The page it begins at, counted from one. */
  from: number;
  languages: string[];
}

/** What is made of a reading kept: the shape kept or plain paragraphs, the tree by its headings or its pages, the marks where pages begin. */
export interface Making {
  shape: boolean;
  structure: 'headings' | 'pages';
  pageMarks: boolean;
}

/** What a reading into elements came to: the tree as first made, and the token of the reading kept, where there is one (a PDF). */
export interface ReadDone {
  imported: Imported;
  kept: string | null;
}

/** What becomes of the text a PDF has. */
export type TextChoice = 'keep' | 'translate' | 'anew';

/** What the text a page has is like: none worth taking, text that does not read as text, or sound. */
export type Verdict = 'none' | 'poor' | 'sound';

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
  /** The dots to the inch of its pages, where they are pictures, as scans are. */
  resolution: number | null;
  /** The first page without text, counted from one; nothing where every page has text. */
  firstWithoutText: number | null;
  /** The top entries of the outline the file carries, with the pages they lead to: where stretches may begin. */
  outline: OutlinePart[];
  /** Each page's verdict, in the order of the pages; empty for a picture. */
  verdicts: Verdict[];
}

/** An entry of the top of a file's outline, and the page it leads to, counted from one. */
export interface OutlinePart {
  title: string;
  page: number;
}

/** A page tried before a PDF is read: what Tesseract read of it, how sure it was, and the picture it read. */
export interface Tried {
  /** Counted from one. */
  page: number;
  /** The number it has in print, or counted from one. */
  label: string;
  /** What was read, as paragraphs of words, in the order read. */
  paragraphs: TriedWord[][];
  /** How many words, and how many of them unsure (a confidence under 70). */
  words: number;
  unsure: number;
  /** How sure Tesseract was of the page, from 0 to 100; nothing where it read no word. */
  confidence: number | null;
  /** Whether it was read poorly: under 80. */
  poorly: boolean;
  /** The picture Tesseract read, made smaller to be shown: PNG in base64. */
  png: string;
  width: number;
  height: number;
  /** The blocks of text Tesseract found, in the order it read them, in the dots of the picture as shown. */
  blocks: TextBlock[];
}

/** A word Tesseract read on a page tried, in the dots of the picture as shown. */
export interface TriedWord {
  text: string;
  /** From 0 to 100; nothing where Tesseract gave none. */
  confidence: number | null;
  left: number;
  top: number;
  width: number;
  height: number;
  /** Whether a line of the paragraph begins with it. */
  line: boolean;
}

/** A block of text as Tesseract found it on a page. */
export interface TextBlock {
  left: number;
  top: number;
  width: number;
  height: number;
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
  /** The pages Tesseract read poorly, counted from one. */
  poorly: number[];
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
  call<ReadDone>('ocr_read', { path, asked, ticket, stored });

/**
 * The tree assembled anew from a reading kept, with other choices; the reading
 * is not done again. One reading is kept at a time: where another has taken
 * its place, or it was let go, this fails with the kind `not-found`.
 */
export const ocrAssemble = (kept: string, making: Making) =>
  call<Imported>('ocr_assemble', { kept, making });

/** Lets a reading kept go; nothing, where another has taken its place. */
export const ocrForget = (kept: string) => call<void>('ocr_forget', { kept });

export const ocrStop = (ticket: string) => call<void>('ocr_stop', { ticket });

/**
 * Tries a page, counted from one, with the languages and settings that hold
 * for it, before the whole is read; a picture as its one page.
 */
export const ocrTry = (
  path: string,
  stored: boolean,
  page: number,
  asked: Asked,
  ticket?: string,
) => call<Tried>('ocr_try', { path, stored, page, asked, ticket });

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
