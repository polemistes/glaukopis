/**
 * Numbered lines in the editor (ADR 0041). A numbered stretch is a run of
 * paragraphs with the same numbering settings, whatever their kinds; the
 * count runs through all of it, over its lines, as `project/model/lines.ts`
 * counts them. What is said of one line by hand stands in its line mark.
 * Here: the stretch the cursor is in, what a numbering is set on, the line
 * the cursor is in and what is said of it, and the numbers drawn in the
 * margin at the start of every line, which are edited in place.
 */

import type { Node } from 'prosemirror-model';
import {
  Plugin,
  PluginKey,
  type Command,
  type EditorState,
  type Transaction,
} from 'prosemirror-state';
import { Decoration, DecorationSet, type EditorView } from 'prosemirror-view';
import { t } from '$lib/i18n';
import {
  countedKind,
  type BasedKind,
  type Numbering,
  type Side,
} from '$lib/project/model/families';
import { linesOf, stretches, stretchNumbers, type Shown } from '$lib/project/model/lines';
import type { Block, ParagraphBlock } from '$lib/project/model/text';
import { bracketsKey } from './brackets';
import { withinLines } from './changes';
import { paragraphsIn } from './commands';
import { cursorLine, lineAtPos } from './keys';
import {
  blockOf,
  eachHolder,
  kindOfNode,
  linesOfNode,
  marksAnything,
  runsIn,
  type LineAt,
  type Placed,
} from './shape';

/** How a stretch numbers its lines: see `paragraph` in `schema.ts`. */
export interface StretchNumbering {
  numbering: Numbering;
  /** Every how many a counted number is shown; nothing for the layout's. */
  every: number | null;
  /** The side the numbers stand on; nothing for the layout's. */
  side: Side | null;
}

/** A numbered stretch: its paragraphs, with where each begins, and its settings. */
export interface StretchAt extends StretchNumbering {
  paragraphs: Placed[];
}

/** Whether a paragraph is numbered: it is then of a stretch. */
function isNumbered(node: Node): boolean {
  return node.attrs.numbering === 'counted' || node.attrs.numbering === 'given';
}

/** The numbered stretches among the children of a node whose content begins at `start`. */
export function stretchesIn(parent: Node, start: number): StretchAt[] {
  const placed: (Placed | null)[] = [];
  const blocks: Block[] = [];
  let pos = start;
  parent.forEach((node) => {
    // A paragraph that is not numbered ends a stretch as anything that is
    // not a paragraph does; only those that are numbered are read.
    if (node.type.name === 'paragraph' && isNumbered(node)) {
      placed.push({ node, pos });
      blocks.push(blockOf(node));
    } else {
      placed.push(null);
      blocks.push({ kind: 'break', what: 'page' });
    }
    pos += node.nodeSize;
  });
  return stretches(blocks).map((s) => ({
    numbering: s.numbering,
    every: s.every,
    side: s.side,
    paragraphs: placed.slice(s.from, s.to).filter((p): p is Placed => !!p),
  }));
}

/** The paragraph the selection begins in, with the node that holds it and where its content begins. */
function holderAt(state: EditorState): { parent: Node; start: number; paragraph: Placed } | null {
  const { $from } = state.selection;
  for (let d = $from.depth; d > 0; d--) {
    if ($from.node(d).type.name !== 'paragraph') continue;
    return {
      parent: $from.node(d - 1),
      start: $from.start(d - 1),
      paragraph: { node: $from.node(d), pos: $from.before(d) },
    };
  }
  return null;
}

/** The stretch the cursor is in: its paragraphs with where they begin, and its settings; nothing in a paragraph that is not numbered. */
export function stretchAt(state: EditorState): StretchAt | null {
  const at = holderAt(state);
  if (!at) return null;
  return (
    stretchesIn(at.parent, at.start).find((s) =>
      s.paragraphs.some((p) => p.pos === at.paragraph.pos),
    ) ?? null
  );
}

/**
 * The paragraphs a numbering would be set on from where the cursor is: the
 * paragraphs the selection touches, where it runs over more than one; and
 * otherwise the run the cursor is in, the paragraphs of its kind standing
 * together with the speakers and directions among them, or the paragraphs
 * of text standing together.
 */
export function stretchToNumber(state: EditorState, own: readonly BasedKind[] = []): Placed[] {
  const at = holderAt(state);
  if (!at) return [];
  const touched = paragraphsIn(state);
  if (touched.length > 1) {
    // Those of the same text as the first: a numbering is set within one.
    const first = touched[0];
    const $first = state.doc.resolve(first.pos);
    return touched.filter((p) => state.doc.resolve(p.pos).parent === $first.parent);
  }
  const run = runsIn(at.parent, at.start, own).find((r) =>
    r.paragraphs.some((p) => p.pos === at.paragraph.pos),
  );
  return run ? run.paragraphs : [at.paragraph];
}

