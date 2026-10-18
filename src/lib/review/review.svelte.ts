/**
 * A review of the changes within the element in view (ADR 0022): what is
 * compared with, the changes worked out from what the history says, the one
 * looked at, and what is decided of each.
 *
 * The changes are worked out by the history in its worker, and grouped here;
 * again a while after the project has changed, never at every key. Deciding
 * on a change that was written in since (accepting it, taking it back,
 * accepting it up to a version or making it a version again) works the
 * changes out first, so that the decision is about the text as it stands.
 */

import * as Y from 'yjs';
import type {
  Accepted,
  History,
  Moment,
  Person,
  Place,
  Reference,
  Version,
} from '$lib/history/types';
import type { Project } from '$lib/project/model/project.svelte';
import { PROJECT } from '$lib/project/model/types';
import { acceptBetween, acceptStretch, blockAt, edgesOf, itemsOfPieces, nodeAt } from './accepting';
import { changed, group, type Change, type Stretch, type Unit } from './grouping';
import {
  accept,
  forgetAccepted,
  forgetIdle,
  readReview,
  referenceOf,
  settle,
  type Settled,
} from './kept';
import { colourOf } from '$lib/sharing/connection.svelte';
import { markChanges, NOBODY, type Marked } from './marks';
import type { Choice, Source } from './source';

/** How long after the project has changed the changes are worked out again. */
const CHANGED = 600;

/**
 * A value written as JSON with the keys of every object in order, so that
 * the same value reads the same however its object was put together.
 */
function canonical(value: unknown): string {
  return JSON.stringify(value, (_key, v: unknown) =>
    v && typeof v === 'object' && !Array.isArray(v) && !ArrayBuffer.isView(v)
      ? Object.fromEntries(
          Object.entries(v as Record<string, unknown>).sort(([a], [b]) =>
            a < b ? -1 : a > b ? 1 : 0,
          ),
        )
      : v,
  );
}

/**
 * What a change to an element or an object is now, to tell whether it
 * changed again once accepted. The same on every computer: the order of
 * the keys of its records is not that in which a copy received them.
 */
export function stateOf(c: Change): string {
  if (c.change) return canonical([c.change.kind, c.change.after ?? null, c.change.before ?? null]);
  if (c.object) return canonical([c.object.status, c.object.after ?? null]);
  return '';
}

/** The colour of a person: the one they have wherever they are shown. */
export function colour(by: string | null): string {
  return by ? colourOf(by) : NOBODY;
}

/** Whether a change is settled on this side: to an element, or to an object as a whole. */
function settles(c: Change): boolean {
  return !!(c.change || c.object);
}

/** Whether two places name the same block of text. */
function samePlace(a: Place, b: Place): boolean {
  return a.element === b.element && a.part === b.part && a.path.join('.') === b.path.join('.');
}

export class Review {
  readonly project: Project;
  readonly source: Source;

  /** The element in view: the changes in it and in all under it are gone through. */
  at = $state('');
  unit = $state<Unit>('sentence');
  /** Whether one's own changes are shown as well. */
  own = $state(false);
  /** A moment chosen to review from; nothing, for since the person last reviewed. */
  chosen = $state.raw<Choice | null>(null);
  /** The moment the changes are from. */
  since = $state.raw<Moment | null>(null);
  changes = $state.raw<Change[]>([]);
  /** The key of the change that is looked at. */
  looked = $state<string | null>(null);
  /** Rises whenever the change looked at is to be brought into view. */
  shown = $state(0);
  /** Whether the changes have been worked out once. */
  ready = $state(false);
  working = $state(false);
  failure = $state<string | null>(null);
  people = $state.raw<ReadonlyMap<string, Person>>(new Map());
  /**
   * The versions of the change looked at, once asked for; `failed`, where the
   * history could not tell them, says why (and `list` is then empty): that is
   * not the same as a change without versions.
   */
  versions = $state.raw<{ key: string; list: Version[] | null; failed?: string } | null>(null);

