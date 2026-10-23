/** The behaviour of an editor: keys, rules for what is typed, the placeholder. */

import {
  baseKeymap,
  chainCommands,
  createParagraphNear,
  exitCode,
  joinBackward,
  liftEmptyBlock,
  selectNodeBackward,
  deleteSelection,
  splitBlock,
} from 'prosemirror-commands';
import { dropCursor } from 'prosemirror-dropcursor';
import { gapCursor } from 'prosemirror-gapcursor';
import { InputRule, inputRules, undoInputRule } from 'prosemirror-inputrules';
import { keymap } from 'prosemirror-keymap';
import type { Schema } from 'prosemirror-model';
import {
  NodeSelection,
  Plugin,
  PluginKey,
  TextSelection,
  type Command,
  type EditorState,
  type Transaction,
} from 'prosemirror-state';
import { ySyncPluginKey } from 'y-prosemirror';
import { rows } from '$lib/figures/placing';
import { tablePlugins } from '$lib/tables/plugins';
import { newId } from '$lib/util/id';
import { keyWent, OPEN } from './ui.svelte';
import { Decoration, DecorationSet, type EditorView } from 'prosemirror-view';
import {
  insertEquation,
  insertFootnote,
  insertMath,
  isAtEnd,
  isAtStart,
  kindOf,
  leaveCaption,
  setKind,
  toggle,
} from './commands';
import { runBrackets } from './brackets';
import { breakKey, enterKey, indentKey, joinLineKey, lineMarks } from './keys';
import { kindName } from './kinds';
import { LAYOUT_NUMBERS, stretchNumbersPlugin, type NumbersLayout } from './numbers';
import { acrossParallel, backOutOfParallel } from './parallel';
import { refMarkKey } from './refmarks';

export type KeyAction =
  | 'enter'
  | 'escape'
  | 'up-out'
  | 'down-out'
  | 'backspace-at-start'
  | 'delete-at-end'
  | 'tab'
  | 'shift-tab';

export interface EditorHooks {
  undo: () => void;
  redo: () => void;
  /** Keys that may mean something outside the text. Returns whether it took the key. */
  action?: (action: KeyAction, view: EditorView) => boolean;
  /** Asks for a work to cite. `typed` is true when the user typed "@". */
  cite?: (view: EditorView, typed: boolean) => void;
  /** Asks for a picture, and puts a figure with it where the cursor is. */
  picture?: (view: EditorView) => void;
  /**
   * Asks what the text is to point to, and puts the words where the cursor
   * is; or, with `at`, in place of the words that stand there.
   */
  point?: (view: EditorView, at?: number) => void;
  /** The element whose text the editor holds, by which what stands in it is numbered. */
  element?: string;
  /**
   * The element in view, in whose document what stands in the text is
   * numbered and pointed to. Where it is not given, the tree under the
   * project the element stands in.
   */
  at?: string;
  /**
   * The kinds of paragraph of the writer's own, by which Tab knows a line
   * of verse, the count which lines are counted, and the brackets the
   * names of runs: as the kind it is based on has it. None, where they are
   * not given.
   */
  passageKinds?: () => { id: string; name?: string; basedOn: string }[];
  /** Asks how the lines where the cursor is are numbered, in the dialog of it (ADR 0041). */
  askNumbers?: (view: EditorView) => void;
  /** Asks for the language of what is selected, by its tag; `tag` is the one it has now. */
  askLanguage?: (view: EditorView, tag: string | null) => void;
  /** The language of the document whose text the editor holds, as a tag; nothing where it is not known. */
  language?: () => string | null;
  /** What the document's layout says of the numbers of a stretch that does not say: every how many, and on which side. */
  numbers?: () => NumbersLayout;
}

/**
 * A figure, a table or an equation is pointed to by its id. One that has none, or
 * has that of another in the same text, as when it was copied, is given one
 * of its own. What others have written is left to them.
 */
