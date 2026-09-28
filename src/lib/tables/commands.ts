/** What can be done to tables, as ProseMirror commands. */

import { Fragment, type Node, type ResolvedPos, type Schema } from 'prosemirror-model';
import { GapCursor } from 'prosemirror-gapcursor';
import {
  NodeSelection,
  Selection,
  TextSelection,
  type Command,
  type EditorState,
  type Transaction,
} from 'prosemirror-state';
import {
  CellSelection,
  TableMap,
  __insertCells as insertCells,
  addRowAfter,
  columnIsHeader,
  goToNextCell,
  isInTable,
  mergeCells,
  nextCell,
  rowIsHeader,
  selectedRect,
  selectionCell,
  splitCell,
  toggleHeader,
} from 'prosemirror-tables';
import type { EditorView } from 'prosemirror-view';
import { placeForBlock } from '$lib/editor/commands';
import { stand, tableWidth, type Stand } from '$lib/editor/schema';
import { newId } from '$lib/util/id';

/** The most rows and columns a table is made with when it is asked for by its size. */
export const MOST_ROWS = 100;
export const MOST_COLUMNS = 20;

/** A table that is to be made: what its cells hold, and what is said of it. */
export interface TableOf {
  /** What each cell holds, row by row. A line break parts paragraphs. */
  rows: string[][];
  /** Whether the first row holds the headings of the columns. */
  headerRow: boolean;
  /** Whether the first column holds the headings of the rows. */
  headerColumn: boolean;
  /** What is said of the table. */
  caption?: string;
}

// ---- making a table ----

/**
 * Whether what a cell holds is a number: figures, with a sign before them
 * or a sign for a share after, parted as any country parts them.
 */