  /** The marks the text shows of the changes, by element. */
  #lastMarked: Marked | null = null;
  readonly marked: Marked = $derived.by(() => {
    const made = markChanges(this.changes, this.looked, colour, this.#lastMarked);
    this.#lastMarked = made;
    return made;
  });

  #timer: ReturnType<typeof setTimeout> | undefined;
  #round = 0;
  /** The state of the project the changes are of. */
  #revision = -1;
  /** The moment the changes were worked out at: taken before they were. */
  #now: Moment | null = null;
  /** What was accepted since the review began, where a moment was chosen. */
  #session: Accepted[] = [];
  #sessionSettled: Settled[] = [];
  #closed = false;
  #working: Promise<void> | null = null;
  /** Whether something was decided since it was last seen whether anything is left. */
  #decided = false;
  #unheard: () => void;

  constructor(project: Project, source: Source, at: string) {
    this.project = project;
    this.source = source;
    this.at = at;
    // What is written, by the writer, by others, by undo, is worked out again a while later.
    this.#unheard = project.onChange(() => this.noticeChange());
  }

  get history(): History | null {
    return this.source.history;
  }

  get me(): string | null {
    return this.source.me;
  }

  get current(): Change | null {
    return this.changes.find((c) => c.key === this.looked) ?? null;
  }

  get index(): number {
    return this.changes.findIndex((c) => c.key === this.looked);
  }

  // ---- working out ----

  /** Turns to another element in view. */
  turnTo(at: string) {
    if (at === this.at) return;
    this.at = at;
    this.changes = [];
    this.looked = null;
    this.ready = false;
    this.versions = null;
    this.later(0);
  }

  /** Reviews from a moment chosen, or with nothing, from where the person last reviewed. */
  choose(choice: Choice | null) {
    this.chosen = choice;
    this.#session = [];
    this.#sessionSettled = [];
    this.later(0);
  }

  setUnit(unit: Unit) {
    this.unit = unit;
    this.later(0);
  }

  setOwn(own: boolean) {
    this.own = own;
    this.later(0);
  }

  /** Works the changes out again, after a while. */
  later(wait = CHANGED) {
    if (this.#closed) return;
    clearTimeout(this.#timer);
    this.#timer = setTimeout(() => void this.refresh(), wait);
  }

  /** The project has changed: the changes are worked out again a while later. */
  noticeChange() {
    if (this.project.revision !== this.#revision) this.later();
  }

  /** Whether the changes are of the project as it is. */
  get fresh(): boolean {
    return this.project.revision === this.#revision;
  }

  /**
   * Works the changes out, and again while the project keeps changing under
   * them: a reading that a newer one overtook leaves its work to that one,
   * so once is not always enough.
   */
  async upToDate(): Promise<void> {
    for (let i = 0; i < 4; i++) {
      await this.refresh();
      if (this.#closed || this.fresh) return;
    }
  }

  /** Works the changes out now. */
  refresh(): Promise<void> {
    clearTimeout(this.#timer);
    const round = ++this.#round;
    const working = this.#work(round).finally(() => {
      if (this.#working === working) this.#working = null;
    });
    this.#working = working;
    return working;
  }

  /** The stretches and changes that count as accepted, and what is compared with. */
  async #reference(): Promise<{ reference: Reference; settled: Settled[]; since: Moment } | null> {
    if (this.chosen)
      return {
        reference: { moment: this.chosen.moment.snapshot, accepted: this.#session },
        settled: this.#sessionSettled,
        since: this.chosen.moment,
      };
    const kept = this.me ? readReview(this.project.doc, this.me) : null;
    if (kept)
      return {
        reference: referenceOf(kept),
        settled: kept.settled,
        since: { snapshot: kept.moment, time: kept.time },
      };
    // A first review goes from the beginning of the history.
    const first = await this.history?.begins();
    if (!first) return null;
    return { reference: { moment: first.snapshot, accepted: [] }, settled: [], since: first };
  }

  /**
   * The changes within an element, grouped, without those settled already;
   * and the stretches of the reference that accept nothing any more.
   */
  async #changesOf(
    history: History,
    at: string,
    reference: Reference,
    settled: Settled[],
    options: { own: boolean; unit: Unit },
  ): Promise<{ changes: Change[]; idle: Accepted[] }> {
    const compared = await history.compare(at, reference);
    const done = new Set(settled.map((s) => `${s.key}\u0000${s.state}`));
    const idle = (compared.idle ?? [])
      .map((i) => reference.accepted[i])
      .filter((a): a is Accepted => !!a);
    const changes = group(compared, {
      unit: options.unit,
      // The language of the text, as the element says it or inherits it.
      language: this.project.documentOf(at).settings.language ?? null,
      me: this.me,
      own: options.own,
      sequence: this.project.tree(at).sequence,
    }).filter((c) => !settles(c) || !done.has(`${c.key}\u0000${stateOf(c)}`));
    return { changes, idle };
  }

  /**
   * Forgets what accepts nothing any more, in what it was read from: the
   * review from a chosen moment, or what this person keeps in the project.
   * It would only be read again at every working-out, and synced and saved.
   */
  #forgetIdle(reference: Reference, idle: Accepted[]) {
    if (!idle.length) return;
    if (reference.accepted === this.#session) {
      const forgotten = new Set(idle);
      this.#session = this.#session.filter((a) => !forgotten.has(a));
    } else if (this.me) forgetIdle(this.project.doc, this.me, idle);
  }

  async #work(round: number) {
    const history = this.history;
    if (!history || this.#closed) return;
    this.working = true;
    try {
      const revision = this.project.revision;
      const now = await history.now();
      const found = await this.#reference();
      if (round !== this.#round) return;
      if (!found) {
        this.since = null;
        this.changes = [];
        this.ready = true;
        this.#revision = revision;
        this.#now = now;
        return;
      }
      const [{ changes, idle }, people] = await Promise.all([
        this.#changesOf(history, this.at, found.reference, found.settled, {
          own: this.own,
          unit: this.unit,
        }),
        history.people(),
      ]);
      if (round !== this.#round || this.#closed) return;
      this.people = new Map(people.map((p) => [p.id, p]));
      this.since = found.since;
      this.#revision = revision;
      this.#now = now;
      // What is kept of the review changes no text: the changes are still those of the text.
      if (idle.length) {
        const fresh = this.project.revision === revision;
        this.#forgetIdle(found.reference, idle);
        if (fresh) this.#revision = this.project.revision;
      }
      this.#keepLooked(changes);
      this.changes = changes;
      this.failure = null;
      this.ready = true;
      // Nothing left here, after something was decided: perhaps nothing anywhere.
      if (!changes.length && this.#decided) {
        this.#decided = false;
        void this.#settleIfDone();
      }
      // What was written while they were worked out is worked out next.
      if (this.project.revision !== this.#revision) this.later();
    } catch (error) {
      if (round !== this.#round) return;
      this.failure = error instanceof Error ? error.message : String(error);
      console.error('the changes could not be worked out', error);
    } finally {
      if (round === this.#round) this.working = false;
    }
  }

  /** Keeps the change looked at, or what stands where it stood. */
  #keepLooked(next: Change[]) {
    if (this.looked && next.some((c) => c.key === this.looked)) return;
    const before = this.index;
    const was = this.current;
    // The one that is now where it was: in the same passage, or the next after it.
    let at = -1;
    if (was?.stretches.length) {
      const place = was.stretches[was.stretches.length - 1].passage.place;
      at = next.findIndex((c) =>
        c.stretches.some(
          (s) =>
            samePlace(s.passage.place, place) &&
            s.now.to >= was.stretches[was.stretches.length - 1].now.from,
        ),
      );
    }
    if (at < 0) at = Math.min(Math.max(before, 0), next.length - 1);
    this.looked = next[at]?.key ?? null;
    this.versions = null;
  }

  // ---- going through ----

  /** Looks at a change, and brings it into view. */
  look(key: string | null, show = true) {
    if (key !== this.looked) this.versions = null;
    this.looked = key;
    if (show) this.shown++;
  }

  next() {
    if (!this.changes.length) return;
    const i = this.index;
    this.look(this.changes[(i + 1) % this.changes.length].key);
  }

  previous() {
    if (!this.changes.length) return;
    const i = this.index < 0 ? 0 : this.index;
    this.look(this.changes[(i - 1 + this.changes.length) % this.changes.length].key);
  }

  // ---- deciding ----

  /** The change as it stands now: worked out anew where the project changed since. */
  async #asItStands(change: Change): Promise<Change | null> {
    if (this.fresh) return change;
    await (this.#working ?? Promise.resolve());
    if (!this.fresh) await this.upToDate();
    return (
      this.changes.find((c) => c.key === change.key) ??
      this.changes.find((c) => c.key === this.looked) ??
      null
    );
  }

  /**
   * What is accepted of a stretch, found in the text as it stands; nothing
   * for a passage that is gone and held nothing, where there is nothing to accept.
   */
  #accepted(stretch: Stretch, visible?: Accepted['visible']): Accepted | null {
    const { place } = stretch.passage;
    const block = stretch.passage.after
      ? blockAt(this.project.fragment(place.element, place.part), place)
      : null;
    const accepted = acceptStretch(block, place, stretch.now.from, stretch.now.to, stretch.pieces);
    return accepted && visible ? { ...accepted, visible } : accepted;
  }

  /** Keeps what was accepted, and takes it from the list. */
  #keep(change: Change, accepted: Accepted[]) {
    const me = this.me;
    const from = this.since ?? this.#now;
    const settled = settles(change) ? [{ key: change.key, state: stateOf(change) }] : [];
    // What is kept of the review changes no text: the changes are still those of the text.
    const fresh = this.fresh;
    if (me && from) accept(this.project.doc, me, from, accepted, settled);
    if (fresh) this.#revision = this.project.revision;
    if (this.chosen) {
      this.#session = [...this.#session, ...accepted];
      this.#sessionSettled = [...this.#sessionSettled, ...settled];
    }
    this.#drop(change);
  }

  /** Takes a change from the list, and looks at the one after it. */
  #drop(change: Change) {
    this.#decided = true;
    const i = this.changes.indexOf(change);
    const rest = this.changes.filter((c) => c !== change);
    this.changes = rest;
    this.versions = null;
    if (this.looked === change.key) {
      this.looked = rest[Math.min(Math.max(i, 0), rest.length - 1)]?.key ?? null;
      this.shown++;
    }
  }

  /** Accepts a change as it stands: it is not shown again unless it changes again. */
  async accept(change: Change | null = this.current) {
    if (!change) return;
    const standing = await this.#asItStands(change);
    if (!standing) return;
    this.#keep(
      standing,
      standing.stretches.map((s) => this.#accepted(s)).filter((a) => a !== null),
    );
    if (!this.changes.length) {
      this.#decided = false;
      await this.#settleIfDone();
    }
    this.later();
  }

  /** Whether a change can be taken back from here. */
  canReject(change: Change | null): boolean {
    if (!change || !this.history) return false;
    // An element deleted, or a figure, is brought back from the history, not from here.
    if (change.change)
      return ['added', 'moved', 'heading', 'excluded', 'included'].includes(change.change.kind);
    if (change.object) return change.object.status !== 'removed';
    return true;
  }

  /** Takes a change back: the text goes back to what it was, by a change of the reviewer's. */
  async reject(given: Change | null = this.current) {
    if (!given || !this.canReject(given)) return;
    // The offsets and paths of the change are those of the text as it stood
    // when the changes were worked out: they are worked out again first.
    const change = await this.#asItStands(given);
    if (!change || !this.canReject(change) || !this.history) return;
    const history = this.history;
    const project = this.project;
    const text = !change.change && !change.object;
    // Where each stretch begins and ends, by the signs on either side of it,
    // taken before the text is put back: those signs are not touched by the
    // putting back, however much of what lies between them is.
    const bounds = text
      ? change.stretches.map((s) => ({
          place: s.passage.place,
          edges: s.passage.after
            ? edgesOf(
                blockAt(
                  project.fragment(s.passage.place.element, s.passage.place.part),
                  s.passage.place,
                ),
                s.now.from,
                s.now.to,
              )
            : null,
        }))
      : [];
    project.checkpoint();
    if (change.change) this.#rejectElement(change);
    else if (change.object?.status === 'added' || change.object?.status === 'changed')
      this.#rejectObject(change);
    // The text of an element or an object taken away goes with it.
    for (const s of text ? change.stretches : []) {
      const pieces = s.pieces.filter(changed);
      if (pieces.length) await history.revert(s.passage, pieces);
    }
    project.checkpoint();
    // Taking a change back is a change of the reviewer's own, which stands in
    // the history beside the one it undoes. What now stands there is accepted
    // at once, so that the reviewer is not asked about their own undoing.
    const accepted: Accepted[] = [];
    for (const b of bounds) {
      const block = blockAt(project.fragment(b.place.element, b.place.part), b.place);
      if (!block) continue;
      // A passage that was gone and is back is accepted whole.
      const whole = b.edges
        ? acceptBetween(block, b.place, b.edges)
        : acceptStretch(block, b.place, 0, Number.MAX_SAFE_INTEGER, []);
      if (whole) accepted.push(whole);
    }
    this.#keep(change, accepted);
    this.later(0);
  }

  #rejectElement(change: Change) {
    const project = this.project;
    const e = change.change!;
    const node = project.node(e.element);
    if (!node) return;
    switch (e.kind) {
      case 'added':
        project.remove([e.element], { keepChildren: true });
        break;
      case 'moved': {
        const was = e.before;
        if (!was) break;
        // Under what it stood: every element stands under one, the project itself at the top.
        const parent = was.parent ?? PROJECT;
        const list = project.tree().children.get(parent) ?? [];
        const index = was.after ? list.indexOf(was.after) + 1 : 0;
        project.move([e.element], parent, Math.max(0, index), { pos: null });
        break;
      }
      case 'heading':
        project.setHeading(e.element, !node.heading);
        break;
      case 'excluded':
        project.setExcluded(e.element, false);
        break;
      case 'included':
        project.setExcluded(e.element, true);
        break;
    }
  }

  #rejectObject(change: Change) {
    const o = change.object!;
    const fragment = this.project.fragment(o.place.element, o.place.part);
    const node = nodeAt(fragment, o.place);
    if (!node) return;
    this.project.transact(() => {
      if (o.status === 'added') {
        const parent = node.parent as Y.XmlElement | Y.XmlFragment | null;
        if (!parent) return;
        const index = parent.toArray().indexOf(node);
        if (index >= 0) parent.delete(index, 1);
      } else if (o.before) {
        for (const [name, value] of Object.entries(o.before))
          node.setAttribute(name, value as string);
        for (const name of Object.keys(o.after ?? {}))
          if (!(name in o.before)) node.removeAttribute(name);
      }
    });
  }

