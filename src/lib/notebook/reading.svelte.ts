/**
 * Words read from the images of notes (`docs/plans/the-notebook.md`,
 * "Finding" and stage 4): read when asked for, never by themselves, with
 * the reading of text Glaukopis has, in the languages the settings choose
 * as the window of the reading chooses them; one image after another, said
 * in a line at the foot of the window that can stop it; what was read kept
 * with the notebook's record of the file, in the place of what was read
 * before, and found by the field that finds. Where Tesseract is not
 * installed, or has no language, it is said as the reading of text says
 * it, and nothing is read.
 *
 * An image a note holds lies in the library's store, but the library may
 * not list it: one the library lists is read by its hash, as the window of
 * the reading reads a picture; one the notebook holds alone by its place
 * in the store.
 */

import { isBackendError } from '$lib/api/backend';
import type { Imported } from '$lib/api/imported';
import { notebookFile } from '$lib/api/notebook';
import { ocrPicture, ocrStop, ocrTry, PICTURE_ENDINGS, type Asked, type Tried } from '$lib/api/ocr';
import { languages, newTextLanguage, t } from '$lib/i18n';
import { howFromSettings } from '$lib/ocr/how';
import { reader } from '$lib/ocr/reader.svelte';
import { inlineText } from '$lib/project/model/text';
import { notifyError, notifyOk } from '$lib/ui/toast.svelte';
import { newId } from '$lib/util/id';
import type { Notebook } from './model/notebook.svelte';
import { eachBlock } from './model/pieces';
import type { NoteRecord } from './model/types';

/** An image a note holds, which can be read: by the hash of the file a figure shows, and its name. */
export interface NoteImage {
  hash: string;
  name: string;
}

/** The images notes hold that the reading of text can read, each once, in the order they stand. */
export function imagesOf(notes: readonly NoteRecord[]): NoteImage[] {
  const out: NoteImage[] = [];
  const seen = new Set<string>();
  for (const note of notes)
    for (const piece of note.pieces) {
      if (piece.kind === 'file') continue;
      eachBlock(piece.blocks, (b) => {
        if (b.kind !== 'figure' || !b.file || seen.has(b.file)) return;
        if (!PICTURE_ENDINGS.includes(b.extension.toLowerCase())) return;
        seen.add(b.file);
        out.push({ hash: b.file, name: b.name });
      });
    }
  return out;
}

/** The words of a picture read by its hash, as plain text: a line to a paragraph. */
export function textOfImported(read: Imported): string {
  return read.sections
    .flatMap((s) => s.blocks)
    .map((b) => (b.kind === 'paragraph' ? inlineText(b.content).trim() : ''))
    .filter(Boolean)
    .join('\n');
}

/** The words of a picture tried as one page, as plain text: its lines as Tesseract found them. */
export function textOfTried(tried: Tried): string {
  const lines: string[] = [];
  for (const paragraph of tried.paragraphs) {
    let line = '';
    for (const word of paragraph) {
      if (word.line && line) {
        lines.push(line);
        line = '';
      }
      line = line ? `${line} ${word.text}` : word.text;
    }
    if (line) lines.push(line);
  }
  return lines
    .map((l) => l.trim())
    .filter(Boolean)
    .join('\n');
}

/** What the reading is doing: the image being read, and how far it has come. */
export interface ReadingNow {
  name: string;
  /** How many have been read before this one. */
  done: number;
  count: number;
}

class ImageReading {
  /** What is being read; none while nothing is. */
  now = $state<ReadingNow | null>(null);
  #ticket: string | null = null;
  #stopped = false;

  get busy(): boolean {
    return this.now !== null;
  }

  /** Stops the reading: the image being read is let go, and those after it are not read. */
  stop() {
    this.#stopped = true;
    const ticket = this.#ticket;
    if (ticket)
      ocrStop(ticket).catch((error) => console.error('the reading could not be stopped', error));
  }

  /**
   * Reads the images, one after another, and keeps what was read of each
   * with the notebook's record of it. Gives how many were read; none where
   * nothing could be, as where Tesseract is not installed.
   */
  async read(notebook: Notebook, images: NoteImage[]): Promise<number> {
    if (!images.length || this.busy) return 0;
    const tools = await reader.load();
    if (!tools?.tesseract) {
      notifyError(t('ocr-no-tesseract'));
      return 0;
    }
    const chosen = reader.first(newTextLanguage(), languages.current);
    if (!chosen.length) {
      notifyError(t('ocr-no-languages'));
      return 0;
    }
    const asked: Asked = { languages: chosen, text: 'keep', shape: false, ...howFromSettings() };
    this.#stopped = false;
    let read = 0;
    try {
      for (const [i, image] of images.entries()) {
        if (this.#stopped || notebook.closed) break;
        this.now = { name: image.name, done: i, count: images.length };
        const ticket = newId();
        this.#ticket = ticket;
        try {
          const text = await readImage(image.hash, asked, ticket);
          if (this.#stopped || notebook.closed) break;
          notebook.setFileText(image.hash, text);
          read++;
        } catch (error) {
          if (isBackendError(error) && error.kind === 'stopped') break;
          if (isBackendError(error) && error.kind === 'missing-program') {
            notifyError(t('ocr-no-tesseract'));
            break;
          }
          notifyError(t('notebook-read-failed', { name: image.name }), error);
        }
      }
    } finally {
      this.now = null;
      this.#ticket = null;
    }
    if (read && !this.#stopped) notifyOk(t('notebook-read-done', { count: read }));
    return read;
  }
}

/** Reads one image of the store: by its hash where the library lists it, else by its place in the store. */
async function readImage(hash: string, asked: Asked, ticket: string): Promise<string> {
  try {
    return textOfImported(await ocrPicture(hash, asked, ticket));
  } catch (error) {
    if (!(isBackendError(error) && error.kind === 'not-found')) throw error;
  }
  const file = await notebookFile(hash);
  return textOfTried(await ocrTry(file.path, true, 1, asked, ticket));
}

export const imageReading = new ImageReading();