/** The settings as they are stored: nothing where they say nothing. */
function settingsOf(how: StretchNumbering) {
  if (how.numbering === 'none') return { numbering: null, every: null, side: null };
  return {
    numbering: how.numbering,
    every: how.every && how.every >= 1 ? Math.round(how.every) : null,
    side: how.side === 'left' || how.side === 'right' ? how.side : null,
  };
}

/** Sets the numbering settings on every paragraph that begins at the places given; with `none`, numbers them no more. */
export function numberStretch(
  paragraphs: readonly { pos: number }[],
  how: StretchNumbering,
): Command {
  return (state, dispatch) => {
    const settings = settingsOf(how);
    const tr = state.tr;
    let any = false;
    for (const { pos } of paragraphs) {
      const node = pos >= 0 && pos < state.doc.content.size ? state.doc.nodeAt(pos) : null;
      if (node?.type.name !== 'paragraph') continue;
      any = true;
      const same = (['numbering', 'every', 'side'] as const).every(
        (k) => (node.attrs[k] ?? null) === settings[k],
      );
      if (!same) tr.setNodeMarkup(pos, undefined, { ...node.attrs, ...settings });
    }
    if (!any) return false;
    if (dispatch && tr.docChanged) dispatch(tr);
    return true;
  };
}

/** What is said of one line by hand: see `linemark` in `schema.ts`. */
export interface LineMarks {
  number: string | null;
  counted: boolean;
  /** Counted, and its number not shown. */
  hidden: boolean;
  margin: string | null;
  /** The line's own indent; where it is not given, it stays as it is. */
  indent?: number;
}

/** The attributes of a line mark that says what is given, the indent as it was where none is given. */
function markAttrs(marks: LineMarks, was: Node | null): Record<string, unknown> {
  const indent = marks.indent ?? (Number(was?.attrs.indent) || 0);
  return {
    number: marks.number?.trim() || null,
    counted: marks.counted ? null : false,
    hidden: marks.counted && marks.hidden ? true : null,
    margin: marks.margin?.trim() || null,
    indent: indent > 0 ? Math.min(8, Math.round(indent)) : null,
  };
}

/** Gives a line the mark that says what is given, in the transaction: made where there is none, taken away where it says nothing. */
function setMark(tr: Transaction, line: LineAt, attrs: Record<string, unknown>) {
  const type = tr.doc.type.schema.nodes.linemark;
  if (!type) return;
  const at = tr.mapping.map(line.start);
  if (line.mark) {
    const same = Object.keys(attrs).every((k) => (line.mark!.attrs[k] ?? null) === attrs[k]);
    if (same) return;
    if (marksAnything(attrs)) tr.setNodeMarkup(at, undefined, attrs);
    else tr.delete(at, at + 1);
  } else if (marksAnything(attrs)) tr.insert(at, type.create(attrs));
}

/** What a line's mark says, as the dialog asks about it. */
function marksOf(mark: Node | null): LineMarks {
  return {
    number: (mark?.attrs.number as string | null) ?? null,
    counted: mark?.attrs.counted !== false,
    hidden: mark?.attrs.hidden === true,
    margin: (mark?.attrs.margin as string | null) ?? null,
    indent: Number(mark?.attrs.indent) || 0,
  };
}

/** The first line the count takes in among the paragraphs given, with its paragraph; nothing where none is counted. */
export function firstCounted(
  doc: Node,
  paragraphs: readonly { pos: number }[],
  own: readonly BasedKind[] = [],
): { paragraph: Placed; line: LineAt } | null {
  for (const { pos } of paragraphs) {
    const node = doc.nodeAt(pos);
    if (node?.type.name !== 'paragraph' || !countedKind(kindOfNode(node), own)) continue;
    for (const line of linesOfNode(node, pos))
      if (!line.blank && line.mark?.attrs.counted !== false)
        return { paragraph: { node, pos }, line };
  }
  return null;
}

/**
 * Gives the first counted line among the paragraphs given a number, from
 * which the count goes on; with nothing, takes away the number it had.
 */
