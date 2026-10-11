/**
 * The editor of a template (ADR 0038), as it is asked for from the window
 * of document settings: to change the template an element uses, or to
 * make a new one from it. The view mounts it once (`ProjectView.svelte`),
 * as it does the editor of a layout.
 */

import type { Template } from '$lib/api/templates';

export interface TemplateEditorRequest {
  /** The template to begin from. */
  id: string;
  /** A new template is made from it, rather than this one changed. */
  fresh?: boolean;
  /** The project's copy of the template, to begin from where the application lacks it. */
  copy?: Template;
  /** Called with the id of the template as saved. */
  onsaved?: (id: string) => void;
}

class TemplateEditorUi {
  /** What the editor is asked for; nothing while it is closed. */
  request = $state.raw<TemplateEditorRequest | null>(null);

  open(request: TemplateEditorRequest) {
    this.request = request;
  }

  close() {
    this.request = null;
  }
}

export const templateEditorUi = new TemplateEditorUi();
