/**
 * Opening the panel in which the citations that were found are gone
 * through. The panel stands at the side of a project (`FoundPanel.svelte`,
 * shown by the view of the project); any code opens it through the
 * functions here.
 */

export interface FoundRequest {
  /** The element in view, whose citations are gone through. */
  at: string;
  /** The id of a citation that was found, to begin with: the one that was pressed in the text. */
  citation: string | null;
}

class FoundUi {
  /** What was last asked for: the element in view, and the citation to begin with. */
  request = $state.raw<FoundRequest | null>(null);
  /** Rises each time the panel is asked to open: the view of the project follows it, and the panel turns to what was asked. */
  asked = $state(0);
  /** Asked for before the project was open, as when a project is made of a document. */
  waiting: { project: string; at: string } | null = null;
}

export const foundUi = new FoundUi();

/** Opens the panel for an element in view; at the citation with this id, where one is given. */
export function goThrough(at: string, citation: string | null = null) {
  foundUi.request = { at, citation };
  foundUi.asked++;
}

/** Opens the panel for an element of a project when that project has been opened. */
export function goThroughWhenOpen(project: string, at: string) {
  foundUi.waiting = { project, at };
}

/**
 * A citation that was found was pressed, in the text of the element in
 * view: the panel opens at that one. Returns whether it was one.
 */
export function pressedFound(target: EventTarget | null, at: string | null | undefined): boolean {
  const el = target instanceof Element ? target.closest<HTMLElement>('.found:not(.left)') : null;
  if (!el || !at) return false;
  let id = el.dataset.foundId ?? '';
  if (!id && el.dataset.found) {
    try {
      id = String((JSON.parse(el.dataset.found) as { id?: unknown }).id ?? '');
    } catch {
      // Not what the mark writes: it is no citation that was found.
    }
  }
  if (!id) return false;
  goThrough(at, id);
  return true;
}

/** What was asked for while the project was not open yet: the element to go through. */
export function takeWaiting(project: string): string | null {
  const waiting = foundUi.waiting;
  if (waiting?.project !== project) return null;
  foundUi.waiting = null;
  return waiting.at;
}
