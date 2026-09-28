/**
 * Searching the elements of a project, as the text of a map or the edit box
 * of an element does: what is found, in the order of the text.
 *
 * What is searched is read from the project, not from the editors (ADR
 * 0017). The passages of each element are kept while its name and text
 * stay as they are, so that a search after a change reads again only what
 * was changed.
 */

import type { Project } from '$lib/project/model/project.svelte';
import { readTitle } from '$lib/project/model/text';
import type { Hit, Matcher } from './matching';
import { bodyPassages, titlePassage, type Labels, type Passage } from './passages';

export type Part = 'title' | 'body';

/** Something that was found. */
export interface Match {
  element: string;
  part: Part;
  passage: number;
  start: number;
  end: number;
  /** The text of it. */
  text: string;
  /** Of a regular expression: where its groups were, for what is put in its place. */
  hit: Hit;
  /** Of a note: where the note stands in the passage it is in. */
  within?: Passage['within'];
}

/** The passages of an element: its name, and its text. */
export interface Read {
  title: Passage;
  body: Passage[];
}

/** A place in the passages of a name or a text. */
export interface Place {
  passage: number;
  offset: number;
}

/** Text that was selected, to which a search is kept: in the name or the text of one element. */
export interface Scope {
  element: string;
  part: Part;
  from: Place;
  to: Place;
}

export class Texts {
  readonly project: Project;
  #kept = new Map<string, { key: string; read: Read }>();

  constructor(project: Project) {
    this.project = project;
  }

  /**
   * The passages of an element as it is now. With labels, what stands
   * outside the text is read as it is shown; that is not kept, since what a
   * citation shows changes with the library, and not with the element.
   */
  of(id: string, labels: Labels | null = null): Read | null {
    const node = this.project.node(id);
    const stamp = this.project.stampOf(id);
    if (!node || !stamp) return null;
    const key = `${stamp}\u0000${node.titleHtml}`;
    if (!labels) {
      const known = this.#kept.get(id);
      if (known?.key === key) return known.read;
    }
    const title = readTitle(this.project.fragment(id, 'title') ?? undefined);
    const read: Read = {
      title: titlePassage(title),
      body: bodyPassages(this.project.blocksOf(id), labels),
    };
    if (!labels) this.#kept.set(id, { key, read });
    return read;
  }

  /** Forgets what is kept of elements that are not among these. */
  keepOnly(ids: Iterable<string>) {
    const wanted = new Set(ids);
    for (const id of this.#kept.keys()) if (!wanted.has(id)) this.#kept.delete(id);
  }
}

/** Whether a place is within a scope of the same part, from its beginning to its end. */
function inside(scope: Scope, passage: number, offset: number): boolean {
  const { from, to } = scope;
  const after = passage > from.passage || (passage === from.passage && offset >= from.offset);
  const before = passage < to.passage || (passage === to.passage && offset < to.offset);
  return after && before;
}

/** What is searched of a passage: all of it, a part of it, or nothing. */
function withinScope(
  scope: Scope | null,
  element: string,
  part: Part,
  p: Passage,
): [number, number] | null | false {
  if (!scope) return null;
  if (scope.element !== element || scope.part !== part) return false;
  // A note is in the selection when the place it stands at is.
  if (p.within) return inside(scope, p.within.passage, p.within.at) ? null : false;
  if (p.index < scope.from.passage || p.index > scope.to.passage) return false;
  return [
    p.index === scope.from.passage ? scope.from.offset : 0,
    p.index === scope.to.passage ? scope.to.offset : p.text.length,
  ];
}

/** What is found in the passages of a name or a text, in the order of the text. */
export function findIn(
  matcher: Matcher,
  element: string,
  part: Part,
  passages: Passage[],
  scope: Scope | null = null,
): Match[] {
  const out: { match: Match; order: number[] }[] = [];
  for (const p of passages) {
    if (!p.text) continue;
    const within = withinScope(scope, element, part, p);
    if (within === false) continue;
    for (const hit of matcher.find(p.text, within)) {
      const match: Match = {
        element,
        part,
        passage: p.index,
        start: hit.start,
        end: hit.end,
        text: p.text.slice(hit.start, hit.end),
        hit,
        ...(p.within ? { within: p.within } : {}),
      };
      // What is found in a note comes where the note stands.
      const order = p.within
        ? [p.within.passage, p.within.at, 1, hit.start]
        : [p.index, hit.start, 0, 0];
      out.push({ match, order });
    }
  }
  out.sort((a, b) => {
    for (let i = 0; i < 4; i++) {
      const d = a.order[i] - b.order[i];
      if (d) return d;
    }
    return 0;
  });
  return out.map((o) => o.match);
}

/** What is found in elements, one after the other: in each, its name first and then its text. */
export function search(
  texts: Texts,
  elements: string[],
  matcher: Matcher,
  options: { labels?: Labels | null; scope?: Scope | null } = {},
): Match[] {
  const out: Match[] = [];
  const scope = options.scope ?? null;
  for (const id of elements) {
    if (scope && scope.element !== id) continue;
    const read = texts.of(id, options.labels ?? null);
    if (!read) continue;
    out.push(...findIn(matcher, id, 'title', [read.title], scope));
    out.push(...findIn(matcher, id, 'body', read.body, scope));
  }
  return out;
}

/**
 * Where a match stands among others, for finding the one that comes at or
 * after a place: the element's place in the list, the part, and the place in
 * the passages, with a note where it stands.
 */
export function orderOf(elements: Map<string, number>, m: Match): number[] {
  const at = m.within ? [m.within.passage, m.within.at, 1, m.start] : [m.passage, m.start, 0, 0];
  return [elements.get(m.element) ?? -1, m.part === 'title' ? 0 : 1, ...at];
}

export function compareOrder(a: number[], b: number[]): number {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const d = (a[i] ?? 0) - (b[i] ?? 0);
    if (d) return d;
  }
  return 0;
}
