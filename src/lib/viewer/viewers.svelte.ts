/**
 * What the window knows of the files its sides show (ADR 0069), by the key
 * of the side: the facts of the file once they are fetched, or why they
 * could not be. The path over a side reads its name and count of pages here;
 * the side fetches them.
 */

import { SvelteMap } from 'svelte/reactivity';
import { isNotFound } from '$lib/api/backend';
import { filePath } from '$lib/api/files';
import { fileFacts, type FileFacts } from '$lib/api/viewer';

/** Where an image is read from: its file in the library, by its path. */
export type ImageSource = { path: string };

export interface Viewed {
  /** The hash of the file. */
  file: string;
  facts: FileFacts | null;
  /** Where its picture is read from, for an image. */
  image: ImageSource | null;
  /** The file is no longer in the library. */
  gone: boolean;
  /** Why the facts could not be fetched, otherwise. */
  failure: unknown;
}

class Viewers {
  #by = new SvelteMap<string, Viewed>();

  get(key: string): Viewed | undefined {
    return this.#by.get(key);
  }

  /**
   * Fetches the facts of a side's file, once for each file it shows: a PDF
   * or an image of the library.
   */
  async fetch(key: string, file: string): Promise<void> {
    const known = this.#by.get(key);
    if (known && known.file === file && (known.facts || known.gone)) return;
    const set = (v: Omit<Viewed, 'file'>) => {
      if (this.#by.get(key)?.file === file) this.#by.set(key, { file, ...v });
    };
    this.#by.set(key, { file, facts: null, image: null, gone: false, failure: null });
    try {
      const facts = await fileFacts(file);
      const image = facts.picture ? { path: await filePath(file) } : null;
      set({ facts, image, gone: false, failure: null });
    } catch (failure) {
      set({ facts: null, image: null, gone: isNotFound(failure), failure });
    }
  }

  forget(key: string) {
    this.#by.delete(key);
  }
}

export const viewers = new Viewers();
