/**
 * Bringing documents in from files, each to become a tree of elements
 * (ADR 0012): under the element in view, or under the project itself.
 *
 * The dialog is `DocumentDialog.svelte`, which is there wherever documents
 * are brought in: in a project, where the tree is made under the element in
 * view, and among the projects, where a project is made of the document. It
 * is opened through the functions here, which give what was made, or
 * nothing.
 */

import { open } from '@tauri-apps/plugin-dialog';
import { DOCUMENT_ENDINGS, OTHER_ENDINGS } from '$lib/api/imported';
import { libraryGetMany } from '$lib/api/library';
import { PICTURE_ENDINGS } from '$lib/api/ocr';
import type { ProjectInfo } from '$lib/api/projects';
import { recordOf } from '$lib/editor/references.svelte';
import { t } from '$lib/i18n';
import type { Project } from '$lib/project/model/project.svelte';
import { PROJECT } from '$lib/project/model/types';

/** What came of a document that was brought in. */
export interface Brought {
  /** The element at the top of what was made. */
  top: string;
  /** The project that was made of it, where one was. */
  project?: ProjectInfo;
  /** Whether the citations that were found in it are to be gone through now. */
  goThrough?: boolean;
}

export interface Bringing {
  /** The file: a path on this computer, or one in the store of the library's files where `stored`. */
  path: string;
  /** Whether the path is that of a file of the library, in its store. */
  stored?: boolean;
  /** What the file is called, where its path does not say: a file of the library is called as its record says. */
  name?: string;
  /** The project the tree is made in. Nothing, when a project is made of the document. */
  project: Project | null;
  /** The element the tree is made under: the one in view, or the project itself. */
  under: string;
  resolve: (brought: Brought | null) => void;
}

class Documents {
  request = $state.raw<Bringing | null>(null);
}

export const documents = new Documents();

/**
 * Reads a document and shows what it holds, for a tree to be made of it
 * under `under`. A file of the library is read from the store, by its
 * stored path, with `stored`.
 */
export function bringIn(
  path: string,
  project: Project | null,
  under: string = PROJECT,
  options: { stored?: boolean; name?: string } = {},
): Promise<Brought | null> {
  return new Promise((resolve) => {
    documents.request?.resolve(null);
    documents.request = { path, project, under, ...options, resolve };
  });
}

/** PDFs and pictures, whose text is read (`ocr/ReadStep.svelte`). */
const READ_ENDINGS = ['pdf', ...PICTURE_ENDINGS];

/** Asks for the file of a document. */
export async function chooseDocument(): Promise<string | null> {
  const path = await open({
    title: t('documents-choose'),
    multiple: false,
    filters: [
      {
        name: t('documents-filter'),
        extensions: [...DOCUMENT_ENDINGS, ...OTHER_ENDINGS, ...READ_ENDINGS],
      },
      // Whose text is read by Tesseract.
      { name: t('ocr-filter'), extensions: READ_ENDINGS },
      { name: t('documents-filter-all'), extensions: ['*'] },
    ],
  });
  return typeof path === 'string' ? path : null;
}

/** The project keeps a copy of every reference it uses: here, of those a document cites. */
export async function keepReferences(project: Project, ids: string[]) {
  if (!ids.length) return;
  try {
    for (const reference of await libraryGetMany(ids)) project.putReference(recordOf(reference));
  } catch (error) {
    // They are in the library all the same, and are kept when they are next cited.
    console.error(error);
  }
}
