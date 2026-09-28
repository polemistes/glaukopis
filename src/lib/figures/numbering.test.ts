import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { prosemirrorToYXmlFragment } from 'y-prosemirror';
import { afterEach, describe, expect, it } from 'vitest';
import { insertCrossRef, insertEquation, insertFigure } from '$lib/editor/commands';
import { bodyPlugins } from '$lib/editor/plugins';
import { bodySchema } from '$lib/editor/schema';
import { buildDocument } from '$lib/project/model/document';
import { blocksHtml } from '$lib/project/model/html';
import { Project } from '$lib/project/model/project.svelte';
import { readBody } from '$lib/project/model/text';
import { count, countingOf, formsOf, pointerText, type Counting } from './numbering.svelte';

const { paragraph, figure, equation, crossref } = bodySchema.nodes;
const HASH = (c: string) => c.repeat(64);

const fig = (id: string, file: string, said = '', numbered = true) =>
  figure.create(
    { id, file: HASH(file), extension: 'png', name: `${id}.png`, numbered },
    said ? bodySchema.text(said) : undefined,
  );
const eq = (id: string, tex: string, numbered = true) => equation.create({ id, tex, numbered });
const text = (words: string) => paragraph.create(null, bodySchema.text(words));

function write(p: Project, element: string, ...blocks: ReturnType<typeof text>[]) {
  p.transact(() =>
    prosemirrorToYXmlFragment(bodySchema.node('doc', null, blocks), p.fragment(element, 'body')!),
  );
}

const plain = countingOf(undefined);
const numbered: Counting = { ...plain, numberedHeadings: true };

/** A map of two parts, the first with a part under it. */
function sample() {
  const p = new Project(null);
  const map = p.createMap('Wrath');
  const root = p.map(map)!.root;
  const a = p.addChild(root, { title: 'The word' })!;
  const a1 = p.addChild(a, { title: 'In Homer' })!;
  const b = p.addChild(root, { title: 'The shield' })!;
  write(p, root, text('Before the first part.'), fig('f0', 'a', 'A map'));
  write(p, a, text('Text.'), eq('q1', 'a = b'), fig('f1', 'b', 'A vase'), eq('q2', 'c = d', false));
  write(p, a1, fig('f2', 'c', '', false), eq('q3', 'e = f'), eq('q4', '  '));
  write(p, b, fig('f3', 'd', 'The shield'), text('After.'));
  return { p, map, root, a, a1, b };
}

