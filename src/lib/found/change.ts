/**
 * What is done to the text with a citation that was found: it is made a
 * citation, or left as the text it is.
 *
 * The text is changed where the project keeps it, whether an editor is bound
 * to it or not. What holds the passage (a paragraph, a caption, a note) is
 * read as a node of ProseMirror, changed as an editor would change it, and
 * written back by the means the editors write with, so that the project
 * holds what an editor would have left. Only that one holder is written:
 * what others write elsewhere at the same time is not touched, and what
 * they write in the same line is brought together as it is when two write
 * in one paragraph. An editor that is bound takes the change up as it takes
 * up what comes from others. Each change is a step of the undo of the
 * project.
 */

import type { Attrs, Mark, Node } from 'prosemirror-model';
import { Transform } from 'prosemirror-transform';
import { updateYFragment } from 'y-prosemirror';
import * as Y from 'yjs';
import { bodySchema, type CiteItem, type CiteMode } from '$lib/editor/schema';
import type { Project } from '$lib/project/model/project.svelte';
import { newId } from '$lib/util/id';
import {
  elementOf,
  gatherElement,
  markName,
  type Gathered,
  type Marked,
  type Place,
} from './gather';

/** What is to be changed: a citation that was found, or text that was proposed as one. */
export interface Target {
  passage: string;
  start: number;
  end: number;
  /** The text of it, as it stood when it was found. */
  text: string;
  /** Of one with the mark: the id the mark holds. */
  id?: string;
}

/**
 * Why a change was not made: what was found is no longer in the text; the
 * text is no longer what was proposed; or it cannot be done here.
 */
export type Trouble = 'gone' | 'changed' | 'cannot';

export type Outcome = { done: true } | { done: false; why: Trouble };

/** Where the citation is to stand: where the text stood, or in the place of the note the text stands in. */
export type How = 'here' | 'note';

export interface Making {
  target: Target;
  items: CiteItem[];
  mode: CiteMode;
  how?: How;
}

// ---- the holder as a node of ProseMirror ----

function inlines(parent: Y.XmlElement): Node[] {
  const out: Node[] = [];
  for (const child of parent.toArray()) {
    if (child instanceof Y.XmlText) {
      for (const op of child.toDelta() as {
        insert: unknown;
        attributes?: Record<string, unknown>;
      }[]) {
        if (typeof op.insert !== 'string') throw new Error('something that is no text');
        if (!op.insert) continue;
        const marks: Mark[] = Object.entries(op.attributes ?? {}).map(([name, value]) =>
          bodySchema.mark(markName(name), value as Attrs),
        );
        out.push(bodySchema.text(op.insert, marks));
      }
    } else if (child instanceof Y.XmlElement) {
      out.push(bodySchema.node(child.nodeName, child.getAttributes() as Attrs, inlines(child)));
    }
  }
  return out;
}

/**
 * What holds a passage, as a node of ProseMirror, with all it holds. It
 * throws where the text holds what the schema does not know: such a text is
 * left as it is.
 */
export function nodeOf(holder: Y.XmlElement): Node {
  return bodySchema.node(holder.nodeName, holder.getAttributes() as Attrs, inlines(holder));
}

/** Where a place of the passage is in the node that holds it. */
export function positionOf(node: Node, offset: number): number {
  let at = 0;
  let pos = 0;
  for (let i = 0; i < node.childCount; i++) {
    const child = node.child(i);
    // In the passage, what is no text is one sign, whatever it holds.
    const length = child.isText ? child.text!.length : 1;
    if (offset < at + length) return pos + (child.isText ? offset - at : 0);
    at += length;
    pos += child.nodeSize;
  }
  return pos;
}

function write(project: Project, holder: Y.XmlElement, node: Node) {
  updateYFragment(project.doc, holder, node, { mapping: new Map(), isOMark: new Map() });
}

// ---- finding again what is to be changed ----

