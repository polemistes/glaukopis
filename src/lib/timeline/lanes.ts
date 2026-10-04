/**
 * A map as a timeline: its lanes, and what stands in each. A lane is an
 * element: it holds the placed elements of its branch, and its own
 * placement, if it has one, is the span of the lane (a person's lifetime,
 * a city's existence). By default every child of the centre is a lane.
 * An element that stands for another map brings that map's placed
 * elements with it, as its own.
 *
 * An element that says nothing of its time is not on the timeline. When
 * what waits is wanted, it is listed in its lane as **waiting**, under the
 * nearest element over it that is placed, where there is one in the lane,
 * so that where it stands in the map is seen; it is not placed in time.
 */

import type { Project } from '$lib/project/model/project.svelte';
import { subtree } from '$lib/project/model/tree';
import type { Lane, NodeRecord } from '$lib/project/model/types';
import { solve, type Placed, type Solved, type When } from './solve';
import type { Axis } from './time';

export interface TimelineLane {
  /** The element the lane is. */
  id: string;
  name: string;
  /** The ink of its kind, where it has one. */
  colour: string | null;
  /** Its own placement, as the span of the lane. */
  own: Placed | null;
  /** What stands in it, in the order of the text. */
  events: Event[];
  /** What is in its branch and says nothing of its time, the lane's own element first where it says nothing; only when what waits is wanted. */
  waiting: Waiting[];
  /** Nothing in it is placed: it is shown only for what waits in it. */
  empty: boolean;
}

/** An element that says nothing of its time, where it belongs. */
export interface Waiting {
  id: string;
  name: string;
  /**
   * The nearest element over it that is placed, among the events of its
   * lane: it is shown under that one. Nothing where none is, or the nearest
   * is the lane's own element, whose area is the lane.
   */
  under: string | null;
  /** The names of what stands between the element it is shown under, or the lane, and it, from the top down; empty for their own children. */
  path: string[];
  /** The ink of its kind, where it has one. */
  colour: string | null;
}

export interface Event {
  id: string;
  name: string;
  node: NodeRecord;
  placed: Placed;
  colour: string | null;
}

export interface Timeline {
  axis: Axis;
  solved: Solved;
  lanes: TimelineLane[];
  /** Placed elements that are in no lane. */
  elsewhere: Event[];
  /** Elements in no lane that say nothing of their time; only when what waits is wanted. */
  waitingElsewhere: Waiting[];
}

/** The elements of a map and of the maps it stands for, in the order of the text. */
function elementsOf(project: Project, mapId: string, seen = new Set<string>()): string[] {
  if (seen.has(mapId)) return [];
  seen.add(mapId);
  const out: string[] = [];
  for (const id of project.tree(mapId).sequence) {
    out.push(id);
    const node = project.node(id);
    if (node?.include) out.push(...elementsOf(project, node.include, seen));
  }
  return out;
}

/** The branch of an element: itself, what is under it, and the maps those stand for. */
function branchOf(project: Project, id: string, seen = new Set<string>()): string[] {
  const node = project.node(id);
  if (!node) return [];
  const out: string[] = [];
  for (const d of subtree(project.tree(node.map), id)) {
    out.push(d);
    const include = project.node(d)?.include;
    if (include) out.push(...elementsOf(project, include, seen));
  }
  return out;
}

/**
 * The map as a timeline. With `withWaiting`, the lanes in which only
 * elements that say nothing of their time stand are kept as well, so that
 * those elements have a place to be put from.
 */
