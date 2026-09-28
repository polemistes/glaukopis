/**
 * A search in a text that is written in: the text of a map, or the edit box
 * of an element (ADR 0017). What it searches is read from the project; what
 * it finds is marked where it is shown, and going to one shows it, opens
 * what it is folded away under and gives it an editor, and selects it there.
 *
 * It searches as the words are typed, after a short pause, and again a
 * while after the text has changed; each time it reads again only the
 * elements that were changed.
 */

import { NodeSelection, TextSelection } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import type { Project } from '$lib/project/model/project.svelte';
import { quietly, SHOW, type ShowIn } from '$lib/editor/ui.svelte';
import { editorOf, Marking, rangeOf, readEditor, type Shown } from './marking';
import { Matcher, NO_OPTIONS, type SearchOptions } from './matching';
import { pieceAt, type Labels, type Passage } from './passages';
import { offsetOf, positionOf, readLine } from './prosemirror';
import { replaceAll, type Replacing } from './replacing';
import {
  compareOrder,
  orderOf,
  search,
  Texts,
  type Match,
  type Part,
  type Place,
  type Scope,
} from './searching';

/** Where a text is searched, and how it is shown there. */
export interface Surface extends Shown {
  project: Project;
  /** The elements that are searched, in the order of the text. */
  elements(): string[];
  /** How what stands outside the text is shown here. */
  labels(): Labels;
  /**
   * Shows the name or the text of an element, so that what was found in it
   * can be selected: what it is folded away under is opened, and it is
   * given an editor, without the cursor. The editor, once it holds the text.
   */
  reveal(element: string, part: Part): Promise<EditorView | null>;
  /** Which element's name or text an editor holds, if it is one of this surface. */
  where(view: EditorView): { element: string; part: Part } | null;
  /** The element that is looked at, from which a search begins where no editor has the cursor. */
  looked?(): string | null;
  /** What scrolls, to bring what is shown into view. */
  scroller(): HTMLElement | null;
}

/** The words and the options, as they were last: a search that is opened again begins with them. */
export const remembered = $state<{ query: string; replacement: string; options: SearchOptions }>({
  query: '',
  replacement: '',
  options: { ...NO_OPTIONS },
});

/** How long the search waits after a word is typed, and after the text is changed. */
const TYPED = 160;
const CHANGED = 450;

export class TextSearch {
  readonly surface: Surface;
  readonly texts: Texts;
  readonly marking: Marking;

  query = $state('');
  replacement = $state('');
  /** Whether what is found is to be replaced. */
  replacing = $state(false);
  matches = $state.raw<Match[]>([]);
  /** The one that is shown, by its place among those found; none before one is shown. */
  index = $state(-1);
  /** Why the words cannot be searched for, as a regular expression that is not one. */
  error = $state<string | null>(null);
  /** The text the search is kept to, when it is kept to the selection. */
  scope = $state.raw<Scope | null>(null);
  /** The text last selected in an editor here, which the search can be kept to. */
  selected = $state.raw<Scope | null>(null);
  /** How many the last "Replace all" replaced, until the words, the options or the text change. */
  replaced = $state<number | null>(null);
  /** The state of the project the last "Replace all" left. */
  #replacedAt = -1;

  #matcher: Matcher | null = null;
  #timer: ReturnType<typeof setTimeout> | undefined;
  /** Where the search began: what was found at or after it is shown first. */
  #origin: number[] | null = null;
  /** What is to be shown first, where it is known: as what the search through everything found. */
  #target: { element: string; part: Part; passage: number; start: number } | null = null;
  /** What was searched last: the words and options, and the state of the project. */
  #searched = { key: '', revision: -1 };
  /** Rises with every showing, so that one that is overtaken stops. */
  #showing = 0;
  /** The editor the cursor was in when the search was opened, to go back to. */
  #from: EditorView | null = null;
  #elements = new Map<string, number>();
  #closed = false;

