/** Text read from PDFs and pictures. Mirrors `commands/ocr.rs`. */

import { listen } from '@tauri-apps/api/event';
import { call, inTauri } from './backend';
import type { Imported } from './imported';
import type { Reference } from './library';

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
  /** Whether the pages that have text already are read as well. */
  all: boolean;
  /**
   * Only with `all`, for a PDF made searchable: the text the pages have is
   * taken away, and only what is read stays.
   */
  strip: boolean;
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
  /** The title the file gives itself, where it looks like one. */
  title: string | null;
  /** Whether it can be made searchable: a PDF that is not locked, and can be taken apart to be changed. */
  searchable: boolean;
  /** Whether it is locked (encrypted), and cannot be made searchable for that. */
  locked: boolean;
}

/** What came of making a PDF of the library searchable. */
export interface MadeSearchable {
  /** The reference, which points to the file that has the text. */
  reference: Reference;
  read: number;
  withText: number;
  /** The pages that could not be read, counted from one, with why. */
  failed: [number, string][];
}

/** The endings of the names of the pictures whose text is read. */
export const PICTURE_ENDINGS = ['png', 'jpg', 'jpeg', 'tif', 'tiff', 'webp', 'gif', 'bmp'];

const ending = (path: string) => path.split(/[\\/]/).pop()?.split('.').pop()?.toLowerCase() ?? '';

/** Whether a file is read by Tesseract when it is brought in: a PDF, or a picture. */
export function isReadPath(path: string): boolean {
  const e = ending(path);
  return path.includes('.') && (e === 'pdf' || PICTURE_ENDINGS.includes(e));
}

/** Looks at a file before it is read: with `stored`, one of the library, by its path in the store. */
export const ocrLook = (path: string, stored = false) => call<Looked>('ocr_look', { path, stored });

/**
 * Reads a PDF or a picture, to become a map. With a ticket, it can be stopped
 * and tells how far it has come; with `stored`, the path is one of the library.
 */
export const ocrRead = (path: string, asked: Asked, ticket?: string, stored?: boolean) =>
  call<Imported>('ocr_read', { path, asked, ticket, stored });

export const ocrStop = (ticket: string) => call<void>('ocr_stop', { ticket });

/** Makes a PDF attached to a reference searchable, by its path in the store. */
export const ocrSearchable = (id: string, path: string, asked: Asked, ticket?: string) =>
  call<MadeSearchable>('ocr_searchable', { id, path, asked, ticket });

/** Reads the text of a picture of the store. */
export const ocrPicture = (hash: string, asked: Asked, ticket?: string) =>
  call<Imported>('ocr_picture', { hash, asked, ticket });

/** Listens to how far the reading with a ticket has come. Gives what ends the listening. */
export async function onProgress(
  ticket: string,
  told: (progress: Progress) => void,
): Promise<() => void> {
  if (!inTauri) return () => {};
  return listen<Progress & { ticket: string }>('ocr-progress', (event) => {
    if (event.payload.ticket === ticket) told(event.payload);
  });
}
