/**
 * Elements in a form that another project can take (ADR 0033): what they
 * are, not where they are. Each element with all under it, its name and its
 * text as the document model (`Block`), and what else is said of it; the
 * links among them; the kinds of element, of paragraph and of words of the
 * project's own that they use; and what the project keeps of the works
 * they cite. It holds nothing of the project it came from, so it can be
 * made again after that project is closed.
 *
 * What does not cross: comments, which are the conversation of a project;
 * that a copy is a copy of an original; and the map an element stands for.
 * Words that point to an element left behind point to nothing, as when it
 * is deleted. Pictures are in the store, which all projects share.
 */

import { generateKeyBetween, generateNKeysBetween } from 'fractional-indexing';
import * as Y from 'yjs';
import type { Bound, When } from '$lib/timeline/solve';
import { newId } from '$lib/util/id';
import { writeBody, writeName } from './blocks';
import { keyAt, makeNode } from './changing/elements';
import { makeLink } from './changing/links';
import type { Project } from './project.svelte';
import { readTitle, type Block, type Inline } from './text';
import { topmost } from './tree';
import type { KindRecord, PassageKindRecord, Position, RefRecord } from './types';

export interface PortableElement {
  /** Its id in the project it came from: links, and words that point, name it so. */
  id: string;
  name: Inline[];
  text: Block[];
  /**
   * What else is said of it, as the document holds it: its kind, its
   * time, whether it is folded, how far its writing has come, where it
   * stands, whether it is a heading or left out.
   */
  facts: Record<string, unknown>;
  /** What is under it, in order. */
  children: PortableElement[];
}

export interface Portable {
  /** The topmost of the elements, each with all under it. */
  elements: PortableElement[];
  /** The links between them, by the ids they had. */
  links: { from: string; to: string; label: string }[];
  /** The kinds of element they are. */
  kinds: Omit<KindRecord, 'order'>[];
  /** The kinds of paragraph and of words of the project's own that their texts use, with those they are based on. */
  passageKinds: Omit<PassageKindRecord, 'order'>[];
  /** What the project kept of the works they cite. */
  references: RefRecord[];
}

/** Where elements are made: under an element, at the end; or loose in a map, at a place. */
export type Place = { under: string } | { map: string; pos: Position };

/** What of an element does not cross, or is made anew where it arrives. */
const LEFT = new Set(['map', 'parent', 'order', 'title', 'body', 'origin', 'include']);

/** Names alike, whatever their case and spaces. */
const alike = (a: string, b: string) =>
  a.replace(/\s+/g, ' ').trim().toLocaleLowerCase() ===
  b.replace(/\s+/g, ' ').trim().toLocaleLowerCase();

/** The elements, each with all under it, in a form another project can take. */
export function portable(p: Project, ids: string[]): Portable {
  const empty: Portable = { elements: [], links: [], kinds: [], passageKinds: [], references: [] };
  const first = p.node(ids[0]);
  if (!first) return empty;
  const tree = p.tree(first.map);
  const tops = topmost(
    tree,
    ids.filter((id) => p.node(id)?.map === first.map),
  );
  const carried = new Set<string>();

  const read = (id: string): PortableElement => {
    carried.add(id);
    const facts: Record<string, unknown> = {};
    for (const [key, value] of p.yNodes.get(id) ?? []) {
      if (LEFT.has(key) || value instanceof Y.AbstractType || value === undefined) continue;
      facts[key] = structuredClone(value);
    }
    return {
      id,
      name: readTitle(p.fragment(id, 'title') ?? undefined),
      text: structuredClone(p.blocksOf(id)),
      facts,
      children: (tree.children.get(id) ?? []).map(read),
    };
  };
  const elements = tops.map(read);

  const kinds = new Map<string, Omit<KindRecord, 'order'>>();
  const passageKinds = new Map<string, Omit<PassageKindRecord, 'order'>>();
  const references = new Map<string, RefRecord>();
  const own = (id: string | undefined) => {
    // With what it is based on, where that is of the project's own too.
    while (id && !passageKinds.has(id)) {
      const k = p.passageKind(id);
      if (!k) return;
      passageKinds.set(id, {
        id,
        name: k.name,
        family: k.family,
        basedOn: k.basedOn,
        look: k.look,
      });
      id = k.basedOn;
    }
  };
  for (const id of carried) {
    const n = p.node(id);
    if (!n) continue;
    const kind = p.kind(n.kind);
    if (kind && !kinds.has(kind.id)) {
      kinds.set(kind.id, {
        id: kind.id,
        name: kind.name,
        colour: kind.colour,
        template: kind.template,
        ...(kind.begins ? { begins: kind.begins } : {}),
      });
      own(kind.begins);
    }
    for (const used of n.uses) own(used);
    for (const cited of n.cited) {
      const record = p.refs.get(cited);
      if (record) references.set(cited, structuredClone(record));
    }
  }

  return {
    elements,
    links: p.links
      .filter((l) => carried.has(l.from) && carried.has(l.to))
      .map((l) => ({ from: l.from, to: l.to, label: l.label })),
    // In the order they have where they came from, which they keep where they are added.
    kinds: p.kinds.flatMap((k) => kinds.get(k.id) ?? []),
    passageKinds: p.passageKinds.flatMap((k) => passageKinds.get(k.id) ?? []),
    references: [...references.values()],
  };
}

