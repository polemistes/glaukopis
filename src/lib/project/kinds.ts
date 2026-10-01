/**
 * The colours a kind of element can have: a few that are told apart at a
 * glance, in the light and the dark, each with a name the document keeps.
 */

export interface KindColour {
  name: string;
  /** For the mark itself: a band, a dot. */
  ink: string;
  /** For a surface the mark stands on, where one is wanted. */
  soft: string;
}

export const KIND_COLOURS: readonly KindColour[] = [
  { name: 'teal', ink: '#0e7490', soft: 'rgba(14, 116, 144, 0.14)' },
  { name: 'amber', ink: '#b45309', soft: 'rgba(180, 83, 9, 0.14)' },
  { name: 'violet', ink: '#7c3aed', soft: 'rgba(124, 58, 237, 0.14)' },
  { name: 'rose', ink: '#be185d', soft: 'rgba(190, 24, 93, 0.14)' },
  { name: 'green', ink: '#15803d', soft: 'rgba(21, 128, 61, 0.14)' },
  { name: 'blue', ink: '#1d4ed8', soft: 'rgba(29, 78, 216, 0.14)' },
  { name: 'rust', ink: '#c2410c', soft: 'rgba(194, 65, 12, 0.14)' },
  { name: 'olive', ink: '#4d7c0f', soft: 'rgba(77, 124, 15, 0.14)' },
  { name: 'slate', ink: '#475569', soft: 'rgba(71, 85, 105, 0.14)' },
  { name: 'plum', ink: '#86198f', soft: 'rgba(134, 25, 143, 0.14)' },
];

/** The colour by its name; the first where the name is not known. */
export function kindColour(name: string | undefined): KindColour {
  return KIND_COLOURS.find((c) => c.name === name) ?? KIND_COLOURS[0];
}

/** A colour for a new kind: the first that no kind of the project has, or the next in turn. */
export function nextKindColour(taken: string[]): string {
  const free = KIND_COLOURS.find((c) => !taken.includes(c.name));
  return (free ?? KIND_COLOURS[taken.length % KIND_COLOURS.length]).name;
}
