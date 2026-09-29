/**
 * Where a review finds what it needs of the history of a project (ADR 0021):
 * the engine of the contract (`history/types.ts`), who this is, and the
 * moments that can be reviewed from. This is the one place the review
 * reaches the history.
 */

import type { History, Moment } from '$lib/history/types';
import type { Project } from '$lib/project/model/project.svelte';

/** A moment that can be reviewed from. */
export interface Choice {
  moment: Moment;
  kind: 'beginning' | 'session' | 'named';
  /** The name given to the moment, where it has one. */
  name?: string;
  /** Who worked in the session that begins there. */
  by?: string[];
}

export interface Source {
  /** The history of the project, or nothing where it is not kept. */
  history: History | null;
  /** The person who reviews: this installation, as the history knows it. */
  me: string | null;
  /** The moments that can be reviewed from, the oldest first: the beginning, the sessions, the named moments. */
  choices(): Promise<Choice[]>;
  /** Turns the history of the project on, where that can be done from here; whether it was. */
  turnOn: (() => Promise<boolean>) | null;
}

/** What a project without a history offers. */
export const NO_HISTORY: Source = {
  history: null,
  me: null,
  choices: async () => [],
  turnOn: null,
};

/** How the history of a project is reached: set by the history when it is there. */
let making: ((project: Project) => Source) | null = null;

/** Tells the review how to reach the history of a project. */
export function provideHistory(make: (project: Project) => Source) {
  making = make;
}

/** What the review can have of the history of a project. */
export function sourceFor(project: Project): Source {
  return making?.(project) ?? NO_HISTORY;
}
