import { describe, expect, it, vi } from 'vitest';
import type { Folder, ProjectInfo } from '$lib/api/projects';
import { t } from '$lib/i18n';
import type { MenuItem } from '$lib/ui/menu.svelte';
import { projectsMenu } from './projects-menu';

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

/** The menu written out: a submenu as `name/` with what is in it, an item as its name, `*` where it is marked. */
function shape(items: MenuItem[]): unknown[] {
  return items.map((item) =>
    item.kind === 'submenu'
      ? { [`${item.label}/${item.disabled ? ' (disabled)' : ''}`]: shape(item.items) }
      : item.kind === 'separator' || item.kind === 'heading'
        ? item.kind
        : `${item.label}${item.checked ? ' *' : ''}${item.disabled ? ' (disabled)' : ''}`,
  );
}

const folders = [
  folder('f1', 'Greek'),
  folder('f2', 'epic', 'f1'),
  folder('f3', 'Latin'),
  folder('f4', 'Empty'),
];
const list = [
  project('p1', 'Odyssey', 'f2'),
  project('p2', 'Iliad', 'f2'),
  project('p3', 'Sappho', 'f1'),
  project('p4', 'Aeneid', 'f3'),
  project('p5', 'Notes'),
  project('p6', 'A letter', 'gone'),
];

describe('projectsMenu', () => {
  it('has the folders as submenus and the projects as items, in the order of the list', () => {
    const items = projectsMenu(folders, list, { shown: ['p2'], choose: () => {} });
    expect(shape(items)).toEqual([
      { 'Empty/ (disabled)': [`${t('home-folder-empty')} (disabled)`] },
      { 'Greek/': [{ 'epic/': ['Iliad *', 'Odyssey'] }, 'Sappho'] },
      { 'Latin/': ['Aeneid'] },
      'A letter',
      'Notes',
    ]);
  });

  it('chooses the project of an item', () => {
    const choose = vi.fn();
    const items = projectsMenu(folders, list, { shown: [], choose });
    const notes = items.find((i) => i.kind === undefined && i.label === 'Notes');
    if (notes?.kind === undefined) notes?.action();
    expect(choose).toHaveBeenCalledWith('p5');
  });

  it('gives the menu of one folder alone', () => {
    expect(shape(projectsMenu(folders, list, { shown: [], choose: () => {}, at: 'f1' }))).toEqual([
      { 'epic/': ['Iliad', 'Odyssey'] },
      'Sappho',
    ]);
    expect(shape(projectsMenu(folders, list, { shown: [], choose: () => {}, at: 'f4' }))).toEqual([
      `${t('home-folder-empty')} (disabled)`,
    ]);
  });

  it('gives the whole menu for a folder that is gone', () => {
    expect(projectsMenu(folders, list, { shown: [], choose: () => {}, at: 'nope' })).toHaveLength(
      5,
    );
  });
});