  // ---- the history of a change ----

  /** Whether a change has a history of versions to look at: text in one place. */
  hasVersions(change: Change | null): boolean {
    return (
      !!change &&
      !!this.history &&
      change.stretches.length === 1 &&
      !change.change &&
      !change.object
    );
  }

  /** Asks the history for the versions of the change looked at. */
  async loadVersions(change: Change | null = this.current) {
    if (!change || !this.hasVersions(change)) return;
    const history = this.history!;
    const key = change.key;
    this.versions = { key, list: null };
    try {
      const found = await this.#reference();
      const stretch = this.#accepted(change.stretches[0]);
      // A passage gone that held nothing has no versions to tell.
      const list =
        found && stretch
          ? await history.versions(stretch.place, stretch.from, stretch.to, found.reference)
          : [];
      if (this.versions?.key === key) this.versions = { key, list };
    } catch (error) {
      console.error('the versions could not be read', error);
      if (this.versions?.key === key)
        this.versions = {
          key,
          list: [],
          failed: error instanceof Error ? error.message : String(error),
        };
    }
  }

  /** Accepts the versions of a change up to one, and leaves those after it to be reviewed. */
  async acceptUpTo(given: Change, version: Version) {
    // The stretch is accepted where it stands now, not where it stood when worked out.
    const change = await this.#asItStands(given);
    const stretch = change?.stretches[0];
    if (!change || !stretch) return;
    const seen = itemsOfPieces(version.pieces.filter((p) => p.status !== 'removed'));
    const accepted = this.#accepted(stretch, seen);
    this.#keep(change, accepted ? [accepted] : []);
    this.later(0);
  }

