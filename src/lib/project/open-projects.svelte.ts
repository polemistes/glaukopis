/**
 * The projects the sides of the window show (ADR 0064): each opened once,
 * however many sides show it, with its own sharing, so that one that is
 * shared stays in touch; with what it keeps of how it was looked at (the
 * cameras of its diagrams, what is folded in its text, where each text was
 * read, its outline, where it was left), saved a moment after that changes
 * and when it is let go. A side takes a project (`acquire`) and gives it
 * back (`release`); the last to give it back lets it go: what was written is
 * put on disk, it is out of touch with the others, and closed.
 *
 * How a project is opened, shared and closed is the opener's, so that this
 * can be tested without the application.
 */

import { SvelteMap } from 'svelte/reactivity';
import { projectSaveView, type ProjectInfo, type Sharing } from '$lib/api/projects';
import { historyOf } from '$lib/history/history.svelte';
import { me } from '$lib/history/me.svelte';
import { ProjectSharing } from '$lib/sharing/sharing.svelte';
import { beforeClose } from '$lib/state/closing';
import { openProject, projects, rememberOpened } from '$lib/state/projects.svelte';
import { describeError } from '$lib/ui/toast.svelte';
import { closedHere, openHere } from './elsewhere';
import { leftAt, readMemory, toStore, type Beside, type Left, type Memory } from './layout';
import type { Camera } from './diagram/camera';
import type { Project } from './model/project.svelte';
import { PROJECT } from './model/types';
import { Folding } from './text/folding.svelte';

/** The touch a project keeps with the others: what the window reads of it, and its end. */
export interface SharingOf {
  readonly sharing: Sharing | null;
  readonly shared: boolean;
  close(): void;
}

/** A project and what is known of it, as it is opened. */
export interface Opened {
  project: Project;
  info: ProjectInfo;
}

/** How a project is opened, kept and let go of. */
export interface Opener {
  /** Waits until what was written in the project when it was last let go is on disk. */
  closed(id: string): Promise<void>;
  open(id: string): Promise<Opened>;
  share(id: string, project: Project, info: ProjectInfo): SharingOf;
  /** Counts it as open in the window, written in by the one who works here. */
  here(id: string, project: Project): void;
  /** Counts it as no longer open in the window. */
  away(id: string, project: Project): void;
  /** Says that it is being closed, so that what reads it from disk meanwhile waits for it. */
  closing(id: string, done: Promise<unknown>): void;
  /** Saves what it keeps of how it was looked at. */
  saveView(id: string, view: unknown): Promise<unknown>;
  /** Stops the history's keeping of its moments. */
  stop(id: string, project: Project): void;
}

/** The opener of the application. */
export const opener: Opener = {
  closed: (id) => projects.closed(id),
  async open(id) {
    const opened = await openProject(id);
    // It is shown, and the start screen counts it among those last opened.
    rememberOpened(id);
    return opened;
  },
  share: (id, project, info) => new ProjectSharing(id, project, info),
  here(id, project) {
    openHere(id, project);
    project.setMe(me());
  },
  away: (id, project) => closedHere(id, project),
  closing: (id, done) =>
    projects.closing(
      id,
      done.then(() => projects.load()),
    ),
  saveView: (id, view) => projectSaveView(id, view),
  stop: (id, project) => historyOf(project, id).stop(),
};

/** How long after the last change of what a project keeps it is saved. */
export const SAVE_AFTER = 1500;

/** A project the sides show, while one does. */
export class OpenProject {
  readonly id: string;
  state = $state<'opening' | 'open' | 'failed'>('opening');
  /** Why it could not be opened, as it is said; empty where nothing is said of it. */
  failure = $state<string | null>(null);
  project = $state.raw<Project | null>(null);
  info = $state.raw<ProjectInfo | null>(null);
  sharing = $state.raw<SharingOf | null>(null);
  /** What is folded away in its text, for the whole project, whatever is in view. */
  folding = $state.raw(new Folding());
  /** Where each diagram was looked at, by the element in view. */
  cameras = $state<Record<string, Camera>>({});
  /** Where the text of each element in view was read: the element at its top. */
  tops = $state<Record<string, string>>({});
  outlineWidth = $state(240);
  /** Where it was left: the element and the view of the side that showed it last. */
  left = $state.raw<Left | null>(null);
  /** What stood beside it then, where that was its own (ADR 0073). */
  beside = $state.raw<Beside | null>(null);
  /** How many sides show it. */
  refs = 0;
  /** It was let go while it was still being opened. */
  gone = false;
  #timer: ReturnType<typeof setTimeout> | undefined;

  constructor(id: string) {
    this.id = id;
  }

  /** Where it is to be shown, where nothing else is asked: as it was left. */
  where(): Left {
    const p = this.project;
    const memory = this.#memory();
    return p ? leftAt(memory, p.nodes) : { at: PROJECT, mode: 'diagram' };
  }