/** How many elements a portable form holds, all under the topmost counted. */
export function countPortable(carried: Portable): number {
  const count = (list: PortableElement[]): number =>
    list.reduce((n, e) => n + 1 + count(e.children), 0);
  return count(carried.elements);
}

/**
 * The kinds of paragraph and of words that arrive: those of the same id
 * here are used, else those of the same name and family, else they are
 * added with the id they had. Says, of each id that arrives, the id it has here.
 */
function takePassageKinds(p: Project, carried: Portable): Map<string, string> {
  const ids = new Map<string, string>();
  const added: Omit<PassageKindRecord, 'order'>[] = [];
  for (const k of carried.passageKinds) {
    if (p.yPassageKinds.has(k.id)) ids.set(k.id, k.id);
    else {
      const named = p.passageKinds.find((o) => o.family === k.family && alike(o.name, k.name));
      if (named) ids.set(k.id, named.id);
      else {
        ids.set(k.id, k.id);
        added.push(k);
      }
    }
  }
  let last = p.passageKinds.length ? p.passageKinds[p.passageKinds.length - 1].order : null;
  for (const k of added) {
    const y = new Y.Map<unknown>();
    y.set('name', k.name);
    y.set('family', k.family);
    const base = ids.get(k.basedOn) ?? k.basedOn;
    if (base) y.set('basedOn', base);
    if (Object.keys(k.look).length) y.set('look', structuredClone(k.look));
    last = generateKeyBetween(last, null);
    y.set('order', last);
    p.yPassageKinds.set(k.id, y);
  }
  return ids;
}

/** So with the kinds of element: by id, else by name, else added. */
function takeKinds(p: Project, carried: Portable, passages: Map<string, string>) {
  const ids = new Map<string, string>();
  let last = p.kinds.length ? p.kinds[p.kinds.length - 1].order : null;
  for (const k of carried.kinds) {
    if (p.yKinds.has(k.id)) {
      ids.set(k.id, k.id);
      continue;
    }
    const named = p.kinds.find((o) => alike(o.name, k.name));
    if (named) {
      ids.set(k.id, named.id);
      continue;
    }
    ids.set(k.id, k.id);
    const y = new Y.Map<unknown>();
    y.set('name', k.name);
    y.set('colour', k.colour);
    if (k.template) y.set('template', k.template);
    if (k.begins) y.set('begins', passages.get(k.begins) ?? k.begins);
    last = generateKeyBetween(last, null);
    y.set('order', last);
    p.yKinds.set(k.id, y);
  }
  return ids;
}

/**
 * A text as it is to be written where it arrives: its kinds of paragraph
 * and of words named as they are there (`kind`), and words that point to
 * an element that came with it pointing to what it is there (`point`).
 */
