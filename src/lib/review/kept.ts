/**
 * What a person has reviewed, as the project keeps it (ADR 0022), so that it
 * holds on every computer they work on and the others can see how far they
 * have come: in the map `reviews` of the project's document, by the id of the
 * person, a map of
 *
 * - `moment`: `Y.encodeSnapshot` of the moment they review from;
 * - `time`: when that moment was, in milliseconds since 1970;
 * - `accepted`: an array of the stretches of text they accepted since, each
 *   an `Accepted` of the contract (`history/types.ts`);
 * - `settled`: an array of the changes to elements, and to figures, equations
 *   and tables as wholes, that they accepted since: what each is, and what it
 *   was when it was accepted, so that it is shown again if it changes again.
 *
 * When nothing is left that they have not accepted, the review becomes simply
 * the moment the changes were worked out at, with nothing accepted since.
 *
 * Each writes only their own review. It is not part of undo: it is not the
 * writing of the project.
 */

import * as Y from 'yjs';
import type { Accepted, Moment, Reference } from '$lib/history/types';

export const REVIEWS = 'reviews';

/** The origin of what is written here: not undone, and saved as all else. */
export const REVIEWING = 'review';

/** A change to an element, or to an object as a whole, that was accepted. */
export interface Settled {
  /** Which change it is: the key the change is known by. */
  key: string;
  /** What it was when it was accepted, in few signs. */
  state: string;
}

export interface Review {
  moment: Uint8Array;
  time: number;
  accepted: Accepted[];
  settled: Settled[];
}

type Kept = Y.Map<unknown>;

function reviews(doc: Y.Doc): Y.Map<Kept> {
  return doc.getMap<Kept>(REVIEWS);
}

function isAccepted(value: unknown): value is Accepted {
  const a = value as Accepted | null;
  return (
    !!a &&
    typeof a === 'object' &&
    a.from instanceof Uint8Array &&
    a.to instanceof Uint8Array &&
    typeof a.visible === 'object' &&
    !!a.place &&
    typeof a.place.element === 'string'
  );
}

function isSettled(value: unknown): value is Settled {
  const s = value as Settled | null;
  return !!s && typeof s.key === 'string' && typeof s.state === 'string';
}

/** What a person has reviewed, or nothing where they have not begun. */
export function readReview(doc: Y.Doc, person: string): Review | null {
  const kept = reviews(doc).get(person);
  if (!(kept instanceof Y.Map)) return null;
  const moment = kept.get('moment');
  if (!(moment instanceof Uint8Array)) return null;
  const accepted = kept.get('accepted');
  const settled = kept.get('settled');
  return {
    moment,
    time: Number(kept.get('time')) || 0,
    accepted: accepted instanceof Y.Array ? accepted.toArray().filter(isAccepted) : [],
    settled: settled instanceof Y.Array ? settled.toArray().filter(isSettled) : [],
  };
}

/** Who have reviewed the project, each with the moment they review from. */
export function reviewers(doc: Y.Doc): { person: string; time: number; accepted: number }[] {
  const out: { person: string; time: number; accepted: number }[] = [];
  for (const [person, kept] of reviews(doc)) {
    if (!(kept instanceof Y.Map)) continue;
    const accepted = kept.get('accepted');
    out.push({
      person,
      time: Number(kept.get('time')) || 0,
      accepted: accepted instanceof Y.Array ? accepted.length : 0,
    });
  }
  return out;
}

/** What a person compares with: the moment they review from, and what they accepted since. */
export function referenceOf(review: Review): Reference {
  return { moment: review.moment, accepted: review.accepted };
}

/** Makes a review begin anew at a moment, with nothing accepted since. */
function begin(kept: Kept, moment: Moment) {
  kept.set('moment', moment.snapshot);
  kept.set('time', moment.time);
  kept.set('accepted', new Y.Array<Accepted>());
  kept.set('settled', new Y.Array<Settled>());
}

/**
 * Keeps what a person has accepted. A review that was not begun begins at
 * `from`, the moment the changes were compared with.
 */
export function accept(
  doc: Y.Doc,
  person: string,
  from: Moment,
  accepted: Accepted[],
  settled: Settled[] = [],
) {
  if (!accepted.length && !settled.length) return;
  doc.transact(() => {
    const all = reviews(doc);
    let kept = all.get(person);
    if (!(kept instanceof Y.Map) || !(kept.get('moment') instanceof Uint8Array)) {
      kept = new Y.Map<unknown>();
      all.set(person, kept);
      begin(kept, from);
    }
    const stretches = kept.get('accepted');
    const changes = kept.get('settled');
    if (stretches instanceof Y.Array) stretches.push(accepted);
    else kept.set('accepted', Y.Array.from(accepted));
    // A change settled anew replaces what was kept of it.
    if (changes instanceof Y.Array) {
      const keys = new Set(settled.map((s) => s.key));
      const list = changes.toArray() as unknown[];
      for (let i = list.length - 1; i >= 0; i--) {
        const s = list[i];
        if (isSettled(s) && keys.has(s.key)) changes.delete(i, 1);
      }
      changes.push(settled);
    } else kept.set('settled', Y.Array.from(settled));
  }, REVIEWING);
}

/**
 * Nothing is left that the person has not accepted: their review becomes the
 * moment the changes were worked out at, with nothing accepted since.
 */
export function settle(doc: Y.Doc, person: string, now: Moment) {
  doc.transact(() => {
    const all = reviews(doc);
    let kept = all.get(person);
    if (!(kept instanceof Y.Map)) {
      kept = new Y.Map<unknown>();
      all.set(person, kept);
    }
    begin(kept, now);
  }, REVIEWING);
}

/** Forgets what a person has reviewed: they review from the beginning of the history again. */
export function forget(doc: Y.Doc, person: string) {
  if (!reviews(doc).has(person)) return;
  doc.transact(() => reviews(doc).delete(person), REVIEWING);
}
