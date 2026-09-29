/**
 * The history of a project that is open (ADR 0021), as the window has it: the
 * `History` of the contract, answered by the engine in a worker, which reads
 * the history only when it is first asked something, never when the project
 * is opened. What changes the project is done here, in the document that is
 * worked in, as a change of this person's.
 *
 * `historyOf(project, id)` gives the one of a project; the review asks it
 * the same way.
 */

import { historyRead, historyRoom } from '$lib/api/history';
import { citationLabel } from '$lib/editor/references.svelte';
import type { CiteItem, CiteMode } from '$lib/editor/schema';
import { HISTORY, type Project } from '$lib/project/model/project.svelte';
import { newId } from '$lib/util/id';
import { applyEdits } from './applying';
import { Engine, type Edit } from './engine';
import { Host, type Message, type Method, type Reply } from './protocol';
import { readRecords } from './records';
import type {
  History,
  MapChanges,
  Moment,
  Named,
  Passage,
  Person,
  Piece,
  Place,
  Reference,
  Session,
  Version,
} from './types';

/** The whole map at a moment, compared with the moment before: for looking at the history. */
export type MapAt = MapChanges & {
  all: Passage[];
  order: { element: string; before: boolean; after: boolean; level: number }[];
};

export class ProjectHistory implements History {
  readonly project: Project;
  readonly id: string;
  /** Whether the history has been read, and is followed. */
  ready = $state(false);
  #worker: Worker | null = null;
  /** Where there is no worker (the tests): the engine, here. */
  #host: Host | null = null;
  #asked = 0;
  #waiting = new Map<number, { resolve: (v: unknown) => void; reject: (e: unknown) => void }>();
  #started: Promise<void> | null = null;
  #unfollow: (() => void) | null = null;
  /** Where the history is read from, where it is not the project's own: an archive. */
  readonly #read: () => Promise<Uint8Array>;

  constructor(project: Project, id: string, read?: () => Promise<Uint8Array>) {
    this.project = project;
    this.id = id;
    this.#read = read ?? (() => historyRead(id));
  }

  /** Whether the project keeps its history. */
  get on(): boolean {
    return this.project.history.on;
  }

  /** Turns the history on: it begins with the project as it is. */
  async turnOn() {
    await this.project.setHistory({ on: true });
    this.restart();
  }

  #post(message: Message) {
    if (this.#worker) this.#worker.postMessage(message);
    else this.#host?.take(message);
  }