describe('the numbers of a document', () => {
  it('are counted through the map, in the order of the document', () => {
    const { p, map, root, a, a1, b } = sample();
    const n = count(p, map, plain);
    const called = (id: string) => n.byId.get(id)?.number ?? null;
    expect(['f0', 'f1', 'f2', 'f3'].map(called)).toEqual(['1', '2', null, '3']);
    expect(['q1', 'q2', 'q3'].map(called)).toEqual(['1', null, '2']);
    // One in which nothing is written is nothing.
    expect(n.byId.has('q4')).toBe(false);
    expect(n.within.get(root)).toEqual({ figure: ['1'], equation: [] });
    expect(n.within.get(a)).toEqual({ figure: ['2'], equation: ['1', null] });
    expect(n.within.get(a1)).toEqual({ figure: [null], equation: ['2'] });
    expect(n.within.get(b)).toEqual({ figure: ['3'], equation: [] });
    expect(n.byId.get('f1')).toMatchObject({ kind: 'figure', words: 'A vase', element: a });
    expect(n.byId.get('f1')?.file).toBe(HASH('b'));
    expect(n.byId.get('q1')).toMatchObject({ kind: 'equation', words: 'a = b' });

    // The parts have their names, and numbers where the format numbers them.
    expect(n.byId.get(a1)).toMatchObject({ kind: 'part', number: null, words: 'In Homer' });
    expect(n.byId.has(root)).toBe(false);
    const m = count(p, map, numbered);
    expect([a, a1, b].map((id) => m.byId.get(id)?.number)).toEqual(['1', '1.1', '2']);
    // A level that runs into the text has no number, and is not counted.
    const r = count(p, map, { ...numbered, runIn: [2] });
    expect([a, a1, b].map((id) => r.byId.get(id)?.number)).toEqual(['1', null, '2']);
  });

  it('pass over what is not part of the document', () => {
    const { p, map, a, a1, b } = sample();
    p.setExcluded(a, true);
    const n = count(p, map, numbered);
    expect(n.byId.has('f1')).toBe(false);
    expect(n.byId.has('f2')).toBe(false);
    expect(n.within.has(a1)).toBe(false);
    expect(n.byId.get('f3')?.number).toBe('2');
    expect(n.byId.get(b)?.number).toBe('1');
    const loose = p.addLoose(map, { x: 0, y: 0 }, 'A thought')!;
    write(p, loose, fig('f9', 'e', 'Loose'));
    expect(count(p, map, plain).byId.has('f9')).toBe(false);
    // An element whose name is not printed is no part that can be pointed to.
    p.setHeading(b, false);
    expect(count(p, map, numbered).byId.has(b)).toBe(false);
  });

  it('are those of the map the document is made of', () => {
    const { p, map, b } = sample();
    const other = p.createMap('Another');
    const centre = p.map(other)!.root;
    const x = p.addChild(centre, { title: 'From elsewhere' })!;
    write(p, centre, fig('g0', 'e', 'At the centre'));
    write(p, x, fig('g1', 'f', 'Elsewhere'), eq('r1', 'x = y'));
    expect(count(p, other, plain).byId.get('g1')?.number).toBe('2');
    // Standing in the place of an element, it is counted where it stands.
    p.setInclude(b, other);
    const n = count(p, map, numbered);
    expect(['f3', 'g0', 'g1'].map((id) => n.byId.get(id)?.number)).toEqual(['3', '4', '5']);
    expect(n.byId.get('r1')?.number).toBe('3');
    expect(n.byId.get(x)?.number).toBe('2.1');
    // And as the document is made, so it is counted.
    const sections = buildDocument(p, map).sections;
    const figures = sections.flatMap((s) =>
      s.blocks.flatMap((block) => (block.kind === 'figure' ? [block.id] : [])),
    );
    expect(figures).toEqual(['f0', 'f1', 'f2', 'f3', 'g0', 'g1']);
  });

  it('what stands twice is pointed to where it stands first', () => {
    const { p, map, b } = sample();
    write(p, b, fig('f1', 'z', 'A copy'), fig('f3', 'd', 'The shield'));
    const n = count(p, map, plain);
    expect(n.byId.get('f1')).toMatchObject({ number: '2', words: 'A vase' });
    expect(n.within.get(b)).toEqual({ figure: ['3', '4'], equation: [] });
  });
});

describe('words that point', () => {
  it('say what the document calls what they point to', () => {
    const { p, map, a, a1 } = sample();
    const n = count(p, map, numbered);
    const to = (id: string) => n.byId.get(id);
    expect(pointerText(to('f1'), 'full', numbered)).toBe('Figure 2');
    expect(pointerText(to('f1'), 'number', numbered)).toBe('2');
    expect(pointerText(to('f1'), 'full', { ...numbered, label: 'Figure', reference: 'fig.' })).toBe(
      'fig. 2',
    );
    expect(pointerText(to('f2'), 'full', numbered)).toBe('Figure');
    expect(pointerText(to('q3'), 'full', numbered)).toBe('(2)');
    expect(pointerText(to('q3'), 'full', { ...numbered, before: '[', after: ']' })).toBe('[2]');
    expect(pointerText(to('q3'), 'number', numbered)).toBe('2');
    expect(pointerText(to('q2'), 'full', numbered)).toBe('');
    expect(pointerText(to(a1), 'full', numbered)).toBe('1.1');
    expect(pointerText(to(a1), 'name', numbered)).toBe('In Homer');
    expect(pointerText(count(p, map, plain).byId.get(a), 'full', plain)).toBe('The word');
    expect(pointerText(undefined, 'full', plain)).toBe('');
    expect(formsOf('part', false).map((f) => f.form)).toEqual(['full']);
    expect(formsOf('part', true).map((f) => f.form)).toEqual(['full', 'name']);
  });

  it('are read from the text, and go into the document', () => {
    const { p, map, b } = sample();
    write(
      p,
      b,
      paragraph.create(null, [
        bodySchema.text('See '),
        crossref.create({ target: 'f1', form: 'full' }),
        bodySchema.text(' and '),
        crossref.create({ target: 'q1', form: 'number' }),
        crossref.create({ target: '' }),
      ]),
    );
    const blocks = readBody(p.fragment(b, 'body')!);
    expect(blocks[0]).toMatchObject({
      kind: 'paragraph',
      content: [
        { kind: 'text', text: 'See ' },
        { kind: 'crossref', target: 'f1', form: 'full' },
        { kind: 'text', text: ' and ' },
        { kind: 'crossref', target: 'q1', form: 'number' },
      ],
    });
    expect(blocksHtml(blocks)).toContain(
      '<span class="crossref" data-crossref="f1" data-form="full"></span>',
    );
    const last = buildDocument(p, map).sections.at(-1)!;
    expect(last.element).toBe(b);
    expect(JSON.stringify(last.blocks)).toContain(
      '"kind":"crossref","target":"q1","form":"number"',
    );
    // They are words, and are counted as one.
    expect(p.node(b)?.words).toBe(2 + 2);
  });
});