interface Found {
  place: Place;
  start: number;
  end: number;
  marked?: Marked;
  all: Gathered;
}

const overlaps = (taken: [number, number][], start: number, end: number) =>
  taken.some(([a, b]) => a < end && start < b);

function find(project: Project, target: Target): Found | Trouble {
  const element = elementOf(target.passage);
  if (!project.yNodes.has(element)) return 'gone';
  const all = gatherElement(project, element);

  if (target.id) {
    // By its id, wherever in the element it stands now; the nearest where there are several.
    const those = all.marked.filter((m) => m.found.id === target.id);
    if (!those.length) return 'gone';
    const near = (m: Marked) =>
      (m.passage === target.passage ? 0 : 1e9) + Math.abs(m.start - target.start);
    const marked = those.reduce((a, b) => (near(b) < near(a) ? b : a));
    const place = all.places.find((p) => p.id === marked.passage);
    return place ? { place, start: marked.start, end: marked.end, marked, all } : 'gone';
  }

  const place = all.places.find((p) => p.id === target.passage);
  if (!place) return 'gone';
  if (!target.text || target.end <= target.start) return 'changed';
  const free = (start: number) => !overlaps(place.taken, start, start + target.text.length);
  if (place.text.slice(target.start, target.end) === target.text) {
    return free(target.start)
      ? { place, start: target.start, end: target.end, all }
      : // It was made a citation, or left as text, by another.
        'gone';
  }
  // Something was written before it: it is the same text still, where it stands alone.
  const first = place.text.indexOf(target.text);
  if (first < 0 || place.text.indexOf(target.text, first + 1) >= 0 || !free(first))
    return 'changed';
  return { place, start: first, end: first + target.text.length, all };
}

// ---- the note that becomes a citation ----

export type IntoCitation =
  { possible: true; before: string; after: string } | { possible: false; why: string };

const KINDS: Record<string, string> = {
  math: 'a formula',
  crossref: 'words that point to something',
  citation: 'a citation',
  hard_break: 'a second line',
};

/**
 * Whether a note can become a citation, with what stands at a place in it
 * as its works: all else the note says must be words, which become the
 * words before and after the works.
 */
export function intoCitation(
  place: Place,
  start: number,
  end: number,
  others: Marked[] = [],
): IntoCitation {
  if (!place.note) return { possible: false, why: 'It does not stand in a note.' };
  for (const child of place.holder.toArray()) {
    if (!(child instanceof Y.XmlElement)) continue;
    const what = KINDS[child.nodeName] ?? 'something that is no text';
    return {
      possible: false,
      why: `The note holds ${what}, which the words before and after a work cannot hold.`,
    };
  }
  if (others.some((m) => m.passage === place.id && (m.end <= start || m.start >= end)))
    return {
      possible: false,
      why: 'The note holds another citation that was found, which would be lost in the words after this one.',
    };
  return {
    possible: true,
    before: place.text.slice(0, start).trim(),
    // The note ends with a full stop, which the style of the references sets itself.
    after: place.text.slice(end).trim().replace(/\.$/, '').trim(),
  };
}

/** The works of a citation, with what the note said beside them as words before and after. */
function withWords(items: CiteItem[], before: string, after: string): CiteItem[] {
  const out = items.map((i) => ({ ...i }));
  const first = out[0];
  const last = out[out.length - 1];
  if (before) first.prefix = [before, first.prefix?.trim()].filter(Boolean).join(' ');
  if (after) {
    const own = last.suffix?.trim() ?? '';
    // What begins with a sign of punctuation joins on without room.
    last.suffix = own ? `${own}${/^[,;:.)]/.test(after) ? '' : ' '}${after}` : after;
  }
  return out;
}

// ---- the changes ----

