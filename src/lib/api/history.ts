/** The full history of a project (ADR 0021). Mirrors `src-tauri/src/commands/history.rs`. */

import { invoke } from '@tauri-apps/api/core';
import { call, inTauri } from './backend';
import { t } from '$lib/i18n';

/**
 * A stretch of the history that is to be replaced: where it begins, how
 * many records it holds, and the times of the first and the last, by which
 * the core knows it is the stretch that was read.
 */
export interface Stretch {
  first: number;
  count: number;
  time: number;
  until: number;
}

async function bytes(command: string, args: Record<string, unknown>): Promise<Uint8Array> {
  if (!inTauri) throw { kind: 'no-backend', message: t('ui-no-backend') };
  return new Uint8Array(await invoke<ArrayBuffer>(command, args));
}

/** Everything the history holds, as records one after another (see `records.ts`). */
export const historyRead = (id: string) => bytes('history_read', { id });
/** What an archive of history holds, the same way. */
export const historyArchiveRead = (path: string) => bytes('history_archive_read', { path });
export const historyRoom = (id: string) => call<number>('history_room', { id });
export const historyDelete = (id: string) => call<void>('history_delete', { id });
/** Replaces a stretch by merged records, encoded as records and then in base64. */
export const historyMerge = (id: string, stretch: Stretch, records: string) =>
  call<void>('history_merge', { id, stretch, records });
/** Takes out the history before a moment, into an archive where a path is given. */
export const historyCut = (
  id: string,
  stretch: Stretch,
  start: string,
  time: number,
  archive: string | null,
) => call<void>('history_cut', { id, stretch, start, time, archive });
