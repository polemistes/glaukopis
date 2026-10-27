/**
 * What the picture panel of a project needs of the images of the library
 * (ADR 0070): which it shows, taking images in to be figures, who uses one,
 * and the words for its kind. The images themselves are files of the
 * library, read for figures in `pictures.svelte.ts`.
 */

import { open } from '@tauri-apps/plugin-dialog';
import type { ProjectInfo } from '$lib/api/projects';
import { t } from '$lib/i18n';
import type { Project } from '$lib/project/model/project.svelte';
import { projects } from '$lib/state/projects.svelte';
import { notifyOk } from '$lib/ui/toast.svelte';
import { isPicturePath, pictures, PICTURE_ENDINGS, type Picture } from './pictures.svelte';

/** Which images the panel of a project shows: those of the map, of the project, or all of the library. */
export type PictureScope = 'map' | 'project' | 'library';

class PicturesUi {
  /** Set when the panel of the project is asked for from elsewhere, as from the tools for writing. */
  wanted = $state.raw<{ scope: PictureScope } | null>(null);
}

export const picturesUi = new PicturesUi();

/** Asks for the panel of images of the project that is open. */
export function showPictures(scope: PictureScope = 'library') {
  picturesUi.wanted = { scope };
}

/** Takes the images among these files into the library to be figures, and gives those that were taken. */
export async function takeIn(paths: string[]): Promise<Picture[]> {
  const taken: Picture[] = [];
  for (const path of paths.filter(isPicturePath)) {
    const picture = await pictures.addFile(path);
    if (picture) taken.push(picture);
  }
  return taken;
}

/** Asks for images among the files of this computer, and takes them in. */
export async function addPictures(): Promise<Picture[]> {
  const chosen = await open({
    title: t('files-add-images'),
    multiple: true,
    filters: [{ name: t('figures-picture-files'), extensions: PICTURE_ENDINGS }],
  });
  if (!chosen) return [];
  const taken = await takeIn(Array.isArray(chosen) ? chosen : [chosen]);
  if (taken.length)
    notifyOk(t('files-images-taken-in', { count: taken.length, name: taken[0].name }));
  return taken;
}

/**
 * The projects that use an image as a figure. The list of projects says
 * what each used when it was last saved; of the project that is open, what
 * it uses now.
 */
export function usersOf(hash: string, open?: Project | null): ProjectInfo[] {
  const openId = open ? pictures.project : null;
  return projects.list.filter((p) =>
    p.id === openId
      ? open!.usedPictures().some((u) => u.hash === hash)
      : (p.pictures ?? []).includes(hash),
  );
}

/** What kind of file an image is, in words. */
export function kindWords(extension: string): string {
  const kinds: Record<string, string> = {
    png: 'PNG',
    jpg: 'JPEG',
    jpeg: 'JPEG',
    svg: t('figures-kind-svg'),
  };
  return kinds[extension] ?? extension.toUpperCase();
}
