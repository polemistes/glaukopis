/**
 * The window Document properties: what an element's document says of
 * itself, its details, its type (what you are writing, its template), its
 * language and the checklist of what its template requires, as it is asked
 * for from anywhere in the window: from the menu of an element, from the
 * Document type button in Look and by its keys. The window mounts it once
 * (`ProjectDialogs.svelte`). How the document looks, and what it contains,
 * is set in Look.
 */

import type { Project } from '$lib/project/model/project.svelte';

/** The parts of the window, as they stand down its left. */
export type AboutSection = 'details' | 'type' | 'language' | 'checklist';

export const ABOUT_SECTIONS: readonly AboutSection[] = ['details', 'type', 'language', 'checklist'];

export interface AboutDocumentRequest {
  /** The project the element is of: that of the pane that asked. */
  project: Project;
  /** The element whose document it is. */
  at: string;
  /** The part of the window to open at; the details where nothing is said. */
  section?: AboutSection;
}

class AboutDocumentUi {
  /** What the window is asked for; nothing while it is closed. */
  request = $state.raw<AboutDocumentRequest | null>(null);

  open(request: AboutDocumentRequest) {
    this.request = request;
  }

  close() {
    this.request = null;
  }
}

export const aboutDocumentUi = new AboutDocumentUi();