describe('what is pointed to by', () => {
  let view: EditorView | undefined;
  afterEach(() => {
    view?.destroy();
    view = undefined;
    document.body.innerHTML = '';
  });

  function editor() {
    const place = document.body.appendChild(document.createElement('div'));
    view = new EditorView(place, {
      state: EditorState.create({
        schema: bodySchema,
        plugins: bodyPlugins(bodySchema, { undo: () => {}, redo: () => {} }),
      }),
    });
    return view;
  }

  const ids = (v: EditorView) => {
    const out: string[] = [];
    v.state.doc.descendants((n) => {
      if (n.type.name === 'figure' || n.type.name === 'equation') out.push(n.attrs.id);
    });
    return out;
  };

  it('is given to figures and equations when they are made, and is their own', () => {
    const v = editor();
    insertFigure({ hash: HASH('a'), extension: 'png', name: 'a.png' })(v.state, v.dispatch);
    insertEquation(v.state, v.dispatch);
    const made = ids(v);
    expect(made).toHaveLength(2);
    expect(made.every((id) => /^[0-9A-Za-z]{12}$/.test(id))).toBe(true);
    expect(new Set(made).size).toBe(2);

    // One that is copied into the same text is another, and is pointed to by another id.
    const first = v.state.doc.firstChild!;
    v.dispatch(v.state.tr.insert(v.state.doc.content.size, first.copy(first.content)));
    const now = ids(v);
    expect(now).toHaveLength(3);
    expect(new Set(now).size).toBe(3);
    expect(now.slice(0, 2)).toEqual(made);

    // One that has none, as those made before there were any, is given one.
    v.dispatch(v.state.tr.insert(0, equation.create({ tex: 'a' })));
    expect(ids(v).every(Boolean)).toBe(true);
    expect(new Set(ids(v)).size).toBe(4);
  });

  it('words point where the cursor is, and what is said of a figure may hold them', () => {
    const v = editor();
    v.dispatch(v.state.tr.insertText('See '));
    expect(insertCrossRef('f1')(v.state, v.dispatch)).toBe(true);
    expect(v.state.doc.firstChild!.lastChild!.type.name).toBe('crossref');
    expect(v.state.doc.firstChild!.lastChild!.attrs).toEqual({ target: 'f1', form: 'full' });
    expect(insertCrossRef('')(v.state, v.dispatch)).toBe(false);
    insertFigure({ hash: HASH('a'), extension: 'png', name: 'a.png' })(v.state, v.dispatch);
    expect(insertCrossRef('q1', 'number')(v.state, v.dispatch)).toBe(true);
    expect(v.state.selection.$from.parent.type.name).toBe('figure');
  });

  it('a figure begins with what is said of its picture in the store', () => {
    const v = editor();
    insertFigure({
      hash: HASH('a'),
      extension: 'png',
      name: 'vase.png',
      alt: 'A large vase',
      caption: [
        { kind: 'text', text: 'The ', marks: {} },
        { kind: 'text', text: 'krater', marks: { em: true } },
        { kind: 'text', text: ' of Florence', marks: {} },
      ],
    })(v.state, v.dispatch);
    const made = v.state.doc.firstChild!;
    expect(made.type.name).toBe('figure');
    expect(made.textContent).toBe('The krater of Florence');
    expect(made.attrs.alt).toBe('A large vase');
    expect(made.child(1).marks.map((m) => m.type.name)).toEqual(['em']);
    // The cursor is at the end of it, where the writing goes on.
    expect(v.state.selection.from).toBe(made.nodeSize - 1);
  });
});
