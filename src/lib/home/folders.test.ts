import { describe, expect, it } from 'vitest';
import type { Folder, ProjectInfo } from '$lib/api/projects';
import { descendants, folderTree, foldersOpenTo, pathOf, rows } from './folders';

const folder = (id: string, name: string, parent?: string): Folder => ({
  id,
  name,
  parent,
  order: id,
});

const project = (id: string, name: string, folder?: string): ProjectInfo => ({
  id,
  name,
  folder,
  description: '',
  created: '2026-01-01T00:00:00Z',
  modified: '2026-01-01T00:00:00Z',
  maps: [],
  words: 0,
  references: 0,
});

const folders = [folder('g', 'Greek'), folder('e', 'Epic', 'g'), folder('l', 'Latin')];
const projects = [
  project('odyssey', 'Odyssey', 'e'),
  project('iliad', 'Iliad', 'e'),
  project('aeneid', 'Aeneid', 'l'),
  project('notes', 'Notes'),
  project('lost', 'Lost', 'gone'),
];

const shape = (list: ReturnType<typeof rows>) =>
  list.map(
    (r) =>
      `${'  '.repeat(r.depth)}${r.kind === 'folder' ? `${r.folder.name}/${r.projects}` : r.project.name}`,
  );

describe('the rows of the list of projects', () => {
  it('put folders first, then projects, by name, and count the projects within', () => {
    expect(shape(rows(folders, projects, { collapsed: new Set() }))).toEqual([
      'Greek/2',
      '  Epic/2',
      '    Iliad',
      '    Odyssey',
      'Latin/1',
      '  Aeneid',
      'Lost',
      'Notes',
    ]);
  });

  it('leave out what lies under a closed folder', () => {
    const list = rows(folders, projects, { collapsed: new Set(['g']) });
    expect(shape(list)).toEqual(['Greek/2', 'Latin/1', '  Aeneid', 'Lost', 'Notes']);
    const greek = list[0];
    expect(greek.kind === 'folder' && greek.open).toBe(false);
    expect(greek.kind === 'folder' && greek.holds).toBe(true);
  });

  it('with a filter show the projects whose name holds it, in their folders, open', () => {
    expect(
      shape(rows(folders, projects, { collapsed: new Set(['g', 'e']), filter: 'ia' })),
    ).toEqual(['Greek/1', '  Epic/1', '    Iliad']);
    expect(shape(rows(folders, projects, { collapsed: new Set(), filter: 'xyz' }))).toEqual([]);
  });

  it('treat a project in a folder that is gone as in none', () => {
    const list = rows(folders, projects, { collapsed: new Set() });
    const lost = list.find((r) => r.kind === 'project' && r.project.id === 'lost');
    expect(lost?.depth).toBe(0);
  });
});

describe('folders as a tree', () => {
  it('know what lies under a folder', () => {
    expect([...descendants(folders, 'g')].sort()).toEqual(['e', 'g']);
    expect([...descendants(folders, 'l')]).toEqual(['l']);
  });

  it('say which folders another may be moved into', () => {
    expect(foldersOpenTo(folders, 'g').map((f) => f.id)).toEqual(['l']);
    expect(foldersOpenTo(folders, 'e').map((f) => f.id)).toEqual(['g', 'l']);
  });

  it('name a folder with the folders it lies in', () => {
    expect(pathOf(folders, 'e')).toBe('Greek / Epic');
    expect(pathOf(folders, 'l')).toBe('Latin');
  });

  it('list the folders each before what lies in it, with their depth', () => {
    expect(folderTree(folders).map((x) => `${x.depth}:${x.folder.name}`)).toEqual([
      '0:Greek',
      '1:Epic',
      '0:Latin',
    ]);
  });
});
