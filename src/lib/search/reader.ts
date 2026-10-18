/**
 * What answers the questions of the search through everything, in its
 * worker or, where there is none, in the window: the projects read, by
 * id, and searched. Apart from `engine.ts`, so that the worker does not
 * take in the code that makes it.
 */

import type { Answerer } from '$lib/util/worker-client';
import { citedIn, readProject, searchProject, type ProjectRead } from './everything';
import type { SearchOptions } from './matching';

export type Asked =
  | {
      kind: 'read';
      id: string;
      name: string;
      state: Uint8Array | null;
      updates: Uint8Array[];
    }
  | { kind: 'search'; id: string; words: string; options: SearchOptions }
  | { kind: 'cited'; id: string }
  | { kind: 'forget'; id: string };

/** A reader of its own, holding what it was given to read until it is forgotten. */
export function reader(): Answerer<Asked> {
  const read = new Map<string, ProjectRead>();
  return {
    answer(asked) {
      if (asked.kind === 'read') {
        read.set(asked.id, readProject(asked.id, asked.name, asked.state, asked.updates));
        return null;
      }
      if (asked.kind === 'forget') {
        read.delete(asked.id);
        return null;
      }
      const project = read.get(asked.id);
      if (asked.kind === 'cited') return project ? citedIn(project) : [];
      return project ? searchProject(project, asked.words, asked.options) : null;
    },
  };
}
