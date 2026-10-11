import { describe, expect, it } from 'vitest';
import * as Y from 'yjs';
import { migrate, needsMigration } from './migrate';
import { Project } from './project.svelte';
import { fillTitle } from './text';
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
    expect(doc.getMap('meta').get('hand')).toEqual({ pinned: ['quote'], unpinned: [] });

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
