/**
 * What is done with a project from the list of projects, the same on the
 * home page and in the pane of projects (ADR 0033): its menu, and the
 * dialog that asks for a name, for a new project, a renamed one, a copy, a
 * new folder or a renamed one. Each place has its own, shown by
 * `ProjectActionsHost.svelte`; what opens a project is the place's.
 */

import Copy from '@lucide/svelte/icons/copy';
import History from '@lucide/svelte/icons/history';
import Pencil from '@lucide/svelte/icons/pencil';
import Trash2 from '@lucide/svelte/icons/trash-2';
import type { Folder, ProjectInfo } from '$lib/api/projects';
import { sharingRename } from '$lib/api/sharing';
import { t } from '$lib/i18n';
import { projects } from '$lib/state/projects.svelte';
import type { MapMode } from '$lib/state/router.svelte';
import { confirm } from '$lib/ui/confirm.svelte';
import type { MenuItem } from '$lib/ui/menu.svelte';
import { describeError, notifyError, notifyOk } from '$lib/ui/toast.svelte';

/** What a name is asked for. */
export type Purpose = 'new' | 'rename' | 'copy' | 'folder' | 'folder-rename';

export interface Naming {
  purpose: Purpose;
  project?: ProjectInfo;
  folder?: Folder;
  /** The folder a new folder is made in. */
  parent?: string | null;
  value: string;
  error: string | null;
}

/** Whether the name asked for is that of a folder. */
export const ofFolder = (purpose: Purpose) => purpose === 'folder' || purpose === 'folder-rename';

/** The title of the dialog that asks for a name. */
export function namingTitle(purpose: Purpose): string {
  switch (purpose) {
    case 'new':
      return t('home-new');
    case 'rename':
      return t('home-rename-title');
    case 'copy':
      return t('home-duplicate-title');
    case 'folder':
      return t('home-new-folder');
    case 'folder-rename':
      return t('home-folder-rename-title');
  }
}

/** The words of the button that does it. */
export function namingAction(purpose: Purpose): string {
  if (purpose === 'new' || purpose === 'folder') return t('home-create');
  if (purpose === 'rename' || purpose === 'folder-rename') return t('common-rename');
  return t('home-duplicate');
}

export interface ActionsPlace {
  /** Opens a project; with a mode, in that view rather than where it was left. */
  open: (p: ProjectInfo, mode?: MapMode) => void;
  /** A project was moved to the trash. */
  deleted?: () => void;
}

export class ProjectActions {
  /** The dialog that asks for a name, while it is open. */
  naming = $state<Naming | null>(null);
  busy = $state(false);
  /** The project whose earlier versions are shown. */
  earlier = $state.raw<ProjectInfo | null>(null);
  #place: ActionsPlace;

  constructor(place: ActionsPlace) {
    this.#place = place;
  }

  open(p: ProjectInfo, mode?: MapMode) {
    this.#place.open(p, mode);
  }

  newProject() {
    this.naming = { purpose: 'new', value: '', error: null };
  }

  newFolder(parent: string | null) {
    this.naming = { purpose: 'folder', parent, value: '', error: null };
  }

  renameFolder(folder: Folder) {
    this.naming = { purpose: 'folder-rename', folder, value: folder.name, error: null };
  }

  rename(project: ProjectInfo) {
    this.naming = { purpose: 'rename', project, value: project.name, error: null };
  }

  duplicate(project: ProjectInfo) {
    this.naming = {
      purpose: 'copy',
      project,
      value: t('home-copy-name', { name: project.name }),
      error: null,
    };
  }

  /** Does what the dialog asks, with the name written; it stays open, saying why, where that fails. */
  async commit() {
    const naming = this.naming;
    if (!naming || this.busy) return;
    const name = naming.value.trim();
    if (!name) {
      naming.error = ofFolder(naming.purpose)
        ? t('home-folder-name-missing')
        : t('home-name-missing');
      return;
    }
    this.busy = true;
    try {
      if (naming.purpose === 'new') {
        const made = await projects.create(name);
        this.naming = null;
        // The first time, on its text: a new project begins with writing.
        this.open(made, 'text');
      } else if (naming.purpose === 'folder') {
        await projects.createFolder(name, naming.parent ?? null);
        this.naming = null;
      } else if (naming.purpose === 'folder-rename' && naming.folder) {
        await projects.renameFolder(naming.folder.id, name);
        this.naming = null;
      } else if (naming.purpose === 'rename' && naming.project) {
        await projects.rename(naming.project.id, name);
        // Those who share it are told the name by the server; the server itself takes no harm from failing.
        if (naming.project.sharing?.owner) sharingRename(naming.project.id, name).catch(() => {});
        this.naming = null;
      } else if (naming.purpose === 'copy' && naming.project) {
        await projects.duplicate(naming.project.id, name);
        this.naming = null;
      }
    } catch (error) {
      if (this.naming) this.naming.error = describeError(error) ?? t('home-failed');
    } finally {
      this.busy = false;
    }
  }

  /** Moves a project to the trash, when that is confirmed. */
  async remove(p: ProjectInfo) {
    const ok = await confirm({
      title: t('home-delete-title', { name: p.name }),
      message: p.sharing
        ? p.sharing.owner
          ? t('home-delete-owner')
          : t('home-delete-member')
        : t('home-delete-message'),
      confirm: t('home-delete-confirm'),
      danger: true,
    });
    if (!ok) return;
    try {
      await projects.remove(p.id);
      notifyOk(t('home-deleted', { name: p.name }));
      this.#place.deleted?.();
    } catch (error) {
      notifyError(t('home-delete-failed'), error);
    }
  }

  /**
   * The menu of a project. The project that is open (`here`) is not opened
   * again, and is neither renamed nor deleted while it is open: what is
   * written in it goes to its folder on disk.
   */
  items(p: ProjectInfo, options: { here?: boolean } = {}): MenuItem[] {
    const here = !!options.here;
    const open: MenuItem[] = here
      ? []
      : [{ label: t('common-open'), action: () => this.open(p) }, { kind: 'separator' }];
    return [
      ...open,
      {
        label: t('home-menu-rename'),
        icon: Pencil,
        hint: here ? t('home-open-now') : undefined,
        disabled: here,
        action: () => this.rename(p),
      },
      { label: t('home-menu-duplicate'), icon: Copy, action: () => this.duplicate(p) },
      { label: t('home-menu-history'), icon: History, action: () => (this.earlier = p) },
      { kind: 'separator' },
      {
        label: t('common-delete'),
        icon: Trash2,
        danger: true,
        hint: here ? t('home-open-now') : undefined,
        disabled: here,
        action: () => void this.remove(p),
      },
    ];
  }
}
