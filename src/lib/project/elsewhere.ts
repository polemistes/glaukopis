/**
 * Projects other than the one being written in: those open in the view,
 * side by side (ADR 0037), and those that are not open, opened to be
 * written in and let go when what was written is on disk, for elements
 * sent or moved to them (ADR 0033). A project open in the view is never
 * opened a second time from disk: what is written in it is written in the
 * one that is open.
 */

import { openProject, projects } from '$lib/state/projects.svelte';
import { router } from '$lib/state/router.svelte';
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

/** Those who wait for a project open in the view to be closed: see `goneHere`. */
const waiting = new Map<string, Set<() => void>>();

/** A project open in the view is closed; another opened since under the same id is left. */
export function closedHere(id: string, project?: Project) {
  if (project && open.get(id) !== project) return;
  open.delete(id);
  for (const told of waiting.get(id) ?? []) told();
  waiting.delete(id);
}

/**
 * When the project of that id is no longer open in the view: at once where
 * it is not. Whether it was let go within `ms`, so that what waits for it
 * never waits for ever.
 */
export function goneHere(id: string, ms: number): Promise<boolean> {
  if (!open.has(id)) return Promise.resolve(true);
  return new Promise((resolve) => {
    const told = () => {
      clearTimeout(timer);
      resolve(true);
    };
    const timer = setTimeout(() => {
      waiting.get(id)?.delete(told);
      resolve(!open.has(id));
    }, ms);
    let those = waiting.get(id);
    if (!those) waiting.set(id, (those = new Set()));
    those.add(told);
  });
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

/** The id of the project the route names, where the view is a project. */
export function routeProjectId(): string | null {
  const route = router.route;
  return route.view === 'project' ? route.project : null;
}

/**
 * The id of a project: as it is open in the view, else as the route names
 * it, since a project being opened is named by the route before it is
 * among those open. Without a project, the route's alone.
 */
export function openProjectId(project?: Project): string | null {
  return (project && idOf(project)) ?? routeProjectId();
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
  let made = makePortable(to, carried, {
    under: place.under,
    pos: place.pos,
    keepFolded: place.keepFolded,
  });
  if (made.length && place.index !== undefined) {
    made = to.move(made, place.under, place.index, { pos: null, keepFolded: place.keepFolded });
  }
  to.checkpoint();
  if (move && made.length) removeCarried(to, lastStep(to), from, going);
  return made;
}

/** A step of undo, as a project's undo keeps it. */
type Step = NonNullable<ReturnType<typeof lastStep>>;

/** The step last done in a project: to be paired with one done in another. */
export function lastStep(p: Project) {
  return p.undoManager.undoStack.at(-1);
}

/**
 * Removes from a project open in the view the elements just made in
 * another from them, in `made`, the step that made them there; the two
 * steps are one, as for a drag from one pane onto the other (ADR 0053), so
 * that undone in either project the elements are back in the other. For
 * cut and paste, and for *Move to*, as for a drag. Where nothing was there
 * to be removed, there is nothing to pair.
 */
export function removeCarried(to: Project, made: Step | undefined, from: Project, ids: string[]) {
  from.checkpoint();
  const before = lastStep(from);
  from.remove(ids);
  from.checkpoint();
  const removed = lastStep(from);
  if (made && removed && removed !== before && from !== to) pairSteps(to, made, from, removed);
}

/** Two steps, one in each of two projects, that are undone and done again together. */
interface Pair {
  a: Project;
  b: Project;
}

const PAIRED = 'across';
const linked = new WeakSet<Project>();

/** Two steps, one done in each of two projects, are one. */
function pairSteps(a: Project, stepA: Step, b: Project, stepB: Step) {
  const both: Pair = { a, b };
  stepA.meta.set(PAIRED, both);
  stepB.meta.set(PAIRED, both);
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
