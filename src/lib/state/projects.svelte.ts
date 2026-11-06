/** The list of projects, and opening one. */

import {
  folderCreate,
  folderDelete,
  folderMove,
  folderRename,
  foldersList,
  favouriteSet,
  favouritesList,
  onProjectUpdate,
  projectAppend,
  projectCreate,
  projectRestore,
  projectDelete,
  projectDuplicate,
  projectList,
  projectLoad,
  projectMoveToFolder,
  projectReadableWrite,
  projectRename,
  projectSaveState,
  type Folder,
  type ProjectInfo,
} from '$lib/api/projects';
import { t } from '$lib/i18n';
import { Project, type Persistence, type Summary } from '$lib/project/model/project.svelte';
import { notifyError } from '$lib/ui/toast.svelte';
import { authorOf, settings } from './settings.svelte';

class ProjectsState {
  list = $state.raw<ProjectInfo[]>([]);
  /** The folders the projects are put in on this computer (ADR 0031). */
  folders = $state.raw<Folder[]>([]);
  /** The favourite projects, by id, in the order they were made favourites (ADR 0086). */
  favourites = $state.raw<string[]>([]);
  loaded = $state(false);
  /** The project that was opened last while the application has run. */
  lastOpened = $state<string | null>(null);
  /** Projects that are being closed, until what was written in them is on disk. */
  #closing = new Map<string, Promise<unknown>>();

  /** A project is being closed: what reads it from disk waits for this. */
  closing(id: string, done: Promise<unknown>) {
    const settled = done.catch(() => {});
    this.#closing.set(id, settled);
    void settled.then(() => {
      if (this.#closing.get(id) === settled) this.#closing.delete(id);
    });
  }

  /** When a project that is being closed is on disk; at once, for one that is not. */
  async closed(id: string): Promise<void> {
    await this.#closing.get(id);
  }

  async load() {
    try {
      const [list, folders, favourites] = await Promise.all([
        projectList(),
        foldersList(),
        favouritesList(),
      ]);
      this.list = list;
      this.folders = folders;
      this.favourites = favourites;
    } catch (error) {
      notifyError(t('project-list-unreadable'), error);
    }
    this.loaded = true;
  }

  /** Makes a project, in the folder given or in none. */
  async create(name: string, folder: string | null = null): Promise<ProjectInfo> {
    const info = await projectCreate(name, undefined, folder);
    this.list = [info, ...this.list];
    return info;
  }

  async rename(id: string, name: string) {
    const info = await projectRename(id, name);
    this.list = this.list.map((p) => (p.id === id ? info : p));
  }

  async duplicate(id: string, name: string): Promise<ProjectInfo> {
    const info = await projectDuplicate(id, name);
    this.list = [info, ...this.list];
    return info;
  }

  /** Counts the times a project went into the trash or came out of it: what shows the trash reads it again. */
  trashed = $state(0);

  async remove(id: string) {
    await projectDelete(id);
    this.list = this.list.filter((p) => p.id !== id);
    // The core takes a deleted project off the favourites; brought back, it is not one again.
    this.favourites = this.favourites.filter((f) => f !== id);
    this.trashed++;
  }

  /** Brings a project back from the trash, by its entry there. */
  async restore(entry: string): Promise<ProjectInfo> {
    const info = await projectRestore(entry);
    this.put(info);
    this.trashed++;
    return info;
  }

  put(info: ProjectInfo) {
    this.list = this.list.some((p) => p.id === info.id)
      ? this.list.map((p) => (p.id === info.id ? info : p))
      : [info, ...this.list];
  }

  // ---- favourites ----

  isFavourite(id: string): boolean {
    return this.favourites.includes(id);
  }

  async setFavourite(id: string, on: boolean) {
    this.favourites = await favouriteSet(id, on);
  }

  // ---- folders ----

  folder(id: string | null | undefined): Folder | undefined {
    return id ? this.folders.find((f) => f.id === id) : undefined;
  }

  async createFolder(name: string, parent: string | null, id?: string): Promise<Folder> {
    const folder = await folderCreate(name, parent, id);
    this.folders = [...this.folders, folder];
    return folder;
  }

  async renameFolder(id: string, name: string) {
    const folder = await folderRename(id, name);
    this.folders = this.folders.map((f) => (f.id === id ? folder : f));
  }

  async moveFolder(id: string, parent: string | null) {
    const folder = await folderMove(id, parent);
    this.folders = this.folders.map((f) => (f.id === id ? folder : f));
  }

  /** What was in the folder moves up to where it was: the projects are read again to see where. */
  async deleteFolder(id: string) {
    await folderDelete(id);
    const [list, folders] = await Promise.all([projectList(), foldersList()]);
    this.list = list;
    this.folders = folders;
  }

  async moveToFolder(id: string, folder: string | null) {
    this.put(await projectMoveToFolder(id, folder));
  }
}

export const projects = new ProjectsState();

export interface OpenProject {
  info: ProjectInfo;
  project: Project;
}

/** How many of the projects last opened are remembered. */
const REMEMBERED = 20;

/** A project was opened in a side of the window: the start screen shows it first among those last opened. */
export function rememberOpened(id: string) {
  const recent = settings.value.recentProjects ?? [];
  if (recent[0] !== id)
    settings.set('recentProjects', [id, ...recent.filter((x) => x !== id)].slice(0, REMEMBERED));
}

/** The projects open in this window, by id, that another window's changes are applied to. */
const openHere = new Map<string, Set<Project>>();
let listening: Promise<unknown> | null = null;

/**
 * Applies what another window wrote into a project to every copy of it open
 * in this window (ADR 0085); the closed are forgotten as they are met.
 */
export function fromAnotherWindow(id: string, update: Uint8Array) {
  const here = openHere.get(id);
  if (!here) return;
  for (const project of [...here]) {
    if (project.closed) here.delete(project);
    else project.applyFromWindow(update);
  }
  if (!here.size) openHere.delete(id);
}

/** Holds a project opened in this window, so that what other windows write into it comes to it. */
function heldOpen(id: string, project: Project) {
  for (const [key, set] of openHere) {
    for (const p of set) if (p.closed) set.delete(p);
    if (!set.size) openHere.delete(key);
  }
  openHere.set(id, (openHere.get(id) ?? new Set()).add(project));
  listening ??= onProjectUpdate(fromAnotherWindow).catch((error) =>
    console.warn('The changes of other windows are not heard', error),
  );
}

export async function openProject(id: string): Promise<OpenProject> {
  projects.lastOpened = id;
  const loaded = await projectLoad(id);
  const persistence: Persistence = {
    append: (update: Uint8Array, here: boolean, time: number) =>
      projectAppend(id, update, here, time),
    saveState: async (state: Uint8Array, summary: Summary, keep: boolean) => {
      const info = await projectSaveState(id, state, summary, keep);
      projects.put(info);
    },
    readable: (org, beside) => projectReadableWrite({ id }, beside, org),
  };
  const project = new Project(persistence);
  project.load(loaded.state, loaded.updates);
  heldOpen(id, project);
  // A new project begins with its own element, named after it, and one
  // written before is brought into one tree (ADR 0037). One that was joined
  // and has not been fetched is left empty: what it holds is on its way.
  if (!(loaded.info.sharing && project.nodes.size === 0)) {
    // A new project is the writer's own, as their details in the settings say.
    project.begin(loaded.info.name, authorOf(settings.value));
    project.undoManager.clear();
  }
  return { info: loaded.info, project };
}
