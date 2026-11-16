/**
 * Which part of the user's guide belongs to where the writer is: Help
 * opens at it. Only what the place plainly says is read, the view the
 * router names and what the side that has the focus shows; nothing is
 * guessed beyond it.
 */

import type { Route } from '$lib/state/router.svelte';
import type { SideSpec } from '$lib/project/sides.svelte';

/** The headings of the guide that places open at, by the place. A test holds them to the guide. */
export const HEADINGS = {
  start: 'A first project',
  diagram: 'The diagram',
  text: 'The text',
  timeline: 'Timelines',
  library: 'The library',
  files: 'The files of the library',
  notebook: 'The notebook',
  file: 'A file in a view',
} as const;

/**
 * The heading of the guide about where the writer is, given the place the
 * router names and the side that has the focus; nothing where the place
 * does not say, as a project whose side is not yet shown.
 */
export function headingFor(route: Route, side: SideSpec | undefined): string | null {
  switch (route.view) {
    case 'home':
    case 'settings':
      return HEADINGS.start;
    case 'library':
      return HEADINGS.library;
    case 'files':
      return HEADINGS.files;
    case 'notebook':
      return HEADINGS.notebook;
    case 'file':
    case 'project': {
      if (side?.kind === 'file') return HEADINGS.file;
      if (side?.kind === 'map') return HEADINGS[side.mode];
      if (route.view === 'file') return HEADINGS.file;
      return route.mode ? HEADINGS[route.mode] : null;
    }
  }
}
