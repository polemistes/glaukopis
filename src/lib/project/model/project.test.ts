import { describe, expect, it, vi } from 'vitest';
import * as Y from 'yjs';
import type { Template } from '$lib/api/templates';
import { Project, type Persistence, type Summary } from './project.svelte';
import { fillBody, paragraph } from './text';
import { PROJECT } from './types';
import { finishBeforeClose } from '$lib/state/closing';

/** A project begun: its own element at the top, named after it. */
function project() {
  const p = new Project(null);
  p.begin('Wrath');
  return { p, root: PROJECT };
}

/** Two copies of one project, that have seen each other's changes. */
function two() {
  const a = new Project(null);
  a.begin('Wrath');
  const b = new Project(null);
  b.load(Y.encodeStateAsUpdate(a.doc), []);
  const sync = () => {
    Y.applyUpdate(b.doc, Y.encodeStateAsUpdate(a.doc, Y.encodeStateVector(b.doc)), 'remote');
    Y.applyUpdate(a.doc, Y.encodeStateAsUpdate(b.doc, Y.encodeStateVector(a.doc)), 'remote');
  };
  return { a, b, root: PROJECT, sync };
}

/** A template of the writer's own, as the project keeps a copy of it. */
const own = (id: string, name = 'Letter'): Template => ({
  id,
  name,
  group: 'own',
  description: 'A letter.',
  basedOn: 'plain',
  layout: 'manuscript',
  contents: [{ part: 'title-page' }, { part: 'body' }, { kind: 'appendix' }],
  kinds: ['appendix'],
  passageKinds: [],
  requirements: { words: 2000, abstractWords: null, keywords: null, anonymous: false, note: '' },
  outputs: [{ id: 'document', targets: ['pdf', 'docx'] }],
});

const titles = (p: Project, ids: string[]) => ids.map((id) => p.node(id)!.title);

describe('the project and its elements', () => {
  it('a project begins with its own element, named after it', () => {
    const { p, root } = project();
    expect(p.name).toBe('Wrath');
    expect(p.node(root)!.title).toBe('Wrath');
    expect(p.node(root)!.parent).toBeNull();
    expect(p.tree().root).toBe(root);
    expect(p.tree().sequence).toEqual([root]);
    // Begun, it is begun: nothing is done to a project in shape, and nothing is undone.
    expect(p.begin('Other')).toBe(false);
    expect(p.name).toBe('Wrath');
    expect(p.canUndo).toBe(false);
  });

  it('children and siblings take their places', () => {
    const { p, root } = project();
    const a = p.addChild(root, { title: 'A' })!;
    const c = p.addChild(root, { title: 'C' })!;
    const b = p.addSibling(a, { title: 'B' })!;
    const first = p.addChild(root, { title: 'First', index: 0 })!;
    const a1 = p.addChild(a, { title: 'A1' })!;
    const tree = p.tree();
    expect(titles(p, tree.children.get(root)!)).toEqual(['First', 'A', 'B', 'C']);
    expect(titles(p, tree.sequence)).toEqual(['Wrath', 'First', 'A', 'A1', 'B', 'C']);
    expect(tree.depth.get(a1)).toBe(2);
    expect([first, b, c]).toHaveLength(3);
  });

  it('a name can be kept and put back as it was, with its marks', () => {
    const { p, root } = project();
    const a = p.addChild(root, { title: 'The word' })!;
    const title = p.fragment(a, 'title')!;
    p.transact(() => {
      const text = (title.get(0) as Y.XmlElement).get(0) as Y.XmlText;
      text.insert(text.length, ' mênis', { em: true });
    });
    const kept = p.copyTitle(a)!;
    p.setTitle(a, 'Something else');
    expect(p.node(a)!.title).toBe('Something else');
    p.restoreTitle(a, kept);
    expect(p.node(a)!.title).toBe('The word mênis');
    expect(title.toString()).toContain('<em> mênis</em>');
  });

  it('a sibling of the project element is a child of it', () => {
    const { p, root } = project();
    const x = p.addSibling(root, { title: 'X' })!;
    expect(p.tree().parent.get(x)).toBe(root);
  });

  it('the tree is seen from any element, with the way up still known', () => {
    const { p, root } = project();
    const a = p.addChild(root, { title: 'A' })!;
    const a1 = p.addChild(a, { title: 'A1' })!;
    const b = p.addChild(root, { title: 'B' })!;
    const view = p.tree(a);
    expect(view.root).toBe(a);
    expect(titles(p, view.sequence)).toEqual(['A', 'A1']);
    expect(view.depth.get(a)).toBe(0);
    expect(view.depth.get(a1)).toBe(1);
    expect(view.parent.get(a)).toBe(root);
    expect(p.pathTo(a1)).toEqual([root, a, a1]);
    expect(p.tree(b).sequence).toEqual([b]);
    // The same tree while nothing changes, and a new one after.
    expect(p.tree(a)).toBe(view);
    p.addChild(a1, { title: 'A1a' });
    expect(titles(p, p.tree(a).sequence)).toEqual(['A', 'A1', 'A1a']);
  });

  it('moving keeps the text and refuses to make a loop', () => {
    const { p, root } = project();
    const a = p.addChild(root, { title: 'A', body: 'The text of A.' })!;
    const a1 = p.addChild(a, { title: 'A1' })!;
    const b = p.addChild(root, { title: 'B' })!;
    expect(p.move([a], a1)).toEqual([]);
    expect(p.move([a], a)).toEqual([]);
    expect(p.move([root], b)).toEqual([]);
    expect(p.move([a], 'nobody')).toEqual([]);
    const body = p.fragment(a, 'body');
    expect(p.move([a], b)).toEqual([a]);
    const tree = p.tree();
    expect(tree.parent.get(a)).toBe(b);
    expect(tree.parent.get(a1)).toBe(a);
    // The very same content, not a copy of it.
    expect(p.fragment(a, 'body')).toBe(body);
    expect(p.node(a)!.words).toBe(4);
  });

  it('moving within a list counts places as the user sees them', () => {
    const { p, root } = project();
    const [a, b, c, d] = ['A', 'B', 'C', 'D'].map((t) => p.addChild(root, { title: t })!);
    p.move([a], root, 3); // before D
    expect(titles(p, p.tree().children.get(root)!)).toEqual(['B', 'C', 'A', 'D']);
    p.move([d, b], root, 0);
    expect(titles(p, p.tree().children.get(root)!)).toEqual(['D', 'B', 'C', 'A']);
    p.move([c], root);
    expect(titles(p, p.tree().children.get(root)!)).toEqual(['D', 'B', 'A', 'C']);
  });

  it('an element stands where it is put, or is placed automatically', () => {
    const { p, root } = project();
    const a = p.addChild(root, { title: 'A' })!;
    const l = p.addChild(root, { title: 'A thought', pos: { x: 300.4, y: -120 } })!;
    expect(p.node(l)!.pos).toEqual({ x: 300, y: -120 });
    // Moved without a word about its place, it keeps it; told none, it is placed.
    p.move([l], a);
    expect(p.node(l)!.pos).toEqual({ x: 300, y: -120 });
    p.move([l], root, undefined, { pos: null });
    expect(p.node(l)!.pos).toBeNull();
    p.move([l], a, undefined, { pos: { x: 10.4, y: 10 } });
    expect(p.node(l)!.pos).toEqual({ x: 10, y: 10 });
    p.setPosition(l, { x: 1.6, y: 2 });
    expect(p.node(l)!.pos).toEqual({ x: 2, y: 2 });
    // Tidied, the branch is laid out again.
    p.tidy([a]);
    expect(p.node(l)!.pos).toBeNull();
  });

  it('removing takes the branch, or leaves the children', () => {
    const { p, root } = project();
    const a = p.addChild(root, { title: 'A' })!;
    const a1 = p.addChild(a, { title: 'A1' })!;
    const a2 = p.addChild(a, { title: 'A2' })!;
    const b = p.addChild(root, { title: 'B' })!;
    p.addLink(a1, b);
    expect(p.remove([root])).toBe(0);
    expect(p.remove([root], { keepChildren: true })).toBe(0);

    expect(p.remove([a], { keepChildren: true })).toBe(1);
    expect(titles(p, p.tree().children.get(root)!)).toEqual(['A1', 'A2', 'B']);
    expect(p.links).toHaveLength(1);

    expect(p.remove([a1, a2])).toBe(2);
    expect(p.links).toHaveLength(0);
    expect(titles(p, p.tree().sequence)).toEqual(['Wrath', 'B']);
  });

  it('the summary tells the trees under the project, with the elements of each', () => {
    const { p, root } = project();
    const a = p.addChild(root, { title: 'A' })!;
    p.addChild(a, { title: 'A1', body: 'Two words' });
    const b = p.addChild(root, { title: '' })!;
    const summary = p.summary();
    expect(summary).toMatchObject({ name: 'Wrath', words: 2 });
    expect(summary.maps).toMatchObject([
      { id: a, name: 'A', elements: 2 },
      { id: b, elements: 1 },
    ]);
    // An element without a name is called something all the same.
    expect(summary.maps[1].name).toBeTruthy();
  });
});

