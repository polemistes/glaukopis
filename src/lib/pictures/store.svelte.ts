/**
 * What the views of the store of pictures share: taking pictures in from
 * files, removing one, who uses it, and the words for what is known of it.
 *
 * The store itself is `figures/pictures.svelte.ts`.
 */

import { open } from '@tauri-apps/plugin-dialog';
import type { ProjectInfo } from '$lib/api/projects';
import {
  isPicturePath,
  pictures,
  PICTURE_ENDINGS,
  type Picture,
} from '$lib/figures/pictures.svelte';
import { t } from '$lib/i18n';
import type { Project } from '$lib/project/model/project.svelte';
import { inlineText, titleHtml } from '$lib/project/model/text';
import { projects } from '$lib/state/projects.svelte';
import { confirm } from '$lib/ui/confirm.svelte';
import { notifyOk } from '$lib/ui/toast.svelte';

/** Which pictures the panel of a project shows: those of the map, of the project, or all of the store. */
export type PictureScope = 'map' | 'project' | 'store';

class PicturesUi {
  /** Set when the panel of the project is asked for from elsewhere, as from the tools for writing. */
  wanted = $state.raw<{ scope: PictureScope } | null>(null);
}

export const picturesUi = new PicturesUi();

/** Asks for the panel of pictures of the project that is open. */
export function showPictures(scope: PictureScope = 'store') {
  picturesUi.wanted = { scope };
}

/**
 * The name under which a project keeps its note on a picture. Notes on
 * references are kept by the id of the reference, which has no colon in it.
 */
export const noteKey = (hash: string) => `picture:${hash}`;

/** Whether anything is written about a picture that can be read here. */
export function pictureHasNotes(hash: string, project?: Project | null): boolean {
  if (pictures.get(hash)?.note.trim()) return true;
  return !!project?.notes.has(noteKey(hash));
}

/** Takes the pictures among these files into the store, and gives those that were taken. */
export async function takeIn(paths: string[]): Promise<Picture[]> {
  const taken: Picture[] = [];
  for (const path of paths.filter(isPicturePath)) {
    const picture = await pictures.addFile(path);
    if (picture) taken.push(picture);
  }
  return taken;
}

/** Asks for pictures among the files of this computer, and takes them in. */
export async function addPictures(): Promise<Picture[]> {
  const chosen = await open({
    title: t('pictures-add-title'),
    multiple: true,
    filters: [{ name: t('pictures-files'), extensions: PICTURE_ENDINGS }],
  });
  if (!chosen) return [];
  const taken = await takeIn(Array.isArray(chosen) ? chosen : [chosen]);
  if (taken.length) notifyOk(t('pictures-taken-in', { count: taken.length, name: taken[0].name }));
  return taken;
}

/**
 * The projects that use a picture. The list of projects says what each used
 * when it was last saved; of the project that is open, what it uses now.
 */
export function usersOf(hash: string, open?: Project | null): ProjectInfo[] {
  const openId = open ? pictures.project : null;
  return projects.list.filter((p) =>
    p.id === openId
      ? open!.usedPictures().some((u) => u.hash === hash)
      : (p.pictures ?? []).includes(hash),
  );
}

/** Removes a picture from the store, when the user has said so. Returns whether it was removed. */
export async function removePicture(picture: Picture, open?: Project | null): Promise<boolean> {
  const users = usersOf(picture.hash, open).length;
  const ok = await confirm({
    title: t('pictures-remove-title', { name: picture.name }),
    message: users ? t('pictures-remove-used', { count: users }) : t('pictures-remove-unused'),
    confirm: t('common-remove'),
    danger: true,
  });
  if (!ok) return false;
  return pictures.remove(picture.hash);
}

/** What kind of file a picture is, in words. */
export function kindWords(extension: string): string {
  const kinds: Record<string, string> = { png: 'PNG', jpg: 'JPEG', svg: t('pictures-kind-svg') };
  return kinds[extension] ?? extension.toUpperCase();
}

/**
 * What is said of a picture as HTML, for the lists: its words with the marks
 * a line in a list can show. All text is escaped.
 */
export function captionHtml(picture: Picture | undefined): string {
  return (picture?.caption ?? [])
    .map((i) =>
      i.kind === 'text' ? titleHtml([i]) : i.kind === 'math' ? titleHtml([text(i.tex)]) : '',
    )
    .join('');
}

const text = (words: string) => ({ kind: 'text' as const, text: words, marks: {} });

/** What is said of a picture, as plain words. */
export function captionWords(picture: Picture | undefined): string {
  return inlineText(picture?.caption ?? []).trim();
}
