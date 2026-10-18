/**
 * The one way the window asks a worker (ADR 0052, "a worker answers or
 * fails"): the search through everything, the history and the writer of
 * the readable copy all go through it.
 *
 * Each question is numbered and answered on its own. A worker that throws,
 * whose message cannot be read, or that says it has failed, fails every
 * question waiting on it, and is ended; so does one that does not answer a
 * question in the time given it, for a worker is one thread and what is
 * asked after waits behind the question that stalls. What is asked after a
 * failure goes to a worker begun anew. A worker ended on purpose (`end`)
 * fails the questions asked of it with `ended`, and only those: whoever
 * asked may ask again of the next.
 *
 * Where no worker can be made (the tests), or the worker could not be
 * begun at all, the same answers are made here, in the window, by `here`.
 *
 * The worker's side is `serve`, which answers the same messages.
 */

/** How a question to a worker failed. */
export type WorkerFailure =
  /** The worker answered that it could not: this question failed, the worker goes on. */
  | 'failed'
  /** The worker threw, or said it was broken: every question waiting failed with it. */
  | 'fault'
  /** The worker did not answer in time, and was ended. */
  | 'timeout'
  /** The worker was ended on purpose, before it answered: one may ask again. */
  | 'ended'
  /** The question could not be sent to the worker, such as a value that cannot be copied. */
  | 'unsent'
  /** The client is closed for good. */
  | 'closed';

export class WorkerError extends Error {
  readonly failure: WorkerFailure;
  constructor(failure: WorkerFailure, message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'WorkerError';
    this.failure = failure;
  }
}

/** Whether an error is that of a question whose worker was ended on purpose. */
export function wasEnded(error: unknown): boolean {
  return error instanceof WorkerError && error.failure === 'ended';
}

/**
 * What answers in the worker, or here: `answer` gives what a question is
 * answered with (or a promise of it), and throws where it cannot, which
 * fails that question only; `tell` takes what is told and wants no answer,
 * and a throw there is a fault of the whole worker, since what it holds is
 * no longer what it was told.
 */
export interface Answerer<Q, T = never> {
  answer(question: Q): unknown;
  tell?(message: T): void;
}

/** What the window sends the worker. */
export type ToWorker<Q, T> = { ask: number; question: Q } | { tell: T };

/** What the worker sends back. */
export type FromWorker =
  | { ask: number; value: unknown }
  | { ask: number; error: string }
  | { fault: string }
  /** Said once, when the worker's code has run: a worker that fails before could not be begun. */
  | { ready: true };

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Answers the messages of a client, in the worker: `serve(self, answerer)`.
 * Returns the function that takes one message, for a test to call.
 */
export function serve<Q, T>(
  scope: { onmessage: unknown; postMessage(message: FromWorker): void },
  answerer: Answerer<Q, T>,
): (message: ToWorker<Q, T>) => void {
  const post = (m: FromWorker) => scope.postMessage(m);
  const take = (m: ToWorker<Q, T>) => {
    if ('tell' in m) {
      try {
        answerer.tell?.(m.tell);
      } catch (error) {
        console.error('a worker could not take what it was told', error);
        post({ fault: message(error) });
      }
      return;
    }
    const failed = (error: unknown) => post({ ask: m.ask, error: message(error) });
    // An answer that cannot be copied to the window fails its question.
    const answered = (value: unknown) => {
      try {
        post({ ask: m.ask, value });
      } catch (error) {
        failed(error);
      }
    };
    try {
      const value = answerer.answer(m.question);
      if (value instanceof Promise) value.then(answered, failed);
      else answered(value);
    } catch (error) {
      failed(error);
    }
  };
  scope.onmessage = (event: MessageEvent<ToWorker<Q, T>>) => take(event.data);
  post({ ready: true });
  return take;
}

export interface WorkerClientOptions<Q, T> {
  /** What the worker is, as the log names it: "the history". */
  name: string;
  /** Makes the worker; where it gives nothing or throws, `here` answers. */
  make: () => Worker | null;
  /** What answers in the window, made anew for each beginning; with none, there must be a worker. */
  here?: () => Answerer<Q, T>;
  /** How long, in milliseconds, a question may wait for its answer. */
  timeout: number;
  /** Told when the worker failed, after every question waiting on it has failed. */
  onFault?: (error: WorkerError) => void;
}

interface Waiting {
  resolve: (value: unknown) => void;
  reject: (error: unknown) => void;
  timer: ReturnType<typeof setTimeout> | undefined;
}

export class WorkerClient<Q, T = never> {
  readonly #options: WorkerClientOptions<Q, T>;
  #worker: Worker | null = null;
  #here: Answerer<Q, T> | null = null;
  /** Whether workers are given up for good, since one could not be begun: `here` answers. */
  #inWindow = false;
  /** Whether the worker of now has said it is ready: one that fails before could not be begun. */
  #begun = false;
  #generation = 0;
  #asked = 0;
  #waiting = new Map<number, Waiting>();
  #closed = false;

  constructor(options: WorkerClientOptions<Q, T>) {
    this.#options = options;
  }

  /**
   * Which beginning of the worker this is: it changes whenever the worker is
   * ended, so that what was told the one before is known to be lost.
   */
  get generation(): number {
    return this.#generation;
  }

  /** How many questions wait for an answer. */
  get waiting(): number {
    return this.#waiting.size;
  }

