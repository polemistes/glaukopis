import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Folder, ProjectInfo } from '$lib/api/projects';
import { t } from '$lib/i18n';
import type { MapMode } from '$lib/state/router.svelte';
import type { MenuItem } from '$lib/ui/menu.svelte';

const { projects, sharingRename, confirm, notifyOk, notifyError } = vi.hoisted(() => ({
  projects: {
    list: [] as ProjectInfo[],
    folders: [] as Folder[],
    folder: vi.fn(),
    create: vi.fn(),
    createFolder: vi.fn(),
    renameFolder: vi.fn(),
    rename: vi.fn(),
    duplicate: vi.fn(),
    remove: vi.fn(),
  },
  sharingRename: vi.fn(),
  confirm: vi.fn(),
  notifyOk: vi.fn(),
  notifyError: vi.fn(),
}));

vi.mock('$lib/state/projects.svelte', () => ({ projects }));
vi.mock('$lib/api/sharing', () => ({ sharingRename }));
vi.mock('$lib/ui/confirm.svelte', () => ({ confirm }));
vi.mock('$lib/ui/toast.svelte', async (original) => ({
  ...(await original<typeof import('$lib/ui/toast.svelte')>()),
  notifyOk,
  notifyError,
}));

import { namingAction, namingTitle, ofFolder, ProjectActions } from './project-actions.svelte';

const project = (id: string, name: string, more: Partial<ProjectInfo> = {}): ProjectInfo => ({
  id,
  name,
  description: '',
  created: '2026-01-01T00:00:00Z',
  modified: '2026-01-01T00:00:00Z',
  maps: [],
  words: 0,
  references: 0,
  ...more,
});

const folder: Folder = { id: 'g', name: 'Greek', order: 'a' };

const labels = (items: MenuItem[]) =>
  items.map((i) => (i.kind === 'separator' ? '—' : 'label' in i ? i.label : ''));

const item = (items: MenuItem[], label: string) =>
  items.find((i) => 'label' in i && i.label === label) as Extract<MenuItem, { action: unknown }>;