  #reply(reply: Reply) {
    const waiting = this.#waiting.get(reply.ask);
    this.#waiting.delete(reply.ask);
    if (!waiting) return;
    if ('error' in reply) waiting.reject(new Error(reply.error));
    else waiting.resolve(reply.value);
  }

  /** Reads the history, and follows the project from then on. Once. */
  start(): Promise<void> {
    this.#started ??= (async () => {
      if (typeof Worker !== 'undefined') {
        try {
          this.#worker = new Worker(new URL('./engine.worker.ts', import.meta.url), {
            type: 'module',
          });
          this.#worker.onmessage = (event: MessageEvent<Reply>) => this.#reply(event.data);
        } catch {
          this.#worker = null;
        }
      }
      if (!this.#worker)
        this.#host = new Host(
          () => new Engine(),
          (reply) => this.#reply(reply),
        );
      // Followed before it is read: what is written meanwhile is both on disk
      // and told, and the engine takes it once.
      this.#unfollow = this.project.follow({
        change: (update, here) => this.#post({ kind: 'change', update, here }),
        written: (time, here, changes) => this.#post({ kind: 'written', time, here, changes }),
      });
      const records = readRecords(await this.#read());
      this.#post({ kind: 'load', records, me: this.project.me?.id ?? null });
      this.ready = true;
    })();
    return this.#started;
  }

  /** Reads the history anew: after it was kept less finely, or taken out. */
  restart() {
    this.stop();
    return this.start();
  }

  stop() {
    this.#unfollow?.();
    this.#unfollow = null;
    this.#worker?.terminate();
    this.#worker = null;
    this.#host = null;
    this.#started = null;
    this.ready = false;
    for (const w of this.#waiting.values()) w.reject(new Error('the history was closed'));
    this.#waiting.clear();
  }

  async #ask<T>(method: Method, ...args: unknown[]): Promise<T> {
    await this.start();
    const ask = ++this.#asked;
    return new Promise<T>((resolve, reject) => {
      this.#waiting.set(ask, { resolve: resolve as (v: unknown) => void, reject });
      this.#post({ kind: 'ask', ask, method, args });
    });
  }

  // ---- the contract ----

  async people(): Promise<Person[]> {
    const people = await this.#ask<Person[]>('people');
    const me = this.project.me;
    // This person as they are named now, whether or not the project has been told.
    return me
      ? people.map((p) => (p.id === me.id ? { ...p, name: me.name || p.name } : p))
      : people;
  }

  now(): Promise<Moment> {
    return this.#ask('now');
  }

  begins(): Promise<Moment> {
    return this.#ask('begins');
  }

  sessions(): Promise<Session[]> {
    return this.#ask('sessions');
  }

  moment(record: number): Promise<Moment> {
    return this.#ask('moment', record);
  }

  named(): Promise<Named[]> {
    return this.#ask('named');
  }

  async compare(map: string, reference: Reference, elements?: string[]): Promise<MapChanges> {
    const changes = await this.#ask<MapChanges>('compare', map, reference, elements);
    for (const p of changes.passages) label(p.pieces, this.project);
    return changes;
  }

  async versions(
    place: Place,
    from: Uint8Array,
    to: Uint8Array,
    reference: Reference,
  ): Promise<Version[]> {
    const versions = await this.#ask<Version[]>('versions', place, from, to, reference);
    for (const v of versions) label(v.pieces, this.project);
    return versions;
  }

  async revert(passage: Passage, pieces: Piece[]): Promise<void> {
    await this.project.flush();
    const edits = await this.#ask<Edit[]>('revert', passage, pieces);
    applyEdits(this.project, edits);
  }

  async restore(place: Place, from: Uint8Array, to: Uint8Array, moment: Uint8Array): Promise<void> {
    await this.project.flush();
    const edits = await this.#ask<Edit[]>('restore', place, from, to, moment);
    applyEdits(this.project, edits);
  }

  // ---- for looking at the history ----

  /** The whole map after a record, compared with it after another. */
  async mapAt(map: string, record: number, since: number | null): Promise<MapAt> {
    const reading = await this.#ask<MapAt>('mapAt', map, record, since);
    for (const p of reading.all) label(p.pieces, this.project);
    return reading;
  }

  /** How much room the history takes on disk, in bytes. */
  room(): Promise<number> {
    return historyRoom(this.id);
  }

  /** Gives a moment a name, in the project, for every copy. */
  name(moment: Moment, name: string): string {
    const id = newId();
    this.project.doc.transact(() => {
      this.project.doc.getMap('moments').set(id, {
        name,
        time: moment.time,
        by: this.project.me?.id ?? null,
        snapshot: moment.snapshot,
      });
    }, HISTORY);
    return id;
  }

  /** Takes the name from a moment. */
  unname(id: string) {
    this.project.doc.transact(() => this.project.doc.getMap('moments').delete(id), HISTORY);
  }
}

/** What objects in the text are called, as they are shown. */
function label(pieces: Piece[], project: Project) {
  void project;
  for (const p of pieces) {
    for (const object of [p.object, p.objectBefore]) {
      if (!object) continue;
      if (object.kind === 'citation')
        object.label = citationLabel(
          (object.attrs.items as CiteItem[] | undefined) ?? [],
          (object.attrs.mode as CiteMode | undefined) ?? 'normal',
        );
      else if (object.kind === 'math') object.label = String(object.attrs.tex ?? '');
    }
  }
}

const histories = new WeakMap<Project, ProjectHistory>();

/** The history of a project that is open: one for each. */
export function historyOf(project: Project, id: string): ProjectHistory {
  let history = histories.get(project);
  if (!history) {
    history = new ProjectHistory(project, id);
    histories.set(project, history);
  }
  return history;
}
