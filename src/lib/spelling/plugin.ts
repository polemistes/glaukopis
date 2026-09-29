/**
 * Spelling in an editor: words that the dictionary of the text's language
 * does not have are underlined where they stand (ADR 0019).
 *
 * Only what has changed is looked at again after a change: the textblocks
 * that the change touched, when the writing has rested a moment. The first
 * look at a text, and a look at the whole of it when the language or the
 * writer's words have changed, goes in pieces when there is time. The words
 * are asked about through `spelling`, which keeps what is known for all
 * editors; what waits for an answer is looked at again when the answer
 * comes. The word being written, at the cursor, is left alone until it is
 * left.
 *
 * What is to be looked at is kept by the view of the plugin, and not in the
 * state of the editor: a look that finds what was underlined before changes
 * nothing, and is not a transaction.
 */

import type { Node, ResolvedPos } from 'prosemirror-model';
import { Plugin, PluginKey, type EditorState, type Transaction } from 'prosemirror-state';
import { Mapping, StepMap, type Mappable } from 'prosemirror-transform';
import { Decoration, DecorationSet, type EditorView } from 'prosemirror-view';
import { ySyncPluginKey } from 'y-prosemirror';
import { isIgnored, spelling } from './spelling.svelte';
import { findWords, NOT_TEXT, wordAt, type Word } from './words';
import './spelling.css';

export interface SpellingOptions {
  /** The language of the text: that of its map. */
  language: () => string | null | undefined;
  /** The words that are ignored in the project. */
  ignored: () => ReadonlySet<string>;
  /** Opens the menu of a misspelt word; see `menu.ts`. */
  menu?: (view: EditorView, at: Misspelt, where: MouseEvent | null) => void;
  /** Says why nothing is underlined, when the menu is asked for where there is nothing. */
  none?: (view: EditorView, why: Why) => void;
}

/** A misspelt word where it stands in the document. */
export interface Misspelt {
  from: number;
  to: number;
  word: string;
  asked: string;
}

/** Why there is no misspelt word to show. */
export type Why = 'off' | 'no-dictionary' | 'reading' | 'nothing';

interface Range {
  from: number;
  to: number;
}

/** What is underlined, which is what the state of an editor holds of spelling. */
interface State {
  decorations: DecorationSet;
}

type Meta = { kind: 'underlined'; decorations: DecorationSet };

export const spellingKey = new PluginKey<State>('spelling');

/** How long a change is let rest before what it changed is looked at, in milliseconds. */
const REST = 120;
/** How long one piece of looking may take, in milliseconds. */
const PIECE = 8;

const DECORATION = { class: 'misspelt' };

/** What looks at the text of each editor. */
interface Looker {
  /** Looks at these parts again, soon. */
  look(ranges: Range[]): void;
  /** Looks at all of it again. */
  anew(): void;
}

const lookers = new WeakMap<EditorView, Looker>();

function mapRanges(ranges: Range[], mapping: Mappable): Range[] {
  const out: Range[] = [];
  for (const r of ranges) {
    const from = mapping.map(r.from, 1);
    const to = mapping.map(r.to, -1);
    if (to > from) out.push({ from, to });
  }
  return out;
}

/**
 * How places moved from one document to another, and what differs: found
 * by comparing, which is quick, as what did not change is the same node.
 * Null where nothing differs.
 */
function difference(a: Node, b: Node): { mapping: Mapping; changed: Range } | null {
  const start = a.content.findDiffStart(b.content);
  if (start == null) return null;
  let { a: endA, b: endB } = a.content.findDiffEnd(b.content)!;
  const overlap = start - Math.min(endA, endB);
  if (overlap > 0) {
    endA += overlap;
    endB += overlap;
  }
  return {
    mapping: new Mapping([new StepMap([start, endA - start, endB - start])]),
    changed: { from: start, to: endB },
  };
}

