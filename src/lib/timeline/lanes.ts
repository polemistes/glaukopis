/**
 * A map as a timeline: its lanes, and what stands in each. A lane is an
 * element: it holds the placed elements of its branch, and its own
 * placement, if it has one, is the span of the lane (a person's lifetime,
 * a city's existence). By default every child of the centre is a lane.
 * An element that stands for another map brings that map's placed
 * elements with it, as its own.
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

/** The map as a timeline. */
export function timelineOf(
  project: Project,
  mapId: string,
  colourOf: (node: NodeRecord) => string | null,
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
    if (lane.each) laneElements.push(...(tree.children.get(lane.element) ?? []));
    else laneElements.push(lane.element);
  }

  const event = (id: string): Event | null => {
    const node = project.node(id);
    const placed = solved.placed.get(id);
    if (!node || !placed) return null;
    return { id, name: node.title, node, placed, colour: colourOf(node) };
  };
  const taken = new Set<string>();
  const lanes: TimelineLane[] = [];
  for (const id of laneElements) {
    const node = project.node(id);
    if (!node || taken.has(id)) continue;
    const events: Event[] = [];
    for (const d of branchOf(project, id)) {
      if (d === id || taken.has(d)) continue;
      const e = event(d);
      if (e) {
        events.push(e);
        taken.add(d);
      }
    }
    taken.add(id);
    lanes.push({
      id,
      name: node.title,
      colour: colourOf(node),
      own: solved.placed.get(id) ?? null,
      events,
    });
  }
  const elsewhere: Event[] = [];
  for (const id of all) {
    if (taken.has(id)) continue;
    const e = event(id);
    if (e) elsewhere.push(e);
  }
  return { axis, solved, lanes, elsewhere };
}
