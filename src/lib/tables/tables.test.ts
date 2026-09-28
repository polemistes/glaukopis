import { DOMParser as Parser, type Node } from 'prosemirror-model';
import { EditorState, NodeSelection, Selection, TextSelection } from 'prosemirror-state';
import {
  CellSelection,
  addColumnAfter,
  deleteRow,
  mergeCells,
  splitCell,
} from 'prosemirror-tables';
import { EditorView } from 'prosemirror-view';
import {
  prosemirrorToYXmlFragment,
  ySyncPlugin,
  yXmlFragmentToProseMirrorRootNode,
} from 'y-prosemirror';
import { afterEach, describe, expect, it } from 'vitest';
import * as Y from 'yjs';
import { insertCitation, insertEquation, insertMath, leaveCaption } from '$lib/editor/commands';
import { bodyPlugins } from '$lib/editor/plugins';
import { bodySchema } from '$lib/editor/schema';
import { languages, t } from '$lib/i18n';
import { buildDocument } from '$lib/project/model/document';
import { blocksHtml } from '$lib/project/model/html';
import { Project } from '$lib/project/model/project.svelte';
import { bodyFacts, readBody, type TableBlock } from '$lib/project/model/text';
import { addTable } from './ask';
import {
  alignCells,
  emptyTable,
  headingColumn,
  headingRow,
  insertTable,
  isNumber,
  numberColumns,
  pasteText,
  removeBlankTable,
  removeTable,
  setTable,
  tabBack,
  tabForward,
  tableNode,
  tableNow,
  tablesOfHtml,
  type TableOf,
} from './commands';

let views: EditorView[] = [];

function editor(text = '', fragment?: Y.XmlFragment): EditorView {
  const place = document.body.appendChild(document.createElement('div'));
  const { paragraph } = bodySchema.nodes;
  const plugins = bodyPlugins(bodySchema, { undo: () => {}, redo: () => {} });
  const state = fragment
    ? EditorState.create({ schema: bodySchema, plugins: [ySyncPlugin(fragment), ...plugins] })
    : EditorState.create({
        schema: bodySchema,
        doc: bodySchema.node('doc', null, [
          paragraph.create(null, text ? bodySchema.text(text) : undefined),
        ]),
        plugins,
      });
  const view = new EditorView(place, { state });
  views.push(view);
  return view;
}

/** The blocks of the text, and of a table its rows: `h` for a heading, `c` for a cell, with what they hold. */
function shape(doc: Node): string {
  const out: string[] = [];
  doc.forEach((n) => {
    if (n.type.name === 'paragraph') out.push(`p:${n.textContent}`);
    else if (n.type.name === 'tabular') out.push(`table(${n.firstChild!.textContent})[${rows(n)}]`);
    else out.push(n.type.name);
  });
  return out.join(' ');
}

function rows(tabular: Node): string {
  const out: string[] = [];
  tabular.lastChild!.forEach((row) => {
    const cells: string[] = [];
    row.forEach((cell) => {
      const span =
        (cell.attrs.colspan > 1 ? `×${cell.attrs.colspan}` : '') +
        (cell.attrs.rowspan > 1 ? `↓${cell.attrs.rowspan}` : '');
      const to = cell.attrs.align ? `>${cell.attrs.align}` : '';
      cells.push(
        `${cell.type.name === 'table_header' ? 'h' : 'c'}${span}${to}:${cell.textContent}`,
      );
    });
    out.push(cells.join(','));
  });
  return out.join(' / ');
}

const POEMS: TableOf = {
  rows: [
    ['Work', 'Lines', 'Share'],
    ['Iliad', '15 693', '56,5 %'],
    ['Odyssey', '12 109', '43,5 %'],
  ],
  headerRow: true,
  headerColumn: false,
  caption: 'The poems',
};

/** Where the n-th cell of the text begins, counted along the rows; from the last, where n is less than nought. */
function cell(v: EditorView, n: number): number {
  const found: number[] = [];
  v.state.doc.descendants((node, pos) => {
    if (node.type.name === 'table_cell' || node.type.name === 'table_header') found.push(pos);
    return true;
  });
  return found[n < 0 ? found.length + n : n];
}

function cursorIn(v: EditorView, n: number, offset = 0) {
  v.dispatch(v.state.tr.setSelection(TextSelection.create(v.state.doc, cell(v, n) + 2 + offset)));
}

afterEach(() => {
  for (const v of views) v.destroy();
  views = [];
  document.body.innerHTML = '';
});

