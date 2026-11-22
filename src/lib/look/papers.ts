/**
 * The papers a layout may be of, by what each is called everywhere, in the
 * order they are offered; a size of the writer's own is named in the words
 * of the interface, where it is offered.
 */
export const PAPERS: readonly (readonly [string, string])[] = [
  ['a4', 'A4'],
  ['letter', 'US Letter'],
  ['a5', 'A5'],
  ['b5', 'B5'],
  ['legal', 'US Legal'],
];

/** What a paper is called; nothing for a size of the writer's own, or one not known. */
export const paperName = (size: string): string | undefined =>
  PAPERS.find(([id]) => id === size)?.[1];