  constructor(surface: Surface) {
    this.surface = surface;
    this.texts = new Texts(surface.project);
    this.marking = new Marking(surface, () => this.texts);
    this.query = remembered.query;
    this.replacement = remembered.replacement;
  }

  get options(): SearchOptions {
    return remembered.options;
  }

  /** The options as they hold now: what stands outside the text is not searched while replacing. */
  get effective(): SearchOptions {
    const o = remembered.options;
    return { ...o, labels: o.labels && !this.replacing, selection: o.selection && !!this.scope };
  }

  get current(): Match | null {
    return this.matches[this.index] ?? null;
  }

  get project(): Project {
    return this.surface.project;
  }

  #labels(): Labels | null {
    return this.effective.labels ? this.surface.labels() : null;
  }

  // ---- opening ----

  /**
   * Opens the search, or turns to it: from an editor, where the cursor is,
   * with the words that are selected there if they are few.
   */
  open(replacing: boolean, from: EditorView | null) {
    this.#closed = false;
    this.replacing = replacing;
    this.#from = from;
    const where = from ? this.surface.where(from) : null;
    this.#origin = null;
    // A search is kept to the selection when that is asked for, each time anew.
    remembered.options.selection = false;
    this.scope = null;
    if (from && where) {
      const read = readEditor(from, where.part, this.#labels());
      const { from: a, to: b, empty } = from.state.selection;
      const start = offsetOf(read, a);
      if (start) this.#origin = this.#order(where.element, where.part, start.passage, start.offset);
      if (!empty) {
        const words = from.state.doc.textBetween(a, b, '\n', '￼');
        if (words.length <= 120 && !/[\n￼]/.test(words)) this.query = words;
        this.#select(from);
      }
    } else {
      const looked = this.surface.looked?.();
      if (looked) this.#origin = [this.#elementIndex(looked), 0, 0, 0, 0, 0];
    }
    this.#searched.key = '';
    this.later(0, true);
  }

  /** Begins the search at what was found at a place, or at what comes after it. */
  beginAt(element: string, part: Part, passage: number, start: number) {
    this.#target = { element, part, passage, start };
    this.#origin = this.#order(element, part, passage, start);
  }

  /** Where in the order of the text a place is. */
  #order(element: string, part: Part, passage: number, offset: number): number[] {
    return [this.#elementIndex(element), part === 'title' ? 0 : 1, passage, offset, 0, 0];
  }

  #elementIndex(element: string): number {
    if (!this.#elements.size) this.surface.elements().forEach((id, i) => this.#elements.set(id, i));
    return this.#elements.get(element) ?? -1;
  }

  /** Text was selected in an editor here: the search can be kept to it. */
  noticeSelection(view: EditorView) {
    if (this.#closed) return;
    this.#select(view);
  }

  #select(view: EditorView) {
    const where = this.surface.where(view);
    const { from, to, empty } = view.state.selection;
    if (!where || empty) return;
    const read = readEditor(view, where.part, null);
    const a = offsetOf(read, from, 'from');
    const b = offsetOf(read, to, 'to');
    if (!a || !b || read.passages[a.passage]?.within || read.passages[b.passage]?.within) return;
    this.selected = { element: where.element, part: where.part, from: a, to: b };
  }

  /** Keeps the search to the selected text, or no longer. */
  keepToSelection(keep: boolean) {
    remembered.options.selection = keep && !!this.selected;
    this.scope = remembered.options.selection ? this.selected : null;
    this.later(0, true);
  }

  // ---- searching ----

  /** Whether the search that waits is to show what it finds first. */
  #go = false;

  /** Searches again after a pause: after the words were typed, or the text was changed. */
  later(wait = TYPED, go = false) {
    this.#go ||= go;
    clearTimeout(this.#timer);
    this.#timer = setTimeout(() => {
      if (this.#closed) return;
      const going = this.#go;
      this.#go = false;
      this.now(going);
    }, wait);
  }

  /** The text has changed: what is found is found again a while later, and nothing is gone to. */
  changed() {
    if (this.#closed || !this.query) return;
    if (this.project.revision === this.#searched.revision) return;
    this.later(CHANGED, false);
  }

  /**
   * Searches now. With `go`, the first that is found at or after where the
   * search began is shown; otherwise the one that was shown stays, or what
   * stands where it stood.
   */
  now(go = false) {
    clearTimeout(this.#timer);
    const options = this.effective;
    remembered.query = this.query;
    remembered.replacement = this.replacement;
    const made = Matcher.make(this.query, options);
    this.error = made && 'error' in made ? made.error : null;
    this.#matcher = made && 'matcher' in made ? made.matcher : null;
    const key = `${this.query}\u0000${JSON.stringify(options)}`;
    if (key !== this.#searched.key || this.project.revision !== this.#replacedAt)
      this.replaced = null;
    const before = this.current;
    const elements = this.surface.elements();
    this.#elements = new Map(elements.map((id, i) => [id, i]));
    const labels = this.#labels();
    const matches = this.#matcher
      ? search(this.texts, elements, this.#matcher, {
          labels,
          scope: this.scope ? this.#scoped(this.scope, labels) : null,
        })
      : [];
    this.texts.keepOnly(elements);
    this.#searched = { key, revision: this.project.revision };
    this.matches = matches;
    if (go) {
      const target = this.#target;
      this.#target = null;
      const exact = target
        ? this.matches.findIndex(
            (m) =>
              m.element === target.element &&
              m.part === target.part &&
              m.passage === target.passage &&
              m.start === target.start,
          )
        : -1;
      this.index = exact >= 0 ? exact : this.#firstFrom(this.#origin);
      if (this.index >= 0) void this.show(this.index);
      else this.#mark();
    } else {
      const at = before ? orderOf(this.#elements, before) : null;
      this.index = at ? this.#firstFrom(at) : -1;
      this.#mark();
    }
  }

  /** The first match at or after a place; the first of all after the last. */
  #firstFrom(at: number[] | null): number {
    if (!this.matches.length) return -1;
    if (!at) return 0;
    const i = this.matches.findIndex((m) => compareOrder(orderOf(this.#elements, m), at) >= 0);
    return i < 0 ? 0 : i;
  }

  /**
   * The selection as places with what stands outside the text taken in:
   * it is kept as places without, which do not change when that is taken in.
   */
  #scoped(scope: Scope, labels: Labels | null): Scope {
    if (!labels) return scope;
    const plain = this.texts.of(scope.element, null);
    const shown = this.texts.of(scope.element, labels);
    if (!plain || !shown) return scope;
    const list = (read: typeof plain) => (scope.part === 'title' ? [read.title] : read.body);
    const move = (place: Place): Place => {
      const a = list(plain)[place.passage];
      const b = list(shown)[place.passage];
      return a && b ? { passage: place.passage, offset: translate(a, b, place.offset) } : place;
    };
    return { ...scope, from: move(scope.from), to: move(scope.to) };
  }

  // ---- going from one to the next ----

  next() {
    if (!this.#fresh()) return;
    if (!this.matches.length) return;
    const i =
      this.index < 0 ? this.#firstFrom(this.#origin) : (this.index + 1) % this.matches.length;
    void this.show(i);
  }

  previous() {
    if (!this.#fresh()) return;
    const n = this.matches.length;
    if (!n) return;
    const i =
      this.index < 0 ? (this.#firstFrom(this.#origin) - 1 + n) % n : (this.index - 1 + n) % n;
    void this.show(i);
  }

  /** Searches first, if what was searched is not what is asked now. Whether there is a search. */
  #fresh(): boolean {
    const key = `${this.query}\u0000${JSON.stringify(this.effective)}`;
    if (key !== this.#searched.key || this.project.revision !== this.#searched.revision)
      this.now(false);
    return !!this.#matcher;
  }

  /**
   * Shows one that was found: opens what it is in, gives it an editor, and
   * selects it there; with `focus`, the cursor goes there as well.
   */
  async show(i: number, focus = false): Promise<void> {
    const m = this.matches[i];
    if (!m) return;
    const turn = ++this.#showing;
    const before = this.current;
    this.index = i;
    if (before && before.within && (before.element !== m.element || before.passage !== m.passage))
      this.#leaveNote(before);
    const view = await this.surface.reveal(m.element, m.part);
    if (turn !== this.#showing || this.#closed || !view || view.isDestroyed) {
      this.#mark();
      return;
    }
    this.#selectIn(view, m, focus);
    this.#mark();
    this.#scrollTo(m);
  }

  #selectIn(view: EditorView, m: Match, focus: boolean) {
    const labels = this.#labels();
    const read = readEditor(view, m.part, labels);
    const { doc } = view.state;
    try {
      if (m.within) {
        const outer = read.passages[m.within.passage];
        const at = outer && read.refs[m.within.passage][pieceAt(outer, m.within.at)];
        if (!at || at.node.type.name !== 'footnote') return;
        quietly(view, () =>
          view.dispatch(view.state.tr.setSelection(NodeSelection.create(doc, at.pos))),
        );
        const note = readLine(at.node, 'note', labels);
        const detail: ShowIn = {
          from: positionOf(note, 0, m.start),
          to: positionOf(note, 0, m.end, true),
          focus,
        };
        this.#scrollTo(m);
        view.nodeDOM(at.pos)?.dispatchEvent(new CustomEvent(SHOW, { detail }));
        return;
      }
      const passage = read.passages[m.passage];
      const i = passage ? pieceAt(passage, m.start) : -1;
      const piece = passage?.pieces[i];
      if (
        passage?.kind === 'equation' ||
        (piece &&
          piece.kind !== 'text' &&
          piece.kind !== 'break' &&
          m.end <= piece.start + piece.length)
      ) {
        // Found in what is shown of a citation, a formula or words that point: that is selected.
        const pos = read.refs[m.passage][passage?.kind === 'equation' ? 0 : i].pos;
        quietly(view, () =>
          view.dispatch(view.state.tr.setSelection(NodeSelection.create(doc, pos))),
        );
      } else {
        const from = positionOf(read, m.passage, m.start);
        const to = positionOf(read, m.passage, m.end, true);
        quietly(view, () =>
          view.dispatch(view.state.tr.setSelection(TextSelection.create(doc, from, to))),
        );
      }
      if (focus) view.focus();
    } catch (error) {
      console.error('what was found could not be selected', error);
    }
  }

  /** Closes the note a match was shown in, when another is shown: the cursor goes after it. */
  #leaveNote(m: Match) {
    const view = editorOf(this.surface.holder(m.element, m.part));
    if (!view || !m.within) return;
    const read = readEditor(view, m.part, this.#labels());
    const outer = read.passages[m.within.passage];
    const at = outer && read.refs[m.within.passage][pieceAt(outer, m.within.at)];
    if (
      !at ||
      !(view.state.selection instanceof NodeSelection) ||
      view.state.selection.from !== at.pos
    )
      return;
    const after = Math.min(at.pos + at.node.nodeSize, view.state.doc.content.size);
    quietly(view, () =>
      view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, after))),
    );
  }

  /** Brings the one that is shown into the middle of the view, unless it is in view. */
  #scrollTo(m: Match) {
    const scroller = this.surface.scroller();
    const holder = this.surface.holder(m.element, m.part);
    if (!scroller || !holder) return;
    const mark = rangeOf(holder, m.element, m.part, this.texts, this.#labels(), m);
    const rect = mark?.getBoundingClientRect();
    if (!rect || (!rect.width && !rect.height)) return;
    const view = scroller.getBoundingClientRect();
    const margin = Math.min(80, view.height / 4);
    if (rect.top >= view.top + margin && rect.bottom <= view.bottom - margin) return;
    scroller.scrollTop += rect.top - (view.top + view.height / 2) + rect.height / 2;
  }

  #frame = 0;

  /** Marks what was found, in the next frame. */
  #mark() {
    if (this.#frame) return;
    this.#frame = requestAnimationFrame(() => {
      this.#frame = 0;
      if (this.#closed) return;
      this.marking.mark(this.matches, this.current, this.#labels(), this.scope);
    });
  }

  /** What is in view has changed: what was found is marked there. */
  scrolled() {
    if (!this.#closed && this.matches.length) this.#mark();
  }

  // ---- replacing ----

  #replacing(list: Match[]): Replacing[] {
    const matcher = this.#matcher;
    if (!matcher) return [];
    const out: Replacing[] = [];
    for (const m of list) {
      const read = this.texts.of(m.element, null);
      const passage = read && (m.part === 'title' ? read.title : read.body[m.passage]);
      if (!passage) continue;
      out.push({
        element: m.element,
        part: m.part,
        passage: m.passage,
        start: m.start,
        end: m.end,
        found: m.text,
        text: matcher.replacement(passage.text, m.hit, this.replacement),
      });
    }
    return out;
  }

  /** Replaces the one that is shown, and shows the next. */
  replace() {
    if (!this.replacing) return;
    this.#fresh();
    const m = this.current;
    if (!m) {
      this.next();
      return;
    }
    const [change] = this.#replacing([m]);
    if (!change) return;
    const done = replaceAll(this.project, [change]);
    if (done) this.#moveScope([change]);
    // On from where it was, past what was put in its place.
    this.#origin = orderOf(this.#elements, {
      ...m,
      start: m.start + (done ? change.text.length : 1),
      end: m.end,
      within: m.within,
    });
    this.now(false);
    this.index = -1;
    this.#mark();
    if (this.matches.length) void this.show(this.#firstFrom(this.#origin));
  }

  /** Replaces all that is found, in one step of undo. How many were replaced. */
  replaceAll(): number {
    if (!this.replacing) return 0;
    this.now(false);
    const changes = this.#replacing(this.matches);
    const done = replaceAll(this.project, changes);
    if (done) this.#moveScope(changes);
    this.#replacedAt = this.project.revision;
    this.now(false);
    this.replaced = done;
    return done;
  }

  /** What was put in the place of what was found moves the end of the selection the search is kept to. */
  #moveScope(changes: Replacing[]) {
    const scope = this.scope;
    if (!scope) return;
    const move = (place: Place): Place => {
      let offset = place.offset;
      for (const c of changes) {
        if (c.element !== scope.element || c.part !== scope.part || c.passage !== place.passage)
          continue;
        if (c.end <= place.offset) offset += c.text.length - (c.end - c.start);
      }
      return { passage: place.passage, offset };
    };
    this.scope = { ...scope, from: move(scope.from), to: move(scope.to) };
    this.selected = this.scope;
  }

  // ---- closing ----

  /**
   * Closes the search. The cursor goes to the one that was shown, selected,
   * or back where it was when the search was opened.
   */
  async close(focus = true) {
    this.#closed = true;
    clearTimeout(this.#timer);
    cancelAnimationFrame(this.#frame);
    this.#frame = 0;
    this.marking.clear();
    const m = this.current;
    if (!focus) return;
    if (m) {
      const view = await this.surface.reveal(m.element, m.part);
      if (view && !view.isDestroyed) this.#selectIn(view, m, true);
    } else if (this.#from && !this.#from.isDestroyed) {
      this.#from.focus();
    }
  }
}

/** A place of a passage read without what stands outside the text, in the same passage read with it. */
export function translate(plain: Passage, shown: Passage, offset: number): number {
  if (!plain.pieces.length || plain.pieces.length !== shown.pieces.length) return offset;
  const k = pieceAt(plain, offset);
  const a = plain.pieces[k];
  const b = shown.pieces[k];
  if (a.kind === 'text' || a.kind === 'break')
    return b.start + Math.min(offset - a.start, b.length);
  return offset <= a.start ? b.start : b.start + b.length;
}
