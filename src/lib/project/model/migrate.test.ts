import { describe, expect, it } from 'vitest';
import * as Y from 'yjs';
import { term } from '$lib/i18n';
import { buildDocument } from './document';
import { migrate, needsMigration, TEXTS_SHAPE } from './migrate';
import { Project } from './project.svelte';
import { fillTitle, paragraph, passage, readBody, type Inline } from './text';
import { PROJECT } from './types';

/** A document as it was written before ADR 0037: maps with a centre each, elements naming their map. */
function oldDocument() {
  const doc = new Y.Doc();
  const maps = doc.getMap<Y.Map<unknown>>('maps');
  const nodes = doc.getMap<Y.Map<unknown>>('nodes');
  const meta = doc.getMap<unknown>('meta');
  doc.transact(() => {
    meta.set('name', 'Wrath');
    meta.set('language', 'el');
    const map = (
      id: string,
      name: string,
      root: string,
      order: string,
      extra: Record<string, unknown> = {},
    ) => {
      const m = new Y.Map<unknown>();
      m.set('name', name);
      m.set('root', root);
      m.set('order', order);
      for (const [k, v] of Object.entries(extra)) m.set(k, v);
      maps.set(id, m);
    };
    const node = (
      id: string,
      map: string,
      parent: string | null,
      order: string,
      title: string,
      extra: Record<string, unknown> = {},
    ) => {
      const n = new Y.Map<unknown>();
      n.set('map', map);
      n.set('parent', parent);
      n.set('order', order);
      const t = new Y.XmlFragment();
      n.set('title', t);
      n.set('body', new Y.XmlFragment());
      for (const [k, v] of Object.entries(extra)) n.set(k, v);
      nodes.set(id, n);
      fillTitle(t, title);
    };
    map('m2', 'Second', 'c2', 'a1', { document: { style: 'apa' }, timeline: { axis: 'units' } });
    map('m1', 'First', 'c1', 'a0', {
      document: { title: 'The First' },
      hand: { pinned: ['quote'] },
    });
    node('c1', 'm1', null, 'a0', 'First', { pos: { x: 0, y: 0 } });
    node('a', 'm1', 'c1', 'a0', 'A');
    node('b', 'm1', 'c1', 'a1', 'B', { include: 'm2' });
    node('l1', 'm1', null, 'a1', 'Loose one', { pos: { x: 300, y: 10 }, side: 'left' });
    node('c2', 'm2', null, 'a0', '');
    node('l2', 'm2', 'gone', 'a0', 'Loose two');
    node('x', 'm2', 'c2', 'a0', 'X', { include: 'm1' });
  });
  return doc;
}

describe('a project brought into one tree', () => {
  it('a new document gets the project element, named', () => {
    const doc = new Y.Doc();
    expect(needsMigration(doc)).toBe(true);
    expect(migrate(doc, 'Wrath')).toBe(true);
    expect(needsMigration(doc)).toBe(false);
    const p = new Project(null);
    Y.applyUpdate(p.doc, Y.encodeStateAsUpdate(doc));
    expect(p.node(PROJECT)?.title).toBe('Wrath');
    expect(p.tree().sequence).toEqual([PROJECT]);
    // Done, it is done.
    expect(migrate(doc, 'Other')).toBe(false);
  });

  it('maps become children of the project, in order, with their settings; loose elements after them', () => {
    const doc = oldDocument();
    expect(migrate(doc, 'ignored')).toBe(true);
    expect(doc.getMap('maps').size).toBe(0);
    expect(doc.getMap('meta').get('language')).toBeUndefined();
    // The hand of a map goes, as the hand of the project does (ADR 0040).
    expect(doc.getMap('meta').get('hand')).toBeUndefined();
    expect(doc.getMap('meta').get('texts')).toBe(TEXTS_SHAPE);

    const p = new Project(null);
    p.load(Y.encodeStateAsUpdate(doc), []);
    expect(p.name).toBe('Wrath');
    expect(p.language).toBe('el');
    const tree = p.tree();
    expect(tree.children.get(PROJECT)).toEqual(['c1', 'c2', 'l1', 'l2']);
    expect(tree.children.get('c1')).toEqual(['a', 'b']);
    expect(tree.children.get('c2')).toEqual(['x']);
    // The centre of a map keeps its name, or is named as the map where it had none.
    expect(p.node('c1')?.title).toBe('First');
    expect(p.node('c2')?.title).toBe('Second');
    // What was said of the map is said of its centre.
    expect(p.node('c1')?.document).toEqual({ title: 'The First' });
    expect(p.node('c2')?.document).toEqual({ style: 'apa' });
    expect(p.node('c2')?.timeline).toEqual({ axis: 'units' });
    // Folded where they stand under the project, when they hold anything.
    expect(p.node('c1')?.collapsed).toBe(true);
    expect(p.node('l1')?.collapsed).toBe(false);
    // What stood for a map stands for its centre.
    expect(p.node('b')?.include).toBe('c2');
    expect(p.node('x')?.include).toBe('c1');
    // Loose elements keep where they stood.
    expect(p.node('l1')?.pos).toEqual({ x: 300, y: 10 });
    expect(needsMigration(p.doc)).toBe(false);
  });

  it('is done by the project when it begins, once, outside undo', () => {
    const p = new Project(null);
    p.load(Y.encodeStateAsUpdate(oldDocument()), []);
    // Loaded as it was: read with the root made up, nothing written.
    expect(needsMigration(p.doc)).toBe(true);
    expect(p.begin('Wrath')).toBe(true);
    expect(p.begin('Wrath')).toBe(false);
    expect(p.canUndo).toBe(false);
    expect(p.tree().children.get(PROJECT)).toEqual(['c1', 'c2', 'l1', 'l2']);
    expect(p.name).toBe('Wrath');
  });
});

