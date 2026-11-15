import { describe, expect, it, vi } from 'vitest';
import * as Y from 'yjs';

/** How many times the text of a note has been read. */
const counted = vi.hoisted(() => ({ readings: 0 }));
vi.mock('./pieces', async (original) => {
  const pieces = await original<typeof import('./pieces')>();
  return {
    ...pieces,
    piecesOf: (...args: Parameters<typeof pieces.piecesOf>) => {
      counted.readings++;
      return pieces.piecesOf(...args);
    },
  };
});

const { Notebook } = await import('./notebook.svelte');
const { cleanTag, compareWords } = await import('./tags');

function two() {
  const a = new Notebook();
  const b = new Notebook();
  b.load(Y.encodeStateAsUpdate(a.doc), []);
  const sync = () => {
    Y.applyUpdate(b.doc, Y.encodeStateAsUpdate(a.doc, Y.encodeStateVector(b.doc)), 'remote');
    Y.applyUpdate(a.doc, Y.encodeStateAsUpdate(b.doc, Y.encodeStateVector(a.doc)), 'remote');
  };
  return { a, b, sync };
}

describe('a tag cleaned', () => {
  it('is trimmed, its spaces made one, a leading # taken away, at most sixty signs', () => {
    expect(cleanTag('  grey   eyed ')).toBe('grey eyed');
    expect(cleanTag('#Homer')).toBe('Homer');
    expect(cleanTag('# Homer')).toBe('Homer');
    expect(cleanTag('##two')).toBe('#two');
    expect(cleanTag('   ')).toBe('');
    expect(cleanTag('#')).toBe('');
    expect(cleanTag('ἀ'.repeat(70))).toBe('ἀ'.repeat(60));
    expect([...cleanTag('😀'.repeat(61))].length).toBe(60);
  });

  it('tags sort as words do, and are told apart as they are written', () => {
    expect(['b', 'Homer', 'a10', 'homer', 'a9', 'Ø'].sort(compareWords)).toEqual([
      'a9',
      'a10',
      'b',
      'Homer',
      'homer',
      'Ø',
    ]);
  });
});

