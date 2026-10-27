/**
 * The document pane (ADR 0064), what the panel at the side became: the
 * references, the images, the comments, the citations that were found, the
 * history and the changes of the document in the active side, one at a
 * time, as tabs. Whether it is open and what it shows are the window's
 * (`panes`); this holds what the pane does: the review of the changes while
 * their tab is shown (ADR 0022), the moment of the history that is looked
 * at, which images are shown, the reference the library asked to be shown,
 * and the answers to what is asked of the pane from elsewhere: the
 * comments, the citations found and the images.
 *
 * It follows the focus: what it needs of the active side it asks the window.
 */

import { untrack } from 'svelte';
import { commentsUi } from '$lib/comments/ui.svelte';
import { foundUi } from '$lib/found/found.svelte';
import type { Looking } from '$lib/history/looking';
import { picturesUi, type PictureScope } from '$lib/figures/images.svelte';
import { Review } from '$lib/review/review.svelte';
import { sourceFor } from '$lib/review/source';
import type { MapMode } from '$lib/state/router.svelte';
import type { Project } from './model/project.svelte';
import { panes } from './panes.svelte';
import type { DocumentTab } from './sides.svelte';

/** What the document pane asks of the window: the active side and its project. */
export interface DocumentPaneHost {
  /** The key of the active side; none while no side is shown. */
  readonly key: string | undefined;
  /** The id of the project of the active side. */
  readonly id: string;
  /** The project of the active side, once it is open. */
  project(): Project | null;
  /** The element in view of the active side, and how it shows it. */
  ownPane(): { at: string; mode: MapMode } | undefined;
  /** The element in view the active side has to be at to show an element. */
  holding(element: string): string;
  /** Enters an element in the active side. */
  show(at: string): void;
  /** Turns the active side to its text where it has this element in view and shows it another way. */
  toText(at: string): void;
}

export class DocumentPane {
  /** The review of the changes of the element in view, while their tab is shown (ADR 0022). */
  review = $state<Review | null>(null);
  /** A moment of the history that is looked at, in place of the map as it is. */
  looking = $state.raw<Looking | null>(null);
  /** Which images the pane shows. */
  pictureScope = $state<PictureScope>('project');
  /** A reference to show at the references, with where it is cited, as the library asked. */
  citationsOf = $state<string | null>(null);
  /** The change the review last showed, to tell when it goes to another: none while there is no review. */
  #brought = $state(-1);
  readonly #host: DocumentPaneHost;

  constructor(host: DocumentPaneHost) {
    this.#host = host;
  }

  /** What the pane shows; none while it is closed. */
  get kind(): DocumentTab | null {
    return panes.document ? panes.tab : null;
  }

  /** Shows a tab of the pane, or closes the pane where it shows that tab. */
  show(which: DocumentTab, shown?: boolean) {
    const open = shown ?? this.kind !== which;
    if (open) panes.showTab(which);
    else if (this.kind === which) panes.document = false;
  }

  /** Closes the pane, whatever it shows. */
  close() {
    panes.document = false;
  }

  /** Closes the pane where it is open; else opens it at what it showed last. */
  toggle() {
    panes.toggleDocument();
  }

  /** Opens the tab of changes, or closes it. */
  toggleReview(open = !this.review) {
    if (open) panes.showTab('changes');
    else if (this.kind === 'changes') panes.document = false;
  }

  /**
   * Answers what is asked of the pane, and lets the review follow the
   * active side. Called as the window is made, since it makes effects of it.
   */
  follow() {
    const host = this.#host;

    // The review is there while the tab of changes is shown, of the active
    // side's project at its element in view, however the tab was opened: by
    // its key, by its tab, or as the window was kept. A moment of the history
    // is looked at only while the history is shown. It depends on what the
    // pane shows, on the active side's project and its element in view,
    // which the review needs to be made; the review itself is read
    // untracked, and one there already is kept.
    $effect(() => {
      const kind = this.kind;
      const project = host.project();
      const own = host.ownPane();
      untrack(() => {
        if (kind !== 'history') this.looking = null;
        if (kind !== 'changes') {
          this.review?.close();
          this.review = null;
          return;
        }
        if (this.review || !project || !own) return;
        this.looking = null;
        this.review = new Review(project, sourceFor(project, host.id), own.at);
        this.review.later(0);
      });
    });

    // The pane follows the focus: where another side has it, a review in
    // progress is closed, and the moment of the history looked at is left.
    // It depends on the key of the active side alone.
    let wasKey = untrack(() => host.key);
    $effect(() => {
      const key = host.key;
      untrack(() => {
        if (key === wasKey) return;
        wasKey = key;
        this.looking = null;
        if (this.review) this.toggleReview(false);
      });
    });

    // The changes are shown in the text. Opening the tab leaves the side as
    // it is; going to a change from it turns the side of its element to the
    // text. It depends on the review there is and on the change it shows, and
    // on nothing of the sides, which it reads untracked: a side turned to its
    // diagram stays so until the review goes to another change.
    $effect(() => {
      const r = this.review;
      if (!r) {
        this.#brought = -1;
        return;
      }
      const shown = r.shown;
      untrack(() => {
        if (this.#brought >= 0 && shown !== this.#brought) host.toText(r.at);
        this.#brought = shown;
      });
    });

    // The review follows the element in view, and what is written. It
    // depends on the element in view of the active side, and not on the
    // review, which it reads untracked: a review opened anew begins at that
    // element itself.
    $effect(() => {
      const at = host.ownPane()?.at;
      if (at) untrack(() => this.review?.turnTo(at));
    });

    // What the comments ask of the window: that their tab be shown. It
    // depends on the count of the asks alone; the pane is read untracked, so
    // that turning to another side opens nothing.
    $effect(() => {
      if (!commentsUi.asked) return;
      untrack(() => this.show('comments', true));
    });

    // What the citations that were found ask of the window: that their tab
    // be shown, with their element in view. What was asked before this window
    // was made is not for it. It depends on the count of the asks, on the
    // project and on the element in view of the active side, so that an ask
    // made while the project was opening is answered when it is open; the
    // ask itself is read untracked, and one already answered is not answered
    // again.
    let foundHandled = untrack(() => foundUi.asked);
    $effect(() => {
      const n = foundUi.asked;
      const p = host.project();
      const own = host.ownPane();
      if (!p || !own) return;
      untrack(() => {
        if (n === foundHandled) return;
        foundHandled = n;
        const asked = foundUi.request;
        if (!asked || !p.node(asked.at)) return;
        const at = host.holding(asked.at);
        if (own.at !== at) host.show(at);
        this.show('found', true);
      });
    });

    // The images are asked for from elsewhere, as from the tools for
    // writing. It depends on the ask alone, which it takes, so that it is
    // answered once.
    $effect(() => {
      const wanted = picturesUi.wanted;
      if (!wanted) return;
      untrack(() => {
        picturesUi.wanted = null;
        this.pictureScope = wanted.scope;
        this.show('images', true);
      });
    });
  }
}
