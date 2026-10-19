/**
 * The window of an element's document settings (ADR 0038), as it is asked
 * for from anywhere in the view of a project: from the menu of the
 * element, from the bar over the preview, and by its key. The view mounts
 * it once (`ProjectView.svelte`).
 */

import type { Project } from '$lib/project/model/project.svelte';

/** The parts of the window, as they stand down its left. */
export type DocumentSection = 'details' | 'parts' | 'look' | 'language' | 'checklist';

export const DOCUMENT_SECTIONS: readonly DocumentSection[] = [
  'details',
  'parts',
  'look',
  'language',
  'checklist',
];

export interface DocumentSettingsRequest {
  /** The project the element is of: that of the pane that asked. */
  project: Project;
  /** The element whose document is set. */
  at: string;
  /** The part of the window to open at; the details where nothing is said. */
  section?: DocumentSection;
}

class DocumentSettingsUi {
  /** What the window is asked for; nothing while it is closed. */
  request = $state.raw<DocumentSettingsRequest | null>(null);

  open(request: DocumentSettingsRequest) {
    this.request = request;
  }

  close() {
    this.request = null;
  }
}

export const documentSettingsUi = new DocumentSettingsUi();
