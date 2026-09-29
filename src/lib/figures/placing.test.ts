import { EditorState, NodeSelection } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { prosemirrorToYXmlFragment } from 'y-prosemirror';
import { afterEach, describe, expect, it } from 'vitest';
import { bodyPlugins } from '$lib/editor/plugins';
import { bodySchema } from '$lib/editor/schema';
import { languages, t } from '$lib/i18n';
import { blocksHtml } from '$lib/project/model/html';
import { Project } from '$lib/project/model/project.svelte';
import { readBody } from '$lib/project/model/text';
import {
  canStandBeside,
  flows,
  inRow,
  MOST_BESIDE,
  placed,
  sides,
  standAlone,
  standBeside,
  usualOf,
} from './placing';

const { paragraph, figure, equation, row, tabular, table, table_row, table_cell, table_caption } =
  bodySchema.nodes;
const fig = (id: string, attrs = {}) =>
  figure.create({ id, file: 'a'.repeat(64), extension: 'png', name: `${id}.png`, ...attrs });
const eq = (id: string, attrs = {}) => equation.create({ id, tex: 'a = b', ...attrs });
const text = (words: string) => paragraph.create(null, bodySchema.text(words));
const tab = (id: string, attrs = {}) =>
  tabular.create({ id, ...attrs }, [
    table_caption.create(null, bodySchema.text('Poems')),
    table.create(null, [
      table_row.create(null, [
        table_cell.create(null, text('Iliad')),
        table_cell.create({ align: 'right' }, text('15 693')),
      ]),
    ]),
  ]);

let view: EditorView | undefined;
afterEach(() => {
  view?.destroy();
  view = undefined;
  document.body.innerHTML = '';
});

function editor(...blocks: ReturnType<typeof text>[]) {
  const place = document.body.appendChild(document.createElement('div'));
  view = new EditorView(place, {
    state: EditorState.create({
      doc: bodySchema.node('doc', null, blocks),
      plugins: bodyPlugins(bodySchema, { undo: () => {}, redo: () => {} }),
    }),
  });
  return view;
}

const shape = (v: EditorView) => {
  const out: string[] = [];
  v.state.doc.forEach((n) => {
    if (n.type.name === 'row') {
      const inner: string[] = [];
      n.forEach((c) => inner.push(c.attrs.id));
      out.push(`[${inner.join(' ')}]`);
    } else out.push(n.type.name === 'paragraph' ? 'p' : n.attrs.id);
  });
  return out.join(' ');
};
const at = (v: EditorView, id: string) => {
  let found = -1;
  v.state.doc.descendants((n, pos) => {
    if (n.attrs.id === id) found = pos;
  });
  return found;
};

