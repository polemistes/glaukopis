/**
 * Where a file is shown from (ADR 0069): from the library, a reference or
 * the images, in the active side, in the place of what it showed; from a
 * citation or the references of a document, in the other side, so that the
 * text one writes never gives way to the source one reads.
 */

import { sides } from '$lib/project/sides.svelte';
import { testHook } from '$lib/shell/testing';
import { router } from '$lib/state/router.svelte';

/** Shows a file of the library, or an image of the store, in the active side; the window comes back for it. */
export function showFile(hash: string, page = 1) {
  if (router.route.view === 'project' || router.route.view === 'file') {
    sides.openFile(hash, page);
    return;
  }
  // The window is laid out as it was kept, with the file in its active side.
  router.go({ view: 'file', file: hash, page });
}

/** Shows a file in the other side, which opens where there is none. */
export function besideFile(hash: string, page = 1) {
  if (router.route.view === 'project' || router.route.view === 'file') {
    sides.besideFile(hash, page);
    return;
  }
  router.go({ view: 'file', file: hash, page });
}

testHook('__glaukopisViewer', { show: showFile, beside: besideFile });