  /** Makes the text of a change what it was in a version again, and accepts it as it then stands. */
  async useVersion(given: Change, version: Version) {
    // The stretch is made again where it stands now, not where it stood when worked out.
    const change = await this.#asItStands(given);
    const history = this.history;
    const stretch = change?.stretches[0];
    if (!history || !stretch) return;
    const accepted = this.#accepted(stretch);
    // A passage that is gone and held nothing has no place to be made again in.
    if (!accepted) return;
    this.project.checkpoint();
    await history.restore(accepted.place, accepted.from, accepted.to, version.moment.snapshot);
    this.project.checkpoint();
    await this.upToDate();
    const place = stretch.passage.place;
    const now = this.changes.find((c) =>
      c.stretches.some((s) => samePlace(s.passage.place, place)),
    );
    if (now) await this.accept(now);
  }

  /**
   * Forgets what was accepted since the moment reviewed from, by this
   * person or in the review from a chosen moment: the changes since are
   * shown again. Mends a review that what was kept of it has led astray.
   */
  forgetAccepted() {
    if (this.chosen) {
      this.#session = [];
      this.#sessionSettled = [];
    } else if (this.me) forgetAccepted(this.project.doc, this.me);
    this.#decided = false;
    this.later(0);
  }

  // ---- when nothing is left ----

  /**
   * Nothing is left within the element in view: where nothing is left in
   * the rest of the project either, the review becomes the moment the
   * changes were worked out at.
   */
  async #settleIfDone() {
    const history = this.history;
    const me = this.me;
    const now = this.#now;
    if (!history || !me || !now || this.chosen) return;
    const kept = readReview(this.project.doc, me);
    if (!kept) return;
    const reference = referenceOf(kept);
    if (this.at !== PROJECT) {
      // What is left is what this review shows: with one's own changes
      // shown, those elsewhere are left to review as well.
      const { changes: left } = await this.#changesOf(history, PROJECT, reference, kept.settled, {
        own: this.own,
        unit: 'paragraph',
      });
      if (left.length) return;
    }
    const fresh = this.fresh;
    settle(this.project.doc, me, now);
    if (fresh) this.#revision = this.project.revision;
  }

  close() {
    this.#closed = true;
    this.#unheard();
    clearTimeout(this.#timer);
    this.#round++;
  }
}
