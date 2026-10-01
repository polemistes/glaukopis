/**
 * Saying when an element is, asked for from its menu wherever it is shown.
 * The view of the project shows the dialog (`WhenDialog.svelte`).
 */

class WhenUi {
  /** The element that is saying when it is, while the dialog is open. */
  element = $state<string | null>(null);
}

export const whenUi = new WhenUi();

/** Asks for an element to say when it is. */
export function sayWhen(id: string) {
  whenUi.element = id;
}
