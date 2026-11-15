/**
 * The links between the cards of a surface, drawn as the associations of a
 * map are (`project/diagram/lines.ts`), and the notebook as what holds them
 * for the menu of an association (`project/associations.ts`).
 */

import type { LinkHolder } from '$lib/project/associations';
import { associationDrawn, type DrawnAssociation } from '$lib/project/diagram/lines';
import { associationCurve, edgePoint } from '$lib/project/diagram/layout';
import type { LinkRecord } from '$lib/project/model/types';
import type { Notebook } from '../model/notebook.svelte';
import type { Point } from '../model/types';
import type { CardBox } from './geometry';

/** The links of which both ends are cards of the surface, drawn between their boxes. */
export function linksDrawn(links: LinkRecord[], boxes: Map<string, CardBox>): DrawnAssociation[] {
  const out: DrawnAssociation[] = [];
  for (const link of links) {
    const a = boxes.get(link.from);
    const b = boxes.get(link.to);
    if (a && b) out.push(associationDrawn(link, a, b));
  }
  return out;
}

/** A link being drawn from a card: to the card the pointer is over, or to the pointer. */
export function linkBeingDrawn(from: CardBox, pointer: Point, over: CardBox | null): string {
  if (over) return associationCurve(from, over).path;
  const start = edgePoint(from, pointer);
  return `M ${start.x} ${start.y} L ${pointer.x} ${pointer.y}`;
}

/** What a note is called where a link names its ends: its name, or how it begins. */
export function noteCalled(notebook: Notebook, id: string): string {
  const note = notebook.notes.get(id);
  return note ? note.name || note.begins : '';
}

const holders = new WeakMap<Notebook, LinkHolder>();

/** The notebook as what holds the links between its notes: one for each notebook. */
export function notebookLinkHolder(notebook: Notebook): LinkHolder {
  let holder = holders.get(notebook);
  if (!holder) {
    holder = {
      nameOf: (id) => noteCalled(notebook, id),
      setArrow: (link, arrow) => notebook.setLinkArrow(link, arrow),
      setColour: (link, colour) => notebook.setLinkColour(link, colour),
      remove: (link) => notebook.removeLink(link),
      change(act) {
        notebook.checkpoint();
        act();
        notebook.checkpoint();
      },
    };
    holders.set(notebook, holder);
  }
  return holder;
}
