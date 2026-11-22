/**
 * A review asked for from outside the view of a project: of a project, from
 * a moment given, as when a project was written in on two computers while
 * they were apart (record 0119). The document pane opens its tab of changes
 * once a side of that project is the active one, and gives the review the
 * moment (`project/document-pane.svelte.ts`).
 */

import type { Choice } from './source';

export interface AskedReview {
  /** The id of the project. */
  project: string;
  /** The moment to review from. */
  choice: Choice;
  /** Whether one's own changes are shown too: those of one's other computers are one's own. */
  own: boolean;
}

class ReviewAsk {
  /** What is asked, until the document pane has answered it. */
  asked = $state.raw<AskedReview | null>(null);

  ask(review: AskedReview) {
    this.asked = review;
  }
}

export const reviewAsk = new ReviewAsk();