function clean(items: CiteItem[]): CiteItem[] {
  return items.map((i) => {
    const out: CiteItem = { id: i.id };
    if (i.locator?.trim()) out.locator = i.locator.trim();
    if (i.label && i.label !== 'page' && out.locator) out.label = i.label;
    if (i.prefix?.trim()) out.prefix = i.prefix.trim();
    if (i.suffix?.trim()) out.suffix = i.suffix.trim();
    if (i.suppressAuthor) out.suppressAuthor = true;
    return out;
  });
}

function cite(project: Project, making: Making): Outcome {
  const items = clean(making.items);
  if (!items.length || items.some((i) => !i.id)) return { done: false, why: 'cannot' };
  const at = find(project, making.target);
  if (typeof at === 'string') return { done: false, why: at };
  const mode: CiteMode = making.mode === 'intext' ? 'intext' : 'normal';
  const { citation } = bodySchema.nodes;
  try {
    if (making.how === 'note' && at.place.stands) {
      const can = intoCitation(
        at.place,
        at.start,
        at.end,
        at.all.marked.filter((m) => m !== at.marked),
      );
      const outer = at.place.holder.parent;
      if (!can.possible || !(outer instanceof Y.XmlElement)) return { done: false, why: 'cannot' };
      const node = nodeOf(outer);
      const pos = positionOf(node, at.place.stands.at);
      const note = node.nodeAt(pos);
      if (note?.type.name !== 'footnote') return { done: false, why: 'changed' };
      const made = citation.create({ items: withWords(items, can.before, can.after), mode });
      write(project, outer, new Transform(node).replaceWith(pos, pos + note.nodeSize, made).doc);
      return { done: true };
    }
    const node = nodeOf(at.place.holder);
    const made = citation.create({ items, mode });
    const from = positionOf(node, at.start);
    const to = positionOf(node, at.end);
    write(project, at.place.holder, new Transform(node).replaceWith(from, to, made).doc);
    return { done: true };
  } catch (error) {
    console.error('a citation could not be made of what was found', error);
    return { done: false, why: 'cannot' };
  }
}

function leave(project: Project, target: Target, mode: CiteMode): Outcome {
  const at = find(project, target);
  if (typeof at === 'string') return { done: false, why: at };
  const type = bodySchema.marks.found;
  try {
    const node = nodeOf(at.place.holder);
    const from = positionOf(node, at.start);
    const to = positionOf(node, at.end);
    const tr = new Transform(node);
    if (at.marked) {
      // What is known of it stays with the text: nothing is lost by leaving it.
      tr.removeMark(from, to, type);
      tr.addMark(from, to, type.create({ ...at.marked.found, left: true }));
    } else {
      // Text that was only proposed gets a mark, so that it is not proposed again.
      tr.addMark(from, to, type.create({ id: newId(), by: 'form', items: [], mode, left: true }));
    }
    write(project, at.place.holder, tr.doc);
    return { done: true };
  } catch (error) {
    console.error('what was found could not be left as text', error);
    return { done: false, why: 'cannot' };
  }
}

/** One step of undo, whatever is done in it. */
function step<T>(project: Project, change: () => T): T {
  project.checkpoint();
  try {
    return project.transact(change);
  } finally {
    project.checkpoint();
  }
}

/**
 * Makes a citation of what was found: the citation takes the place of its
 * text; or, with `how: 'note'`, of the note the text stands in, and what
 * the note said beside it is the words before and after its works.
 */
export function makeCitation(
  project: Project,
  target: Target,
  items: CiteItem[],
  mode: CiteMode,
  how: How = 'here',
): Outcome {
  return step(project, () => cite(project, { target, items, mode, how }));
}

/** Makes citations of several, as one step that is undone as one. */
export function makeCitations(project: Project, list: Making[]): Outcome[] {
  if (!list.length) return [];
  return step(project, () => list.map((making) => cite(project, making)));
}

/**
 * Leaves what was found as the text it is: the mark says so, and it is not
 * shown as something found, nor proposed again.
 */
export function leaveAsText(project: Project, target: Target, mode: CiteMode = 'normal'): Outcome {
  return step(project, () => leave(project, target, mode));
}
