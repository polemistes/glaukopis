import { yXmlFragmentToProseMirrorRootNode } from 'y-prosemirror';
import { describe, expect, it } from 'vitest';
import * as Y from 'yjs';
import { bodySchema } from '$lib/editor/schema';
import { Notebook } from './notebook.svelte';
import { cleanStartText } from './starts';

/** The paragraphs of a note as the editor reads them: their kind and their words. */
function paragraphs(nb: Notebook, id: string): [string, string][] {
  const node = yXmlFragmentToProseMirrorRootNode(nb.fragment(id)!, bodySchema);
  node.check();
  const out: [string, string][] = [];
  node.forEach((child) => out.push([child.attrs.kind as string, child.textContent]));
  return out;
}

describe('starting texts', () => {
  it('are made, named, changed and kept in the notebook', () => {
    const nb = new Notebook();
    expect(nb.starts).toEqual([]);
    const id = nb.addStart({ name: ' Plan ', text: 'Goal\nSteps', begins: 'item' });
    expect(nb.starts).toEqual([
      expect.objectContaining({ id, name: 'Plan', text: 'Goal\nSteps', begins: 'item' }),
    ]);
    nb.changeStart(id, { name: 'Week', text: 'Monday\r\nTuesday  \n\n', begins: '' });
    expect(nb.starts[0]).toEqual(
      expect.objectContaining({ name: 'Week', text: 'Monday\nTuesday', begins: '' }),
    );
    const again = new Notebook();
    again.load(Y.encodeStateAsUpdate(nb.doc), []);
    expect(again.starts).toEqual(nb.starts);
  });

  it('stand in their order, which is changed', () => {
    const nb = new Notebook();
    const a = nb.addStart({ name: 'A' });
    const b = nb.addStart({ name: 'B' });
    const c = nb.addStart({ name: 'C' });
    expect(nb.starts.map((s) => s.id)).toEqual([a, b, c]);
    nb.moveStart(c, a);
    expect(nb.starts.map((s) => s.id)).toEqual([c, a, b]);
    nb.moveStart(c, null);
    expect(nb.starts.map((s) => s.id)).toEqual([a, b, c]);
    nb.moveStart(a, c);
    expect(nb.starts.map((s) => s.id)).toEqual([b, a, c]);
  });

  it('are deleted, and undone as everything is', () => {
    const nb = new Notebook();
    nb.checkpoint();
    const a = nb.addStart({ name: 'A', text: 'One' });
    nb.checkpoint();
    nb.changeStart(a, { text: 'Two' });
    nb.checkpoint();
    nb.undo();
    expect(nb.starts[0].text).toBe('One');
    nb.deleteStart(a);
    expect(nb.starts).toEqual([]);
    nb.checkpoint();
    nb.undo();
    expect(nb.starts.map((s) => s.name)).toEqual(['A']);
    nb.undo();
    expect(nb.starts).toEqual([]);
  });

  it('do nothing where nothing changes', () => {
    const nb = new Notebook();
    const a = nb.addStart({ name: 'A', text: 'One' });
    const before = nb.revision;
    nb.changeStart(a, { name: ' A ', text: 'One\n' });
    nb.changeStart('gone', { name: 'B' });
    expect(nb.revision).toBe(before);
  });

  it('keeps the lines as written within, without line ends of other systems or empty lines at the ends', () => {
    expect(cleanStartText('\n\nOne  \r\n\r\nTwo\n')).toBe('One\n\nTwo');
  });
});

describe('a note begun from a starting text', () => {
  it('holds its lines, each a paragraph of its kind', () => {
    const nb = new Notebook();
    const plan = nb.addStart({ name: 'Plan', text: 'Ask\nRead\nWrite', begins: 'numbered' });
    const id = nb.addNoteFrom(plan, { box: 'first', tags: ['plans'] });
    expect(paragraphs(nb, id)).toEqual([
      ['numbered', 'Ask'],
      ['numbered', 'Read'],
      ['numbered', 'Write'],
    ]);
    expect(nb.note(id)!.tags).toEqual(['plans']);
    expect(nb.note(id)!.seen).toBe(true);
  });

  it('holds lines of text, where the kind is none', () => {
    const nb = new Notebook();
    const s = nb.addStart({ name: 'Letter', text: 'Dear\nYours' });
    expect(paragraphs(nb, nb.addNoteFrom(s))).toEqual([
      ['text', 'Dear'],
      ['text', 'Yours'],
    ]);
  });

  it('begins with an empty point, where the starting text has a kind and no lines', () => {
    const nb = new Notebook();
    const s = nb.addStart({ name: 'List', begins: 'item' });
    expect(paragraphs(nb, nb.addNoteFrom(s))).toEqual([['item', '']]);
  });

  it('is a plain note, where the starting text is not there, or says nothing', () => {
    const nb = new Notebook();
    expect(paragraphs(nb, nb.addNoteFrom('gone'))).toEqual([['text', '']]);
    const empty = nb.addStart({ name: 'Nothing' });
    expect(paragraphs(nb, nb.addNoteFrom(empty))).toEqual([['text', '']]);
  });

  it('is made in one step of undo', () => {
    const nb = new Notebook();
    const s = nb.addStart({ name: 'Plan', text: 'One', begins: 'item' });
    nb.checkpoint();
    const id = nb.addNoteFrom(s);
    nb.checkpoint();
    nb.undo();
    expect(nb.note(id)).toBeUndefined();
    expect(nb.starts.length).toBe(1);
  });
});
