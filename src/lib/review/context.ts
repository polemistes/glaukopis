/**
 * The review of a project, where the text finds it: the project's view gives
 * it, and the text of a map and each of its elements read it to show the
 * changes where they are.
 */

import { getContext, setContext } from 'svelte';
import type { Review } from './review.svelte';

const KEY = Symbol('reviewing');

export interface Reviewing {
  /** The review that is open, if one is. */
  readonly review: Review | null;
}

export function provideReviewing(reviewing: Reviewing) {
  setContext(KEY, reviewing);
}

/** The review of the project, where there is a project to review. */
export function reviewing(): Reviewing | undefined {
  return getContext<Reviewing | undefined>(KEY);
}