describe('the tags of notes', () => {
  it('are given and taken away, each one step of undo, and counted', () => {
    const nb = new Notebook();
    const a = nb.addNote();
    const b = nb.addNote({ tags: [' #owl ', 'owl', ''] });
    nb.checkpoint();
    expect(nb.note(b)!.tags).toEqual(['owl']);
    expect(nb.tags).toEqual([{ tag: 'owl', count: 1 }]);

    nb.addTag([a, b], 'Homer');
    nb.checkpoint();
    nb.addTag([a], 'homer');
    nb.checkpoint();
    nb.addTag([a], '  ');
    expect(nb.note(a)!.tags).toEqual(['Homer', 'homer']);
    expect(nb.note(b)!.tags).toEqual(['Homer', 'owl']);
    expect(nb.tags).toEqual([
      { tag: 'Homer', count: 2 },
      { tag: 'homer', count: 1 },
      { tag: 'owl', count: 1 },
    ]);

    nb.removeTag([a, b], 'Homer');
    nb.checkpoint();
    expect(nb.tags).toEqual([
      { tag: 'homer', count: 1 },
      { tag: 'owl', count: 1 },
    ]);
    nb.undo();
    expect(nb.tags[0]).toEqual({ tag: 'Homer', count: 2 });
    nb.undo();
    expect(nb.note(a)!.tags).toEqual(['Homer']);
    nb.undo();
    expect(nb.tags).toEqual([{ tag: 'owl', count: 1 }]);
  });

  it('a tag renamed everywhere is made one with one of that name; a tag deleted is gone from every note', () => {
    const nb = new Notebook();
    const a = nb.addNote({ tags: ['Homer', 'epic'] });
    const b = nb.addNote({ tags: ['Homeros', 'epic'] });
    const c = nb.addNote({ tags: ['Homer', 'Homeros'] });
    nb.checkpoint();
    nb.renameTag('Homeros', ' Homer ');
    nb.checkpoint();
    expect(nb.note(a)!.tags).toEqual(['epic', 'Homer']);
    expect(nb.note(b)!.tags).toEqual(['epic', 'Homer']);
    expect(nb.note(c)!.tags).toEqual(['Homer']);
    expect(nb.tags).toEqual([
      { tag: 'epic', count: 2 },
      { tag: 'Homer', count: 3 },
    ]);
    // To nothing, nothing happens.
    nb.renameTag('Homer', '#');
    expect(nb.tags.length).toBe(2);
    nb.undo();
    expect(nb.note(c)!.tags).toEqual(['Homer', 'Homeros']);
    expect(nb.tags).toEqual([
      { tag: 'epic', count: 2 },
      { tag: 'Homer', count: 2 },
      { tag: 'Homeros', count: 2 },
    ]);

    nb.deleteTag('epic');
    nb.checkpoint();
    expect(nb.tags.map((t) => t.tag)).toEqual(['Homer', 'Homeros']);
    nb.undo();
    expect(nb.tags.map((t) => t.tag)).toEqual(['epic', 'Homer', 'Homeros']);
  });

  it('a note deleted takes its tags out of the count', () => {
    const nb = new Notebook();
    const a = nb.addNote({ tags: ['one', 'two'] });
    nb.addNote({ tags: ['two'] });
    nb.deleteNotes([a]);
    expect(nb.tags).toEqual([{ tag: 'two', count: 1 }]);
  });

  it('two copies see each other’s tags', () => {
    const { a, b, sync } = two();
    const id = a.addNote();
    sync();
    a.addTag([id], 'from a');
    b.addTag([id], 'from b');
    sync();
    expect(a.note(id)!.tags).toEqual(['from a', 'from b']);
    expect(b.tags.map((t) => t.tag)).toEqual(['from a', 'from b']);
    b.renameTag('from a', 'from b');
    sync();
    expect(a.tags).toEqual([{ tag: 'from b', count: 1 }]);
  });

  it('a loaded notebook counts its tags', () => {
    const nb = new Notebook();
    nb.addNote({ tags: ['x'] });
    nb.addNote({ tags: ['x', 'y'] });
    const again = new Notebook();
    again.load(Y.encodeStateAsUpdate(nb.doc), []);
    expect(again.tags).toEqual([
      { tag: 'x', count: 2 },
      { tag: 'y', count: 1 },
    ]);
  });

  it('with a thousand notes, the list of tags is kept up without reading the texts again', () => {
    const nb = new Notebook();
    const ids: string[] = [];
    nb.transact(() => {
      for (let i = 0; i < 1000; i++) {
        const id = nb.addNote({ tags: [`tag ${i % 50}`, 'all'] });
        nb.addText(id, `Note number ${i}, with some words in it`);
        ids.push(id);
      }
    });
    expect(nb.tags.length).toBe(51);
    expect(nb.tags.find((t) => t.tag === 'all')!.count).toBe(1000);

    counted.readings = 0;
    const list = nb.tags;
    nb.addTag([ids[0]], 'new');
    expect(nb.tags).not.toBe(list);
    expect(nb.tags.find((t) => t.tag === 'new')!.count).toBe(1);
    nb.removeTag([ids[1]], 'all');
    nb.renameTag('tag 7', 'tag 8');
    expect(nb.tags.find((t) => t.tag === 'tag 8')!.count).toBe(40);
    nb.deleteTag('tag 9');
    expect(nb.tags.find((t) => t.tag === 'all')!.count).toBe(999);
    // No text was read for any of this.
    expect(counted.readings).toBe(0);

    // Writing in one note reads that note, and leaves the list as it was.
    const before = nb.tags;
    nb.addText(ids[2], 'More words');
    expect(counted.readings).toBe(1);
    expect(nb.tags).toBe(before);
  });
});