describe('a table is put into the text', () => {
  it('after the paragraph the cursor is in, with the cursor in its first cell', () => {
    const v = editor('Before');
    expect(insertTable(emptyTable(3, 3))(v.state, v.dispatch)).toBe(true);
    expect(shape(v.state.doc)).toBe('p:Before table()[h:,h:,h: / c:,c:,c: / c:,c:,c:]');
    const { $from } = v.state.selection;
    expect($from.node(-1).type.name).toBe('table_header');
    expect($from.pos).toBe(cell(v, 0) + 2);
    // It can be pointed to.
    expect(v.state.doc.child(1).attrs.id).toMatch(/^[0-9A-Za-z]{12}$/);
    expect(v.state.doc.child(1).attrs.numbered).toBe(true);
  });

  it('in the place of a paragraph that is empty, and of the size that was asked for', () => {
    const v = editor();
    insertTable(emptyTable(2, 4, false))(v.state, v.dispatch);
    expect(shape(v.state.doc)).toBe('table()[c:,c:,c:,c: / c:,c:,c:,c:]');
    expect(emptyTable(0, 500).rows.map((r) => r.length)).toEqual([20]);
    expect(emptyTable(5000, 1).rows.length).toBe(100);
  });

  it('where it was dropped, when that is not where the cursor is', () => {
    const v = editor('First');
    const { paragraph } = bodySchema.nodes;
    v.dispatch(v.state.tr.insert(7, paragraph.create(null, bodySchema.text('Second'))));
    v.dispatch(v.state.tr.setSelection(TextSelection.create(v.state.doc, 10)));
    insertTable(POEMS, 3)(v.state, v.dispatch);
    expect(shape(v.state.doc)).toMatch(/^p:First table\(The poems\)\[.*\] p:Second$/);
    // What is said of it is selected, to be changed.
    const { $from, $to } = v.state.selection;
    expect($from.parent.type.name).toBe('table_caption');
    expect(v.state.doc.textBetween($from.pos, $to.pos)).toBe('The poems');
  });

  it('a table holds no table: one asked for within it stands after it', () => {
    const v = editor('Before');
    insertTable(emptyTable(1, 1, false))(v.state, v.dispatch);
    insertTable(emptyTable(1, 2, false))(v.state, v.dispatch);
    expect(shape(v.state.doc)).toBe('p:Before table()[c:] table()[c:,c:]');
    // And so does an equation, from what is said of the table.
    v.dispatch(v.state.tr.setSelection(TextSelection.create(v.state.doc, 10)));
    expect(v.state.selection.$from.parent.type.name).toBe('table_caption');
    insertEquation(v.state, v.dispatch);
    expect(shape(v.state.doc)).toBe('p:Before table()[c:] equation table()[c:,c:]');
  });

  it('columns that hold numbers are set to the right, headings included', () => {
    const node = tableNode(bodySchema, POEMS)!;
    expect(rows(node)).toBe(
      'h:Work,h>right:Lines,h>right:Share / c:Iliad,c>right:15 693,c>right:56,5 % / c:Odyssey,c>right:12 109,c>right:43,5 %',
    );
    expect(numberColumns({ ...POEMS, headerRow: false })).toEqual([false, false, false]);
    expect(numberColumns({ ...POEMS, headerColumn: true })).toEqual([false, true, true]);
    for (const n of ['12', '-3', '−3,5', '1 234,50', "1'234.5", '45 %', '+7', '1850'])
      expect(isNumber(n), n).toBe(true);
    for (const n of ['', 'x', '2024-03-01', '12 a', 'c. 750', '3–4', '12:30', '.', '1.'])
      expect(isNumber(n), n).toBe(false);
  });

  it('a line break in what a cell holds parts paragraphs; rows are made as long as the longest', () => {
    const node = tableNode(bodySchema, {
      rows: [['two\nlines', 'b', 'c'], ['d']],
      headerRow: false,
      headerColumn: true,
    })!;
    expect(node.lastChild!.firstChild!.firstChild!.childCount).toBe(2);
    expect(rows(node)).toBe('h:twolines,c:b,c:c / h:d,c:,c:');
    expect(tableNode(bodySchema, { rows: [], headerRow: true, headerColumn: false })).toBeNull();
    expect(() => node.check()).not.toThrow();
  });
});