  /** The worker, made when it is first needed; nothing where `here` answers. */
  #connect(): Worker | null {
    if (this.#worker) return this.#worker;
    if (this.#here) return null;
    if (!this.#inWindow) {
      try {
        this.#worker = this.#options.make();
      } catch (error) {
        console.warn(`${this.#options.name}: no worker could be made`, error);
        this.#worker = null;
      }
    }
    if (this.#worker) {
      const worker = this.#worker;
      this.#begun = false;
      worker.onmessage = (event: MessageEvent<FromWorker>) => {
        if (worker === this.#worker) this.#take(event.data);
      };
      worker.onerror = (event: ErrorEvent) => {
        // Said here, in the log, with the worker's name; not again as the window's own.
        event.preventDefault?.();
        if (worker !== this.#worker) return;
        const where = event.filename ? ` (${event.filename}:${event.lineno})` : '';
        const reason = event.message || 'the worker stopped';
        this.#fault(
          new WorkerError('fault', `${this.#options.name} failed: ${reason}${where}`),
          !this.#begun,
        );
      };
      worker.onmessageerror = () => {
        if (worker !== this.#worker) return;
        this.#fault(
          new WorkerError('fault', `${this.#options.name} sent what could not be read`),
          false,
        );
      };
      return worker;
    }
    if (!this.#options.here)
      throw new WorkerError('fault', `${this.#options.name}: no worker could be made`);
    this.#here = this.#options.here();
    return null;
  }

  #take(reply: FromWorker) {
    if ('ready' in reply) {
      this.#begun = true;
      return;
    }
    if ('fault' in reply) {
      this.#fault(new WorkerError('fault', `${this.#options.name} failed: ${reply.fault}`), false);
      return;
    }
    const waiting = this.#waiting.get(reply.ask);
    if (!waiting) return;
    this.#settle(reply.ask);
    if ('error' in reply) waiting.reject(new WorkerError('failed', reply.error));
    else waiting.resolve(reply.value);
  }

  #settle(ask: number) {
    const waiting = this.#waiting.get(ask);
    if (waiting) clearTimeout(waiting.timer);
    this.#waiting.delete(ask);
  }

  /** Fails every question waiting, and ends the worker; the next question begins another. */
  #fault(error: WorkerError, unbegun: boolean) {
    console.error(error.message, error.cause ?? '');
    // A worker that fails before its code has run could not be begun, and
    // the next would fare no better: the window answers from now on. One
    // that fails later, as of a project too large for it, is begun anew.
    if (unbegun && this.#options.here) {
      console.warn(`${this.#options.name}: the work is done in the window from now on`);
      this.#inWindow = true;
    }
    this.#stop(error);
    this.#options.onFault?.(error);
  }

  #stop(error: WorkerError) {
    this.#worker?.terminate();
    this.#worker = null;
    this.#here = null;
    this.#generation++;
    const waiting = [...this.#waiting.values()];
    this.#waiting.clear();
    for (const w of waiting) {
      clearTimeout(w.timer);
      w.reject(error);
    }
  }

  /** Asks the worker a question, and waits at most `timeout` milliseconds for its answer. */
  ask<R>(question: Q, options: { timeout?: number } = {}): Promise<R> {
    if (this.#closed)
      return Promise.reject(new WorkerError('closed', `${this.#options.name} is closed`));
    let worker: Worker | null;
    try {
      worker = this.#connect();
    } catch (error) {
      return Promise.reject(error);
    }
    const ask = ++this.#asked;
    const timeout = options.timeout ?? this.#options.timeout;
    return new Promise<R>((resolve, reject) => {
      const timer = setTimeout(() => {
        if (!this.#waiting.has(ask)) return;
        this.#fault(
          new WorkerError(
            'timeout',
            `${this.#options.name} did not answer in ${Math.round(timeout / 1000)} s`,
          ),
          false,
        );
      }, timeout);
      this.#waiting.set(ask, { resolve: resolve as (v: unknown) => void, reject, timer });
      if (worker) {
        try {
          worker.postMessage({ ask, question } satisfies ToWorker<Q, T>);
        } catch (error) {
          this.#settle(ask);
          reject(
            new WorkerError('unsent', `${this.#options.name} could not be asked: ${message(error)}`, {
              cause: error,
            }),
          );
        }
        return;
      }
      // Here, in the window: answered as the worker would answer.
      const here = this.#here!;
      const answered = (value: unknown) => {
        if (!this.#waiting.has(ask)) return;
        this.#settle(ask);
        resolve(value as R);
      };
      const failed = (error: unknown) => {
        if (!this.#waiting.has(ask)) return;
        this.#settle(ask);
        reject(new WorkerError('failed', message(error), { cause: error }));
      };
      try {
        const value = here.answer(question);
        if (value instanceof Promise) value.then(answered, failed);
        else answered(value);
      } catch (error) {
        failed(error);
      }
    });
  }

  /** Tells the worker something that wants no answer; what cannot be told is a fault. */
  tell(told: T) {
    if (this.#closed) return;
    let worker: Worker | null;
    try {
      worker = this.#connect();
    } catch (error) {
      console.error(message(error));
      return;
    }
    try {
      if (worker) worker.postMessage({ tell: told } satisfies ToWorker<Q, T>);
      else this.#here!.tell?.(told);
    } catch (error) {
      this.#fault(
        new WorkerError('fault', `${this.#options.name} could not take what it was told: ${message(error)}`, {
          cause: error,
        }),
        false,
      );
    }
  }

  /**
   * Ends the worker on purpose: the questions asked of it fail as `ended`,
   * with `reason`, and what is asked after goes to a worker begun anew.
   */
  end(reason = `${this.#options.name} was ended`) {
    this.#stop(new WorkerError('ended', reason));
  }

  /** Ends the worker for good: what is asked after fails. */
  close() {
    this.end(`${this.#options.name} is closed`);
    this.#closed = true;
  }
}