export function numberFrom(
  paragraphs: readonly { pos: number }[],
  from: string | null,
  own: readonly BasedKind[] = [],
): Command {
  return (state, dispatch) => {
    const first = firstCounted(state.doc, paragraphs, own);
    if (!first) return false;
    if (dispatch) {
      const tr = state.tr;
      setMark(
        tr,
        first.line,
        markAttrs({ ...marksOf(first.line.mark), number: from }, first.line.mark),
      );
      if (tr.docChanged) dispatch(tr);
    }
    return true;
  };
}

/** The line the cursor is in: its paragraph, which line of it it is, its mark, and where the mark stands or would. */
export function lineAt(
  state: EditorState,
): { paragraph: Node; pos: number; line: number; mark: Node | null; markPos: number } | null {
  const found = cursorLine(state);
  if (!found) return null;
  return {
    paragraph: found.paragraph,
    pos: found.pos,
    line: found.line.index,
    mark: found.line.mark,
    markPos: found.line.start,
  };
}

/** Says what is said of the line the cursor is in: its number or label, whether it is counted or shown, its margin words. */
export function markLine(marks: LineMarks): Command {
  return (state, dispatch) => {
    const found = cursorLine(state);
    if (!found) return false;
    if (dispatch) {
      const tr = state.tr;
      setMark(tr, found.line, markAttrs(marks, found.line.mark));
      if (tr.docChanged) dispatch(tr);
    }
    return true;
  };
}

/**
 * Gives the line that begins at `linePos` a number or a label by hand, or,
 * with nothing, takes away the one it had: what the field in the margin
 * does. What else is said of the line stays.
 */
export function giveNumber(linePos: number, value: string | null): Command {
  return (state, dispatch) => {
    if (linePos < 0 || linePos > state.doc.content.size) return false;
    const found = lineAtPos(state.doc, linePos);
    if (!found || found.line.start !== linePos) return false;
    const { line } = found;
    if (dispatch) {
      const tr = state.tr;
      setMark(tr, line, markAttrs({ ...marksOf(line.mark), number: value }, line.mark));
      if (tr.docChanged) dispatch(tr);
    }
    return true;
  };
}

/** What the dialog of the numbers asks about: see `LineNumbersDialog.svelte`. */
export interface NumbersAsked {
  /** How the stretch is numbered; for paragraphs not numbered yet, how they would be. */
  stretch: StretchNumbering;
  /** Whether the cursor stands in a numbered stretch. */
  numbered: boolean;
  /** The number the first counted line has, and whether it is the line the cursor is in; nothing where none is counted. */
  from: { number: string | null; here: boolean } | null;
  /** The line the cursor is in: what is said of it, its words, the kind of its paragraph, and whether that kind is counted. */
  line: LineMarks & { kind: string; words: string; countable: boolean };
}

/**
 * How the stretch the cursor is in is numbered, or how the paragraphs it
 * would number are to be, and what is said of the line the cursor is in,
 * as the dialog asks about them. Paragraphs not yet numbered are counted
 * from 1; paragraphs of text one by one, others as the layout says.
 */
export function numbersAsked(
  state: EditorState,
  own: readonly BasedKind[] = [],
): NumbersAsked | null {
  const found = cursorLine(state);
  if (!found) return null;
  const stretch = stretchAt(state);
  const paragraphs = stretch?.paragraphs ?? stretchToNumber(state, own);
  const first = firstCounted(state.doc, paragraphs, own);
  const here = !!first && first.line.start === found.line.start;
  const kind = kindOfNode(found.paragraph);
  const marks = marksOf(found.line.mark);
  const given = (first?.line.mark?.attrs.number as string | null) ?? null;
  return {
    stretch: stretch
      ? { numbering: stretch.numbering, every: stretch.every, side: stretch.side }
      : { numbering: 'counted', every: kind === 'text' ? 1 : null, side: null },
    numbered: !!stretch,
    from: first ? { number: stretch ? given : (given ?? '1'), here } : null,
    line: {
      ...marks,
      number: !stretch && here && !marks.number ? '1' : marks.number,
      kind,
      words: state.doc.textBetween(found.line.start, found.line.end, ' ', (leaf) =>
        leaf.type.name === 'linemark' ? '' : ' ',
      ),
      countable: countedKind(kind, own),
    },
  };
}

// ---- the numbers in the margin ----

/** How the layout shows the numbers of a stretch that does not say: every how many, and on which side. */
export interface NumbersLayout {
  every: number;
  side: Side;
}

export const LAYOUT_NUMBERS: NumbersLayout = { every: 5, side: 'left' };

const key = new PluginKey<DecorationSet>('stretch-numbers');

