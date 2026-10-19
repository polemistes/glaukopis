/**
 * The order of the parts the core makes itself, apart from the words for
 * them, so that what is pure can know it: a part a document turns on is put
 * among its template's parts in this order (`composition.ts`).
 */

import type { GeneratedPart } from '$lib/api/templates';

/** The parts the core makes itself, in the order a document usually has them. */
export const GENERATED_PARTS: readonly GeneratedPart[] = [
  'half-title',
  'title-page',
  'keywords',
  'contents',
  'list-of-figures',
  'list-of-tables',
  'body',
  'notes',
  'bibliography',
];