function ids(): Plugin {
  return new Plugin({
    appendTransaction(transactions, _before, state) {
      if (!transactions.some((tr) => tr.docChanged && !tr.getMeta(ySyncPluginKey))) return null;
      const seen = new Set<string>();
      let tr: Transaction | null = null;
      state.doc.descendants((node, pos) => {
        const name = node.type.name;
        if (name !== 'figure' && name !== 'equation' && name !== 'tabular')
          return !node.isTextblock;
        const id = String(node.attrs.id ?? '');
        if (!id || seen.has(id)) {
          tr ??= state.tr;
          tr.setNodeMarkup(pos, undefined, { ...node.attrs, id: newId() });
        } else seen.add(id);
        return false;
      });
      return tr;
    },
  });
}

const dashes = [
  // Three hyphens make an em dash, two an en dash. The third hyphen finds the
  // en dash that the first two made.
  new InputRule(/–-$/, '—'),
  new InputRule(/--$/, '–'),
  new InputRule(/\.\.\.$/, '…'),
];

/** What prosemirror-inputrules puts for a leaf, such as a line mark, in the text it matches. */
const LEAF = '\uFFFC';

/**
 * A rule that makes a text paragraph of a kind when a sign is typed at its
 * start: "> " a quotation, "- " an item, "1. " a numbered item; one that
 * begins at another number is given that number by hand, in the mark of
 * its line. The sign is taken away.
 */
function kindRule(
  regexp: RegExp,
  kind: string,
  number?: (match: RegExpMatchArray) => string | null,
) {
  return new InputRule(regexp, (state, match, from, end) => {
    // The rules read a leaf in the text before as the object replacement
    // character, so a line mark at the start of the line is in the match:
    // the sign begins after it.
    const start = match[0].startsWith(LEAF) ? from + 1 : from;
    const $start = state.doc.resolve(start);
    const paragraph = $start.parent;
    if (paragraph.type.name !== 'paragraph' || paragraph.attrs.kind !== 'text') return null;
    // Only at the very start of the paragraph, after the mark of its line if it has one.
    const marks = paragraph.firstChild?.type.name === 'linemark' ? 1 : 0;
    if ($start.parentOffset !== marks) return null;
    const tr = state.tr
      .delete(start, end)
      .setNodeMarkup($start.before(), undefined, { ...paragraph.attrs, kind });
    const given = number?.(match);
    const linemark = state.schema.nodes.linemark;
    if (given && linemark) {
      const at = $start.start();
      const had = marks ? paragraph.firstChild : null;
      if (had) tr.setNodeMarkup(at, undefined, { ...had.attrs, number: given });
      else tr.insert(at, linemark.create({ number: given }));
    }
    return tr;
  });
}

function blockRules(schema: Schema): InputRule[] {
  if (!schema.nodes.linemark) return [];
  return [
    kindRule(/^\uFFFC?\s*>\s$/, 'quote'),
    kindRule(/^\uFFFC?\s*([-+*])\s$/, 'item'),
    kindRule(/^\uFFFC?(\d+)\.\s$/, 'numbered', (match) => (match[1] === '1' ? null : match[1])),
  ];
}

const placeholderKey = new PluginKey('placeholder');

/** Shows words in an empty text. They are not part of the text. */
export function placeholder(text: () => string): Plugin {
  return new Plugin({
    key: placeholderKey,
    props: {
      decorations(state: EditorState) {
        const { doc } = state;
        const first = doc.firstChild;
        // A figure of which nothing is said yet is not an empty text.
        if (doc.childCount !== 1 || first?.type.name === 'figure') return null;
        if (!first?.isTextblock || first.content.size > 0) return null;
        const words = text();
        if (!words) return null;
        return DecorationSet.create(doc, [
          Decoration.node(0, first.nodeSize, { class: 'is-empty', 'data-placeholder': words }),
        ]);
      },
    },
  });
}

