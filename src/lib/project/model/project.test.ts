import { describe, expect, it } from 'vitest';
import * as Y from 'yjs';
import { Project, type Persistence, type Summary } from './project.svelte';

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
    expect(p.node(copy)!.origin).toEqual({ map, node: a });
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
    });
    p.setTitle(a, 'A, renamed');
    await p.flush();
    const r = new Project(null);
    r.load(disk.state, disk.log);
    expect(r.node(a)!.title).toBe('A, renamed');
    expect(r.tree(map).sequence).toHaveLength(2);
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
