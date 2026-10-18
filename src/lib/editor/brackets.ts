/**
 * The bracket of a run (ADR 0041): paragraphs of one kind standing
 * together, with the speakers and directions among them, are seen as one,
 * by a thin line at their left and a small label at its head with the name
 * of the kind, and "numbered" where the run lies in a numbered stretch.
 * Nothing is stored: the run is found anew from the kinds of the
 * paragraphs (`shape.ts`). Text has no bracket, unless it is numbered; nor
 * have speakers and directions of their own.
 *
 * The label is seen while the cursor is in the run or the pointer rests on
 * it, and pressed for the menu of the run: how its lines are numbered, its
 * language, selecting it, making it text, and where a run begins.
 *
 * The line and the label are widgets at the start of the run's paragraphs,
 * so that they take no room from the text and are no part of it; the
 * paragraphs of a run are marked `data-run` with its kind, the first
 * `data-run-first`, and those of the run the cursor is in `data-current`.
 */

import Globe from '@lucide/svelte/icons/globe';
import Hash from '@lucide/svelte/icons/hash';
import Merge from '@lucide/svelte/icons/merge';
import Pilcrow from '@lucide/svelte/icons/pilcrow';
import SplitSquareVertical from '@lucide/svelte/icons/split-square-vertical';
import TextSelect from '@lucide/svelte/icons/box-select';
import {
  Plugin,
  PluginKey,
  TextSelection,
  type Command,
  type EditorState,
} from 'prosemirror-state';
import { Decoration, DecorationSet, type EditorView } from 'prosemirror-view';
import { t } from '$lib/i18n';
import type { BasedKind } from '$lib/project/model/families';
import { openMenu, type MenuItem } from '$lib/ui/menu.svelte';
import { languageItems } from './language-menu';
import { withinLines } from './changes';
import { eachHolder, kindOfNode, runsIn, type Run } from './shape';
import { hooksOf } from './ui.svelte';

export const bracketsKey = new PluginKey<Drawn>('run-brackets');

/** Whether a run is drawn with a bracket: a run of a kind, or of text that is numbered. */
export function bracketed(run: Run): boolean {
  return !run.among && (run.kind !== 'text' || numbered(run));
}

/** Whether a run lies in a numbered stretch. */
export function numbered(run: Run): boolean {
  return run.paragraphs.some((p) => !!p.node.attrs.numbering);
}

/** The run whose first paragraph begins at `pos`, where there is one. */
export function runFrom(
  state: EditorState,
  pos: number,
  own: readonly BasedKind[] = [],
): Run | null {
  if (pos < 0 || pos >= state.doc.content.size) return null;
  const $pos = state.doc.resolve(pos);
  return runsIn($pos.parent, $pos.start(), own).find((r) => r.paragraphs[0].pos === pos) ?? null;
}

/** The run the cursor is in, and which of its paragraphs the cursor is in; nothing outside a paragraph. */
export function runAt(
  state: EditorState,
  own: readonly BasedKind[] = [],
): { run: Run; index: number } | null {
  const { $from } = state.selection;
  for (let d = $from.depth; d > 0; d--) {
    if ($from.node(d).type.name !== 'paragraph') continue;
    const pos = $from.before(d);
    for (const run of runsIn($from.node(d - 1), $from.start(d - 1), own)) {
      const index = run.paragraphs.findIndex((p) => p.pos === pos);
      if (index >= 0) return { run, index };
    }
    return null;
  }
  return null;
}

/** Where a run's text begins and ends. */
function spanOf(run: Run): { from: number; to: number } {
  const last = run.paragraphs[run.paragraphs.length - 1];
  return { from: run.paragraphs[0].pos + 1, to: last.pos + last.node.nodeSize - 1 };
}

/** Selects the whole run that begins at `pos`. */
export function selectRun(pos: number, own: readonly BasedKind[] = []): Command {
  return (state, dispatch) => {
    const run = runFrom(state, pos, own);
    if (!run) return false;
    if (dispatch) {
      const { from, to } = spanOf(run);
      dispatch(state.tr.setSelection(TextSelection.create(state.doc, from, to)).scrollIntoView());
    }
    return true;
  };
}

