/**
 * The window "About this document": what an element's document says of
 * itself, its details, its language and the checklist of what its template
 * requires, as it is asked for from anywhere in the view of a project: from
 * the menu of the element in view, from the bar over the preview, from the
 * foot of Look and by its key. The view mounts it once (`ProjectDialogs.svelte`).
 * What the document is, its template, is chosen in the chooser of what you
 * are writing; how it looks, and what it contains, in Look.
 */

import type { Project } from '$lib/project/model/project.svelte';

/** The parts of the window, as they stand down its left. */
export type AboutSection = 'details' | 'language' | 'checklist';

export const ABOUT_SECTIONS: readonly AboutSection[] = ['details', 'language', 'checklist'];

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
