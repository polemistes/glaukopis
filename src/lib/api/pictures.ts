/** The store of pictures, and mathematics as it is shown. Mirrors `commands/pictures.rs`. */

import { invoke } from '@tauri-apps/api/core';
import { t } from '$lib/i18n';
import type { Inline } from '$lib/project/model/text';
import { call, inTauri } from './backend';

/** A picture of the store, with what has been said of it. */
export interface Picture {
  /** The SHA-256 of what the file holds: the name the picture is kept by. */
  hash: string;
  extension: string;
  /** What the picture is called: at first, what the file was called. */
  name: string;
  size: number;
  width: number | null;
  height: number | null;
  /** When it was taken in. */
  added: string;
  /** What is said of it where it becomes a figure, until something else is said there. */
  caption?: Inline[];
  /** What the picture shows, in words, for those who do not see it. */
  alt: string;
  /** What the user makes of it. Part of no document. */
  note: string;
}

/** What is said anew of a picture. What is not given stays as it is. */
export interface PictureChange {
  name?: string;
  caption?: Inline[];
  alt?: string;
  note?: string;
}

/** A picture that a project uses, as the project names it. */
export interface UsedPicture {
  hash: string;
  extension: string;
  name: string;
}

export interface Synced {
  sent: number;
  fetched: number;
  problems: string[];
}

export interface Formula {
  tex: string;
  display: boolean;
}

export interface Rendered {
  mathml: string | null;
  problem: string | null;
}

export const pictureList = () => call<Picture[]>('picture_list');

export const pictureGet = (hash: string) => call<Picture>('picture_get', { hash });

export const pictureAddFile = (path: string) => call<Picture>('picture_add_file', { path });

/** `content` in base64. */
export const pictureAdd = (name: string, content: string) =>
  call<Picture>('picture_add', { name, content });

/** The picture itself; with `small`, as it is shown in a list. */
export async function pictureRead(
  hash: string,
  extension: string,
  small = false,
): Promise<ArrayBuffer> {
  if (!inTauri) throw { kind: 'no-backend', message: t('pictures-no-backend') };
  return invoke<ArrayBuffer>('picture_read', { hash, extension, small });
}

export const pictureUpdate = (hash: string, change: PictureChange) =>
  call<Picture>('picture_update', { hash, change });

export const pictureRemove = (hash: string) => call<void>('picture_remove', { hash });

/** For the project with this id: sends what the server lacks of `used`, fetches what is lacking here. */
export const pictureSync = (id: string, used: UsedPicture[]) =>
  call<Synced>('picture_sync', { id, used });

export const mathRender = (formulas: Formula[]) => call<Rendered[]>('math_render', { formulas });
