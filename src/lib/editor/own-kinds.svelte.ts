/**
 * The kinds of paragraph and of words of the writer's own, as the interface
 * asks for them: a kind to be made or changed, in the dialog the view of
 * the project shows (`PassageKindDialog.svelte`); and the kinds as they are
 * remembered across projects, so that a kind made in one project is
 * offered by name in every other, with what it was based on and how it
 * differed, and "Letter" is spelled alike without anything being imposed.
 * As the kinds of elements are asked for and remembered
 * (`project/kinds.svelte.ts`).
 */

import type { KindFamily } from '$lib/api/documents';
import { settings, type RememberedPassageKind } from '$lib/state/settings.svelte';

class OwnKindsUi {
  /**
   * A kind being made (`id` null) or changed, of a family; `apply`: what is
   * done with the id of a kind that is made, as putting it on the selection.
   */
  editing = $state<{ id: string | null; family: KindFamily; apply?: (id: string) => void } | null>(
    null,
  );
}

export const ownKindsUi = new OwnKindsUi();

/** Asks for a kind of paragraph or of words to be made; `apply` is called with its id when it is. */
export function newPassageKind(family: KindFamily, apply?: (id: string) => void) {
  ownKindsUi.editing = { id: null, family, apply };
}

/** Asks for a kind of the writer's own to be changed. */
export function editPassageKind(id: string, family: KindFamily) {
  ownKindsUi.editing = { id, family };
}

/** Keeps a kind among those made before, in any project; a kind of the same name takes the place of the one before. */
export function rememberPassageKind(kind: RememberedPassageKind) {
  const name = kind.name.replace(/\s+/g, ' ').trim();
  const key = name.toLocaleLowerCase();
  if (!key) return;
  const kept = settings.value.passageKinds.filter((k) => k.name.trim().toLocaleLowerCase() !== key);
  const made: RememberedPassageKind = {
    name,
    family: kind.family,
    basedOn: kind.basedOn,
    look: { ...kind.look },
  };
  settings.set('passageKinds', [made, ...kept].slice(0, 60));
}
