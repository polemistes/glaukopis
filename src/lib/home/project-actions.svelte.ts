/**
 * What is done with a project from the list of projects, the same on the
 * home page and in the pane of projects (ADR 0033): its menu, and the
 * dialog that asks for a name, for a new project, a renamed one, a copy, a
 * new folder or a renamed one. Each place has its own, shown by
 * `ProjectActionsHost.svelte`; what opens a project is the place's.
 */

import { open as chooseFile, save } from '@tauri-apps/plugin-dialog';
import ChevronRight from '@lucide/svelte/icons/chevron-right';
import Columns2 from '@lucide/svelte/icons/columns-2';
import Copy from '@lucide/svelte/icons/copy';
import FileDown from '@lucide/svelte/icons/file-down';
import FilePlus from '@lucide/svelte/icons/file-plus';
import FolderDown from '@lucide/svelte/icons/folder-down';
import FolderInput from '@lucide/svelte/icons/folder-input';
import FolderOutput from '@lucide/svelte/icons/folder-output';
import FolderPlus from '@lucide/svelte/icons/folder-plus';
import History from '@lucide/svelte/icons/history';
import Minimize2 from '@lucide/svelte/icons/minimize-2';
import Pencil from '@lucide/svelte/icons/pencil';
import Trash2 from '@lucide/svelte/icons/trash-2';
import type { FileChoice, Folder, FoundWork, ProjectInfo } from '$lib/api/projects';
import { currentProject } from '$lib/editor/references.svelte';
import { t } from '$lib/i18n';
import { keysFor } from '$lib/shell/keys.svelte';
import { projects } from '$lib/state/projects.svelte';
import { settings } from '$lib/state/settings.svelte';
import type { MapMode } from '$lib/state/router.svelte';
import type { MenuItem } from '$lib/ui/menu.svelte';
import { describeError, notify, notifyError, notifyOk } from '$lib/ui/toast.svelte';
import {
  copyProject,
  deleteThings,
  makeFolder,
  makeProject,
  moveThings,
  renameFolder,
  renameProject,
} from './changes';
import { folderOf, folderTree, foldersOpenTo } from './folders';
import { makeFromOrg, ORG_ENDING, writeOrgFolder } from './org-file';
import { ENDING, fileName, given, makeFromFile, writeProjectFile } from './project-file';

/** What a name is asked for. */
export type Purpose = 'new' | 'rename' | 'copy' | 'folder' | 'folder-rename';

