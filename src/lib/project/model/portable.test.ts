import { describe, expect, it } from 'vitest';
import { canPaste, clipboard, copyElements, pasteElements } from '../clipboard.svelte';
import { sendElements } from '../elements';
import { writeBody } from './blocks';
import { makePortable, portable } from './portable';
import { Project } from './project.svelte';
import { paragraph, passage, type Block, type Inline } from './text';
import { PROJECT, type RefRecord } from './types';

const HASH = 'b'.repeat(64);

const t = (text: string, marks: Record<string, Record<string, unknown>> = {}): Inline => ({
  kind: 'text',
  text,
  marks,
});
const para = (...content: Inline[]): Block => paragraph(content);

/** A project begun, with its own element at the top, named so. */
function project(name: string) {
  const p = new Project(null);
  p.begin(name);
  return { p, root: PROJECT };
}

function write(p: Project, id: string, blocks: Block[]) {
  p.transact(() => writeBody(p.fragment(id, 'body')!, blocks));
}

/** A text with much in it: notes, citations, formulas, figures, tables, verse, kinds. */
function text(own: { passage: string; words: string }, pointsTo: string): Block[] {
  return [
    para(
      t('The wrath of '),
      t('Achilles', { em: {} }),
      t(', '),
      t('μῆνις', { kind: { name: 'foreign', lang: 'grc' } }),
      t(', '),
      t('a word', { kind: { name: own.words, lang: '' } }),
      { kind: 'break' },
      { kind: 'math', tex: 'x^2' },
      t(' as '),
      { kind: 'citation', items: [{ id: 'r1', locator: '73' }], mode: 'normal' },
      t(' says; see '),
      { kind: 'crossref', target: pointsTo, form: 'name' },
      t(' and '),
      { kind: 'crossref', target: 'f1', form: 'number' },
      {
        kind: 'footnote',
        content: [
          t('So the scholia, '),
          { kind: 'citation', items: [{ id: 'r1' }], mode: 'intext' },
        ],
      },
    ),
    passage('quotation', [
      paragraph([t('In a kind of my own.')], own.passage),
      paragraph([t('Sing, goddess.')], 'epigraph'),
    ]),
    { kind: 'equation', id: 'e1', tex: 'a^2 + b^2 = c^2', numbered: true },
    passage(
      'verse',
      [
        paragraph([t('Nurse')], 'speaker'),
        paragraph([t('If only the Argo')], 'line', { indent: 1, number: '1' }),
      ],
      'counted',
    ),
    passage('script', [paragraph([t('If only.')], 'dialogue')]),
    {
      kind: 'figure',
      id: 'f1',
      file: HASH,
      extension: 'png',
      name: 'shield.png',
      caption: [t('The shield, '), t('in words', { kind: { name: own.words, lang: '' } })],
      alt: 'A shield',
      width: 50,
      numbered: true,
    },
    {
      kind: 'table',
      id: 't1',
      caption: [t('Forms')],
      rows: [
        [
          { content: [para(t('Form'))], colspan: 1, rowspan: 1, header: true },
          { content: [para(t('Where'))], colspan: 1, rowspan: 1, header: true },
        ],
        [
          { content: [para(t('mênis', { em: {} }))], colspan: 1, rowspan: 1, header: false },
          { content: [para(t('Iliad 1.1'))], colspan: 1, rowspan: 1, header: false },
        ],
      ],
      numbered: true,
      width: 0,
    },
  ];
}

const REF: RefRecord = {
  id: 'r1',
  key: 'nagy1979',
  type: 'book',
  fields: { title: 'The Best of the Achaeans' },
  names: { author: [{ family: 'Nagy', given: 'Gregory' }] },
  modified: '2026-10-01T00:00:00Z',
  authors: 'Nagy',
  year: '1979',
  title: 'The Best of the Achaeans',
  container: '',
};

