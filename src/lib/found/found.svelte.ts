/**
 * Opening the panel in which the citations that were found are gone
 * through. The panel stands at the side of a project (`FoundPanel.svelte`,
 * shown by the view of the project); any code opens it through the
 * functions here.
 */

export interface FoundRequest {
  /** The map whose citations are gone through. */
  map: string;
  /** The id of a citation that was found, to begin with: the one that was pressed in the text. */
  at: string | null;
}

class FoundUi {
  /** What was last asked for: the map, and the citation to begin with. */
  request = $state.raw<FoundRequest | null>(null);
  /** Rises each time the panel is asked to open: the view of the project follows it, and the panel turns to what was asked. */
  asked = $state(0);
  /** Asked for before the project was open, as when a project is made of a document. */
  waiting: { project: string; map: string } | null = null;
}

export const foundUi = new FoundUi();

/** Opens the panel for a map; at the citation with this id, where one is given. */
export function goThrough(map: string, at: string | null = null) {
  foundUi.request = { map, at };
  foundUi.asked++;
}

/** Opens the panel for a map of a project when that project has been opened. */
export function goThroughWhenOpen(project: string, map: string) {
  foundUi.waiting = { project, map };
}

/**
 * A citation that was found was pressed, in a text of a map: the panel
 * opens at that one. Returns whether it was one.
 */
export function pressedFound(target: EventTarget | null, map: string | null | undefined): boolean {
  const el = target instanceof Element ? target.closest<HTMLElement>('.found:not(.left)') : null;
  if (!el || !map) return false;
  let id = el.dataset.foundId ?? '';
  if (!id && el.dataset.found) {
    try {
      id = String((JSON.parse(el.dataset.found) as { id?: unknown }).id ?? '');
    } catch {
      // Not what the mark writes: it is no citation that was found.
    }
  }
  if (!id) return false;
  goThrough(map, id);
  return true;
}

/** What was asked for while the project was not open yet. */
export function takeWaiting(project: string): string | null {
  const waiting = foundUi.waiting;
  if (waiting?.project !== project) return null;
  foundUi.waiting = null;
  return waiting.map;
}
