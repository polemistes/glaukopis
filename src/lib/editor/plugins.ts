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
import {
  InputRule,
  inputRules,
  textblockTypeInputRule,
  undoInputRule,
  wrappingInputRule,
} from 'prosemirror-inputrules';
import { keymap } from 'prosemirror-keymap';
import type { Schema } from 'prosemirror-model';
import { liftListItem, sinkListItem, splitListItem } from 'prosemirror-schema-list';
import {
  Plugin,
  PluginKey,
  TextSelection,
  type Command,
  type EditorState,
} from 'prosemirror-state';
import { Decoration, DecorationSet, type EditorView } from 'prosemirror-view';
import { insertFootnote, isAtEnd, isAtStart, toggle, toggleList, toggleQuote } from './commands';

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
}

const dashes = [
  // Three hyphens make an em dash, two an en dash. The third hyphen finds the
  // en dash that the first two made.
  new InputRule(/–-$/, '—'),
  new InputRule(/--$/, '–'),
  new InputRule(/\.\.\.$/, '…'),
];

function blockRules(schema: Schema): InputRule[] {
  const rules: InputRule[] = [];
  const { blockquote, bullet_list, ordered_list, paragraph } = schema.nodes;
  if (blockquote) rules.push(wrappingInputRule(/^\s*>\s$/, blockquote));
  if (bullet_list) rules.push(wrappingInputRule(/^\s*([-+*])\s$/, bullet_list));
  if (ordered_list) {
    rules.push(
      wrappingInputRule(
        /^(\d+)\.\s$/,
        ordered_list,
        (match) => ({ start: Number(match[1]) }),
        (match, node) => node.childCount + node.attrs.start === Number(match[1]),
      ),
    );
  }
  void paragraph;
  void textblockTypeInputRule;
  return rules;
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
        if (doc.childCount !== 1 || !first?.isTextblock || first.content.size > 0) return null;
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

export function bodyPlugins(schema: Schema, hooks: EditorHooks): Plugin[] {
  const item = schema.nodes.list_item;
  const br = schema.nodes.hard_break;

  const keys: Record<string, Command> = {
    'Mod-z': () => (hooks.undo(), true),
    'Mod-y': () => (hooks.redo(), true),
    'Shift-Mod-z': () => (hooks.redo(), true),
    'Mod-b': toggle('strong'),
    'Mod-i': toggle('em'),
    'Mod-.': toggle('sup'),
    'Mod-,': toggle('sub'),
    'Shift-Mod-k': toggle('smallcaps'),
    'Shift-Mod-x': toggle('strike'),
    "Mod-'": toggleQuote,
    'Shift-Mod-8': toggleList('bullet_list'),
    'Shift-Mod-7': toggleList('ordered_list'),
    'Mod-Alt-f': insertFootnote,
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
      joinBackward,
      selectNodeBackward,
    ),
    Delete: chainCommands(
      deleteSelection,
      act(hooks, 'delete-at-end', (state) => isAtEnd(state) && state.selection.$from.depth === 1),
    ),
  };
  if (item) {
    keys.Enter = chainCommands(
      splitListItem(item),
      createParagraphNear,
      liftEmptyBlock,
      splitBlock,
    );
    keys.Tab = chainCommands(sinkListItem(item), act(hooks, 'tab'));
    keys['Shift-Tab'] = chainCommands(liftListItem(item), act(hooks, 'shift-tab'));
  }
  if (br) {
    const hardBreak: Command = chainCommands(exitCode, (state, dispatch) => {
      if (dispatch) dispatch(state.tr.replaceSelectionWith(br.create()).scrollIntoView());
      return true;
    });
    keys['Shift-Enter'] = hardBreak;
    keys['Mod-Enter'] = hardBreak;
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
    inputRules({ rules: [...dashes, ...blockRules(schema)] }),
    cite,
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
    Enter: (_state, _dispatch, view) =>
      (view && hooks.action ? hooks.action('enter', view) : false) || true,
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
  return [inputRules({ rules: dashes }), keymap(keys), keymap(baseKeymap)];
}
