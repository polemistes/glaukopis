import { describe, expect, it } from 'vitest';
import * as Y from 'yjs';
import { Notebook } from './notebook.svelte';

describe('links between notes', () => {
  it('one for a pair, either way, none to itself or to a note that is not there', () => {
    const nb = new Notebook();
    const a = nb.addNote();
    const b = nb.addNote();
    const c = nb.addNote();
    nb.checkpoint();
    const ab = nb.addLink(a, b)!;
    nb.checkpoint();
    expect(ab).toBeTruthy();
    expect(nb.addLink(b, a)).toBe(ab);
    expect(nb.addLink(a, a)).toBeNull();
    expect(nb.addLink(a, 'gone')).toBeNull();
    const bc = nb.addLink(b, c)!;
    nb.checkpoint();
    expect(nb.links.map((l) => l.id).sort()).toEqual([ab, bc].sort());
    expect(nb.links.find((l) => l.id === ab)).toEqual({ id: ab, from: a, to: b, label: '' });
    expect(
      nb
        .linksAt(b)
        .map((l) => l.id)
        .sort(),
    ).toEqual([ab, bc].sort());
    expect(nb.linksAt(a).map((l) => l.id)).toEqual([ab]);
    nb.undo();
    expect(nb.links.map((l) => l.id)).toEqual([ab]);
    nb.undo();
    expect(nb.links).toEqual([]);
  });

  it('have words, an arrow and a colour, as an association has, each one step of undo', () => {
    const nb = new Notebook();
    const a = nb.addNote();
    const b = nb.addNote();
    const id = nb.addLink(a, b)!;
    nb.checkpoint();
    nb.setLinkLabel(id, '  answers \n\n\n\n  ');
    nb.checkpoint();
    nb.setLinkArrow(id, 'to');
    nb.checkpoint();
    nb.setLinkColour(id, 'not a colour');
    expect(nb.links[0].colour).toBeUndefined();
    nb.setLinkColour(id, 'blue');
    nb.checkpoint();
    expect(nb.links[0]).toEqual({
      id,
      from: a,
      to: b,
      label: 'answers',
      arrow: 'to',
      colour: 'blue',
    });
    nb.undo();
    expect(nb.links[0].colour).toBeUndefined();
    nb.undo();
    expect(nb.links[0].arrow).toBeUndefined();
    nb.undo();
    expect(nb.links[0].label).toBe('');
    nb.redo();
    nb.redo();
    nb.redo();
    nb.setLinkArrow(id, null);
    nb.setLinkColour(id, null);
    expect(nb.links[0]).toEqual({ id, from: a, to: b, label: 'answers' });
    nb.removeLink(id);
    expect(nb.links).toEqual([]);
  });

  it('a note deleted takes its links with it, in the same step of undo', () => {
    const nb = new Notebook();
    const a = nb.addNote();
    const b = nb.addNote();
    const c = nb.addNote();
    const ab = nb.addLink(a, b)!;
    const bc = nb.addLink(b, c)!;
    const ac = nb.addLink(a, c)!;
    nb.checkpoint();
    nb.deleteNotes([b]);
    expect(nb.links.map((l) => l.id)).toEqual([ac]);
    expect(nb.yLinks.has(ab)).toBe(false);
    expect(nb.yLinks.has(bc)).toBe(false);
    nb.undo();
    expect(nb.note(b)).toBeDefined();
    expect(nb.links.map((l) => l.id).sort()).toEqual([ab, bc, ac].sort());
  });

  it('a link to a note deleted in another copy is not shown', () => {
    const a = new Notebook();
    const b = new Notebook();
    const x = a.addNote();
    const y = a.addNote();
    b.load(Y.encodeStateAsUpdate(a.doc), []);
    a.addLink(x, y);
    b.deleteNotes([y]);
    Y.applyUpdate(b.doc, Y.encodeStateAsUpdate(a.doc, Y.encodeStateVector(b.doc)), 'remote');
    Y.applyUpdate(a.doc, Y.encodeStateAsUpdate(b.doc, Y.encodeStateVector(a.doc)), 'remote');
    expect(a.links).toEqual([]);
    expect(b.links).toEqual([]);
  });
});
