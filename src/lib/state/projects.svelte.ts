/** The list of projects, and opening one. */

import {
  projectAppend,
  projectCreate,
  projectDelete,
  projectDuplicate,
  projectList,
  projectLoad,
  projectRename,
  projectSaveState,
  type ProjectInfo,
} from '$lib/api/projects';
import { Project, type Persistence, type Summary } from '$lib/project/model/project.svelte';
import { notifyError } from '$lib/ui/toast.svelte';
import { fromBase64, toBase64 } from '$lib/util/base64';

class ProjectsState {
  list = $state.raw<ProjectInfo[]>([]);
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
      this.list = await projectList();
    } catch (error) {
      notifyError('The projects could not be read', error);
    }
    this.loaded = true;
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
    append: (update: Uint8Array) => projectAppend(id, toBase64(update)),
    saveState: async (state: Uint8Array, summary: Summary) => {
      const info = await projectSaveState(id, toBase64(state), summary);
      projects.put(info);
    },
  };
  const project = new Project(persistence);
  project.load(loaded.state ? fromBase64(loaded.state) : null, loaded.updates.map(fromBase64));
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
