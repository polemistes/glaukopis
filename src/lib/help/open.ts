/**
 * Opening and closing Help, by F1, the question mark in the row at the top
 * and the palette: at the part of the guide about where the writer is, and
 * in place of the settings or the sheet of keys, which lie over the view
 * as Help does.
 */

import { router } from '$lib/state/router.svelte';
import { sides } from '$lib/project/sides.svelte';
import { settingsUi } from '$lib/settings/settings-ui.svelte';
import { keysUi } from '$lib/shell/keys.svelte';
import { helpUi } from './help-ui.svelte';
import { headingFor } from './where';

export function openHelp() {
  settingsUi.hide();
  keysUi.sheet = false;
  keysUi.palette = false;
  helpUi.show(headingFor(router.route, sides.active));
}

export function toggleHelp() {
  if (helpUi.open) helpUi.hide();
  else openHelp();
}
