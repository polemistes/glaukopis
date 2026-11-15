import { yXmlFragmentToProseMirrorRootNode } from 'y-prosemirror';
import { describe, expect, it } from 'vitest';
import { bodySchema } from '$lib/editor/schema';
import { Notebook } from './notebook.svelte';

const HASH = 'a'.repeat(64);
const OTHER = 'b'.repeat(64);

function asEditorReads(nb: Notebook, id: string) {
  const node = yXmlFragmentToProseMirrorRootNode(nb.fragment(id)!, bodySchema);
  node.check();
  return node;
}

describe('notes joined', () => {
  it('the texts of the others follow the first’s, as they are, with their marks, figures and files', () => {
    const nb = new Notebook();
    const web = nb.addSource({ sort: 'web', url: 'https://a.org', title: '', read: 'now' });
    const first = nb.addNote({ name: 'Owls' });
    nb.addText(first, 'My own words');
    const second = nb.addNote();
    const passage = nb.addPassage(web, 'Sing, goddess');
    nb.addText(second, 'Sing, goddess', passage);
    nb.holdFile({ hash: HASH, name: 'owl.png', extension: 'png' }, web);
    nb.addFigure(second, { hash: HASH, name: 'owl.png', extension: 'png', alt: 'An owl' });
    const third = nb.addNote();
    nb.addFile(third, { hash: OTHER, name: 'letter.pdf', extension: 'pdf' });
    nb.checkpoint();

    expect(nb.join([first, second, third])).toBe(first);
    expect(nb.note(second)).toBeUndefined();
    expect(nb.note(third)).toBeUndefined();
    const node = asEditorReads(nb, first);
    expect(node.childCount).toBe(4);
    expect(node.child(0).textContent).toBe('My own words');
    const taken = node.child(1);
    expect(taken.textContent).toBe('Sing, goddess');
    expect(taken.firstChild!.marks.map((m) => [m.type.name, m.attrs.passage])).toEqual([
      ['taken', passage],
    ]);
    expect(node.child(2).type.name).toBe('figure');
    expect(node.child(2).attrs).toMatchObject({ file: HASH, name: 'owl.png', alt: 'An owl' });
    expect(node.child(3).type.name).toBe('file');
    expect(node.child(3).attrs).toEqual({ hash: OTHER, name: 'letter.pdf', extension: 'pdf' });
    // The sources go with the pieces.
    const record = nb.note(first)!;
    expect(record.pieces.map((p) => p.kind)).toEqual(['own', 'passage', 'figure', 'file']);
    expect(record.sources).toEqual([web, null]);
    expect(nb.changedSince(first, passage)).toBe(false);
    expect(nb.summary().files).toEqual([HASH, OTHER].sort());
  });

  it('it has the tags of all, keeps its box, place, width and name, and takes a name where it has none', () => {
    const nb = new Notebook();
    const box = nb.addBox('Box');
    const first = nb.addNote({ box, at: { x: 10, y: 20 }, width: 400, tags: ['a'] });
    const second = nb.addNote({ name: 'Second', tags: ['b', 'a'], at: { x: 500, y: 500 } });
    const third = nb.addNote({ name: 'Third', tags: ['c'] });
    nb.join([first, second, third]);
    expect(nb.note(first)).toMatchObject({
      name: 'Second',
      box,
      at: { x: 10, y: 20 },
      width: 400,
      tags: ['a', 'b', 'c'],
    });
    expect(nb.tags).toEqual([
      { tag: 'a', count: 1 },
      { tag: 'b', count: 1 },
      { tag: 'c', count: 1 },
    ]);
    const named = nb.addNote({ name: 'Mine' });
    const other = nb.addNote({ name: 'Theirs' });
    nb.join([named, other]);
    expect(nb.note(named)!.name).toBe('Mine');
  });

  it('every link of the others is its own; one to itself, or doubling another, goes', () => {
    const nb = new Notebook();
    const [first, second, third, x, y] = ['1', '2', '3', 'x', 'y'].map((n) =>
      nb.addNote({ name: n }),
    );
    const firstX = nb.addLink(first, x)!;
    nb.setLinkLabel(firstX, 'kept');
    const secondX = nb.addLink(x, second)!;
    nb.setLinkLabel(secondX, 'doubles');
    const secondY = nb.addLink(second, y)!;
    nb.setLinkArrow(secondY, 'to');
    nb.setLinkColour(secondY, 'teal');
    const thirdY = nb.addLink(y, third)!;
    const firstSecond = nb.addLink(first, second)!;
    const secondThird = nb.addLink(second, third)!;
    nb.checkpoint();

    nb.join([first, second, third]);
    const links = Object.fromEntries(nb.links.map((l) => [l.id, l]));
    expect(Object.keys(links).sort()).toEqual([firstX, secondY].sort());
    expect(links[firstX]).toMatchObject({ from: first, to: x, label: 'kept' });
    // Its arrow points as it did: from the note that stands now.
    expect(links[secondY]).toEqual({
      id: secondY,
      from: first,
      to: y,
      label: '',
      arrow: 'to',
      colour: 'teal',
    });
    for (const gone of [secondX, thirdY, firstSecond, secondThird])
      expect(nb.yLinks.has(gone)).toBe(false);
  });

  it('what became of the others is its own', () => {
    const nb = new Notebook();
    const first = nb.addNote();
    const second = nb.addNote();
    nb.went(first, { what: 'text', project: 'P' });
    nb.went(second, { what: 'quotation', project: 'Q' });
    nb.join([first, second]);
    expect(nb.note(first)!.went.map((w) => [w.what, w.project])).toEqual([
      ['text', 'P'],
      ['quotation', 'Q'],
    ]);
  });

  it('an empty first takes the texts of the others in its place; the empty others give nothing', () => {
    const nb = new Notebook();
    const first = nb.addNote();
    const empty = nb.addNote();
    const second = nb.addNote();
    nb.addText(second, 'Words');
    nb.join([first, empty, second]);
    const node = asEditorReads(nb, first);
    expect(node.childCount).toBe(1);
    expect(node.textContent).toBe('Words');
    // All empty: one empty paragraph stays to write in.
    const a = nb.addNote();
    const b = nb.addNote();
    nb.join([a, b]);
    expect(asEditorReads(nb, a).childCount).toBe(1);
  });

  it('is one step of undo: undone, every note, link and tag is as it was', () => {
    const nb = new Notebook();
    const first = nb.addNote({ tags: ['a'] });
    nb.addText(first, 'One');
    const second = nb.addNote({ name: 'Two', tags: ['b'] });
    nb.addText(second, 'Two');
    const x = nb.addNote();
    const link = nb.addLink(second, x)!;
    const between = nb.addLink(first, second)!;
    nb.went(second, { what: 'text' });
    nb.checkpoint();
    const before = {
      first: nb.note(first)!,
      second: nb.note(second)!,
      links: nb.links,
      tags: nb.tags,
    };
    nb.join([first, second]);
    nb.undo();
    for (const id of [first, second]) {
      const was = before[id === first ? 'first' : 'second'];
      const now = nb.note(id)!;
      expect(now).toMatchObject({
        name: was.name,
        tags: was.tags,
        words: was.words,
        went: was.went,
        box: was.box,
        at: was.at,
      });
    }
    expect(nb.links).toEqual(before.links);
    expect(nb.links.map((l) => l.id).sort()).toEqual([link, between].sort());
    expect(nb.tags).toEqual(before.tags);
    expect(asEditorReads(nb, first).textContent).toBe('One');
    expect(asEditorReads(nb, second).textContent).toBe('Two');
    nb.redo();
    expect(nb.note(second)).toBeUndefined();
    expect(asEditorReads(nb, first).textContent).toBe('OneTwo');
  });

  it('fewer than two notes that are there: nothing', () => {
    const nb = new Notebook();
    const a = nb.addNote();
    expect(nb.join([a])).toBeNull();
    expect(nb.join([a, a])).toBeNull();
    expect(nb.join([a, 'gone'])).toBeNull();
    expect(nb.join([])).toBeNull();
    expect(nb.note(a)).toBeDefined();
  });
});
