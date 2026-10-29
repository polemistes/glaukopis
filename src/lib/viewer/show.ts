/**
 * Where a file is shown from (ADR 0069, 0072): from the library, a
 * reference, the images, a citation or the references of a document, it
 * goes among the sources beside the text: to the file side there is, as a
 * tab, or to its tab where it has one; else the other side becomes a file
 * side of the project beside it. The text one writes never gives way to the
 * source one reads.
 */

import { sides } from '$lib/project/sides.svelte';
import { testHook } from '$lib/shell/testing';
import { router } from '$lib/state/router.svelte';

/** Shows a file of the library among the sources; the window comes back for it. */
export function showFile(hash: string, page?: number) {
  const place = page ? { page, at: 0 } : undefined;
  if (router.route.view === 'project' || router.route.view === 'file') {
    sides.showFile(hash, place);
    return;
  }
  // The window is laid out as it was kept, with the file among its sources.
  router.go({ view: 'file', file: hash, page });
}

/** A second tab of a file: at the place of its tab where it has one, else the file shown. For the scripts. */
function again(hash: string) {
  for (const side of sides.sides) {
    const tab = sides.tabs(side.key).tabs.find((t) => t.file === hash);
    if (tab) {
      sides.again(side.key, tab.id);
      return;
    }
  }
  showFile(hash);
}

testHook('__glaukopisViewer', { show: showFile, beside: showFile, again });
