/**
 * Where a review finds what it needs of the history of a project (ADR 0021):
 * the engine of the contract (`history/types.ts`), who this is, and the
 * moments that can be reviewed from. This is the one place the review
 * reaches the history.
 */

import { historyOf } from '$lib/history/history.svelte';
import { me } from '$lib/history/me.svelte';
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
  readonly history: History | null;
  /** The person who reviews: this installation, as the history knows it. */
  readonly me: string | null;
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

/**
 * What the review can have of the history of a project. While the project
 * does not keep its history there is none to ask, only the offer to keep it.
 */
export function sourceFor(project: Project, id: string): Source {
  const history = historyOf(project, id);
  return {
    get history(): History | null {
      return history.on ? history : null;
    },
    get me(): string | null {
      return me()?.id ?? null;
    },
    async choices(): Promise<Choice[]> {
      if (!history.on) return [];
      const [begins, sessions, named] = await Promise.all([
        history.begins(),
        history.sessions(),
        history.named(),
      ]);
      const moments = await Promise.all(sessions.map((s) => history.moment(s.last)));
      const out: Choice[] = [{ moment: begins, kind: 'beginning' }];
      sessions.forEach((s, i) => {
        // The beginning is already there: a session that ends at it is not a choice of its own.
        if (moments[i].time <= begins.time) return;
        out.push({ moment: moments[i], kind: 'session', by: s.person ? [s.person] : [] });
      });
      for (const n of named) out.push({ moment: n.moment, kind: 'named', name: n.name });
      return out.sort((a, b) => a.moment.time - b.moment.time);
    },
    turnOn: async () => {
      await history.turnOn();
      return history.on;
    },
  };
}
