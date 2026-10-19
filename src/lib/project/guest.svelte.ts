/**
 * Another project, open in the second pane beside the one of the view (ADR
 * 0037), with its own sharing, so that one that is shared stays in touch.
 * The panels at the side, the preview, the history, the review and the
 * comments are of the project of the view, and say nothing of it.
 *
 * The view says which project its second pane asks for (`follow`, or
 * `turnTo`); this opens it, lets go of the one before, and lets go of what
 * is still being opened when it is no longer asked for, or when the view
 * has gone (`leave`). How a project is opened, shared and closed is the
 * opener's, so that it can be tested without the application.
 */

import { untrack } from 'svelte';
import type { ProjectInfo, Sharing } from '$lib/api/projects';
import { me } from '$lib/history/me.svelte';
import { ProjectSharing } from '$lib/sharing/sharing.svelte';
import { openProject, projects } from '$lib/state/projects.svelte';
import { closedHere, openHere } from './elsewhere';
import type { Pane } from './layout';
import type { Project } from './model/project.svelte';
import { Folding } from './text/folding.svelte';

/** A project and what is known of it, as it is opened. */
export interface Opened {
  project: Project;
  info: ProjectInfo;
}

/** The touch a project beside keeps with the others: what the view reads of it, and its end. */
export interface GuestSharing {
  readonly sharing: Sharing | null;
  close(): void;
}

/** The project beside, once it is open. */
export interface Guest {
  id: string;
  info: ProjectInfo;
  project: Project;
  sharing: GuestSharing;
  /** What is folded away in its text, while it is beside: not kept. */
  folding: Folding;
}

/** How a project beside is opened and let go of. */
export interface Opener {
  /** Waits until what was written in the project when it was last let go is on disk. */
  closed(id: string): Promise<void>;
  /** Opens it: as beside, not as the project last opened. */
  open(id: string): Promise<Opened>;
  /** Puts it in touch with the others, where it is shared. */
  share(id: string, project: Project, info: ProjectInfo): GuestSharing;
  /** Counts it as open in the view, written in by the one who works here. */
  here(id: string, project: Project): void;
  /** Counts it as no longer open in the view. */
  away(id: string, project: Project): void;
  /** Says that it is being closed, so that what reads it from disk meanwhile waits for it. */
  closing(id: string, done: Promise<void>): void;
}

/** The opener of the application. */
export const opener: Opener = {
  closed: (id) => projects.closed(id),
  async open(id) {
    // It is opened beside: not the project last opened.
    const last = projects.lastOpened;
    const opened = await openProject(id);
    projects.lastOpened = last;
    return opened;
  },
  share: (id, project, info) => new ProjectSharing(id, project, info),
  here(id, project) {
    openHere(id, project);
    project.setMe(me());
  },
  away: (id, project) => closedHere(id, project),
  closing: (id, done) => projects.closing(id, done),
};

export class GuestProject {
  /** The project beside, while one is open. */
  current = $state.raw<Guest | null>(null);
  /** The project being opened beside, until it is open. */
  #opening: string | null = null;
  /**
   * The view has gone: a project beside that is still being opened is let
   * go at once when it is.
   */
  #gone = false;
  readonly #own: () => Project | null;
  readonly #opener: Opener;
  readonly #onfail: (id: string, error: unknown) => void;

  constructor(options: {
    /** The project of the view, which a pane shows where it names no other. */
    own: () => Project | null;
    /** A project beside that could not be opened: the view says so, and closes its pane. */
    onfail: (id: string, error: unknown) => void;
    opener?: Opener;
  }) {
    this.#own = options.own;
    this.#onfail = options.onfail;
    this.#opener = options.opener ?? opener;
  }

  /** The project a pane shows; none while the one beside is being opened. */
  projectOf(p: Pane | undefined): Project | null {
    if (!p) return null;
    if (!p.project) return this.#own();
    return this.current?.id === p.project ? this.current.project : null;
  }

  /**
   * The project beside follows what the second pane asks for: opened, or let
   * go. Called as the view is made, since it makes an effect of the view.
   */
  follow(wanted: () => string | null) {
    // It depends on the id the second pane asks for and on nothing else: the
    // opening, which reads and writes the state of this, is done untracked.
    $effect(() => {
      const id = wanted();
      untrack(() => void this.turnTo(id));
    });
  }

  /** Opens the project of that id beside, letting go of the one before; with none, only lets go. */
  async turnTo(id: string | null) {
    if (this.current?.id === id || (id && this.#opening === id)) return;
    const was = this.current;
    this.current = null;
    if (was) this.#letGo(was);
    this.#opening = id;
    if (!id) return;
    const o = this.#opener;
    try {
      // What was written in it when it was last let go is on disk first.
      await o.closed(id);
      if (this.#gone || this.#opening !== id) return;
      const opened = await o.open(id);
      const p = opened.project;
      const g: Guest = {
        id,
        info: opened.info,
        project: p,
        sharing: o.share(id, p, opened.info),
        folding: new Folding([], (e) => {
          const node = p.nodes.get(e);
          return !!node && (!node.empty || !!node.include);
        }),
      };
      if (this.#gone || this.#opening !== id) {
        this.#letGo(g);
        return;
      }
      this.#opening = null;
      o.here(id, p);
      this.current = g;
    } catch (error) {
      if (this.#opening !== id) return;
      this.#opening = null;
      this.#onfail(id, error);
    }
  }

  /** Lets go of the project beside: on disk, out of touch with the others, and closed. */
  #letGo(g: Guest): Promise<void> {
    this.#opener.away(g.id, g.project);
    g.sharing.close();
    const done = g.project.close();
    // What reads it from disk meanwhile waits for it.
    this.#opener.closing(g.id, done);
    return done.catch((error) => console.error(error));
  }

  /** Lets go of the project beside, where there is one, when the view goes; and of one still being opened, when it is. */
  leave(): Promise<void> {
    this.#gone = true;
    this.#opening = null;
    const g = this.current;
    this.current = null;
    return g ? this.#letGo(g) : Promise.resolve();
  }
}