describe('what is done with a project from a list of them', () => {
  let open: ReturnType<typeof vi.fn<(p: ProjectInfo, mode?: MapMode) => void>>;
  let deleted: ReturnType<typeof vi.fn<() => void>>;
  let actions: ProjectActions;

  beforeEach(() => {
    vi.clearAllMocks();
    projects.list = [];
    projects.folders = [];
    open = vi.fn();
    deleted = vi.fn();
    actions = new ProjectActions({ open, deleted });
  });

  it('makes a new project, and opens it in its diagram, as the settings say at first', async () => {
    const made = project('n', 'Odyssey');
    projects.create.mockResolvedValue(made);
    actions.newProject();
    expect(actions.naming?.purpose).toBe('new');
    actions.naming!.value = '  Odyssey ';
    await actions.commit();
    expect(projects.create).toHaveBeenCalledWith('Odyssey', null);
    expect(open).toHaveBeenCalledWith(made, 'diagram');
    expect(actions.naming).toBeNull();
    expect(actions.busy).toBe(false);
  });

  it('asks again for a name that is missing, saying whether it is of a folder', async () => {
    actions.newProject();
    await actions.commit();
    expect(actions.naming?.error).toBe(t('home-name-missing'));
    actions.newFolder(null);
    actions.naming!.value = '   ';
    await actions.commit();
    expect(actions.naming?.error).toBe(t('home-folder-name-missing'));
    expect(projects.create).not.toHaveBeenCalled();
    expect(projects.createFolder).not.toHaveBeenCalled();
  });

  it('makes a folder inside another, and renames one', async () => {
    projects.createFolder.mockResolvedValue({ id: 'e', name: 'Epic', parent: 'g', order: 'b' });
    actions.newFolder('g');
    actions.naming!.value = 'Epic';
    await actions.commit();
    expect(projects.createFolder).toHaveBeenCalledWith('Epic', 'g');
    expect(actions.naming).toBeNull();
    actions.renameFolder(folder);
    expect(actions.naming?.value).toBe('Greek');
    actions.naming!.value = 'Hellenic';
    await actions.commit();
    expect(projects.renameFolder).toHaveBeenCalledWith('g', 'Hellenic');
    expect(actions.naming).toBeNull();
  });

  it('renames a project, telling the server of one it shares as owner', async () => {
    const shared = project('s', 'Iliad', {
      sharing: { owner: true } as ProjectInfo['sharing'],
    });
    sharingRename.mockResolvedValue(undefined);
    actions.rename(shared);
    actions.naming!.value = 'The Iliad';
    await actions.commit();
    expect(projects.rename).toHaveBeenCalledWith('s', 'The Iliad');
    expect(sharingRename).toHaveBeenCalledWith('s', 'The Iliad');

    actions.rename(project('p', 'Notes'));
    actions.naming!.value = 'More notes';
    await actions.commit();
    expect(sharingRename).toHaveBeenCalledTimes(1);
  });

  it('duplicates a project under a name of its own', async () => {
    const p = project('p', 'Aeneid');
    projects.duplicate.mockResolvedValue(project('c', t('home-copy-name', { name: 'Aeneid' })));
    actions.duplicate(p);
    expect(actions.naming?.value).toBe(t('home-copy-name', { name: 'Aeneid' }));
    await actions.commit();
    expect(projects.duplicate).toHaveBeenCalledWith('p', t('home-copy-name', { name: 'Aeneid' }));
    expect(actions.naming).toBeNull();
  });

  it('keeps the dialog open, saying why, when it fails', async () => {
    projects.rename.mockRejectedValue(new Error('The name is taken'));
    actions.rename(project('p', 'Notes'));
    actions.naming!.value = 'Other';
    await actions.commit();
    expect(actions.naming?.error).toBe('The name is taken');
    expect(actions.busy).toBe(false);
  });

  it('deletes only what is confirmed, and says so to its place', async () => {
    const p = project('p', 'Notes');
    projects.list = [p];
    confirm.mockResolvedValueOnce(false);
    await actions.remove(p);
    expect(projects.remove).not.toHaveBeenCalled();
    confirm.mockResolvedValueOnce(true);
    projects.remove.mockResolvedValue(undefined);
    await actions.remove(p);
    expect(projects.remove).toHaveBeenCalledWith('p');
    expect(deleted).toHaveBeenCalledTimes(1);
  });

  it('gives the one menu of a project, without entering, renaming or deleting the one that is open', () => {
    const p = project('p', 'Notes');
    const menu = actions.items(p);
    expect(labels(menu)).toEqual([
      t('home-open'),
      '—',
      t('home-menu-rename'),
      t('home-menu-duplicate'),
      t('home-menu-history'),
      t('home-menu-save-file'),
      t('home-menu-save-org'),
      t('home-menu-save-mindmap'),
      '—',
      t('home-menu-move'),
      '—',
      t('common-delete'),
    ]);
    item(menu, t('home-open')).action();
    expect(open).toHaveBeenCalledWith(p, undefined);
    item(menu, t('home-menu-history')).action();
    expect(actions.earlier).toBe(p);

    // A project shown in a side is closed from here, and neither opened, renamed nor deleted.
    const close = vi.fn();
    const here = actions.items(p, { shown: ['p'], close, beside: () => {} });
    expect(item(here, t('home-open')).disabled).toBe(true);
    expect(labels(here)).not.toContain(t('home-open-beside'));
    expect(item(here, t('home-menu-rename')).disabled).toBe(true);
    expect(item(here, t('common-delete')).disabled).toBe(true);
    expect(item(here, t('home-menu-duplicate')).disabled).toBeFalsy();
    item(here, t('home-close')).action();
    expect(close).toHaveBeenCalledWith('p');

    // Another project, while one is shown, is opened beside it; one whose tree the place shows folds.
    const beside = vi.fn();
    const toggle = vi.fn();
    const other = actions.items(p, { shown: ['q'], close, beside, fold: { folded: true, toggle } });
    expect(labels(other).slice(0, 3)).toEqual([
      t('home-open'),
      t('home-open-beside'),
      t('home-unfold'),
    ]);
    expect(labels(other)).not.toContain(t('home-close'));
    item(other, t('home-open-beside')).action();
    expect(beside).toHaveBeenCalledWith('p');
    item(other, t('home-unfold')).action();
    expect(toggle).toHaveBeenCalled();

    // Where the place can share, Share… stands after saving, for a project shown or not.
    const share = vi.fn();
    const sharing = actions.items(p, { shown: ['p'], share });
    const at = labels(sharing).indexOf(t('home-share'));
    expect(labels(sharing)[at - 1]).toBe(t('home-menu-save-mindmap'));
    item(sharing, t('home-share')).action();
    expect(share).toHaveBeenCalledWith('p');
    expect(labels(menu)).not.toContain(t('home-share'));
  });

  it('gives the one menu of a folder, which is not entered, and of an element', () => {
    const enter = vi.fn();
    const f = { id: 'f', name: 'Greek', parent: null, order: 0 } as never;
    const menu = actions.folderItems(f, { fold: { folded: false, toggle: () => {} } });
    expect(labels(menu).slice(0, 3)).toEqual([t('home-fold'), '—', t('home-owl-new-project')]);
    expect(labels(menu)).not.toContain(t('home-enter'));
    expect(labels(actions.elementItems({ enter }))).toEqual([t('home-enter')]);
    expect(labels(actions.elementItems({ enter, beside: () => {} }))).toEqual([
      t('home-enter'),
      t('home-enter-beside'),
    ]);
  });

  it('names the dialog and its button by what it asks', () => {
    expect(namingTitle('new')).toBe(t('home-new'));
    expect(namingTitle('folder-rename')).toBe(t('home-folder-rename-title'));
    expect(namingAction('folder')).toBe(t('home-create'));
    expect(namingAction('rename')).toBe(t('common-rename'));
    expect(namingAction('copy')).toBe(t('home-duplicate'));
    expect(ofFolder('folder')).toBe(true);
    expect(ofFolder('copy')).toBe(false);
  });
});