describe('the keys in a table', () => {
  it('Tab goes from cell to cell, and from the last cell to a new row', () => {
    const v = editor();
    insertTable(emptyTable(2, 2))(v.state, v.dispatch);
    v.dispatch(v.state.tr.insertText('a'));
    for (const sign of ['b', 'c', 'd', 'e']) {
      expect(tabForward(v.state, v.dispatch, v)).toBe(true);
      v.dispatch(v.state.tr.insertText(sign));
    }
    expect(shape(v.state.doc)).toBe('table()[h:a,h:b / c:c,c:d / c:e,c:]');
    // The row that was added is one step, which is undone as one.
    expect(tabBack(v.state, v.dispatch, v)).toBe(true);
    expect(v.state.selection.$from.node(-1).textContent).toBe('d');
  });

  it('Tab in what is said of the table goes to its first cell, and Shift-Tab back', () => {
    const v = editor();
    insertTable(POEMS)(v.state, v.dispatch);
    expect(v.state.selection.$from.parent.type.name).toBe('table_caption');
    v.dispatch(v.state.tr.setSelection(TextSelection.create(v.state.doc, 4)));
    expect(tabForward(v.state, v.dispatch, v)).toBe(true);
    expect(v.state.selection.$from.node(-1).textContent).toBe('Work');
    expect(tabBack(v.state, v.dispatch, v)).toBe(true);
    expect(v.state.selection.$from.parent.type.name).toBe('table_caption');
    expect(v.state.selection.$from.parentOffset).toBe('The poems'.length);
    // In the text, the keys are not those of a table.
    const w = editor('Text');
    expect(tabForward(w.state, w.dispatch, w)).toBe(false);
    expect(tabBack(w.state, w.dispatch, w)).toBe(false);
  });

  it('Enter in what is said of the table leaves the table for the text after it', () => {
    const v = editor('Before');
    insertTable(POEMS)(v.state, v.dispatch);
    v.dispatch(v.state.tr.setSelection(TextSelection.create(v.state.doc, 12)));
    expect(v.state.selection.$from.parent.type.name).toBe('table_caption');
    expect(leaveCaption(v.state, v.dispatch)).toBe(true);
    expect(shape(v.state.doc)).toMatch(/^p:Before table\(The poems\)\[.*\] p:$/);
    expect(v.state.selection.$from.parent.type.name).toBe('paragraph');
    expect(v.state.selection.$from.depth).toBe(1);
    v.dispatch(v.state.tr.insertText('After'));
    // Once more, and the paragraph that is there is not made again.
    v.dispatch(v.state.tr.setSelection(TextSelection.create(v.state.doc, 12)));
    v.dispatch(v.state.tr.insert(v.state.doc.content.size, bodySchema.nodes.paragraph.create()));
    expect(shape(v.state.doc)).toMatch(/\] p:After p:$/);
    // In a cell, Enter is a new paragraph in the cell.
    cursorIn(v, 0);
    expect(leaveCaption(v.state, v.dispatch)).toBe(false);
  });

  it('a table that stands in a row beside others is left with the row', () => {
    const { row, paragraph } = bodySchema.nodes;
    const a = tableNode(bodySchema, { ...POEMS, caption: 'One' })!;
    const b = tableNode(bodySchema, { ...POEMS, caption: 'Two' })!;
    const doc = bodySchema.node('doc', null, [
      paragraph.create(null, bodySchema.text('Before')),
      row.create(null, [a, b]),
    ]);
    expect(() => doc.check()).not.toThrow();
    const place = document.body.appendChild(document.createElement('div'));
    const v = new EditorView(place, {
      state: EditorState.create({
        schema: bodySchema,
        doc,
        plugins: bodyPlugins(bodySchema, { undo: () => {}, redo: () => {} }),
      }),
    });
    views.push(v);
    // In what is said of the first of the two.
    v.dispatch(v.state.tr.setSelection(TextSelection.create(v.state.doc, 8 + 1 + 1 + 1 + 2)));
    expect(v.state.selection.$from.parent.type.name).toBe('table_caption');
    expect(v.state.selection.$from.parent.textContent).toBe('One');
    expect(tableNow(v.state)?.rows).toBe(3);
    expect(leaveCaption(v.state, v.dispatch)).toBe(true);
    expect(v.state.doc.childCount).toBe(3);
    expect(v.state.doc.child(1).type.name).toBe('row');
    expect(v.state.doc.child(1).childCount).toBe(2);
    expect(v.state.selection.$from.parent).toBe(v.state.doc.child(2));
    // Tab and the tools are those of the table the cursor is in.
    v.dispatch(v.state.tr.setSelection(TextSelection.create(v.state.doc, 8 + 1 + a.nodeSize + 3)));
    expect(v.state.selection.$from.parent.textContent).toBe('Two');
    expect(tabForward(v.state, v.dispatch, v)).toBe(true);
    expect(v.state.selection.$from.node(-1).textContent).toBe('Work');
    expect(tableNow(v.state)?.id).toBe(b.attrs.id);
    // Removed, the other stands by itself: a row of one is no row.
    expect(removeTable(v.state, v.dispatch)).toBe(true);
    expect(v.state.doc.child(1).type.name).toBe('tabular');
    expect(v.state.doc.child(1).firstChild!.textContent).toBe('One');
    // And that one can be removed as any other.
    v.dispatch(v.state.tr.setSelection(TextSelection.create(v.state.doc, 8 + 1 + 1 + 2)));
    expect(v.state.selection.$from.parent.type.name).toBe('table_caption');
    expect(removeTable(v.state, v.dispatch)).toBe(true);
    expect(shape(v.state.doc)).toBe('p:Before p:');
  });

  it('Backspace takes away a table in which nothing is written, and no other', () => {
    const v = editor('Before');
    insertTable(emptyTable(2, 2))(v.state, v.dispatch);
    expect(removeBlankTable(v.state, v.dispatch)).toBe(true);
    expect(shape(v.state.doc)).toBe('p:Before');
    expect(v.state.selection.$from.parent.textContent).toBe('Before');

    // Alone in the text, it leaves a paragraph to write in.
    const w = editor();
    insertTable(emptyTable(2, 2))(w.state, w.dispatch);
    expect(removeBlankTable(w.state, w.dispatch)).toBe(true);
    expect(shape(w.state.doc)).toBe('p:');

    // Not from another cell than the first; not when something is written, or said of it.
    const x = editor();
    insertTable(emptyTable(2, 2))(x.state, x.dispatch);
    cursorIn(x, 1);
    expect(removeBlankTable(x.state, x.dispatch)).toBe(false);
    x.dispatch(x.state.tr.insertText('b'));
    cursorIn(x, 0);
    expect(removeBlankTable(x.state, x.dispatch)).toBe(false);
    const y = editor();
    insertTable({ ...emptyTable(2, 2), caption: 'Said' })(y.state, y.dispatch);
    cursorIn(y, 0);
    expect(removeBlankTable(y.state, y.dispatch)).toBe(false);
    expect(y.state.doc.firstChild!.type.name).toBe('tabular');
  });
});

