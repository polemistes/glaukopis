/**
 * Stand-in for the plan of the pages, made in another worktree at the same
 * time: only what the panes and the settings column import from it. The
 * merge replaces this file with the whole of it.
 */

import type { Layout } from '$lib/api/ocr';

/** What Tesseract reads a page with. */
export interface PageSettings {
  languages: string[];
  dpi: number;
  layout: Layout;
  contrast: boolean;
}
