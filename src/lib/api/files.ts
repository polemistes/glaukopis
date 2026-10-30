/** The files of the library and their folders (ADR 0043). Mirrors `commands/files.rs`. */

import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { t } from '$lib/i18n';
import { call, inTauri } from './backend';
import type { Count, Told } from './backend';
import type { Candidate, Match, Summary } from './library';

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
  /** Of an image, how large it is in its pixels, where that can be told: not of a drawing. */
  width: number | null;
  height: number | null;
  /** Of an image, what it shows, in words, for those who do not see it. */
  alt: string;
  /** Of a file made from another to be a figure, the hash of that one. */
  madeFrom: string | null;
  /** Of a PDF, the places marked in it, in the order they stand (ADR 0072). */
  bookmarks: Bookmark[];
  /** The references it belongs to; none for a file that is unassigned. */
  references: Summary[];
}

/** A place marked in a file: of the file, so the same from every project (ADR 0072). */
export interface Bookmark {
  id: string;
  /** Counted from one. */
  page: number;
  /** How far down the page the top of the view stood, from 0 at its top to 1 at its foot. */
  at: number;
  name: string;
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

/** How far the work on files has come: how many are done, of how many, and the file at hand. */
export type FilesProgress = Count;

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

/** What came of naming files by their references. */
export interface NamedFiles {
  /** The files whose names changed. */
  files: FileView[];
  /** How many of those asked kept their names: of no reference, or of one that gives no name. */
  kept: number;
}

/**
 * Names the files by their references, as export names them: `Nagy 1979 -
 * The Best of the Achaeans.pdf`, the ending kept, a second file of one work
 * with the same ending by that and its own name after a dash. A file of no
 * reference keeps its name; one named so already is left as it is, and is
 * not among the files given back. The files in the store keep their names.
 */
export const filesNameByReference = (hashes: string[]) =>
  call<NamedFiles>('files_name_by_reference', { hashes });
/** Removes the file from every reference that has it, and from the store. */
export const fileRemove = (hash: string) => call<void>('file_remove', { hash });
/** The folders that removing these files would leave empty; not those empty before. */
export const filesLeftEmpty = (hashes: string[]) => call<string[]>('files_left_empty', { hashes });
/** What came of removing many files: how many files, and how many folders. */
export interface FilesRemoved {
  files: number;
  folders: number;
}

/** Removes many files at once; with `folders`, the folders this leaves empty too. */
export const filesRemove = (hashes: string[], folders: boolean) =>
  call<FilesRemoved>('files_remove', { hashes, folders });
export const filesMove = (hashes: string[], folder: string | null) =>
  call<void>('files_move', { hashes, folder });
/** Gives many files each to its reference; what could not be given, a line each. */
export const filesAssign = (pairs: { hash: string; id: string }[]) =>
  call<string[]>('files_assign', { pairs });
/** Takes many files each from its reference; the files stay in the library. */
export const filesUnassign = (pairs: { hash: string; id: string }[]) =>
  call<void>('files_unassign', { pairs });
/** Keeps the bookmarks of a file, in the stead of those it had. */
export const fileBookmarksSet = (hash: string, bookmarks: Bookmark[]) =>
  call<FileView>('file_bookmarks_set', { hash, bookmarks });

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

// ---- images, as figures show them (ADR 0070) ----

/** An image that a project uses, as the project names it. */
export interface UsedPicture {
  hash: string;
  extension: string;
  name: string;
}

/** What came of bringing a shared project's images and the server's to be the same. */
export interface Synced {
  sent: number;
  fetched: number;
  problems: string[];
}

/** The thumbnail of a file: an image, or the first page of a PDF, made once and kept. */
export async function fileSmall(hash: string): Promise<ArrayBuffer> {
  if (!inTauri) throw { kind: 'no-backend', message: t('ui-no-backend') };
  return invoke<ArrayBuffer>('file_small', { hash });
}
/** Says what an image shows, in words. */
export const fileSetAlt = (hash: string, alt: string) =>
  call<FileView>('file_set_alt', { hash, alt });
/** The file a figure made of this image shows: itself, or a copy made beside it. */
export const fileForFigure = (hash: string) => call<FileView>('file_for_figure', { hash });

// ---- an image edited (ADR 0071) ----

/** A crop, in fractions of the frame that shows: the image after its turns and flips. */
export interface Crop {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * The settings of one editing of an image: quarter turns clockwise (0–3),
 * flips in the turned frame, a crop in the frame that shows, and the colours
 * in percent, 100 being the image as it is.
 */
export interface Edit {
  turns: number;
  flipX: boolean;
  flipY: boolean;
  crop: Crop | null;
  brightness: number;
  contrast: number;
  saturation: number;
}

/** What editing an image needs to know of it before it begins. */
export interface EditFacts {
  /** The full image's size, upright, in its pixels. */
  width: number;
  height: number;
  /** The ending what is kept will have: "jpg" or "png". */
  ending: string;
  /** Whether it has pixels to edit: not a drawing. */
  editable: boolean;
  /** Whether it is larger than an image may be, so that only a smaller copy can be edited. */
  tooLarge: boolean;
}

export const fileEditFacts = (hash: string) => call<EditFacts>('file_edit_facts', { hash });
/** The image to be shown while it is edited: upright, no larger than a side needs. */
export async function fileEditPreview(hash: string): Promise<ArrayBuffer> {
  if (!inTauri) throw { kind: 'no-backend', message: t('ui-no-backend') };
  return invoke<ArrayBuffer>('file_edit_preview', { hash });
}
/** Keeps the image edited as a new file of the library, made from the one edited. */
export const fileEditKeep = (hash: string, edit: Edit) =>
  call<FileView>('file_edit_keep', { hash, edit });
/** A smaller copy of an image too large to be edited, made from it. */
export const fileSmallerCopy = (hash: string) => call<FileView>('file_smaller_copy', { hash });
/** Takes in an image the page holds, pasted or dropped, into `folder` or the folder Images. `content` in base64. */
export const filesAddImage = (name: string, content: string, folder: string | null = null) =>
  call<FileView>('files_add_image', { name, content, folder });
/** Takes in an image that is a file on this computer, and gives the file a figure shows of it. */
export const filesTakeInForFigure = (path: string) =>
  call<FileView>('files_take_in_for_figure', { path });
/** For the shared project with this id: sends what the server lacks of `used`, fetches what is lacking here. */
export const filesSync = (id: string, used: UsedPicture[]) =>
  call<Synced>('files_sync', { id, used });

/** Listens to how far the work on files with a ticket has come. Gives what ends the listening. */
export async function onFilesProgress(
  ticket: string,
  told: (progress: FilesProgress) => void,
): Promise<() => void> {
  if (!inTauri) return () => {};
  return listen<Told<FilesProgress>>('files-progress', (event) => {
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
