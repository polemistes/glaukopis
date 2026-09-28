/**
 * The pictures of the project that is open, as the window shows them.
 *
 * A picture is named by what it holds. It is read from the disk once and
 * shown from memory after that. One that is not there, as when a figure was
 * added by someone else a moment ago, is asked for from the server, and
 * shown when it has come.
 */

import { SvelteMap } from 'svelte/reactivity';
import {
  pictureAdd,
  pictureAddFile,
  pictureRead,
  pictureSync,
  type Picture,
} from '$lib/api/pictures';
import { notify, notifyError } from '$lib/ui/toast.svelte';

/** The address of a picture in memory, or why there is none. */
export type Shown = { url: string; state: 'shown' } | { url: null; state: 'reading' | 'absent' };

const TYPES: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  svg: 'image/svg+xml',
};

/** The endings of files that are taken for pictures when they are dropped. */
export const PICTURE_ENDINGS = ['png', 'jpg', 'jpeg', 'svg', 'gif', 'webp', 'tif', 'tiff', 'bmp'];

export function isPicturePath(path: string): boolean {
  const ending = path.split('.').pop()?.toLowerCase() ?? '';
  return PICTURE_ENDINGS.includes(ending);
}

export function isPictureName(hash: unknown, extension: unknown): boolean {
  return (
    typeof hash === 'string' &&
    /^[0-9a-f]{64}$/.test(hash) &&
    typeof extension === 'string' &&
    extension in TYPES
  );
}

class Pictures {
  /** The id of the project that is open, by which its pictures are found. */
  #project: string | null = null;
  /** Whether the project is shared, so that pictures can come from elsewhere. */
  shared = false;
  readonly #shown = new SvelteMap<string, Shown>();
  #syncing: Promise<void> | null = null;
  #again = false;
  #said = new Set<string>();
  /** How often each picture that is not there has been asked for again. */
  #tries = new Map<string, number>();

  get project(): string | null {
    return this.#project;
  }

  open(project: string | null) {
    if (project === this.#project) return;
    for (const s of this.#shown.values()) if (s.url) URL.revokeObjectURL(s.url);
    this.#shown.clear();
    this.#said.clear();
    this.#tries.clear();
    this.#project = project;
    this.shared = false;
  }

  /**
   * The picture as it can be shown. Read where it is shown: what reads it is
   * told when the picture has come.
   */
  of(hash: string, extension: string): Shown {
    if (!this.#project || !isPictureName(hash, extension)) return { url: null, state: 'absent' };
    const key = `${hash}.${extension}`;
    const known = this.#shown.get(key);
    if (known) return known;
    const reading: Shown = { url: null, state: 'reading' };
    // Not while something is being shown: what is set here is read there.
    queueMicrotask(() => {
      if (this.#shown.has(key)) return;
      this.#shown.set(key, reading);
      void this.#read(this.#project, hash, extension);
    });
    return reading;
  }

  async #read(project: string | null, hash: string, extension: string, asked = false) {
    if (!project) return;
    const key = `${hash}.${extension}`;
    try {
      const bytes = await pictureRead(project, hash, extension);
      if (project !== this.#project) return;
      const url = URL.createObjectURL(new Blob([bytes], { type: TYPES[extension] }));
      this.#shown.set(key, { url, state: 'shown' });
    } catch {
      if (project !== this.#project) return;
      this.#shown.set(key, { url: null, state: 'absent' });
      // It may be with the others.
      if (this.shared && !asked) {
        await this.sync();
        if (project === this.#project && !this.#shown.get(key)?.url)
          await this.#read(project, hash, extension, true);
      }
      if (this.shared && !this.#shown.get(key)?.url) this.#later(project, key);
    }
  }

  /**
   * The one who put a picture into the text may still be sending it when the
   * text has arrived: it is asked for again, at longer and longer intervals.
   */
  #later(project: string, key: string) {
    const tries = this.#tries.get(key) ?? 0;
    if (tries >= 8) return;
    this.#tries.set(key, tries + 1);
    setTimeout(
      async () => {
        if (project !== this.#project || this.#shown.get(key)?.url) return;
        const [hash, extension] = key.split('.');
        await this.sync();
        if (project === this.#project && !this.#shown.get(key)?.url)
          await this.#read(project, hash, extension, true);
      },
      Math.min(60_000, 2000 * 2 ** tries),
    );
  }

  /** Tries again for the pictures that were not there. */
  async #retry() {
    const project = this.#project;
    const absent = [...this.#shown.entries()].filter(([, s]) => !s.url).map(([key]) => key);
    await Promise.all(
      absent.map((key) => {
        const [hash, extension] = key.split('.');
        return this.#read(project, hash, extension, true);
      }),
    );
  }

  /**
   * Sends the pictures the others lack and fetches those that are lacking
   * here. Asked for while it is being done, it is done once more after.
   */
  sync(): Promise<void> {
    if (!this.#project || !this.shared) return Promise.resolve();
    if (this.#syncing) {
      this.#again = true;
      return this.#syncing;
    }
    const project = this.#project;
    this.#syncing = (async () => {
      do {
        this.#again = false;
        try {
          const done = await pictureSync(project);
          if (project !== this.#project) return;
          for (const problem of done.problems) {
            if (this.#said.has(problem)) continue;
            this.#said.add(problem);
            notify(problem);
          }
          if (done.fetched) await this.#retry();
        } catch {
          // Not connected: it is done when the connection is there again.
        }
      } while (this.#again && project === this.#project);
    })().finally(() => {
      this.#syncing = null;
    });
    return this.#syncing;
  }

  #took(picture: Picture): Picture {
    // Known to be there now, whatever was thought before.
    const key = `${picture.hash}.${picture.extension}`;
    if (!this.#shown.get(key)?.url) this.#shown.delete(key);
    void this.sync();
    return picture;
  }

  /** Takes in a file of this computer. Says why when it cannot, and gives nothing. */
  async addFile(path: string): Promise<Picture | null> {
    if (!this.#project) return null;
    try {
      return this.#took(await pictureAddFile(this.#project, path));
    } catch (error) {
      notifyError('The picture could not be taken in', error);
      return null;
    }
  }

  /** Takes in a picture that the window holds: one that was pasted. */
  async addBlob(blob: Blob, name: string): Promise<Picture | null> {
    if (!this.#project) return null;
    try {
      const content = await toBase64(blob);
      return this.#took(await pictureAdd(this.#project, name, content));
    } catch (error) {
      notifyError('The picture could not be taken in', error);
      return null;
    }
  }
}

function toBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const text = String(reader.result ?? '');
      resolve(text.slice(text.indexOf(',') + 1));
    };
    reader.readAsDataURL(blob);
  });
}

export const pictures = new Pictures();
