/**
 * Undo for editors that share one history with the rest of the project.
 *
 * y-prosemirror has a plugin for this, but it destroys the history when an
 * editor is closed. Here the history belongs to the project; the plugin only
 * remembers where the cursor was, so that undoing puts it back.
 */

import { Plugin, PluginKey } from 'prosemirror-state';
import { getRelativeSelection, ySyncPluginKey } from 'y-prosemirror';
import type { UndoManager } from 'yjs';

type StackEvent = { stackItem: { meta: Map<unknown, unknown> } };

const key = new PluginKey<{ before: unknown }>('shared-undo');

export function sharedUndo(undoManager: UndoManager): Plugin {
  return new Plugin<{ before: unknown }>({
    key,
    state: {
      init: (): { before: unknown } => ({ before: null }),
      apply: (_tr, value, oldState, newState) => {
        const binding = ySyncPluginKey.getState(newState)?.binding;
        return binding ? { before: getRelativeSelection(binding, oldState) } : value;
      },
    },
    view: (view) => {
      const binding = () => ySyncPluginKey.getState(view.state)?.binding;
      const added = ({ stackItem }: StackEvent) => {
        const b = binding();
        if (b && view.hasFocus()) stackItem.meta.set(b, key.getState(view.state)?.before);
      };
      const popped = ({ stackItem }: StackEvent) => {
        const b = binding();
        const selection = b && stackItem.meta.get(b);
        if (b && selection) b.beforeTransactionSelection = selection;
      };
      undoManager.on('stack-item-added', added);
      undoManager.on('stack-item-popped', popped);
      return {
        destroy: () => {
          undoManager.off('stack-item-added', added);
          undoManager.off('stack-item-popped', popped);
        },
      };
    },
  });
}
