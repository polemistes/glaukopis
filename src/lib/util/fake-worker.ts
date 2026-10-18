/**
 * For the tests: a worker in the same thread, answering through `serve` as
 * a real one does. What is posted reaches it a moment later, copied, and
 * its answers come back so. It can be made to die, as a worker that throws
 * outside any answer or runs out of memory, and to stall, by an answerer
 * that never answers.
 */

import { serve, type Answerer } from './worker-client';

export class FakeWorker<A extends Answerer<never, never> = Answerer<never, never>> {
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  onmessageerror: ((event: MessageEvent) => void) | null = null;
  terminated = false;
  /** What was posted to it, as it was posted. */
  readonly posted: unknown[] = [];
  /** What was posted while it was held, not yet taken. */
  readonly held: (() => void)[] = [];
  #holding = false;
  readonly answerer: A;
  /** The worker's own console: what is said on it as a warning or an error goes to the window. */
  readonly console = { warn: (..._args: unknown[]) => {}, error: (..._args: unknown[]) => {} };
  readonly #scope = {
    onmessage: null as unknown,
    postMessage: (m: unknown) =>
      queueMicrotask(() => {
        if (!this.terminated) this.onmessage?.({ data: structuredClone(m) } as MessageEvent);
      }),
  };

  constructor(answerer: A) {
    this.answerer = answerer;
    serve(this.#scope, answerer as Answerer<unknown, unknown>, this.console);
  }

  postMessage(m: unknown) {
    if (this.terminated) return;
    const copy = structuredClone(m);
    this.posted.push(m);
    const take = () => {
      if (!this.terminated)
        (this.#scope.onmessage as (e: MessageEvent) => void)({ data: copy } as MessageEvent);
    };
    if (this.#holding) this.held.push(take);
    else queueMicrotask(take);
  }

  /** Holds what is posted from now on, as a worker busy with something long. */
  hold() {
    this.#holding = true;
  }

  /** Takes what was held, and what is posted after. */
  release() {
    this.#holding = false;
    for (const take of this.held.splice(0)) queueMicrotask(take);
  }

  terminate() {
    this.terminated = true;
  }

  /** As a worker whose thread throws outside any answer, or runs out of memory. */
  die(message: string) {
    this.onerror?.({
      message,
      filename: 'worker.ts',
      lineno: 7,
      preventDefault() {},
    } as unknown as ErrorEvent);
  }
}
