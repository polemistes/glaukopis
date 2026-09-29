/** How tables appear in the text, and the tools that are shown while the cursor is in one. */

import type { Node } from 'prosemirror-model';
import { Selection, TextSelection, type Command } from 'prosemirror-state';
import {
  CellSelection,
  addColumnAfter,
  addColumnBefore,
  addRowAfter,
  addRowBefore,
  cellAround,
  deleteColumn,
  deleteRow,
  mergeCells,
  splitCell,
} from 'prosemirror-tables';
import type { EditorView, NodeView } from 'prosemirror-view';
import { mount, unmount } from 'svelte';
import { currentProject } from '$lib/editor/references.svelte';
import { tableWidth, type Stand } from '$lib/editor/schema';
import { hooksOf } from '$lib/editor/ui.svelte';
import { numbering } from '$lib/figures/numbering.svelte';
import { standAlone, standBeside, usualOf, type Usual } from '$lib/figures/placing';
import { figureLabel, numberOf, showPlacing } from '$lib/figures/views.svelte';
import { t } from '$lib/i18n';
import { place, type RectLike } from '$lib/ui/floating';
import { openContextMenu, type MenuItem } from '$lib/ui/menu.svelte';
import {
  alignCells,
  headingColumn,
  headingRow,
  removeTable,
  setTable,
  tableNow,
  type TableNow,
} from './commands';
import { dress, say } from './look';
import TableBar from './TableBar.svelte';
import TablePanel from './TablePanel.svelte';

/** How wide the table is, of the text: said beside what else is said of how it is drawn. */
function wide(el: HTMLElement, width: number) {
  const now = width ? `${width}%` : '';
  if (el.style.getPropertyValue('--table-width') === now) return;
  if (now) el.style.setProperty('--table-width', now);
  else el.style.removeProperty('--table-width');
}

/** The format of the document the text of an editor is part of, when it has been read. */
function formatOf(view: EditorView) {
  const element = hooksOf.get(view)?.element;
  const project = currentProject();
  const map = element ? project?.node(element)?.map : undefined;
  return project && map ? numbering.formatOf(project, map) : undefined;
}

/**
 * A table as it stands in the text: what is said of it, with the word and
 * the number before it, and the table. Which of the two is shown over the
 * other is said by the format of the document; in the text what is said
 * comes first.
 */
export class TabularView implements NodeView {
  dom: HTMLElement;
  contentDOM: HTMLElement;
  #node: Node;
  #view: EditorView;
  #getPos: () => number | undefined;
  /** Rises when the table or the text around it has changed, and its number may have. */
  #moved = $state(0);
  #stop: () => void;
  #gone = false;

