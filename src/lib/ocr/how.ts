/**
 * How pages are read, when the way they are read at first goes badly: the
 * resolution they are drawn at, the layout of the page, and whether they are
 * made black and white. The settings say what to begin with; a dialog may
 * say otherwise for one reading.
 */

import type { How, Layout } from '$lib/api/ocr';
import { settings } from '$lib/state/settings.svelte';

/** The resolutions offered, in dots to the inch. 0 in the settings stands for the first. */
export const DPIS = [300, 400, 600] as const;

export const LAYOUTS: readonly Layout[] = ['', 'column', 'block', 'sparse'];

/** How to read, as the settings say. */
export function howFromSettings(): How {
  const { ocrDpi, ocrLayout, ocrContrast } = settings.value;
  return {
    dpi: DPIS.includes(ocrDpi as (typeof DPIS)[number]) ? ocrDpi : 0,
    layout: LAYOUTS.includes(ocrLayout) ? ocrLayout : '',
    contrast: !!ocrContrast,
  };
}

/** The resolution as it is shown: 0 is the first offered. */
export const shownDpi = (dpi: number) => (dpi === 0 ? DPIS[0] : dpi);