describe('beside each other', () => {
  it('what stands by itself is put beside what is before it, and taken out again', () => {
    const v = editor(text('Before'), fig('a'), fig('b'), eq('c'), text('After'), tab('d'));
    expect(canStandBeside(v.state, at(v, 'a'))).toBe(false);
    expect(canStandBeside(v.state, at(v, 'd'))).toBe(false);
    expect(canStandBeside(v.state, at(v, 'b'))).toBe(true);

    expect(standBeside(at(v, 'b'))(v.state, v.dispatch)).toBe(true);
    expect(shape(v)).toBe('p [a b] c p d');
    expect(inRow(v.state, at(v, 'b'))).toBe(true);
    // It is the one that is selected, where it stands now.
    expect((v.state.selection as NodeSelection).node.attrs.id).toBe('b');

    // Into the row that is there.
    expect(standBeside(at(v, 'c'))(v.state, v.dispatch)).toBe(true);
    expect(shape(v)).toBe('p [a b c] p d');
    expect((v.state.selection as NodeSelection).node.attrs.id).toBe('c');

    // Out of it: after the row.
    expect(standAlone(at(v, 'a'))(v.state, v.dispatch)).toBe(true);
    expect(shape(v)).toBe('p [b c] a p d');
    expect((v.state.selection as NodeSelection).node.attrs.id).toBe('a');
    // Of two, both stand by themselves then.
    expect(standAlone(at(v, 'c'))(v.state, v.dispatch)).toBe(true);
    expect(shape(v)).toBe('p b c a p d');
    expect((v.state.selection as NodeSelection).node.attrs.id).toBe('c');
    expect(standAlone(at(v, 'c'))(v.state, v.dispatch)).toBe(false);
  });

  it('a row holds so many and no more, and a row of one is no row', () => {
    const v = editor(fig('a'), fig('b'), fig('c'), fig('d'), fig('e'));
    for (const id of ['b', 'c', 'd']) standBeside(at(v, id))(v.state, v.dispatch);
    expect(shape(v)).toBe('[a b c d] e');
    expect(MOST_BESIDE).toBe(4);
    expect(canStandBeside(v.state, at(v, 'e'))).toBe(false);

    // Taken away until one is left, which stands by itself.
    for (const id of ['b', 'c', 'd']) {
      const pos = at(v, id);
      v.dispatch(v.state.tr.delete(pos, pos + v.state.doc.nodeAt(pos)!.nodeSize));
    }
    expect(shape(v)).toBe('a e');
  });

  it('is read from the project, and shown', () => {
    const p = new Project(null);
    const map = p.createMap('Wrath');
    const a = p.addChild(p.map(map)!.root, { title: 'A' })!;
    const doc = bodySchema.node('doc', null, [
      row.create(null, [fig('a', { align: 'left', flow: 'around', width: 40 }), tab('t')]),
      row.create(null, [eq('e', { align: 'right' })]),
      tab('u', { align: 'right', flow: 'apart', width: 50 }),
    ]);
    p.transact(() => prosemirrorToYXmlFragment(doc, p.fragment(a, 'body')!));
    const blocks = readBody(p.fragment(a, 'body')!);
    expect(blocks.map((b) => b.kind)).toEqual(['row', 'equation', 'table']);
    expect(blocks[0]).toMatchObject({
      kind: 'row',
      items: [
        { kind: 'figure', id: 'a', align: 'left', wrap: true, width: 40 },
        {
          kind: 'table',
          id: 't',
          width: 0,
          caption: [{ kind: 'text', text: 'Poems' }],
          rows: [
            [
              { header: false, colspan: 1, content: [{ kind: 'paragraph' }] },
              { align: 'right', content: [{ kind: 'paragraph' }] },
            ],
          ],
        },
      ],
    });
    expect(blocks[0].kind === 'row' && 'align' in blocks[0].items[1]).toBe(false);
    // One alone in a row stands as it would without the row.
    expect(blocks[1]).toMatchObject({ kind: 'equation', id: 'e', align: 'right' });
    expect(blocks[2]).toMatchObject({ kind: 'table', align: 'right', wrap: false, width: 50 });
    // The figures and tables of the element, in their order, whether in a row or not.
    expect(p.node(a)?.set.map((s) => `${s.kind}:${s.id}`)).toEqual([
      'figure:a',
      'table:t',
      'equation:e',
      'table:u',
    ]);

    const html = blocksHtml(blocks);
    expect(html).toContain('<div class="row-of" data-row><figure class="figure uncaptioned"');
    expect(html).toContain('data-align="left" data-flow="around"');
    expect(html).toContain(
      '<figure class="tabular" data-table data-align="right" data-flow="apart"',
    );
    expect(html).toContain('<td style="text-align: right"><p>15 693</p></td>');
  });
});

describe('where something stands', () => {
  it('is what is said of it, or what the format says', () => {
    const format = { figures: { align: 'right', wrap: true }, equations: { align: 'left' } };
    const usual = usualOf(format as never, 'figure');
    expect(usual).toEqual({ align: 'right', wrap: true });
    expect(usualOf(undefined, 'table')).toEqual({ align: 'center', wrap: false });
    expect(usualOf(format as never, 'equation')).toEqual({ align: 'left', wrap: false });

    expect(placed({}, usual)).toEqual({ stand: 'right', around: true });
    expect(placed({ flow: 'apart' }, usual)).toEqual({ stand: 'right', around: false });
    expect(placed({ align: 'left' }, usual)).toEqual({ stand: 'left', around: true });
    // Nothing flows around what stands in the middle.
    expect(placed({ align: 'center', flow: 'around' }, usual)).toEqual({
      stand: 'center',
      around: false,
    });
    expect(placed({ align: 'left', flow: 'around' }, { align: 'center', wrap: false })).toEqual({
      stand: 'left',
      around: true,
    });
  });

  it('is told of the format in one sentence, in the language of the interface', () => {
    const said = (kind: string, side: string, flow: string) =>
      t('figures-usual', { kind, side, flow });
    expect(said('figure', 'left', 'around')).toBe(
      'The format has figures to the left, with the text flowing around them.',
    );
    expect(said('table', 'right', 'apart')).toBe(
      'The format has tables to the right, apart from the text.',
    );
    expect(said('equation', 'center', 'none')).toBe('The format has equations in the middle.');
    languages.current = 'nb';
    expect(said('table', 'left', 'apart')).toBe(
      'Formatet har tabeller til venstre, atskilt fra teksten.',
    );
    expect(sides().map((s) => s.label)).toEqual(['Som formatet', 'Venstre', 'Midten', 'Høyre']);
    languages.current = 'en';
    expect(flows().map((f) => f.label)).toEqual([
      'As the format',
      'Flows around it',
      'Stands apart',
    ]);
  });
});
