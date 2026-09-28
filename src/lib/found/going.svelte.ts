/**
 * Going through the citations that were found in a map: what there is, what
 * the library has for each, what the writer has chosen, and what is done.
 * The window (`FoundDialog.svelte`) shows it.
 *
 * What has the mark is read from the project whenever it is looked at, so
 * the project is what says what is left: nothing of it is kept here but
 * what the writer has chosen and not yet done.
 */

import {
  foundDraft,
  foundPropose,
  foundSuggest,
  type FoundBy,
  type FoundItem,
  type FoundOptions,
  type Passage,
  type Proposal,
  type Suggestion,
} from '$lib/api/found';
import type { Draft } from '$lib/api/library';
import type { CiteMode } from '$lib/editor/schema';
import type { Project } from '$lib/project/model/project.svelte';
import {
  intoCitation,
  leaveAsText,
  makeCitation,
  makeCitations,
  type How,
  type IntoCitation,
  type Making,
  type Target,
  type Trouble,
} from './change';
import { gather, inOrder, passageOf, placeOf, type Marked, type Place } from './gather';
import { certain, citeItem, wordsOf, zoteroKey, type Said } from './works';

/** What is asked of the library, and of the writer when a reference is added. */
export interface Commands {
  suggest: (items: FoundItem[]) => Promise<Suggestion[][]>;
  propose: (passages: Passage[], options: FoundOptions) => Promise<Proposal[]>;
  draft: (data: Record<string, unknown>) => Promise<Draft | null>;
}

export const COMMANDS: Commands = {
  suggest: foundSuggest,
  propose: foundPropose,
  draft: foundDraft,
};

/** One work of what is gone through. */
export interface Work extends Said {
  /** What tells it from the other works while the window is open. */
  key: string;
  /** What the text says of it. */
  item: FoundItem;
  /** The words that name it, by which it is looked for in the library. */
  words: string;
  /** The references of the library it may be, the likeliest first. */
  suggestions: Suggestion[];
  /** The reference it is taken for. */
  reference: string | null;
  /** Whether the writer chose the reference, and not the library. */
  chosen: boolean;
}

/** Something to go through: a citation that was found, or text that looks like one. */
export interface Entry {
  key: string;
  /** Whether it has the mark, or was only proposed. */
  marked: boolean;
  target: Target;
  element: string;
  by: FoundBy;
  mode: CiteMode;
  /** Whether it stands in a note, and is all the note holds. */
  note: boolean;
  whole: boolean;
  works: Work[];
  /** What the writer chose for it, where it stands in a note. */
  how: How | null;
  /** Why it could not be done, when it was last tried. */
  trouble: string | null;
  /** Its place in the order of the text. */
  order: number[];
}

/** What is kept of what the writer has said, between the times the window is open. */
export interface Kept {
  years: boolean;
  notes: boolean;
  inNotes: '' | 'citation' | 'within';
}

const TROUBLE: Record<Trouble, string> = {
  gone: 'It is no longer in the text.',
  changed: 'The text has changed here since it was proposed, and was looked at again.',
  cannot: 'A citation cannot be made of it here.',
};

let serial = 0;
const workKey = () => `w${++serial}`;

function workOf(item: FoundItem): Work {
  return {
    key: workKey(),
    item,
    words: wordsOf(item),
    locator: item.locator ?? '',
    label: item.label ?? 'page',
    prefix: item.prefix ?? '',
    suffix: item.suffix ?? '',
    suppressAuthor: item.suppressAuthor === true,
    suggestions: [],
    reference: null,
    chosen: false,
  };
}

const nothing = (text: string) => /^[\s.]*$/.test(text);

export class Going {
  readonly project: Project;
  readonly map: string;

  entries = $state<Entry[]>([]);
  /** The one that is looked at, by its key. */
  at = $state<string | null>(null);
  kept = $state<Kept>({ years: false, notes: false, inNotes: '' });
  /** Whether the library is being asked. */
  asking = $state(false);
  /** Whether it has been asked at all: until then, nothing is said of what there is. */
  asked = $state(false);
  failure = $state<string | null>(null);

