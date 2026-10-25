/**
 * A mind map into the elements of a project, and the elements of a
 * project into a mind map, by way of the form elements cross between
 * projects in (`Portable`): what crosses is what both have, names, texts,
 * folding, how far the writing has come, kinds, times, what is left out of
 * the document, and associations. Places given by hand do not cross: the
 * two measure them otherwise, and a map is tidied in a moment.
 */

import { balance } from '$lib/project/diagram/layout';
import { KIND_COLOURS, kindColour, nextKindColour } from '$lib/project/kinds';
import type { Portable, PortableElement } from '$lib/project/model/portable';
import type { Block, Inline } from '$lib/project/model/text';
import { STATUSES, type Position, type Status } from '$lib/project/model/types';
import type { When } from '$lib/timeline/solve';
import { newId } from '$lib/util/id';
import type { Association, MindMap, Topic } from './map';

/** The colour of the kinds nearest to `#rrggbb`, by its name. */
export function nearestColour(hex: string | null): string | null {
  const rgb = (h: string) => {
    const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i.exec(h.trim());
    return m ? [1, 2, 3].map((i) => parseInt(m[i], 16)) : null;
  };
  const given = hex ? rgb(hex) : null;
  if (!given) return null;
  let best: string | null = null;
  let bestDistance = Infinity;
  for (const c of KIND_COLOURS) {
    const [r, g, b] = rgb(c.ink)!;
    const d = (r - given[0]) ** 2 + (g - given[1]) ** 2 + (b - given[2]) ** 2;
    if (d < bestDistance) {
      bestDistance = d;
      best = c.name;
    }
  }
  return best;
}

/**
 * The topics under the one in the middle as elements another project can
 * take, with the kinds they name, each made once by its name, in the
 * colour the file gives the first of it, or one not yet taken. Associations
 * whose ends are both there come with them.
 */
export function intoPortable(map: MindMap): Portable {
  const kinds = new Map<string, { id: string; name: string; colour: string }>();
  const kindOf = (kind: Topic['kind']): string | null => {
    if (!kind?.name.trim()) return null;
    const key = kind.name.trim().toLocaleLowerCase();
    let k = kinds.get(key);
    if (!k) {
      const colour =
        nearestColour(kind.colour) ?? nextKindColour([...kinds.values()].map((x) => x.colour));
      k = { id: newId(), name: kind.name.trim(), colour };
      kinds.set(key, k);
    }
    return k.id;
  };
  const ids = new Set<string>();
  const element = (t: Topic): PortableElement => {
    const id = ids.has(t.id) || !t.id ? newId() : t.id;
    ids.add(id);
    const facts: Record<string, unknown> = {};
    if (t.folded && t.children.length) facts.collapsed = true;
    if (t.status) facts.status = t.status;
    const kind = kindOf(t.kind);
    if (kind) facts.kind = kind;
    if (t.when) facts.when = structuredClone(t.when);
    if (t.excluded) facts.excluded = true;
    return { id, name: t.name, text: t.text, facts, children: t.children.map(element) };
  };
  const elements = map.root.children.map(element);
  return {
    elements,
    links: map.links.filter((l) => ids.has(l.from) && ids.has(l.to) && l.from !== l.to),
    kinds: [...kinds.values()].map((k) => ({
      id: k.id,
      name: k.name,
      colour: k.colour,
      template: '',
    })),
    passageKinds: [],
    references: [],
  };
}

/** What a project's own element is, as the middle of a mind map. */
export interface Middle {
  id: string;
  name: Inline[];
  text: Block[];
}

const statusOf = (value: unknown): Status | null =>
  STATUSES.includes(value as Status) ? (value as Status) : null;

/**
 * A project as a mind map: its own element in the middle, the elements
 * under it as topics, each kind by its name and colour. The first under
 * the middle stand on the side they stand on in the diagram: where they
 * were put, or as the diagram divides them, the first to the right.
 */
export function mindMapOf(name: string, middle: Middle, carried: Portable): MindMap {
  const kinds = new Map(carried.kinds.map((k) => [k.id, k]));
  const topicOf = (e: PortableElement): Topic => {
    const kind = typeof e.facts.kind === 'string' ? kinds.get(e.facts.kind) : undefined;
    const when = e.facts.when as When | undefined;
    return {
      id: e.id,
      name: e.name,
      text: e.text,
      folded: e.facts.collapsed === true && e.children.length > 0,
      status: statusOf(e.facts.status),
      kind: kind ? { name: kind.name, colour: kindColour(kind.colour).ink } : null,
      when: when && typeof when === 'object' && when.start ? when : null,
      excluded: e.facts.excluded === true,
      children: e.children.map(topicOf),
    };
  };
  const firsts = carried.elements.map(topicOf);
  // As the diagram divides them: those put by hand where they were put, the rest by the size of their branches.
  // A box and the room between two, about, in the diagram's measure.
  const shown = (t: Topic): number =>
    t.folded || !t.children.length ? 52 : t.children.reduce((n, c) => n + shown(c), 0);
  const placed = carried.elements.map((e) => e.facts.pos as Position | undefined);
  const occupied = { left: 0, right: 0 };
  const flowing: number[] = [];
  firsts.forEach((t, i) => {
    const pos = placed[i];
    if (pos && typeof pos.x === 'number' && pos.x !== 0) {
      t.side = pos.x < 0 ? 'left' : 'right';
      occupied[t.side] += shown(t);
    } else flowing.push(i);
  });
  const split = balance(
    flowing.map((i) => shown(firsts[i])),
    occupied.right,
    occupied.left,
  );
  flowing.forEach((i, n) => (firsts[i].side = n < split ? 'right' : 'left'));
  const root: Topic = {
    id: middle.id,
    name: middle.name,
    text: middle.text,
    folded: false,
    status: null,
    kind: null,
    when: null,
    excluded: false,
    children: firsts,
  };
  const links: Association[] = carried.links.map((l) => ({ ...l }));
  return { name, root, links };
}

/** Every topic of a map, the one in the middle first, each before what is under it. */
export function* topicsOf(root: Topic): Generator<Topic> {
  yield root;
  for (const c of root.children) yield* topicsOf(c);
}
