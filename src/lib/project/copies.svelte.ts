/**
 * The comparison of a copy with its original, asked for wherever the copy
 * is shown: its mark in the diagram, its menu. The view of the project
 * shows it (`CopyDialog.svelte`).
 */

class Comparing {
  /** The copy that is compared with its original, while that is shown. */
  copy = $state<string | null>(null);
}

export const comparing = new Comparing();

/** Shows how a copy and its original differ. */
export function compareCopy(id: string) {
  comparing.copy = id;
}