function act(
  hooks: EditorHooks,
  action: KeyAction,
  when?: (state: EditorState, view: EditorView) => boolean,
): Command {
  return (state, _dispatch, view) => {
    if (!view || !hooks.action) return false;
    if (when && !when(state, view)) return false;
    return hooks.action(action, view);
  };
}

/** Whether the cursor is on the first or last line of the text, as it is laid out. */
function onEdgeLine(view: EditorView, edge: 'top' | 'bottom'): boolean {
  const { state } = view;
  if (!state.selection.empty) return false;
  try {
    const { $from } = state.selection;
    if (edge === 'top') {
      const first = TextSelection.atStart(state.doc).$from;
      return $from.start() === first.start() && view.endOfTextblock('up');
    }
    const last = TextSelection.atEnd(state.doc).$to;
    return $from.end() === last.end() && view.endOfTextblock('down');
  } catch {
    return false;
  }
}

/** What is opened by Enter when it is selected: what has a box of its own. */
const OPENED = ['citation', 'footnote', 'math', 'equation', 'figure', 'crossref', 'refmark'];

/**
 * Opens what is selected, if it is something that has a box of its own. The
 * arrows select such things on their way through the text without opening
 * them; Enter opens the one the cursor has stopped at.
 */
export const openSelected: Command = (state, _dispatch, view) => {
  const { selection } = state;
  if (!(selection instanceof NodeSelection) || !OPENED.includes(selection.node.type.name))
    return false;
  const dom = view?.nodeDOM(selection.from);
  if (!dom) return false;
  dom.dispatchEvent(new CustomEvent(OPEN));
  return true;
};

/** Sees the keys that move the cursor, so that what it passes is not opened. */
export function passes(): Plugin {
  return new Plugin({
    props: {
      handleKeyDown(view, event) {
        keyWent(view, event);
        return false;
      },
    },
  });
}

