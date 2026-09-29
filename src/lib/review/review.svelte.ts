/**
 * A review of the changes of a map (ADR 0022): what is compared with, the
 * changes worked out from what the history says, the one looked at, and what
 * is decided of each.
 *
 * The changes are worked out by the history in its worker, and grouped here;
 * again a while after the project has changed, never at every key. Accepting
 * a change that was written in since works the changes out first, so that it
 * is accepted as it stands.
 */

import * as Y from 'yjs';
import type { Accepted, History, Moment, Person, Reference, Version } from '$lib/history/types';
import type { Project } from '$lib/project/model/project.svelte';
import { acceptStretch, blockAt, itemsOfPieces, nodeAt } from './accepting';
import { changed, group, type Change, type Stretch, type Unit } from './grouping';
import { accept, readReview, referenceOf, settle, type Settled } from './kept';
import { colourOf } from '$lib/sharing/connection.svelte';
import { markChanges, NOBODY, type Marked } from './marks';
import type { Choice, Source } from './source';

/** How long after the project has changed the changes are worked out again. */
const CHANGED = 600;

/** What a change to an element or an object is now, to tell whether it changed again once accepted. */
export function stateOf(c: Change): string {
  if (c.change)
    return JSON.stringify([c.change.kind, c.change.after ?? null, c.change.before ?? null]);
  if (c.object) return JSON.stringify([c.object.status, c.object.after ?? null]);
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

export class Review {
  readonly project: Project;
  readonly source: Source;

  /** The map whose changes are gone through. */
  map = $state('');
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
  /** The versions of the change looked at, once asked for. */
  versions = $state.raw<{ key: string; list: Version[] | null } | null>(null);

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

  constructor(project: Project, source: Source, map: string) {
    this.project = project;
    this.source = source;
    this.map = map;
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

  /** Turns to another map. */
  turnTo(map: string) {
    if (map === this.map) return;
    this.map = map;
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
    const first = (await this.source.choices())[0];
    if (!first) return null;
    return {
      reference: { moment: first.moment.snapshot, accepted: [] },
      settled: [],
      since: first.moment,
    };
  }

  /** The changes of a map, grouped, without those settled already. */
  async #changesOf(
    history: History,
    map: string,
    reference: Reference,
    settled: Settled[],
    options: { own: boolean; unit: Unit },
  ): Promise<Change[]> {
    const compared = await history.compare(map, reference);
    const done = new Set(settled.map((s) => `${s.key}\u0000${s.state}`));
    return group(compared, {
      unit: options.unit,
      language: this.project.map(map)?.document.language ?? null,
      me: this.me,
      own: options.own,
      sequence: this.project.tree(map).sequence,
    }).filter((c) => !settles(c) || !done.has(`${c.key}\u0000${stateOf(c)}`));
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
      const [changes, people] = await Promise.all([
        this.#changesOf(history, this.map, found.reference, found.settled, {
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
      if (this.project.revision !== revision) this.later();
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
            s.passage.place.element === place.element &&
            s.passage.place.part === place.part &&
            s.passage.place.path.join('.') === place.path.join('.') &&
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
    if (!this.fresh) await this.refresh();
    return (
      this.changes.find((c) => c.key === change.key) ??
      this.changes.find((c) => c.key === this.looked) ??
      null
    );
  }

  /** What is accepted of a stretch, found in the text as it stands. */
  #accepted(stretch: Stretch, visible?: Accepted['visible']): Accepted {
    const { place } = stretch.passage;
    const block = stretch.passage.after
      ? blockAt(this.project.fragment(place.element, place.part), place)
      : null;
    const accepted = acceptStretch(block, place, stretch.now.from, stretch.now.to, stretch.pieces);
    return visible ? { ...accepted, visible } : accepted;
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
      standing.stretches.map((s) => this.#accepted(s)),
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
  async reject(change: Change | null = this.current) {
    if (!change || !this.canReject(change)) return;
    const history = this.history!;
    const project = this.project;
    project.checkpoint();
    if (change.change) this.#rejectElement(change);
    else if (change.object?.status === 'added' || change.object?.status === 'changed')
      this.#rejectObject(change);
    // The text of an element or an object taken away goes with it.
    for (const s of change.object || change.change ? [] : change.stretches) {
      const pieces = s.pieces.filter(changed);
      if (pieces.length) await history.revert(s.passage, pieces);
    }
    project.checkpoint();
    this.#drop(change);
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
        const tree = project.tree(node.map);
        const list = was.parent ? (tree.children.get(was.parent) ?? []) : tree.loose;
        const at = was.after ? list.indexOf(was.after) + 1 : 0;
        project.move([e.element], was.parent, Math.max(0, at), was.parent ? { pos: null } : {});
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
    const found = await this.#reference();
    const stretch = this.#accepted(change.stretches[0]);
    try {
      const list = found
        ? await history.versions(stretch.place, stretch.from, stretch.to, found.reference)
        : [];
      if (this.versions?.key === key) this.versions = { key, list };
    } catch (error) {
      console.error('the versions could not be read', error);
      if (this.versions?.key === key) this.versions = { key, list: [] };
    }
  }

  /** Accepts the versions of a change up to one, and leaves those after it to be reviewed. */
  async acceptUpTo(change: Change, version: Version) {
    const stretch = change.stretches[0];
    if (!stretch) return;
    const seen = itemsOfPieces(version.pieces.filter((p) => p.status !== 'removed'));
    this.#keep(change, [this.#accepted(stretch, seen)]);
    this.later(0);
  }

  /** Makes the text of a change what it was in a version again, and accepts it as it then stands. */
  async useVersion(change: Change, version: Version) {
    const history = this.history;
    const stretch = change.stretches[0];
    if (!history || !stretch) return;
    const accepted = this.#accepted(stretch);
    this.project.checkpoint();
    await history.restore(accepted.place, accepted.from, accepted.to, version.moment.snapshot);
    this.project.checkpoint();
    await this.refresh();
    const place = stretch.passage.place;
    const now = this.changes.find((c) =>
      c.stretches.some(
        (s) =>
          s.passage.place.element === place.element &&
          s.passage.place.part === place.part &&
          s.passage.place.path.join('.') === place.path.join('.'),
      ),
    );
    if (now) await this.accept(now);
  }

  // ---- when nothing is left ----

  /**
   * Nothing is left in this map: where nothing is left in the other maps
   * either, the review becomes the moment the changes were worked out at.
   */
  async #settleIfDone() {
    const history = this.history;
    const me = this.me;
    const now = this.#now;
    if (!history || !me || !now || this.chosen) return;
    const kept = readReview(this.project.doc, me);
    if (!kept) return;
    const reference = referenceOf(kept);
    for (const map of this.project.maps) {
      if (map.id === this.map) continue;
      const left = await this.#changesOf(history, map.id, reference, kept.settled, {
        own: false,
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
    clearTimeout(this.#timer);
    this.#round++;
  }
}
