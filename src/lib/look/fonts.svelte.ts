/**
 * The fonts to choose among: those most documents are set in, and those of
 * this computer, which the core lists. Listed once, when they are first
 * asked for, for every chooser of fonts: the Look's, and the one in the
 * head of a box of rich text.
 */

import { fontsList } from '$lib/api/documents';

/** The fonts that are offered though the computer may not have them: a document is often set where they are. */
export const USUAL_FONTS: readonly string[] = [
  'Times New Roman',
  'Arial',
  'Calibri',
  'Garamond',
  'Georgia',
  'Palatino',
  'Libertinus Serif',
  'Gentium Plus',
  'New Athena Unicode',
];

class Fonts {
  /** The fonts of this computer, once they have been listed. */
  ofComputer = $state.raw<string[]>([]);
  #asked = false;

  /** Lists the fonts of this computer, the first time it is asked. */
  ask() {
    if (this.#asked) return;
    this.#asked = true;
    fontsList()
      .then((list) => (this.ofComputer = list))
      // The usual fonts are still offered; the log says why the others are not. It is not asked again.
      .catch((error) => console.error('the fonts of this computer could not be listed', error));
  }

  /** Every font to choose among, each once. */
  get all(): string[] {
    return [...new Set([...USUAL_FONTS, ...this.ofComputer])];
  }
}

export const fonts = new Fonts();