  #commands: Commands;
  /** Called when a work has been cited, with the id of its reference: the project keeps a copy. */
  #keep: (reference: string) => void;
  /** Called when what the writer has said is to be kept. */
  #remember: (kept: Kept) => void;
  #places = new Map<string, Place>();
  #round = 0;
  #timer: ReturnType<typeof setTimeout> | undefined;
  /** The state of the project that was last looked at. */
  seen = -1;

  constructor(
    project: Project,
    map: string,
    options: {
      commands?: Commands;
      kept?: Partial<Kept>;
      keep?: (reference: string) => void;
      remember?: (kept: Kept) => void;
    } = {},
  ) {
    this.project = project;
    this.map = map;
    this.#commands = options.commands ?? COMMANDS;
    this.#keep = options.keep ?? (() => {});
    this.#remember = options.remember ?? (() => {});
    this.kept = { years: false, notes: false, inNotes: '', ...options.kept };
  }

  // ---- what there is ----

  get current(): Entry | null {
    return this.entries.find((e) => e.key === this.at) ?? this.entries[0] ?? null;
  }

  get index(): number {
    const current = this.current;
    return current ? this.entries.indexOf(current) : -1;
  }

  /** Whether text that only looks like a citation is looked for. */
  get proposing(): boolean {
    return this.kept.years || this.kept.notes;
  }

  /** Whether every work has a reference: only then can a citation be made. */
  ready(entry: Entry | null): boolean {
    return !!entry && entry.works.length > 0 && entry.works.every((w) => !!w.reference);
  }

  /** Whether every work is taken for the reference that the library has for it for certain. */
  sure(entry: Entry): boolean {
    return (
      entry.works.length > 0 &&
      entry.works.every((w) => !!w.reference && w.reference === certain(w.suggestions))
    );
  }

  /** Those of which citations can be made at once. */
  get certain(): Entry[] {
    return this.entries.filter((e) => this.sure(e));
  }

  /** How sure what is proposed for it is: as sure as the work that is least so. */
  sureness(entry: Entry): 'certain' | 'likely' | 'possible' | 'none' {
    if (!this.ready(entry)) return 'none';
    const order = ['possible', 'likely', 'certain'] as const;
    let least = 2;
    for (const w of entry.works) {
      // What the writer chose is as sure as the writer.
      const said = w.chosen
        ? 'certain'
        : (w.suggestions.find((s) => s.reference === w.reference)?.sure ?? 'possible');
      least = Math.min(least, order.indexOf(said));
    }
    return order[least];
  }

  /** The passage an entry stands in, as it was when last looked at. */
  place(entry: Entry): Place | null {
    return this.#places.get(entry.target.passage) ?? null;
  }

  /** Whether the note it stands in can become a citation, and why not. */
  can(entry: Entry): IntoCitation {
    const place = this.place(entry);
    if (!place) return { possible: false, why: TROUBLE.gone };
    const others = this.entries
      .filter((e) => e !== entry && e.marked && e.target.passage === entry.target.passage)
      .map((e) => ({ passage: e.target.passage, start: e.target.start, end: e.target.end }));
    return intoCitation(place, entry.target.start, entry.target.end, others);
  }

  /** What becomes of a citation in a note: as the writer said, for this one or for all; else as is given. */
  how(entry: Entry): How {
    if (!entry.note) return 'here';
    const wanted: How =
      entry.how ??
      (this.kept.inNotes === 'citation'
        ? 'note'
        : this.kept.inNotes === 'within'
          ? 'here'
          : entry.whole
            ? 'note'
            : 'here');
    return wanted === 'note' && this.can(entry).possible ? 'note' : 'here';
  }

  // ---- looking ----

