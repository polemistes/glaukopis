/** The files of the library and their folders (ADR 0043). Mirrors `commands/files.rs`. */

import { listen } from '@tauri-apps/api/event';
import { call, inTauri } from './backend';
import type { Candidate, Match, Summary } from './library';
import type { Picture } from './pictures';

/** What can be done with a file, by the ending of its name. */
export type FileKind = 'pdf' | 'picture' | 'document' | 'other';

/** A folder of the files of the library. It may lie in another. */
export interface FileFolder {
  id: string;
  name: string;
  parent?: string;
  /** Sorts among its siblings as a string. */
  order: string;
}

/** A file of the library, with what is known of it and the references it belongs to. */
export interface FileView {
  /** The SHA-256 of what it holds: the name the store keeps it by. */
  hash: string;
  /** Where it is in the store, as the references name it. */
  path: string;
  /** What it is called in the lists. */
  name: string;
  kind: FileKind;
  size: number;
  exists: boolean;
  /** The folder it stands in; none at the top. */
  folder: string | null;
  /** The path it was copied from, where that is known. */
  origin: string | null;
  added: string;
  /** The references it belongs to; none for a file that is unassigned. */
  references: Summary[];
}

export interface FilesListing {
  folders: FileFolder[];
  files: FileView[];
}

/** What came of taking files in. */
export interface TakenIn {
  /** The files new to the library. */
  files: FileView[];
  /** Those it had already, left where they were. */
  same: FileView[];
  /** How many folders were made. */
  folders: number;
  problems: string[];
}

export interface FilesProgress {
  done: number;
  total: number;
  /** The file at hand. */
  name: string;
}

/** What the name of a file says of the work in it: `Nagy 1979 - The Best of the Achaeans`. */
export interface Named {
  /** The family names of the authors, as the name writes them. */
  families: string[];
  year: number | null;
  /** Empty where the name says only who wrote it and when. */
  title: string;
}

/**
 * What a file of the library may be, for the going-through to decide.
 * Found by what the file says of itself (an identifier, its metadata), by
 * what the services say of that identifier, by its name and by its first
 * page; the reasons of each match say which (`reasonWords`).
 */
export interface Proposal {
  hash: string;
  /** What the file is called in the lists. */
  name: string;
  /**
   * Works of the library it may belong to, the most certain first, at most
   * five. Certain where an identifier agrees or the work has the file
   * already; probable where the title and authors are alike, or where only
   * the name (`'name'`) or the first page (`'first-page'`) says so.
   * `gains` may be left unshown.
   */
  matches: Match[];
  /**
   * A new reference that the services describe, where the identifier
   * printed in the file is not in the library; only where no match is
   * certain. Its `draft` fills the form; its `files` name the file in the
   * store as it was when found out.
   */
  lookup: Candidate | null;
  /** What the name says, for filling in a new reference where there is no lookup. */
  named: Named | null;
  /** What was said in finding out: a number the services do not know, a service that failed, a file that could not be read. */
  notes: string[];
}

export const filesList = () => call<FilesListing>('files_list');

export const filesFolderCreate = (name: string, parent: string | null) =>
  call<FileFolder>('files_folder_create', { name, parent });
export const filesFolderRename = (id: string, name: string) =>
  call<FileFolder>('files_folder_rename', { id, name });
/** Refused where the folder would lie under itself. */
export const filesFolderMove = (id: string, parent: string | null) =>
  call<FileFolder>('files_folder_move', { id, parent });
/**
 * Deletes a folder. With `withFolders` the folders under it go too, else they
 * move up to where it was; with `withFiles` the files in the folders that go
 * are removed from the library, else they are put where it was. Returns how
 * many files were removed.
 */
export const filesFolderDelete = (id: string, withFolders: boolean, withFiles: boolean) =>
  call<number>('files_folder_delete', { id, withFolders, withFiles });

export const fileMove = (hash: string, folder: string | null) =>
  call<FileView>('file_move', { hash, folder });
/** What the file is called in the lists. */
export const fileRename = (hash: string, name: string) =>
  call<FileView>('file_rename', { hash, name });
/** Removes the file from every reference that has it, and from the store. */
export const fileRemove = (hash: string) => call<void>('file_remove', { hash });
/** The folders that removing these files would leave empty; not those empty before. */
export const filesLeftEmpty = (hashes: string[]) => call<string[]>('files_left_empty', { hashes });
/** Removes many files at once; with `folders`, the folders this leaves empty too. */
export const filesRemove = (hashes: string[], folders: boolean) =>
  call<{ files: number; folders: number }>('files_remove', { hashes, folders });
