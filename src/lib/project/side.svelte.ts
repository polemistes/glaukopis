/**
 * The panel at the side of the view of a project, and what it shows: the
 * look, the references, the pictures, the comments, the citations that were
 * found, the history and the changes have the one place, one at a time. It
 * holds which is shown and which was shown last, the review of the changes
 * while their panel is open (ADR 0022), the moment of the history that is
 * looked at, and it answers what is asked of the panel from elsewhere: the
 * comments, the citations found, the look and the pictures.
 *
 * The panes are the view's: what this needs of them it asks the view.
 */

import { untrack } from 'svelte';
import { commentsUi } from '$lib/comments/ui.svelte';
import { foundUi } from '$lib/found/found.svelte';
import type { Looking } from '$lib/history/looking';
import { t } from '$lib/i18n';
import { lookUi } from '$lib/look/look.svelte';
import { picturesUi, type PictureScope } from '$lib/pictures/store.svelte';
import { Review } from '$lib/review/review.svelte';
import { sourceFor } from '$lib/review/source';
import { notify } from '$lib/ui/toast.svelte';
import type { MapMode } from '$lib/state/router.svelte';
import type { Project } from './model/project.svelte';
import type { SideKind } from './SideTabs.svelte';

/** What the panel at the side asks of the view. */
export interface SideHost {
  /** The id of the project of the view. */
  readonly id: string;
  /** The project of the view, once it is open. */
  project(): Project | null;
  /** The pane of the project of the view that the panels follow. */
  ownPane(): { at: string; mode: MapMode } | undefined;
  /** Whether the pane that has the focus shows another project, beside. */
  besideInFocus(): boolean;
  /** The element in view that pane has to be at to show an element. */
  holding(element: string): string;
  /** Enters an element in that pane. */
  show(at: string): void;
  /** Turns a pane that has this element in view to its text, where it shows another way. */
  toText(at: string): void;
}

export class Side {
  /** What the panel shows: one thing at a time, in the one place; none while it is closed. */
  kind = $state<SideKind | null>(null);
  /** What it showed last, and shows when it is opened again. */
  last = $state<SideKind>('references');
  /** The review of the changes of the element in view, while its panel is open (ADR 0022). */
  review = $state<Review | null>(null);
  /** A moment of the history that is looked at, in place of the map as it is. */
  looking = $state.raw<Looking | null>(null);
  /** Which pictures the panel shows. */
  pictureScope = $state<PictureScope>('project');
  /** A reference to show at the references, with where it is cited, as the library asked. */
  citationsOf = $state<string | null>(null);
  /** The change the review last showed, to tell when it goes to another: none while there is no review. */
  #brought = $state(-1);
  readonly #host: SideHost;

  constructor(host: SideHost) {
    this.#host = host;
  }

  /**
   * Shows one of what the panel at the side can show, or closes it: the
   * references, the pictures, the history and the changes have the same
   * place, one at a time.
   */
  show(which: SideKind, shown?: boolean) {
    const open = shown ?? this.kind !== which;
    if (which === 'changes') {
      this.toggleReview(open);
      return;
    }
    if (open) {
      if (this.review) this.toggleReview(false);
      this.kind = this.last = which;
    } else if (this.kind === which) {
      this.kind = null;
    }
    if (this.kind !== 'history') this.looking = null;
  }

  /** Closes the panel, whatever it shows. */
  close() {
    if (this.kind) this.show(this.kind, false);
  }

  /** Closes the panel where it is open; else opens it at what it showed last. */
  toggle() {
    if (this.kind) this.close();
    else this.show(this.last, true);
  }

  /** Opens the panel of changes beside the text, or closes it. */
  toggleReview(open = !this.review) {
    const project = this.#host.project();
    const own = this.#host.ownPane();
    if (!open || !project || !own) {
      this.review?.close();
      this.review = null;
      if (this.kind === 'changes') this.kind = null;
      return;
    }
    this.kind = this.last = 'changes';
    if (this.review) return;
    this.looking = null;
    this.review = new Review(project, sourceFor(project, this.#host.id), own.at);
    this.review.later(0);
  }

  /**
   * Answers what is asked of the panel, and lets the review follow the
   * view. Called as the view is made, since it makes effects of the view.
   */
  follow() {
    const host = this.#host;

    // The changes are shown in the text. Opening the panel leaves the view as
    // it is; going to a change from it turns the pane of its element to the
    // text. It depends on the review there is and on the change it shows, and
    // on nothing of the panes, which it reads untracked: a pane turned to its
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
    // depends on the element in view of the pane of the project of the view,
    // and not on the review, which it reads untracked: a review opened anew
    // begins at that element itself.
    $effect(() => {
      const at = host.ownPane()?.at;
      if (at) untrack(() => this.review?.turnTo(at));
    });

    // What the comments ask of the view: that their panel open. It depends
    // on the count of the asks alone; the pane in focus and the panel are
    // read untracked, so that turning to another pane opens nothing.
    $effect(() => {
      if (!commentsUi.asked) return;
      untrack(() => {
        // A thread of a project beside, begun or asked for, is not for the panel of this one.
        if (host.besideInFocus()) {
          commentsUi.done();
          notify(t('project-beside-no-comments'));
          return;
        }
        this.show('comments', true);
      });
    });

    // What the citations that were found ask of the view: that their panel
    // open, with their element in view. What was asked before this view was
    // made is not for it. It depends on the count of the asks, on the project
    // and on the pane of the project of the view, so that an ask made while
    // the project was opening is answered when it is open; the ask itself is
    // read untracked, and one already answered is not answered again.
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

    // The look of the document is asked for from elsewhere: the preview, the
    // kind menu, the palette. It depends on the count of the asks alone, and
    // one asked before this view was made is not for it.
    let lookAsked = untrack(() => lookUi.asked);
    $effect(() => {
      const asked = lookUi.asked;
      if (asked === lookAsked) return;
      lookAsked = asked;
      untrack(() => this.show('look', true));
    });

    // The pictures are asked for from elsewhere, as from the tools for
    // writing. It depends on the ask alone, which it takes, so that it is
    // answered once.
    $effect(() => {
      const wanted = picturesUi.wanted;
      if (!wanted) return;
      untrack(() => {
        picturesUi.wanted = null;
        this.pictureScope = wanted.scope;
        this.show('pictures', true);
      });
    });
  }
}
