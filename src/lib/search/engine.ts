/**
 * What reads and searches the projects for the search through everything:
 * a Web Worker where there is one, and the window itself where there is
 * not, as in the tests. Each question is answered on its own.
 */

import { fromBase64 } from '$lib/util/base64';
import { readProject, searchProject, type ProjectFound, type ProjectRead } from './everything';
import type { SearchOptions } from './matching';

export type Asked =
  | { kind: 'read'; ask: number; id: string; name: string; state: string | null; updates: string[] }
  | { kind: 'search'; ask: number; id: string; words: string; options: SearchOptions }
  | { kind: 'forget'; ask: number; id: string };

/** A question before it is numbered. */
type Question = Asked extends infer A ? (A extends Asked ? Omit<A, 'ask'> : never) : never;

export type Answer =
  | { kind: 'read'; ask: number }
  | { kind: 'found'; ask: number; result: ProjectFound | { error: string } | null }
  | { kind: 'failed'; ask: number; error: string };

export class Engine {
  #worker: Worker | null = null;
  #waiting = new Map<number, (answer: Answer) => void>();
  #asked = 0;
  /** Where there is no worker: what was read, here. */
  #read = new Map<string, ProjectRead>();

  constructor() {
    if (typeof Worker === 'undefined') return;
    try {
      this.#worker = new Worker(new URL('./everything.worker.ts', import.meta.url), {
        type: 'module',
      });
      this.#worker.onmessage = (event: MessageEvent<Answer>) => {
        const done = this.#waiting.get(event.data.ask);
        this.#waiting.delete(event.data.ask);
        done?.(event.data);
      };
    } catch {
      this.#worker = null;
    }
  }

  #ask(question: Question): Promise<Answer> {
    const ask = ++this.#asked;
    const asked = { ...question, ask } as Asked;
    if (!this.#worker) return Promise.resolve(this.#here(asked));
    return new Promise((resolve) => {
      this.#waiting.set(ask, resolve);
      this.#worker!.postMessage(asked);
    });
  }

  /** As the worker answers, where there is none. */
  #here(asked: Asked): Answer {
    try {
      if (asked.kind === 'read') {
        this.#read.set(
          asked.id,
          readProject(
            asked.id,
            asked.name,
            asked.state ? fromBase64(asked.state) : null,
            asked.updates.map(fromBase64),
          ),
        );
        return { kind: 'read', ask: asked.ask };
      }
      if (asked.kind === 'forget') {
        this.#read.delete(asked.id);
        return { kind: 'read', ask: asked.ask };
      }
      const project = this.#read.get(asked.id);
      return {
        kind: 'found',
        ask: asked.ask,
        result: project ? searchProject(project, asked.words, asked.options) : null,
      };
    } catch (error) {
      return { kind: 'failed', ask: asked.ask, error: String(error) };
    }
  }

  /** Reads a project from what is kept of it on disk. */
  async read(id: string, name: string, state: string | null, updates: string[]): Promise<void> {
    const answer = await this.#ask({ kind: 'read', id, name, state, updates });
    if (answer.kind === 'failed') throw new Error(answer.error);
  }

  /** Searches a project that was read. */
  async search(
    id: string,
    words: string,
    options: SearchOptions,
  ): Promise<ProjectFound | { error: string } | null> {
    const answer = await this.#ask({ kind: 'search', id, words, options });
    if (answer.kind === 'failed') throw new Error(answer.error);
    return answer.kind === 'found' ? answer.result : null;
  }

  /** Forgets what was read of a project. */
  async forget(id: string): Promise<void> {
    await this.#ask({ kind: 'forget', id });
  }
}
