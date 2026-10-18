/**
 * What reads and searches the projects for the search through everything:
 * a Web Worker where there is one, and the window itself where there is
 * not, as in the tests. Each question is answered on its own, through the
 * one client of the workers (`$lib/util/worker-client`): a worker that
 * fails or stalls fails what was asked of it, and the next question goes to
 * one begun anew, which has read nothing; `generation` says when that was.
 */

import { WorkerClient } from '$lib/util/worker-client';
import type { ProjectFound } from './everything';
import type { SearchOptions } from './matching';
import { reader, type Asked } from './reader';

/**
 * How long a question may take: reading a large project with a long log of
 * changes takes seconds, and nothing should take minutes.
 */
const TIMEOUT = 120_000;

export class Engine {
  readonly #client = new WorkerClient<Asked>({
    name: 'the search through everything',
    make: () =>
      typeof Worker === 'undefined'
        ? null
        : new Worker(new URL('./everything.worker.ts', import.meta.url), { type: 'module' }),
    here: reader,
    timeout: TIMEOUT,
  });

  /**
   * Which beginning of the worker this is: when it changes, what was read
   * before is lost, and must be read again.
   */
  get generation(): number {
    return this.#client.generation;
  }

  /** Reads a project from what is kept of it on disk. */
  async read(
    id: string,
    name: string,
    state: Uint8Array | null,
    updates: Uint8Array[],
  ): Promise<void> {
    await this.#client.ask({ kind: 'read', id, name, state, updates });
  }

  /** Searches a project that was read. */
  search(
    id: string,
    words: string,
    options: SearchOptions,
  ): Promise<ProjectFound | { error: string } | null> {
    return this.#client.ask({ kind: 'search', id, words, options });
  }

  /** The references a project that was read cites. */
  cited(id: string): Promise<string[]> {
    return this.#client.ask({ kind: 'cited', id });
  }

  /** Forgets what was read of a project. */
  async forget(id: string): Promise<void> {
    await this.#client.ask({ kind: 'forget', id });
  }

  /** Ends the worker for good. */
  close() {
    this.#client.close();
  }
}
