/** What the window and the engine of the history tell each other. */

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
  | 'mapAt'
  | 'versions'
  | 'revert'
  | 'restore'
  | 'bringBack'
  | 'stateAt'
  | 'startAt'
  | 'cut'
  | 'thin'
  | 'records';

export type Message =
  | { kind: 'load'; records: HistoryRecord[]; me: string | null }
  /** What follows waits for the next load: the history is read anew. */
  | { kind: 'reset' }
  | { kind: 'change'; update: Uint8Array; here: boolean }
  | { kind: 'written'; time: number; here: boolean; changes: number }
  | { kind: 'ask'; ask: number; method: Method; args: unknown[] };

export type Reply = { ask: number; value: unknown } | { ask: number; error: string };

/**
 * What takes the messages to the engine: in the worker, or here where there
 * is none. What comes before the history is read waits for it.
 */
export class Host {
  engine: Engine | null = null;
  #waiting: Message[] = [];
  readonly #make: () => Engine;
  readonly #reply: (reply: Reply) => void;

  constructor(make: () => Engine, reply: (reply: Reply) => void) {
    this.#make = make;
    this.#reply = reply;
  }

  take(message: Message) {
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
      for (const m of later) this.take(m);
      return;
    }
    const engine = this.engine;
    if (!engine) {
      this.#waiting.push(message);
      return;
    }
    if (message.kind === 'change') engine.change(message.update, message.here);
    else if (message.kind === 'written')
      engine.written(message.time, message.here, message.changes);
    else this.#reply(answer(engine, message));
  }
}

/** Answers a question with the engine. */
export function answer(
  engine: Engine,
  message: { ask: number; method: Method; args: unknown[] },
): Reply {
  try {
    const args = message.args;
    let value: unknown;
    switch (message.method) {
      case 'records':
        // What is known of the records, for keeping older history less finely.
        value = engine.records.map((r) => ({
          kind: r.kind,
          time: r.time,
          until: r.until,
          stored: r.stored,
        }));
        break;
      default: {
        const method = engine[message.method] as (...a: unknown[]) => unknown;
        value = method.apply(engine, args);
      }
    }
    return { ask: message.ask, value };
  } catch (error) {
    console.error('the history could not answer', error);
    return { ask: message.ask, error: (error as Error)?.message ?? String(error) };
  }
}
