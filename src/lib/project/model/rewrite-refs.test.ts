import { describe, expect, it } from 'vitest';
import * as Y from 'yjs';
import { writeBody, writeName } from './blocks';
import { Project } from './project.svelte';
import { citedIds, citedRecords, keepRecords, rewriteReferences } from './rewrite-refs';
import type { Block, Inline } from './text';
import { PROJECT, type RefRecord } from './types';

const t = (text: string): Inline => ({ kind: 'text', text, marks: {} });
const cite = (...ids: string[]): Inline => ({
  kind: 'citation',
  items: ids.map((id, i) => (i ? { id } : { id, locator: '73' })),
  mode: 'normal',
});

function record(id: string, title: string, modified = '2026-10-01T00:00:00Z'): RefRecord {
  return {
    id,
    key: title.toLowerCase().replace(/\W+/g, ''),
    type: 'book',
    fields: { title },
    names: { author: [{ family: 'Nagy', given: 'Gregory' }] },
    modified,
    authors: 'Nagy',
    year: '1979',
    title,
    container: '',
  };
}

/** A project that cites works in a name, a text, a note and a caption, as one written elsewhere. */
function written(): Uint8Array {
  const p = new Project(null);
  p.begin('Wrath');
  const a = p.addChild(PROJECT, { title: 'A' })!;
  const body: Block[] = [
    paragraph([
      t('As '),
      cite('r1', 'r2'),
      t(' says.'),
      { kind: 'footnote', content: [t('So '), cite('r1')] },
    ]),
    {
      kind: 'figure',
      id: 'f1',
      file: 'b'.repeat(64),
      extension: 'png',
      name: 'shield.png',
      caption: [t('The shield, after '), cite('r3')],
      alt: '',
      width: 50,
      numbered: true,
    },
  ];
  p.transact(() => {
    writeBody(p.fragment(a, 'body')!, body);
    writeName(p.fragment(a, 'title')!, [t('On '), cite('r2')]);
  });
  for (const id of ['r1', 'r2', 'r3', 'unused']) p.putReference(record(id, `Work ${id}`));
  p.setNote('r1', 'Read again.');
  p.setNote('r2', 'On wrath.');
  return Y.encodeStateAsUpdate(p.doc);
}

/** The project as it is opened from a file. */
function opened(): Project {
  const p = new Project(null);
  p.load(written(), []);
  return p;
}

/** Every citation's items, in the order of the text, in names and texts alike. */
function allItems(p: Project): unknown[] {
  const out: unknown[] = [];
  const walk = (f: Y.XmlFragment) => {
    for (const child of f.toArray()) {
      if (!(child instanceof Y.XmlElement)) continue;
      if (child.nodeName === 'citation') out.push(child.getAttribute('items'));
      else walk(child);
    }
  };
  for (const n of p.yNodes.values())
    for (const v of n.values()) if (v instanceof Y.XmlFragment) walk(v);
  return out;
}

describe('the works a project cites', () => {
  it('are found in names, texts, notes and captions', () => {
    const p = opened();
    expect([...citedIds(p)].sort()).toEqual(['r1', 'r2', 'r3']);
    expect(
      citedRecords(p)
        .map((r) => r.id)
        .sort(),
    ).toEqual(['r1', 'r2', 'r3']);
  });

  it('are cited anew by other ids everywhere, with their records and notes', () => {
    const p = opened();
    const library = record('lib-1', 'The Best of the Achaeans');
    rewriteReferences(p, [
      { from: 'r1', to: 'lib-1', record: library },
      { from: 'r2', to: 'r2', record: record('r2', 'Work r2, as the library has it') },
      { from: 'r3', to: 'r3', record: null },
    ]);
    const items = JSON.stringify(allItems(p));
    expect(items).not.toContain('"r1"');
    expect(allItems(p)).toContainEqual([{ id: 'lib-1', locator: '73' }, { id: 'r2' }]);
    expect(allItems(p)).toContainEqual([{ id: 'lib-1', locator: '73' }]);
    expect(allItems(p)).toContainEqual([{ id: 'r3', locator: '73' }]);
    expect([...citedIds(p)].sort()).toEqual(['lib-1', 'r2', 'r3']);
    // The project reads them as it reads any change.
    const element = [...p.nodes.values()].find((n) => n.title.startsWith('On'))!;
    expect(element.cited).toEqual(['lib-1', 'r2', 'r3']);

    expect(p.refs.has('r1')).toBe(false);
    expect(p.refs.get('lib-1')).toEqual(library);
    expect(p.refs.get('r2')!.title).toBe('Work r2, as the library has it');
    expect(p.refs.get('r3')!.title).toBe('Work r3');
    expect(p.refs.has('unused')).toBe(true);
    expect(p.notes.get('lib-1')).toBe('Read again.');
    expect(p.notes.has('r1')).toBe(false);
  });

  it('are one work where two become one, and what was said of both is kept', () => {
    const p = opened();
    const one = record('lib-1', 'The Best of the Achaeans');
    rewriteReferences(p, [
      { from: 'r1', to: 'lib-1', record: one },
      { from: 'r2', to: 'lib-1', record: one },
    ]);
    expect(allItems(p)).toContainEqual([{ id: 'lib-1', locator: '73' }, { id: 'lib-1' }]);
    expect(p.notes.get('lib-1')).toBe('Read again.\n\nOn wrath.');
    expect([...p.refs.keys()].sort()).toEqual(['lib-1', 'r3', 'unused']);
  });

  it('are written anew as a change that is saved and not undone', () => {
    const p = opened();
    const changes: Uint8Array[] = [];
    p.doc.on('update', (u: Uint8Array) => changes.push(u));
    rewriteReferences(p, [{ from: 'r1', to: 'lib-1', record: null }]);
    expect(changes).toHaveLength(1);
    expect(p.canUndo).toBe(false);
    p.undo();
    expect(citedIds(p).has('lib-1')).toBe(true);
    expect(p.refs.get('lib-1')!.title).toBe('Work r1');

    // Another copy that takes the change has it as well.
    const other = new Project(null);
    other.load(Y.encodeStateAsUpdate(p.doc), []);
    expect([...citedIds(other)].sort()).toEqual(['lib-1', 'r2', 'r3']);
  });

  it('are kept as the library has them, even where the project had a later record', () => {
    const p = opened();
    p.putReference(record('r1', 'Later', '2030-01-01T00:00:00Z'));
    keepRecords(p, [record('r1', 'As the library has it', '2026-01-01T00:00:00Z')]);
    expect(p.refs.get('r1')!.title).toBe('As the library has it');
    expect(p.canUndo).toBe(false);
  });
});