/**
 * Makes the paragraphs of the kind of the run that begins at `pos` text,
 * and changes nothing else: their lines, their indents, their numbering,
 * and the speakers and directions among them, stay as they are.
 */
export function runToText(pos: number, own: readonly BasedKind[] = []): Command {
  return (state, dispatch) => {
    const run = runFrom(state, pos, own);
    if (!run || run.kind === 'text') return false;
    if (dispatch) {
      const tr = state.tr;
      for (const { node, pos: at } of run.paragraphs)
        if (kindOfNode(node) === run.kind)
          tr.setNodeMarkup(at, undefined, { ...node.attrs, kind: 'text' });
      dispatch(tr.scrollIntoView());
    }
    return true;
  };
}

/** Whether a new run can begin at the paragraph the cursor is in: within a run, and not at its first. */
export function canBeginRun(state: EditorState, own: readonly BasedKind[] = []): boolean {
  const at = runAt(state, own);
  return !!at && at.index > 0;
}

/** A new run of its kind begins at the paragraph the cursor is in, though the one before is of the same kind. */
export function beginRun(own: readonly BasedKind[] = []): Command {
  return (state, dispatch) => {
    const at = runAt(state, own);
    if (!at || at.index === 0) return false;
    const { node, pos } = at.run.paragraphs[at.index];
    if (dispatch)
      dispatch(
        state.tr.setNodeMarkup(pos, undefined, { ...node.attrs, new: true }).scrollIntoView(),
      );
    return true;
  };
}

/** The run that begins at `pos` is joined with the run before it again, where it was begun as a new one. */
export function joinRunBefore(pos: number, own: readonly BasedKind[] = []): Command {
  return (state, dispatch) => {
    const run = runFrom(state, pos, own);
    const begun = run?.paragraphs.find((p) => p.node.attrs.new === true);
    if (!begun) return false;
    if (dispatch)
      dispatch(state.tr.setNodeMarkup(begun.pos, undefined, { ...begun.node.attrs, new: null }));
    return true;
  };
}

/** The language the run that begins at `pos` is in, by the first of its words that have one of their own; nothing where it is the text's. */
export function runLanguage(
  state: EditorState,
  pos: number,
  own: readonly BasedKind[] = [],
): string | null {
  const run = runFrom(state, pos, own);
  const type = state.schema.marks.lang;
  if (!run || !type) return null;
  let found: string | null = null;
  for (const { node } of run.paragraphs) {
    node.descendants((child) => {
      if (found) return false;
      if (child.isText) {
        const mark = type.isInSet(child.marks);
        const tag = typeof mark?.attrs.tag === 'string' ? mark.attrs.tag.trim() : '';
        if (tag) found = tag;
      }
      return !found;
    });
    if (found) break;
  }
  return found;
}

/**
 * Gives the whole run that begins at `pos` a language of its own, or, with
 * nothing, takes it away, so that it is in the language of the text again.
 * The run is left selected, so that what was given it is seen.
 */
export function languageOverRun(
  pos: number,
  tag: string | null,
  own: readonly BasedKind[] = [],
): Command {
  return (state, dispatch) => {
    const run = runFrom(state, pos, own);
    const type = state.schema.marks.lang;
    if (!run || !type) return false;
    if (dispatch) {
      const { from, to } = spanOf(run);
      const lang = tag?.trim() ?? '';
      const tr = state.tr;
      if (lang) tr.addMark(from, to, type.create({ tag: lang }));
      else tr.removeMark(from, to, type);
      tr.setSelection(TextSelection.create(tr.doc, from, to));
      dispatch(tr.scrollIntoView());
    }
    return true;
  };
}

/**
 * Opens the menu of the run that begins at `pos`, beside `anchor`. What
 * numbers the run and what asks for another language are the editor's
 * dialogs, reached through its hooks.
 */