export interface Naming {
  purpose: Purpose;
  project?: ProjectInfo;
  folder?: Folder;
  /** The folder a new folder or project is made in. */
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

/** Whether a thing's tree or contents are folded where it is shown, and the toggle. */
export interface Folding {
  folded: boolean;
  toggle: () => void;
}

/** Where a project's menu is shown, and what that place adds to it. */
export interface ProjectPlace {
  /** The project that is open, if any: it is not entered, renamed or deleted from here; the others are entered beside it. */
  current?: string | null;
  /** Shows a project beside the open one. Given only where a project is open. */
  beside?: (project: string) => void;
  /** Where the place shows the project's map under it: whether it is folded, and the toggle. */
  fold?: Folding;
  /** Where the place renames in place; else the dialog asks. */
  rename?: () => void;
}

/** Where a folder's menu is shown, and what that place adds to it. */
export interface FolderPlace {
  enter: () => void;
  /** The folder is the one in view, which is not entered again. */
  here?: boolean;
  fold?: Folding;
  /** Where new things are named in place, the maker; else the dialog asks. */
  make?: (kind: 'project' | 'folder') => void;
  /** Where the place renames in place; else the dialog asks. */
  rename?: () => void;
}

/** Where the menu of an element of a project's map is shown. */
export interface ElementPlace {
  enter: () => void;
  beside?: () => void;
  fold?: Folding;
}

/** Fold or unfold, as one item, where the place folds. */
function foldItem(fold: Folding | undefined): MenuItem[] {
  if (!fold) return [];
  return [
    {
      label: fold.folded ? t('home-unfold') : t('home-fold'),
      icon: ChevronRight,
      shortcut: keysFor('tree-fold'),
      action: fold.toggle,
    },
  ];
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

  /** Asks the name of a new project, to be made in the folder given or in none. */
  newProject(parent: string | null = null) {
    this.naming = { purpose: 'new', parent, value: '', error: null };
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
        const made = await makeProject(name, naming.parent ?? null);
        this.naming = null;
        // The first time, in the view the settings say: its diagram, or its text.
        this.open(made, settings.value.newProjectView ?? 'diagram');
      } else if (naming.purpose === 'folder') {
        await makeFolder(name, naming.parent ?? null);
        this.naming = null;
      } else if (naming.purpose === 'folder-rename' && naming.folder) {
        await renameFolder(naming.folder, name);
        this.naming = null;
      } else if (naming.purpose === 'rename' && naming.project) {
        await renameProject(naming.project, name);
        this.naming = null;
      } else if (naming.purpose === 'copy' && naming.project) {
        await copyProject(naming.project, name);
        this.naming = null;
      }
    } catch (error) {
      if (this.naming) this.naming.error = describeError(error) ?? t('home-failed');
    } finally {
      this.busy = false;
    }
  }

  /** Moves a project to the trash, when that is confirmed; it can be undone. */
  async remove(p: ProjectInfo) {
    if (await deleteThings({ projects: [p.id], folders: [] })) this.#place.deleted?.();
  }

  /** Deletes a folder, when that is confirmed: what is in it moves up. It can be undone. */
  async removeFolder(f: Folder) {
    await deleteThings({ projects: [], folders: [f.id] });
  }

  /** The folders something may be moved into, as a menu: each under the one it lies in. */
  #intoFolders(open: Folder[], current: string | null, move: (folder: string) => void): MenuItem[] {
    const ids = new Set(open.map((f) => f.id));
    return folderTree(projects.folders)
      .filter((x) => ids.has(x.folder.id))
      .map((x) => ({
        label: x.folder.name,
        depth: x.depth,
        checked: x.folder.id === current,
        disabled: x.folder.id === current,
        action: () => move(x.folder.id),
      }));
  }

  /** Moving a project into a folder or out of all, as items of its menu. */
  moveItems(p: ProjectInfo): MenuItem[] {
    const folder = folderOf(projects.folders, p);
    const move = (into: string | null) => void moveThings({ projects: [p.id], folders: [] }, into);
    const into = this.#intoFolders(projects.folders, folder, move);
    return [
      {
        kind: 'submenu',
        label: t('home-menu-move'),
        icon: FolderInput,
        items: into,
        disabled: !into.length,
      },
      ...(folder
        ? [{ label: t('home-menu-out'), icon: FolderOutput, action: () => move(null) } as MenuItem]
        : []),
    ];
  }

  /**
   * The menu of a folder, the same wherever folders are shown: enter it,
   * fold it, make in it, rename it, move it, delete it. Where the place
   * names new things in place, `make` does it; else the dialog asks.
   */
  folderItems(f: Folder, place: FolderPlace): MenuItem[] {
    const parent = f.parent ?? null;
    const move = (into: string | null) => void moveThings({ projects: [], folders: [f.id] }, into);
    const into = this.#intoFolders(foldersOpenTo(projects.folders, f.id), parent, move);
    const make = place.make;
    return [
      {
        label: t('home-enter'),
        icon: Minimize2,
        shortcut: keysFor('tree-enter'),
        disabled: !!place.here,
        action: place.enter,
      },
      ...foldItem(place.fold),
      { kind: 'separator' },
      {
        label: t('home-owl-new-project'),
        icon: FilePlus,
        shortcut: make ? keysFor('tree-new') : undefined,
        action: () => (make ? make('project') : this.newProject(f.id)),
      },
      {
        label: t('home-owl-new-folder'),
        icon: FolderPlus,
        shortcut: make ? keysFor('tree-new-under') : undefined,
        action: () => (make ? make('folder') : this.newFolder(f.id)),
      },
      {
        label: t('common-rename'),
        icon: Pencil,
        shortcut: keysFor('tree-rename'),
        action: () => (place.rename ? place.rename() : this.renameFolder(f)),
      },
      { kind: 'separator' },
      {
        kind: 'submenu',
        label: t('home-menu-move'),
        icon: FolderInput,
        items: into,
        disabled: !into.length,
      },
      ...(parent
        ? [{ label: t('home-menu-out'), icon: FolderOutput, action: () => move(null) } as MenuItem]
        : []),
      { kind: 'separator' },
      {
        label: t('home-folder-delete-confirm'),
        icon: Trash2,
        danger: true,
        action: () => void this.removeFolder(f),
      },
    ];
  }

  /** The menu of an element of a project's map, shown on the map of all projects or in the list: enter it, beside, fold it. */
  elementItems(place: ElementPlace): MenuItem[] {
    return [
      {
        label: t('home-enter'),
        icon: Minimize2,
        shortcut: keysFor('tree-enter'),
        action: place.enter,
      },
      ...(place.beside
        ? [{ label: t('home-open-beside'), icon: Columns2, action: place.beside } as MenuItem]
        : []),
      ...foldItem(place.fold),
    ];
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
   * The menu of a project, the same wherever projects are shown: enter it,
   * beside the one that is open, fold its map; rename, copy, its history,
   * save it; move it among the folders; delete it. The project that is open
   * (`place.current`) is neither entered, renamed nor deleted from here:
   * what is written in it goes to its folder on disk.
   */
  items(p: ProjectInfo, place: ProjectPlace = {}): MenuItem[] {
    const here = !!place.current && place.current === p.id;
    const beside = place.beside;
    return [
      {
        label: t('home-enter'),
        icon: Minimize2,
        shortcut: keysFor('tree-enter'),
        hint: here ? t('home-open-now') : undefined,
        disabled: here,
        action: () => this.open(p),
      },
      ...(beside && place.current && !here
        ? [
            {
              label: t('home-open-beside'),
              icon: Columns2,
              action: () => beside(p.id),
            } as MenuItem,
          ]
        : []),
      ...foldItem(place.fold),
      { kind: 'separator' },
      {
        label: t('home-menu-rename'),
        icon: Pencil,
        hint: here ? t('home-open-now') : undefined,
        disabled: here,
        action: () => (place.rename ? place.rename() : this.rename(p)),
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
      ...this.moveItems(p),
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
