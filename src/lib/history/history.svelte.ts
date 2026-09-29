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

import * as Y from 'yjs';
import { historyCut, historyMerge, historyRead, historyRoom } from '$lib/api/history';
import { citationLabel } from '$lib/editor/references.svelte';
import type { CiteItem, CiteMode } from '$lib/editor/schema';
import { HISTORY, type Project } from '$lib/project/model/project.svelte';
import { toBase64 } from '$lib/util/base64';
import { newId } from '$lib/util/id';
import { applyEdits } from './applying';
import { Engine, type Edit, type When } from './engine';
import { Host, type Message, type Method, type Reply } from './protocol';
import { readRecords, writeRecords, type HistoryRecord } from './records';
import type {
  History,
  Items,
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
  /** Whether older history has been kept less finely since the project was opened. */
  #thinned = false;
  /** Which reading of the history this is: an older one still under way leaves off. */
  #run = 0;
  #unfollow: (() => void) | null = null;
  /** Where the history is read from, where it is not the project's own: an archive. */
  readonly #read: () => Promise<Uint8Array>;

  /** An archive, which is read and not followed: its project may be another, and it changes no more. */
  readonly archive: string | null;

  /**
   * With `archive`, the history is that of an archive, named so; `read`
   * reads it from elsewhere than the project's store.
   */
  constructor(
    project: Project,
    id: string,
    options: { archive?: string; read?: () => Promise<Uint8Array> } = {},
  ) {
    this.project = project;
    this.id = id;
    this.archive = options.archive ?? null;
    this.#read = options.read ?? (() => historyRead(id));
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
      // A reading that is stopped while it waits leaves off: another has
      // begun, and this one must touch neither it nor what it has made.
      const run = ++this.#run;
      const stale = () => run !== this.#run;
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
      // Older history is kept less finely, once each time the project is opened.
      if (!this.archive && !this.#thinned) {
        this.#thinned = true;
        try {
          const records = readRecords(await this.#read());
          if (stale()) return;
          this.#post({ kind: 'load', records, me: null });
          await this.#thin(Date.now());
        } catch (error) {
          if (stale()) return;
          console.error('older history could not be kept less finely', error);
        }
        if (stale()) return;
        this.#post({ kind: 'reset' });
      }
      // Followed before it is read: what is written meanwhile is both on disk
      // and told, and the engine takes it once.
      if (!this.archive)
        this.#unfollow = this.project.follow({
          change: (update, here) => this.#post({ kind: 'change', update, here }),
          written: (time, here, changes) => this.#post({ kind: 'written', time, here, changes }),
        });
      const records = readRecords(await this.#read());
      if (stale()) return;
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
    this.#run++;
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
    return this.#send(method, ...args);
  }

  #send<T>(method: Method, ...args: unknown[]): Promise<T> {
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
  async mapAt(map: string, when: When, since: When | null): Promise<MapAt> {
    const reading = await this.#ask<MapAt>('mapAt', map, when, since);
    for (const p of reading.all) label(p.pieces, this.project);
    return reading;
  }

  /** Brings an element (or, with none, the whole map) back as it was at a moment. */
  async bringBack(map: string, element: string | null, when: When): Promise<number> {
    await this.project.flush();
    const edits = await this.#ask<Edit[]>('bringBack', map, element, when);
    return applyEdits(this.project, edits);
  }

  /** The whole project as it was at a moment, as one update. */
  stateAt(when: When): Promise<Uint8Array> {
    return this.#ask('stateAt', when);
  }

  /**
   * The moments that must not be thinned away: those given a name, and
   * those the review compares with (`KeptReview` in `reviews`).
   */
  kept(): Uint8Array[] {
    const out: Uint8Array[] = [];
    for (const value of this.project.doc.getMap('moments').values()) {
      const snapshot = (value as { snapshot?: unknown }).snapshot;
      if (snapshot instanceof Uint8Array) out.push(snapshot);
    }
    for (const value of this.project.doc.getMap('reviews').values()) {
      const moment =
        value instanceof Y.Map ? value.get('moment') : (value as { moment?: unknown })?.moment;
      if (moment instanceof Uint8Array) out.push(moment);
    }
    return out;
  }

  /**
   * What taking out the history before the moment after a record would take,
   * once what the log holds is in the store. Nothing, where it cannot be done.
   */
  async cutting(record: number): Promise<{ count: number; before: number } | null> {
    await this.project.snapshot(true);
    await this.restart();
    return this.#ask('cut', record, this.kept());
  }

  /**
   * Takes out the history before the moment after a record: into an archive
   * where a path is given, or for good. What is left begins with the project
   * as it was then.
   */
  async cut(record: number, archive: string | null): Promise<void> {
    const cut = await this.#ask<{ count: number; time: number; until: number } | null>(
      'cut',
      record,
      this.kept(),
    );
    if (!cut) throw new Error('the history cannot be taken out there');
    const start = await this.#ask<Uint8Array>('startAt', record);
    await historyCut(
      this.id,
      { first: 0, count: cut.count, time: cut.time, until: cut.until },
      toBase64(start),
      cut.until,
      archive,
    );
    await this.restart();
  }

  /** The items accepted in reviews, which older history must keep. */
  #acceptedItems(): Items[] {
    const out: Items[] = [];
    for (const value of this.project.doc.getMap('reviews').values()) {
      const accepted =
        value instanceof Y.Map
          ? value.get('accepted')
          : (value as { accepted?: unknown })?.accepted;
      const list = accepted instanceof Y.Array ? accepted.toArray() : accepted;
      if (!Array.isArray(list)) continue;
      for (const a of list) {
        const visible = (a as { visible?: unknown })?.visible;
        if (visible && typeof visible === 'object') out.push(visible as Items);
      }
    }
    return out;
  }

  /** Merges older history in the store, as the project's settings say: see `Engine.thin`. */
  async #thin(now: number): Promise<number> {
    const { hourly, daily } = this.project.history;
    const stretches = await this.#send<
      { first: number; count: number; time: number; until: number; record: HistoryRecord }[]
    >('thin', now, hourly, daily, this.kept(), this.#acceptedItems());
    for (const s of stretches)
      await historyMerge(
        this.id,
        { first: s.first, count: s.count, time: s.time, until: s.until },
        toBase64(writeRecords([s.record])),
      );
    return stretches.length;
  }

  /**
   * Keeps older history less finely now, as if it were `now`: for the tests,
   * which cannot wait weeks. Reads the history anew.
   */
  async thinAsOf(now: number): Promise<number> {
    await this.project.snapshot(true);
    await this.restart();
    const merged = await this.#thin(now);
    await this.restart();
    return merged;
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