  constructor(node: Node, view: EditorView, getPos: () => number | undefined) {
    this.#node = node;
    this.#view = view;
    this.#getPos = getPos;
    this.dom = document.createElement('figure');
    this.dom.className = 'tabular';
    this.dom.setAttribute('data-table', '');
    this.contentDOM = this.dom;
    this.#read();

    this.#stop = $effect.root(() => {
      // The word and the number before what is said of it, as the document has them.
      $effect(() => {
        void this.#moved;
        const { number, counting } = numberOf(this.#view, 'table', this.#getPos());
        const label = figureLabel(
          !!this.#node.attrs.numbered,
          number,
          (this.#node.firstChild?.content.size ?? 0) > 0,
          counting,
          'table',
        );
        const said = this.dom.querySelector<HTMLElement>(':scope > figcaption');
        if (!said) {
          // It is drawn after the table that holds it.
          requestAnimationFrame(() => {
            if (!this.#gone) this.#moved++;
          });
          return;
        }
        say(said, 'data-label', label || null);
      });
      $effect(() => dress(this.dom, formatOf(this.#view)));
      // Where it stands, which the format says where nothing is said of it.
      $effect(() => {
        void this.#moved;
        this.#stand();
      });
    });
  }

  /** Where it stands and whether the text flows around it, as it will in the document. */
  #stand() {
    showPlacing(this.dom, this.#node.attrs, usualOf(formatOf(this.#view), 'table'), 'table');
  }

  #read() {
    const a = this.#node.attrs;
    const width = tableWidth(a.width);
    say(this.dom, 'data-id', a.id ? String(a.id) : null);
    say(this.dom, 'data-unnumbered', a.numbered ? null : '');
    say(this.dom, 'data-width', width ? String(width) : null);
    wide(this.dom, width);
    this.#stand();
    const blank = (this.#node.firstChild?.content.size ?? 0) === 0;
    if (this.dom.classList.contains('uncaptioned') !== blank)
      this.dom.classList.toggle('uncaptioned', blank);
    this.#moved++;
  }

  selectNode() {
    this.dom.classList.add('selected');
  }

  deselectNode() {
    this.dom.classList.remove('selected');
  }

  update(node: Node): boolean {
    if (node.type !== this.#node.type) return false;
    this.#node = node;
    this.#read();
    return true;
  }

  ignoreMutation(mutation: { type: string; target: globalThis.Node }): boolean {
    // What is written in the table is the editor's to read; what is said
    // of the table as a whole is set here.
    if (mutation.type === 'selection') return false;
    return mutation.type === 'attributes' && mutation.target === this.dom;
  }

  destroy() {
    this.#gone = true;
    this.#stop();
  }
}

/**
 * What is said of a table. The word and the number before it are put
 * there by the table: that is no change to what is written.
 */
export class CaptionView implements NodeView {
  dom: HTMLElement;
  contentDOM: HTMLElement;
  #node: Node;

  constructor(node: Node) {
    this.#node = node;
    this.dom = document.createElement('figcaption');
    this.contentDOM = this.dom;
  }

  update(node: Node): boolean {
    if (node.type !== this.#node.type) return false;
    this.#node = node;
    return true;
  }

  ignoreMutation(mutation: { type: string; target: globalThis.Node }): boolean {
    if (mutation.type === 'selection') return false;
    return mutation.type === 'attributes' && mutation.target === this.dom;
  }
}

/** The part of the window in which the text can be seen: what it scrolls in, within the window. */
function seenIn(el: HTMLElement): RectLike {
  let top = 0;
  let bottom = window.innerHeight;
  for (let p = el.parentElement; p; p = p.parentElement) {
    const flow = getComputedStyle(p).overflowY;
    if (flow !== 'auto' && flow !== 'scroll' && flow !== 'hidden') continue;
    const r = p.getBoundingClientRect();
    top = Math.max(top, r.top);
    bottom = Math.min(bottom, r.bottom);
  }
  return { left: 0, right: window.innerWidth, top, bottom, width: window.innerWidth, height: 0 };
}

/**
 * The tools of a table: a small bar over the table the cursor is in, a
 * panel for what is said of the table as a whole, and the same in a menu
 * on its cells. One for each editor.
 */
export class TableTools {
  /** The table the cursor is in, while its tools are shown. */
  now = $state.raw<TableNow | null>(null);
  readonly view: EditorView;
  #bar: HTMLElement | null = null;
  #barMounted: Record<string, unknown> | null = null;
  #panel: HTMLElement | null = null;
  #panelMounted: Record<string, unknown> | null = null;
  #watch: ResizeObserver | null = null;
  #waiting = 0;
  #gone = false;

  constructor(view: EditorView) {
    this.view = view;
    this.refresh();
  }

  /** Called by the editor when the text or the selection has changed. */
  update() {
    this.refresh();
  }

  /** Whether the cursor is in the text, or in something that belongs to the tools. */
  #active(): boolean {
    if (this.view.hasFocus()) return true;
    const at = document.activeElement;
    if (!at) return false;
    if (this.#bar?.contains(at) || this.#panel?.contains(at)) return true;
    // A menu of the tools has the cursor while it is open.
    return !!this.#bar && !!at.closest('.menu');
  }

  refresh = () => {
    if (this.#gone) return;
    const found = this.view.editable ? tableNow(this.view.state) : null;
    // Over text that is selected stands the bar that formats it: one bar at a time.
    const { selection } = this.view.state;
    const formatted = selection instanceof TextSelection && !selection.empty && !this.#panel;
    const now = found && !formatted && (this.#active() || this.#panel) ? found : null;
    if (JSON.stringify(now) !== JSON.stringify(this.now)) this.now = now;
    if (!now) {
      this.#hide();
      return;
    }
    this.#show();
    this.#place();
  };

  /** A moment after the text has lost the cursor, which a tool may have taken. */
  later() {
    window.clearTimeout(this.#waiting);
    this.#waiting = window.setTimeout(this.refresh, 150);
  }

  #show() {
    if (this.#bar) return;
    const bar = document.createElement('div');
    bar.className = 'table-bar';
    document.body.append(bar);
    this.#bar = bar;
    this.#barMounted = mount(TableBar, { target: bar, props: { tools: this } });
    window.addEventListener('scroll', this.#follow, true);
    window.addEventListener('resize', this.#follow);
    if (typeof ResizeObserver !== 'undefined') {
      this.#watch = new ResizeObserver(this.#follow);
      this.#watch.observe(bar);
    }
  }

  #hide() {
    this.closePanel();
    if (!this.#bar) return;
    window.removeEventListener('scroll', this.#follow, true);
    window.removeEventListener('resize', this.#follow);
    this.#watch?.disconnect();
    this.#watch = null;
    if (this.#barMounted) void unmount(this.#barMounted);
    this.#barMounted = null;
    this.#bar.remove();
    this.#bar = null;
  }

  #follow = () => {
    requestAnimationFrame(() => this.#place());
  };

  /** The table as it is drawn. */
  #drawn(): HTMLElement | null {
    const now = this.now;
    if (!now) return null;
    try {
      const dom = this.view.nodeDOM(now.pos);
      return dom instanceof HTMLElement ? dom : null;
    } catch {
      return null;
    }
  }

  /** The bar stands over the table, within the part of the window the text is seen in. */
  #place() {
    const bar = this.#bar;
    const drawn = this.#drawn();
    if (!bar || !drawn) return;
    const table = drawn.getBoundingClientRect();
    const seen = seenIn(this.view.dom);
    const hidden = table.bottom < seen.top + 12 || table.top > seen.bottom - 12;
    if (bar.hidden !== hidden) bar.hidden = hidden;
    if (hidden) return;
    const top = Math.max(table.top, seen.top + bar.offsetHeight + 16);
    const bottom = Math.max(top, table.bottom);
    place(
      bar,
      {
        left: table.left,
        right: table.right,
        width: table.width,
        top,
        bottom,
        height: bottom - top,
      },
      { side: 'top', align: 'start', gap: 4 },
    );
    if (this.#panel) this.#placePanel();
  }

  run(command: Command) {
    command(this.view.state, this.view.dispatch, this.view);
    this.view.focus();
  }

  // ---- what is said of the whole table ----

  get panelOpen(): boolean {
    return !!this.#panel;
  }

  openPanel() {
    if (this.#panel || !this.now) return;
    const panel = document.createElement('div');
    panel.className = 'note-panel table-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', t('tables-table'));
    document.body.append(panel);
    this.#panel = panel;
    this.#panelMounted = mount(TablePanel, {
      target: panel,
      props: {
        tools: this,
        ontry: (width: number) => this.#try(width),
        onchange: (change: Record<string, unknown>) => {
          setTable(change)(this.view.state, this.view.dispatch);
          this.#follow();
        },
        onbeside: () => this.#move(standBeside),
        onalone: () => this.#move(standAlone),
        onremove: () => {
          this.closePanel();
          this.run(removeTable);
        },
        onclose: () => {
          this.closePanel();
          this.view.focus();
        },
      },
    });
    this.#watch?.observe(panel);
    requestAnimationFrame(() => this.#placePanel());
    window.addEventListener('pointerdown', this.#outside, true);
  }

  /** Beside what is before it, or by itself again: the table stays the one the tools are of. */
  #move(how: (pos: number) => Command) {
    const pos = this.now?.pos;
    if (pos === undefined) return;
    how(pos)(this.view.state, this.view.dispatch);
    this.#follow();
  }

  /** What the format of the document says of where tables stand. */
  usual(): Usual {
    return usualOf(formatOf(this.view), 'table');
  }

  /** While the width is being set: shown, and not yet kept. */
  #try(width: number) {
    const drawn = this.#drawn();
    if (!drawn) return;
    const w = tableWidth(width);
    say(drawn, 'data-width', w ? String(w) : null);
    wide(drawn, w);
  }

  /** Beside the table where there is room, and under the bar otherwise. */
  #placePanel() {
    const panel = this.#panel;
    const drawn = this.#drawn();
    if (!panel || !drawn) return;
    const table = drawn.getBoundingClientRect();
    const needed = panel.offsetWidth + 12 + 8;
    const right = window.innerWidth - table.right >= needed;
    if (right || table.left >= needed)
      place(panel, table, { side: right ? 'right' : 'left', align: 'start', gap: 12 });
    else place(panel, table, { side: 'bottom', align: 'start', gap: 8 });
  }

  #outside = (event: PointerEvent) => {
    const target = event.target as HTMLElement | null;
    if (!target || !this.#panel) return;
    if (this.#panel.contains(target) || this.#bar?.contains(target)) return;
    if (target.closest('.popover, .menu, dialog, .backdrop')) return;
    this.closePanel();
    this.later();
  };

  closePanel() {
    if (!this.#panel) return;
    window.removeEventListener('pointerdown', this.#outside, true);
    this.#watch?.unobserve(this.#panel);
    if (this.#panelMounted) void unmount(this.#panelMounted);
    this.#panelMounted = null;
    this.#panel.remove();
    this.#panel = null;
  }

  // ---- the same in a menu ----

  /** What can be done to the rows of the table. */
  rows(): MenuItem[] {
    const cells = !!this.now?.cells;
    return [
      { label: t('tables-row-above'), disabled: !cells, action: () => this.run(addRowBefore) },
      { label: t('tables-row-below'), disabled: !cells, action: () => this.run(addRowAfter) },
      { kind: 'separator' },
      {
        label: t('tables-row-remove'),
        disabled: !cells || (this.now?.rows ?? 0) < 2,
        action: () => this.run(deleteRow),
      },
    ];
  }

  columns(): MenuItem[] {
    const cells = !!this.now?.cells;
    return [
      {
        label: t('tables-column-before'),
        disabled: !cells,
        action: () => this.run(addColumnBefore),
      },
      {
        label: t('tables-column-after'),
        disabled: !cells,
        action: () => this.run(addColumnAfter),
      },
      { kind: 'separator' },
      {
        label: t('tables-column-remove'),
        disabled: !cells || (this.now?.columns ?? 0) < 2,
        action: () => this.run(deleteColumn),
      },
    ];
  }

  headings(): MenuItem[] {
    return [
      {
        label: t('tables-first-row-headings'),
        checked: !!this.now?.headerRow,
        action: () => this.run(headingRow),
      },
      {
        label: t('tables-first-column-headings'),
        checked: !!this.now?.headerColumn,
        action: () => this.run(headingColumn),
      },
    ];
  }

  align(to: Stand | 'left') {
    this.run(alignCells(to));
  }

  join() {
    this.run(mergeCells);
  }

  split() {
    this.run(splitCell);
  }

  /** Everything, for the menu on a cell. */
  all(): MenuItem[] {
    const now = this.now;
    const at = now?.align ?? null;
    return [
      ...this.rows().filter((i) => i.kind !== 'separator'),
      { kind: 'separator' },
      ...this.columns().filter((i) => i.kind !== 'separator'),
      { kind: 'separator' },
      { label: t('tables-join'), disabled: !now?.canJoin, action: () => this.join() },
      { label: t('tables-split'), disabled: !now?.canSplit, action: () => this.split() },
      { kind: 'separator' },
      ...this.headings(),
      { kind: 'separator' },
      { kind: 'heading', label: t('tables-cell-stands') },
      { label: t('tables-left'), checked: at === 'left', action: () => this.align('left') },
      { label: t('tables-middle'), checked: at === 'center', action: () => this.align('center') },
      { label: t('tables-right'), checked: at === 'right', action: () => this.align('right') },
      { kind: 'separator' },
      {
        label: t('tables-numbered'),
        checked: !!now?.numbered,
        action: () => this.run(setTable({ numbered: !now?.numbered })),
      },
      {
        label: t('tables-the-table'),
        hint: t('tables-the-table-hint'),
        action: () => this.openPanel(),
      },
      { label: t('tables-remove'), danger: true, action: () => this.run(removeTable) },
    ];
  }

  /**
   * The menu on a cell. The cell under the pointer is the one that is
   * meant, unless it is among those that are selected.
   */
  menu(event: MouseEvent): boolean {
    const view = this.view;
    const cell = (event.target as HTMLElement | null)?.closest?.('td, th');
    if (!view.editable || !cell || !view.dom.contains(cell)) return false;
    const at = view.posAtCoords({ left: event.clientX, top: event.clientY });
    const there = at ? view.state.doc.resolve(at.pos) : null;
    const pointed = there && cellAround(there);
    if (there && pointed) {
      const { selection } = view.state;
      const among =
        selection instanceof CellSelection
          ? cell.classList.contains('selectedCell')
          : cellAround(selection.$from)?.pos === pointed.pos &&
            cellAround(selection.$to)?.pos === pointed.pos;
      if (!among) {
        const near = TextSelection.near(there);
        const within = cellAround(near.$from)?.pos === pointed.pos;
        view.dispatch(
          view.state.tr.setSelection(
            within ? near : Selection.near(view.state.doc.resolve(pointed.pos + 1), 1),
          ),
        );
      }
    }
    // The tools are those of the table the menu is asked for in.
    const now = tableNow(view.state);
    if (!now) return false;
    this.now = now;
    this.#show();
    this.#place();
    openContextMenu(event, this.all());
    return true;
  }

  destroy() {
    this.#gone = true;
    window.clearTimeout(this.#waiting);
    this.#hide();
  }
}