function retold(blocks: Block[], kind: (id: string) => string, point: (id: string) => string) {
  const line = (inlines: Inline[]): Inline[] =>
    inlines.map((i): Inline => {
      if (i.kind === 'text') {
        const said = i.marks.kind;
        if (said && typeof said === 'object' && typeof said.name === 'string')
          return { ...i, marks: { ...i.marks, kind: { ...said, name: kind(said.name) } } };
        return i;
      }
      if (i.kind === 'crossref') return { ...i, target: point(i.target) };
      if (i.kind === 'footnote') return { ...i, content: line(i.content) };
      return i;
    });
  const list = (bs: Block[]): Block[] => bs.map(block);
  function block(b: Block): Block {
    switch (b.kind) {
      case 'paragraph':
      case 'script':
        return { ...b, content: line(b.content) };
      case 'passage':
        return { ...b, name: kind(b.name), content: line(b.content) };
      case 'blockquote':
        return { ...b, content: list(b.content) };
      case 'verse':
        return { ...b, lines: b.lines.map((l) => ({ ...l, content: line(l.content) })) };
      case 'parallel':
        return { ...b, left: list(b.left), right: list(b.right) };
      case 'bullet_list':
      case 'ordered_list':
        return { ...b, items: b.items.map(list) };
      case 'figure':
        return { ...b, caption: line(b.caption) };
      case 'table':
        return {
          ...b,
          caption: line(b.caption),
          rows: b.rows.map((row) => row.map((cell) => ({ ...cell, content: list(cell.content) }))),
        };
      case 'row':
        return { ...b, items: list(b.items) };
      default:
        return b;
    }
  }
  return { blocks: list(blocks), line };
}

/** A time that names elements that came with it, naming what they are where it arrives. */
function retime(when: When, point: (id: string) => string): When {
  const bound = (b: Bound): Bound => {
    const out = { ...b };
    for (const key of ['after', 'before', 'during'] as const) {
      const id = out[key];
      if (id) out[key] = point(id);
    }
    return out;
  };
  return when.end
    ? { start: bound(when.start), end: bound(when.end) }
    : { start: bound(when.start) };
}

/**
 * Makes the elements of a portable form in a project, with new ids: under
 * an element, at the end of what is under it, or loose in a map, at a
 * place, one under another. The kinds they use are found here or added;
 * the links among them are made again. Returns the ids of the topmost.
 */
export function makePortable(p: Project, carried: Portable, place: Place): string[] {
  const parent = 'under' in place ? p.node(place.under) : null;
  if ('under' in place && !parent) return [];
  const map = parent ? parent.map : 'map' in place ? place.map : '';
  if (!map || !p.yMaps.has(map) || !carried.elements.length) return [];
  const tree = p.tree(map);

  const ids = new Map<string, string>();
  const name = (list: PortableElement[]) => {
    for (const e of list) {
      ids.set(e.id, newId());
      name(e.children);
    }
  };
  name(carried.elements);
  const point = (id: string) => ids.get(id) ?? id;
  const made: string[] = [];

  p.transact(() => {
    const passages = takePassageKinds(p, carried);
    const kinds = takeKinds(p, carried, passages);
    const kindOf = (id: string) => passages.get(id) ?? id;

    const write = (e: PortableElement, under: string | null, order: string) => {
      const id = ids.get(e.id)!;
      const n = makeNode(p, id, { map, parent: under, order });
      for (const [key, value] of Object.entries(e.facts)) {
        if (LEFT.has(key) || value === undefined || value === null) continue;
        n.set(key, structuredClone(value));
      }
      const kind = e.facts.kind;
      // A kind that was not there where it came from is not here either.
      if (typeof kind === 'string')
        if (kinds.has(kind)) n.set('kind', kinds.get(kind));
        else n.delete('kind');
      const when = e.facts.when as When | undefined;
      if (when && typeof when === 'object' && when.start) n.set('when', retime(when, point));
      const { blocks, line } = retold(e.text, kindOf, point);
      writeName(n.get('title') as Y.XmlFragment, line(e.name));
      writeBody(n.get('body') as Y.XmlFragment, blocks);
      const keys = e.children.length ? generateNKeysBetween(null, null, e.children.length) : [];
      e.children.forEach((child, i) => write(child, id, keys[i]));
      return n;
    };

    const siblings = (parent ? (tree.children.get(parent.id) ?? []) : tree.loose).slice();
    for (const e of carried.elements) {
      const n = write(e, parent?.id ?? null, keyAt(p, siblings, siblings.length));
      const id = ids.get(e.id)!;
      siblings.push(id);
      made.push(id);
      n.delete('side');
      if (parent) n.delete('pos');
      else if ('pos' in place)
        n.set('pos', {
          x: Math.round(place.pos.x),
          y: Math.round(place.pos.y + (made.length - 1) * 60),
        });
    }

    for (const l of carried.links) {
      const from = ids.get(l.from);
      const to = ids.get(l.to);
      if (from && to && from !== to) makeLink(p, from, to, l.label);
    }
  });

  // Not part of undo, as where a work is cited: it is not the writer's writing.
  for (const record of carried.references) p.putReference(structuredClone(record));
  return made;
}