/**
 * How the places of a transaction moved. y-prosemirror puts in the whole
 * text anew for every change that comes through the document, as when
 * another writes or the text is first put in: there, what differs is found
 * by comparing, so that the underlines elsewhere stay.
 */
function mappingOf(tr: Transaction, before: EditorState): Mapping {
  if (!tr.getMeta(ySyncPluginKey)) return tr.mapping;
  return difference(before.doc, tr.doc)?.mapping ?? new Mapping();
}

/** The ranges, sorted, with those that touch made one. */
function merged(ranges: Range[], size: number): Range[] {
  const sorted = ranges
    .map((r) => ({ from: Math.max(0, r.from), to: Math.min(size, r.to) }))
    .filter((r) => r.to >= r.from)
    .sort((x, y) => x.from - y.from);
  const out: Range[] = [];
  for (const r of sorted) {
    const last = out[out.length - 1];
    if (last && r.from <= last.to) last.to = Math.max(last.to, r.to);
    else out.push({ ...r });
  }
  return out;
}

/**
 * The text of a textblock, as the words are found in: what is not text
 * stands as signs that are not words, as many as the places it takes, so
 * that a place in the text is a place in the document. Citations that were
 * found, and are not yet citations, are not checked.
 */
export function blockText(block: Node): string {
  let text = '';
  block.forEach((child) => {
    if (child.isText) {
      const t = child.text ?? '';
      text += child.marks.some((m) => m.type.name === 'found') ? NOT_TEXT.repeat(t.length) : t;
    } else {
      text += NOT_TEXT.repeat(child.nodeSize);
    }
  });
  return text;
}

/**
 * The node of text a place is in, and where it begins: a textblock, or, in
 * the editor of a note, the document, which is the note (an inline node that
 * holds text, and so not a textblock), with -1.
 */
function blockOf($pos: ResolvedPos): { block: Node; pos: number } | null {
  if (!$pos.parent.inlineContent) return null;
  return { block: $pos.parent, pos: $pos.depth === 0 ? -1 : $pos.before() };
}

/** The words of a textblock that is at `pos`, with their places in the document. */
function wordsOf(block: Node, pos: number, language: string, script: string | null): Word[] {
  return findWords(blockText(block), language, script).map((w) => ({
    ...w,
    from: pos + 1 + w.from,
    to: pos + 1 + w.to,
  }));
}

/** Whether two lists of underlines underline the same words in the same places. */
function same(a: Decoration[], b: Decoration[]): boolean {
  if (a.length !== b.length) return false;
  return a.every(
    (d, i) =>
      d.from === b[i].from &&
      d.to === b[i].to &&
      (d.spec as { word: string }).word === (b[i].spec as { word: string }).word,
  );
}