  #memory(): Memory {
    return {
      cameras: $state.snapshot(this.cameras),
      tops: $state.snapshot(this.tops),
      outlineWidth: this.outlineWidth,
      left: this.left,
      beside: this.beside,
    };
  }

  /** What is kept of how it was looked at, as it is now. */
  toStore() {
    const p = this.project;
    return toStore(
      this.#memory(),
      p?.nodes ?? new Map(),
      this.folding.kept((id) => !!p?.node(id)),
    );
  }

  /** Something it keeps has changed: it is saved a moment after, once, however often it changes meanwhile. */
  changed(save: () => Promise<void>) {
    clearTimeout(this.#timer);
    this.#timer = setTimeout(() => void save(), SAVE_AFTER);
  }

  /** A save that was waiting is not done after. */
  cancel() {
    clearTimeout(this.#timer);
  }
}

export class OpenProjects {
  #open = new SvelteMap<string, OpenProject>();
  readonly #opener: Opener;
  #release: (() => void) | undefined;
  /** Called once a project is open, before a side shows it: to answer what was asked of it before. */
  onopened: ((open: OpenProject) => void) | null = null;

  constructor(o: Opener = opener) {
    this.#opener = o;
  }

  get(id: string | null | undefined): OpenProject | undefined {
    return id ? this.#open.get(id) : undefined;
  }

  /** The projects open now, in the order they were opened. */
  all(): OpenProject[] {
    return [...this.#open.values()];
  }

  /** A side takes a project: it is opened where it is not open, or being opened, already. */
  acquire(id: string): OpenProject {
    let open = this.#open.get(id);
    if (!open) {
      open = new OpenProject(id);
      this.#open.set(id, open);
      void this.#opening(open);
    }
    open.refs++;
    this.#release ??= beforeClose(() => this.leaveAll());
    return open;
  }

  /** A side gives a project back: the last to do so lets it go. */
  release(id: string): Promise<void> {
    const open = this.#open.get(id);
    if (!open) return Promise.resolve();
    open.refs--;
    if (open.refs > 0) return Promise.resolve();
    this.#open.delete(id);
    open.gone = true;
    if (!this.#open.size) {
      this.#release?.();
      this.#release = undefined;
    }
    return this.#letGo(open);
  }

  async #opening(open: OpenProject) {
    const o = this.#opener;
    const id = open.id;
    try {
      // What was written in it when it was last let go is on disk first.
      await o.closed(id);
      // Let go while it waited, as when another project is gone to while
      // this one is opening: then nothing is opened for it.
      if (open.gone) return;
      const opened = await o.open(id);
      const p = opened.project;
      // Let go while it was read: what was opened is let go at once, before
      // it is shared or counted as open here, since nothing would close it after.
      if (open.gone) {
        o.closing(
          id,
          p.close().catch((error) => console.error(error)),
        );
        return;
      }
      const memory = readMemory(opened.info.view);
      const folded = (opened.info.view as { folded?: unknown } | undefined)?.folded;
      open.folding = new Folding(
        Array.isArray(folded) ? folded.filter((f): f is string => typeof f === 'string') : [],
        (e) => {
          const node = p.nodes.get(e);
          return !!node && (!node.empty || !!node.include);
        },
      );
      open.cameras = memory.cameras;
      open.tops = memory.tops;
      open.outlineWidth = memory.outlineWidth;
      open.left = memory.left;
      open.beside = memory.beside;
      open.info = opened.info;
      open.sharing = o.share(id, p, opened.info);
      open.project = p;
      o.here(id, p);
      open.state = 'open';
      this.onopened?.(open);
    } catch (error) {
      if (open.gone) return;
      // What is said of it is looked up when it is shown, in the language of that moment.
      open.failure = describeError(error) ?? '';
      open.state = 'failed';
    }
  }

  /** Saves what a project keeps of how it was looked at, now; a save that was waiting is not done after. */
  async save(open: OpenProject) {
    open.cancel();
    if (!open.project) return;
    try {
      await this.#opener.saveView(open.id, open.toStore());
    } catch (error) {
      console.error(error);
    }
  }

  /** Something a project keeps has changed: it is saved a moment after. */
  changed(open: OpenProject) {
    open.changed(() => this.save(open));
  }

  /** Puts in order on disk what the projects hold, as the window loses the focus. */
  async snapshotAll() {
    await Promise.all(
      this.all().map(async (open) => {
        if (open.project) void open.project.snapshot();
        await this.save(open);
      }),
    );
  }

  /** Lets go of a project: what it keeps saved, out of touch with the others, on disk, and closed. */
  #letGo(open: OpenProject): Promise<void> {
    const p = open.project;
    if (!p) return Promise.resolve();
    const o = this.#opener;
    o.away(open.id, p);
    o.stop(open.id, p);
    open.sharing?.close();
    const done = this.save(open).then(() => p.close());
    // What reads it from disk meanwhile, as the search through everything, waits for it.
    o.closing(open.id, done);
    return done.catch((error) => console.error(error));
  }

  /** As the window closes: every project open is let go, and waited for. */
  async leaveAll() {
    const all = this.all();
    this.#open.clear();
    for (const open of all) open.gone = true;
    await Promise.all(all.map((open) => this.#letGo(open)));
  }
}

export const openProjects = new OpenProjects();