/**
 * Opens the field for the number of the line a number stands by, in the
 * place of the number: Enter gives the line what is written, an empty
 * field takes its number away, Escape leaves it as it was. The text has
 * the cursor again afterwards, unless the field was left for something
 * else: what was pressed keeps the focus it was given.
 */
function editNumber(view: EditorView, getPos: () => number | undefined, el: HTMLElement) {
  const at = getPos();
  if (at === undefined || !view.editable || el.classList.contains('editing')) return;
  const found = lineAtPos(view.state.doc, at);
  if (!found) return;
  const was = el.textContent;
  const input = document.createElement('input');
  input.className = 'line-number-field';
  input.type = 'text';
  input.value = String(found.line.mark?.attrs.number ?? '');
  input.placeholder = '#';
  input.setAttribute('aria-label', t('editor-line-number'));
  input.spellcheck = false;
  el.classList.add('editing');
  el.replaceChildren(input);
  let done = false;
  const finish = (keep: boolean, refocus = true) => {
    if (done) return;
    done = true;
    const value = input.value;
    el.classList.remove('editing');
    el.textContent = was;
    if (keep && !view.isDestroyed) {
      // The line may have moved while the field was open: it is found anew from the widget.
      const now = getPos();
      if (now !== undefined) giveNumber(now, value)(view.state, view.dispatch);
    }
    if (refocus && !view.isDestroyed) view.focus();
  };
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      finish(true);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      finish(false);
    }
  });
  // Focus taken back in a blur would stop it on its way to what was
  // pressed; the text is given it only where it went nowhere.
  input.addEventListener('blur', (event) => finish(false, event.relatedTarget === null));
  input.focus();
  input.select();
}

/**
 * The number in the margin of a line, as a widget at its start: the
 * label, or an empty place where none is shown, which is seen when the
 * pointer rests on the paragraph; pressing either opens the field for the
 * line's number. A number held back is shown in parentheses.
 */
function numberWidget(
  shown: Shown | null,
  held: boolean,
): (view: EditorView, getPos: () => number | undefined) => HTMLElement {
  return (view, getPos) => {
    const el = document.createElement('span');
    el.className = shown ? (held ? 'line-number held' : 'line-number') : 'line-number blank';
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '-1');
    if (shown) {
      el.textContent = shown.label;
      el.dataset.label = shown.label;
      if (shown.set) el.dataset.given = '';
      if (held) el.dataset.held = '';
    }
    el.title = held ? t('editor-line-number-held') : t('editor-line-number-press');
    el.addEventListener('mousedown', (event) => {
      // The text keeps its cursor: the number is not a place in it.
      if (!(event.target instanceof HTMLInputElement)) event.preventDefault();
    });
    el.addEventListener('click', (event) => {
      if (event.target instanceof HTMLInputElement) return;
      event.preventDefault();
      editNumber(view, getPos, el);
    });
    return el;
  };
}

/** The words in the margin beside a line, as a widget at its start. */
function marginWidget(words: string): () => HTMLElement {
  return () => {
    const el = document.createElement('span');
    el.className = 'line-margin';
    el.textContent = words;
    el.title = words;
    return el;
  };
}

/** A paragraph's block with its line marks held back no more: for the numbers a held line would have. */
function unheld(block: ParagraphBlock): ParagraphBlock {
  return {
    ...block,
    content: block.content.map((i) => {
      if (i.kind !== 'linemark' || !i.hidden) return i;
      const { hidden: _hidden, ...rest } = i;
      return rest;
    }),
  };
}

/**
 * The numbers of every numbered stretch, as decorations: a widget at the
 * start of each line that draws its number, or the place for one, by which
 * it is edited; on each paragraph of a stretch the side its numbers stand
 * on (`data-numbers`), and on a paragraph whose first line shows a number,
 * that number (`data-n`, and `data-n-set` where it was given by hand). And
 * the words in the margin beside a line, wherever they are said, with
 * `data-margins` on their paragraph.
 */