/** A project with a branch to be carried: A, with A1 and A2 under it, linked, of kinds of its own. */
function source() {
  const s = project('Iliad');
  const { p, root } = s;
  p.setMe({ id: 'robert', name: 'Robert' });
  const character = p.createKind({ name: 'Character', colour: 'red', template: '', begins: '' })!;
  const passage = p.createPassageKind({
    name: 'Lament',
    family: 'paragraph',
    basedOn: 'quote',
    look: { italic: true },
  })!;
  const words = p.createPassageKind({
    name: 'Epithet',
    family: 'words',
    basedOn: '',
    look: { bold: true },
  })!;
  const outside = p.addChild(root, { title: 'Outside' })!;
  const a = p.addChild(root, { title: 'Wrath' })!;
  const a1 = p.addChild(a, { title: 'Achilles' })!;
  const a2 = p.addChild(a, { title: 'Agamemnon' })!;
  p.setKind([a1, a2], character);
  p.setStatus([a], 'draft');
  p.setCollapsed(a, true);
  p.setWhen(a2, { start: { after: a1 } });
  p.putReference(REF);
  write(p, a, text({ passage, words }, a1));
  write(p, a1, [para(t('Points outside: '), { kind: 'crossref', target: outside, form: 'full' })]);
  p.addLink(a1, a2);
  p.addLink(a1, outside);
  p.comment(a, null, 'Is this right?');
  return { ...s, a, a1, a2, outside, character, passage, words };
}

/** The elements under an element, by name, with all under them. */
function branch(p: Project, id: string): string[] {
  const tree = p.tree();
  const out: string[] = [];
  const visit = (at: string, depth: number) => {
    out.push(`${'-'.repeat(depth)}${p.node(at)!.title}`);
    for (const c of tree.children.get(at) ?? []) visit(c, depth + 1);
  };
  visit(id, 0);
  return out;
}

