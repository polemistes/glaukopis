/**
 * The window of a note (record 0109): the application in another role,
 * `glaukopis --note`, with one small window to write a note in. Mirrors
 * `src-tauri/src/commands/notewindow.rs`.
 */

import { call } from './backend';

/** A file a note holds: what it holds, as the store names it, and what it is called. */
export interface HeldFile {
  hash: string;
  name: string;
}

/**
 * The text of a note as the window hands it over: as the texts of the
 * notebook are written (ProseMirror's JSON of the body schema), its plain
 * words beside it, and the files it holds.
 */
export interface NoteText {
  doc: unknown;
  words: string;
  files: HeldFile[];
}

/** What the window begins with: the settings, read and never written, and the note not sent before. */
export interface NoteWindowStart {
  settings: Record<string, unknown>;
  unsent: NoteText | null;
}

/** A file added to the note, kept beside it until it is sent; of a picture, how many pixels wide, where known. */
export interface Added {
  hash: string;
  name: string;
  /** The ending of its name, in small letters. */
  extension: string;
  size: number;
  width: number | null;
}

/** Files added, and what could not be, a line each. */
export interface AddedFiles {
  files: Added[];
  problems: string[];
}

export const noteWindowStart = () => call<NoteWindowStart>('note_window_start');

/** Keeps the note not sent, in place of what was kept; one that holds nothing, and what was kept goes. */
export const noteWindowKeep = (text: NoteText) => call<void>('note_window_keep', { text });

/** Writes the note into the notebook's inbox, its files with it, and forgets what was kept of it. */
export const noteWindowSend = (text: NoteText) => call<void>('note_window_send', { text });

/** Adds files of this computer to the note, each copied beside it. */
export const noteWindowAddFiles = (paths: string[]) =>
  call<AddedFiles>('note_window_add_files', { paths });

/** Adds a file the page holds to the note, its bytes in base64: a picture pasted. */
export const noteWindowAddBytes = (name: string, content: string) =>
  call<Added>('note_window_add_bytes', { name, content });

/** Where a file added to the note lies, by what it holds. */
export const noteWindowFilePath = (hash: string) => call<string>('note_window_file_path', { hash });
