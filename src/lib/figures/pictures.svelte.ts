/**
 * The images figures show, as the window holds them (ADR 0070).
 *
 * Images are files of the library, as every other file is; a figure in a
 * text names its file by what the file holds. Here is what figures need of
 * them, read from the files of the library, and the images themselves as
 * they can be shown: each is read from the disk once and shown from memory
 * after that, whole where it stands in a text, as its thumbnail in a list.
 *
 * An image that is not there, as when a figure was put into a shared
 * project by someone else a moment ago, is asked for from the server of the
 * project that is open, and shown when it has come.
 */

import {
  fileForFigure,
  filePath,
  fileSetAlt,
  fileSmall,
  filesAddImage,
  filesSync,
  filesTakeInForFigure,
  type FileView,
  type UsedPicture,
} from '$lib/api/files';
import { isBackendError } from '$lib/api/backend';
import { fileRead } from '$lib/api/system';
import { files } from '$lib/files/store.svelte';
import { t } from '$lib/i18n';
import { fileEnding } from '$lib/util/file-name';
import { describeError, notify, notifyError } from '$lib/ui/toast.svelte';
import { SvelteMap } from 'svelte/reactivity';

export type { UsedPicture };

/** An image of the library, as a figure names and shows it. */
export interface Picture {
  hash: string;
  /** What it is called, with its ending. */
  name: string;
  /** The ending of its name, in small letters: what a figure names it by. */
  extension: string;
  size: number;
  width: number | null;
  height: number | null;
  /** When it was taken in. */
  added: string;
  /** What it shows, in words, for those who do not see it. */
  alt: string;
}

/** A file of the library as a figure names it. */
export function pictureOf(file: FileView): Picture {
  return {
    hash: file.hash,
    name: file.name,
    extension: fileEnding(file.name),
    size: file.size,
    width: file.width,
    height: file.height,
    added: file.added,
    alt: file.alt,
  };
}

/**
 * The address of a picture in memory, or why there is none: being read; not
 * on this computer; or there and not to be read, with what the reading said.
 */
export type Shown =
  | { url: string; state: 'shown' }
  | { url: null; state: 'reading' | 'absent' }
  | { url: null; state: 'unread'; why: string };

/**
 * Shows a picture of the store in its holder: the picture where it can be
 * had, else the holder's state, by which the stylesheet says why there is
 * none; where it could not be read, in the words of what refused it.
 */
export function showPicture(holder: HTMLElement | null, img: HTMLImageElement, shown: Shown) {
  if (shown.url) {
    if (img.getAttribute('src') !== shown.url) img.src = shown.url;
    holder?.removeAttribute('data-state');
  } else {
    img.removeAttribute('src');
    holder?.setAttribute('data-state', shown.state);
  }
  if (!holder) return;
  if (shown.state === 'unread') {
    const why = t('figures-picture-unread', { reason: shown.why });
    holder.dataset.why = why;
    holder.title = why;
  } else if (holder.dataset.why !== undefined) {
    delete holder.dataset.why;
    holder.removeAttribute('title');
  }
}

const TYPES: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  svg: 'image/svg+xml',
};

/** The endings of files that are taken for pictures when they are dropped. */
export const PICTURE_ENDINGS = ['png', 'jpg', 'jpeg', 'svg', 'gif', 'webp', 'tif', 'tiff', 'bmp'];

export function isPicturePath(path: string): boolean {
  return PICTURE_ENDINGS.includes(fileEnding(path));
}

export function isPictureName(hash: unknown, extension: unknown): boolean {
  return (
    typeof hash === 'string' &&
    /^[0-9a-f]{64}$/.test(hash) &&
    typeof extension === 'string' &&
    extension in TYPES
  );
}

/** What is dragged when images of the library are, to be figures: see `ui/drag.svelte.ts`. */
export const PICTURES_DRAGGED = 'pictures';

/** Whether an image answers to what is searched for: by what it is called and what it shows. */
export function pictureMatches(picture: Picture, query: string): boolean {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const hay = `${picture.name}\n${picture.alt}`.toLowerCase();
  return words.every((w) => hay.includes(w));
}

class Pictures {
  /** The project that is open, if one is, and what it uses. */
  #project: string | null = null;
  #used: () => UsedPicture[] = () => [];
  /** Whether the project is shared, so that images can come from elsewhere. */
  shared = false;

  readonly #shown = new SvelteMap<string, Shown>();
  #syncing: Promise<void> | null = null;
  #again = false;
  #said = new Set<string>();
  /** How often each image that is not there has been asked for again. */
  #tries = new Map<string, number>();

  // ---- what is known: the files of the library that are images ----

  get loaded(): boolean {
    return files.loaded;
  }

  load(): Promise<void> {
    return files.load();
  }

  reload(): Promise<void> {
    return files.reload();
  }

  /** The images of the library, the one taken in last first. */
  get all(): Picture[] {
    return files.files
      .filter((f) => f.kind === 'picture' && f.exists)
      .map(pictureOf)
      .sort((a, b) =>
        a.added === b.added ? a.name.localeCompare(b.name) : a.added < b.added ? 1 : -1,
      );
  }

  get(hash: string): Picture | undefined {
    const file = files.get(hash);
    return file?.kind === 'picture' ? pictureOf(file) : undefined;
  }

