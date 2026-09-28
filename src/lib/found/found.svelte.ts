/**
 * Opening the window in which the citations that were found are gone
 * through. The window is mounted by `FoundHost.svelte`, where a project is
 * open; any code opens it through the functions here.
 */

export interface FoundRequest {
  /** The map whose citations are gone through. */
  map: string;
  /** The id of a citation that was found, to begin with: the one that was pressed in the text. */
  at: string | null;
}

class FoundUi {
  request = $state.raw<FoundRequest | null>(null);
  /** Asked for before the project was open, as when a project is made of a document. */
  waiting: { project: string; map: string } | null = null;
}

export const foundUi = new FoundUi();

/** Opens the window for a map; at the citation with this id, where one is given. */
export function goThrough(map: string, at: string | null = null) {
  foundUi.request = { map, at };
}

/** Opens the window for a map of a project when that project has been opened. */
export function goThroughWhenOpen(project: string, map: string) {
  foundUi.waiting = { project, map };
}

/** What was asked for while the project was not open yet. */
export function takeWaiting(project: string): string | null {
  const waiting = foundUi.waiting;
  if (waiting?.project !== project) return null;
  foundUi.waiting = null;
  return waiting.map;
}
