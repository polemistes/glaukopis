/**
 * What the window asks of a side (ADR 0064): each side registers itself by
 * its key while it is shown, so that the keys, the panes, the list and the
 * dialogs, which are the window's, act on the side they mean, mostly the
 * active one.
 */

import { SvelteMap } from 'svelte/reactivity';
import type { MapMode } from '$lib/state/router.svelte';
import type MapDiagram from './diagram/MapDiagram.svelte';
import type MapText from './text/MapText.svelte';
import type { OpenProject } from './open-projects.svelte';

export interface SideApi {
  readonly key: string;
  /** The project the side shows, as it is opened. */
  readonly open: OpenProject;
  /** The element of the side, within which the writing tools find their editor. */
  readonly el: HTMLElement | undefined;
  /** Enters an element; with an element within it, that one is shown; with a mode, so. */
  show(at: string, options?: { element?: string; mode?: MapMode }): void;
  /** The element in view the side has to be at to show an element. */
  holding(element: string): string;
  /** Goes to an element: in the side as it is, where it is within view, else entering what holds it. */
  goTo(element: string, options?: { mode?: MapMode }): void;
  /** Up from the element in view; from the project's top, into the list. */
  up(): void;
  /** The text of the side, where it shows the text. */
  text(): ReturnType<typeof MapText> | undefined;
  /** The diagram of the side, where it shows the diagram. */
  diagram(): ReturnType<typeof MapDiagram> | undefined;
  /** The text of the element in view is searched; from the diagram, the text is turned to first. */
  find(replacing: boolean): void;
  /** Documents brought in, each a branch under the element in view. */
  documentsIn(paths: (string | null)[]): Promise<void>;
}

export const sideApis = new SvelteMap<string, SideApi>();
