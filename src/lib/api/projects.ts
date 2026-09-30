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
  /** The pictures the project uses, by the names the store keeps them by. */
  pictures?: string[];
  /**
   * The references the project cites, by their ids. Not there for a project
   * last saved before this was kept.
   */
  cited?: string[];
  sharing?: Sharing;
  view?: unknown;
}

export interface ProjectSummary {
  name?: string;
  maps: MapInfo[];
  words: number;
  references: number;
  pictures?: string[];
  cited?: string[];
}

export interface LoadedProject {
  info: ProjectInfo;
  state: Uint8Array | null;
  updates: Uint8Array[];
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
/**
 * A project as it is on disk. It comes as bytes, as `project_load` in
 * `commands/projects.rs` writes them: parts each with its length before it
 * (four bytes, least first), what is known of it in JSON, its state, which is
 * empty where there is none, and the number of changes and the changes.
 */
export async function projectLoad(id: string): Promise<LoadedProject> {
  const bytes = new Uint8Array(await call<ArrayBuffer>('project_load', { id }));
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let at = 0;
  const number = () => {
    const n = view.getUint32(at, true);
    at += 4;
    return n;
  };
  const part = () => {
    const n = number();
    at += n;
    return bytes.subarray(at - n, at);
  };
  const info = JSON.parse(new TextDecoder().decode(part())) as ProjectInfo;
  const state = part();
  const updates = Array.from({ length: number() }, part);
  return { info, state: state.length ? state : null, updates };
}

/** Bytes, with what they are said to be before them, as `with_head` in `commands/projects.rs` reads them. */
function withHead(head: Record<string, unknown>, bytes: Uint8Array): Uint8Array {
  const said = new TextEncoder().encode(JSON.stringify(head));
  const out = new Uint8Array(4 + said.length + bytes.length);
  new DataView(out.buffer).setUint32(0, said.length, true);
  out.set(said, 4);
  out.set(bytes, 4 + said.length);
  return out;
}

/** A batch of changes: made here or received from another, and when, in milliseconds since 1970. */
export const projectAppend = (id: string, update: Uint8Array, here = true, time?: number) =>
  call<void>('project_append', withHead({ id, here, time: time ?? null }, update));
/** With `keep`, where the project's full history is on, the log is kept in it. */
export const projectSaveState = (
  id: string,
  document: Uint8Array,
  summary: ProjectSummary | null,
  keep = false,
) => call<ProjectInfo>('project_save_state', withHead({ id, summary, keep }, document));
export const projectSaveView = (id: string, view: unknown) =>
  call<void>('project_save_view', { id, view });
export const projectHistory = (id: string) => call<HistoryEntry[]>('project_history', { id });
export const projectHistoryState = (id: string, entry: string) =>
  call<string>('project_history_state', { id, entry });
