/** The list of projects, and opening one. */

import {
  folderCreate,
  folderDelete,
  folderMove,
  folderRename,
  foldersList,
  projectAppend,
  projectCreate,
  projectDelete,
  projectDuplicate,
  projectList,
  projectLoad,
  projectMoveToFolder,
  projectRename,
  projectSaveState,
  projectsShown,
  type Folder,
  type ProjectInfo,
  type ProjectsShown,
} from '$lib/api/projects';
import { t } from '$lib/i18n';
import { Project, type Persistence, type Summary } from '$lib/project/model/project.svelte';
import { notifyError } from '$lib/ui/toast.svelte';

class ProjectsState {
  list = $state.raw<ProjectInfo[]>([]);
  /** The folders the projects are put in on this computer (ADR 0031). */
  folders = $state.raw<Folder[]>([]);
  /** Which form the page of projects shows. */
  shown = $state<ProjectsShown>('recent');
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
      const [list, folders, shown] = await Promise.all([
        projectList(),
        foldersList(),
        projectsShown(),
      ]);
      this.list = list;
      this.folders = folders;
      this.shown = shown === 'list' ? 'list' : 'recent';
    } catch (error) {
      notifyError(t('project-list-unreadable'), error);
    }
    this.loaded = true;
  }

  /** Shows the other form of the page, and remembers it. Failing to remember it is no matter. */
  show(kind: ProjectsShown) {
    this.shown = kind;
    projectsShown(kind).catch(() => {});
  }

  async create(name: string): Promise<ProjectInfo> {
    const info = await projectCreate(name);
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

  async remove(id: string) {
    await projectDelete(id);
    this.list = this.list.filter((p) => p.id !== id);
  }

  put(info: ProjectInfo) {
    this.list = this.list.some((p) => p.id === info.id)
      ? this.list.map((p) => (p.id === info.id ? info : p))
      : [info, ...this.list];
  }

  // ---- folders ----

  folder(id: string | null | undefined): Folder | undefined {
    return id ? this.folders.find((f) => f.id === id) : undefined;
  }

  async createFolder(name: string, parent: string | null): Promise<Folder> {
    const folder = await folderCreate(name, parent);
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
  };
  const project = new Project(persistence);
  project.load(loaded.state, loaded.updates);
  if (!project.maps.length) {
    // A new project begins with one map, named after it. One that was joined
    // and has not been fetched is left empty: what it holds is on its way.
    if (!loaded.info.sharing) {
      project.setName(loaded.info.name);
      project.createMap(loaded.info.name);
      project.undoManager.clear();
    }
  } else if (!project.name) {
    project.setName(loaded.info.name);
    project.undoManager.clear();
  }
  return { info: loaded.info, project };
}
