/**
 * Bringing documents in from files, each to become a map of its own.
 *
 * The dialog is `DocumentDialog.svelte`, which is there wherever documents
 * are brought in: in a project, where the map is made in that project, and
 * among the projects, where a project is made of the document. It is opened
 * through the functions here, which give what was made, or nothing.
 */

import { open } from '@tauri-apps/plugin-dialog';
import { DOCUMENT_ENDINGS, OTHER_ENDINGS } from '$lib/api/imported';
import { libraryGetMany } from '$lib/api/library';
import { PICTURE_ENDINGS } from '$lib/api/ocr';
import type { ProjectInfo } from '$lib/api/projects';
import { recordOf } from '$lib/editor/references.svelte';
import { t } from '$lib/i18n';
import type { Project } from '$lib/project/model/project.svelte';

/** What came of a document that was brought in. */
export interface Brought {
  /** The map that was made. */
  map: string;
  /** The project that was made of it, where one was. */
  project?: ProjectInfo;
  /** Whether the citations that were found in it are to be gone through now. */
  goThrough?: boolean;
}

export interface Bringing {
  /** The file. */
  path: string;
  /** The project the map is made in. Nothing, when a project is made of the document. */
  project: Project | null;
  resolve: (brought: Brought | null) => void;
}

class Documents {
  request = $state.raw<Bringing | null>(null);
}

export const documents = new Documents();

/** Reads a document and shows what it holds, for a map to be made of it. */
export function bringIn(path: string, project: Project | null): Promise<Brought | null> {
  return new Promise((resolve) => {
    documents.request?.resolve(null);
    documents.request = { path, project, resolve };
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
