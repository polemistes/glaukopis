/**
 * What the text shows of the changes while they are reviewed (ADR 0022): what
 * was added, marked in the colour of who added it; what was deleted, struck
 * through, where it was; formatting changed, underlined; the number of a note
 * whose text changed; a figure, an equation or a table changed as a whole.
 * The change that is looked at is marked more strongly.
 *
 * Marks are said by element, in the terms of the history: a block by its path,
 * and a place in its text by the signs before it, a thing that is no text
 * counting as one. The editors (`editor.ts`) and the text drawn without one
 * (`drawn.ts`) find them where they show the text.
 */

import type { Place } from '$lib/history/types';
import { changed, type Change } from './grouping';

export type MarkKind = 'added' | 'removed' | 'formatted' | 'gone' | 'note' | 'object';

export interface Mark {
  /** The change it is of. */
  change: string;
  current: boolean;
  kind: MarkKind;
  element: string;
  part: Place['part'];
  /** The block: of a note, the paragraph it stands in. */
  path: (number | 'note')[];
  /** Where it is in the text of the block; of a note, which note of the paragraph it is. */
  from: number;
  to: number;
  /** What was deleted, as it read. */
  text?: string;
  colour: string;
}

/** What is shown of an element changed as an element: added, moved, set out of the document. */
export interface ElementMark {
  change: string;
  current: boolean;
  kind: string;
  colour: string;
}

/** The colour of someone nobody knows. */
export const NOBODY = '#6b7280';

/** The text a piece stood for: a thing that is no text, by what it was shown as. */
function readAs(text: string, label: string | undefined): string {
  return label && text === '￼' ? label : text;
}

function marksOfChange(c: Change, current: boolean, colour: (by: string | null) => string): Mark[] {
  const out: Mark[] = [];
  const base = { change: c.key, current };
  if (c.object && c.object.status !== 'removed' && c.object.place.path.every((s) => s !== 'note'))
    out.push({
      ...base,
      kind: 'object',
      element: c.object.place.element,
      part: c.object.place.part,
      path: c.object.place.path,
      from: 0,
      to: 0,
      colour: colour(c.object.by),
    });
  // An element added or deleted is marked as an element; its text is shown by it.
  if (c.change) return out;
  for (const s of c.stretches) {
    const { place } = s.passage;
    const element = place.element;
    const note = place.path.indexOf('note');
    if (note >= 0) {
      // The text of a note is not shown where it stands: its number is marked.
      const who = s.pieces.find(changed)?.by ?? null;
      out.push({
        ...base,
        kind: 'note',
        element,
        part: place.part,
        path: place.path.slice(0, note),
        from: Number(place.path[note + 1]) || 0,
        to: 0,
        colour: colour(who),
      });
      continue;
    }
    if (!s.passage.after) {
      out.push({
        ...base,
        kind: 'gone',
        element,
        part: place.part,
        path: place.path,
        from: 0,
        to: 0,
        text: s.pieces.map((p) => readAs(p.text, p.object?.label)).join(''),
        colour: colour(s.pieces.find(changed)?.by ?? null),
      });
      continue;
    }
    let at = s.now.from;
    for (const p of s.pieces) {
      const length = p.text.length;
      if (p.status === 'removed') {
        const last = out[out.length - 1];
        const text = readAs(p.text, p.object?.label);
        // Deleted pieces side by side, by the same person, are one.
        if (last?.kind === 'removed' && last.from === at && last.colour === colour(p.by))
          last.text += text;
        else
          out.push({
            ...base,
            kind: 'removed',
            element,
            part: place.part,
            path: place.path,
            from: at,
            to: at,
            text,
            colour: colour(p.by),
          });
        continue;
      }
      if (p.status === 'added')
        out.push({
          ...base,
          kind: 'added',
          element,
          part: place.part,
          path: place.path,
          from: at,
          to: at + length,
          colour: colour(p.by),
        });
      else if (changed(p))
        out.push({
          ...base,
          kind: 'formatted',
          element,
          part: place.part,
          path: place.path,
          from: at,
          to: at + length,
          colour: colour(p.by),
        });
      at += length;
    }
  }
  return out;
}

export interface Marked {
  /** The marks of the text of each element. */
  text: Map<string, Mark[]>;
  /** The marks of each element as an element. */
  elements: Map<string, ElementMark[]>;
}

const NONE: Mark[] = [];

/**
 * The marks of the changes, by element. Where an element's marks are what
 * they were, the same list is given again, so that what shows them need not
 * mark it anew.
 */
export function markChanges(
  changes: Change[],
  looked: string | null,
  colour: (by: string | null) => string,
  before: Marked | null = null,
): Marked {
  const text = new Map<string, Mark[]>();
  const elements = new Map<string, ElementMark[]>();
  for (const c of changes) {
    const current = c.key === looked;
    if (c.change) {
      const list = elements.get(c.element) ?? [];
      list.push({ change: c.key, current, kind: c.change.kind, colour: colour(c.change.by) });
      elements.set(c.element, list);
    }
    for (const m of marksOfChange(c, current, colour)) {
      const list = text.get(m.element);
      if (list) list.push(m);
      else text.set(m.element, [m]);
    }
  }
  if (before) {
    for (const [element, list] of text) {
      const had = before.text.get(element);
      if (had && JSON.stringify(had) === JSON.stringify(list)) text.set(element, had);
    }
  }
  return { text, elements };
}

/** The marks of an element's text. */
export function marksIn(marked: Marked | null, element: string): Mark[] {
  return marked?.text.get(element) ?? NONE;
}
