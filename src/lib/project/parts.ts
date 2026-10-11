/**
 * The kinds of elements that make a document, which come with the
 * application (ADR 0038): the abstract, a dedication, an appendix, the
 * cover. Each has a base, a place in the document, and whether a document
 * has one of it or many; the core has the same catalogue with the look of
 * each (`templates/kinds.rs`), and a test holds the ids alike. A kind of
 * the writer's own may be based on one of these (`KindRecord.basedOn`),
 * and is then that in the document.
 */

import type { PartGroup, PartPlace } from '$lib/api/templates';
import { t } from '$lib/i18n';
import type { Project } from './model/project.svelte';
import type { KindRecord } from './model/types';

export interface PartSpec {
  id: string;
  /** The group the menu shows it in. */
  group: PartGroup;
  /** The id of the kind it is based on; nothing for a base. */
  basedOn: string | null;
  place: PartPlace;
  /** Whether a document has one of it, or many. */
  one: boolean;
  label(): string;
}

function spec(
  id: string,
  group: PartGroup,
  place: PartPlace,
  more: { basedOn?: string; one?: boolean } = {},
): PartSpec {
  return {
    id,
    group,
    basedOn: more.basedOn ?? null,
    place,
    one: more.one ?? false,
    label: () => t(`parts-${id}`),
  };
}

/** The kinds that come with the application: the bases first, then those based on them. */
export const PARTS: readonly PartSpec[] = [
  // The bases.
  spec('front-section', 'front', 'front'),
  spec('back-section', 'back', 'back'),
  spec('own-page', 'front', 'front'),
  spec('cover', 'cover', 'cover', { one: true }),
  // Front matter.
  spec('abstract', 'front', 'front', { basedOn: 'front-section', one: true }),
  spec('dedication', 'front', 'front', { basedOn: 'own-page' }),
  spec('epigraph', 'front', 'front', { basedOn: 'own-page' }),
  spec('copyright', 'front', 'front', { basedOn: 'own-page', one: true }),
  spec('foreword', 'front', 'front', { basedOn: 'front-section' }),
  spec('preface', 'front', 'front', { basedOn: 'front-section' }),
  spec('cast', 'front', 'front', { basedOn: 'front-section' }),
  spec('setting', 'front', 'front', { basedOn: 'front-section' }),
  spec('standfirst', 'front', 'front', { basedOn: 'front-section', one: true }),
  // Back matter.
  spec('acknowledgements', 'back', 'back', { basedOn: 'back-section' }),
  spec('appendix', 'back', 'back', { basedOn: 'back-section' }),
  spec('afterword', 'back', 'back', { basedOn: 'back-section' }),
  spec('glossary', 'back', 'back', { basedOn: 'back-section' }),
  spec('about-the-author', 'back', 'back', { basedOn: 'back-section', one: true }),
  spec('signature', 'back', 'back', { basedOn: 'back-section', one: true }),
  // The cover.
  spec('blurb', 'cover', 'cover', { basedOn: 'cover', one: true }),
];

/** The groups of the menu, in order. */
export const PART_GROUPS: readonly { id: PartGroup; label(): string }[] = [
  { id: 'front', label: () => t('parts-group-front') },
  { id: 'back', label: () => t('parts-group-back') },
  { id: 'cover', label: () => t('parts-group-cover') },
];

const byId = new Map(PARTS.map((p) => [p.id, p]));

/** Whether an id names a kind of the catalogue, and not a kind of a project. */
export function isCatalogueKind(id: string | null | undefined): boolean {
  return !!id && byId.has(id);
}

/** A kind of the catalogue by its id. */
export function partSpec(id: string | null | undefined): PartSpec | undefined {
  return id ? byId.get(id) : undefined;
}

/**
 * What a kind is in the document: a kind of the catalogue is itself; a
 * kind of the project based on one is that; a kind based on nothing, or
 * none, is nothing there. `kinds` can be given in place of the project.
 */
export function partOf(
  project: Project | { kind(id: string): KindRecord | undefined },
  kindId: string | null | undefined,
): PartSpec | null {
  if (!kindId) return null;
  const own = byId.get(kindId);
  if (own) return own;
  const base = project.kind(kindId)?.basedOn;
  return base ? (byId.get(base) ?? null) : null;
}

/** Where an element of a kind is printed; nothing where the kind says nothing of the document. */
export function placeOf(project: Project, kindId: string | null | undefined): PartPlace | null {
  return partOf(project, kindId)?.place ?? null;
}

/** The kinds of the catalogue, in the catalogue's order, that are among the given ids. */
export function partsAmong(ids: Iterable<string>): PartSpec[] {
  const wanted = new Set(ids);
  return PARTS.filter((p) => wanted.has(p.id));
}

/**
 * Whether an element is a later one of a kind the document has one of,
 * among its siblings: the first in order is printed, and this one is not.
 */
export function isDoubled(project: Project, id: string): boolean {
  const node = project.node(id);
  const part = partOf(project, node?.kind);
  if (!node || !part?.one) return false;
  const parent = project.tree().parent.get(id);
  if (!parent) return false;
  for (const sibling of project.tree().children.get(parent) ?? []) {
    if (sibling === id) return false;
    const other = project.node(sibling);
    // One that is left out of the document does not come first in it.
    if (other && !other.excluded && partOf(project, other.kind)?.id === part.id) return true;
  }
  return false;
}

/**
 * The label an element's kind is shown with: the name and colour of a kind
 * of the project, or the name of a kind of the catalogue in the plain
 * colour of the parts of a document. Nothing where the element has no
 * kind that is known.
 */
export function kindLabel(
  project: Project,
  kindId: string | null | undefined,
): { name: string; colour: string; part: boolean } | null {
  if (!kindId) return null;
  const own = project.kind(kindId);
  if (own) return { name: own.name, colour: own.colour, part: false };
  const part = byId.get(kindId);
  return part ? { name: part.label(), colour: 'part', part: true } : null;
}