describe('elements to another project', () => {
  it('are made there as they were, with new ids, and nothing of where they came from', () => {
    const s = source();
    const d = project('Book');
    const carried = portable(s.p, [s.a]);
    // Taken once, it is free of the project it came from.
    expect(JSON.parse(JSON.stringify(carried))).toEqual(carried);

    const [a] = makePortable(d.p, carried, { under: d.root });
    expect(branch(d.p, d.root)).toEqual(['Book', '-Wrath', '--Achilles', '--Agamemnon']);
    expect(a).not.toBe(s.a);
    const there = d.p.node(a)!;
    expect(there.origin).toBeNull();
    expect(there.status).toBe('draft');
    expect(there.collapsed).toBe(true);
    expect(there.pos).toBeNull();
    expect(there.words).toBe(s.p.node(s.a)!.words);
    expect(there.notes).toBe(1);
    expect(there.cited).toEqual(['r1']);

    // The text reads back as it was, the kinds being of the same ids.
    const [a1, a2] = d.p.tree().children.get(a)!;
    const text = d.p.blocksOf(a);
    const point = (b: Block[]) => JSON.stringify(b).replaceAll(s.a1, 'A1').replaceAll(a1, 'A1');
    expect(point(text)).toEqual(point(s.p.blocksOf(s.a)));
    // Words that point to what came with them point to it there, and to what did not as before.
    expect(JSON.stringify(text)).toContain(`"target":"${a1}"`);
    expect(JSON.stringify(d.p.blocksOf(a1))).toContain(`"target":"${s.outside}"`);
    // So with a time.
    expect(d.p.node(a2)!.when).toEqual({ start: { after: a1 } });

    // The link between them, not the one to what stayed behind; and no comment.
    expect(d.p.links.map((l) => [l.from, l.to])).toEqual([[a1, a2]]);
    expect(d.p.comments.size).toBe(0);

    // The kinds they use, added with the ids they had.
    expect(d.p.kinds.map((k) => [k.id, k.name, k.colour])).toEqual([
      [s.character, 'Character', 'red'],
    ]);
    expect(d.p.node(a1)!.kind).toBe(s.character);
    expect(d.p.passageKinds.map((k) => [k.id, k.name, k.family, k.basedOn, k.look])).toEqual([
      [s.passage, 'Lament', 'paragraph', 'quote', { italic: true }],
      [s.words, 'Epithet', 'words', '', { bold: true }],
    ]);
    // The reference is kept in the project.
    expect(d.p.refs.get('r1')?.key).toBe('nagy1979');

    // Made again, the kinds of the same ids are used, not added again.
    makePortable(d.p, carried, { under: d.root });
    expect(d.p.kinds).toHaveLength(1);
    expect(d.p.passageKinds).toHaveLength(2);
    expect(branch(d.p, d.root)).toHaveLength(7);

    // Where the first stands is said; the rest stand below it. Under nothing, nothing is made.
    const twice = makePortable(d.p, portable(s.p, [s.a1, s.a2]), {
      under: d.root,
      pos: { x: 100.4, y: 20 },
    });
    expect(twice.map((id) => d.p.node(id)!.pos)).toEqual([
      { x: 100, y: 20 },
      { x: 100, y: 80 },
    ]);
    expect(makePortable(d.p, carried, { under: 'nobody' })).toEqual([]);
    // The project itself is never carried.
    expect(portable(s.p, [PROJECT]).elements).toEqual([]);
  });

  it('use the kinds of the same name there, and name them as they are there', () => {
    const s = source();
    const d = project('Book');
    const character = d.p.createKind({ name: 'character', colour: 'blue', template: '' })!;
    const lament = d.p.createPassageKind({
      name: 'Lament',
      family: 'paragraph',
      basedOn: 'text',
      look: {},
    })!;
    // Of the same name, but a kind of words: not the same kind.
    d.p.createPassageKind({ name: 'Epithet', family: 'paragraph', basedOn: 'text', look: {} });

    const [a] = makePortable(d.p, portable(s.p, [s.a]), { under: d.root });
    const [a1] = d.p.tree().children.get(a)!;
    expect(d.p.kinds).toHaveLength(1);
    expect(d.p.node(a1)!.kind).toBe(character);
    expect(d.p.passageKinds.map((k) => k.name)).toEqual(['Lament', 'Epithet', 'Epithet']);
    const uses = d.p.node(a)!.uses;
    expect(uses).toContain(lament);
    expect(uses).not.toContain(s.passage);
    expect(uses).toContain(s.words);
    const text = d.p.blocksOf(a);
    expect(text[1]).toEqual(
      passage('quotation', [
        paragraph([t('In a kind of my own.')], lament),
        paragraph([t('Sing, goddess.')], 'epigraph'),
      ]),
    );
  });

  it('a kind of paragraph goes with the kind it is based on, and the kind an element begins in', () => {
    const s = project('Iliad');
    const base = s.p.createPassageKind({
      name: 'Speech',
      family: 'paragraph',
      basedOn: 'quote',
      look: {},
    })!;
    const lament = s.p.createPassageKind({
      name: 'Lament',
      family: 'paragraph',
      basedOn: base,
      look: {},
    })!;
    const scene = s.p.createPassageKind({
      name: 'Scene',
      family: 'paragraph',
      basedOn: '',
      look: {},
    })!;
    const kind = s.p.createKind({ name: 'Place', colour: 'green', template: '', begins: scene })!;
    const a = s.p.addChild(s.root, { title: 'Troy' })!;
    s.p.setKind([a], kind);
    write(s.p, a, [passage('quotation', [paragraph([t('Alas.')], lament)])]);

    const carried = portable(s.p, [a]);
    expect(carried.passageKinds.map((k) => k.name).sort()).toEqual(['Lament', 'Scene', 'Speech']);
    const d = project('Book');
    const speech = d.p.createPassageKind({
      name: 'Speech',
      family: 'paragraph',
      basedOn: 'text',
      look: {},
    })!;
    makePortable(d.p, carried, { under: d.root });
    expect(d.p.passageKind(lament)?.basedOn).toBe(speech);
    expect(d.p.kind(kind)?.begins).toBe(scene);
  });

  it('the clipboard pastes copies in the project they came from, and makes them anew in another', () => {
    const s = source();
    const d = project('Book');
    expect(copyElements(s.p, [s.a, s.a1])).toBe(1);
    expect(copyElements(s.p, [PROJECT])).toBe(0);
    expect(copyElements(s.p, [s.a, s.a1])).toBe(1);
    expect(canPaste(s.p)).toBe(true);
    expect(canPaste(d.p)).toBe(true);

    const [copy] = pasteElements(s.p, { under: s.outside });
    expect(s.p.node(copy)!.origin?.node).toBe(s.a);

    // Pasted here, at a place: under the element in view, where the pointer is.
    const [placed] = pasteElements(d.p, { under: d.root, pos: { x: 300.4, y: 40 } });
    expect(d.p.node(placed)!.origin).toBeNull();
    expect(d.p.node(placed)!.pos).toEqual({ x: 300, y: 40 });
    expect(d.p.tree().parent.get(placed)).toBe(d.root);
    const [under] = pasteElements(d.p, { under: d.root });
    expect(branch(d.p, under)).toEqual(['Wrath', '-Achilles', '-Agamemnon']);
    expect(d.p.node(under)!.pos).toBeNull();

    // What was copied can be pasted after it is gone here: elsewhere, and
    // here again, made anew, as no copy of what is gone.
    s.p.remove([s.a]);
    expect(canPaste(d.p)).toBe(true);
    expect(pasteElements(d.p, { under: d.root })).toHaveLength(1);
    expect(canPaste(s.p)).toBe(true);
    const [again] = pasteElements(s.p, { under: s.root });
    expect(s.p.node(again)?.title).toBe('Wrath');
    expect(s.p.copyOf(again)).toBeFalsy();
    clipboard.held = null;
  });

  it('a move writes there, then removes here in one step that undo takes back', async () => {
    const s = source();
    const d = project('Book');
    let closed = 0;
    const open = async () => ({
      project: d.p,
      close: async () => {
        closed++;
      },
    });
    const count = await sendElements(s.p, [s.a], { project: 'book', at: d.root }, true, open);
    expect(count).toBe(1);
    expect(closed).toBe(1);
    expect(branch(d.p, d.root)).toEqual(['Book', '-Wrath', '--Achilles', '--Agamemnon']);
    expect(s.p.node(s.a)).toBeUndefined();
    expect(s.p.node(s.a1)).toBeUndefined();
    s.p.undo();
    expect(branch(s.p, s.root)).toEqual([
      'Iliad',
      '-Outside',
      '-Wrath',
      '--Achilles',
      '--Agamemnon',
    ]);

    // A copy leaves them here.
    await sendElements(s.p, [s.a1], { project: 'book', at: d.root }, false, open);
    expect(s.p.node(s.a1)).toBeDefined();
    expect(branch(d.p, d.root)).toHaveLength(5);
  });

  it('where writing there fails, nothing is removed here', async () => {
    const s = source();
    const d = project('Book');
    const failing = async () => {
      throw new Error('no disk');
    };
    await expect(
      sendElements(s.p, [s.a], { project: 'book', at: d.root }, true, failing),
    ).rejects.toThrow('no disk');
    expect(s.p.node(s.a)).toBeDefined();

    // An element that is not there is a failure too, and the project is closed all the same.
    let closed = false;
    const open = async () => ({ project: d.p, close: async () => void (closed = true) });
    await expect(
      sendElements(s.p, [s.a], { project: 'book', at: 'gone' }, true, open),
    ).rejects.toThrow();
    expect(closed).toBe(true);
    expect(s.p.node(s.a)).toBeDefined();
    expect(d.p.tree().sequence).toEqual([d.root]);
  });
});
