/**
 * What there is to go through in a map: the passages of its texts, and the
 * citations that were found in them. See `api/found.ts` and ADR 0015.
 *
 * The texts are read as the project keeps them, and not as `model/text.ts`
 * gives them, because what is gathered is changed later where it stands: a
 * passage is known by what holds it in the project, which stays the same
 * while others write around it.
 */

import * as Y from 'yjs';
import type { Found, Passage } from '$lib/api/found';
import { bodySchema, foundAttrs } from '$lib/editor/schema';
import type { Project } from '$lib/project/model/project.svelte';

/** What stands in the text of a passage for what is no text. */
export const NO_TEXT = '￼';

/** A passage, with where it is in the project. */
export interface Place extends Passage {
  /** The element whose text it is part of. */
  element: string;
  /** What holds it in the project: a paragraph, what is said of a figure or a table, or a note. */
  holder: Y.XmlElement;
  /** Of a note: the passage it stands in, and where in it. */
  stands?: { passage: string; at: number };
  /** Its place among the passages, in the order of the text. */
  order: number;
}

/** A citation that was found, as it stands in a passage: all its pieces as one. */
export interface Marked {
  passage: string;
  element: string;
  start: number;
  end: number;
  /** The text of it. */
  text: string;
  /** What the mark holds. */
  found: Found;
  /** Whether it stands in a note, and whether it is all the note holds. */
  note: boolean;
  whole: boolean;
}

export interface Gathered {
  /** The passages, in the order of the text; a note after the passage it stands in. */
  places: Place[];
  /** The citations that were found and not left as text, in the order of the text. */
  marked: Marked[];
}

/**
 * The name of a mark as the schema has it: y-prosemirror keeps a mark that
 * may overlap itself under its name and eight signs more.
 */
export function markName(name: string): string {
  return /^(.*)--[a-zA-Z0-9+/=]{8}$/.exec(name)?.[1] ?? name;
}

/** What the mark `found` holds, among the marks of a piece of text. */
function foundOf(attributes: Record<string, unknown> | undefined): Found | null {
  for (const [name, value] of Object.entries(attributes ?? {})) {
    if (markName(name) === 'found') return foundAttrs(value) as Found | null;
  }
  return null;
}

/** By what a passage is known: the element, and what holds the passage in the project. */
export function passageId(element: string, holder: Y.XmlElement): string {
  const at = holder._item?.id;
  return `${element}/${at ? `${at.client}.${at.clock}` : '-'}`;
}

/** The element a passage belongs to, from what the passage is known by. */
export function elementOf(passage: string): string {
  return passage.split('/')[0];
}

function take(taken: [number, number][], start: number, end: number) {
  const last = taken[taken.length - 1];
  if (last && last[1] === start) last[1] = end;
  else taken.push([start, end]);
}

/** Whether there is nothing but room and full stops: what a note holds beside a citation that is all of it. */
const nothing = (text: string) => /^[\s.]*$/.test(text);

