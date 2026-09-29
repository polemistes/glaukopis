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

export const inTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

export async function call<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  if (!inTauri) {
    throw {
      kind: 'no-backend',
      message: t('ui-no-backend'),
    };
  }
  return invoke<T>(command, args);
}
