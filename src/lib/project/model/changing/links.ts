/**
 * Associations between elements, with the words that name them, an arrow
 * and a colour. These are methods of `Project`, which takes them in (see
 * there).
 *
 * In the document a link is a map of `from`, `to`, and where they are given
 * `label` (its words, in lines), `arrow` (`to`, `from` or `both`; absent for
 * none) and `colour` (the name of one of the colours of kinds; absent for
 * the gold of an association). A link written before arrows and colours has
 * neither, and reads as none and gold.
 */

import * as Y from 'yjs';
import { newId } from '$lib/util/id';
import { KIND_COLOURS } from '../../kinds';
import { str } from '../origins';
import type { Project } from '../project.svelte';
import { LINK_ARROWS, type LinkArrow, type LinkLook, type LinkRecord } from '../types';

/**
 * The words of an association as they are kept: spaces and tabs within a
 * line made one space, each line trimmed, the empty lines at the beginning
 * and the end gone, and no more than one empty line in a row.
 */
export function cleanLinkLabel(label: string): string {
  return label
    .split(/\r\n|\r|\n/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .join('\n')
    .replace(/^\n+|\n+$/g, '')
    .replace(/\n{3,}/g, '\n\n');
}

/** An arrow as the document keeps it, or none where it is not one the program knows. */
export function linkArrow(value: unknown): LinkArrow | undefined {
  return LINK_ARROWS.includes(value as LinkArrow) ? (value as LinkArrow) : undefined;
}

/** The name of a colour of kinds, or none where it is not one. */
export function linkColour(value: unknown): string | undefined {
  return KIND_COLOURS.some((c) => c.name === value) ? (value as string) : undefined;
}

/** A link of the document read, or null where it lacks an end or ends where it begins. */
export function readLink(id: string, l: Y.Map<unknown>): LinkRecord | null {
  const from = str(l.get('from'));
  const to = str(l.get('to'));
  if (!from || !to || from === to) return null;
  const link: LinkRecord = { id, from, to, label: str(l.get('label')) };
  const arrow = linkArrow(l.get('arrow'));
  if (arrow) link.arrow = arrow;
  const colour = linkColour(l.get('colour'));
  if (colour) link.colour = colour;
  return link;
}

/** What of a link is carried to a copy of it, with nothing that is absent. */
export function lookOf(l: LinkLook): LinkLook {
  const look: LinkLook = { label: l.label };
  if (l.arrow) look.arrow = l.arrow;
  if (l.colour) look.colour = l.colour;
  return look;
}

/** Makes a link, with its words, arrow and colour where they are given. */
export function makeLink(
  p: Project,
  from: string,
  to: string,
  look: Partial<LinkLook> = {},
): string {
  const id = newId();
  const l = new Y.Map<unknown>();
  l.set('from', from);
  l.set('to', to);
  const label = cleanLinkLabel(look.label ?? '');
  if (label) l.set('label', label);
  const arrow = linkArrow(look.arrow);
  if (arrow) l.set('arrow', arrow);
  const colour = linkColour(look.colour);
  if (colour) l.set('colour', colour);
  p.yLinks.set(id, l);
  return id;
}

export const linkChanges = {
  /** Associates two elements. Returns the id of the link, or of the one that was there, whichever way it was drawn. */
  addLink(this: Project, from: string, to: string): string | null {
    if (from === to || !this.yNodes.has(from) || !this.yNodes.has(to)) return null;
    const existing = this.links.find(
      (l) => (l.from === from && l.to === to) || (l.from === to && l.to === from),
    );
    if (existing) return existing.id;
    return this.transact(() => makeLink(this, from, to));
  },

  removeLink(this: Project, id: string) {
    if (!this.yLinks.has(id)) return;
    this.transact(() => this.yLinks.delete(id));
  },

  /** Gives an association its words, cleaned as `cleanLinkLabel` says; none where nothing is left. */
  setLinkLabel(this: Project, id: string, label: string) {
    const l = this.yLinks.get(id);
    if (!l) return;
    const clean = cleanLinkLabel(label);
    if (clean === str(l.get('label'))) return;
    this.transact(() => {
      if (clean) l.set('label', clean);
      else l.delete('label');
    });
  },

  /** Gives an association an arrow, or none. */
  setLinkArrow(this: Project, id: string, arrow: LinkArrow | null) {
    const l = this.yLinks.get(id);
    if (!l) return;
    const value = linkArrow(arrow);
    if (value === linkArrow(l.get('arrow'))) return;
    this.transact(() => {
      if (value) l.set('arrow', value);
      else l.delete('arrow');
    });
  },

  /** Gives an association one of the colours of kinds, by its name, or none for its gold. */
  setLinkColour(this: Project, id: string, colour: string | null) {
    const l = this.yLinks.get(id);
    if (!l) return;
    const value = linkColour(colour);
    if (value === linkColour(l.get('colour'))) return;
    this.transact(() => {
      if (value) l.set('colour', value);
      else l.delete('colour');
    });
  },
};
