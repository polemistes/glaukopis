/** Projects on disk. Mirrors `src-tauri/src/commands/projects.rs`. */

import { call } from './backend';
import type { Certainty, Person, Reason, Reference, SummaryLite } from './library';

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
  /** The folder the project is in on this computer. Not there for one in no folder. */
  folder?: string;
  view?: unknown;
}

/** A folder of projects, on this computer alone (ADR 0031). It may lie in another. */
export interface Folder {
  id: string;
  name: string;
  parent?: string;
  /** Sorts among its siblings as a string. */
  order: string;
}

/**
 * The three forms of the page of projects: the last used, as cards; all of
 * them, as a list in folders; and all of them as a map around the owl.
 */
/** The forms of the page of projects; the owl map, once a third, is a place of its own. */
export type ProjectsShown = 'recent' | 'list';

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
/** Makes a project, in a folder where one is given. */
export const projectCreate = (name: string, id?: string, folder?: string | null) =>
  call<ProjectInfo>('project_create', { name, id: id ?? null, folder: folder ?? null });
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
export const foldersList = () => call<Folder[]>('folders_list');
/** Makes a folder; under the id given, where one is made again as it was. */
export const folderCreate = (name: string, parent: string | null, id?: string) =>
  call<Folder>('folder_create', { name, parent, id: id ?? null });
export const folderRename = (id: string, name: string) =>
  call<Folder>('folder_rename', { id, name });
/** Refused where the folder would lie under itself. */
export const folderMove = (id: string, parent: string | null) =>
  call<Folder>('folder_move', { id, parent });
/** What was in the folder moves up to where it was. */
export const folderDelete = (id: string) => call<void>('folder_delete', { id });
export const projectMoveToFolder = (id: string, folder: string | null) =>
  call<ProjectInfo>('project_move_to_folder', { id, folder });
/** With a kind, remembers which form of the page is shown; without, says which was remembered. */
export const projectsShown = (kind?: ProjectsShown) =>
  call<ProjectsShown>('projects_shown', { kind: kind ?? null });
export const projectHistory = (id: string) => call<HistoryEntry[]>('project_history', { id });
export const projectHistoryState = (id: string, entry: string) =>
  call<string>('project_history_state', { id, entry });

// ---- a project as one file (ADR 0036): see `commands/projectfile.rs` ----

/** What a project file says of itself. */
export interface ProjectFileManifest {
  format: number;
  name: string;
  description: string;
  /** When it was written. */
  written: string;
  /** By which version of the application. */
  app: string;
}

/** A project file as it was read: its pictures are in the store already. */
export interface ProjectFile {
  manifest: ProjectFileManifest;
  /** How many of its pictures the store did not have. */
  pictures: number;
  /** The document, as one state. */
  state: Uint8Array;
}

/** A work as the document keeps it: what of a `RefRecord` the core reads. */
export interface WorkRecord {
  id: string;
  key: string;
  type: string;
  fields: Record<string, string>;
  names: Record<string, Person[]>;
}

/** What a work of a project file is to the library. */
export type Finding =
  | { kind: 'same' }
  | { kind: 'differs'; library: SummaryLite }
  | { kind: 'new' }
  | {
      kind: 'alike';
      /** The library's entry. */
      id: string;
      library: SummaryLite;
      certainty: Certainty;
      reasons: Reason[];
      /** Whether the file's id is that of an entry merged into it. */
      merged: boolean;
      /** What the library's entry would gain from the file's. */
      gains: string[];
    };

export interface FoundWork {
  id: string;
  /** The work as the file has it. */
  file: SummaryLite;
  finding: Finding;
}

/**
 * What is done with a work that is asked about. Of one whose id the library
 * has, and that differs: the library's is kept, the file's taken in, or both
 * kept. Of one that is alike: the library's is cited, or the file's added.
 */
export type FileChoice = 'library' | 'file' | 'both' | 'cite' | 'another';

export interface SettledWork {
  /** Its id in the file. */
  from: string;
  /** The id it is cited by now. */
  to: string;
  /** The library's entry, as it is now. */
  reference: Reference | null;
}

export interface FileSettlement {
  settled: SettledWork[];
  added: string[];
  changed: string[];
  problems: string[];
}

export interface ProjectFileWriting {
  name: string;
  description: string;
  /** The pictures the figures show, by their hash. */
  pictures: string[];
  /** The works cited. */
  records: WorkRecord[];
}

/** Writes a project file of a document, at `path`. */
export const projectFileWrite = (path: string, writing: ProjectFileWriting, state: Uint8Array) =>
  call<void>('project_file_write', withHead({ path, ...writing }, state));

/**
 * Reads a project file, and takes its pictures into the store. It comes as
 * `project_file_read` writes it: what it says, in JSON, and the document,
 * each with its length before it (four bytes, least first).
 */
export async function projectFileRead(path: string): Promise<ProjectFile> {
  const bytes = new Uint8Array(await call<ArrayBuffer>('project_file_read', { path }));
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let at = 0;
  const part = () => {
    const n = view.getUint32(at, true);
    at += 4 + n;
    return bytes.subarray(at - n, at);
  };
  const head = JSON.parse(new TextDecoder().decode(part())) as {
    manifest: ProjectFileManifest;
    pictures: number;
  };
  return { ...head, state: part() };
}

/**
 * Writes the readable copy of a project (ADR 0041): its Org form, the works
 * it cites as BibLaTeX and the pictures it shows. Into the project's own
 * folder, by its id, or into a folder the writer chose.
 */
export const projectReadableWrite = (
  place: { id: string } | { path: string },
  readable: { pictures: string[]; records: ProjectFileWriting['records'] },
  org: string,
) =>
  call<void>(
    'project_readable_write',
    withHead({ ...place, ...readable }, new TextEncoder().encode(org)),
  );

/** An Org file read back, with the works beside it, each by its key, and how many pictures the store did not have. */
export interface ReadOrg {
  org: string;
  records: ProjectFileWriting['records'];
  pictures: number;
}

/** Reads an Org file, or the folder that holds `project.org`; its pictures are taken into the store. */
export const projectReadableRead = (path: string) =>
  call<ReadOrg>('project_readable_read', { path });

/** What each work a project file cites is to the library. */
export const projectFileReferences = (records: WorkRecord[]) =>
  call<FoundWork[]>('project_file_references', { records });

/** Brings the works into the library as was chosen; what is not chosen is as the core chooses. */
export const projectFileSettle = (records: WorkRecord[], choices: Record<string, FileChoice>) =>
  call<FileSettlement>('project_file_settle', { records, choices });
