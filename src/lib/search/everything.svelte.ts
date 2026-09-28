/**
 * The search through everything, as the place of it in the rail shows it:
 * the words, the options, whether the project opened last or all projects
 * are searched, and what was found in each. The projects are read and
 * searched by the engine (`engine.ts`), in a thread of its own; a project
 * that has not changed since it was read is not read again.
 *
 * Choosing what was found opens the project and the map in the text, and
 * the text goes to it: what is to be gone to waits here as a jump, which
 * the text of the map takes when it is shown (`MapText.svelte`).
 */

import { projectLoad, type ProjectInfo } from '$lib/api/projects';
import { projects } from '$lib/state/projects.svelte';
import { router } from '$lib/state/router.svelte';
import { Engine } from './engine';
import type { Found, ProjectFound } from './everything';
import { NO_OPTIONS, type SearchOptions } from './matching';

export type Scope = 'last' | 'all';

/** Where the text of a map is to go when it is shown: to what was found through everything. */
export interface Jump {
  project: string;
  map: string | null;
  element: string | null;
  part: 'title' | 'body' | null;
  passage: number;
  start: number;
  words: string;
  options: SearchOptions;
  /** Of what is written about a work: the references of the project are shown. */
  references: boolean;
}

let waiting: Jump | null = null;

/** The jump that waits for a map, if one does. It is taken. */
export function takeJump(map: string): Jump | null {
  const jump = waiting;
  if (!jump || jump.map !== map) return null;
  waiting = null;
  return jump;
}

/** The jump that waits for a project, if one does; it is taken where it is for no map. */
export function jumpFor(project: string): Jump | null {
  const jump = waiting;
  if (!jump || jump.project !== project) return null;
  if (!jump.map) waiting = null;
  return jump;
}

const WAIT = 260;

class Everything {
  words = $state('');
  scope = $state<Scope>('last');
  options = $state<SearchOptions>({ ...NO_OPTIONS });
  /** What was found, by project, in the order the projects are searched. */
  found = $state.raw<ProjectFound[]>([]);
  /** The name of the project that is being read. */
  reading = $state<string | null>(null);
  /** Why the words cannot be searched for, as a regular expression that is not one. */
  error = $state<string | null>(null);
  /** The projects that could not be read. */
  unread = $state.raw<string[]>([]);
  /** Whether what was found is for the words as they are. */
  done = $state(false);

  #engine: Engine | null = null;
  /** What was read of each project: its time of change when it was read. */
  #read = new Map<string, string>();
  #round = 0;
  #timer: ReturnType<typeof setTimeout> | undefined;

  get count(): number {
    return this.found.reduce((n, p) => n + p.count, 0);
  }

  /** The projects that are searched: the one opened last, or all, the last changed first. */
  targets(): ProjectInfo[] {
    const list = projects.list;
    if (this.scope === 'all') return list;
    const last = list.find((p) => p.id === projects.lastOpened) ?? list[0];
    return last ? [last] : [];
  }

  /** Searches after a pause, as the words are typed. */
  later(wait = WAIT) {
    clearTimeout(this.#timer);
    this.#timer = setTimeout(() => void this.search(), wait);
  }

  /** Searches now, reading what has changed first. */
  async search(): Promise<void> {
    clearTimeout(this.#timer);
    const round = ++this.#round;
    const words = this.words;
    const options = $state.snapshot(this.options) as SearchOptions;
    this.found = [];
    this.error = null;
    this.unread = [];
    this.done = false;
    if (!words) {
      this.reading = null;
      return;
    }
    this.#engine ??= new Engine();
    const engine = this.#engine;
    if (!projects.loaded) await projects.load();
    for (const target of this.targets()) {
      if (round !== this.#round) return;
      // A project that is being closed is read when what was written in it is on disk.
      await projects.closed(target.id);
      const info = projects.list.find((p) => p.id === target.id) ?? target;
      if (this.#read.get(info.id) !== info.modified) {
        this.reading = info.name;
        try {
          const loaded = await projectLoad(info.id);
          await engine.read(info.id, info.name, loaded.state, loaded.updates);
          this.#read.set(info.id, info.modified);
        } catch (error) {
          console.error(`${info.name} could not be read`, error);
          if (round === this.#round) this.unread = [...this.unread, info.name];
          continue;
        }
      }
      if (round !== this.#round) return;
      const result = await engine.search(info.id, words, options);
      if (round !== this.#round) return;
      if (result && 'error' in result) {
        this.error = result.error;
        break;
      }
      if (result?.count) this.found = [...this.found, { ...result, name: info.name }];
    }
    if (round !== this.#round) return;
    this.reading = null;
    this.done = true;
  }

  /** Opens what was found where it stands. */
  go(project: ProjectFound, found: Found) {
    const text = found.where === 'text';
    waiting = {
      project: project.project,
      map: found.map,
      element: found.element,
      part: text ? found.part : null,
      passage: found.passage,
      start: found.start,
      words: this.words,
      // In the text what stands outside it is citations, formulas and words that point.
      options: { ...$state.snapshot(this.options), selection: false },
      references: found.where === 'note',
    };
    router.go({
      view: 'project',
      project: project.project,
      map: found.map ?? undefined,
      mode: 'text',
    });
  }
}

export const everything = new Everything();