describe('an abstract or a cover in the settings of an element', () => {
  /** A project in one tree, with an abstract and a cover said of elements as before ADR 0038. */
  function withParts() {
    const p = new Project(null);
    p.begin('Wrath');
    const book = p.addChild(PROJECT, { title: 'Book' })!;
    const chapter = p.addChild(book, { title: 'Chapter', body: 'Text.' })!;
    const article = p.addChild(PROJECT, { title: 'Article' })!;
    p.addChild(article, { title: 'Argument' });
    // Written straight into the document, as the settings were kept then.
    p.transact(() => {
      p.yNodes.get(book)!.set('document', {
        title: 'The book',
        language: 'nb',
        abstract: 'Kort sagt.\n\nOg litt til.',
        cover: { hash: 'abc123', extension: 'png' },
      });
      p.yNodes.get(article)!.set('document', { abstract: 'In short.' });
      p.yNodes.get(chapter)!.set('document', { cover: { hash: 'def456', extension: 'jpg' } });
    });
    return { p, book, chapter, article };
  }

  it('is seen, and becomes an element under it, first among its children, outside undo', () => {
    const { p, book, chapter, article } = withParts();
    expect(needsMigration(p.doc)).toBe(true);
    const doc = new Y.Doc();
    Y.applyUpdate(doc, Y.encodeStateAsUpdate(p.doc));
    expect(migrate(doc, 'Wrath', undefined, term)).toBe(true);
    expect(needsMigration(doc)).toBe(false);

    const q = new Project(null);
    q.load(Y.encodeStateAsUpdate(doc), []);
    // The settings lose the two, and keep the rest.
    expect(q.node(book)?.document).toEqual({ title: 'The book', language: 'nb' });
    expect(q.node(article)?.document).toEqual({});
    expect(q.node(chapter)?.document).toEqual({});

    // The cover first, the abstract after it, then what was there.
    const [cover, abstract, ...rest] = q.tree().children.get(book)!;
    expect(rest).toEqual([chapter]);
    expect(q.node(cover)?.title).toBe('Cover');
    expect(q.node(cover)?.kind).toBe('cover');
    expect(q.node(cover)?.set).toEqual([
      expect.objectContaining({
        kind: 'figure',
        file: 'abc123',
        extension: 'png',
        numbered: false,
      }),
    ]);
    // Named as documents name it, in the language of the document.
    expect(q.node(abstract)?.title).toBe('Sammendrag');
    expect(q.node(abstract)?.kind).toBe('abstract');
    expect(q.blocksOf(abstract)).toEqual([
      paragraph([{ kind: 'text', text: 'Kort sagt.', marks: {} }]),
      paragraph([{ kind: 'text', text: 'Og litt til.', marks: {} }]),
    ]);
    // In English where the document says no language.
    const [articleAbstract, argument] = q.tree().children.get(article)!;
    expect(q.node(articleAbstract)?.title).toBe('Abstract');
    expect(q.node(argument)?.title).toBe('Argument');
    // A cover without an abstract.
    const [chapterCover] = q.tree().children.get(chapter)!;
    expect(q.node(chapterCover)?.kind).toBe('cover');
    expect(q.usedPictures().map((u) => u.hash)).toEqual(['abc123', 'def456']);
    // The document is made of them: the front matter first, then what a cover output prints.
    expect(buildDocument(q, book).parts.map((part) => part.kind)).toEqual(['abstract', 'cover']);

    // By the project when it begins, outside undo.
    const r = new Project(null);
    r.load(Y.encodeStateAsUpdate(p.doc), []);
    expect(r.begin('Wrath')).toBe(true);
    expect(r.canUndo).toBe(false);
    expect(r.begin('Wrath')).toBe(false);
    expect(r.tree().children.get(book)).toHaveLength(3);
  });

  it('an abstract of blank words, or a cover without a picture, only goes', () => {
    const p = new Project(null);
    p.begin('Wrath');
    const book = p.addChild(PROJECT, { title: 'Book' })!;
    p.transact(() => {
      p.yNodes.get(book)!.set('document', { abstract: '  ', cover: {}, title: 'T' });
    });
    expect(needsMigration(p.doc)).toBe(true);
    expect(migrate(p.doc, 'Wrath')).toBe(true);
    expect(p.node(book)?.document).toEqual({ title: 'T' });
    expect(p.tree().children.get(book) ?? []).toEqual([]);
    expect(needsMigration(p.doc)).toBe(false);
  });
});