export function isNumber(text: string): boolean {
  const t = text.trim();
  if (!/\d/.test(t)) return false;
  return /^[+\-−–]?\s?\d(?:[\d\s.,'’]*\d)?\s?[%‰]?$/.test(t);
}

/**
 * The columns that hold numbers: those in which every cell that holds
 * something, the headings apart, holds a number.
 */
export function numberColumns(given: TableOf): boolean[] {
  const width = Math.max(0, ...given.rows.map((r) => r.length));
  const out: boolean[] = [];
  for (let c = 0; c < width; c++) {
    if (given.headerColumn && c === 0) {
      out.push(false);
      continue;
    }
    const held = given.rows
      .slice(given.headerRow ? 1 : 0)
      .map((r) => (r[c] ?? '').trim())
      .filter(Boolean);
    out.push(held.length > 0 && held.every(isNumber));
  }
  return out;
}

/** The table as it stands in a text. Columns that hold numbers are set to the right. */
export function tableNode(schema: Schema, given: TableOf): Node | null {
  const { tabular, table_caption, table, table_row, table_cell, table_header, paragraph } =
    schema.nodes;
  if (!tabular || !table_caption || !table || !table_row || !table_cell || !table_header)
    return null;
  const width = Math.max(0, ...given.rows.map((r) => r.length));
  if (!given.rows.length || !width) return null;
  const numbers = numberColumns(given);
  const rows = given.rows.map((row, r) =>
    table_row.create(
      null,
      Array.from({ length: width }, (_, c) => {
        const heading = (given.headerRow && r === 0) || (given.headerColumn && c === 0);
        const lines = (row[c] ?? '').split(/\r?\n/).map((l) => l.trim());
        const held = lines.some(Boolean) ? lines.filter(Boolean) : [''];
        return (heading ? table_header : table_cell).create(
          numbers[c] ? { align: 'right' } : null,
          held.map((line) => paragraph.create(null, line ? schema.text(line) : undefined)),
        );
      }),
    ),
  );
  const said = (given.caption ?? '').trim();
  return tabular.create({ id: newId() }, [
    table_caption.create(null, said ? schema.text(said) : undefined),
    table.create(null, rows),
  ]);
}

/** An empty table of so many rows and columns. */
export function emptyTable(rows: number, columns: number, headerRow = true): TableOf {
  const r = Math.max(1, Math.min(MOST_ROWS, Math.round(rows) || 1));
  const c = Math.max(1, Math.min(MOST_COLUMNS, Math.round(columns) || 1));
  return {
    rows: Array.from({ length: r }, () => Array.from({ length: c }, () => '')),
    headerRow,
    headerColumn: false,
  };
}

/**
 * Puts a table into the text. `at` is where, when that is not where the
 * cursor is. The cursor goes into the first cell; or, where something is
 * said of the table already, what is said is selected, to be changed.
 */
export function insertTable(given: TableOf, at?: number): Command {
  return (state, dispatch) => {
    const type = state.schema.nodes.tabular;
    if (!type) return false;
    let from = state;
    if (at !== undefined) {
      try {
        const $at = state.doc.resolve(Math.max(0, Math.min(at, state.doc.content.size)));
        from = state.apply(state.tr.setSelection(Selection.near($at)));
      } catch {
        return false;
      }
    }
    const where = placeForBlock(from, type);
    if (!where) return false;
    const node = tableNode(state.schema, given);
    if (!node) return false;
    if (dispatch) {
      const tr = state.tr.replaceWith(where.from, where.to, node);
      const said = node.firstChild!;
      if (said.content.size) {
        tr.setSelection(
          TextSelection.create(tr.doc, where.from + 2, where.from + 2 + said.content.size),
        );
      } else {
        const first = tr.doc.resolve(where.from + 1 + said.nodeSize + 1);
        tr.setSelection(Selection.near(first, 1));
      }
      dispatch(tr.scrollIntoView());
    }
    return true;
  };
}

// ---- where the cursor is ----

export interface Around {
  /** Where the table stands in the text. */
  pos: number;
  node: Node;
}

/** The table the selection is in, or that is selected. */
export function tableAround(state: EditorState): Around | null {
  const { selection } = state;
  if (selection instanceof NodeSelection && selection.node.type.name === 'tabular')
    return { pos: selection.from, node: selection.node };
  const { $from } = selection;
  for (let d = $from.depth; d > 0; d--) {
    if ($from.node(d).type.name === 'tabular') return { pos: $from.before(d), node: $from.node(d) };
  }
  return null;
}

/** Whether the cursor is in what is said of a table. */
export function inCaption(state: EditorState): boolean {
  return state.selection.$from.parent.type.name === 'table_caption';
}

/** Where the rows of a table begin, given where the table stands in the text. */
function rowsOf(around: Around): { table: Node; start: number } | null {
  let found: { table: Node; start: number } | null = null;
  around.node.forEach((child, offset) => {
    if (child.type.name === 'table') found = { table: child, start: around.pos + 1 + offset + 1 };
  });
  return found;
}

/** What the tools of a table are shown by. */
export interface TableNow {
  pos: number;
  id: string;
  /** Whether the selection is among the cells, and not in what is said of the table. */
  cells: boolean;
  rows: number;
  columns: number;
  canJoin: boolean;
  canSplit: boolean;
  headerRow: boolean;
  headerColumn: boolean;
  /** Where what the cells that are selected hold stands; nothing, where they differ. */
  align: Stand | 'left' | null;
  numbered: boolean;
  width: number;
}

export function tableNow(state: EditorState): TableNow | null {
  const around = tableAround(state);
  const inner = around && rowsOf(around);
  if (!around || !inner) return null;
  const map = TableMap.get(inner.table);
  const cells = isInTable(state);
  let align: TableNow['align'] = null;
  if (cells) {
    const rect = selectedRect(state);
    const seen = new Set<string>();
    for (const at of map.cellsInRect(rect))
      seen.add(stand(inner.table.nodeAt(at)?.attrs.align) || 'left');
    align = seen.size === 1 ? ([...seen][0] as Stand) : null;
  }
  return {
    pos: around.pos,
    id: String(around.node.attrs.id ?? ''),
    cells,
    rows: map.height,
    columns: map.width,
    canJoin: cells && mergeCells(state),
    canSplit: cells && splitCell(state),
    headerRow: rowIsHeader(map, inner.table, 0),
    headerColumn: columnIsHeader(map, inner.table, 0),
    align,
    numbered: !!around.node.attrs.numbered,
    width: tableWidth(around.node.attrs.width),
  };
}

// ---- what is done to the whole table ----

/**
 * Does to the table what is done from among its cells, also where the
 * cursor is in what is said of the table: the cursor stays where it is.
 */
export function inTable(command: Command): Command {
  return (state, dispatch, view) => {
    if (isInTable(state)) return command(state, dispatch, view);
    const around = tableAround(state);
    const inner = around && rowsOf(around);
    if (!inner) return false;
    const within = state.apply(
      state.tr.setSelection(Selection.near(state.doc.resolve(inner.start), 1)),
    );
    if (!isInTable(within)) return false;
    return command(
      within,
      dispatch &&
        ((tr: Transaction) => {
          try {
            tr.setSelection(state.selection.map(tr.doc, tr.mapping));
          } catch {
            // Where the cursor was is no more: it is where the command put it.
          }
          dispatch(tr);
        }),
      view,
    );
  };
}

/** Whether the first row holds the headings of the columns, and the first column those of the rows. */
export const headingRow: Command = inTable(toggleHeader('row'));
export const headingColumn: Command = inTable(toggleHeader('column'));

/** Where what the cells that are selected hold stands in them. */
export function alignCells(to: Stand | 'left'): Command {
  const value = to === 'left' ? '' : to;
  return (state, dispatch) => {
    if (!isInTable(state)) return false;
    const rect = selectedRect(state);
    const tr = state.tr;
    for (const at of rect.map.cellsInRect(rect)) {
      const cell = rect.table.nodeAt(at);
      if (cell && stand(cell.attrs.align) !== value)
        tr.setNodeMarkup(rect.tableStart + at, undefined, { ...cell.attrs, align: value });
    }
    if (!tr.docChanged) return false;
    if (dispatch) dispatch(tr);
    return true;
  };
}

/** Says something of the table the cursor is in: whether it is numbered, how wide it is. */
export function setTable(change: Record<string, unknown>): Command {
  return (state, dispatch) => {
    const around = tableAround(state);
    if (!around) return false;
    if (dispatch)
      dispatch(state.tr.setNodeMarkup(around.pos, undefined, { ...around.node.attrs, ...change }));
    return true;
  };
}

/**
 * Takes something that stands by itself out of the text, with the row it
 * stood in if it stood there alone. Where nothing would be left, an empty
 * paragraph is. The cursor goes into the text beside where it stood.
 */
function takeOut(state: EditorState, pos: number): Transaction | null {
  const node = state.doc.nodeAt(pos);
  if (!node) return null;
  let $at = state.doc.resolve(pos);
  let from = pos;
  let to = pos + node.nodeSize;
  while ($at.depth > 0 && $at.parent.childCount === 1 && $at.parent.type.name === 'row') {
    from = $at.before();
    to = $at.after();
    $at = state.doc.resolve(from);
  }
  const tr = state.tr;
  const paragraph = state.schema.nodes.paragraph;
  if ($at.parent.canReplace($at.index(), $at.index() + 1)) {
    tr.delete(from, to);
    const $there = tr.doc.resolve(Math.min(from, tr.doc.content.size));
    tr.setSelection(
      Selection.findFrom($there, -1, true) ??
        Selection.findFrom($there, 1, true) ??
        Selection.near($there, -1),
    );
  } else if (paragraph && $at.parent.canReplaceWith($at.index(), $at.index() + 1, paragraph)) {
    tr.replaceWith(from, to, paragraph.create());
    tr.setSelection(TextSelection.create(tr.doc, from + 1));
  } else return null;
  return tr;
}

/** Removes the table the cursor is in. */
export const removeTable: Command = (state, dispatch) => {
  const around = tableAround(state);
  const tr = around && takeOut(state, around.pos);
  if (!tr) return false;
  if (dispatch) dispatch(tr.scrollIntoView());
  return true;
};

/** Whether nothing is written in the table, nor said of it. */
export function isBlank(tabular: Node): boolean {
  let blank = true;
  tabular.descendants((node) => {
    if (node.isInline) blank = false;
    return blank;
  });
  return blank;
}

// ---- keys ----

/** Whether the cursor is in the first or the last cell of its table. */
function atCell(state: EditorState, which: 'first' | 'last'): boolean {
  if (!isInTable(state)) return false;
  const $cell = selectionCell(state);
  const table = $cell.node(-1);
  const map = TableMap.get(table);
  const at = $cell.pos - $cell.start(-1);
  return at === (which === 'first' ? map.map[0] : map.map[map.map.length - 1]);
}

/**
 * Tab: to the next cell, and from the last cell to a new row. From what is
 * said of the table, to its first cell.
 */
export const tabForward: Command = (state, dispatch, view) => {
  if (inCaption(state)) {
    const around = tableAround(state);
    const inner = around && rowsOf(around);
    if (!inner) return false;
    if (dispatch) {
      const first = Selection.near(state.doc.resolve(inner.start), 1);
      dispatch(state.tr.setSelection(first).scrollIntoView());
    }
    return true;
  }
  if (!isInTable(state)) return false;
  if (goToNextCell(1)(state, dispatch, view)) return true;
  if (!dispatch) return true;
  // The row is added, and the cursor goes into it, as one step.
  let added: Transaction | null = null;
  addRowAfter(state, (tr) => (added = tr));
  if (!added) return true;
  const after = state.apply(added);
  goToNextCell(1)(after, (tr) => {
    (added as Transaction).setSelection(tr.selection.map(tr.doc, tr.mapping));
  });
  dispatch((added as Transaction).scrollIntoView());
  return true;
};

/** Shift-Tab: to the cell before, and from the first cell to what is said of the table. */
export const tabBack: Command = (state, dispatch, view) => {
  if (!isInTable(state)) return false;
  if (goToNextCell(-1)(state, dispatch, view)) return true;
  const around = tableAround(state);
  if (!around || !atCell(state, 'first')) return true;
  if (dispatch) {
    const said = around.node.firstChild;
    const end = around.pos + 1 + (said ? said.nodeSize - 1 : 1);
    dispatch(state.tr.setSelection(TextSelection.create(state.doc, end)).scrollIntoView());
  }
  return true;
};

/**
 * Backspace at the beginning of the first cell of a table in which nothing
 * is written, and of which nothing is said: the table was not wanted, and
 * is taken away. In a table that holds something the key does what it does
 * in any text, and does not harm the table.
 */
export const removeBlankTable: Command = (state, dispatch) => {
  const { selection } = state;
  if (!selection.empty || !atCell(state, 'first')) return false;
  if (selection.$from.parentOffset > 0 || selection.$from.index(-1) > 0) return false;
  const around = tableAround(state);
  if (!around || !isBlank(around.node)) return false;
  return removeTable(state, dispatch);
};

/** Whether the table is shown with what is said of it under it. */
function captionBelow(view: EditorView | undefined, pos: number): boolean {
  const dom = view?.nodeDOM(pos);
  return dom instanceof HTMLElement && dom.dataset.caption === 'below';
}

/**
 * The cursor in a table that is come to from over it or from under it: in
 * what is said of it, where that is on the side that is come from, and in
 * its nearest row otherwise.
 */
function into(
  state: EditorState,
  view: EditorView | undefined,
  around: Around,
  dir: -1 | 1,
): Selection | null {
  const below = captionBelow(view, around.pos);
  const said = around.node.firstChild;
  if (said && (dir > 0 ? !below : below))
    return TextSelection.create(state.doc, around.pos + 1 + (dir > 0 ? 1 : said.nodeSize - 1));
  const inner = rowsOf(around);
  if (!inner) return null;
  const map = TableMap.get(inner.table);
  const cell = dir > 0 ? map.map[0] : map.map[map.map.length - map.width];
  return Selection.near(state.doc.resolve(inner.start + cell + 1), 1);
}

/** The cursor beside a table, in what stands before it or after it; between, where there is nothing. */
function beside(
  state: EditorState,
  view: EditorView | undefined,
  around: Around,
  dir: -1 | 1,
): Selection | null {
  const edge = dir < 0 ? around.pos : around.pos + around.node.nodeSize;
  const $edge = state.doc.resolve(edge);
  const next = dir < 0 ? $edge.nodeBefore : $edge.nodeAfter;
  if (next?.type.name === 'tabular')
    return into(state, view, { pos: dir < 0 ? edge - next.nodeSize : edge, node: next }, dir);
  if (next) {
    const found = Selection.findFrom($edge, dir, true);
    // Not beyond what stands next to it.
    if (found && (dir < 0 ? found.from >= edge - next.nodeSize : found.to <= edge + next.nodeSize))
      return found;
  }
  // What GapCursor knows of a place it is not told of here: see prosemirror-gapcursor.
  const valid = (GapCursor as unknown as { valid: ($pos: ResolvedPos) => boolean }).valid;
  if (valid($edge)) return new GapCursor($edge);
  return Selection.findFrom($edge, dir, true);
}

/**
 * The arrows up and down at the edges of a table, which is shown with what
 * is said of it over it or under it: the cursor goes where the eye goes.
 */
export function leaveByArrow(dir: -1 | 1): Command {
  return (state, dispatch, view) => {
    const { selection } = state;
    if (!view || !(selection instanceof TextSelection) || !selection.empty) return false;
    const around = tableAround(state);
    const inner = around && rowsOf(around);
    if (!around || !inner) return false;
    if (!view.endOfTextblock(dir < 0 ? 'up' : 'down')) return false;
    const below = captionBelow(view, around.pos);
    const said = around.node.firstChild;
    const caption = said
      ? TextSelection.create(state.doc, around.pos + 1 + (dir < 0 ? said.nodeSize - 1 : 1))
      : null;
    let to: Selection | null = null;

    if (inCaption(state)) {
      // Towards the table, into its nearest row; away from it, out of the table.
      if (below ? dir < 0 : dir > 0) {
        const map = TableMap.get(inner.table);
        const cell = dir > 0 ? map.map[0] : map.map[map.map.length - map.width];
        to = Selection.near(state.doc.resolve(inner.start + cell + 1), 1);
      } else to = beside(state, view, around, dir);
    } else if (isInTable(state)) {
      const $cell = selectionCell(state);
      const { $from } = selection;
      // Only from the first or the last paragraph of the cell, in a row at the edge.
      const edge =
        dir < 0 ? $from.index(-1) === 0 : $from.indexAfter(-1) === $cell.nodeAfter?.childCount;
      if (!edge || nextCell($cell, 'vert', dir)) return false;
      // Towards what is said of the table, to that; away from it, out of the table.
      to = (below ? dir > 0 : dir < 0) ? caption : beside(state, view, around, dir);
    } else return false;

    if (!to || to.eq(selection)) return false;
    if (dispatch) dispatch(state.tr.setSelection(to).scrollIntoView());
    return true;
  };
}

// ---- pasting ----

/** Text in which tabs part the values, as the cells of a table. Nothing, where it has no tabs. */
export function cellsOfText(schema: Schema, text: string) {
  if (!text.includes('\t')) return null;
  const { table_cell, paragraph } = schema.nodes;
  if (!table_cell || !paragraph) return null;
  const lines = text.replace(/\r\n?/g, '\n').replace(/\n+$/, '').split('\n');
  const width = Math.max(...lines.map((l) => l.split('\t').length));
  const rows = lines.map((line) => {
    const values = line.split('\t');
    return Fragment.from(
      Array.from({ length: width }, (_, c) => {
        const value = (values[c] ?? '').trim();
        return table_cell.create(
          null,
          paragraph.create(null, value ? schema.text(value) : undefined),
        );
      }),
    );
  });
  return { width, height: rows.length, rows };
}

/** Fills the cells from where the cursor is with text in which tabs part the values. */
export function pasteText(text: string): Command {
  return (state, dispatch) => {
    if (!isInTable(state)) return false;
    const cells = cellsOfText(state.schema, text);
    if (!cells) return false;
    if (dispatch) {
      const $cell = selectionCell(state);
      const start = $cell.start(-1);
      const rect =
        state.selection instanceof CellSelection
          ? selectedRect(state)
          : TableMap.get($cell.node(-1)).findCell($cell.pos - start);
      insertCells(state, dispatch, start, rect, cells);
    }
    return true;
  };
}

/**
 * What was copied from a spreadsheet or a page, in which a table is a
 * `<table>` and nothing more, as this text has its tables: with what is
 * said of them, which is what the table had for a caption, or nothing.
 * What was copied from a text of ours is as it should be, but for cells
 * that were copied by themselves, which become a table of their own.
 */
export function tablesOfHtml(html: string): string {
  if (!/<(table|tr)[\s>]/i.test(html)) return html;
  const read = new DOMParser().parseFromString(html, 'text/html');
  const ours = read.querySelector('[data-pm-slice]');
  if (ours) {
    const rows = [...read.querySelectorAll('tr')];
    if (!rows.length || read.querySelector('figure[data-table]')) return html;
    const figure = wrap(read, rows);
    figure.setAttribute('data-pm-slice', '0 0 []');
    return figure.outerHTML;
  }
  for (const table of [...read.querySelectorAll('table')]) {
    // A table within a table is what the cell holds, which is text here.
    if (table.parentElement?.closest('table, figure[data-table]')) continue;
    const said = table.querySelector(':scope > caption');
    said?.remove();
    const figure = wrap(read, null, said);
    table.replaceWith(figure);
    figure.append(table);
  }
  return read.body.innerHTML;
}

function wrap(doc: Document, rows: Element[] | null, said: Element | null = null): HTMLElement {
  const figure = doc.createElement('figure');
  figure.setAttribute('data-table', '');
  const caption = doc.createElement('figcaption');
  if (said) caption.append(...said.childNodes);
  figure.append(caption);
  if (rows) {
    const table = doc.createElement('table');
    const body = doc.createElement('tbody');
    body.append(...rows);
    table.append(body);
    figure.append(table);
  }
  return figure;
}
