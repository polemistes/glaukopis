/** The one place where the interface calls the Rust side. */

import { invoke } from '@tauri-apps/api/core';
import { t } from '$lib/i18n';

export interface BackendError {
  kind: string;
  message: string;
}

export function isBackendError(value: unknown): value is BackendError {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as BackendError).kind === 'string' &&
    typeof (value as BackendError).message === 'string'
  );
}

/** Whether the core said it has not the thing asked for (`Error::NotFound`), not that it failed to look. */
export function isNotFound(error: unknown): boolean {
  return isBackendError(error) && error.kind === 'not-found';
}

/**
 * What the page is told of work asked for with a ticket while it goes on,
 * by an event: what is told, with the ticket beside it (`commands/work.rs`).
 */
export type Told<T> = T & { ticket: string };

/** How far work on many things has come: how many are done, of how many, and the one at hand. */
export interface Count {
  done: number;
  total: number;
  /** The one at hand. */
  name: string;
}

export const inTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

/** With bytes for `args`, they are sent as they are, as the body of the request. */
export async function call<T>(
  command: string,
  args?: Record<string, unknown> | Uint8Array,
): Promise<T> {
  if (!inTauri) {
    throw {
      kind: 'no-backend',
      message: t('ui-no-backend'),
    };
  }
  return invoke<T>(command, args);
}

/** Bytes, with what they are said to be before them, as `with_head` in `commands/projects.rs` reads them. */
export function withHead(head: Record<string, unknown>, bytes: Uint8Array): Uint8Array {
  const said = new TextEncoder().encode(JSON.stringify(head));
  const out = new Uint8Array(4 + said.length + bytes.length);
  new DataView(out.buffer).setUint32(0, said.length, true);
  out.set(said, 4);
  out.set(bytes, 4 + said.length);
  return out;
}
