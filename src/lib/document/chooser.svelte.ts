/**
 * The chooser of what a document is, "What are you writing?", as it is
 * asked for from anywhere in the view of a project: from the button over
 * the preview, from the top of Look, from the menu of an element and from
 * the palette. The view mounts it once (`ProjectDialogs.svelte`).
 */

import type { Project } from '$lib/project/model/project.svelte';

export interface ChooserRequest {
  /** The project the element is of: that of the pane that asked. */
  project: Project;
  /** The element whose document is chosen for: it and what is under it. */
  at: string;
}

class TemplateChooserUi {
  /** What the chooser is asked for; nothing while it is closed. */
  request = $state.raw<ChooserRequest | null>(null);

  open(request: ChooserRequest) {
    this.request = request;
  }

  close() {
    this.request = null;
  }
}

export const templateChooserUi = new TemplateChooserUi();