export function bodyPlugins(schema: Schema, hooks: EditorHooks): Plugin[] {
  const br = schema.nodes.hard_break;
  // The kinds of the writer's own, for what they are based on: a line of verse, a kind that is counted, the name of a run.
  const own = () => hooks.passageKinds?.() ?? [];

  const keys: Record<string, Command> = {
    'Mod-z': () => (hooks.undo(), true),
    'Mod-y': () => (hooks.redo(), true),
    'Shift-Mod-z': () => (hooks.redo(), true),
    'Mod-b': toggle('strong'),
    'Mod-i': toggle('em'),
    'Mod-u': toggle('underline'),
    'Mod-.': toggle('sup'),
    'Mod-,': toggle('sub'),
    'Shift-Mod-k': toggle('smallcaps'),
    'Shift-Mod-x': toggle('strike'),
    "Mod-'": (state, dispatch, view) =>
      setKind(kindOf(state) === 'quote' ? 'text' : 'quote', own())(state, dispatch, view),
    'Shift-Mod-8': (state, dispatch, view) =>
      setKind(kindOf(state) === 'item' ? 'text' : 'item', own())(state, dispatch, view),
    'Shift-Mod-7': (state, dispatch, view) =>
      setKind(kindOf(state) === 'numbered' ? 'text' : 'numbered', own())(state, dispatch, view),
    'Mod-Alt-f': insertFootnote,
    'Mod-Alt-m': insertMath,
    'Mod-Alt-e': insertEquation,
    'Mod-Alt-p': (_state, _dispatch, view) => {
      if (view && hooks.picture) hooks.picture(view);
      return !!hooks.picture;
    },
    'Mod-Alt-r': (_state, _dispatch, view) => {
      if (view && hooks.point) hooks.point(view);
      return !!hooks.point;
    },
    'Mod-Alt-k': refMarkKey,
    'Shift-Mod-c': (_state, _dispatch, view) => {
      if (view && hooks.cite) hooks.cite(view, false);
      return !!hooks.cite;
    },
    Escape: act(hooks, 'escape'),
    ArrowUp: act(hooks, 'up-out', (_s, view) => onEdgeLine(view, 'top')),
    ArrowDown: act(hooks, 'down-out', (_s, view) => onEdgeLine(view, 'bottom')),
    Backspace: chainCommands(
      undoInputRule,
      deleteSelection,
      act(
        hooks,
        'backspace-at-start',
        (state) => isAtStart(state) && state.selection.$from.depth === 1,
      ),
      backOutOfParallel,
      joinLineKey,
      joinBackward,
      selectNodeBackward,
    ),
    Delete: chainCommands(
      deleteSelection,
      act(hooks, 'delete-at-end', (state) => isAtEnd(state) && state.selection.$from.depth === 1),
    ),
  };
  // The same in every kind of paragraph: see `keys.ts`.
  keys.Enter = chainCommands(
    openSelected,
    leaveCaption,
    enterKey,
    createParagraphNear,
    liftEmptyBlock,
    splitBlock,
  );
  // In a table, the table's own Tab comes first (its plugins stand before the keys); across texts side by side next.
  keys.Tab = chainCommands(acrossParallel(false), indentKey(1, own), act(hooks, 'tab'));
  keys['Shift-Tab'] = chainCommands(
    acrossParallel(true),
    indentKey(-1, own),
    act(hooks, 'shift-tab'),
  );
  if (br) {
    const hardBreak: Command = chainCommands(exitCode, breakKey);
    // Shift+Enter is the one line break: Ctrl+Enter is not a second.
    keys['Shift-Enter'] = hardBreak;
  }

  const cite = new Plugin({
    props: {
      handleTextInput(view, from, _to, text) {
        if (text !== '@' || !hooks.cite) return false;
        // Only where a word could begin: an address such as a@b is left alone.
        const before = view.state.doc.textBetween(Math.max(0, from - 1), from, '\n', ' ');
        if (before && !/[\s(\[{“"'‘—–;,]/.test(before)) return false;
        hooks.cite(view, true);
        return true;
      },
    },
  });

  return [
    passes(),
    inputRules({ rules: [...dashes, ...blockRules(schema)] }),
    cite,
    ids(),
    rows(),
    // The marks of lines kept at the start of their lines: see `keys.ts`.
    lineMarks(),
    // The numbers of the lines of a numbered stretch: see `numbers.ts`.
    stretchNumbersPlugin(own, () => hooks.numbers?.() ?? LAYOUT_NUMBERS),
    // The bracket of every run, with its name: see `brackets.ts`.
    runBrackets(own, (kind) => kindName(kind, own())),
    // Tables: before the keys of the text, since Tab and the arrows mean something of their own in them.
    ...tablePlugins(),
    keymap(keys),
    keymap(baseKeymap),
    dropCursor({ color: 'var(--accent)', width: 2 }),
    gapCursor(),
  ];
}

export function titlePlugins(hooks: EditorHooks): Plugin[] {
  const keys: Record<string, Command> = {
    'Mod-z': () => (hooks.undo(), true),
    'Mod-y': () => (hooks.redo(), true),
    'Shift-Mod-z': () => (hooks.redo(), true),
    'Mod-i': toggle('em'),
    'Mod-.': toggle('sup'),
    'Mod-,': toggle('sub'),
    'Shift-Mod-k': toggle('smallcaps'),
    Enter: chainCommands(
      openSelected,
      (_state, _dispatch, view) =>
        (view && hooks.action ? hooks.action('enter', view) : false) || true,
    ),
    'Shift-Enter': () => true,
    Escape: act(hooks, 'escape'),
    Tab: act(hooks, 'tab'),
    'Shift-Tab': act(hooks, 'shift-tab'),
    ArrowUp: act(hooks, 'up-out'),
    ArrowDown: act(hooks, 'down-out'),
    Backspace: chainCommands(
      deleteSelection,
      act(hooks, 'backspace-at-start', (state) => isAtStart(state)),
    ),
  };
  return [passes(), inputRules({ rules: dashes }), keymap(keys), keymap(baseKeymap)];
}
