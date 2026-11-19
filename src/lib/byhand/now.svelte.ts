/**
 * What the tools in the head of a box of rich text show (ADR 0113): the
 * text as it stands now, with what is selected in it, and whether it is
 * being written in. Kept for each editor by a plugin of its own, and read
 * by the heads of the boxes of that editor, each of which shows its tools
 * while the cursor is in its box.
 */

import { Plugin, type EditorState } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';

class Now {
  /** The text and what is selected in it. */
  state = $state.raw<EditorState | null>(null);
  /** Whether the text has the cursor, or a tool of a head has taken it for a moment. */
  writing = $state(false);
}

const nows = new WeakMap<EditorView, Now>();

/** What the heads of an editor's boxes show of it. */
export function nowOf(view: EditorView): Now {
  let now = nows.get(view);
  if (!now) {
    now = new Now();
    now.state = view.state;
    now.writing = view.hasFocus();
    nows.set(view, now);
  }
  return now;
}

/** Whether what has the cursor is a tool of a head, or something a tool opened: a menu, a panel, the system's chooser of colours. */
function withTool(view: EditorView): boolean {
  const at = document.activeElement;
  if (!at) return false;
  if (view.dom.contains(at) && at.closest('.rich-head')) return true;
  return !!at.closest('.menu, .popover');
}

/** The plugin that keeps it, for the editor of a text. */
export function showsTools(): Plugin {
  return new Plugin({
    view(view) {
      const now = nowOf(view);
      let waiting: ReturnType<typeof setTimeout> | undefined;
      const focused = () => {
        clearTimeout(waiting);
        now.writing = true;
      };
      // A moment after the text has lost the cursor, which a tool may have taken.
      const blurred = () => {
        clearTimeout(waiting);
        waiting = setTimeout(() => {
          if (!view.isDestroyed) now.writing = view.hasFocus() || withTool(view);
        }, 150);
      };
      view.dom.addEventListener('focus', focused);
      view.dom.addEventListener('blur', blurred);
      // A tool that lets the cursor go is asked again whether the text is written in.
      view.dom.addEventListener('focusout', blurred);
      return {
        update(view) {
          now.state = view.state;
        },
        destroy() {
          clearTimeout(waiting);
          view.dom.removeEventListener('focus', focused);
          view.dom.removeEventListener('blur', blurred);
          view.dom.removeEventListener('focusout', blurred);
        },
      };
    },
  });
}
