/**
 * How a project is written to disk: every change to the log a moment after
 * it is made, in batches, and now and then the whole of it as one state,
 * which empties the log. What follows the changes, the history while it is
 * looked at, is told of each as it is made and of each batch as it is
 * written.
 */

import * as Y from 'yjs';

export interface Persistence {
  /**
   * Writes a batch of changes to the log: whether they were made here or
   * came from another, and when, in milliseconds since 1970.
   */
  append(update: Uint8Array, here: boolean, time: number): Promise<void>;
  /** With `keep`, where the project's full history is on, the log is kept in it. */
  saveState(state: Uint8Array, summary: Summary, keep: boolean): Promise<void>;
}

/**
 * What follows the changes of the project as they are made: the history,
 * while it is looked at. Each change is told as it is made, and each batch
 * as it is written, with the number of changes in it.
 */
export interface Follower {
  change(update: Uint8Array, here: boolean): void;
  written(time: number, here: boolean, changes: number): void;
}

/** What is told of a project where the projects are listed, when it is saved. */
export interface Summary {
  name?: string;
  maps: { id: string; name: string; elements: number }[];
  words: number;
  references: number;
  /** The pictures the project uses, by the names the store keeps them by. */
  pictures: string[];
  /** The references the project cites, by their ids. */
  cited: string[];
}

export type SaveStatus = 'saved' | 'unsaved' | 'saving' | 'error';

/** What the saving asks of the project it saves. */
export interface Saved {
  readonly doc: Y.Doc;
  summary(): Summary;
  /** Whether the full history is kept, and the log with it. */
  keepsHistory(): boolean;
  /** Before a batch is written: what was deleted here is written into the document. */
  beforeBatch(): void;
  /** Before the whole is written: the records of the history are put in order. */
  beforeState(): void;
}

const SNAPSHOT_AFTER_UPDATES = 150;
const SNAPSHOT_AFTER_BYTES = 200_000;
const APPEND_DELAY = 400;
const SNAPSHOT_IDLE = 90_000;

export class Saving {
  status = $state<SaveStatus>('saved');
  saveError = $state<string | null>(null);

  readonly #persistence: Persistence | null;
  readonly #project: Saved;
  /** Changes not yet written, each with whether it was made here. */
  #pending: { update: Uint8Array; here: boolean }[] = [];
  #followers = new Set<Follower>();
  #appendTimer: ReturnType<typeof setTimeout> | undefined;
  #idleTimer: ReturnType<typeof setTimeout> | undefined;
  #sinceSnapshot = { updates: 0, bytes: 0 };
  #writing: Promise<void> = Promise.resolve();

  constructor(persistence: Persistence | null, project: Saved) {
    this.#persistence = persistence;
    this.#project = project;
  }

  /** What was read from disk: the changes after the state count toward the next state. */
  loaded(updates: Uint8Array[]) {
    this.#sinceSnapshot = {
      updates: updates.length,
      bytes: updates.reduce((n, u) => n + u.length, 0),
    };
  }

  /** A change was made, here or by another: it is written a moment later, with those that follow it. */
  change(update: Uint8Array, here: boolean) {
    for (const f of this.#followers) f.change(update, here);
    this.#pending.push({ update, here });
    this.status = 'unsaved';
    clearTimeout(this.#appendTimer);
    this.#appendTimer = setTimeout(() => void this.flush(), APPEND_DELAY);
    clearTimeout(this.#idleTimer);
    this.#idleTimer = setTimeout(() => void this.snapshot(), SNAPSHOT_IDLE);
  }

  /**
   * Writes pending changes to the log: those made here and those that came
   * from others in batches of their own, in the order they came.
   */
  flush(): Promise<void> {
    clearTimeout(this.#appendTimer);
    this.#project.beforeBatch();
    if (!this.#pending.length || !this.#persistence) {
      if (!this.#persistence) this.#pending = [];
      return this.#writing;
    }
    const time = Date.now();
    const batches: { update: Uint8Array; here: boolean; changes: number }[] = [];
    let run: Uint8Array[] = [];
    this.#pending.forEach(({ update, here }, i) => {
      run.push(update);
      const next = this.#pending[i + 1];
      if (next && next.here === here) return;
      batches.push({
        update: run.length === 1 ? run[0] : Y.mergeUpdates(run),
        here,
        changes: run.length,
      });
      run = [];
    });
    this.#pending = [];
    for (const b of batches) for (const f of this.#followers) f.written(time, b.here, b.changes);
    this.status = 'saving';
    for (const batch of batches) {
      this.#writing = this.#writing
        .then(() => this.#persistence!.append(batch.update, batch.here, time))
        .then(() => {
          this.#sinceSnapshot.updates++;
          this.#sinceSnapshot.bytes += batch.update.length;
          this.saveError = null;
          if (!this.#pending.length) this.status = 'saved';
          if (
            this.#sinceSnapshot.updates >= SNAPSHOT_AFTER_UPDATES ||
            this.#sinceSnapshot.bytes >= SNAPSHOT_AFTER_BYTES
          ) {
            void this.snapshot();
          }
        })
        .catch((error) => {
          // Keep what could not be written, to try again with the next change.
          this.#pending.unshift({ update: batch.update, here: batch.here });
          this.status = 'error';
          this.saveError = error?.message ?? String(error);
          console.error('the project could not be saved', error);
        });
    }
    return this.#writing;
  }

  /** Follows the changes as they are made, until the function returned is called. */
  follow(follower: Follower): () => void {
    // What is made and not yet written is told first, so that the follower
    // knows every change that a batch it is told of holds.
    for (const p of this.#pending) follower.change(p.update, p.here);
    this.#followers.add(follower);
    return () => this.#followers.delete(follower);
  }

  /** Writes the whole document as one state, and empties the log; with `always`, even when nothing was written since. */
  async snapshot(always = false): Promise<void> {
    clearTimeout(this.#idleTimer);
    await this.flush();
    if (!this.#persistence || this.status === 'error') return;
    if (this.#sinceSnapshot.updates === 0 && !always) return;
    this.#project.beforeState();
    const state = Y.encodeStateAsUpdate(this.#project.doc);
    const summary = this.#project.summary();
    const keep = this.#project.keepsHistory();
    this.#sinceSnapshot = { updates: 0, bytes: 0 };
    this.#writing = this.#writing
      .then(() => this.#persistence!.saveState(state, summary, keep))
      .catch((error) => {
        this.#sinceSnapshot.updates = 1;
        this.status = 'error';
        this.saveError = error?.message ?? String(error);
        console.error('the project could not be saved', error);
      });
    return this.#writing;
  }

  /** Nothing more is written of itself: the project is closed. */
  stop() {
    clearTimeout(this.#appendTimer);
    clearTimeout(this.#idleTimer);
  }
}
