/**
 * How the view of a project is kept from one opening to the next: read from
 * what the project's information carries when it is opened, laid out as it
 * was left (`arrange`), and saved a moment after anything of it changes, as
 * well as when the window loses the focus and when the project is left.
 *
 * What is kept is the view's own state (the panes, the cameras, the panel
 * at the side, the outline, the preview, the room each part has, what is
 * folded away, the element at the top of each text, the side with the focus
 * and whether the sides are switched); this reads it and lays it out through `ViewParts`, so that
 * the state stays where the view shows it. What is kept, and how, is
 * `layout.ts`.
 */

import { projectSaveView } from '$lib/api/projects';
import { router } from '$lib/state/router.svelte';
import { arranged, toStore, type Layout, type StoredView } from './layout';
import type { Project } from './model/project.svelte';
import type { Folding } from './text/folding.svelte';

/** The parts of the view that are kept, as the view holds them. */
export interface ViewParts {
  /**
   * The view as it is shown, read from the view's own state each time: what
   * reads it inside an effect follows each part it reads.
   */
  layout(): Layout;
  /** Lays the view out so. */
  apply(layout: Layout): void;
  /** The project of the view, once it is open. */
  project(): Project | null;
  /** What is folded away in the text. */
  folding(): Folding;
}

/** How long after the last change of the view it is saved. */
export const SAVE_AFTER = 1500;

export class ViewStore {
  /** What was kept of the view, until there is a project to show. */
  #stored: StoredView = {};
  #timer: ReturnType<typeof setTimeout> | undefined;
  readonly #id: string;
  readonly #parts: ViewParts;
  readonly #save: (id: string, view: StoredView) => Promise<unknown>;

  constructor(
    id: string,
    parts: ViewParts,
    save: (id: string, view: StoredView) => Promise<unknown> = projectSaveView,
  ) {
    this.#id = id;
    this.#parts = parts;
    this.#save = save;
  }

  /** Takes what was kept of the view, as the project's information carries it. */
  read(view: unknown) {
    this.#stored = (view ?? {}) as StoredView;
  }

  /** The elements under which the text was folded away, as it was kept. */
  get folded(): string[] {
    return Array.isArray(this.#stored.folded) ? this.#stored.folded : [];
  }

  /** Lays out the view as it was left, or as a project is first met. */
  arrange(p: Project) {
    const route = router.route.view === 'project' ? router.route : null;
    this.#parts.apply(arranged(p.nodes, this.#stored, route));
  }

  /** What is kept of the view as it is now. */
  toStore(): StoredView {
    const shown = this.#parts.layout();
    const project = this.#parts.project();
    const layout: Layout = {
      panes: $state.snapshot(shown.panes),
      cameras: $state.snapshot(shown.cameras),
      side: shown.side,
      lastSide: shown.lastSide,
      outline: shown.outline,
      preview: shown.preview,
      sizes: $state.snapshot(shown.sizes),
      tops: $state.snapshot(shown.tops),
      focused: shown.focused,
      mirrored: shown.mirrored,
    };
    return toStore(
      layout,
      project?.nodes ?? new Map(),
      this.#parts.folding().kept((id) => !!project?.node(id)),
    );
  }

  /** Saves the view now, where there is a project; a save that was waiting is not done after. */
  async save() {
    clearTimeout(this.#timer);
    if (!this.#parts.project()) return;
    try {
      await this.#save(this.#id, this.toStore());
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * Saves the view a moment after anything of it changes. Called as the
   * view is made, since it makes an effect of the view.
   */
  follow() {
    // It depends on the project, and on each part of the view that is kept:
    // the element in view and the way of each pane, what the panel at the
    // side shows and showed last, the outline and the preview, each camera
    // (not the record of them: one is written by its entry, which reading the
    // record alone would not see), each size, what is folded, the element at
    // the top of each text, the side with the focus and whether the sides are
    // switched. Each run
    // puts off the save that was waiting.
    $effect(() => {
      if (!this.#parts.project()) return;
      const shown = this.#parts.layout();
      void shown.panes.map((p) => `${p.at}${p.mode}`);
      void shown.side;
      void shown.lastSide;
      void shown.outline;
      void shown.preview;
      void Object.values(shown.cameras);
      void shown.sizes.split;
      void shown.sizes.preview;
      void shown.sizes.references;
      void shown.tops.join('\n');
      void shown.focused;
      void shown.mirrored;
      const folding = this.#parts.folding();
      void folding.folded.size;
      void [...folding.folded];
      clearTimeout(this.#timer);
      this.#timer = setTimeout(() => void this.save(), SAVE_AFTER);
    });
  }
}
