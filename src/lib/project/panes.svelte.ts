/**
 * The panes of the window beside the sides (ADR 0064): the typesetting pane,
 * which shows the side whose button was pressed, with its Look column; and
 * the document pane, which shows the document of the active side. Their
 * state is the window's, kept with its arrangement, not a project's.
 */

import {
  paneParts,
  sides,
  type Arrangement,
  type DocumentTab,
  type PaneParts,
} from './sides.svelte';

export class Panes {
  /** The key of the side the typesetting pane shows; none while it is closed. */
  typesetting = $state<string | null>(null);
  /** Whether the Look column of the typesetting pane is open. */
  look = $state(false);
  /** Whether the document pane is open. */
  document = $state(false);
  /** What the document pane shows, and shows when it is opened again. */
  tab = $state<DocumentTab>('references');
  /** Whether the marks of whitespace are shown in the texts. */
  marks = $state(true);
  typesettingWidth = $state(0);
  documentWidth = $state(0);

  /**
   * What a side's Typesetting button does: opens the pane for the side where
   * it is closed, turns it to the side where it shows another, closes it
   * where it shows this one.
   */
  typesetFor(key: string) {
    this.typesetting = this.typesetting === key ? null : key;
  }

  closeTypesetting() {
    this.typesetting = null;
  }

  /** Opens the Look column, and the typesetting pane for the side where it is closed. */
  openLook(key: string) {
    this.typesetting ??= key;
    this.look = true;
  }

  toggleDocument() {
    this.document = !this.document;
  }

  /** Opens the document pane at a tab; with `toggle`, closes it where it shows that tab already. */
  showTab(tab: DocumentTab, toggle = false) {
    if (toggle && this.document && this.tab === tab) {
      this.document = false;
      return;
    }
    this.tab = tab;
    this.document = true;
  }

  /** A side closed: the typesetting pane that showed it closes with it. */
  sideGone(key: string) {
    if (this.typesetting === key) this.typesetting = null;
  }

  /** The parts of the arrangement the panes hold. */
  parts(): PaneParts {
    return {
      typesetting: this.typesetting,
      look: this.look,
      document: this.document,
      tab: this.tab,
      marks: this.marks,
      typesettingWidth: this.typesettingWidth,
      documentWidth: this.documentWidth,
    };
  }

  /** Takes the panes as they were kept, the sides already laid out. */
  take(kept: Partial<Arrangement> | null | undefined) {
    const p = paneParts(kept, sides);
    this.typesetting = p.typesetting;
    this.look = p.look;
    this.document = p.document;
    this.tab = p.tab;
    this.marks = p.marks;
    this.typesettingWidth = p.typesettingWidth;
    this.documentWidth = p.documentWidth;
  }
}

export const panes = new Panes();
