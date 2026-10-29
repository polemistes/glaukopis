/**
 * The sources of the projects, as the window shows them (ADR 0072): read
 * from each project's record when first asked for, and kept there, on this
 * computer alone, a moment after they change and before the window closes.
 *
 * A change asked for before a project's sources have come is kept until
 * they come, then made. The place of a tab, which changes as its pages are
 * scrolled, is kept without telling what shows the tabs: nothing shows it
 * but the view that tells it.
 */

import { SvelteMap } from 'svelte/reactivity';
import { projectSaveSources, projectSources } from '$lib/api/projects';
import { beforeClose } from '$lib/state/closing';
import type { Place } from './pages';
import { emptySources, readSources, type Sources } from './sources';

/** What the sides ask of the sources of a project. */
export interface SourcesOf {
  of(project: string): Sources;
  change(project: string, change: (s: Sources) => Sources): void;
  /** A tab's place, kept without telling. */
  place(project: string, id: string, place: Place): void;
  forget(project: string): void;
}

const NONE: Sources = Object.freeze({ tabs: [], active: null }) as Sources;
const DELAY = 300;

/** How sources are read and kept: the core's, else the tests'. */
export interface SourcesKeeper {
  read(project: string): Promise<unknown>;
  keep(project: string, sources: Sources): Promise<unknown>;
}

const core: SourcesKeeper = { read: projectSources, keep: projectSaveSources };

export class SourcesStore implements SourcesOf {
  #by = new SvelteMap<string, Sources>();
  #loading = new Set<string>();
  #waiting = new Map<string, ((s: Sources) => Sources)[]>();
  #unsaved = new Set<string>();
  #timer: ReturnType<typeof setTimeout> | undefined;
  #saving: Promise<unknown> = Promise.resolve();
  #keeper: SourcesKeeper;

  constructor(keeper: SourcesKeeper = core) {
    this.#keeper = keeper;
    if (keeper === core) beforeClose(() => this.flush().then(() => {}), 'first');
  }

  of(project: string): Sources {
    const got = this.#by.get(project);
    if (got) return got;
    this.#load(project);
    return NONE;
  }

  /** Whether a project's sources have come. */
  has(project: string): boolean {
    return this.#by.has(project);
  }

  change(project: string, change: (s: Sources) => Sources) {
    const got = this.#by.get(project);
    if (!got) {
      const waiting = this.#waiting.get(project) ?? [];
      waiting.push(change);
      this.#waiting.set(project, waiting);
      this.#load(project);
      return;
    }
    const next = change(got);
    if (next === got) return;
    this.#by.set(project, next);
    this.#later(project);
  }

  place(project: string, id: string, place: Place) {
    const tab = this.#by.get(project)?.tabs.find((t) => t.id === id);
    if (!tab || (tab.place.page === place.page && tab.place.at === place.at)) return;
    tab.place = { ...place };
    this.#later(project);
  }

  forget(project: string) {
    this.#by.delete(project);
    this.#waiting.delete(project);
    this.#unsaved.delete(project);
  }

  /** Writes what is not yet written; waits for the writes begun. */
  flush(): Promise<unknown> {
    clearTimeout(this.#timer);
    const all = [...this.#unsaved];
    this.#unsaved.clear();
    for (const project of all) {
      const sources = this.#by.get(project);
      if (!sources) continue;
      const kept = $state.snapshot(sources) as Sources;
      this.#saving = this.#saving
        .then(() => this.#keeper.keep(project, kept))
        .catch((e) => console.warn('the sources of a project could not be kept', project, e));
    }
    return this.#saving;
  }

  #later(project: string) {
    this.#unsaved.add(project);
    clearTimeout(this.#timer);
    this.#timer = setTimeout(() => void this.flush(), DELAY);
  }

  #load(project: string) {
    if (this.#loading.has(project)) return;
    this.#loading.add(project);
    void this.#keeper
      .read(project)
      .catch(() => null)
      .then((kept) => {
        this.#loading.delete(project);
        let sources = kept ? readSources(kept) : emptySources();
        const waiting = this.#waiting.get(project) ?? [];
        this.#waiting.delete(project);
        for (const change of waiting) sources = change(sources);
        this.#by.set(project, sources);
        if (waiting.length) this.#later(project);
      });
  }
}

export const sourcesStore = new SourcesStore();