describe('texts written in the shape of before ADR 0040', () => {
  type Make = (parent: Y.XmlElement | Y.XmlFragment) => void;
  const el =
    (name: string, attrs: Record<string, unknown>, ...content: (string | Make)[]): Make =>
    (parent) => {
      const e = new Y.XmlElement(name);
      for (const [key, value] of Object.entries(attrs)) e.setAttribute(key, value as string);
      parent.insert(parent.length, [e]);
      for (const c of content) {
        if (typeof c === 'string') e.insert(e.length, [new Y.XmlText(c)]);
        else c(e);
      }
    };
  const t = (text: string): Inline => ({ kind: 'text', text, marks: {} });

  /** A project in one tree whose texts, own kinds, kinds of elements and hand are as they were written before. */
  function oldTexts() {
    const p = new Project(null);
    p.begin('Wrath');
    const a = p.addChild(PROJECT, { title: 'A' })!;
    const b = p.addChild(PROJECT, { title: 'B' })!;
    const letter = p.createPassageKind({
      name: 'Letter',
      family: 'paragraph',
      basedOn: 'text',
      look: {},
    })!;
    const chorus = p.createPassageKind({
      name: 'Chorus',
      family: 'paragraph',
      basedOn: 'verse',
      look: {},
    })!;
    const kind = p.createKind({ name: 'Poem', colour: 'teal', template: '', begins: 'verse' })!;
    const item = p.createKind({ name: 'List', colour: 'rose', template: '', begins: 'list' })!;
    p.transact(() => {
      const body = p.fragment(a, 'body')!;
      body.delete(0, body.length);
      for (const make of [
        el('paragraph', {}, 'Before.'),
        el(
          'blockquote',
          {},
          el('paragraph', {}, 'Quoted.'),
          el('passage', { name: 'attribution' }, 'Homer'),
        ),
        el(
          'verse',
          { start: 45, by: 5 },
          el('verse_line', { kind: 'speaker', indent: 0 }, 'Nurse'),
          el('verse_line', { kind: 'line', indent: 1, margin: 'ia.' }, 'If only'),
        ),
        el('passage', { name: chorus }, 'Of the chorus'),
        el('script', { part: 'scene' }, 'INT. HOUSE'),
        el('passage', { name: letter }, 'Dear reader,'),
        el(
          'bullet_list',
          {},
          el('list_item', {}, el('paragraph', {}, 'one')),
          el(
            'list_item',
            {},
            el('paragraph', {}, 'two'),
            el('ordered_list', { start: 4 }, el('list_item', {}, el('paragraph', {}, 'four'))),
          ),
        ),
        el('paragraph', {}, 'After.'),
        el(
          'parallel',
          {},
          el('parallel_side', {}, el('verse', {}, el('verse_line', {}, 'Left'))),
          el('parallel_side', {}, el('paragraph', {}, 'Right')),
        ),
      ])
        make(body);
      const other = p.fragment(b, 'body')!;
      other.delete(0, other.length);
      el('paragraph', {}, 'Plain only.')(other);
      p.yMeta.set('hand', { pinned: ['epigraph'], unpinned: [] });
      p.yMeta.delete('texts');
    });
    return { p, a, b, letter, chorus, kind, item };
  }

  it('are written anew as paragraphs of a kind in passages, in their place, once', () => {
    const { p, a, b, letter, chorus, kind, item } = oldTexts();
    expect(needsMigration(p.doc)).toBe(true);
    const body = p.fragment(a, 'body')!;
    const before = body.get(0) as Y.XmlElement;
    const after = body.get(7) as Y.XmlElement;
    const plain = p.fragment(b, 'body')!.get(0);
    expect(migrate(p.doc, 'Wrath')).toBe(true);
    expect(needsMigration(p.doc)).toBe(false);
    expect(migrate(p.doc, 'Wrath')).toBe(false);

    // What was no old shape stays as it was, so that comments on it keep their place.
    expect(body.get(0)).toBe(before);
    expect(body.get(6)).toBe(after);
    expect(p.fragment(b, 'body')!.get(0)).toBe(plain);
    expect(body.toArray().map((e) => (e as Y.XmlElement).nodeName)).toEqual([
      'paragraph',
      'passage',
      'passage',
      'passage',
      'passage',
      'passage',
      'paragraph',
      'parallel',
    ]);
    expect(readBody(body, p.passageKinds)).toEqual([
      paragraph([t('Before.')]),
      passage('quotation', [
        paragraph([t('Quoted.')], 'quote'),
        paragraph([t('Homer')], 'attribution'),
      ]),
      passage(
        'verse',
        [
          paragraph([t('Nurse')], 'speaker'),
          paragraph([t('If only')], 'line', { indent: 1, number: '45', margin: 'ia.' }),
          paragraph([t('Of the chorus')], chorus),
        ],
        'counted',
      ),
      passage('script', [paragraph([t('INT. HOUSE')], 'scene')]),
      passage(letter, [paragraph([t('Dear reader,')], letter)]),
      passage('list', [
        paragraph([t('one')], 'item'),
        paragraph([t('two')], 'item'),
        paragraph([t('four')], 'numbered', { indent: 1, number: '4' }),
      ]),
      paragraph([t('After.')]),
      {
        kind: 'parallel',
        left: [passage('verse', [paragraph([t('Left')], 'line')])],
        right: [paragraph([t('Right')])],
      },
    ]);
    // The hand goes; verse and list are line and item in the writer's own kinds and in what elements begin in.
    expect(p.yMeta.has('hand')).toBe(false);
    expect(p.yMeta.get('texts')).toBe(TEXTS_SHAPE);
    expect(p.yPassageKinds.get(chorus)!.get('basedOn')).toBe('line');
    expect(p.yPassageKinds.get(letter)!.get('basedOn')).toBe('text');
    expect(p.yKinds.get(kind)!.get('begins')).toBe('line');
    expect(p.yKinds.get(item)!.get('begins')).toBe('item');
  });

  it('is done by the project when it begins, outside undo, and the project reads the new shape', () => {
    const { p, a } = oldTexts();
    const q = new Project(null);
    q.load(Y.encodeStateAsUpdate(p.doc), []);
    expect(q.begin('Wrath')).toBe(true);
    expect(q.canUndo).toBe(false);
    expect(q.begin('Wrath')).toBe(false);
    expect(q.blocksOf(a)[1]).toEqual(
      passage('quotation', [
        paragraph([t('Quoted.')], 'quote'),
        paragraph([t('Homer')], 'attribution'),
      ]),
    );
    expect(q.node(a)!.uses).toEqual(
      expect.arrayContaining([
        'quote',
        'attribution',
        'speaker',
        'line',
        'scene',
        'item',
        'numbered',
      ]),
    );
    // A project that begins now says its texts are in shape, and is not read through again.
    const fresh = new Project(null);
    expect(fresh.begin('New')).toBe(true);
    expect(fresh.yMeta.get('texts')).toBe(TEXTS_SHAPE);
    expect(fresh.begin('New')).toBe(false);
  });
});
