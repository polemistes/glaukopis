/** The pictures of a project, and mathematics as it is shown. Mirrors `commands/pictures.rs`. */

import { invoke } from '@tauri-apps/api/core';
import { call, inTauri } from './backend';

export interface Picture {
  /** The SHA-256 of what the file holds: the name the picture is kept by. */
  hash: string;
  extension: string;
  /** What the file was called when it was taken in. */
  name: string;
  size: number;
  width: number | null;
  height: number | null;
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

export const pictureAddFile = (id: string, path: string) =>
  call<Picture>('picture_add_file', { id, path });

/** `content` in base64. */
export const pictureAdd = (id: string, name: string, content: string) =>
  call<Picture>('picture_add', { id, name, content });

export async function pictureRead(
  id: string,
  hash: string,
  extension: string,
): Promise<ArrayBuffer> {
  if (!inTauri) throw { kind: 'no-backend', message: 'There is no backend.' };
  return invoke<ArrayBuffer>('picture_read', { id, hash, extension });
}

export const picturePresent = (id: string, pictures: [string, string][]) =>
  call<boolean[]>('picture_present', { id, pictures });

export const pictureSync = (id: string) => call<Synced>('picture_sync', { id });

export const mathRender = (formulas: Formula[]) => call<Rendered[]>('math_render', { formulas });