  #entryOf(m: Marked, key: string): Entry {
    return {
      key,
      marked: true,
      target: { passage: m.passage, start: m.start, end: m.end, text: m.text, id: m.found.id },
      element: m.element,
      by: m.found.by,
      mode: m.found.mode === 'intext' ? 'intext' : 'normal',
      note: m.note,
      whole: m.whole,
      works: m.found.items.map(workOf),
      how: null,
      trouble: null,
      order: [],
    };
  }

  /** Where text that was proposed stands now, if it stands. */
  #still(target: Target): { start: number; end: number } | null {
    const place = this.#places.get(target.passage);
    if (!place || !target.text) return null;
    const free = (start: number) =>
      !place.taken.some(([a, b]) => a < start + target.text.length && start < b);
    if (place.text.slice(target.start, target.end) === target.text)
      return free(target.start) ? { start: target.start, end: target.end } : null;
    const first = place.text.indexOf(target.text);
    if (first < 0 || place.text.indexOf(target.text, first + 1) >= 0 || !free(first)) return null;
    return { start: first, end: first + target.text.length };
  }

  #settle(entry: Entry) {
    const place = this.#places.get(entry.target.passage);
    entry.order = placeOf(this.#places, entry.target.passage, entry.target.start);
    entry.element = place?.element ?? entry.element;
    entry.note = !!place?.note;
    if (!entry.marked && place)
      entry.whole =
        place.note &&
        nothing(place.text.slice(0, entry.target.start)) &&
        nothing(place.text.slice(entry.target.end));
  }

  /**
   * Reads from the project what there is to go through. What the writer has
   * chosen for something that is still there is kept.
   */
  look() {
    const { places, marked } = gather(this.project, this.map);
    this.seen = this.project.revision;
    this.#places = new Map(places.map((p) => [p.id, p]));
    const before = new Map(this.entries.map((e) => [e.key, e]));
    const was = this.index;
    const next: Entry[] = [];

    const met = new Map<string, number>();
    for (const m of marked) {
      const name = `m/${m.passage}/${m.found.id}`;
      const n = met.get(name) ?? 0;
      met.set(name, n + 1);
      const key = `${name}/${n}`;
      const old = before.get(key);
      if (old && old.target.text === m.text) {
        old.target.start = m.start;
        old.target.end = m.end;
        old.whole = m.whole;
        next.push(old);
      } else next.push(this.#entryOf(m, key));
    }
    for (const old of this.entries) {
      if (old.marked) continue;
      const still = this.proposing ? this.#still(old.target) : null;
      if (!still) continue;
      old.target.start = still.start;
      old.target.end = still.end;
      next.push(old);
    }
    for (const entry of next) this.#settle(entry);
    next.sort((a, b) => inOrder(a.order, b.order));
    this.entries = next;

    // The one that was looked at, or what stands where it stood.
    if (!next.some((e) => e.key === this.at))
      this.at = next[Math.min(Math.max(was, 0), next.length - 1)]?.key ?? null;
  }

  /**
   * Asks the library: for the works of what was found, and, where the
   * writer has said so, for what looks like a citation in the passages.
   */
  async ask(): Promise<void> {
    clearTimeout(this.#timer);
    const round = ++this.#round;
    this.asking = true;
    this.failure = null;
    try {
      const works = this.entries.filter((e) => e.marked).flatMap((e) => e.works);
      const items = works.map((w) => $state.snapshot(w.item) as FoundItem);
      const options: FoundOptions = { years: this.kept.years, notes: this.kept.notes };
      const passages = this.proposing ? [...this.#places.values()].map(passageOf) : [];
      const [answers, proposals] = await Promise.all([
        items.length ? this.#commands.suggest(items) : Promise.resolve([]),
        passages.length ? this.#commands.propose(passages, options) : Promise.resolve([]),
      ]);
      // Asked again meanwhile: what comes later is what holds.
      if (round !== this.#round) return;
      works.forEach((w, i) => this.#answer(w, answers[i] ?? []));
      this.#proposed(proposals ?? []);
      this.asked = true;
    } catch (error) {
      if (round !== this.#round) return;
      console.error(error);
      this.failure = 'The library could not be asked.';
      this.asked = true;
    } finally {
      if (round === this.#round) this.asking = false;
    }
  }

  #answer(work: Work, suggestions: Suggestion[]) {
    work.suggestions = suggestions;
    if (work.chosen && work.reference) return;
    work.reference = suggestions[0]?.reference ?? null;
    work.chosen = false;
  }

  /** Takes up what was proposed, in place of what was proposed before. */
  #proposed(proposals: Proposal[]) {
    const before = new Map(this.entries.filter((e) => !e.marked).map((e) => [e.key, e]));
    const next = this.entries.filter((e) => e.marked);
    const met = new Map<string, number>();
    for (const proposal of proposals) {
      const place = this.#places.get(proposal.passage);
      if (!place || proposal.end <= proposal.start || !proposal.items.length) continue;
      const text = place.text.slice(proposal.start, proposal.end);
      const name = `p/${proposal.passage}/${text}`;
      const n = met.get(name) ?? 0;
      met.set(name, n + 1);
      const key = `${name}/${n}`;
      const target: Target = {
        passage: proposal.passage,
        start: proposal.start,
        end: proposal.end,
        text,
      };
      // The text may have changed while the library was asked.
      if (!this.#still(target)) continue;
      const old = before.get(key);
      let entry: Entry;
      if (old && old.works.length === proposal.items.length) {
        old.target = target;
        old.works.forEach((w, i) => this.#answer(w, proposal.items[i].suggestions ?? []));
        entry = old;
      } else {
        entry = {
          key,
          marked: false,
          target,
          element: place.element,
          by: 'form',
          mode: proposal.mode === 'intext' ? 'intext' : 'normal',
          note: place.note,
          whole: false,
          works: proposal.items.map((item) => {
            const work = workOf({
              locator: item.locator,
              label: item.label,
              prefix: item.prefix,
              suffix: item.suffix,
              suppressAuthor: item.suppressAuthor,
            });
            work.words = item.words;
            this.#answer(work, item.suggestions ?? []);
            return work;
          }),
          how: null,
          trouble: null,
          order: [],
        };
      }
      this.#settle(entry);
      next.push(entry);
    }
    next.sort((a, b) => inOrder(a.order, b.order));
    const was = this.index;
    this.entries = next;
    if (!next.some((e) => e.key === this.at))
      this.at = next[Math.min(Math.max(was, 0), next.length - 1)]?.key ?? null;
  }

  /** Looks, and asks the library. `at` is the id of a citation that was found, to begin with. */
  async open(at?: string | null): Promise<void> {
    this.look();
    const wanted = at ? this.entries.find((e) => e.target.id === at) : null;
    if (wanted) this.at = wanted.key;
    await this.ask();
  }

  /**
   * The project has changed, by the writer elsewhere, by another, or by
   * undo: what there is is read anew, and the library asked in a moment.
   */
  changed(wait = 400) {
    if (this.project.revision === this.seen) return;
    const known = new Set(this.entries.map((e) => e.key));
    this.look();
    // What has come back, as by undo, is what is looked at.
    const back = this.entries.find((e) => !known.has(e.key));
    if (back) this.at = back.key;
    this.#later(wait);
  }

  #later(wait: number) {
    clearTimeout(this.#timer);
    this.#timer = setTimeout(() => void this.ask(), wait);
  }

  /** What is taken for citations. Changing it looks again. */
  async take(change: Partial<Pick<Kept, 'years' | 'notes'>>): Promise<void> {
    this.kept = { ...this.kept, ...change };
    this.#remember($state.snapshot(this.kept));
    this.look();
    await this.ask();
  }

  /** The window is closed: nothing more is asked. */
  close() {
    clearTimeout(this.#timer);
    this.#round++;
  }

  // ---- going from one to the next ----

  show(key: string) {
    if (this.entries.some((e) => e.key === key)) this.at = key;
  }

  /** On by so many, and round from the last to the first. */
  move(by: number) {
    const n = this.entries.length;
    if (!n) return;
    this.at = this.entries[(((this.index + by) % n) + n) % n].key;
  }

  /** On to the next; nothing is changed. */
  later() {
    this.move(1);
  }

  // ---- the works ----

  /** Takes a work for a reference, as the writer says. */
  choose(work: Work, reference: string) {
    work.reference = reference;
    work.chosen = true;
  }

  remove(entry: Entry, work: Work) {
    entry.works = entry.works.filter((w) => w.key !== work.key);
  }

  /** A work that the text did not name, added by the writer. */
  add(entry: Entry, reference: string) {
    const work = workOf({});
    work.reference = reference;
    work.chosen = true;
    entry.works = [...entry.works, work];
  }

  /**
   * What the file says of a work, as a reference that can be added to the
   * library; with the key of its item in Zotero, by which it is known for
   * certain from then on. Nothing, where the file says too little.
   */
  async draft(work: Work): Promise<Draft | null> {
    const data = work.item.data;
    if (!data) return null;
    const draft = await this.#commands.draft($state.snapshot(data) as Record<string, unknown>);
    if (!draft) return null;
    const keys = (work.item.uris ?? []).map(zoteroKey).filter((k): k is string => !!k);
    if (keys.length && !draft.fields['glaukopis-zotero'])
      draft.fields['glaukopis-zotero'] = [...new Set(keys)].join(' ');
    return draft;
  }

  /** The note of a citation in a note, for this one, or for all that follow. */
  choice(entry: Entry, how: How, forAll: boolean) {
    entry.how = how;
    const inNotes = forAll ? (how === 'note' ? 'citation' : 'within') : '';
    if (inNotes !== this.kept.inNotes) {
      this.kept = { ...this.kept, inNotes };
      this.#remember($state.snapshot(this.kept));
    }
    if (forAll) for (const e of this.entries) if (e !== entry) e.how = null;
  }

  // ---- what is done ----

  #making(entry: Entry): Making {
    return {
      target: $state.snapshot(entry.target),
      items: entry.works.map((w) => citeItem(w.reference ?? '', w)),
      mode: entry.mode,
      how: this.how(entry),
    };
  }

  /** What follows an entry in the list, to be looked at when the entry is done. */
  #after(entry: Entry): string | null {
    const i = this.entries.indexOf(entry);
    return (this.entries[i + 1] ?? this.entries[i - 1])?.key ?? null;
  }

  #done(entry: Entry, next: string | null) {
    this.entries = this.entries.filter((e) => e !== entry);
    this.look();
    if (next && this.entries.some((e) => e.key === next)) this.at = next;
    // What looks like a citation beside it stands elsewhere now.
    if (this.proposing) this.#later(400);
  }

  #failed(entry: Entry, why: Trouble) {
    entry.trouble = TROUBLE[why];
    const key = entry.key;
    this.look();
    const still = this.entries.find((e) => e.key === key);
    if (still) still.trouble = TROUBLE[why];
    if (this.proposing) this.#later(0);
  }

  /** Makes a citation of the one that is looked at. Returns whether it was made. */
  make(entry: Entry | null = this.current): boolean {
    if (!entry || !this.ready(entry)) return false;
    const making = this.#making(entry);
    const next = this.#after(entry);
    const outcome = makeCitation(
      this.project,
      making.target,
      making.items,
      making.mode,
      making.how,
    );
    if (!outcome.done) {
      this.#failed(entry, outcome.why);
      return false;
    }
    for (const item of making.items) this.#keep(item.id);
    if (!entry.marked && making.how === 'here') {
      // What was proposed after it in the passage stands earlier by what the citation is shorter.
      const by = 1 - (making.target.end - making.target.start);
      for (const e of this.entries) {
        if (e.marked || e === entry || e.target.passage !== making.target.passage) continue;
        if (e.target.start >= making.target.end) {
          e.target.start += by;
          e.target.end += by;
        }
      }
    }
    this.#done(entry, next);
    return true;
  }

  /** Leaves the one that is looked at as the text it is. */
  leave(entry: Entry | null = this.current): boolean {
    if (!entry) return false;
    const next = this.#after(entry);
    const outcome = leaveAsText(this.project, $state.snapshot(entry.target), entry.mode);
    if (!outcome.done) {
      this.#failed(entry, outcome.why);
      return false;
    }
    this.#done(entry, next);
    return true;
  }

  /**
   * Makes citations of all in which every work has a reference that is
   * certain, as one step. Returns how many were made.
   */
  makeCertain(): number {
    const list = this.certain;
    if (!list.length) return 0;
    const current = this.current;
    const makings = list.map((e) => this.#making(e));
    const outcomes = makeCitations(this.project, makings);
    const done = new Set<Entry>();
    outcomes.forEach((outcome, i) => {
      if (outcome.done) {
        done.add(list[i]);
        for (const item of makings[i].items) this.#keep(item.id);
      } else list[i].trouble = TROUBLE[outcome.why];
    });
    // The one that was looked at, or the first after it that is left.
    const from = current ? this.entries.indexOf(current) : 0;
    const next =
      this.entries.slice(from).find((e) => !done.has(e)) ??
      this.entries.find((e) => !done.has(e)) ??
      null;
    this.entries = this.entries.filter((e) => !done.has(e));
    this.look();
    if (next && this.entries.some((e) => e.key === next.key)) this.at = next.key;
    if (this.proposing) this.#later(400);
    return done.size;
  }
}
