/**
 * What the window knows of the files its sides show (ADR 0069, 0072), by
 * the file, however many tabs show it: its facts once they are fetched, or why they
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

/** The facts of so many files are kept: the files of a few tabs. */
const FILES_KEPT = 12;

class Viewers {
  /** What is known of each file, the one fetched last at the end. */
  #byFile = new SvelteMap<string, Viewed>();
  /** The file each side shows, by the side's key. */
  #sideFile = new SvelteMap<string, string>();

  get(key: string): Viewed | undefined {
    const file = this.#sideFile.get(key);
    return file ? this.#byFile.get(file) : undefined;
  }

  /**
   * Fetches the facts of the file a side shows, a PDF or an image of the
   * library, once for each file however many tabs show it (ADR 0072).
   */
  async fetch(key: string, file: string): Promise<void> {
    if (this.#sideFile.get(key) !== file) this.#sideFile.set(key, file);
    const known = this.#byFile.get(file);
    if (known && (known.facts || known.gone || !known.failure)) return;
    const set = (v: Omit<Viewed, 'file'>) => this.#byFile.set(file, { file, ...v });
    set({ facts: null, image: null, gone: false, failure: null });
    try {
      const facts = await fileFacts(file);
      const image = facts.picture ? { path: await filePath(file) } : null;
      set({ facts, image, gone: false, failure: null });
    } catch (failure) {
      set({ facts: null, image: null, gone: isNotFound(failure), failure });
    }
    const all = [...this.#byFile.keys()];
    const shown = new Set(this.#sideFile.values());
    for (const old of all.slice(0, Math.max(0, all.length - FILES_KEPT)))
      if (!shown.has(old)) this.#byFile.delete(old);
  }

  /** What is known of a file is fetched anew, as when it was changed. */
  refresh(file: string) {
    this.#byFile.delete(file);
  }

  forget(key: string) {
    this.#sideFile.delete(key);
  }
}

export const viewers = new Viewers();
