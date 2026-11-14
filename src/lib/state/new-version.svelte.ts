/**
 * Whether a newer version of Glaukopis is out (record 0099). Asked at the
 * start of the first window, on Windows and macOS only: Linux updates the
 * application with the system's packages. A newer version is told of once,
 * at the foot of the window, with a button to the page of the installers,
 * and stays named under Settings › About for as long as it is newer.
 */

import { inTauri } from '$lib/api/backend';
import { openPath } from '$lib/api/documents';
import { newerVersion, systemInfo } from '$lib/api/system';
import { t } from '$lib/i18n';
import { testHook } from '$lib/shell/testing';
import { notifyError, toasts } from '$lib/ui/toast.svelte';
import { settings } from './settings.svelte';

/** The page the installers are on. */
export const DOWNLOAD_PAGE = 'https://www.robertemilberge.no/glaukopis/';

/** The newer version found at this start, if one was. */
export const newVersion = $state<{ version: string | null }>({ version: null });

/** Whether the systems of this name are told of new versions. */
export function toldOn(platform: string | undefined): boolean {
  return platform === 'windows' || platform === 'macos';
}

/** Opens the page of the installers in the browser. */
export function openDownloadPage() {
  openPath(DOWNLOAD_PAGE).catch((error) => notifyError(t('common-link-open-failed'), error));
}

/**
 * Asks whether a newer version is out, and tells of it if it has not been
 * told of before. A failure to ask is logged and not said: it is nothing
 * the writer has to do anything about. `server` is another place to ask.
 */
export async function askForNewVersion(server?: string) {
  let version: string | null;
  try {
    version = await newerVersion(server);
  } catch (error) {
    console.warn('Whether a newer version is out could not be asked', error);
    return;
  }
  newVersion.version = version;
  if (!version || settings.value.versionTold === version) return;
  settings.set('versionTold', version);
  toasts.show(
    {
      kind: 'info',
      message: t('settings-new-version-out', { version }),
      action: { label: t('settings-download-page'), run: openDownloadPage },
    },
    0,
  );
}

/** Asks, where this is Windows or macOS and the setting has not turned it off. */
export async function askIfToldHere() {
  if (!inTauri || !settings.value.newVersions) return;
  const info = await systemInfo().catch(() => null);
  if (toldOn(info?.platform)) await askForNewVersion();
}

// The e2e scripts ask a folder of their own, on whatever system they run on.
testHook('__glaukopisAskForNewVersion', (server: string) => askForNewVersion(server));