function read(
  holder: Y.XmlElement,
  element: string,
  out: Gathered,
  stands: Place['stands'] | undefined,
) {
  const place: Place = {
    id: passageId(element, holder),
    text: '',
    note: !!stands,
    taken: [],
    element,
    holder,
    order: out.places.length,
    ...(stands ? { stands } : {}),
  };
  out.places.push(place);

  const own: Marked[] = [];
  const notes: { holder: Y.XmlElement; at: number }[] = [];
  let run: Marked | null = null;
  for (const child of holder.toArray()) {
    if (child instanceof Y.XmlText) {
      for (const op of child.toDelta() as {
        insert: unknown;
        attributes?: Record<string, unknown>;
      }[]) {
        if (typeof op.insert !== 'string' || !op.insert) continue;
        const start = place.text.length;
        place.text += op.insert;
        const found = foundOf(op.attributes);
        if (!found) {
          run = null;
          continue;
        }
        take(place.taken, start, place.text.length);
        if (found.left) {
          run = null;
        } else if (run && run.found.id === found.id && run.end === start) {
          // Other marks cut the text of a citation in pieces: they are one.
          run.end = place.text.length;
          run.text += op.insert;
        } else {
          run = {
            passage: place.id,
            element,
            start,
            end: place.text.length,
            text: op.insert,
            found,
            note: place.note,
            whole: false,
          };
          own.push(run);
        }
      }
    } else if (child instanceof Y.XmlElement) {
      run = null;
      const at = place.text.length;
      // A break of the line is room between words, as it is where the text is read.
      place.text += child.nodeName === 'hard_break' ? '\n' : NO_TEXT;
      if (child.nodeName === 'citation') take(place.taken, at, at + 1);
      // A note within a note is not a thing.
      else if (child.nodeName === 'footnote' && !stands) notes.push({ holder: child, at });
    }
  }
  if (place.note) {
    for (const m of own)
      m.whole = nothing(place.text.slice(0, m.start)) && nothing(place.text.slice(m.end));
  }

  // In the order of the text: what a note holds comes where the note stands.
  let n = 0;
  const note = () => {
    const { holder: held, at } = notes[n++];
    read(held, element, out, { passage: place.id, at });
  };
  for (const m of own) {
    while (n < notes.length && notes[n].at < m.start) note();
    out.marked.push(m);
  }
  while (n < notes.length) note();
}

function walk(parent: Y.XmlFragment | Y.XmlElement, element: string, out: Gathered) {
  for (const child of parent.toArray()) {
    if (!(child instanceof Y.XmlElement)) continue;
    const type = bodySchema.nodes[child.nodeName];
    // What a later version added is left alone: it cannot be changed safely here.
    if (!type) continue;
    if (type.inlineContent) read(child, element, out, undefined);
    else if (!type.isLeaf) walk(child, element, out);
  }
}

/** The passages of the text of one element, and what was found in them. */
export function gatherElement(project: Project, element: string, into?: Gathered): Gathered {
  const out = into ?? { places: [], marked: [] };
  const body = project.fragment(element, 'body');
  if (body) walk(body, element, out);
  return out;
}

/**
 * The passages of a map and the citations that were found in them, in the
 * order of the text: in the texts of all its elements, in notes, in what is
 * said of figures and tables, and in cells.
 */
export function gather(project: Project, map: string): Gathered {
  const out: Gathered = { places: [], marked: [] };
  for (const element of project.tree(map).sequence) gatherElement(project, element, out);
  return out;
}

/** How many citations that were found a map has to go through. */
export function countFound(project: Project, map: string): number {
  return gather(project, map).marked.length;
}

/** A passage as it is now, by what it is known by. Nothing, when it is no longer there. */
export function locate(project: Project, passage: string): Place | null {
  const element = elementOf(passage);
  if (!project.yNodes.has(element)) return null;
  return gatherElement(project, element).places.find((p) => p.id === passage) ?? null;
}

/** A passage as the commands take it. */
export function passageOf(place: Place): Passage {
  return { id: place.id, text: place.text, note: place.note, taken: place.taken };
}

/**
 * Where something stands among all that is gone through: by the passage it
 * stands in and its place there, and, within a note, by where the note stands.
 */
export function placeOf(
  places: Map<string, Place>,
  passage: string,
  start: number,
): [number, number, number, number] {
  const place = places.get(passage);
  if (!place) return [Number.MAX_SAFE_INTEGER, 0, 0, 0];
  const outer = place.stands ? places.get(place.stands.passage) : undefined;
  if (place.stands && outer) return [outer.order, place.stands.at, 1, start];
  return [place.order, start, 0, 0];
}

export function inOrder(a: readonly number[], b: readonly number[]): number {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const d = (a[i] ?? 0) - (b[i] ?? 0);
    if (d) return d;
  }
  return 0;
}