export function spellingPlugin(options: SpellingOptions): Plugin<State> {
  const languageOf = () => options.language() ?? '';

  /** Whether a word is misspelt: known to be wrong, and not ignored. Undefined while it is not known. */
  function wrong(word: Word): boolean | undefined {
    const right = spelling.judge(options.language(), word.asked);
    if (right === undefined) return undefined;
    return !right && !isIgnored(options.ignored(), word.word);
  }

  /** The misspelt word at a place, if there is one; looked for at once. */
  function misspeltAt(state: EditorState, pos: number): Misspelt | null {
    if (!spelling.on) return null;
    const checking = spelling.checkingOf(options.language());
    if (!checking) return null;
    const at = blockOf(state.doc.resolve(pos));
    if (!at) return null;
    const word = wordAt(wordsOf(at.block, at.pos, languageOf(), checking.script), pos);
    return word && wrong(word) === true ? word : null;
  }

  /** Why nothing is shown in this text. */
  function why(): Why {
    if (!spelling.on) return 'off';
    const checking = spelling.checkingOf(options.language());
    if (checking === null) return 'no-dictionary';
    if (checking === undefined) return 'reading';
    return 'nothing';
  }

  /**
   * The misspelt word at the cursor, or the next after it (with `back`, the
   * one before it), going round to the other end of the text.
   */
  function nextMisspelt(state: EditorState, back: boolean): Misspelt | null {
    const here = misspeltAt(state, state.selection.head);
    if (here) return here;
    const all = (spellingKey.getState(state)?.decorations.find() ?? []).sort(
      (a, b) => a.from - b.from,
    );
    if (!all.length) return null;
    const head = state.selection.head;
    const next = back
      ? ([...all].reverse().find((d) => d.to < head) ?? all[all.length - 1])
      : (all.find((d) => d.from > head) ?? all[0]);
    const spec = next.spec as { word: string; asked: string };
    return { from: next.from, to: next.to, word: spec.word, asked: spec.asked };
  }

  return new Plugin<State>({
    key: spellingKey,
    state: {
      init: () => ({ decorations: DecorationSet.empty }),
      apply(tr, value, before) {
        const meta = tr.getMeta(spellingKey) as Meta | undefined;
        if (meta) return { decorations: meta.decorations };
        if (!tr.docChanged) return value;
        return { decorations: value.decorations.map(mappingOf(tr, before), tr.doc) };
      },
    },
    props: {
      decorations(state) {
        return spellingKey.getState(state)?.decorations;
      },
      handleDOMEvents: {
        // The word that was being written at the cursor is judged when the text is left.
        blur(view) {
          setTimeout(() => {
            if (view.isDestroyed || view.hasFocus()) return;
            const at = blockOf(view.state.selection.$head);
            if (at) lookers.get(view)?.look([{ from: at.pos, to: at.pos + at.block.nodeSize }]);
          }, 0);
          return false;
        },
        contextmenu(view, event) {
          if (!options.menu) return false;
          const at = view.posAtCoords({ left: event.clientX, top: event.clientY });
          if (!at) return false;
          const found = misspeltAt(view.state, at.pos);
          if (!found) return false;
          event.preventDefault();
          event.stopPropagation();
          options.menu(view, found, event);
          return true;
        },
      },
      handleKeyDown(view, event) {
        if (event.key !== 'F7' || event.ctrlKey || event.metaKey || event.altKey) return false;
        const found = nextMisspelt(view.state, event.shiftKey);
        if (found && options.menu) options.menu(view, found, null);
        else if (!found) options.none?.(view, why());
        return true;
      },
    },
    view(view) {
      let timer: ReturnType<typeof setTimeout> | undefined;
      /** What is to be looked at, when there is time. */
      let todo: Range[] = [{ from: 0, to: view.state.doc.content.size }];
      /** What waits for words to be answered. */
      let waiting: Range[] = [];
      /** The textblock of the word that was left alone at the cursor. */
      let atCursor: Range | null = null;

      function schedule(wait: number) {
        clearTimeout(timer);
        timer = setTimeout(look, wait);
      }

      function underline(decorations: DecorationSet) {
        if (view.isDestroyed) return;
        view.dispatch(
          view.state.tr
            .setMeta(spellingKey, { kind: 'underlined', decorations } satisfies Meta)
            .setMeta('addToHistory', false),
        );
      }

      const looker: Looker = {
        look(ranges) {
          todo.push(...ranges);
          schedule(0);
        },
        anew() {
          todo = [{ from: 0, to: view.state.doc.content.size }];
          waiting = [];
          schedule(0);
        },
      };
      lookers.set(view, looker);

      const stop = spelling.listen((change) => {
        if (change === 'anew') looker.anew();
        else if (waiting.length || todo.length) {
          // Answers have come: what waited for them is looked at again.
          todo.push(...waiting);
          waiting = [];
          schedule(0);
        }
      });

      /** Looks at what is to be looked at, for as long as a piece may take. */
      function look() {
        if (view.isDestroyed || !todo.length) return;
        const before = spellingKey.getState(view.state)?.decorations ?? DecorationSet.empty;
        if (!spelling.on) {
          todo = [];
          waiting = [];
          if (before.find().length) underline(DecorationSet.empty);
          return;
        }
        const language = languageOf();
        const checking = spelling.checkingOf(language);
        // Not known yet whether the language has a dictionary: when it is, all is looked at.
        if (checking === undefined) return;
        const { doc, selection } = view.state;
        const cursor = selection.empty && view.hasFocus() ? selection.head : -1;
        const script = checking?.script ?? null;
        const until = performance.now() + PIECE;
        let decorations = before;
        const looked: Range[] = [];
        const waits: Range[] = [];
        const ranges = merged(todo, doc.content.size);
        let left: Range[] = [];
        atCursor = null;

        const lookAt = (block: Node, pos: number) => {
          const end = pos + block.nodeSize;
          looked.push({ from: pos, to: end });
          const found: Decoration[] = [];
          let unknown = false;
          if (checking) {
            for (const word of wordsOf(block, pos, language, script)) {
              // The word being written is judged when it is left.
              if (word.to === cursor) {
                atCursor = { from: pos, to: end };
                continue;
              }
              const judged = wrong(word);
              if (judged === undefined) unknown = true;
              else if (judged)
                found.push(
                  Decoration.inline(word.from, word.to, DECORATION, {
                    word: word.word,
                    asked: word.asked,
                  }),
                );
            }
          }
          const had = decorations.find(pos, end).sort((a, b) => a.from - b.from);
          if (!same(had, found)) decorations = decorations.remove(had).add(doc, found);
          if (unknown) waits.push({ from: pos, to: end });
        };

        // The editor of a note, whose document is the text of the note, is looked at whole.
        if (doc.inlineContent) lookAt(doc, -1);
        for (let i = 0; i < (doc.inlineContent ? 0 : ranges.length); i++) {
          const range = ranges[i];
          let stoppedAt: number | null = null;
          doc.nodesBetween(range.from, Math.max(range.to, range.from + 1), (node, pos) => {
            if (stoppedAt !== null) return false;
            if (!node.inlineContent) return true;
            if (performance.now() > until) {
              stoppedAt = pos;
              return false;
            }
            lookAt(node, pos);
            return false;
          });
          if (stoppedAt !== null) {
            left = [{ from: stoppedAt, to: range.to }, ...ranges.slice(i + 1)];
            break;
          }
        }
        // What waited and has been looked at waits no longer, unless it waits again.
        const still = waiting.filter((w) => !looked.some((l) => w.from < l.to && w.to > l.from));
        waiting = merged([...still, ...waits], doc.content.size);
        todo = left;
        if (decorations !== before) underline(decorations);
        if (todo.length) schedule(0);
      }

      return {
        update(view, previous) {
          if (view.state.doc !== previous.doc) {
            const moved = difference(previous.doc, view.state.doc);
            if (moved) {
              todo = [...mapRanges(todo, moved.mapping), moved.changed];
              waiting = mapRanges(waiting, moved.mapping);
              atCursor = null;
              schedule(REST);
            }
            return;
          }
          // The cursor has left the word that was being written: it is judged now.
          if (atCursor && !view.state.selection.eq(previous.selection)) {
            const again = atCursor;
            atCursor = null;
            looker.look([again]);
          }
        },
        destroy() {
          clearTimeout(timer);
          stop();
          lookers.delete(view);
        },
      };
    },
  });
}

/** The word that stands at a place of an editor, or touches it, if any. */
export function wordAtPlace(state: EditorState, pos: number): Word | null {
  const at = blockOf(state.doc.resolve(Math.min(pos, state.doc.content.size)));
  return at ? wordAt(wordsOf(at.block, at.pos, '', null), pos) : null;
}

/** Has an editor look at all its text again, as when the language of its map has changed. */
export function lookAgain(view: EditorView) {
  if (!view.isDestroyed) lookers.get(view)?.anew();
}

/** The misspelt words an editor shows, for tests. */
export function misspeltIn(state: EditorState): string[] {
  const set = spellingKey.getState(state)?.decorations;
  return (set?.find() ?? []).map((d) => (d.spec as { word: string }).word);
}
