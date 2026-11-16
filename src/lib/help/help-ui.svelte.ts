/**
 * Whether Help is open: the user's guide, in a window laid over whatever
 * view is open, as the settings are. It opens at the part of the guide
 * about where the writer is (`where.ts`); and where it was left, if it was
 * closed while the writer was at the same place, so that one can read a
 * step, close it, do it, and open it again. That is kept for the run.
 *
 * One window lies over the view at a time: what opens Help closes the
 * settings and the sheet of keys (`open.ts`), and they close Help.
 */

/**
 * Whether Help is offered at all. It is not, for now, on the owner's word
 * of 2026-11-16 (record 0106, its last addendum): no question mark in the
 * row at the top, no F1, no entry in the sheet of keys or the palette, and
 * the window is not mounted. Everything of Help is kept and tested; set
 * this to true, and bring back what the guide said of it, to offer it again.
 */
export const HELP_OFFERED: boolean = false;

/** Where Help was left: at which place, in which chapter, and how far down. */
export interface Left {
  place: string | null;
  chapter: string;
  scroll: number;
}

class HelpUi {
  open = $state(false);
  /** The heading of the guide about where the writer was when Help was opened. */
  place = $state<string | null>(null);
  /** Where Help was left when it was last closed. */
  left: Left | null = null;

  show(place: string | null) {
    this.place = place;
    this.open = true;
  }

  hide() {
    this.open = false;
  }

  /** Where Help is to open again: where it was left, if it was left at the place it is opened at. */
  get resumed(): Left | null {
    return this.left && this.left.place === this.place ? this.left : null;
  }
}

export const helpUi = new HelpUi();
