/**
 * Who works here, as the history of a project knows them: the person of this
 * installation, made once and kept in the settings, named as the settings
 * name them, or as the system names the user where they do not.
 */

import { systemInfo } from '$lib/api/system';
import type { Me } from '$lib/project/model/project.svelte';
import { settings } from '$lib/state/settings.svelte';

let system = $state('');
let asked = false;

/** The name the system gives the user, once it has been asked. */
function systemName(): string {
  if (!asked) {
    asked = true;
    systemInfo()
      .then((info) => (system = info.user ?? ''))
      .catch(() => {});
  }
  return system;
}

/** Who works here now. Reactive: it follows the settings. */
export function me(): Me | null {
  const id = settings.value.person;
  if (!id) return null;
  return { id, name: settings.value.displayName?.trim() || systemName() };
}
