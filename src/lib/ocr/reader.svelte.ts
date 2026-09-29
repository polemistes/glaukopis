/**
 * What there is to read text in pictures with: whether Tesseract is
 * installed, and the languages it has data for. Asked once, and again when
 * the settings look for the programs anew.
 */

import { toolsInfo, type ToolsInfo } from '$lib/api/documents';
import { settings } from '$lib/state/settings.svelte';
import { byName, firstLanguages } from './languages';

class Reader {
  tools = $state.raw<ToolsInfo | null>(null);
  #asking: Promise<ToolsInfo | null> | null = null;

  /** What is installed, asked once; with `again`, looked for anew. */
  load(again = false): Promise<ToolsInfo | null> {
    if (again || !this.#asking) {
      this.#asking = toolsInfo(again)
        .then((tools) => (this.tools = tools))
        .catch((error) => {
          console.error('the programs could not be asked for', error);
          return null;
        });
    }
    return this.#asking;
  }

  /** Taken from what the settings found when they looked anew. */
  set(tools: ToolsInfo) {
    this.tools = tools;
    this.#asking = Promise.resolve(tools);
  }

  get installed(): boolean {
    return !!this.tools?.tesseract;
  }

  /** The languages Tesseract has, in the order of their names. */
  get languages(): string[] {
    return byName(this.tools?.ocrLanguages ?? []);
  }

  /** Those to read with at first: see `firstLanguages`. */
  first(...tags: (string | null | undefined)[]): string[] {
    return firstLanguages(this.tools?.ocrLanguages ?? [], settings.value.ocrLanguages ?? [], tags);
  }
}

export const reader = new Reader();
