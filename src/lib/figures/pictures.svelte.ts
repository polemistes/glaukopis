/**
 * The store of pictures, as the window holds it.
 *
 * Pictures are kept in one place for the whole application, as references
 * are in the library; a figure in a text names its picture by what the file
 * holds. Here is what is known of the pictures, and the pictures themselves
 * as they can be shown: each is read from the disk once and shown from
 * memory after that, whole where it stands in a text, smaller in a list.
 *
 * A picture that is not there, as when a figure was put into a shared
 * project by someone else a moment ago, is asked for from the server of the
 * project that is open, and shown when it has come.
 */

import { SvelteMap } from 'svelte/reactivity';
import {
  pictureAdd,
  pictureAddFile,
  pictureList,
  pictureRead,
  pictureRemove,
  pictureSync,
  pictureUpdate,
  type Picture,
  type PictureChange,
  type UsedPicture,
} from '$lib/api/pictures';
import { notify, notifyError } from '$lib/ui/toast.svelte';

export type { Picture, PictureChange, UsedPicture };

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

/** What is dragged when pictures of the store are: see `ui/drag.svelte.ts`. */
export const PICTURES_DRAGGED = 'pictures';

/** Whether a picture answers to what is searched for: by what it is called and what is said of it. */
export function pictureMatches(picture: Picture, query: string): boolean {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const said = (picture.caption ?? [])
    .map((i) => (i.kind === 'text' ? i.text : i.kind === 'math' ? i.tex : ' '))
    .join('');
  const hay = `${picture.name}\n${said}\n${picture.alt}\n${picture.note}`.toLowerCase();
  return words.every((w) => hay.includes(w));
}

class Pictures {
  /** What is known of the pictures, by the names they are kept by. */
  readonly #known = new SvelteMap<string, Picture>();
  loaded = $state(false);
  #loading: Promise<void> | null = null;

  /** The project that is open, if one is, and what it uses. */
  #project: string | null = null;
  #used: () => UsedPicture[] = () => [];
  /** Whether the project is shared, so that pictures can come from elsewhere. */
  shared = false;

  readonly #shown = new SvelteMap<string, Shown>();
  #syncing: Promise<void> | null = null;
  #again = false;
  #said = new Set<string>();
  /** How often each picture that is not there has been asked for again. */
  #tries = new Map<string, number>();

  // ---- what is known ----

  /** Reads what the store holds. Asked again, it waits for the first reading. */
  load(): Promise<void> {
    if (this.loaded) return Promise.resolve();
    this.#loading ??= this.reload();
    return this.#loading;
  }

  async reload() {
    try {
      const list = await pictureList();
      const seen = new Set(list.map((p) => p.hash));
      for (const p of list) this.#known.set(p.hash, p);
      for (const hash of [...this.#known.keys()]) if (!seen.has(hash)) this.#known.delete(hash);
      this.loaded = true;
    } catch (error) {
      notifyError('The pictures could not be read', error);
    } finally {
      this.#loading = null;
    }
  }

  /** The pictures of the store, the one taken in last first. */
  get all(): Picture[] {
    return [...this.#known.values()].sort((a, b) =>
      a.added === b.added ? a.name.localeCompare(b.name) : a.added < b.added ? 1 : -1,
    );
  }

  get(hash: string): Picture | undefined {
    return this.#known.get(hash);
  }

  #took(picture: Picture): Picture {
    this.#known.set(picture.hash, picture);
    // Known to be there now, whatever was thought before.
    for (const key of [this.#key(picture, false), this.#key(picture, true)])
      if (!this.#shown.get(key)?.url) this.#shown.delete(key);
    return picture;
  }

  /** Takes in a file of this computer. Says why when it cannot, and gives nothing. */
  async addFile(path: string): Promise<Picture | null> {
    try {
      return this.#took(await pictureAddFile(path));
    } catch (error) {
      notifyError('The picture could not be taken in', error);
      return null;
    }
  }

  /** Takes in a picture that the window holds: one that was pasted. */
  async addBlob(blob: Blob, name: string): Promise<Picture | null> {
    try {
      const content = await toBase64(blob);
      return this.#took(await pictureAdd(name, content));
    } catch (error) {
      notifyError('The picture could not be taken in', error);
      return null;
    }
  }

  /** Says something anew of a picture. Gives the picture as it is then, or nothing when it could not be kept. */
  async update(hash: string, change: PictureChange): Promise<Picture | null> {
    try {
      const picture = await pictureUpdate(hash, change);
      this.#known.set(picture.hash, picture);
      return picture;
    } catch (error) {
      notifyError('What was said of the picture could not be kept', error);
      return null;
    }
  }

  /** Takes a picture out of the store. Figures that name it are left without it. */
  async remove(hash: string): Promise<boolean> {
    const picture = this.#known.get(hash);
    try {
      await pictureRemove(hash);
    } catch (error) {
      notifyError('The picture could not be removed', error);
      return false;
    }
    this.#known.delete(hash);
    if (picture) {
      for (const small of [false, true]) {
        const key = this.#key(picture, small);
        const shown = this.#shown.get(key);
        if (shown?.url) URL.revokeObjectURL(shown.url);
        this.#shown.set(key, { url: null, state: 'absent' });
      }
    }
    return true;
  }

  // ---- the pictures themselves ----

  #key(picture: { hash: string; extension: string }, small: boolean): string {
    return `${picture.hash}.${picture.extension}${small ? '.small' : ''}`;
  }

  /**
   * The picture as it can be shown; with `small`, as it is shown in a list.
   * Read where it is shown: what reads it is told when the picture has come.
   */
  of(hash: string, extension: string, small = false): Shown {
    if (!isPictureName(hash, extension)) return { url: null, state: 'absent' };
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
      const bytes = await pictureRead(hash, extension, small);
      const url = URL.createObjectURL(new Blob([bytes], { type: TYPES[extension] }));
      const before = this.#shown.get(key);
      if (before?.url) URL.revokeObjectURL(before.url);
      this.#shown.set(key, { url, state: 'shown' });
    } catch {
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
          const done = await pictureSync(project, this.#used());
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
