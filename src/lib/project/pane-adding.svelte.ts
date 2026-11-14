/**
 * Adding to the lists of the document pane (record 0095). The references and
 * the images are added to from their own lists, and files dropped on either
 * list go where their kind belongs; what came is shown where it now stands,
 * which may be the other list. Whoever adds says what came and where it
 * stands (`arrive`); the pane shows that tab, and the panel of it takes the
 * words, on *All*, with what came selected and in view.
 *
 * What came is handed over as a thing waiting rather than done by the panel
 * that was dropped on, because the panel of the other tab is not there to be
 * told: it is made as the tab is shown, and takes what waits as it is made.
 */

import { takeIn } from '$lib/figures/images.svelte';
import { isPicturePath } from '$lib/figures/pictures.svelte';
import { importDropped } from '$lib/library/references.svelte';

/** The two lists of the pane that are added to. */
export type ListTab = 'references' | 'images';

class Arrivals {
  /** What came and has not been shown yet: the tab it stands in, and what it is, by id (by hash, for images). */
  waiting = $state.raw<{ tab: ListTab; ids: string[] } | null>(null);
}

export const arrivals = new Arrivals();

/** Says that these came, and stand in the list of this tab. Nothing is said where nothing came. */
export function arrive(tab: ListTab, ids: string[]) {
  if (ids.length) arrivals.waiting = { tab, ids };
}

/**
 * Takes what was dropped on a list: the images among the files are taken in,
 * the rest goes to `importDropped`, which makes references of PDFs and reads
 * `.bib` files. The tab where what came now stands is shown; where both
 * kinds came, the one that was dropped on stays.
 */
export async function dropOnList(paths: string[], on: ListTab): Promise<void> {
  const images = (await takeIn(paths)).map((picture) => picture.hash);
  const rest = paths.filter((path) => !isPicturePath(path));
  const references = rest.length ? ((await importDropped(rest))?.added ?? []) : [];
  if (images.length && references.length) arrive(on, on === 'images' ? images : references);
  else if (images.length) arrive('images', images);
  else arrive('references', references);
}
