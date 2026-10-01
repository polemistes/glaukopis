/**
 * The kinds of elements, as the interface asks for them: a kind to be made
 * or changed, and the kinds of the project to be looked through. The view
 * of the project shows the dialogs (`KindDialog.svelte`, `KindsDialog.svelte`).
 */

import { settings } from '$lib/state/settings.svelte';

class KindsUi {
  /** A kind being made (`id` null) or changed; `assign`: the elements a kind made is given to. */
  editing = $state<{ id: string | null; assign: string[] } | null>(null);
  /** Whether the kinds of the project are being looked through. */
  managing = $state(false);
}

export const kindsUi = new KindsUi();

/** Asks for a kind to be made, and given to these elements. */
export function newKind(assign: string[] = []) {
  kindsUi.editing = { id: null, assign };
}

/** Asks for a kind to be changed. */
export function editKind(id: string) {
  kindsUi.editing = { id, assign: [] };
}

/** Asks for the kinds of the project to be looked through. */
export function manageKinds() {
  kindsUi.managing = true;
}

/**
 * Keeps a kind among those made before, in any project, so that its name
 * is offered again, with the colour it had last.
 */
export function rememberKind(name: string, colour: string) {
  const key = name.trim().toLocaleLowerCase();
  if (!key) return;
  const kept = settings.value.kinds.filter((k) => k.name.trim().toLocaleLowerCase() !== key);
  settings.set('kinds', [{ name: name.trim(), colour }, ...kept].slice(0, 60));
}