export const filesMove = (hashes: string[], folder: string | null) =>
  call<void>('files_move', { hashes, folder });
/** Gives many files each to its reference; what could not be given, a line each. */
export const filesAssign = (pairs: { hash: string; id: string }[]) =>
  call<string[]>('files_assign', { pairs });
/** Takes many files each from its reference; the files stay in the library. */
export const filesUnassign = (pairs: { hash: string; id: string }[]) =>
  call<void>('files_unassign', { pairs });
export const fileAssign = (hash: string, id: string) => call<FileView>('file_assign', { hash, id });
export const fileUnassign = (hash: string, id: string) =>
  call<FileView>('file_unassign', { hash, id });
/** Where the file is on this computer. */
export const filePath = (hash: string) => call<string>('file_path', { hash });

/** Takes files and folders in, into `folder`; a folder with its folders where `structure` is asked for. */
export const filesTakeIn = (
  paths: string[],
  folder: string | null,
  structure = true,
  ticket?: string,
) => call<TakenIn>('files_take_in', { paths, folder, structure, ticket });
/**
 * Finds out what the files with these hashes may be, in their order; hashes
 * the library does not know are left out. `ask`: whether the services are
 * asked of the identifiers printed in PDFs. With a ticket, the progress
 * comes as `onFilesProgress`, and `filesStop` stops it: what was found out
 * before is given, and the files not finished are left out.
 */
export const filesIdentify = (hashes: string[], ask = true, ticket?: string) =>
  call<Proposal[]>('files_identify', { hashes, ask, ticket });
/** Stops the work on files with this ticket: taking in, finding out, exporting. */
export const filesStop = (ticket: string) => call<void>('files_stop', { ticket });

/** Takes a picture that is a file of the library into the store of pictures. */
export const fileToPicture = (hash: string) => call<Picture>('file_to_picture', { hash });
/** Takes a picture of the store into the files, and gives it to a reference where one is named. */
export const pictureToFile = (hash: string, id: string | null, folder: string | null = null) =>
  call<FileView>('picture_to_file', { hash, id, folder });

/** Listens to how far the work on files with a ticket has come. Gives what ends the listening. */
export async function onFilesProgress(
  ticket: string,
  told: (progress: FilesProgress) => void,
): Promise<() => void> {
  if (!inTauri) return () => {};
  return listen<FilesProgress & { ticket: string }>('files-progress', (event) => {
    if (event.payload.ticket === ticket) told(event.payload);
  });
}

// ---- export ----

/**
 * What is exported: every file, the folders from the top each a folder on
 * disk; the files of a folder directly in the folder exported into, the
 * folders under it as folders on disk; or chosen files, directly in it.
 */
export type ExportSelection =
  { kind: 'all' } | { kind: 'folder'; id: string } | { kind: 'files'; hashes: string[] };

/** What came of an export. */
export interface Exported {
  /** How many files were written. */
  files: number;
  /** How many there were to write: more than were written where it was stopped, or where some could not be. */
  total: number;
  /** How many folders were written, those with nothing in them among them. */
  folders: number;
  /** The full path of the `references.bib` written, where one was asked for. */
  bib: string | null;
  /** Whether it was stopped before every file was written. What was written stays. */
  stopped: boolean;
  /** What could not be written, one sentence each. */
  problems: string[];
}

/**
 * Writes the files of the selection into the folder `into` (a full path,
 * made where it is not): the folders of the store as folders on disk, every
 * file named by its first reference, `Nagy 1979 - The Best of the
 * Achaeans.pdf`, a second file of one work by that and its own name after a
 * dash, a file with no reference by its own name. Nothing on disk is
 * overwritten: a name that is taken is numbered, `… (2).pdf`. With
 * `withBib`, a `references.bib` of the works is put beside them, naming the
 * files by paths relative to `into`. With a `ticket`, how far it has come
 * is told through `onFilesProgress`, and `filesStop` stops it between files.
 */
export const filesExport = (
  selection: ExportSelection,
  into: string,
  withBib = false,
  ticket?: string,
) => call<Exported>('files_export', { selection, into, withBib, ticket });
