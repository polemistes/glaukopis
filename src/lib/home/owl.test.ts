import { describe, expect, it } from 'vitest';
import type { Folder, ProjectInfo } from '$lib/api/projects';
import { layout } from '$lib/project/diagram/layout';
import type { NodeRecord } from '$lib/project/model/types';
import { FOLD_OVER, folderKey, OWL, owlTree, projectCounts, projectKey, startsFolded } from './owl';

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
});