export function timelineOf(
  project: Project,
  mapId: string,
  colourOf: (node: NodeRecord) => string | null,
  withWaiting = false,
): Timeline {
  const settings = project.map(mapId)?.timeline ?? {};
  const axis: Axis = settings.axis ?? 'dates';
  const all = elementsOf(project, mapId);
  const items: { id: string; when: When }[] = [];
  for (const id of all) {
    const node = project.node(id);
    if (node?.when) items.push({ id, when: node.when });
  }
  const solved = solve(items, axis);

  const tree = project.tree(mapId);
  const laneElements: string[] = [];
  const chosen: Lane[] = settings.lanes?.length
    ? settings.lanes
    : tree.root
      ? [{ element: tree.root, each: true }]
      : [];
  for (const lane of chosen) {
    if (lane.kind) {
      // Every element of the kind, in the order of the text, the maps it stands for included.
      for (const id of all) if (project.node(id)?.kind === lane.kind) laneElements.push(id);
    } else if (lane.element && lane.each) {
      laneElements.push(...(tree.children.get(lane.element) ?? []));
      // The elements that stand on their own, beside the centre, are at the top of the map as its children are.
      if (lane.element === tree.root) laneElements.push(...tree.loose);
    } else if (lane.element) laneElements.push(lane.element);
  }

  const event = (id: string): Event | null => {
    const node = project.node(id);
    const placed = solved.placed.get(id);
    if (!node || !placed) return null;
    return { id, name: node.title, node, placed, colour: colourOf(node) };
  };
  // The element that stands for each map that is brought in, so that what
  // is over an element is followed up through the maps as the branches are walked.
  const includer = new Map<string, string>();
  for (const id of all) {
    const include = project.node(id)?.include;
    if (include && include !== mapId && !includer.has(include)) includer.set(include, id);
  }
  /** The element over one: its parent, or, at the centre of a map brought in, the element that stands for that map. */
  const upOf = (id: string): string | null => {
    const node = project.node(id);
    if (!node) return null;
    return node.parent ?? includer.get(node.map) ?? null;
  };
  /** The names between an element over another and the other, from the top down. */
  const pathOf = (top: string, id: string): string[] => {
    const names: string[] = [];
    let at = upOf(id);
    for (let depth = 0; at && at !== top && depth < 40; depth++) {
      names.unshift(project.node(at)?.title || '?');
      at = upOf(at);
    }
    return names;
  };
  /**
   * The nearest element over one that is placed, as long as it is among
   * `here`, the placed elements of the lane; nothing where none is, or the
   * nearest is in another lane. The lane itself ends the search.
   */
  const over = (lane: string, id: string, here: ReadonlySet<string>): string | null => {
    let at = upOf(id);
    for (let depth = 0; at && depth < 40; depth++) {
      if (at === lane) return null;
      if (solved.placed.has(at)) return here.has(at) ? at : null;
      at = upOf(at);
    }
    return null;
  };
  const waiting = (lane: string, id: string, here: ReadonlySet<string>): Waiting | null => {
    const node = project.node(id);
    if (!node || node.when) return null;
    const under = id === lane ? null : over(lane, id, here);
    return {
      id,
      name: node.title,
      under,
      path: id === lane ? [] : pathOf(under ?? lane, id),
      colour: colourOf(node),
    };
  };
  const taken = new Set<string>();
  // What is in the branch of some lane, shown there or not: it belongs to
  // the lane, and is not elsewhere, whatever is over it there.
  const claimed = new Set<string>();
  const lanes: TimelineLane[] = [];
  for (const id of laneElements) {
    const node = project.node(id);
    if (!node || taken.has(id)) continue;
    const events: Event[] = [];
    const waits: Waiting[] = [];
    // The placed elements of the lane so far, as they are met, each before what is under it.
    const here = new Set<string>();
    for (const d of branchOf(project, id)) {
      if (taken.has(d)) continue;
      claimed.add(d);
      const e = d === id ? null : event(d);
      if (e) {
        events.push(e);
        here.add(d);
        taken.add(d);
        continue;
      }
      if (withWaiting) {
        const w = waiting(id, d, here);
        if (w) {
          waits.push(w);
          taken.add(d);
        }
      }
    }
    taken.add(id);
    const own = solved.placed.get(id) ?? null;
    lanes.push({
      id,
      name: node.title,
      colour: colourOf(node),
      own,
      events,
      waiting: waits,
      empty: !own && !events.length,
    });
  }
  const elsewhere: Event[] = [];
  const waitingElsewhere: Waiting[] = [];
  const here = new Set<string>();
  for (const id of all) {
    if (taken.has(id) || id === tree.root) continue;
    const e = event(id);
    if (!e && claimed.has(id)) continue;
    if (e) {
      elsewhere.push(e);
      here.add(id);
      continue;
    }
    if (withWaiting) {
      const w = waiting('', id, here);
      if (w) waitingElsewhere.push(w);
    }
  }
  // A lane in which nothing says when it is, its element included, is not
  // shown, unless what waits in it is wanted.
  return {
    axis,
    solved,
    lanes: lanes.filter((l) => !l.empty || (withWaiting && l.waiting.length)),
    elsewhere,
    waitingElsewhere,
  };
}
