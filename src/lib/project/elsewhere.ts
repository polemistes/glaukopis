/**
 * Projects other than the one being written in: those open in the view,
 * side by side (ADR 0037), and those that are not open, opened to be
 * written in and let go when what was written is on disk, for elements
 * sent or moved to them (ADR 0033). A project open in the view is never
 * opened a second time from disk: what is written in it is written in the
 * one that is open.
 */

import { openProject, projects } from '$lib/state/projects.svelte';
import { makePortable, portable, type Place } from './model/portable';
import type { Project } from './model/project.svelte';
import { topmost } from './model/tree';
import { PROJECT } from './model/types';

export interface Elsewhere {
  project: Project;
  close(): Promise<void>;
  /** The project is open in the view: what is written in it is a step its undo takes back, and it stays open. */
  here?: boolean;
}

/** The projects open in the view, by id. */
const open = new Map<string, Project>();

/** A project is open in the view. */
export function openHere(id: string, project: Project) {
  open.set(id, project);
}

/** A project open in the view is closed; another opened since under the same id is left. */
export function closedHere(id: string, project?: Project) {
  if (!project || open.get(id) === project) open.delete(id);
}

/** The project of that id, where it is open in the view. */
export function openedHere(id: string): Project | undefined {
  return open.get(id);
}

/** The id of a project open in the view; none for one that is not. */
export function idOf(project: Project): string | null {
  for (const [id, p] of open) if (p === project) return id;
  return null;
}

export async function openElsewhere(id: string): Promise<Elsewhere> {
  const there = open.get(id);
  if (there) return { project: there, close: async () => {}, here: true };
  // A project that is being closed is opened when what was written in it is on disk.
  await projects.closed(id);
  // It is opened only to be written in: not the project last opened.
  const last = projects.lastOpened;
  const { project } = await openProject(id);
  projects.lastOpened = last;
  return { project, close: () => project.close(), here: false };
}

/**
 * Writes in a project that is not open: opens it, does what is to be done,
 * makes sure it is on disk, and lets it go. What reads it meanwhile waits.
 * In a project open in the view, what is done is one step its undo takes back.
 */
export async function writeElsewhere<T>(id: string, what: (project: Project) => T): Promise<T> {
  const there = await openElsewhere(id);
  if (there.here) {
    there.project.checkpoint();
    const result = what(there.project);
    there.project.checkpoint();
    return result;
  }
  const done = (async () => {
    try {
      const result = what(there.project);
      there.project.undoManager.clear();
      await there.project.flush();
      if (there.project.status === 'error') throw new Error(there.project.saveError ?? '');
      return result;
    } finally {
      await there.close();
    }
  })();
  projects.closing(id, done);
  return done;
}

/**
 * Carries elements, each with all under it, from one project open in the
 * view to another, as a drop from one pane onto the other does: they are
 * made there through the form another project can take, in one step undo
 * takes back there; where `index` is given they stand at that place among
 * what is under the element they go to. A move then removes them from the
 * project they came from; the two steps are one: undone, or done again, in
 * either project, they are in the other as well, so that nothing is lost
 * between them. Returns the ids of the topmost of what was made.
 */
export function carryAcross(
  from: Project,
  ids: string[],
  to: Project,
  place: Place & { index?: number },
  move: boolean,
): string[] {
  const going = topmost(
    from.tree(),
    ids.filter((id) => id !== PROJECT && from.node(id)),
  );
  const carried = portable(from, going);
  if (!carried.elements.length || !to.node(place.under)) return [];
  to.checkpoint();
  let made = makePortable(to, carried, { under: place.under, pos: place.pos });
  if (made.length && place.index !== undefined) {
    made = to.move(made, place.under, place.index, { pos: null });
  }
  to.checkpoint();
  if (move && made.length) {
    from.checkpoint();
    from.remove(going);
    from.checkpoint();
    pair(to, from);
  }
  return made;
}

/** Two steps, one in each of two projects, that are undone and done again together. */
interface Pair {
  a: Project;
  b: Project;
}

const PAIRED = 'across';
const linked = new WeakSet<Project>();

/** The steps last done in two projects are one. */
function pair(a: Project, b: Project) {
  const steps = [a.undoManager.undoStack.at(-1), b.undoManager.undoStack.at(-1)];
  if (!steps[0] || !steps[1]) return;
  const both: Pair = { a, b };
  for (const step of steps) step!.meta.set(PAIRED, both);
  follow(a);
  follow(b);
}

/** A project undoes or does again its part of a pair when the other does. */
function follow(p: Project) {
  if (linked.has(p)) return;
  linked.add(p);
  const um = p.undoManager;
  um.on('stack-item-popped', ({ stackItem, type }) => {
    const both = stackItem.meta.get(PAIRED) as Pair | undefined;
    if (!both) return;
    // The step that takes its place on the other stack is of the pair as well.
    const instead = (type === 'undo' ? um.redoStack : um.undoStack).at(-1);
    instead?.meta.set(PAIRED, both);
    const other = both.a === p ? both.b : both.a;
    if (other.doc.isDestroyed) return;
    const stack = type === 'undo' ? other.undoManager.undoStack : other.undoManager.redoStack;
    if (stack.at(-1)?.meta.get(PAIRED) !== both) return;
    if (type === 'undo') other.undo();
    else other.redo();
  });
}
