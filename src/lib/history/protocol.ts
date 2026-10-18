/** What the window and the engine of the history tell each other. */

import type { Answerer } from '$lib/util/worker-client';
import type { Engine } from './engine';
import type { HistoryRecord } from './records';

/** What the engine can be asked: its methods that answer. */
export type Method =
  | 'people'
  | 'now'
  | 'begins'
  | 'sessions'
  | 'moment'
  | 'named'
  | 'compare'
  | 'branchAt'
  | 'versions'
  | 'revert'
  | 'restore'
  | 'bringBack'
  | 'stateAt'
  | 'startAt'
  | 'cut'
  | 'thin'
  | 'records';

/** What the engine is told, and answers nothing to. */
export type Message =
  | { kind: 'load'; records: HistoryRecord[]; me: string | null }
  /** What follows waits for the next load: the history is read anew. */
  | { kind: 'reset' }
  | { kind: 'change'; update: Uint8Array; here: boolean }
  | { kind: 'written'; time: number; here: boolean; changes: number };

/** What the engine is asked: one of its methods, with what it is given. */
export type Question = { method: Method; args: unknown[] };

/**
 * What takes the messages to the engine: in the worker, or here where there
 * is none, answering through the client of the workers. What comes before
 * the history is read waits for it, in the order it came. A load, a change
 * or a writing that throws is a fault of the whole engine, which the client
 * makes the window hear: what the engine holds is then no longer the
 * history, and it is read anew when next asked.
 */
export class Host implements Answerer<Question, Message> {
  engine: Engine | null = null;
  #waiting: (() => void)[] = [];
  readonly #make: () => Engine;

  constructor(make: () => Engine) {
    this.#make = make;
  }

  tell(message: Message) {
    if (message.kind === 'reset') {
      this.engine = null;
      return;
    }
    if (message.kind === 'load') {
      const engine = this.#make();
      engine.me = message.me;
      engine.load(message.records);
      this.engine = engine;
      const later = this.#waiting;
      this.#waiting = [];
      for (const run of later) run();
      return;
    }
    const run = () => {
      const engine = this.engine!;
      if (message.kind === 'change') engine.change(message.update, message.here);
      else engine.written(message.time, message.here, message.changes);
    };
    if (this.engine) run();
    else this.#waiting.push(run);
  }

  answer(question: Question): unknown {
    if (this.engine) return answer(this.engine, question);
    return new Promise((resolve, reject) =>
      this.#waiting.push(() => {
        try {
          resolve(answer(this.engine!, question));
        } catch (error) {
          reject(error);
        }
      }),
    );
  }
}

/** Answers a question with the engine; what it cannot answer it throws, and says in the log. */
export function answer(engine: Engine, question: Question): unknown {
  try {
    const args = question.args;
    switch (question.method) {
      case 'records':
        // What is known of the records, for keeping older history less finely.
        return engine.records.map((r) => ({
          kind: r.kind,
          time: r.time,
          until: r.until,
          stored: r.stored,
        }));
      default: {
        const method = engine[question.method] as (...a: unknown[]) => unknown;
        return method.apply(engine, args);
      }
    }
  } catch (error) {
    console.error('the history could not answer', error);
    throw error;
  }
}