export function runMenu(view: EditorView, pos: number, anchor: HTMLElement) {
  const { state } = view;
  const hooks = hooksOf.get(view);
  const own = hooks?.passageKinds?.() ?? [];
  const run = runFrom(state, pos, own);
  if (!run) return;
  const at = runAt(state, own);
  const inside = at?.run.paragraphs[0].pos === pos;
  const exec = (command: Command) => {
    if (view.isDestroyed) return;
    command(view.state, view.dispatch, view);
    view.focus();
  };
  /** The cursor into the run, where it is not there, so that what is asked of the lines where the cursor is is asked of this run. */
  const enter = () => {
    if (inside || view.isDestroyed) return;
    view.dispatch(view.state.tr.setSelection(TextSelection.near(view.state.doc.resolve(pos + 1))));
  };
  const current = runLanguage(state, pos, own);
  const items: MenuItem[] = [
    {
      label: t('editor-run-numbers'),
      hint: t('editor-run-numbers-hint'),
      icon: Hash,
      disabled: !hooks?.askNumbers,
      action: () => {
        enter();
        hooks?.askNumbers?.(view);
      },
    },
    {
      kind: 'submenu',
      label: t('editor-language'),
      icon: Globe,
      items: languageItems({
        language: hooks?.language?.() ?? null,
        current,
        set: (tag) => exec(languageOverRun(pos, tag, own)),
        other: () => {
          exec(selectRun(pos, own));
          hooks?.askLanguage?.(view, current);
        },
      }),
    },
    { kind: 'separator' },
    {
      label: t('editor-run-select'),
      icon: TextSelect,
      action: () => exec(selectRun(pos, own)),
    },
    {
      label: t('editor-run-to-text'),
      hint: t('editor-run-to-text-hint'),
      icon: Pilcrow,
      disabled: run.kind === 'text',
      action: () => exec(runToText(pos, own)),
    },
    {
      label: t('editor-run-begin'),
      hint: t('editor-run-begin-hint'),
      icon: SplitSquareVertical,
      disabled: !inside || !canBeginRun(state, own),
      action: () => exec(beginRun(own)),
    },
    {
      label: t('editor-run-join'),
      hint: t('editor-run-join-hint'),
      icon: Merge,
      disabled: !run.paragraphs.some((p) => p.node.attrs.new === true),
      action: () => exec(joinRunBefore(pos, own)),
    },
  ];
  openMenu(anchor, items, { align: 'start', onclose: () => view.focus() });
}

/**
 * The line of a bracket beside one paragraph of a run, as a widget at its
 * start; at the head of the run, with the label of the run on it, which is
 * pressed for the menu of the run.
 */
function line(
  head: { words: string; kind: string } | null,
): (view: EditorView, getPos: () => number | undefined) => HTMLElement {
  return (view, getPos) => {
    const el = document.createElement('span');
    el.className = 'run-line';
    if (!head) {
      el.setAttribute('aria-hidden', 'true');
      return el;
    }
    const label = document.createElement('span');
    label.className = 'run-label';
    label.setAttribute('role', 'button');
    label.setAttribute('tabindex', '-1');
    label.dataset.kind = head.kind;
    label.textContent = head.words;
    label.title = t('editor-run-label-hint', { kind: head.words });
    // The text keeps its cursor: the label is not a place in it.
    label.addEventListener('mousedown', (event) => event.preventDefault());
    label.addEventListener('click', (event) => {
      event.preventDefault();
      const pos = getPos();
      if (pos === undefined || !view.editable) return;
      runMenu(view, view.state.doc.resolve(pos).before(), label);
    });
    el.append(label);
    return el;
  };
}

/** The brackets as they are drawn: see `brackets`. */
interface Drawn {
  /** The lines and labels of the runs, and their kinds on their paragraphs. */
  runs: DecorationSet;
  /** Where the text of each run drawn with a bracket begins and ends. */
  spans: { from: number; to: number }[];
  /** Which of them the selection is in, or touches. */
  current: string;
  /** All that is drawn: the runs, and `data-current` on the paragraphs of the run the cursor is in. */
  shown: DecorationSet;
}

/**
 * The brackets of every run: on each paragraph its run's kind, on the
 * first that it is the first, the line beside each with the label on the
 * first; and where the text of each run begins and ends. `name` gives the
 * words for a kind: of the catalogue, or a kind of the writer's own.
 */
