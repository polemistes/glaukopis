/** Projects on disk. Mirrors `src-tauri/src/commands/projects.rs`. */

import { call } from './backend';

export interface MapInfo {
  id: string;
  name: string;
  elements: number;
}

/** How a project is shared. What admits this copy to the server is not told to the interface. */
export interface Sharing {
  server: string;
  room: string;
  owner: boolean;
  /** Who this copy is among the collaborators. Not there for the owner. */
  member?: string;
}

export interface ProjectInfo {
  id: string;
  name: string;
  description: string;
  created: string;
  modified: string;
  maps: MapInfo[];
  words: number;
  references: number;
  sharing?: Sharing;
  view?: unknown;
}

export interface ProjectSummary {
  name?: string;
  maps: MapInfo[];
  words: number;
  references: number;
}

export interface LoadedProject {
  info: ProjectInfo;
  state: string | null;
  updates: string[];
}

export interface HistoryEntry {
  id: string;
  time: string;
  size: number;
}

export interface Trashed {
  entry: string;
  info: ProjectInfo;
}

export const projectList = () => call<ProjectInfo[]>('project_list');
export const projectCreate = (name: string, id?: string) =>
  call<ProjectInfo>('project_create', { name, id: id ?? null });
export const projectRename = (id: string, name: string) =>
  call<ProjectInfo>('project_rename', { id, name });
export const projectDescribe = (id: string, description: string) =>
  call<ProjectInfo>('project_describe', { id, description });
export const projectDelete = (id: string) => call<void>('project_delete', { id });
export const projectTrash = () => call<Trashed[]>('project_trash');
export const projectRestore = (entry: string) => call<ProjectInfo>('project_restore', { entry });
export const projectPurge = (entry: string) => call<void>('project_purge', { entry });
export const projectCopyFromHistory = (id: string, entry: string, name: string) =>
  call<ProjectInfo>('project_copy_from_history', { id, entry, name });
export const projectDuplicate = (id: string, name: string) =>
  call<ProjectInfo>('project_duplicate', { id, name });
export const projectLoad = (id: string) => call<LoadedProject>('project_load', { id });
export const projectAppend = (id: string, update: string) =>
  call<void>('project_append', { id, update });
export const projectSaveState = (id: string, document: string, summary: ProjectSummary | null) =>
  call<ProjectInfo>('project_save_state', { id, document, summary });
export const projectSaveView = (id: string, view: unknown) =>
  call<void>('project_save_view', { id, view });
export const projectHistory = (id: string) => call<HistoryEntry[]>('project_history', { id });
export const projectHistoryState = (id: string, entry: string) =>
  call<string>('project_history_state', { id, entry });
