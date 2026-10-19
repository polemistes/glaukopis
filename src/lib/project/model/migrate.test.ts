import { describe, expect, it } from 'vitest';
import * as Y from 'yjs';
import { term } from '$lib/i18n';
import { buildDocument } from './document';
import { migrate, needsMigration } from './migrate';
import { Project } from './project.svelte';
import { fillTitle, linemark, paragraph, readBody } from './text';
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

  it('a new document is the writer’s own, as their details in the settings say; one written before is not', () => {
    const author = { name: 'Anna Lind', affiliation: 'Oslo', orcid: '0000-0002-1825-0097' };
    const doc = new Y.Doc();
    expect(migrate(doc, 'Wrath', undefined, undefined, author)).toBe(true);
    const p = new Project(null);
    Y.applyUpdate(p.doc, Y.encodeStateAsUpdate(doc));
    expect(p.node(PROJECT)?.document.authors).toEqual([author]);
    // Written before, as maps: whoever wrote it, it is not made the writer's.
    const old = oldDocument();
    migrate(old, 'ignored', undefined, undefined, author);
    const q = new Project(null);
    Y.applyUpdate(q.doc, Y.encodeStateAsUpdate(old));
    expect(q.node(PROJECT)?.document.authors).toBeUndefined();
    // Without a name, nobody.
    const unnamed = new Y.Doc();
    migrate(unnamed, 'Wrath', undefined, undefined, { name: ' ' });
    const r = new Project(null);
    Y.applyUpdate(r.doc, Y.encodeStateAsUpdate(unnamed));
    expect(r.node(PROJECT)?.document.authors).toBeUndefined();
  });

  it('maps become children of the project, in order, with their settings; loose elements after them', () => {
    const doc = oldDocument();
    expect(migrate(doc, 'ignored')).toBe(true);
    expect(doc.getMap('maps').size).toBe(0);
    expect(doc.getMap('meta').get('language')).toBeUndefined();
    // The hand of a map goes, as the hand of the project does (ADR 0040).
    expect(doc.getMap('meta').get('hand')).toBeUndefined();

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

  it('made by two copies of a shared project, each by itself, is one element when they meet', () => {
    const { p, book, chapter } = withParts();
    const copies = [new Y.Doc(), new Y.Doc()];
    for (const doc of copies) {
      Y.applyUpdate(doc, Y.encodeStateAsUpdate(p.doc));
      migrate(doc, 'Wrath', undefined, term);
    }
    Y.applyUpdate(copies[0], Y.encodeStateAsUpdate(copies[1]));
    Y.applyUpdate(copies[1], Y.encodeStateAsUpdate(copies[0]));
    for (const doc of copies) {
      const q = new Project(null);
      q.load(Y.encodeStateAsUpdate(doc), []);
      const kinds = q
        .tree()
        .children.get(book)!
        .map((id) => q.node(id)?.kind ?? null);
      expect(kinds).toEqual(['cover', 'abstract', null]);
      expect(
        q
          .tree()
          .children.get(chapter)!
          .map((id) => q.node(id)?.kind),
      ).toEqual(['cover']);
      expect(q.blocksOf(q.tree().children.get(book)![1])).toHaveLength(2);
    }
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

describe('texts written in a shape of before', () => {
  it('are left as they are, and read without falling over', () => {
    const p = new Project(null);
    p.begin('Wrath');
    const a = p.addChild(PROJECT, { title: 'A' })!;
    p.transact(() => {
      const body = p.fragment(a, 'body')!;
      body.delete(0, body.length);
      const passage = new Y.XmlElement('passage');
      passage.setAttribute('family', 'verse');
      const line = new Y.XmlElement('paragraph');
      line.setAttribute('kind', 'line');
      line.setAttribute('number', '45');
      line.insert(0, [new Y.XmlText('If only')]);
      passage.insert(0, [line]);
      body.insert(0, [passage]);
    });
    expect(needsMigration(p.doc)).toBe(false);
    expect(migrate(p.doc, 'Wrath')).toBe(false);
    const body = p.fragment(a, 'body')!;
    expect((body.get(0) as Y.XmlElement).nodeName).toBe('passage');
    expect(readBody(body)).toEqual([
      paragraph([linemark({ number: '45' }), { kind: 'text', text: 'If only', marks: {} }], 'line'),
    ]);
  });
});