function brackets(
  state: EditorState,
  own: readonly BasedKind[],
  name: (kind: string) => string,
): Pick<Drawn, 'runs' | 'spans'> {
  const list: Decoration[] = [];
  const spans: Drawn['spans'] = [];
  eachHolder(state.doc, (parent, start) => {
    for (const run of runsIn(parent, start, own)) {
      if (!bracketed(run)) continue;
      spans.push(spanOf(run));
      const words = numbered(run)
        ? `${name(run.kind)} · ${t('editor-bracket-numbered')}`
        : name(run.kind);
      run.paragraphs.forEach(({ node, pos }, i) => {
        list.push(
          Decoration.node(pos, pos + node.nodeSize, {
            'data-run': run.kind,
            ...(i === 0 ? { 'data-run-first': '' } : {}),
          }),
        );
        const head = i === 0 ? { words, kind: run.kind } : null;
        list.push(
          Decoration.widget(pos + 1, line(head), {
            side: -3,
            key: head ? `run-head:${run.kind}:${words}` : 'run-line',
            ignoreSelection: true,
            stopEvent: () => !!head,
          }),
        );
      });
    }
  });
  return { runs: DecorationSet.create(state.doc, list), spans };
}

/** The indices of the runs the selection is in, or touches. */
function currentOf(state: EditorState, spans: Drawn['spans']): number[] {
  const { from, to } = state.selection;
  const out: number[] = [];
  spans.forEach((span, i) => {
    if (from <= span.to + 1 && to >= span.from - 1) out.push(i);
  });
  return out;
}

/**
 * The brackets with `data-current` on the paragraphs of the runs the
 * selection is in, or touches. `before`, what was drawn before, mapped
 * through the change: where the same runs are current, it is kept.
 */
function withCurrent(
  state: EditorState,
  drawn: Pick<Drawn, 'runs' | 'spans'>,
  before?: { current: string; shown: DecorationSet },
): Drawn {
  const indices = currentOf(state, drawn.spans);
  const current = indices.join(' ');
  if (before && before.current === current) return { ...drawn, current, shown: before.shown };
  const marked: Decoration[] = [];
  for (const i of indices) {
    // The paragraphs of a run stand one after the other in what holds them.
    state.doc.nodesBetween(drawn.spans[i].from, drawn.spans[i].to, (node, pos) => {
      if (node.type.name !== 'paragraph') return true;
      marked.push(Decoration.node(pos, pos + node.nodeSize, { 'data-current': '' }));
      return false;
    });
  }
  return {
    ...drawn,
    current,
    shown: marked.length ? drawn.runs.add(state.doc, marked) : drawn.runs,
  };
}

/**
 * Draws the brackets of the runs: their lines and labels, and which run the
 * cursor is in. `own` gives the kinds of the writer's own, and `name` the
 * words for a kind.
 *
 * A run is found from the kinds of paragraphs and from what stands between
 * them, and from nothing within their lines: a change that only writes in
 * lines (`withinLines`), as a keystroke does, moves the brackets with the
 * text and finds no run anew; one that only moves the cursor changes only
 * which run is current. Any other change, and the word that the kinds of
 * the writer's own or their names have changed (a transaction with this
 * plugin's key as its meta, which `redrawShape` sends), draws them anew
 * from the whole text, which took some milliseconds on every keystroke and
 * every arrow key in a text of 2000 paragraphs.
 */
export function runBrackets(
  own: () => readonly BasedKind[] = () => [],
  name: (kind: string) => string = (kind) => kind,
): Plugin<Drawn> {
  return new Plugin<Drawn>({
    key: bracketsKey,
    state: {
      init: (_config, state) => withCurrent(state, brackets(state, own(), name)),
      apply: (tr, drawn, _old, state) => {
        if (tr.getMeta(bracketsKey) || (tr.docChanged && !withinLines(tr)))
          return withCurrent(state, brackets(state, own(), name));
        if (tr.docChanged)
          return withCurrent(
            state,
            {
              runs: drawn.runs.map(tr.mapping, tr.doc),
              spans: drawn.spans.map(({ from, to }) => ({
                from: tr.mapping.map(from, -1),
                to: tr.mapping.map(to, 1),
              })),
            },
            { current: drawn.current, shown: drawn.shown.map(tr.mapping, tr.doc) },
          );
        return tr.selectionSet
          ? withCurrent(state, drawn, { current: drawn.current, shown: drawn.shown })
          : drawn;
      },
    },
    props: { decorations: (state) => bracketsKey.getState(state)?.shown },
  });
}
