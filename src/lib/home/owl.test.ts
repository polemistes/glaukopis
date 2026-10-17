import { describe, expect, it } from 'vitest';
import type { Folder, ProjectInfo } from '$lib/api/projects';
import { layout } from '$lib/project/diagram/layout';
import { buildTree } from '$lib/project/model/tree';
import { PROJECT, type NodeRecord } from '$lib/project/model/types';
import type { ClosedTree } from './closed.svelte';
import {
  centreOf,
  elementKey,
  FOLD_OVER,
  folderAbove,
  folderBefore,
  folderKey,
  keyed,
  OWL,
  owlTree,
  parentKey,
  projectCounts,
  projectKey,
  PROVISIONAL,
  siblingsOf,
  startsFolded,
  whereNew,
} from './owl';

const project = (id: string, name: string, folder?: string): ProjectInfo => ({
  id,
  name,
  description: '',
  created: '',
  modified: '',
  maps: [],
  words: 0,
  references: 0,
  folder,
});

const folder = (id: string, name: string, parent?: string): Folder => ({
  id,
  name,
  parent,
  order: '',
});

describe('the owl map', () => {
  const folders = [folder('g', 'Greek'), folder('e', 'Epic', 'g'), folder('x', 'Empty')];
  const projects = [
    project('1', 'Odyssey', 'e'),
    project('2', 'Iliad', 'e'),
    project('3', 'Notes'),
    project('4', 'Lyric', 'g'),
    project('5', 'Lost', 'gone'),
  ];

  it('counts the projects of a folder with those of the folders under it', () => {
    const counts = projectCounts(folders, projects);
    expect(counts.get('e')).toBe(2);
    expect(counts.get('g')).toBe(3);
    expect(counts.get('x')).toBe(0);
  });

  it('hangs the folders and the projects in none from the owl, folders first, by name', () => {
    const { tree, items } = owlTree(folders, projects);
    expect(tree.root).toBe(OWL);
    expect(tree.children.get(OWL)).toEqual([
      folderKey('x'),
      folderKey('g'),
      projectKey('5'),
      projectKey('3'),
    ]);
    expect(tree.children.get(folderKey('g'))).toEqual([folderKey('e'), projectKey('4')]);
    expect(tree.children.get(folderKey('e'))).toEqual([projectKey('2'), projectKey('1')]);
    const g = items.get(folderKey('g'));
    expect(g?.kind === 'folder' && g.projects).toBe(3);
    const x = items.get(folderKey('x'));
    expect(x?.kind === 'folder' && x.holds).toBe(false);
  });

  it('folds a folder of many projects, unless it was chosen otherwise', () => {
    expect(startsFolded(FOLD_OVER)).toBe(false);
    expect(startsFolded(FOLD_OVER + 1)).toBe(true);
    const many = Array.from({ length: FOLD_OVER + 1 }, (_, i) => project(`m${i}`, `M${i}`, 'g'));
    const folded = owlTree(folders, many);
    expect(folded.nodes.get(folderKey('g'))?.collapsed).toBe(true);
    const opened = owlTree(folders, many, new Map([['g', false]]));
    expect(opened.nodes.get(folderKey('g'))?.collapsed).toBe(false);
    const closed = owlTree(folders, projects, new Map([['e', true]]));
    expect(closed.nodes.get(folderKey('e'))?.collapsed).toBe(true);
    // A folder that holds nothing has nothing to fold.
    const empty = owlTree(folders, projects, new Map([['x', true]]));
    expect(empty.nodes.get(folderKey('x'))?.collapsed).toBe(false);
  });

  it('is laid out by the layout of the diagram, the owl in the middle, both sides used', () => {
    const { tree, nodes } = owlTree(folders, projects, new Map([['e', true]]));
    const lay = layout(tree, nodes as unknown as ReadonlyMap<string, NodeRecord>, new Map());
    expect(lay.placed.get(OWL)).toMatchObject({ x: 0, y: 0 });
    // What is folded is not placed; its folder is.
    expect(lay.placed.has(projectKey('1'))).toBe(false);
    expect(lay.placed.get(folderKey('e'))?.hidden).toBe(2);
    const sides = new Set((tree.children.get(OWL) ?? []).map((id) => lay.placed.get(id)?.side));
    expect(sides).toEqual(new Set(['left', 'right']));
  });

  it('survives a folder that lies in itself', () => {
    const loop = [folder('a', 'A', 'b'), folder('b', 'B', 'a')];
    const { tree } = owlTree(loop, [project('1', 'One', 'a')]);
    expect(tree.sequence).toContain(projectKey('1'));
    expect(projectCounts(loop, [project('1', 'One', 'a')]).get('a')).toBeGreaterThanOrEqual(1);
  });

  it('reads what a key names', () => {
    expect(keyed(OWL)).toEqual({ kind: 'owl' });
    expect(keyed(folderKey('g'))).toEqual({ kind: 'folder', id: 'g' });
    expect(keyed(projectKey('1'))).toEqual({ kind: 'project', id: '1' });
    expect(keyed(PROVISIONAL)).toEqual({ kind: 'provisional' });
  });

  it('shows what lies under a folder entered, with the folder at the centre', () => {
    const { tree, items } = owlTree(folders, projects, new Map(), { at: folderKey('g') });
    expect(tree.root).toBe(folderKey('g'));
    expect(tree.children.get(folderKey('g'))).toEqual([folderKey('e'), projectKey('4')]);
    expect(tree.children.get(folderKey('e'))).toEqual([projectKey('2'), projectKey('1')]);
    expect(items.has(OWL)).toBe(false);
    expect(items.has(projectKey('3'))).toBe(false);
    expect(tree.sequence).not.toContain(folderKey('x'));
    // A folder that is not there is the owl.
    expect(centreOf(folders, folderKey('gone'))).toBe(OWL);
    expect(owlTree(folders, projects, new Map(), { at: folderKey('gone') }).tree.root).toBe(OWL);
  });

  it('shows what is being made first among its kind, in an open folder', () => {
    const many = Array.from({ length: FOLD_OVER + 1 }, (_, i) => project(`m${i}`, `M${i}`, 'g'));
    const folder = owlTree(folders, many, new Map(), {
      provisional: { of: 'folder', parent: 'g' },
    });
    expect(folder.tree.children.get(folderKey('g'))?.[0]).toBe(PROVISIONAL);
    expect(folder.nodes.get(folderKey('g'))?.collapsed).toBe(false);
    const made = owlTree(folders, projects, new Map(), {
      provisional: { of: 'project', parent: null },
    });
    const top = made.tree.children.get(OWL) ?? [];
    expect(top.indexOf(PROVISIONAL)).toBe(top.indexOf(projectKey('5')) - 1);
    expect(made.items.get(PROVISIONAL)).toEqual({ kind: 'provisional', of: 'project' });
  });

  it('knows what holds a thing and what stands beside it', () => {
    const { tree } = owlTree(folders, projects);
    expect(parentKey(projectKey('1'), folders, projects)).toBe(folderKey('e'));
    expect(parentKey(folderKey('e'), folders, projects)).toBe(folderKey('g'));
    expect(parentKey(folderKey('g'), folders, projects)).toBe(OWL);
    expect(parentKey(projectKey('5'), folders, projects)).toBe(OWL);
    expect(parentKey(OWL, folders, projects)).toBe(null);
    expect(siblingsOf(projectKey('4'), tree)).toEqual([folderKey('e'), projectKey('4')]);
    expect(siblingsOf(OWL, tree)).toEqual([]);
  });

  it('puts a thing deeper into the nearest folder before it, and less deep one folder up', () => {
    const { tree } = owlTree(folders, projects);
    expect(folderBefore(projectKey('4'), tree)).toBe(folderKey('e'));
    expect(folderBefore(projectKey('3'), tree)).toBe(folderKey('g'));
    expect(folderBefore(folderKey('g'), tree)).toBe(folderKey('x'));
    expect(folderBefore(folderKey('x'), tree)).toBe(null);
    expect(folderBefore(OWL, tree)).toBe(null);
    expect(folderAbove(projectKey('1'), tree)).toBe(folderKey('g'));
    expect(folderAbove(projectKey('4'), tree)).toBe(OWL);
    expect(folderAbove(projectKey('3'), tree)).toBe(null);
    // At a folder entered, what stands right under it stays.
    const inside = owlTree(folders, projects, new Map(), { at: folderKey('g') }).tree;
    expect(folderAbove(projectKey('4'), inside)).toBe(null);
    expect(folderAbove(projectKey('1'), inside)).toBe(folderKey('g'));
  });

  it('makes a new thing in the folder selected, beside the project selected, or at the centre', () => {
    const { tree } = owlTree(folders, projects);
    expect(whereNew([folderKey('e')], tree)).toBe('e');
    expect(whereNew([projectKey('1')], tree)).toBe('e');
    expect(whereNew([projectKey('3')], tree)).toBe(null);
    expect(whereNew([OWL], tree)).toBe(null);
    expect(whereNew([], tree)).toBe(null);
    expect(whereNew([projectKey('3'), folderKey('g')], tree)).toBe('g');
    const inside = owlTree(folders, projects, new Map(), { at: folderKey('g') }).tree;
    expect(whereNew([], inside)).toBe('g');
    expect(whereNew([projectKey('4')], inside)).toBe('g');
  });

  /** The map of a project: two trees under it, the first with an element under it. */
  const map = (): ClosedTree => ({
    tree: buildTree([
      { id: PROJECT, parent: null, order: '' },
      { id: 'wrath', parent: PROJECT, order: 'a1' },
      { id: 'quarrel', parent: 'wrath', order: 'a1' },
      { id: 'ships', parent: PROJECT, order: 'a2' },
    ]),
    names: new Map([
      ['wrath', 'Wrath'],
      ['quarrel', 'Quarrel'],
      ['ships', 'Ships'],
    ]),
    places: new Map([
      ['wrath', { pos: null, collapsed: true, heading: true, excluded: false }],
      ['ships', { pos: { x: 200, y: 40 }, collapsed: false, heading: false, excluded: true }],
    ]),
  });

  it('shows the map of a project under it, folded away until it is unfolded', () => {
    const folded = owlTree(folders, projects, new Map(), { maps: new Map([['2', map()]]) });
    const wrath = elementKey('2', 'wrath');
    // The trees stand right under the project, which stands for its own element.
    expect(folded.tree.children.get(projectKey('2'))).toEqual([wrath, elementKey('2', 'ships')]);
    expect(folded.items.get(projectKey('2'))).toMatchObject({
      map: 'read',
      elements: 2,
      folded: true,
      holds: true,
    });
    expect(folded.nodes.get(projectKey('2'))?.collapsed).toBe(true);

    const { tree, items, nodes } = owlTree(folders, projects, new Map(), {
      maps: new Map([['2', map()]]),
      openMaps: new Set(['2']),
    });
    expect(nodes.get(projectKey('2'))?.collapsed).toBe(false);
    expect(tree.children.get(wrath)).toEqual([elementKey('2', 'quarrel')]);
    expect(items.get(wrath)).toMatchObject({ name: 'Wrath', holds: true, folded: true, depth: 1 });
    // Folded here though not in the project: one level at a time.
    const open = owlTree(folders, projects, new Map(), {
      maps: new Map([['2', { ...map(), places: new Map() }]]),
      openMaps: new Set(['2']),
    });
    expect(open.nodes.get(wrath)?.collapsed).toBe(true);
    expect(open.nodes.get(elementKey('2', 'ships'))?.collapsed).toBe(false);
    expect(items.get(elementKey('2', 'quarrel'))).toMatchObject({ depth: 2 });
    expect(items.get(elementKey('2', 'ships'))).toMatchObject({ heading: false, excluded: true });
    expect(nodes.get(elementKey('2', 'ships'))?.pos).toEqual({ x: 200, y: 40 });
    // Folded on the map otherwise than in the project.
    const opened = owlTree(folders, projects, new Map(), {
      maps: new Map([['2', map()]]),
      openMaps: new Set(['2']),
      elementFolds: new Map([[wrath, false]]),
    });
    expect(opened.nodes.get(wrath)?.collapsed).toBe(false);
    // Not yet read: what the project last said of its trees.
    const unread = owlTree(folders, [project('9', 'Known', undefined)], new Map());
    expect(unread.items.get(projectKey('9'))).toMatchObject({
      map: null,
      elements: 0,
      holds: false,
    });
    // Being read: nothing under the card yet.
    const reading = owlTree(folders, projects, new Map(), { maps: new Map([['2', 'reading']]) });
    expect(reading.items.get(projectKey('2'))).toMatchObject({ map: 'reading', elements: 0 });
    expect(reading.tree.children.get(projectKey('2')) ?? []).toEqual([]);
    expect(reading.tree.children.get(projectKey('2')) ?? []).toEqual([]);
    expect(keyed(wrath)).toEqual({ kind: 'element', project: '2', id: 'wrath' });
  });

  it('keeps folders and projects where they were put by hand', () => {
    const { nodes } = owlTree(folders, projects, new Map(), {
      places: { [projectKey('3')]: { x: -300, y: 10 }, [folderKey('g')]: { x: 250, y: -90 } },
    });
    expect(nodes.get(projectKey('3'))?.pos).toEqual({ x: -300, y: 10 });
    expect(nodes.get(folderKey('g'))?.pos).toEqual({ x: 250, y: -90 });
    expect(nodes.get(projectKey('1'))?.pos).toBe(null);
  });

  it('makes a new thing in the folder of the project whose element is selected', () => {
    const { tree } = owlTree(folders, projects, new Map(), {
      maps: new Map([['1', map()]]),
      openMaps: new Set(['1']),
    });
    expect(whereNew([elementKey('1', 'quarrel')], tree)).toBe('e');
  });
});
