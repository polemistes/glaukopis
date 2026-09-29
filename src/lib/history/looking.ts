/** A moment of the history that is being looked at, in place of the map as it is. */

import type { When } from './engine';
import type { ProjectHistory } from './history.svelte';

export interface Looking {
  /** The history it is of: the project's, or an archive's. */
  history: ProjectHistory;
  when: When;
  /** What it is compared with: the moment before. Nothing, for nothing marked. */
  since: When | null;
  /** When it was, in milliseconds since 1970. */
  time: number;
  /** The name it was given, where it has one. */
  name: string | null;
  /** The pane it is shown in. */
  pane: number;
}
