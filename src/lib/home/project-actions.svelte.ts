/**
 * What is done with a project from the list of projects, the same on the
 * home page and in the pane of projects (ADR 0033): its menu, and the
 * dialog that asks for a name, for a new project, a renamed one, a copy, a
 * new folder or a renamed one. Each place has its own, shown by
 * `ProjectActionsHost.svelte`; what opens a project is the place's.
 */

import { open as chooseFile, save } from '@tauri-apps/plugin-dialog';
import Copy from '@lucide/svelte/icons/copy';
import FileDown from '@lucide/svelte/icons/file-down';
import FolderDown from '@lucide/svelte/icons/folder-down';
import History from '@lucide/svelte/icons/history';
import Pencil from '@lucide/svelte/icons/pencil';
import Trash2 from '@lucide/svelte/icons/trash-2';
import type { FileChoice, Folder, FoundWork, ProjectInfo } from '$lib/api/projects';
import { sharingRename } from '$lib/api/sharing';
import { currentProject } from '$lib/editor/references.svelte';
import { t } from '$lib/i18n';
import { projects } from '$lib/state/projects.svelte';
import type { MapMode } from '$lib/state/router.svelte';
import { confirm } from '$lib/ui/confirm.svelte';
import type { MenuItem } from '$lib/ui/menu.svelte';
import { describeError, notify, notifyError, notifyOk } from '$lib/ui/toast.svelte';
import { makeFromOrg, ORG_ENDING, writeOrgFolder } from './org-file';
import { ENDING, fileName, given, makeFromFile, writeProjectFile } from './project-file';

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

/** The works of a project file that something is to be chosen for, while it is asked. */
export interface Asking {
  /** The name the project will have. */
  name: string;
  works: FoundWork[];
  /** What is chosen for each that is asked about, by its id in the file. */
  choices: Record<string, FileChoice>;
  /** Gives the choices, or nothing to make nothing. */
  resolve: (choices: Record<string, FileChoice> | null) => void;
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
  /** The works of a project file being opened, while what to do with them is asked. */
  asking = $state<Asking | null>(null);
  /** Whether a project file is being written or read. */
  filing = $state(false);
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
   * Saves a project as one file, where the user says (ADR 0036). The
   * project that is open (`here`) is written to disk first.
   */
  async saveAsFile(p: ProjectInfo, here = false) {
    const path = await save({
      title: t('home-file-save-title'),
      defaultPath: fileName(p.name),
      filters: [{ name: t('home-file-filter'), extensions: [ENDING] }],
    });
    if (!path) return;
    // Not every system adds the ending to a name written without it.
    const target = path.toLowerCase().endsWith(`.${ENDING}`) ? path : `${path}.${ENDING}`;
    this.filing = true;
    try {
      const open = here ? currentProject() : null;
      await writeProjectFile(p, target, open ? () => open.flush() : undefined);
      notifyOk(t('home-file-saved', { name: p.name }));
    } catch (error) {
      notifyError(t('home-file-save-failed'), error);
    } finally {
      this.filing = false;
    }
  }

  /**
   * Saves a project as Org into a folder the user chooses (ADR 0041): its
   * Org form, the works it cites and its pictures. The project that is
   * open (`here`) is written to disk first.
   */
  async saveAsOrg(p: ProjectInfo, here = false) {
    const path = await chooseFile({
      title: t('home-org-save-title'),
      directory: true,
      multiple: false,
    });
    if (typeof path !== 'string') return;
    this.filing = true;
    try {
      const open = here ? currentProject() : null;
      await writeOrgFolder(p, path, open ? () => open.flush() : undefined);
      notifyOk(t('home-org-saved', { name: p.name }));
    } catch (error) {
      notifyError(t('home-org-save-failed'), error);
    } finally {
      this.filing = false;
    }
  }

  /** Makes a new project of a project file the user chooses, and opens it. */
  async openFile() {
    if (this.filing) return;
    const path = await chooseFile({
      title: t('home-file-open-title'),
      multiple: false,
      filters: [{ name: t('home-file-filter'), extensions: [ENDING] }],
    });
    if (typeof path !== 'string') return;
    await this.makeOf(path, makeFromFile, t('home-file-open-failed'));
  }

  /** Makes a new project of an Org file the user chooses, and opens it. */
  async openOrg() {
    if (this.filing) return;
    const path = await chooseFile({
      title: t('home-org-open-title'),
      multiple: false,
      filters: [{ name: t('home-org-filter'), extensions: [ORG_ENDING] }],
    });
    if (typeof path !== 'string') return;
    await this.openOrgAt(path);
  }

  /** Makes a new project of the Org file, or the folder that holds one, at `path`, and opens it. */
  openOrgAt(path: string): Promise<void> {
    return this.makeOf(path, makeFromOrg, t('home-org-open-failed'));
  }

  /**
   * Makes a new project of the file at `path` by `maker`, asking what is
   * to be done with its works where something is to be chosen, and opens it.
   */
  async makeOf(path: string, maker: typeof makeFromFile, failed: string) {
    if (this.filing) return;
    this.filing = true;
    try {
      const made = await maker(
        path,
        (name, works) =>
          new Promise((resolve) => {
            const choices: Record<string, FileChoice> = {};
            for (const w of works) {
              const choice = given(w.finding);
              if (choice) choices[w.id] = choice;
            }
            this.asking = { name, works, choices, resolve };
          }),
      );
      if (!made) return;
      const name = made.info.name;
      notifyOk(
        made.added
          ? t('home-file-opened-added', { name, count: made.added })
          : t('home-file-opened', { name }),
      );
      if (made.problems.length)
        notify(t('home-file-problems', { count: made.problems.length }), made.problems.join('\n'));
      this.open(made.info);
    } catch (error) {
      notifyError(failed, error);
    } finally {
      this.asking = null;
      this.filing = false;
    }
  }

  /** Answers what was asked of the works of a project file: the choices, or nothing to make nothing. */
  answer(choices: Record<string, FileChoice> | null) {
    const asking = this.asking;
    this.asking = null;
    asking?.resolve(choices);
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
      {
        label: t('home-menu-save-file'),
        icon: FileDown,
        disabled: this.filing,
        action: () => void this.saveAsFile(p, here),
      },
      {
        label: t('home-menu-save-org'),
        icon: FolderDown,
        disabled: this.filing,
        action: () => void this.saveAsOrg(p, here),
      },
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