describe('the tools of a table', () => {
  it('say what the table is, where the cursor is in it', () => {
    const v = editor('Before');
    expect(tableNow(v.state)).toBeNull();
    insertTable(POEMS)(v.state, v.dispatch);
    const said = tableNow(v.state)!;
    expect(said).toMatchObject({
      cells: false,
      rows: 3,
      columns: 3,
      headerRow: true,
      headerColumn: false,
      canJoin: false,
      canSplit: false,
      numbered: true,
      width: 0,
      align: null,
    });
    cursorIn(v, 0);
    expect(tableNow(v.state)).toMatchObject({ cells: true, align: 'left', pos: said.pos });
    cursorIn(v, 4);
    expect(tableNow(v.state)).toMatchObject({ cells: true, align: 'right' });
    // Selected as a whole, as after Backspace behind it.
    v.dispatch(v.state.tr.setSelection(NodeSelection.create(v.state.doc, said.pos)));
    expect(tableNow(v.state)).toMatchObject({ cells: false, rows: 3, pos: said.pos });
  });

  it('rows and columns are added and removed', () => {
    const v = editor();
    insertTable(POEMS)(v.state, v.dispatch);
    cursorIn(v, 4);
    addColumnAfter(v.state, v.dispatch);
    expect(rows(v.state.doc.firstChild!)).toBe(
      'h:Work,h>right:Lines,h:,h>right:Share / c:Iliad,c>right:15 693,c:,c>right:56,5 % / c:Odyssey,c>right:12 109,c:,c>right:43,5 %',
    );
    deleteRow(v.state, v.dispatch);
    expect(tableNow(v.state)).toMatchObject({ rows: 2, columns: 4 });
    expect(v.state.doc.firstChild!.textContent).not.toContain('Iliad');
  });

  it('cells are joined and split', () => {
    const v = editor();
    insertTable(POEMS)(v.state, v.dispatch);
    const $a = v.state.doc.resolve(cell(v, 3));
    const $b = v.state.doc.resolve(cell(v, 7));
    v.dispatch(v.state.tr.setSelection(new CellSelection($a, $b)));
    expect(tableNow(v.state)).toMatchObject({ canJoin: true, canSplit: false, align: null });
    expect(mergeCells(v.state, v.dispatch)).toBe(true);
    expect(rows(v.state.doc.firstChild!)).toBe(
      'h:Work,h>right:Lines,h>right:Share / c×2↓2:Iliad15 693Odyssey12 109,c>right:56,5 % / c>right:43,5 %',
    );
    expect(tableNow(v.state)).toMatchObject({
      canJoin: false,
      canSplit: true,
      rows: 3,
      columns: 3,
    });
    expect(splitCell(v.state, v.dispatch)).toBe(true);
    expect(tableNow(v.state)).toMatchObject({ rows: 3, columns: 3 });
    expect(rows(v.state.doc.firstChild!)).toMatch(
      / \/ c:Iliad15 693Odyssey12 109,c:,c>right:56,5 % \/ c:,c:,/,
    );
  });

  it('the first row and the first column are headings or not, also from what is said of the table', () => {
    const v = editor();
    insertTable(POEMS)(v.state, v.dispatch);
    const before = v.state.selection;
    expect(headingColumn(v.state, v.dispatch, v)).toBe(true);
    expect(rows(v.state.doc.firstChild!)).toMatch(
      /^h:Work,h>right:Lines,.* \/ h:Iliad,c>right:15 693,.* \/ h:Odyssey,/,
    );
    expect(tableNow(v.state)).toMatchObject({ headerRow: true, headerColumn: true });
    // The cursor stays where it was.
    expect(v.state.selection.eq(before)).toBe(true);
    expect(headingRow(v.state, v.dispatch, v)).toBe(true);
    expect(rows(v.state.doc.firstChild!)).toMatch(
      /^h:Work,c>right:Lines,c>right:Share \/ h:Iliad,/,
    );
    expect(tableNow(v.state)).toMatchObject({ headerRow: false, headerColumn: true });
    cursorIn(v, 4);
    headingColumn(v.state, v.dispatch, v);
    expect(rows(v.state.doc.firstChild!)).toMatch(
      /^c:Work,c>right:Lines,c>right:Share \/ c:Iliad,/,
    );
    // Not where there is no table.
    const w = editor('Text');
    expect(headingRow(w.state, w.dispatch, w)).toBe(false);
  });

  it('what the cells hold stands to the left, in the middle, to the right', () => {
    const v = editor();
    insertTable(POEMS)(v.state, v.dispatch);
    cursorIn(v, 3);
    alignCells('center')(v.state, v.dispatch);
    expect(rows(v.state.doc.firstChild!)).toContain('c>center:Iliad');
    expect(tableNow(v.state)?.align).toBe('center');
    cursorIn(v, 4);
    alignCells('left')(v.state, v.dispatch);
    expect(rows(v.state.doc.firstChild!)).toContain('c:15 693');
    // Of all that are selected.
    v.dispatch(
      v.state.tr.setSelection(
        new CellSelection(v.state.doc.resolve(cell(v, 0)), v.state.doc.resolve(cell(v, 2))),
      ),
    );
    alignCells('right')(v.state, v.dispatch);
    expect(rows(v.state.doc.firstChild!)).toMatch(/^h>right:Work,h>right:Lines,h>right:Share \//);
  });

  it('it is numbered or not, as wide as it needs to be or a share of the text', () => {
    const v = editor();
    insertTable(POEMS)(v.state, v.dispatch);
    expect(setTable({ numbered: false, width: 75 })(v.state, v.dispatch)).toBe(true);
    expect(v.state.doc.firstChild!.attrs).toMatchObject({ numbered: false, width: 75 });
    expect(tableNow(v.state)).toMatchObject({ numbered: false, width: 75 });
    const dom = v.dom.querySelector<HTMLElement>('figure.tabular')!;
    expect(dom.dataset.width).toBe('75');
    expect(dom.style.getPropertyValue('--table-width')).toBe('75%');
    expect(dom.hasAttribute('data-unnumbered')).toBe(true);
    expect(dom.classList.contains('uncaptioned')).toBe(false);
    expect(dom.querySelector('figcaption')?.textContent).toBe('The poems');
    expect(dom.querySelectorAll('th').length).toBe(3);
    expect(dom.querySelectorAll('td')[1].style.textAlign).toBe('right');
    setTable({ width: 0 })(v.state, v.dispatch);
    expect(dom.hasAttribute('data-width')).toBe(false);
    expect(dom.style.getPropertyValue('--table-width')).toBe('');
    const w = editor('Text');
    expect(setTable({ width: 50 })(w.state, w.dispatch)).toBe(false);
  });

  it('it stands where it is put, with the text around it or apart', () => {
    const v = editor('Before');
    insertTable(POEMS)(v.state, v.dispatch);
    expect(tableNow(v.state)).toMatchObject({ stands: '', flow: '', beside: 'no' });
    const dom = v.dom.querySelector<HTMLElement>('figure.tabular')!;
    // Nothing is said of it: as tables stand unless a format has them otherwise.
    expect(dom.dataset.stand).toBe('center');
    expect(dom.hasAttribute('data-around')).toBe(false);
    setTable({ align: 'right', flow: 'around' })(v.state, v.dispatch);
    expect(tableNow(v.state)).toMatchObject({ stands: 'right', flow: 'around' });
    expect(dom.dataset.stand).toBe('right');
    expect(dom.hasAttribute('data-around')).toBe(true);
    setTable({ width: 40 })(v.state, v.dispatch);
    // The width that was said is kept beside the width it has with the text around it.
    expect(dom.style.getPropertyValue('--table-width')).toBe('40%');
    expect(dom.style.getPropertyValue('--around')).toBe('40%');
    setTable({ flow: 'apart', align: 'left' })(v.state, v.dispatch);
    expect(dom.dataset.stand).toBe('left');
    expect(dom.hasAttribute('data-around')).toBe(false);
    expect(dom.style.getPropertyValue('--around')).toBe('');
  });

  it('it is removed, and the cursor is in the text beside where it stood', () => {
    const v = editor('Before');
    insertTable(POEMS)(v.state, v.dispatch);
    cursorIn(v, 5);
    expect(removeTable(v.state, v.dispatch)).toBe(true);
    expect(shape(v.state.doc)).toBe('p:Before');
    expect(v.state.selection.$from.parent.textContent).toBe('Before');
    const w = editor();
    insertTable(POEMS)(w.state, w.dispatch);
    removeTable(w.state, w.dispatch);
    expect(shape(w.state.doc)).toBe('p:');
  });

  it('a cell holds what a paragraph holds: citations, formulas, notes', () => {
    const v = editor();
    insertTable(emptyTable(2, 2))(v.state, v.dispatch);
    cursorIn(v, 2);
    v.dispatch(v.state.tr.insertText('See '));
    expect(insertCitation([{ id: 'r1', locator: '12' }])(v.state, v.dispatch)).toBe(true);
    expect(insertMath(v.state, v.dispatch)).toBe(true);
    const held: string[] = [];
    v.state.doc.nodeAt(cell(v, 2))!.descendants((n) => void held.push(n.type.name));
    expect(held).toEqual(['paragraph', 'text', 'citation', 'math']);
    const { paragraph, footnote, crossref } = bodySchema.nodes;
    expect(paragraph.contentMatch.matchType(footnote)).not.toBeNull();
    expect(paragraph.contentMatch.matchType(crossref)).not.toBeNull();
    const facts = bodyFacts(readBodyOf(v.state.doc));
    expect(facts.cited).toEqual(['r1']);
    expect(facts.set.map((s) => s.kind)).toEqual(['table']);
  });

  it('a table that was copied is given an id of its own', () => {
    const v = editor('Before');
    insertTable(POEMS)(v.state, v.dispatch);
    const first = v.state.doc.child(1);
    v.dispatch(v.state.tr.insert(v.state.doc.content.size, first));
    const ids = [v.state.doc.child(1).attrs.id, v.state.doc.child(2).attrs.id];
    expect(ids[0]).toBe(first.attrs.id);
    expect(ids[1]).toMatch(/^[0-9A-Za-z]{12}$/);
    expect(ids[1]).not.toBe(ids[0]);
  });
});

/** What is read from the project of a text, by way of the project's own form. */
function readBodyOf(doc: Node) {
  const held = new Y.Doc().getXmlFragment('text');
  prosemirrorToYXmlFragment(doc, held);
  return readBody(held);
}

describe('what is pasted', () => {
  const parse = (html: string) => {
    const dom = document.createElement('div');
    dom.innerHTML = tablesOfHtml(html);
    return Parser.fromSchema(bodySchema).parse(dom);
  };

  it('a table from a spreadsheet is a table, with nothing said of it', () => {
    const doc = parse(
      '<meta charset="utf-8"><table cellspacing="0" border="0"><colgroup width="85"></colgroup>' +
        '<tr><td height="17" align="left">Work</td><td align="left">Lines</td></tr>' +
        '<tr><td height="17" align="left">Iliad</td><td style="text-align: right">15693</td></tr>' +
        '<tr><td>Odyssey</td><td></td></tr></table>',
    );
    expect(shape(doc)).toBe('table()[c:Work,c:Lines / c:Iliad,c>right:15693 / c:Odyssey,c:]');
    expect(() => doc.check()).not.toThrow();
  });

  it('a table from a page keeps its headings and its caption, and the text around it', () => {
    const doc = parse(
      '<p>Before</p><table><caption>The <em>poems</em></caption><thead><tr><th>Work</th><th>Lines</th></tr></thead>' +
        '<tbody><tr><td><p>Iliad</p></td><td colspan="1">15693</td></tr></tbody></table><p>After</p>',
    );
    expect(shape(doc)).toBe('p:Before table(The poems)[h:Work,h:Lines / c:Iliad,c:15693] p:After');
    expect(doc.child(1).firstChild!.lastChild!.marks.map((m) => m.type.name)).toEqual(['em']);
  });

  it('what has no table, and what was copied from a text of ours, is left as it is', () => {
    expect(tablesOfHtml('<p>Only text</p>')).toBe('<p>Only text</p>');
    const ours =
      '<figure data-table="" data-id="abc" class="tabular" data-pm-slice="0 0 []"><figcaption>Said</figcaption><table><tbody><tr><td><p>a</p></td></tr></tbody></table></figure>';
    expect(tablesOfHtml(ours)).toBe(ours);
    expect(shape(parse(ours))).toBe('table(Said)[c:a]');
    const words = '<p data-pm-slice="1 1 [&quot;tabular&quot;,{}]">in a cell</p>';
    expect(tablesOfHtml(words)).toBe(words);
  });

  it('cells that were copied by themselves become a table of their own', () => {
    const cells =
      '<table data-pm-slice="1 1 -2 [&quot;tabular&quot;,{},&quot;table&quot;,null]"><tbody><tr><th><p>Work</p></th><th><p>Lines</p></th></tr><tr><td><p>Iliad</p></td><td><p>15693</p></td></tr></tbody></table>';
    const made = tablesOfHtml(cells);
    expect(made).toContain('data-pm-slice="0 0 []"');
    expect(shape(parse(made))).toBe('table()[h:Work,h:Lines / c:Iliad,c:15693]');
  });

  it('text in which tabs part the values fills the cells from where the cursor is', () => {
    const v = editor();
    insertTable(emptyTable(2, 2, false))(v.state, v.dispatch);
    cursorIn(v, 1);
    expect(pasteText('a\tb\r\nc\td\te\n')(v.state, v.dispatch)).toBe(true);
    // The table grows by what does not fit.
    expect(rows(v.state.doc.firstChild!)).toBe('c:,c:a,c:b,c: / c:,c:c,c:d,c:e');
    expect(pasteText('no tabs here')(v.state, v.dispatch)).toBe(false);
    const w = editor('Text');
    expect(pasteText('a\tb')(w.state, w.dispatch)).toBe(false);
  });
});

describe('a table in the project', () => {
  const written = () => {
    const { paragraph, citation, math } = bodySchema.nodes;
    const table = tableNode(bodySchema, { ...POEMS, headerColumn: true })!;
    const doc = bodySchema.node('doc', null, [
      paragraph.create(null, bodySchema.text('Before')),
      table,
      paragraph.create(null, [
        bodySchema.text('After '),
        citation.create({ items: [{ id: 'r1' }] }),
        math.create({ tex: 'x' }),
      ]),
    ]);
    const v = editor();
    v.updateState(EditorState.create({ schema: bodySchema, doc, plugins: v.state.plugins }));
    const $a = v.state.doc.resolve(cell(v, 4));
    const $b = v.state.doc.resolve(cell(v, 5));
    v.dispatch(v.state.tr.setSelection(new CellSelection($a, $b)));
    mergeCells(v.state, v.dispatch);
    setTable({ width: 60 })(v.state, v.dispatch);
    return v.state.doc;
  };

  it('arrives whole with another who writes in the same project', () => {
    const doc = written();
    const mine = new Y.Doc();
    const theirs = new Y.Doc();
    mine.on('update', (update) => Y.applyUpdate(theirs, update));
    theirs.on('update', (update) => Y.applyUpdate(mine, update, 'theirs'));
    mine.transact(() => prosemirrorToYXmlFragment(doc, mine.getXmlFragment('text')));

    const arrived = yXmlFragmentToProseMirrorRootNode(theirs.getXmlFragment('text'), bodySchema);
    expect(arrived.eq(doc)).toBe(true);
    expect(() => arrived.check()).not.toThrow();

    // And what the other writes in a cell is written here, in the same table.
    const a = editor('', mine.getXmlFragment('text'));
    const b = editor('', theirs.getXmlFragment('text'));
    expect(b.state.doc.eq(doc)).toBe(true);
    const at = cell(b, 7);
    b.dispatch(b.state.tr.insertText('!', at + 2));
    expect(a.state.doc.eq(b.state.doc)).toBe(true);
    expect(a.state.doc.nodeAt(cell(a, 7))!.textContent).toBe('!43,5 %');
    // A row added by one and a column by the other, and the table is whole with both.
    a.dispatch(a.state.tr.setSelection(Selection.near(a.state.doc.resolve(cell(a, 1) + 1))));
    addColumnAfter(a.state, a.dispatch);
    b.dispatch(b.state.tr.setSelection(Selection.near(b.state.doc.resolve(cell(b, -1) + 1))));
    expect(b.state.selection.$from.node(-1).textContent).toBe('!43,5 %');
    expect(tabForward(b.state, b.dispatch, b)).toBe(true);
    expect(a.state.doc.eq(b.state.doc)).toBe(true);
    expect(tableNow(a.state)).toMatchObject({ rows: 4, columns: 4 });
    expect(() => a.state.doc.check()).not.toThrow();
    expect(a.dom.querySelectorAll('figure.tabular').length).toBe(1);
    expect(a.dom.querySelectorAll('tr').length).toBe(4);
  });

  it('is read from the project, shown, and part of the document', () => {
    const p = new Project(null);
    const map = p.createMap('Wrath');
    const a = p.addChild(p.map(map)!.root, { title: 'A' })!;
    p.transact(() => prosemirrorToYXmlFragment(written(), p.fragment(a, 'body')!));

    const blocks = readBody(p.fragment(a, 'body')!);
    expect(blocks.map((b) => b.kind)).toEqual(['paragraph', 'table', 'paragraph']);
    const table = blocks[1] as TableBlock;
    expect(table).toMatchObject({ kind: 'table', numbered: true, width: 60 });
    expect(table.id).toMatch(/^[0-9A-Za-z]{12}$/);
    expect(table.caption).toEqual([{ kind: 'text', text: 'The poems', marks: {} }]);
    expect(
      table.rows.map((r) =>
        r.map(
          (c) =>
            `${c.header ? 'h' : 'c'}${c.colspan}${c.rowspan}${c.align ?? ''}:${c.content
              .map((b) =>
                b.kind === 'paragraph'
                  ? b.content.map((i) => (i.kind === 'text' ? i.text : '')).join('')
                  : '',
              )
              .join('|')}`,
        ),
      ),
    ).toEqual([
      ['h11:Work', 'h11right:Lines', 'h11right:Share'],
      ['h11:Iliad', 'c21right:15 693|56,5 %'],
      ['h11:Odyssey', 'c11right:12 109', 'c11right:43,5 %'],
    ]);

    expect(p.node(a)?.set).toMatchObject([
      { kind: 'table', id: table.id, numbered: true, words: 'The poems' },
    ]);
    expect(p.node(a)?.cited).toEqual(['r1']);

    const html = blocksHtml(blocks);
    expect(html).toContain(
      `<figure class="tabular" data-table data-id="${table.id}" data-width="60" style="--table-width: 60%"><figcaption>The poems</figcaption><table><tbody><tr><th><p>Work</p></th>`,
    );
    expect(html).toContain(
      '<td colspan="2" style="text-align: right"><p>15 693</p><p>56,5 %</p></td>',
    );

    const sections = buildDocument(p, map).sections;
    expect(sections[0].blocks.map((b) => b.kind)).toEqual(['paragraph', 'table', 'paragraph']);
  });

  it('a table is put at the end of an element its file is dropped on', () => {
    const p = new Project(null);
    const map = p.createMap('Wrath');
    const a = p.addChild(p.map(map)!.root, { title: 'A', body: 'Text.' })!;
    p.checkpoint();
    expect(addTable(p, a, POEMS)).toBe(true);
    const blocks = readBody(p.fragment(a, 'body')!);
    expect(blocks.map((b) => b.kind)).toEqual(['paragraph', 'table']);
    const table = blocks[1] as TableBlock;
    expect(table.caption).toEqual([{ kind: 'text', text: 'The poems', marks: {} }]);
    expect(table.rows.length).toBe(3);
    expect(table.rows[1].map((c) => c.align ?? '')).toEqual(['', 'right', 'right']);
    expect(table.rows[0].every((c) => c.header)).toBe(true);
    expect(table.id).toMatch(/^[0-9A-Za-z]{12}$/);
    // An editor that opens the text finds the table in it, whole.
    const v = editor('', p.fragment(a, 'body')!);
    expect(shape(v.state.doc)).toMatch(/^p:Text\. table\(The poems\)\[h:Work,/);
    expect(() => v.state.doc.check()).not.toThrow();
    v.destroy();
    views = views.filter((x) => x !== v);
    p.undo();
    expect(readBody(p.fragment(a, 'body')!).map((b) => b.kind)).toEqual(['paragraph']);
    expect(addTable(p, 'no such element', POEMS)).toBe(false);
  });
});

describe('the size of a table', () => {
  afterEach(() => {
    languages.current = 'en';
  });

  it('is said in the language of the interface, one or many', () => {
    expect(t('tables-size', { rows: 1, columns: 1 })).toBe('1 row, 1 column');
    expect(t('tables-size', { rows: 4, columns: 3 })).toBe('4 rows, 3 columns');
    expect(t('tables-size-shown', { rows: 20, columns: 3, shown: 8 })).toBe(
      '20 rows, 3 columns. The first 8 are shown.',
    );
    languages.current = 'nb';
    expect(t('tables-size', { rows: 1, columns: 2 })).toBe('1 rad, 2 kolonner');
    expect(t('tables-size-shown', { rows: 20, columns: 1, shown: 8 })).toBe(
      '20 rader, 1 kolonne. De første 8 vises.',
    );
  });
});