  /** A file taken in or changed: known to the files, and to be shown anew where it was not there. */
  #took(file: FileView): Picture {
    if (file.folder && !files.folder(file.folder)) void files.reload();
    else files.put(file);
    const picture = pictureOf(file);
    for (const key of [this.#key(picture, false), this.#key(picture, true)])
      if (!this.#shown.get(key)?.url) this.#shown.delete(key);
    return picture;
  }

  /**
   * Takes in a file of this computer to be a figure, into the folder Images,
   * and gives the image the figure shows: the file, or a copy made of it in
   * a kind every document holds. Says why when it cannot, and gives nothing.
   */
  async addFile(path: string): Promise<Picture | null> {
    try {
      return this.#took(await filesTakeInForFigure(path));
    } catch (error) {
      notifyError(t('figures-picture-not-taken'), error);
      return null;
    }
  }

  /** Takes in an image that the window holds: one that was pasted. */
  async addBlob(blob: Blob, name: string): Promise<Picture | null> {
    try {
      const content = await toBase64(blob);
      return this.#took(await filesAddImage(name, content));
    } catch (error) {
      notifyError(t('figures-picture-not-taken'), error);
      return null;
    }
  }

  /** The image a figure made of this file shows: the file, or a copy made of it. Nothing, with a word, where it is no image. */
  async forFigure(hash: string): Promise<Picture | null> {
    try {
      return this.#took(await fileForFigure(hash));
    } catch (error) {
      notifyError(t('figures-picture-not-taken'), error);
      return null;
    }
  }

  /** Says what an image shows. Gives the image as it is then, or nothing when it could not be kept. */
  async setAlt(hash: string, alt: string): Promise<Picture | null> {
    try {
      const file = await fileSetAlt(hash, alt);
      files.put(file);
      return pictureOf(file);
    } catch (error) {
      notifyError(t('figures-picture-not-kept'), error);
      return null;
    }
  }

  // ---- the pictures themselves ----

  #key(picture: { hash: string; extension: string }, small: boolean): string {
    return `${picture.hash}.${picture.extension}${small ? '.small' : ''}`;
  }

  /**
   * The image as it can be shown; with `small`, its thumbnail, as it is shown in a list:
   * of an image, or of the first page of a PDF.
   * Read where it is shown: what reads it is told when the picture has come.
   */
  of(hash: string, extension: string, small = false): Shown {
    // A thumbnail is had of a PDF as well, by its first page.
    const named = small ? /^[0-9a-f]{64}$/.test(hash) : isPictureName(hash, extension);
    if (!named) return { url: null, state: 'absent' };
    const key = this.#key({ hash, extension }, small);
    const known = this.#shown.get(key);
    if (known) return known;
    const reading: Shown = { url: null, state: 'reading' };
    // Not while something is being shown: what is set here is read there.
    queueMicrotask(() => {
      if (this.#shown.has(key)) return;
      this.#shown.set(key, reading);
      void this.#read(hash, extension, small);
    });
    return reading;
  }

  async #read(hash: string, extension: string, small: boolean, asked = false) {
    const key = this.#key({ hash, extension }, small);
    try {
      const bytes = small ? await fileSmall(hash) : await fileRead(await filePath(hash));
      // A thumbnail is a photograph or a PNG, which is known by what it holds; a drawing is said to be one.
      const type = small && extension !== 'svg' ? undefined : TYPES[extension];
      const url = URL.createObjectURL(new Blob([bytes as BlobPart], type ? { type } : {}));
      const before = this.#shown.get(key);
      if (before?.url) URL.revokeObjectURL(before.url);
      this.#shown.set(key, { url, state: 'shown' });
    } catch (error) {
      if (!isBackendError(error) || error.kind !== 'not-found') {
        // There, and not to be read: damaged, refused, of a kind not known.
        // Said as it is, not as a picture that is elsewhere.
        console.error(`the picture ${hash}.${extension} could not be read`, error);
        const why = describeError(error) ?? String(error);
        this.#shown.set(key, { url: null, state: 'unread', why });
        return;
      }
      this.#shown.set(key, { url: null, state: 'absent' });
      // It may be with the others.
      const project = this.#project;
      if (project && this.shared && !asked) {
        await this.sync();
        if (project === this.#project && !this.#shown.get(key)?.url)
          await this.#read(hash, extension, small, true);
      }
      if (project && this.shared && !this.#shown.get(key)?.url) this.#later(project, key);
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
        const [hash, extension, small] = key.split('.');
        await this.sync();
        if (project === this.#project && !this.#shown.get(key)?.url)
          await this.#read(hash, extension, small === 'small', true);
      },
      Math.min(60_000, 2000 * 2 ** tries),
    );
  }

  /** Tries again for the pictures that were not there. */
  async #retry() {
    const absent = [...this.#shown.entries()].filter(([, s]) => !s.url).map(([key]) => key);
    await Promise.all(
      absent.map((key) => {
        const [hash, extension, small] = key.split('.');
        return this.#read(hash, extension, small === 'small', true);
      }),
    );
  }

  // ---- the project that is open ----

  get project(): string | null {
    return this.#project;
  }

  /**
   * Says which project is open, and how to ask what pictures it uses: those
   * are what is sent to the others when the project is shared.
   */
  open(project: string | null, used: () => UsedPicture[] = () => []) {
    if (project === this.#project) {
      this.#used = used;
      return;
    }
    this.#said.clear();
    this.#tries.clear();
    this.#project = project;
    this.#used = used;
    this.shared = false;
    // What was not there may be with the others of this project.
    for (const [key, shown] of [...this.#shown]) if (!shown.url) this.#shown.delete(key);
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
          const done = await filesSync(project, this.#used());
          if (project !== this.#project) return;
          for (const problem of done.problems) {
            if (this.#said.has(problem)) continue;
            this.#said.add(problem);
            notify(problem);
          }
          if (done.fetched) {
            await this.reload();
            await this.#retry();
          }
        } catch {
          // Not connected: it is done when the connection is there again.
        }
      } while (this.#again && project === this.#project);
    })().finally(() => {
      this.#syncing = null;
    });
    return this.#syncing;
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
