/**
 * The notebook on disk, and the files its notes hold. Mirrors
 * `src-tauri/src/commands/notebook.rs`.
 *
 * The notebook is one document, kept as a project's is: a state and a log
 * of the changes after it. It passes as bytes, as it is. The files of notes
 * are in the store of the library's files, each with a record that says the
 * notebook holds it; those it holds alone are in none of the library's
 * lists (record 0101).
 */

import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { fromBase64 } from '$lib/util/base64';
import { call, inTauri, withHead } from './backend';
import type { FileView } from './files';

/** The notebook as it is on disk: its state, none where nothing was written yet, and the changes after it. */
export interface LoadedNotebook {
  state: Uint8Array | null;
  updates: Uint8Array[];
}

/** What is told of the notebook when its whole state is saved. */
export interface NotebookSummary {
  /** How many notes there are. */
  notes: number;
  /** The files its notes hold, by their hashes. */
  files: string[];
}

/** Where on the earth a photograph was taken, in degrees: north and east are positive. */
export interface Place {
  lat: number;
  lon: number;
}

/** A file taken into the notebook, and what it says of itself. */
export interface NotebookFile {
  /** The file as the store keeps it. */
  file: FileView;
  /**
   * Of an image, the file a figure shows of it: itself, or a copy made to
   * be shown (turned upright, or made into PNG), which the notebook holds
   * as well. None for a file that is no image a figure can show.
   */
  shown: FileView | null;
  /** The file's own time, when it was last changed, as the library writes times; none for what was pasted. */
  time: string | null;
  /** Of a photograph, when it was taken, as it says itself: `2026-11-15T14:03:22`, of no time zone. */
  taken: string | null;
  /** Of a photograph, where it was taken, where it says. */
  place: Place | null;
}

/** Files taken into the notebook, and what could not be: each said in a line. */
export interface TakenFiles {
  files: NotebookFile[];
  problems: string[];
}

/** A change to the notebook, as one window wrote it, for the others: the update of its document, in base64. */
export interface NotebookUpdate {
  update: string;
}

export async function notebookLoad(): Promise<LoadedNotebook> {
  const bytes = new Uint8Array(await call<ArrayBuffer>('notebook_load'));
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
  const state = part();
  const updates = Array.from({ length: number() }, part);
  return { state: state.length ? state : null, updates };
}

/** Adds a change to the log, written at `time` (milliseconds since 1970; now, where it is not said). */
export const notebookAppend = (update: Uint8Array, time?: number) =>
  call<void>('notebook_append', withHead({ time: time ?? null }, update));

/** Saves the whole state, and empties the log. */
export const notebookSaveState = (document: Uint8Array, summary: NotebookSummary) =>
  call<void>('notebook_save_state', withHead({ summary }, document));

/**
 * Hears what the other windows write into the notebook. The shell passes a
 * change to every window but the one that wrote it, so this window listens
 * as itself. Gives what ends the listening.
 */
export async function onNotebookUpdate(heard: (update: Uint8Array) => void): Promise<() => void> {
  if (!inTauri) return () => {};
  return getCurrentWebviewWindow().listen<NotebookUpdate>('notebook-update', (e) =>
    heard(fromBase64(e.payload.update)),
  );
}

/**
 * Takes files of this computer into the notebook, and the files in folders
 * among them: each is copied into the store, with what it says of itself
 * read first. A file the store has already is that file.
 */
export const notebookTakeFiles = (paths: string[]) =>
  call<TakenFiles>('notebook_take_files', { paths });

/** Takes an image into the notebook from what it holds, in base64: a picture pasted. */
export const notebookTakeImage = (name: string, content: string) =>
  call<NotebookFile>('notebook_take_image', { name, content });

/** A file of the store as it is, by its hash, whether the library lists it or the notebook holds it alone. */
export const notebookFile = (hash: string) => call<FileView>('notebook_file', { hash });

/** Says that notes hold these files of the store, so that none of them leaves it with the library's listing of it. */
export const notebookHold = (hashes: string[]) => call<void>('notebook_hold', { hashes });

/** Puts a file the notebook holds among the library's files, with where it came from; gives it as the library shows it. */
export const notebookToLibrary = (hash: string, origin: string | null) =>
  call<FileView>('notebook_to_library', { hash, origin });

/**
 * Says which files the notes hold, when the notebook has been read for the
 * first time since the application started: a file the notebook held alone
 * and no note holds any more leaves the store. Gives how many left. Asked
 * again in the same run, nothing is done.
 */
export const notebookSweep = (held: string[]) => call<number>('notebook_sweep', { held });

// ---- what the plugin for Firefox hands over (record 0102) ----

/** What a thing the plugin handed over is: the page, what was selected in it, an image of it, a part of it as a picture. */
export type InboxKind = 'page' | 'selection' | 'image' | 'region';

/**
 * A thing the plugin for Firefox handed to the helper, as the application
 * takes it out of the notebook's inbox: where it came from, and what it is.
 */
export interface InboxItem {
  kind: InboxKind;
  /** The address of the page, and its title. */
  url: string;
  title: string;
  /** When it was collected, as the browser said: an ISO date-time. */
  when: string;
  /** The words: of a page its readable text, of a selection what was selected. */
  text: string;
  /** The same as HTML, where the plugin gave it: a selection with its links, a page as it reads. Not to be trusted. */
  html: string;
  /** Of an image, what it says it shows, where it says. */
  alt: string;
  /** The picture, taken into the store, where the thing is or has one. */
  image: NotebookFile | null;
}

/**
 * Takes what lies in the notebook's inbox out of it: each thing is given
 * once, to whichever window asks first, and is gone from the inbox then.
 */
export const notebookInboxTake = () => call<InboxItem[]>('notebook_inbox_take');

/**
 * Hears that something has come into the notebook's inbox. The shell tells
 * one window, so this window listens as itself. Gives what ends the
 * listening.
 */
export async function onNotebookInbox(heard: () => void): Promise<() => void> {
  if (!inTauri) return () => {};
  return getCurrentWebviewWindow().listen<null>('notebook-inbox', () => heard());
}

/** Whether Firefox is set up to start the helper for this user. */
export interface FirefoxSetup {
  /** Whether the file that tells Firefox of the helper is there, and names this application. */
  installed: boolean;
  /** Where that file is, or would be. */
  manifest: string;
  /** The program it names where it names another than this application: an older or another installation. */
  other: string | null;
}

export const firefoxSetup = () => call<FirefoxSetup>('firefox_setup');
/** Writes the file that tells Firefox of the helper, for this user. */
export const firefoxSetUp = () => call<FirefoxSetup>('firefox_set_up');
/** Removes it. */
export const firefoxRemove = () => call<FirefoxSetup>('firefox_remove');
