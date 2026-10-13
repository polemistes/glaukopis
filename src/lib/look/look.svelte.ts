/**
 * The panel of the look of a document (ADR 0042), as it is asked for from
 * anywhere in the view of a project: from the bar over the preview, from
 * the foot of the kind menu, from the document settings, from the palette
 * and by its key. The view of the project opens it in the panel at the
 * side, on the document the preview shows.
 */

/** The parts of the panel, as its chips name them. */
export type LookSection =
  | 'type'
  | 'page'
  | 'paragraphs'
  | 'headings'
  | 'kinds'
  | 'quotations'
  | 'numbers'
  | 'notes'
  | 'bibliography'
  | 'figures'
  | 'title'
  | 'about';

export const LOOK_SECTIONS: readonly LookSection[] = [
  'type',
  'page',
  'paragraphs',
  'headings',
  'kinds',
  'quotations',
  'numbers',
  'notes',
  'bibliography',
  'figures',
  'title',
  'about',
];

export interface LookRequest {
  /** The part to open at; where nothing is said, the one open before. */
  section?: LookSection;
  /** The kind whose look is opened and brought into view, in the part of the kinds. */
  kind?: string;
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