describe('working across the trees of the project', () => {
  it('a copy is independent and remembers where it came from', () => {
    const { p, root } = project();
    const a = p.addChild(root, { title: 'A', body: 'Text.' })!;
    const a1 = p.addChild(a, { title: 'A1' })!;
    const b = p.addChild(root, { title: 'B' })!;
    p.addLink(a1, a);
    p.addLink(a1, b);
    const other = p.addChild(root, { title: 'Article' })!;

    const [copy] = p.copy([a, a1], other);
    expect(titles(p, p.tree(other).sequence)).toEqual(['Article', 'A', 'A1']);
    expect(p.node(copy)!.origin).toEqual({ node: a, print: p.fingerprint(a) });
    expect(p.node(copy)!.words).toBe(1);
    // The link within the branch came along; the one leading out of it did not.
    expect(p.linksOf(other)).toHaveLength(1);
    expect(p.linksOf(a)).toHaveLength(1);
    expect(p.linksOf(root)).toHaveLength(3);

    p.setTitle(copy, 'A, revised');
    expect(p.node(a)!.title).toBe('A');
    expect(titles(p, p.tree().sequence)).toEqual([
      'Wrath',
      'A',
      'A1',
      'B',
      'Article',
      'A, revised',
      'A1',
    ]);
  });

  it('a move to another tree under the project takes the branch along', () => {
    const { p, root } = project();
    const a = p.addChild(root, { title: 'A' })!;
    const a1 = p.addChild(a, { title: 'A1' })!;
    const other = p.addChild(root, { title: 'Article' })!;
    expect(p.move([a], other)).toEqual([a]);
    expect(titles(p, p.tree(other).sequence)).toEqual(['Article', 'A', 'A1']);
    expect(titles(p, p.tree().sequence)).toEqual(['Wrath', 'Article', 'A', 'A1']);
    expect(p.pathTo(a1)).toEqual([root, other, a, a1]);
    expect(p.node(a1)!.parent).toBe(a);
  });

  it('a branch copied beside itself keeps its text, its settings and its links, and knows its origin', () => {
    const { p, root } = project();
    const a = p.addChild(root, { title: 'A' })!;
    const a1 = p.addChild(a, { title: 'A1', body: 'One two three.' })!;
    p.addLink(a, a1);
    p.setDocument(a, { style: 'chicago' });
    p.setCollapsed(a, true);

    const [copy] = p.copy([a], root, 1, { pos: { x: 40.4, y: 0 } });
    expect(copy).not.toBe(a);
    expect(titles(p, p.tree().children.get(root)!)).toEqual(['A', 'A']);
    expect(titles(p, p.tree(copy).sequence)).toEqual(['A', 'A1']);
    expect(p.node(copy)!.document.style).toBe('chicago');
    expect(p.node(copy)!.collapsed).toBe(true);
    expect(p.node(copy)!.pos).toEqual({ x: 40, y: 0 });
    expect(p.copyOf(copy)).toMatchObject({ original: { id: a }, changed: false });
    const [c1] = p.tree().children.get(copy)!;
    expect(p.node(c1)!.words).toBe(3);
    expect(p.copyOf(c1)?.original?.id).toBe(a1);
    expect(p.linksOf(copy)).toHaveLength(1);
    expect(p.links).toHaveLength(2);
    // The original is untouched; the project itself is never copied.
    expect(titles(p, p.tree(a).sequence)).toEqual(['A', 'A1']);
    expect(p.copy([root], a)).toEqual([]);

    p.remove([copy]);
    expect(titles(p, p.tree().sequence)).toEqual(['Wrath', 'A', 'A1']);
    expect(p.nodes.size).toBe(3);
    expect(p.links).toHaveLength(1);
  });

  it('an element cannot come to include itself, nor one over it, nor one that holds it by inclusion', () => {
    const { p, root } = project();
    const holder = p.addChild(root, { title: 'The first chapter' })!;
    const chapter = p.addChild(root, { title: 'Chapter 1' })!;
    const b = p.addChild(chapter, { title: 'Section' })!;
    const section = p.addChild(root, { title: 'Section' })!;
    const c = p.addChild(section, { title: 'Back to the book' })!;
    expect(p.setInclude(holder, holder)).toBe(false);
    expect(p.setInclude(holder, root)).toBe(false);
    expect(p.setInclude(holder, 'nobody')).toBe(false);
    expect(p.setInclude(holder, chapter)).toBe(true);
    expect(p.setInclude(b, section)).toBe(true);
    expect(p.node(b)!.include).toBe(section);
    // Through the chapter and its section, the book would come to hold itself.
    expect(p.setInclude(c, root)).toBe(false);
    expect(p.setInclude(c, chapter)).toBe(false);
    expect(p.setInclude(c, holder)).toBe(false);
    expect(p.setInclude(c, section)).toBe(false);
    expect(p.wouldLoop(c, b)).toBe(true);
    expect(p.wouldLoop(holder, section)).toBe(false);
    // What stood for an element that is deleted stands for nothing.
    p.remove([chapter]);
    expect(p.node(holder)!.include).toBeNull();
    expect(p.setInclude(holder, section)).toBe(true);
    expect(p.setInclude(holder, null)).toBe(true);
    expect(p.node(holder)!.include).toBeNull();
  });
});

