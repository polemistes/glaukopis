/**
 * The export of a document, asked for from the bar of a side and by its key
 * (record 0091), whether the typesetting pane is open or not: the dialog of
 * the kinds of file is shown over the window for the document of the side.
 * The window mounts it once (`ProjectDialogs.svelte`).
 */

import type { Project } from '$lib/project/model/project.svelte';

export interface ExportRequest {
  /** The project the document is of: that of the side that asked. */
  project: Project;
  /** Its id, by which the core knows the making of its documents. */
  projectId: string;
  /** The element whose branch is the document: that of the side (record 0081). */
  at: string;
}

class ExportUi {
  /** What the dialog is asked for; nothing while it is closed. */
  request = $state.raw<ExportRequest | null>(null);

  open(request: ExportRequest) {
    this.request = request;
  }

  close() {
    this.request = null;
  }
}

export const exportUi = new ExportUi();
