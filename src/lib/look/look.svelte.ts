/**
 * The panel of the look of a document (ADR 0042, in the order of 2026-10-19),
 * as it is asked for from anywhere in the view of a project: from the bar
 * over the preview, from the foot of the kind menu, from a line of the
 * pages, from the palette and by its key. The view of the project opens it
 * in the panel at the side, on the document the preview shows.
 */

/** The parts of the panel, in the order of the page from the outside in, as its chips name them. */
export type LookSection =
  | 'page'
  | 'type'
  | 'paragraphs'
  | 'headings'
  | 'numbers'
  | 'notes'
  | 'figures'
  | 'front'
  | 'contents'
  | 'layout';

export const LOOK_SECTIONS: readonly LookSection[] = [
  'page',
  'type',
  'paragraphs',
  'headings',
  'numbers',
  'notes',
  'figures',
  'front',
  'contents',
  'layout',
];

export interface LookRequest {
  /** The part to bring into view; where nothing is said, the panel stays where it was. */
  section?: LookSection;
  /** The kind whose look is opened and brought into view, under Paragraphs. */
  kind?: string;
  /** The level of heading whose rows are opened, under Headings. */
  level?: number;
  /** A heading within a part to bring into view: `quotations`, `kinds`, `citations`, `bibliography`. */
  at?: string;
}

class LookUi {
  /** Rises each time the panel is asked for: the view of the project opens it. */
  asked = $state(0);
  /** What it was last asked for. */
  request = $state.raw<LookRequest>({});

  open(request: LookRequest = {}) {
    this.request = request;
    this.asked++;
  }
}

export const lookUi = new LookUi();
