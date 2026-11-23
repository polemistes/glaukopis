/**
 * The synchronization between the writer's computers (record 0120). Mirrors
 * `src-tauri/src/commands/sync.rs`.
 */

import { listen } from '@tauri-apps/api/event';
import { call, inTauri } from './backend';

export interface SyncStatus {
  /** Whether this computer is synchronized. */
  on: boolean;
  /** The address of the server, as it is kept. */
  server: string | null;
  /** What this computer is called among the others. */
  name: string | null;
  /**
   * 'off' where this computer is in no home; 'idle' between rounds;
   * 'working' in one; 'offline' where the server is not reached; 'refused'
   * where it lets this computer in no more.
   */
  state: 'off' | 'idle' | 'working' | 'offline' | 'refused';
  /** When everything was last the same, as RFC 3339; null before the first time. */
  last: string | null;
  /** What is wrong, in words; null where nothing is. */
  problem: string | null;
  /** Whether something written here waits to be sent. (Optional in the meeting points of stage 2; part A makes it sure.) */
  waiting?: boolean;
}

/** A computer of the writer's. Times are seconds since 1970. */
export interface SyncDevice {
  id: string;
  name: string;
  joined: number;
  lastSeen: number;
  /** Whether it is this computer. */
  you: boolean;
}

/** The computers that are synchronized, and the codes by which one more may come. */
export interface SyncHome {
  devices: SyncDevice[];
  codes: { id: string; created: number; expires: number }[];
  /** How much the files kept on the server hold together. */
  usedBytes: number;
}

/** A code just made: it is told this once. `expires` is seconds since 1970. */
export interface SyncCode {
  code: string;
  expires: number;
}

/** A project that was written in on two computers while they were apart. */
export interface ProjectApart {
  id: string;
  name: string;
}

/** What is kept of it until the writer has seen it. */
export interface Apart {
  /** When the other computer's changes came in, in milliseconds since 1970. */
  time: number;
  /** The moment before they did, a Yjs snapshot in base64: the review shows the changes from it. */
  moment: string;
  /** The project as it stood here then: the entry of its earlier versions. */
  kept: string | null;
}

export const syncStatus = () => call<SyncStatus>('sync_status');
/** Begins with this computer as the first. The password is the server's, where it asks one. */
export const syncStart = (server: string, name: string, password: string | null) =>
  call<SyncStatus>('sync_start', { server, name, password });
/** Enters by a code made on a computer that is synchronized already. */
export const syncJoin = (server: string, code: string, name: string) =>
  call<SyncStatus>('sync_join', { server, code, name });
export const syncHome = () => call<SyncHome>('sync_home');
export const syncCode = () => call<SyncCode>('sync_code');
export const syncRename = (device: string, name: string) =>
  call<SyncHome>('sync_rename', { device, name });
/** Removes another computer. This one leaves by `syncStop`. */
export const syncRemove = (device: string) => call<SyncHome>('sync_remove', { device });
/** This computer is synchronized no more. What it holds stays. */
export const syncStop = () => call<SyncStatus>('sync_stop');
export const syncNow = () => call<void>('sync_now');
/** What the system calls this device: offered as its name. (The phone's role answers it from stage 2.) */
export const syncDevice = () => call<string>('sync_device');
/** Tells the engine whether the app is in front: a phone's rests where it is not. */
export const syncFront = (front: boolean) => call<void>('sync_front', { front });

export const projectApart = (id: string) => call<Apart | null>('project_apart', { id });
export const projectApartSeen = (id: string) => call<void>('project_apart_seen', { id });

/** Listens for the status as it changes. Gives what ends the listening. */
export async function onSync(heard: (status: SyncStatus) => void): Promise<() => void> {
  if (!inTauri) return () => {};
  return listen<SyncStatus>('sync', (e) => heard(e.payload));
}

/** Listens for projects written in apart. Gives what ends the listening. */
export async function onProjectApart(heard: (project: ProjectApart) => void): Promise<() => void> {
  if (!inTauri) return () => {};
  return listen<ProjectApart>('project-apart', (e) => heard(e.payload));
}