function numbers(doc: Node, own: readonly BasedKind[], layout: NumbersLayout): DecorationSet {
  const list: Decoration[] = [];
  eachHolder(doc, (parent, start) => {
    let anyNumbered = false;
    parent.forEach((node) => {
      if (node.type.name === 'paragraph' && isNumbered(node)) anyNumbered = true;
    });
    for (const s of anyNumbered ? stretchesIn(parent, start) : []) {
      const side = s.side ?? layout.side;
      const every = s.every ?? layout.every;
      const blocks = s.paragraphs.map((p) => blockOf(p.node));
      const shown = stretchNumbers(blocks, s.numbering, every, own);
      const held = stretchNumbers(blocks.map(unheld), s.numbering, every, own);
      s.paragraphs.forEach((p, i) => {
        const lines = linesOfNode(p.node, p.pos);
        const first = shown[i]?.[0];
        list.push(
          Decoration.node(p.pos, p.pos + p.node.nodeSize, {
            'data-numbers': side,
            ...(first ? { 'data-n': first.label } : {}),
            ...(first?.set ? { 'data-n-set': '' } : {}),
          }),
        );
        lines.forEach((line, j) => {
          const hidden = line.mark?.attrs.hidden === true;
          const label = hidden ? (held[i]?.[j] ?? null) : (shown[i]?.[j] ?? null);
          list.push(
            Decoration.widget(line.start, numberWidget(label, hidden && !!label), {
              side: -1,
              key: label
                ? `line-number:${label.label}${label.set ? ':given' : ''}${hidden ? ':held' : ''}`
                : 'line-number:blank',
              ignoreSelection: true,
              stopEvent: () => true,
            }),
          );
        });
      });
    }
    let pos = start;
    parent.forEach((node) => {
      const here = pos;
      pos += node.nodeSize;
      if (node.type.name !== 'paragraph' || !holdsMargin(node)) return;
      let any = false;
      for (const line of linesOfNode(node, here)) {
        const words = line.mark?.attrs.margin;
        if (typeof words !== 'string' || !words.trim()) continue;
        any = true;
        list.push(
          Decoration.widget(line.start, marginWidget(words.trim()), {
            side: -2,
            key: `line-margin:${words.trim()}`,
            ignoreSelection: true,
          }),
        );
      }
      if (any) list.push(Decoration.node(here, here + node.nodeSize, { 'data-margins': '' }));
    });
  });
  return DecorationSet.create(doc, list);
}

/**
 * Which lines of a paragraph are blank. Of what is within its lines, only
 * this says anything of its numbers, where only text was written: the
 * lines, their marks and the kind of the paragraph stay as they were.
 */
function blanks(node: Node): string {
  return linesOf(blockOf(node).content)
    .map((l) => (l.blank ? '-' : '+'))
    .join('');
}

/** Whether a paragraph has a line mark that says words in the margin. */
function holdsMargin(node: Node): boolean {
  let holds = false;
  node.forEach((child) => {
    if (child.type.name === 'linemark' && typeof child.attrs.margin === 'string')
      holds ||= !!child.attrs.margin.trim();
  });
  return holds;
}

/**
 * Draws the numbers of the lines of the numbered stretches, and the words
 * in the margin. `own` gives the kinds of the writer's own, for which lines
 * are counted; `layout` what the document's layout says of the numbers,
 * which the editor is told anew by `redrawShape` when it changes.
 *
 * The numbers depend on the paragraphs of the numbered stretches, their
 * kinds, settings, lines, line marks and which lines are blank, and the
 * words in the margin on line marks: a change that writes only text
 * (`withinLines`), as a keystroke does, in paragraphs that are not
 * numbered, or that are and have their blank lines where they were,
 * changes none of them, and what was drawn is moved with the text. Any
 * other change draws them anew, reading only the paragraphs that are
 * numbered or hold words in the margin; before, every paragraph was read
 * on every keystroke.
 */
export function stretchNumbersPlugin(
  own: () => readonly BasedKind[] = () => [],
  layout: () => NumbersLayout = () => LAYOUT_NUMBERS,
): Plugin<DecorationSet> {
  return new Plugin<DecorationSet>({
    key,
    state: {
      init: (_config, state) => numbers(state.doc, own(), layout()),
      apply: (tr, set) => {
        if (!tr.docChanged && !tr.getMeta(key)) return set;
        const within = tr.getMeta(key) ? null : withinLines(tr);
        const same =
          within?.onlyText &&
          within.written.every(
            ({ before, after }) => !isNumbered(before) || (!!after && blanks(before) === blanks(after)),
          );
        return same ? set.map(tr.mapping, tr.doc) : numbers(tr.doc, own(), layout());
      },
    },
    props: { decorations: (state) => key.getState(state) },
  });
}

/**
 * Has the numbers of lines and the brackets of runs drawn anew, as when the
 * layout or the kinds of the writer's own, or the language of the
 * interface, have changed: they are not drawn anew on every keystroke.
 */
export function redrawShape(view: { state: EditorState; dispatch: (tr: Transaction) => void }) {
  view.dispatch(
    view.state.tr.setMeta(key, true).setMeta(bracketsKey, true).setMeta('addToHistory', false),
  );
}
