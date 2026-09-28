/**
 * Tables in an editor: the keys, what is pasted, how they are drawn, and
 * the tools that are shown while the cursor is in one.
 */

import { keymap } from 'prosemirror-keymap';
import { Plugin, PluginKey } from 'prosemirror-state';
import { isInTable, tableEditing } from 'prosemirror-tables';
import { askForTable } from './ask';
import {
  leaveByArrow,
  pasteText,
  removeBlankTable,
  tabBack,
  tabForward,
  tablesOfHtml,
} from './commands';
import { CaptionView, TableTools, TabularView } from './views.svelte';

const toolsKey = new PluginKey('table-tools');

/**
 * Cells are selected, written in and pasted into as prosemirror-tables
 * has it; the width of a column is not set by dragging.
 */
export function tablePlugins(): Plugin[] {
  let tools: TableTools | null = null;

  const keys = keymap({
    Tab: tabForward,
    'Shift-Tab': tabBack,
    Backspace: removeBlankTable,
    ArrowUp: leaveByArrow(-1),
    ArrowDown: leaveByArrow(1),
    'Mod-Alt-t': (_state, _dispatch, view) => {
      if (view) askForTable(view);
      return !!view;
    },
  });

  const shown = new Plugin({
    key: toolsKey,
    view(view) {
      const made = new TableTools(view);
      tools = made;
      return {
        update: () => made.update(),
        destroy: () => {
          made.destroy();
          if (tools === made) tools = null;
        },
      };
    },
    props: {
      nodeViews: {
        tabular: (node, view, getPos) => new TabularView(node, view, getPos),
        table_caption: (node) => new CaptionView(node),
      },
      // A table that is pasted among cells fills the cells; elsewhere it is a table of its own.
      transformPastedHTML: (html, view) => (isInTable(view.state) ? html : tablesOfHtml(html)),
      handlePaste(view, event) {
        const data = event.clipboardData;
        if (!data || !isInTable(view.state) || data.getData('text/html')) return false;
        return pasteText(data.getData('text/plain'))(view.state, view.dispatch);
      },
      handleDOMEvents: {
        focus: () => {
          tools?.refresh();
          return false;
        },
        blur: () => {
          tools?.later();
          return false;
        },
        contextmenu: (_view, event) => tools?.menu(event) ?? false,
        mousedown: (_view, event) => {
          // The other button of the pointer leaves the cells that are selected as they are.
          const cell = (event.target as HTMLElement | null)?.closest?.('td, th');
          if (event.button !== 2 || !cell?.classList.contains('selectedCell')) return false;
          event.preventDefault();
          return true;
        },
      },
    },
  });

  return [keys, shown, tableEditing()];
}
