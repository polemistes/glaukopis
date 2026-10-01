import { describe, expect, it, vi } from 'vitest';
import * as Y from 'yjs';
import { Project, type Persistence, type Summary } from './project.svelte';
import { fillBody } from './text';

function project() {
  const p = new Project(null);
  const map = p.createMap('Wrath');
  const root = p.map(map)!.root;
  return { p, map, root };
}

const titles = (p: Project, ids: string[]) => ids.map((id) => p.node(id)!.title);

describe('maps and elements', () => {
  it('a new map has a centre named after it', () => {
    const { p, map, root } = project();
    expect(p.maps).toHaveLength(1);
    expect(p.node(root)!.title).toBe('Wrath');
    expect(p.tree(map).sequence).toEqual([root]);
  });

  it('children and siblings take their places', () => {
    const { p, map, root } = project();
    const a = p.addChild(root, { title: 'A' })!;
    const c = p.addChild(root, { title: 'C' })!;
    const b = p.addSibling(a, { title: 'B' })!;
    const first = p.addChild(root, { title: 'First', index: 0 })!;
    const a1 = p.addChild(a, { title: 'A1' })!;
    const tree = p.tree(map);
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

  it('a sibling of the centre is a child of it', () => {
    const { p, map, root } = project();
    const x = p.addSibling(root, { title: 'X' })!;
    expect(p.tree(map).parent.get(x)).toBe(root);
  });

  it('moving keeps the text and refuses to make a loop', () => {
    const { p, map, root } = project();
    const a = p.addChild(root, { title: 'A', body: 'The text of A.' })!;
    const a1 = p.addChild(a, { title: 'A1' })!;
    const b = p.addChild(root, { title: 'B' })!;
    expect(p.move([a], a1)).toEqual([]);
    expect(p.move([a], a)).toEqual([]);
    expect(p.move([root], b)).toEqual([]);
    const body = p.fragment(a, 'body');
    expect(p.move([a], b)).toEqual([a]);
    const tree = p.tree(map);
    expect(tree.parent.get(a)).toBe(b);
    expect(tree.parent.get(a1)).toBe(a);
    // The very same content, not a copy of it.
    expect(p.fragment(a, 'body')).toBe(body);
    expect(p.node(a)!.words).toBe(4);
  });

  it('moving within a list counts places as the user sees them', () => {
    const { p, map, root } = project();
    const [a, b, c, d] = ['A', 'B', 'C', 'D'].map((t) => p.addChild(root, { title: t })!);
    p.move([a], root, 3); // before D
    expect(titles(p, p.tree(map).children.get(root)!)).toEqual(['B', 'C', 'A', 'D']);
    p.move([d, b], root, 0);
    expect(titles(p, p.tree(map).children.get(root)!)).toEqual(['D', 'B', 'C', 'A']);
    p.move([c], root);
    expect(titles(p, p.tree(map).children.get(root)!)).toEqual(['D', 'B', 'A', 'C']);
  });

  it('removing takes the branch, or leaves the children', () => {
    const { p, map, root } = project();
    const a = p.addChild(root, { title: 'A' })!;
    const a1 = p.addChild(a, { title: 'A1' })!;
    const a2 = p.addChild(a, { title: 'A2' })!;
    const b = p.addChild(root, { title: 'B' })!;
    p.addLink(a1, b);
    expect(p.remove([root])).toBe(0);

    expect(p.remove([a], { keepChildren: true })).toBe(1);
    expect(titles(p, p.tree(map).children.get(root)!)).toEqual(['A1', 'A2', 'B']);
    expect(p.links).toHaveLength(1);

    expect(p.remove([a1, a2])).toBe(2);
    expect(p.links).toHaveLength(0);
    expect(titles(p, p.tree(map).sequence)).toEqual(['Wrath', 'B']);
  });

  it('loose elements belong to the map and to nothing in it', () => {
    const { p, map, root } = project();
    const l = p.addLoose(map, { x: 300.4, y: -120 }, 'A thought')!;
    const tree = p.tree(map);
    expect(tree.loose).toEqual([l]);
    expect(p.node(l)!.pos).toEqual({ x: 300, y: -120 });
    p.move([l], root);
    expect(p.tree(map).loose).toEqual([]);
    p.move([l], null, undefined, { pos: { x: 10, y: 10 } });
    expect(p.tree(map).loose).toEqual([l]);
    expect(p.node(l)!.pos).toEqual({ x: 10, y: 10 });
  });
});

describe('working across maps', () => {
  it('a copy is independent and remembers where it came from', () => {
    const { p, map, root } = project();
    const a = p.addChild(root, { title: 'A', body: 'Text.' })!;
    const a1 = p.addChild(a, { title: 'A1' })!;
    const b = p.addChild(root, { title: 'B' })!;
    p.addLink(a1, a);
    p.addLink(a1, b);
    const other = p.createMap('Article');
    const otherRoot = p.map(other)!.root;

    const [copy] = p.copy([a, a1], otherRoot);
    const tree = p.tree(other);
    expect(titles(p, tree.sequence)).toEqual(['Article', 'A', 'A1']);
    expect(p.node(copy)!.origin).toEqual({ map, node: a, print: p.fingerprint(a) });
    expect(p.node(copy)!.words).toBe(1);
    // The link within the branch came along; the one leading out of it did not.
    expect(p.linksOf(other)).toHaveLength(1);
    expect(p.linksOf(map)).toHaveLength(2);

    p.setTitle(copy, 'A, revised');
    expect(p.node(a)!.title).toBe('A');
    expect(p.tree(map).sequence).toHaveLength(4);
  });

  it('a move to another map takes the branch along', () => {
    const { p, map, root } = project();
    const a = p.addChild(root, { title: 'A' })!;
    const a1 = p.addChild(a, { title: 'A1' })!;
    const other = p.createMap('Article');
    p.move([a], p.map(other)!.root);
    expect(titles(p, p.tree(other).sequence)).toEqual(['Article', 'A', 'A1']);
    expect(p.tree(map).sequence).toEqual([root]);
    expect(p.node(a1)!.map).toBe(other);
  });

  it('a map can be duplicated, and a branch made into a map', () => {
    const { p, map, root } = project();
    const a = p.addChild(root, { title: 'A' })!;
    const a1 = p.addChild(a, { title: 'A1', body: 'One two three.' })!;
    p.addLoose(map, { x: 5, y: 5 }, 'Loose');
    p.addLink(a, a1);
    p.setDocument(map, { style: 'chicago' });

    const copy = p.duplicateMap(map)!;
    expect(p.map(copy)!.name).toBe('Wrath, copy');
    expect(p.map(copy)!.document.style).toBe('chicago');
    expect(titles(p, p.tree(copy).sequence)).toEqual(['Wrath', 'A', 'A1', 'Loose']);
    expect(p.linksOf(copy)).toHaveLength(1);
    expect(p.maps.map((m) => m.name)).toEqual(['Wrath', 'Wrath, copy']);

    const branch = p.mapFromBranch(a)!;
    expect(p.map(branch)!.name).toBe('A');
    expect(titles(p, p.tree(branch).sequence)).toEqual(['A', 'A1']);
    expect(p.node(p.map(branch)!.root)!.pos).toEqual({ x: 0, y: 0 });
    // The original is untouched.
    expect(titles(p, p.tree(map).sequence)).toEqual(['Wrath', 'A', 'A1', 'Loose']);

    p.deleteMap(copy);
    expect(p.maps).toHaveLength(2);
    expect([...p.nodes.values()].filter((n) => n.map === copy)).toHaveLength(0);
  });

  it('a map cannot come to include itself', () => {
    const { p, map, root } = project();
    const chapter = p.createMap('Chapter 1');
    const section = p.createMap('Section');
    const a = p.addChild(root, { title: 'Chapter 1' })!;
    const b = p.addChild(p.map(chapter)!.root, { title: 'Section' })!;
    const c = p.addChild(p.map(section)!.root, { title: 'Back to the book' })!;
    expect(p.setInclude(a, map)).toBe(false);
    expect(p.setInclude(a, chapter)).toBe(true);
    expect(p.setInclude(b, section)).toBe(true);
    expect(p.setInclude(c, map)).toBe(false);
    expect(p.setInclude(c, chapter)).toBe(false);
    p.deleteMap(chapter);
    expect(p.node(a)!.include).toBeNull();
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
  it('are those that are cited, in the map and in the project', () => {
    const { p, map, root } = project();
    const a = p.addChild(root, { title: 'A', body: 'The wrath is sung' })!;
    const other = p.createMap('Article');
    const b = p.addChild(p.map(other)!.root, { title: 'B' })!;

    p.cite(a, ['nagy', 'lord']);
    p.cite(b, ['west']);
    p.cite(b, ['nagy']);
    expect(p.node(a)!.cited).toEqual(['nagy', 'lord']);
    expect(p.node(a)!.words).toBe(4);
    expect(p.usedReferences(map).sort()).toEqual(['lord', 'nagy']);
    expect(p.usedReferences(other).sort()).toEqual(['nagy', 'west']);
    expect(p.usedReferences().sort()).toEqual(['lord', 'nagy', 'west']);
    expect(p.summary().references).toBe(3);
    expect(p.summary().cited.sort()).toEqual(['lord', 'nagy', 'west']);

    // Where each is cited: the maps in their order, the elements in the order of the text.
    const c = p.addChild(root, { title: 'C' })!;
    p.cite(c, ['nagy']);
    const where = (ref: string) =>
      p.citing(ref).map((m) => [m.map.name, ...m.elements.map((e) => e.title)]);
    expect(where('nagy')).toEqual([
      [p.map(map)!.name, 'A', 'C'],
      ['Article', 'B'],
    ]);
    expect(where('west')).toEqual([['Article', 'B']]);
    expect(where('homer')).toEqual([]);

    // Cited after the text that is there, with a space between; in a text of its own where there is none.
    const body = p.fragment(a, 'body')!.toString();
    expect(body).toMatch(/The wrath is sung <citation/);
    expect(p.fragment(b, 'body')!.toString()).toMatch(
      /^<paragraph><citation[^>]*><\/citation> ?<citation/,
    );
  });

  it('that were attached to elements by an earlier version are passed over', () => {
    const { p, map, root } = project();
    p.doc.transact(() => p.yNodes.get(root)!.set('refs', ['nagy', 'c:homer']));
    expect(p.usedReferences(map)).toEqual([]);
    expect(p.summary().references).toBe(0);
  });
});

describe('copies between maps', () => {
  it('know whether their original has changed since, and can take what it is now', () => {
    const { p, root } = project();
    const a = p.addChild(root, { title: 'Wrath', body: 'Sing, goddess.' })!;
    const other = p.createMap('Article');
    const [copy] = p.copy([a], p.map(other)!.root);
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
  it('is said of elements, and counted for their map', async () => {
    const { progressOf } = await import('../status');
    const { p, map, root } = project();
    const a = p.addChild(root, { title: 'A', body: 'The wrath is sung here' })!;
    const b = p.addChild(root, { title: 'B', body: 'Two words' })!;
    const c = p.addChild(root, { title: 'C' })!;
    expect(p.node(a)!.status).toBeNull();
    expect(progressOf(p, map)).toBeNull();
    p.setStatus([a], 'done');
    p.setStatus([b, c], 'draft');
    expect(p.node(a)!.status).toBe('done');
    expect(progressOf(p, map)).toEqual({ idea: 0, draft: 2, done: 1, words: 7 });
    p.setStatus([c], 'idea');
    expect(progressOf(p, map)).toEqual({ idea: 1, draft: 1, done: 1, words: 7 });
    // Nothing said is nothing kept.
    p.setStatus([a, b, c], null);
    expect(p.yNodes.get(a)!.has('status')).toBe(false);
    expect(progressOf(p, map)).toBeNull();
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
});

describe('undo', () => {
  it('undoes and redoes changes of structure', () => {
    const { p, map, root } = project();
    p.checkpoint();
    const a = p.addChild(root, { title: 'A' })!;
    p.checkpoint();
    p.remove([a]);
    expect(p.tree(map).sequence).toEqual([root]);
    p.undo();
    expect(titles(p, p.tree(map).sequence)).toEqual(['Wrath', 'A']);
    p.undo();
    expect(p.tree(map).sequence).toEqual([root]);
    expect(p.canRedo).toBe(true);
    p.redo();
    expect(titles(p, p.tree(map).sequence)).toEqual(['Wrath', 'A']);
  });

  /** Two copies of one project, that have seen each other's changes. */
  function two() {
    const a = new Project(null);
    const map = a.createMap('Wrath');
    const root = a.map(map)!.root;
    const b = new Project(null);
    b.load(Y.encodeStateAsUpdate(a.doc), []);
    const sync = () => {
      Y.applyUpdate(b.doc, Y.encodeStateAsUpdate(a.doc, Y.encodeStateVector(b.doc)), 'remote');
      Y.applyUpdate(a.doc, Y.encodeStateAsUpdate(b.doc, Y.encodeStateVector(a.doc)), 'remote');
    };
    return { a, b, map, root, sync };
  }

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
    const { a, b, map, root, sync } = two();
    a.checkpoint();
    const x = a.addChild(root, { title: 'X' })!;
    a.checkpoint();
    sync();
    write(b, x, 'Written by the other.');
    sync();

    a.undo();
    expect(a.tree(map).sequence).toContain(x);
    expect(a.tree(map).parent.get(x)).toBe(root);
    expect(a.fragment(x, 'body')!.toString()).toContain('Written by the other.');
    sync();
    expect(b.tree(map).sequence).toContain(x);
    expect(b.fragment(x, 'body')!.toString()).toContain('Written by the other.');
  });

  it('taking back an element one made removes it, when no one else has touched it', () => {
    const { a, b, map, root, sync } = two();
    a.checkpoint();
    const x = a.addChild(root, { title: 'X' })!;
    a.checkpoint();
    sync();
    a.undo();
    expect(a.tree(map).sequence).not.toContain(x);
    sync();
    expect(b.tree(map).sequence).not.toContain(x);
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

describe('putting in order', () => {
  it('elements added to a map another deleted meanwhile go when the project is read', () => {
    const a = new Project(null);
    const kept = a.createMap('Kept');
    const doomed = a.createMap('Doomed');
    const b = new Project(null);
    b.load(Y.encodeStateAsUpdate(a.doc), []);

    a.deleteMap(doomed);
    const late = b.addChild(b.map(doomed)!.root, {
      title: 'Late',
      body: 'Words no one will see.',
    })!;
    Y.applyUpdate(a.doc, Y.encodeStateAsUpdate(b.doc), 'remote');
    expect(a.yNodes.has(late)).toBe(true);

    const read = new Project(null);
    read.load(Y.encodeStateAsUpdate(a.doc), []);
    expect(read.yNodes.has(late)).toBe(false);
    expect(read.summary().words).toBe(0);
    expect(read.tree(kept).sequence).toHaveLength(1);
  });

  it('elements of a map that has not arrived yet are left alone', () => {
    const a = new Project(null);
    a.createMap('Wrath');
    const node = new Y.Map<unknown>();
    const read = new Project(null);
    read.load(Y.encodeStateAsUpdate(a.doc), []);
    read.doc.transact(() => {
      node.set('map', 'a map on its way');
      read.yNodes.set('waiting', node);
    }, 'remote');
    const again = new Project(null);
    again.load(Y.encodeStateAsUpdate(read.doc), []);
    expect(again.yNodes.has('waiting')).toBe(true);
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

  it('what is saved can be read again', async () => {
    const disk = new Disk();
    const p = new Project(disk);
    p.setName('Homer');
    const map = p.createMap('Wrath');
    const a = p.addChild(p.map(map)!.root, { title: 'A', body: 'Four words of text.' })!;
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
    expect(disk.summary).toEqual({
      name: 'Homer',
      maps: [{ id: map, name: 'Wrath', elements: 2 }],
      words: 4,
      references: 0,
      pictures: [],
      cited: [],
    });
    p.setTitle(a, 'A, renamed');
    await p.flush();
    const r = new Project(null);
    r.load(disk.state, disk.log);
    expect(r.node(a)!.title).toBe('A, renamed');
    expect(r.tree(map).sequence).toHaveLength(2);
  });

  it('what each deleted is kept as one record, and let go when the history is turned off', async () => {
    const disk = new Disk();
    const p = new Project(disk);
    const map = p.createMap('Wrath');
    const root = p.map(map)!.root;
    p.setMe({ id: 'me', name: 'Robert' });
    await p.setHistory({ on: true });
    const made: string[] = [];
    for (let i = 0; i < 30; i++) {
      made.push(p.addChild(root, { title: `E${i}` })!);
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
    const map = p.createMap('Wrath');
    disk.fail = true;
    await p.flush();
    expect(p.status).toBe('error');
    expect(p.saveError).toBe('disk full');
    disk.fail = false;
    p.addChild(p.map(map)!.root, { title: 'A' });
    await p.flush();
    expect(p.status).toBe('saved');
    const q = new Project(null);
    q.load(null, disk.log);
    expect(q.tree(map).sequence).toHaveLength(2);
  });

  it('two copies that change at once arrive at the same', () => {
    const a = new Project(null);
    const map = a.createMap('Wrath');
    const root = a.map(map)!.root;
    const x = a.addChild(root, { title: 'X' })!;
    const y = a.addChild(root, { title: 'Y' })!;
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

    const ta = a.tree(map);
    const tb = b.tree(map);
    expect(ta.sequence).toEqual(tb.sequence);
    expect(ta.sequence).toHaveLength(4);
    expect(ta.loose).toHaveLength(1);
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
    const { p, map, root } = project();
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
    p.transact(() => fillBody(p.fragment(a, 'body')!, 'Dear reader', letter));
    expect(p.node(a)!.uses).toEqual([letter]);
    p.setHand(map, { pinned: [letter], unpinned: [word] });

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
    // The passage stays as it is; the hand lets the kind go.
    expect(p.blocksOf(a)).toEqual([
      {
        kind: 'passage',
        name: letter,
        content: [{ kind: 'text', text: 'Dear reader', marks: {} }],
      },
    ]);
    expect(p.map(map)!.hand).toEqual({ pinned: [], unpinned: [word] });
    p.deletePassageKind(word);
    expect(p.map(map)!.hand).toEqual({ pinned: [], unpinned: [] });
    expect(p.yMaps.get(map)!.has('hand')).toBe(false);
  });

  it('the hand of a map is pinned and unpinned, and kept only while it says something', () => {
    const { p, map } = project();
    expect(p.map(map)!.hand).toEqual({ pinned: [], unpinned: [] });
    p.setHand(map, { pinned: ['epigraph', ' scene ', 'epigraph', ''] });
    expect(p.map(map)!.hand).toEqual({ pinned: ['epigraph', 'scene'], unpinned: [] });
    // What is unpinned is pinned no more, and the other way round.
    p.setHand(map, { unpinned: ['scene', 'quote'] });
    expect(p.map(map)!.hand).toEqual({ pinned: ['epigraph'], unpinned: ['scene', 'quote'] });
    p.setHand(map, { pinned: ['quote'] });
    expect(p.map(map)!.hand).toEqual({ pinned: ['quote'], unpinned: ['scene'] });
    p.setHand(map, { pinned: [], unpinned: [] });
    expect(p.yMaps.get(map)!.has('hand')).toBe(false);
    p.setHand(map, { pinned: ['code'] });
    const copy = p.duplicateMap(map)!;
    expect(p.map(copy)!.hand).toEqual({ pinned: ['code'], unpinned: [] });
    p.setHand('no such map', { pinned: ['code'] });
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
      begins: ' verse ',
    })!;
    expect(p.kind(scene)!.begins).toBe('scene');
    expect(p.kind(chorus)!.begins).toBe('verse');
    const a = p.addChild(root, { title: 'A' })!;
    const b = p.addChild(root, { title: 'B' })!;
    const c = p.addChild(root, { title: 'C', body: 'Written already.' })!;
    p.setKind([a], scene);
    expect(p.blocksOf(a)).toEqual([
      { kind: 'script', part: 'scene', content: [{ kind: 'text', text: 'INT. HOUSE', marks: {} }] },
    ]);
    // Without a text to begin with, the writing begins in the kind.
    p.setKind([b, c], chorus);
    expect(p.blocksOf(b)).toEqual([
      { kind: 'verse', start: null, by: 5, lines: [{ kind: 'line', indent: 0, content: [] }] },
    ]);
    expect(p.blocksOf(c)).toEqual([
      { kind: 'paragraph', content: [{ kind: 'text', text: 'Written already.', marks: {} }] },
    ]);
    p.updateKind(chorus, { begins: '' });
    expect(p.kind(chorus)!.begins).toBeUndefined();
  });
});
