/**
 * The readable copy of a project in its folder (ADR 0041, section 7): its
 * Org form, the works it cites and the pictures it shows, written anew
 * after the project is saved as a whole. Never read back, so that it
 * cannot get a project wrong: a copy that fails to be written is said in
 * the log, and nothing else.
 *
 * It is written at most once every few seconds. What is gathered of the
 * project is gathered when the window is idle; the Org form is written
 * in a thread of its own, where there is one, for a large project takes
 * a tenth of a second and more to write.
 */

import type { Project } from '$lib/project/model/project.svelte';
import { citedRecords } from '$lib/project/model/rewrite-refs';
import type { RefRecord } from '$lib/project/model/types';
import { WorkerClient, WorkerError } from '$lib/util/worker-client';
import { orgOf } from './of-project';
import type { OrgProject } from './types';
import { writeProject } from './write';

/** What is written beside the Org form: the pictures by their hash, and the works cited. */
export interface Beside {
  pictures: string[];
  records: RefRecord[];
}

/** Writes the readable copy somewhere: the Org form, and what goes beside it. */
export type Send = (org: string, beside: Beside) => Promise<void>;

/** How long, at least, from one copy to the next. */
export const COPY_EVERY = 5000;

/**
 * How long a project that is closed waits for its copy to be written: the
 * copy is a convenience, never read back, and a close must not hang on it.
 */
export const FINISH_WAIT = 5000;

/** What a project's readable copy is made of, gathered from it as it is now. */
export function gather(project: Project): { org: OrgProject; beside: Beside } {
  return {
    org: orgOf(project),
    beside: {
      pictures: project.usedPictures().map((p) => p.hash),
      records: citedRecords(project),
    },
  };
}

/**
 * The Org writer's thread, made when it is first needed, through the one
 * client of the workers: a writer that dies or stalls fails the copy it was
 * writing, which the log says, and the next is written by one begun anew;
 * where there can be no thread, the window writes it.
 */
const writer = new WorkerClient<OrgProject>({
  name: 'the writer of the readable copy',
  make: () =>
    typeof Worker === 'undefined'
      ? null
      : new Worker(new URL('./write.worker.ts', import.meta.url), { type: 'module' }),
  here: () => ({ answer: (org) => writeProject(org) }),
  timeout: 60_000,
});

/** The Org form of a project as text: in a thread of its own where there is one. */
export async function writeElsewhere(org: OrgProject): Promise<string> {
  try {
    return await writer.ask<string>(org);
  } catch (error) {
    // What cannot be sent to the thread is written here.
    if (error instanceof WorkerError && error.failure === 'unsent') return writeProject(org);
    throw error;
  }
}

/** Runs `fn` when the window is idle, or soon where it cannot say. */
function whenIdle(fn: () => void) {
  const idle = (globalThis as { requestIdleCallback?: (fn: () => void, o?: object) => number })
    .requestIdleCallback;
  if (idle) idle(fn, { timeout: 2000 });
  else setTimeout(fn, 0);
}

/**
 * A copy kept up as what it is of is saved, written by `make`: at most
 * once every few seconds, when the window is idle. `schedule` is called
 * after each save; `finish` when what it is of is closed, to write at once
 * what is waiting. A copy that fails is said in the log, as `what`.
 */
export class Copying {
  readonly #make: () => Promise<void>;
  readonly #what: string;
  #timer: ReturnType<typeof setTimeout> | undefined;
  /** Whether a copy is to be written: asked for, and not yet begun. */
  #due = false;
  /** The copy being written, while it is. */
  #writing: Promise<void> | null = null;
  #last = -Infinity;

  constructor(make: () => Promise<void>, what: string) {
    this.#make = make;
    this.#what = what;
  }

  /** A copy is to be written: once the last is a few seconds old, when the window is idle. */
  schedule() {
    if (this.#due) return;
    this.#due = true;
    if (this.#writing) return;
    this.#wait();
  }

  #wait() {
    const wait = Math.max(0, this.#last + COPY_EVERY - Date.now());
    clearTimeout(this.#timer);
    this.#timer = setTimeout(() => whenIdle(() => void this.#write()), wait);
  }

  /** Writes the copy, if one is due and none is being written. */
  #write(): Promise<void> {
    if (this.#writing || !this.#due) return this.#writing ?? Promise.resolve();
    clearTimeout(this.#timer);
    this.#due = false;
    this.#last = Date.now();
    this.#writing = (async () => {
      try {
        await this.#make();
      } catch (error) {
        console.warn(`${this.#what} could not be written`, error);
      }
    })().finally(() => {
      this.#writing = null;
      if (this.#due) this.#wait();
    });
    return this.#writing;
  }

  /**
   * Writes at once what is due, and waits for what is being written, but
   * no longer than `FINISH_WAIT`: a copy that takes longer goes on by
   * itself, and what was due after it is left for the next opening.
   */
  async finish(): Promise<void> {
    clearTimeout(this.#timer);
    if (this.#writing && !(await within(this.#writing, this.#what))) {
      this.#due = false;
      return;
    }
    if (this.#due && !(await within(this.#write(), this.#what))) this.#due = false;
  }
}

/** The readable copy of one project, kept up as it is saved: its Org form, written in a thread of its own, and what goes beside it. */
export class ReadableCopy extends Copying {
  constructor(gather: () => { org: OrgProject; beside: Beside }, send: Send) {
    super(async () => {
      const { org, beside } = gather();
      await send(await writeElsewhere(org), beside);
    }, 'the readable copy of the project');
  }
}

/** Whether `writing` is done within `FINISH_WAIT`; said in the log where it is not. */
async function within(writing: Promise<void>, what: string): Promise<boolean> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const late = new Promise<boolean>((resolve) => {
    timer = setTimeout(() => resolve(false), FINISH_WAIT);
  });
  const done = await Promise.race([writing.then(() => true), late]);
  clearTimeout(timer);
  if (!done)
    console.warn(
      `${what} was not written within ${FINISH_WAIT / 1000} s of its closing; it is left to be written by itself`,
    );
  return done;
}