describe('what is told of changes', () => {
  it('is told once for what changed at the same moment, and no more once stopped', async () => {
    const { p, root } = project();
    let heard = 0;
    const stop = p.onChange(() => heard++);
    p.setTitle(root, 'One');
    p.setTitle(root, 'Two');
    expect(heard).toBe(0);
    await Promise.resolve();
    expect(heard).toBe(1);
    p.undo();
    await Promise.resolve();
    expect(heard).toBe(2);
    stop();
    p.setTitle(root, 'Three');
    await Promise.resolve();
    expect(heard).toBe(2);
  });

  it('waits, where asked, until the changes pause', () => {
    vi.useFakeTimers();
    try {
      const { p, root } = project();
      let heard = 0;
      const stop = p.onChange(() => heard++, 500);
      p.setTitle(root, 'One');
      vi.advanceTimersByTime(300);
      p.setTitle(root, 'Two');
      vi.advanceTimersByTime(300);
      expect(heard).toBe(0);
      vi.advanceTimersByTime(300);
      expect(heard).toBe(1);
      // What waits when it is stopped is not told.
      p.setTitle(root, 'Three');
      stop();
      vi.advanceTimersByTime(1000);
      expect(heard).toBe(1);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('references', () => {
  it('are those that are cited, within an element and in the project', () => {
    const { p, root } = project();
    const a = p.addChild(root, { title: 'A', body: 'The wrath is sung' })!;
    const other = p.addChild(root, { title: 'Article' })!;
    const b = p.addChild(other, { title: 'B' })!;

    p.cite(a, ['nagy', 'lord']);
    p.cite(b, ['west']);
    p.cite(b, ['nagy']);
    expect(p.node(a)!.cited).toEqual(['nagy', 'lord']);
    expect(p.node(a)!.words).toBe(4);
    expect(p.usedReferences(a).sort()).toEqual(['lord', 'nagy']);
    expect(p.usedReferences(other).sort()).toEqual(['nagy', 'west']);
    expect(p.usedReferences().sort()).toEqual(['lord', 'nagy', 'west']);
    expect(p.summary().references).toBe(3);
    expect(p.summary().cited.sort()).toEqual(['lord', 'nagy', 'west']);

    // Where each is cited: the elements in the order of the text, whichever cited it first.
    const c = p.addChild(root, { title: 'C', index: 0 })!;
    p.cite(c, ['nagy']);
    const where = (ref: string) =>
      titles(
        p,
        p.citing(ref).map((n) => n.id),
      );
    expect(where('nagy')).toEqual(['C', 'A', 'B']);
    expect(where('west')).toEqual(['B']);
    expect(where('homer')).toEqual([]);

    // Cited after the text that is there, with a space between; in a text of its own where there is none.
    const body = p.fragment(a, 'body')!.toString();
    expect(body).toMatch(/The wrath is sung <citation/);
    expect(p.fragment(b, 'body')!.toString()).toMatch(
      /^<paragraph><citation[^>]*><\/citation> ?<citation/,
    );
  });

  it('that were attached to elements by an earlier version are passed over', () => {
    const { p, root } = project();
    p.doc.transact(() => p.yNodes.get(root)!.set('refs', ['nagy', 'c:homer']));
    expect(p.usedReferences(root)).toEqual([]);
    expect(p.summary().references).toBe(0);
  });
});

describe('copies', () => {
  it('know whether their original has changed since, and can take what it is now', () => {
    const { p, root } = project();
    const a = p.addChild(root, { title: 'Wrath', body: 'Sing, goddess.' })!;
    const other = p.addChild(root, { title: 'Article' })!;
    const [copy] = p.copy([a], other);
    expect(p.copyOf(copy)).toMatchObject({ original: { id: a }, changed: false });
    expect(p.copyOf(a)).toBeNull();
    // What is written in the copy is its own.
    p.setTitle(copy, 'Wrath, in the article');
    expect(p.copyOf(copy)?.changed).toBe(false);
    p.setTitle(a, 'The wrath');
    expect(p.copyOf(copy)?.changed).toBe(true);
    p.settleCopy(copy);
    expect(p.copyOf(copy)?.changed).toBe(false);

    p.setTitle(a, 'The wrath of Achilles');
    p.checkpoint();
    p.takeOriginal(copy);
    expect(p.node(copy)?.title).toBe('The wrath of Achilles');
    expect(p.blocksOf(copy)).toEqual(p.blocksOf(a));
    expect(p.copyOf(copy)?.changed).toBe(false);
    // Taken back as one.
    p.undo();
    expect(p.node(copy)?.title).toBe('Wrath, in the article');
    expect(p.copyOf(copy)?.changed).toBe(true);

    p.remove([a]);
    expect(p.copyOf(copy)).toMatchObject({ original: null, changed: null });
  });
});

describe('how far the writing has come', () => {
  it('is said of elements, and counted for the element in view', async () => {
    const { progressOf } = await import('../status');
    const { p, root } = project();
    const a = p.addChild(root, { title: 'A', body: 'The wrath is sung here' })!;
    const b = p.addChild(root, { title: 'B', body: 'Two words' })!;
    const c = p.addChild(b, { title: 'C' })!;
    expect(p.node(a)!.status).toBeNull();
    expect(progressOf(p, root)).toBeNull();
    p.setStatus([a], 'done');
    p.setStatus([b, c], 'draft');
    expect(p.node(a)!.status).toBe('done');
    expect(progressOf(p, root)).toEqual({ idea: 0, draft: 2, done: 1, words: 7 });
    p.setStatus([c], 'idea');
    expect(progressOf(p, root)).toEqual({ idea: 1, draft: 1, done: 1, words: 7 });
    // Seen from an element, its branch is counted.
    expect(progressOf(p, b)).toEqual({ idea: 1, draft: 1, done: 0, words: 2 });
    // Nothing said is nothing kept.
    p.setStatus([a, b, c], null);
    expect(p.yNodes.get(a)!.has('status')).toBe(false);
    expect(progressOf(p, root)).toBeNull();
    // What is not a status is none.
    p.doc.transact(() => p.yNodes.get(a)!.set('status', 'finished'));
    expect(p.node(a)!.status).toBeNull();
  });
});

describe('notes on references', () => {
  it('are kept in the project, and changed where they differ', () => {
    const { p } = project();
    const undoable = p.undoManager.undoStack.length;
    p.setNote('nagy', 'The best is a title.');
    expect(p.notes.get('nagy')).toBe('The best is a title.');
    const note = p.yNotes.get('nagy')!;
    p.setNote('nagy', 'The best is a title, not praise.');
    expect(p.yNotes.get('nagy')).toBe(note);
    expect(p.notes.get('nagy')).toBe('The best is a title, not praise.');
    p.setNote('nagy', '   ');
    expect(p.notes.has('nagy')).toBe(false);
    expect(p.undoManager.undoStack.length).toBe(undoable);
  });

  it('written by two at once hold what both wrote', () => {
    const a = new Project(null);
    const b = new Project(null);
    a.setNote('nagy', 'On kleos.');
    Y.applyUpdate(b.doc, Y.encodeStateAsUpdate(a.doc));
    a.setNote('nagy', 'On kleos. See chapter 2.');
    b.setNote('nagy', 'Read again: On kleos.');
    Y.applyUpdate(b.doc, Y.encodeStateAsUpdate(a.doc));
    Y.applyUpdate(a.doc, Y.encodeStateAsUpdate(b.doc));
    expect(a.notes.get('nagy')).toBe('Read again: On kleos. See chapter 2.');
    expect(b.notes.get('nagy')).toBe(a.notes.get('nagy'));
  });

  it('keep a character outside the basic plane whole when the change begins or ends inside it', () => {
    // 😀 and 😁 share their first half (U+D83D): a change worked out by
    // halves would begin between the two halves, and Yjs would put U+FFFD
    // in the place of each half it splits.
    const edits: [string, string][] = [
      ['a😀', 'a😁'],
      ['😀😀', '😀😁'],
      ['😁b', '😀b'],
      ['x𝔄y', 'x𝔅y'],
      ['a😀b', 'a😁😀b'],
    ];
    for (const [before, after] of edits) {
      const { p } = project();
      p.setNote('w', before);
      p.setNote('w', after);
      expect(p.notes.get('w')).toBe(after);
      const read = new Project(null);
      Y.applyUpdate(read.doc, Y.encodeStateAsUpdate(p.doc));
      expect(read.notes.get('w')).toBe(after);
    }
  });
});

describe('undo', () => {
  it('undoes and redoes changes of structure', () => {
    const { p, root } = project();
    p.checkpoint();
    const a = p.addChild(root, { title: 'A' })!;
    p.checkpoint();
    p.remove([a]);
    expect(p.tree().sequence).toEqual([root]);
    p.undo();
    expect(titles(p, p.tree().sequence)).toEqual(['Wrath', 'A']);
    p.undo();
    expect(p.tree().sequence).toEqual([root]);
    expect(p.canRedo).toBe(true);
    p.redo();
    expect(titles(p, p.tree().sequence)).toEqual(['Wrath', 'A']);
  });

  /** Writes a paragraph at the end of an element's text, as the editor would. */
  function write(p: Project, id: string, words: string) {
    const body = p.fragment(id, 'body')!;
    p.doc.transact(() => {
      const para = new Y.XmlElement('paragraph');
      para.insert(0, [new Y.XmlText(words)]);
      body.insert(body.length, [para]);
    });
  }

  it('taking back an element one made keeps it, when another has written in it since', () => {
    const { a, b, root, sync } = two();
    a.checkpoint();
    const x = a.addChild(root, { title: 'X' })!;
    a.checkpoint();
    sync();
    write(b, x, 'Written by the other.');
    sync();

    a.undo();
    expect(a.tree().sequence).toContain(x);
    expect(a.tree().parent.get(x)).toBe(root);
    expect(a.fragment(x, 'body')!.toString()).toContain('Written by the other.');
    sync();
    expect(b.tree().sequence).toContain(x);
    expect(b.fragment(x, 'body')!.toString()).toContain('Written by the other.');
  });

  it('taking back an element one made removes it, when no one else has touched it', () => {
    const { a, b, root, sync } = two();
    a.checkpoint();
    const x = a.addChild(root, { title: 'X' })!;
    a.checkpoint();
    sync();
    a.undo();
    expect(a.tree().sequence).not.toContain(x);
    sync();
    expect(b.tree().sequence).not.toContain(x);
  });

  it("taking back one's own paragraph leaves another's paragraph in the same element", () => {
    const { a, b, root, sync } = two();
    const x = a.addChild(root, { title: 'X' })!;
    a.checkpoint();
    sync();
    write(b, x, 'The other wrote this.');
    sync();
    a.transact(() => write(a, x, 'I wrote this.'));
    a.checkpoint();
    a.undo();
    const text = a.fragment(x, 'body')!.toString();
    expect(text).toContain('The other wrote this.');
    expect(text).not.toContain('I wrote this.');
  });
});

describe('undo takes in the whole of a change', () => {
  it('a kind deleted and undone is back, with its elements of it', () => {
    const { p, root } = project();
    const a = p.addChild(root, { title: 'A' })!;
    const b = p.addChild(root, { title: 'B' })!;
    const k = p.createKind({ name: 'Scene', colour: '#336699', template: '' })!;
    p.setKind([a, b], k);
    p.checkpoint();
    p.deleteKind(k);
    expect(p.kinds.find((x) => x.id === k)).toBeUndefined();
    expect(p.node(a)!.kind ?? null).toBeNull();

    p.undo();
    expect(p.kinds.find((x) => x.id === k)).toMatchObject({ name: 'Scene', colour: '#336699' });
    expect(p.node(a)!.kind).toBe(k);
    expect(p.node(b)!.kind).toBe(k);
    p.redo();
    expect(p.kinds.find((x) => x.id === k)).toBeUndefined();
    expect(p.node(a)!.kind ?? null).toBeNull();
  });

  it('a kind of passage and a template deleted and undone are back', () => {
    const { p } = project();
    const kind = p.createPassageKind({
      name: 'Verse',
      family: 'paragraph',
      basedOn: '',
      look: {},
    })!;
    expect(p.keepTemplate(own('mine'))).toBe(true);
    p.checkpoint();
    p.transact(() => {
      p.deletePassageKind(kind);
      p.dropTemplate('mine');
    });
    expect(p.passageKinds.find((x) => x.id === kind)).toBeUndefined();
    expect(p.templateCopy('mine')).toBeFalsy();
    p.undo();
    expect(p.passageKinds.find((x) => x.id === kind)).toMatchObject({ name: 'Verse' });
    expect(p.templateCopy('mine')).toBeTruthy();
  });

  it('an element removed and undone has its comments again', () => {
    const { p, root } = project();
    p.setMe({ id: 'robert', name: 'Robert' });
    const a = p.addChild(root, { title: 'A' })!;
    const under = p.addChild(a, { title: 'A.1' })!;
    const one = p.comment(a, null, 'Is this right?')!;
    p.reply(one, 'Yes.');
    const two = p.comment(under, null, 'And this?')!;
    p.setResolved(two, true);
    p.checkpoint();
    p.remove([a]);
    expect(p.comments.size).toBe(0);

    p.undo();
    expect(p.node(a)).toBeDefined();
    expect(p.comments.get(one)!.notes.map((n) => n.text)).toEqual(['Is this right?', 'Yes.']);
    expect(p.comments.get(two)).toMatchObject({ element: under, resolved: true });
    p.redo();
    expect(p.comments.size).toBe(0);
  });

  it('what is written in the comments, and the copy of a template, are not undone', () => {
    const { p, root } = project();
    p.setMe({ id: 'robert', name: 'Robert' });
    const a = p.addChild(root, { title: 'A' })!;
    p.checkpoint();
    p.setTitle(a, 'B');
    p.checkpoint();
    const steps = p.undoManager.undoStack.length;
    const id = p.comment(a, null, 'Is this right?')!;
    p.reply(id, 'Yes.');
    p.setResolved(id, true);
    p.setCard(id, { x: 10, y: 20 });
    expect(p.keepTemplate(own('mine'))).toBe(true);
    expect(p.undoManager.undoStack.length).toBe(steps);
    p.undo();
    expect(p.node(a)!.title).toBe('A');
    expect(p.comments.get(id)).toMatchObject({ resolved: true, card: { x: 10, y: 20 } });
    expect(p.comments.get(id)!.notes).toHaveLength(2);
    expect(p.templateCopy('mine')).toBeTruthy();
  });
});

describe('putting in order', () => {
  it('an element added under one another deleted meanwhile stands under the project', () => {
    const { a, b, root, sync } = two();
    const y = a.addChild(root, { title: 'Y' })!;
    sync();
    a.remove([y]);
    const late = b.addChild(y, { title: 'Late', body: 'Words that are kept.' })!;
    sync();
    for (const p of [a, b]) {
      // It still names its parent; the tree puts it where it can stand.
      expect(p.node(late)!.parent).toBe(y);
      expect(p.tree().parent.get(late)).toBe(root);
      expect(titles(p, p.tree().sequence)).toEqual(['Wrath', 'Late']);
    }
    // Read anew, it is the same, and nothing was written to mend it.
    const read = new Project(null);
    read.load(Y.encodeStateAsUpdate(a.doc), []);
    expect(read.node(late)!.parent).toBe(y);
    expect(read.tree().children.get(root)).toEqual([late]);
    expect(read.summary().words).toBe(4);
  });

  it('a comment on an element another deleted meanwhile goes when the project is read', () => {
    const { a, b, root, sync } = two();
    b.setMe({ id: 'anna', name: 'Anna' });
    const x = a.addChild(root, { title: 'X' })!;
    sync();
    a.remove([x]);
    const thread = b.comment(x, null, 'Too late.')!;
    sync();
    expect(a.yComments.has(thread)).toBe(true);

    const read = new Project(null);
    read.load(Y.encodeStateAsUpdate(a.doc), []);
    expect(read.yComments.has(thread)).toBe(false);
    expect(read.comments.size).toBe(0);
  });
});

describe('saving', () => {
  class Disk implements Persistence {
    log: Uint8Array[] = [];
    state: Uint8Array | null = null;
    summary: Summary | null = null;
    fail = false;
    async append(update: Uint8Array) {
      if (this.fail) throw new Error('disk full');
      this.log.push(update);
    }
    async saveState(state: Uint8Array, summary: Summary) {
      this.state = state;
      this.summary = summary;
      this.log = [];
    }
  }

  it('before the window closes, what is not written is appended first, and a failure keeps it open', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const disk = new Disk();
    const p = new Project(disk);
    p.begin('Draft');
    p.addChild(PROJECT, { title: 'Last words' });
    disk.fail = true;
    expect(await finishBeforeClose()).toEqual([new Error('disk full')]);
    expect(disk.log.length).toBe(0);
    disk.fail = false;
    expect(await finishBeforeClose()).toEqual([]);
    expect(disk.log.length).toBe(1);
    await p.close();
    // A project closed is no longer waited for.
    disk.fail = true;
    expect(await finishBeforeClose()).toEqual([]);
    error.mockRestore();
  });

  it('what is saved can be read again', async () => {
    const disk = new Disk();
    const p = new Project(disk);
    p.begin('Draft');
    p.setName('Homer');
    p.transact(() => fillBody(p.fragment(PROJECT, 'body')!, 'Sing, goddess.'));
    const wrath = p.addChild(PROJECT, { title: 'Wrath' })!;
    const a = p.addChild(wrath, { title: 'A', body: 'Four words of text.' })!;
    await p.flush();
    expect(disk.log.length).toBe(1);
    expect(p.status).toBe('saved');

    // From the log alone.
    const q = new Project(null);
    q.load(null, disk.log);
    expect(q.name).toBe('Homer');
    expect(q.node(a)!.title).toBe('A');
    expect(q.canUndo).toBe(false);

    // From a state and a log after it.
    await p.snapshot();
    // The project's text is its description, in few words.
    expect(disk.summary).toEqual({
      name: 'Homer',
      description: 'Sing, goddess.',
      maps: [{ id: wrath, name: 'Wrath', elements: 2 }],
      words: 6,
      references: 0,
      pictures: [],
      cited: [],
    });
    p.setTitle(a, 'A, renamed');
    await p.flush();
    const r = new Project(null);
    r.load(disk.state, disk.log);
    expect(r.node(a)!.title).toBe('A, renamed');
    expect(r.tree(wrath).sequence).toHaveLength(2);
    expect(r.tree().sequence).toHaveLength(3);
  });

  it('what each deleted is kept as one record, and let go when the history is turned off', async () => {
    const disk = new Disk();
    const p = new Project(disk);
    p.begin('Wrath');
    p.setMe({ id: 'me', name: 'Robert' });
    await p.setHistory({ on: true });
    const made: string[] = [];
    for (let i = 0; i < 30; i++) {
      made.push(p.addChild(PROJECT, { title: `E${i}` })!);
      await p.flush();
      p.remove([made[i]]);
      await p.flush();
    }
    const ds = () => p.yUsers.get('me')!.get('ds') as Y.Array<Uint8Array>;
    expect(ds().length).toBe(30);

    await p.snapshot();
    expect(ds().length).toBe(1);
    // All that was deleted is in the one record, as the history reads it.
    const pud = new Y.PermanentUserData(p.doc, p.yUsers);
    for (const id of made) {
      const item = p.yNodes._map.get(id)!;
      expect(pud.getUserByDeletedId(item.id)).toBe('me');
    }

    await p.setHistory({ on: false });
    expect(ds().length).toBe(0);
  });

  it('a failure keeps the change for the next attempt', async () => {
    const disk = new Disk();
    const p = new Project(disk);
    p.begin('Wrath');
    disk.fail = true;
    await p.flush();
    expect(p.status).toBe('error');
    expect(p.saveError).toBe('disk full');
    disk.fail = false;
    p.addChild(PROJECT, { title: 'A' });
    await p.flush();
    expect(p.status).toBe('saved');
    const q = new Project(null);
    q.load(null, disk.log);
    expect(titles(q, q.tree().sequence)).toEqual(['Wrath', 'A']);
  });

  it('two copies that change at once arrive at the same', () => {
    const a = new Project(null);
    a.begin('Wrath');
    const x = a.addChild(PROJECT, { title: 'X' })!;
    const y = a.addChild(PROJECT, { title: 'Y' })!;
    const b = new Project(null);
    b.load(Y.encodeStateAsUpdate(a.doc), []);

    // Each puts one under the other: together, a loop.
    a.move([x], y);
    b.move([y], x);
    a.addChild(x, { title: 'Under X, by A' });
    const ua = Y.encodeStateAsUpdate(a.doc);
    const ub = Y.encodeStateAsUpdate(b.doc);
    Y.applyUpdate(a.doc, ub, 'remote');
    Y.applyUpdate(b.doc, ua, 'remote');

    const ta = a.tree();
    const tb = b.tree();
    expect(ta.sequence).toEqual(tb.sequence);
    expect(ta.sequence).toHaveLength(4);
    // The loop is broken: one of the two stands under the project, the other under it.
    expect(ta.children.get(PROJECT)).toHaveLength(1);
    expect([x, y]).toContain(ta.children.get(PROJECT)![0]);
  });
});

describe('comments', () => {
  it('a thread is begun on an element, answered in, settled, and goes with the element', () => {
    const { p, root } = project();
    p.setMe({ id: 'robert', name: 'Robert' });
    const a = p.addChild(root, { title: 'A' })!;
    const id = p.comment(a, null, '  Is this right? ')!;
    const thread = p.comments.get(id)!;
    expect(thread.element).toBe(a);
    expect(thread.passage).toBeNull();
    expect(thread.notes).toHaveLength(1);
    expect(thread.notes[0]).toMatchObject({
      author: { id: 'robert', name: 'Robert' },
      text: 'Is this right?',
    });
    expect(p.comment(a, null, '   ')).toBeNull();
    expect(p.comment('nobody', null, 'x')).toBeNull();

    p.setMe({ id: 'anna', name: 'Anna' });
    const answer = p.reply(id, 'Yes, see Nagy.')!;
    expect(p.comments.get(id)!.notes.map((n) => n.author.name)).toEqual(['Robert', 'Anna']);
    p.editNote(id, answer, 'Yes: see Nagy 1979.');
    expect(p.comments.get(id)!.notes[1]).toMatchObject({ text: 'Yes: see Nagy 1979.' });
    expect(p.comments.get(id)!.notes[1].edited).toBeDefined();

    p.setResolved(id, true);
    expect(p.comments.get(id)!.resolved).toBe(true);
    p.setResolved(id, false);
    expect(p.comments.get(id)!.resolved).toBe(false);
    expect(p.threadsOf(a).map((t) => t.id)).toEqual([id]);

    // Comments are not the text: undo takes back the last change of the text, not the comment.
    p.checkpoint();
    p.setTitle(a, 'A, renamed');
    p.undo();
    expect(p.node(a)!.title).toBe('A');
    expect(p.comments.get(id)).toBeDefined();

    p.remove([a]);
    expect(p.comments.size).toBe(0);
  });

  it('a note taken back can be put back, and the thread with its last note', () => {
    const { p, root } = project();
    p.setMe({ id: 'robert', name: 'Robert' });
    const id = p.comment(root, null, 'First')!;
    const second = p.reply(id, 'Second')!;
    const taken = p.deleteNote(id, second)!;
    expect(p.comments.get(id)!.notes).toHaveLength(1);
    p.restoreNote(id, taken, p.comments.get(id)!);
    expect(p.comments.get(id)!.notes.map((n) => n.text)).toEqual(['First', 'Second']);

    const whole = p.comments.get(id)!;
    const first = p.deleteNote(id, whole.notes[0].id)!;
    const last = p.deleteNote(id, whole.notes[1].id)!;
    expect(p.comments.has(id)).toBe(false);
    p.restoreNote(id, last, whole);
    p.restoreNote(id, first, whole);
    expect(p.comments.get(id)!.notes.map((n) => n.text)).toEqual(['First', 'Second']);
  });

  it('a passage and a card are kept with the thread, and arrive at another copy', () => {
    const { p, root } = project();
    const passage = { from: new Uint8Array([1, 2]), to: new Uint8Array([3]), text: 'the wrath' };
    const id = p.comment(root, passage, 'Why wrath?')!;
    p.setCard(id, { x: 120.4, y: -30 });
    const other = new Project(null);
    Y.applyUpdate(other.doc, Y.encodeStateAsUpdate(p.doc));
    other.load(null, []);
    const there = other.comments.get(id)!;
    expect(there.passage).toEqual(passage);
    expect(there.card).toEqual({ x: 120, y: -30 });
    expect(there.notes[0].text).toBe('Why wrath?');
  });
});

describe('kinds of elements', () => {
  it('kinds are made, changed and deleted, and elements are of them', () => {
    const { p, root } = project();
    const person = p.createKind({ name: ' Person ', colour: 'rose', template: 'Born\nDied' })!;
    const place = p.createKind({ name: 'Place', colour: 'teal', template: '' })!;
    expect(p.createKind({ name: '  ', colour: 'teal', template: '' })).toBeNull();
    expect(p.kinds.map((k) => k.name)).toEqual(['Person', 'Place']);
    expect(p.kind(person)).toMatchObject({ colour: 'rose', template: 'Born\nDied' });

    const a = p.addChild(root, { title: 'Pericles' })!;
    const b = p.addChild(root, { title: 'Athens', body: 'A city.' })!;
    p.setKind([a, b], person);
    expect(p.node(a)!.kind).toBe(person);
    expect(p.blocksOf(a).length).toBe(2);
    expect(p.node(b)!.kind).toBe(person);
    expect(p.blocksOf(b).length).toBe(1);
    p.setKind([b], place);
    p.setKind([a], 'no such kind');
    expect(p.node(a)!.kind).toBe(person);

    p.updateKind(person, { name: 'Character', colour: 'plum', template: '' });
    expect(p.kind(person)).toMatchObject({ name: 'Character', colour: 'plum', template: '' });
    p.updateKind(person, { name: '' });
    expect(p.kind(person)!.name).toBe('Character');

    p.deleteKind(person);
    expect(p.kinds.map((k) => k.name)).toEqual(['Place']);
    expect(p.node(a)!.kind).toBeNull();
    expect(p.node(b)!.kind).toBe(place);
    p.setKind([b], null);
    expect(p.node(b)!.kind).toBeNull();
  });
});

describe('kinds of paragraph and of words of the writer`s own', () => {
  it('are made, changed and deleted, and the passages that were of one stay', () => {
    const { p, root } = project();
    const letter = p.createPassageKind({
      name: ' Letter ',
      family: 'paragraph',
      basedOn: 'epigraph',
      look: { italic: true, indentLeft: '2cm', size: 900, text: 'x'.repeat(50), bold: undefined },
    })!;
    const word = p.createPassageKind({ name: 'Ship', family: 'words', basedOn: '', look: {} })!;
    expect(p.createPassageKind({ name: ' ', family: 'words', basedOn: '', look: {} })).toBeNull();
    expect(p.passageKinds.map((k) => k.name)).toEqual(['Letter', 'Ship']);
    // Only the measures of a look, each as it should be.
    expect(p.passageKind(letter)).toMatchObject({
      family: 'paragraph',
      basedOn: 'epigraph',
      look: { italic: true, indentLeft: '2cm', size: 900, text: 'x'.repeat(40) },
    });
    expect(p.passageKind(word)).toMatchObject({ family: 'words', basedOn: '', look: {} });

    const a = p.addChild(root, { title: 'A' })!;
    p.transact(() => fillBody(p.fragment(a, 'body')!, 'Dear reader', letter, p.passageKinds));
    expect(p.node(a)!.uses).toEqual([letter]);

    p.updatePassageKind(letter, { name: 'Note', look: { bold: true }, basedOn: 'text' });
    expect(p.passageKind(letter)).toMatchObject({
      name: 'Note',
      basedOn: 'text',
      look: { bold: true },
    });
    p.updatePassageKind(letter, { name: '', look: {}, basedOn: '' });
    expect(p.passageKind(letter)).toMatchObject({ name: 'Note', basedOn: '', look: {} });
    p.updatePassageKind('no such kind', { name: 'X' });

    p.deletePassageKind(letter);
    expect(p.passageKinds.map((k) => k.name)).toEqual(['Ship']);
    // The paragraph stays as it is, of the kind that is gone.
    expect(p.blocksOf(a)).toEqual([
      paragraph([{ kind: 'text', text: 'Dear reader', marks: {} }], letter),
    ]);
    p.deletePassageKind(word);
    expect(p.passageKinds).toEqual([]);
  });

  it('a kind of element says in which kind of paragraph its text begins', () => {
    const { p, root } = project();
    const scene = p.createKind({
      name: 'Scene',
      colour: 'teal',
      template: 'INT. HOUSE',
      begins: 'scene',
    })!;
    const chorus = p.createKind({
      name: 'Chorus',
      colour: 'rose',
      template: '',
      begins: ' line ',
    })!;
    expect(p.kind(scene)!.begins).toBe('scene');
    expect(p.kind(chorus)!.begins).toBe('line');
    const a = p.addChild(root, { title: 'A' })!;
    const b = p.addChild(root, { title: 'B' })!;
    const c = p.addChild(root, { title: 'C', body: 'Written already.' })!;
    p.setKind([a], scene);
    expect(p.blocksOf(a)).toEqual([
      paragraph([{ kind: 'text', text: 'INT. HOUSE', marks: {} }], 'scene'),
    ]);
    // Without a text to begin with, the writing begins in the kind.
    p.setKind([b, c], chorus);
    expect(p.blocksOf(b)).toEqual([paragraph([], 'line')]);
    expect(p.blocksOf(c)).toEqual([
      paragraph([{ kind: 'text', text: 'Written already.', marks: {} }]),
    ]);
    p.updateKind(chorus, { begins: '' });
    expect(p.kind(chorus)!.begins).toBeUndefined();
  });
});

describe('the language of the text', () => {
  it('is that of the project element where one is chosen, and reaches every element that says nothing itself', () => {
    const { p, root } = project();
    const a = p.addChild(root, { title: 'A' })!;
    // A project that begins is in the language of new texts, written into it (ADR 0020).
    expect(p.language).toBe('en-US');
    expect(p.documentOf(a).settings.language).toBe('en-US');
    expect(p.documentOf(a).from.get('language')).toBe(root);
    p.setLanguage('nn');
    expect(p.language).toBe('nn');
    expect(p.node(root)!.document.language).toBe('nn');
    expect(p.documentOf(a).settings.language).toBe('nn');
    expect(p.documentOf(a).from.get('language')).toBe(root);
    // A document that says its language keeps it.
    const own = p.buildBranch(root, 'Own', [], () => {}, { language: 'de' })!;
    expect(p.node(own.top)!.document.language).toBe('de');
    expect(p.documentOf(own.top).settings.language).toBe('de');
    expect(p.documentOf(own.top).from.get('language')).toBe(own.top);
    p.setLanguage(null);
    expect(p.language).toBeNull();
    expect(p.yNodes.get(root)!.has('document')).toBe(false);
    expect(p.documentOf(a).settings.language).toBeUndefined();
    expect(p.node(own.top)!.document.language).toBe('de');
  });

  it('is kept in the project, and so reaches every copy of it', () => {
    const a = new Project(null);
    a.begin('Wrath');
    a.setLanguage(' nb ');
    expect(a.language).toBe('nb');
    const b = new Project(null);
    b.load(Y.encodeStateAsUpdate(a.doc), []);
    expect(b.language).toBe('nb');
    const theirs = b.addChild(PROJECT, { title: 'Theirs' })!;
    expect(b.documentOf(theirs).settings.language).toBe('nb');
  });
});

describe('the templates the project carries a copy of', () => {
  it('are kept, read, told by name, and let go', () => {
    const { p, root } = project();
    expect(p.templates).toEqual([]);
    expect(p.keepTemplate(own('letter'))).toBe(true);
    expect(p.keepTemplate(own('note', 'Aide'))).toBe(true);
    // By name; each as a plain record, whole.
    expect(p.templates.map((tp) => tp.id)).toEqual(['note', 'letter']);
    expect(p.templateCopy('letter')).toEqual(own('letter'));
    expect(p.templateCopy('no such')).toBeUndefined();
    expect(p.yTemplates.get('letter')).toEqual(own('letter'));

    // Kept anew in place of the copy there was; nothing is written for a copy that is the same.
    const before = p.revision;
    p.keepTemplate(own('letter'));
    expect(p.revision).toBe(before);
    p.keepTemplate({ ...own('letter'), name: 'Epistle', style: 'chicago-notes' });
    expect(p.templateCopy('letter')).toMatchObject({ name: 'Epistle', style: 'chicago-notes' });
    // With the keys of its kinds, digits only.
    p.keepTemplate({
      ...own('letter'),
      kindKeys: { '1': 'speaker', '2': 'line', x: 'code', '3': '' } as Record<string, string>,
    });
    expect(p.templateCopy('letter')?.kindKeys).toEqual({ '1': 'speaker', '2': 'line' });

    // Which elements use it.
    const a = p.addChild(root, { title: 'A' })!;
    expect(p.usesTemplate('letter')).toBe(false);
    p.setDocument(a, { template: 'letter' });
    expect(p.usesTemplate('letter')).toBe(true);

    p.dropTemplate('letter');
    p.dropTemplate('no such');
    expect(p.templates.map((tp) => tp.id)).toEqual(['note']);
    expect(p.templateCopy('letter')).toBeUndefined();
    // The element keeps the id it chose.
    expect(p.node(a)!.document.template).toBe('letter');
  });

  it('never a template that came with the application, nor one without an id', () => {
    const { p } = project();
    expect(p.keepTemplate({ ...own('journal-article'), group: 'article' })).toBe(false);
    expect(p.keepTemplate({ ...own('plain'), group: 'plain' })).toBe(false);
    expect(p.keepTemplate(own(' '))).toBe(false);
    expect(p.templates).toEqual([]);
    expect(p.yTemplates.size).toBe(0);
  });

  it('are carried to another copy of the project, and read as templates whatever was written', () => {
    const { a, b, sync } = two();
    a.keepTemplate(own('letter'));
    sync();
    expect(b.templateCopy('letter')).toEqual(own('letter'));
    // What is not a template is passed over; what a template lacks is filled in.
    b.transact(() => {
      b.yTemplates.set('odd', 'not a template');
      b.yTemplates.set('bare', { group: 'own', name: 'Bare', kinds: ['x', 3] });
      b.yTemplates.set('theirs', { group: 'article', name: 'Theirs' });
    });
    expect(b.templates.map((tp) => tp.id)).toEqual(['bare', 'letter']);
    expect(b.templateCopy('bare')).toEqual({
      id: 'bare',
      name: 'Bare',
      group: 'own',
      description: '',
      contents: [],
      kinds: ['x'],
      passageKinds: [],
      requirements: {
        words: null,
        abstractWords: null,
        keywords: null,
        anonymous: false,
        note: '',
      },
      outputs: [],
    });
  });
});

describe('the changes of a document to its layout', () => {
  it('reach down the tree, each said by the element that makes it', () => {
    const { p, root } = project();
    const book = p.addChild(root, { title: 'Book' })!;
    const chapter = p.addChild(book, { title: 'Chapter' })!;
    p.setDocument(book, { look: { font: { family: 'EB Garamond', size: 12 } } });
    p.setDocument(chapter, { look: { font: { size: 11 } } });
    const { changes, from } = p.lookOf(chapter);
    expect(changes).toEqual({ font: { family: 'EB Garamond', size: 11 } });
    expect(from.get('font.family')).toBe(book);
    expect(from.get('font.size')).toBe(chapter);
    expect(p.lookOf(book).changes).toEqual({ font: { family: 'EB Garamond', size: 12 } });
    // Every change taken back leaves nothing behind.
    p.setDocument(chapter, { look: {} });
    expect(p.yNodes.get(chapter)!.has('document')).toBe(false);
  });
});

describe('what a document sets otherwise than its template', () => {
  it('reaches down the tree path by path, each said by the element that sets it', () => {
    const { p, root } = project();
    const book = p.addChild(root, { title: 'Book' })!;
    const chapter = p.addChild(book, { title: 'Chapter' })!;
    const other = p.addChild(book, { title: 'Another chapter' })!;
    p.setDocument(book, { composition: { parts: { contents: false } } });
    p.setDocument(chapter, {
      composition: { parts: { 'list-of-figures': true }, requirements: { words: null } },
    });
    const { changes, from } = p.compositionOf(chapter);
    expect(changes).toEqual({
      parts: { contents: false, 'list-of-figures': true },
      requirements: { words: null },
    });
    expect(from.get('parts.contents')).toBe(book);
    expect(from.get('parts.list-of-figures')).toBe(chapter);
    expect(from.get('requirements.words')).toBe(chapter);
    expect(p.compositionOf(book).changes).toEqual({ parts: { contents: false } });
    expect(p.compositionOf(other).changes).toEqual({ parts: { contents: false } });
    expect(p.compositionOf(root).changes).toEqual({});
    // A chapter that says otherwise than the book says it for itself.
    p.setDocument(other, { composition: { parts: { contents: true } } });
    expect(p.compositionOf(other).changes).toEqual({ parts: { contents: true } });
    expect(p.compositionOf(other).from.get('parts.contents')).toBe(other);
    // What is read is a copy: changing it changes nothing in the project.
    changes.parts!.contents = true;
    expect(p.compositionOf(chapter).changes.parts?.contents).toBe(false);
    // Every change taken back leaves nothing behind.
    p.setDocument(chapter, { composition: {} });
    expect(p.yNodes.get(chapter)!.has('document')).toBe(false);
  });

  it('a document type chosen drops the own layout and style in the same step of undo', () => {
    const { p, root } = project();
    const a = p.addChild(root, { title: 'A' })!;
    p.setDocument(a, { format: 'manuscript', style: 'chicago', look: { font: { size: 11 } } });
    p.checkpoint();
    // As the chooser of document types writes it.
    p.setDocument(a, { template: 'letter', format: undefined, style: undefined });
    p.checkpoint();
    expect(p.node(a)!.document).toEqual({ template: 'letter', look: { font: { size: 11 } } });
    p.undo();
    expect(p.node(a)!.document).toEqual({
      format: 'manuscript',
      style: 'chicago',
      look: { font: { size: 11 } },
    });
  });
});
