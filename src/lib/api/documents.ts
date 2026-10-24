/** Preview and export, reference styles, document formats. Mirrors `commands/documents.rs`. */

import type { Block, Inline } from '$lib/project/model/text';
import { call } from './backend';
import type { PartLook, Template } from './templates';

export interface Tool {
  path: string;
  version: string;
  /** Where it is older than what Glaukopis needs: the least that will do. */
  least?: string;
}

export interface ToolsInfo {
  pandoc: Tool | null;
  latex: string[];
  pandocApi: number[];
  /** Reads text in pictures: see `api/ocr.ts`. */
  tesseract: Tool | null;
  /** The languages Tesseract has data for, by its names for them: `eng`, `nor`. */
  ocrLanguages: string[];
  /** Draws the pages of PDFs that cannot be drawn otherwise. */
  pdftoppm: Tool | null;
  resources: string;
}

export interface StyleSummary {
  id: string;
  title: string;
  /** note, author-date, numeric, label, author, or empty. */
  kind: string;
  own: boolean;
  bibliography: boolean;
}

export interface StyleFound {
  id: string;
  title: string;
  kind: string;
  parent: string | null;
  fields: string[];
  installed: boolean;
}

export type FormatKind =
  'general' | 'style-guide' | 'publisher' | 'journal' | 'fiction' | 'stage' | 'poetry' | 'own';

export interface FormatSummary {
  id: string;
  name: string;
  kind: FormatKind;
  description: string;
  own: boolean;
  confidence: string;
  checked: string;
}

export type Align = 'left' | 'center' | 'right' | 'justified';
export type Case = 'none' | 'upper' | 'smallcaps';
/** Where a heading begins: in the text, on a new page, or on a right-hand page (ADR 0057). */
export type Begins = 'text' | 'page' | 'right-page';
/** How a level of heading is numbered (ADR 0058). */
export type LevelNumbering =
  'as-above' | 'none' | 'arabic' | 'alpha' | 'alpha-lower' | 'roman' | 'roman-lower';
/** How the pages are numbered. */
export type NumberStyle = 'arabic' | 'roman' | 'roman-lower' | 'letters' | 'letters-lower';

export interface HeadingLevel {
  size: number;
  bold: boolean;
  italic: boolean;
  align: Align;
  case: Case;
  runIn: boolean;
  /** Where the heading begins: a chapter of a book on a new page. */
  begins: Begins;
  numbering: LevelNumbering;
  indent: boolean;
  spaceBefore: string;
  spaceAfter: string;
}

/** What stands in a place of the header or the footer (ADR 0057). */
export type MarginItem =
  | { kind: 'page-number' }
  | { kind: 'title' }
  | { kind: 'author' }
  | { kind: 'editor' }
  | { kind: 'translator' }
  | { kind: 'chapter' }
  | { kind: 'date' }
  | { kind: 'text'; text: string };

export interface Sides {
  left: MarginItem[];
  center: MarginItem[];
  right: MarginItem[];
}

/** The header or the footer of the pages (ADR 0057). */
export interface Margin extends Sides {
  shown: boolean;
  firstPage: boolean;
  /** On the pages where a heading that begins a page, or a part on a page of its own, begins. */
  openers: boolean;
  /** Different on left pages: `even` holds their places. */
  alternate: boolean;
  even?: Sides;
  separator: string;
  /** In points; nought is the text's. */
  size: number;
  italic: boolean;
  case: Case;
}

/** See `crates/core/src/formats/mod.rs`, where every parameter is explained. */
/**
 * How a kind of paragraph or of words differs from the kind it is based
 * on: what is not said is as the base has it. Lengths with their unit,
 * as `1.27cm`. See ADR 0029 and `formats/kinds.rs`.
 */
export interface Look {
  /** In points. */
  size?: number;
  /** 1 is single spacing, 2 is double. */
  lineSpacing?: number;
  align?: Align;
  indentLeft?: string;
  indentRight?: string;
  /** How far the first line begins in, beyond the rest. */
  firstLine?: string;
  spaceBefore?: string;
  spaceAfter?: string;
  bold?: boolean;
  italic?: boolean;
  case?: Case;
  underline?: boolean;
  /** In letters of equal width, as code is. */
  monospace?: boolean;
  /** Kept on the page with what follows it. */
  keepWithNext?: boolean;
  newPage?: boolean;
  /** What stands in a paragraph that holds no text of its own: the sign of a break. */
  text?: string;
}

/**
 * The look of a kind with everything said, as the core resolves it against
 * the base looks, the kinds it is based on and the layout's row
 * (`Resolved` in `formats/kinds.rs`): lengths with their unit, a size of
 * nought that of the text around, for a kind of words.
 */
export interface ResolvedLook {
  size: number;
  lineSpacing: number;
  align: Align;
  indentLeft: string;
  indentRight: string;
  firstLine: string;
  spaceBefore: string;
  spaceAfter: string;
  bold: boolean;
  italic: boolean;
  case: Case;
  underline: boolean;
  monospace: boolean;
  keepWithNext: boolean;
  newPage: boolean;
  text: string;
}

/** The look of a kind as the layout editor shows it, and whether the layout's own row says anything of it (ADR 0040). */
export interface KindLook {
  look: ResolvedLook;
  said: boolean;
}

/** The resolved look of every kind, by id: the catalogue's and the writer's own. */
export type KindLooks = Record<string, KindLook>;

/** Of paragraphs, or of words within them. */
export type KindFamily = 'paragraph' | 'words';

/**
 * A kind that comes with the application, as the core has it: see
 * `formats/kinds.rs`. It carries no look: the base looks of the kinds are
 * the core's, and every layout is resolved against them (ADR 0040).
 */
export interface KindEntry {
  id: string;
  family: KindFamily;
  /** How the document groups paragraphs of it, `words` for a kind of words only (`project/model/families.ts`). */
  group: string;
  /** The id of the kind it is based on; nothing for text, or plain words. */
  basedOn: string | null;
  /** The name of its style in Word and Writer; empty where it has none. */
  style: string;
  /** Whether a numbering counts its lines. */
  counted: boolean;
  /** Whether it may also stand on words, as a speaker and a direction may. */
  words: boolean;
}

/** A kind of the writer's own, as the document carries it. */
export interface OwnKind {
  id: string;
  name: string;
  family: KindFamily;
  /** The id of the kind it is based on. */
  basedOn: string;
  look: Look;
}

export interface DocumentFormat {
  id: string;
  name: string;
  kind: FormatKind;
  description: string;
  source?: { name: string; url: string; checked: string; confidence: string; notes: string };
  basedOn?: string;
  /** How the kinds of paragraph and of words are set, where the format says otherwise than the kind has it: by the id of the kind. */
  kinds?: Record<string, Look>;
  /** Kinds the format puts in the writer's hand, by id. Moves to the template (ADR 0038). */
  suggests?: string[];
  /** How the kinds of elements that make a document are set, where the layout says otherwise than the kind has it: by the id of the kind (ADR 0038). */
  parts?: Record<string, PartLook>;
  page: {
    size: string;
    width: string;
    height: string;
    marginTop: string;
    marginBottom: string;
    marginLeft: string;
    marginRight: string;
    /** How many columns the text is set in: 1 for none. */
    columns: number;
    /** The room between two columns. */
    columnGap: string;
    numbering: NumberStyle;
    /** The pages begin to be counted anew where the element this is set on begins (ADR 0059). */
    restart: boolean;
  };
  font: { family: string; size: number };
  text: {
    lineSpacing: number;
    align: Align;
    /** How far the first line of a paragraph begins in; nought for none. */
    indent: string;
    indentFirst: boolean;
    /** The step of an indent, by which Tab sets lines and paragraphs in. */
    indentStep: string;
    /** The space between paragraphs, beyond that between lines; nought for none. */
    spaceBetween: string;
    hyphenate: boolean;
    /** How italics are set: as italics, or underlined as typewritten manuscripts had them. */
    italics: 'italic' | 'underline';
    /** How reference marks are set: raised in the line, or in the margin beside it. */
    refmarks: 'raised' | 'margin';
  };
  headings: { numbered: boolean; levels: HeadingLevel[] };
  title: {
    placement: 'top' | 'own-page';
    size: number;
    bold: boolean;
    italic: boolean;
    align: Align;
    case: Case;
    showAuthors: boolean;
    showAffiliations: boolean;
    /** The lines of the editors and the translators. */
    showRoles: boolean;
    showDate: boolean;
    showAbstract: boolean;
    abstractLabel: string;
    keywordsLabel: string;
    anonymous: boolean;
  };
  quote: {
    indentLeft: string;
    indentRight: string;
    size: number;
    lineSpacing: number;
    italic: boolean;
    fromWords: number | null;
    fromLines: number | null;
  };
  /** How the numbers of a numbered stretch are shown, where the stretch does not say (ADR 0041). */
  verse: {
    /** Every how many: 5 shows 5, 10, 15. */
    every: number;
    side: 'left' | 'right';
    /** The side the annotations of lines stand on; nothing for the other side from the numbers. */
    annotations?: 'left' | 'right' | null;
  };
  notes: { kind: 'footnotes' | 'endnotes'; size: number; lineSpacing: number; title: string };
  bibliography: {
    title: string;
    hangingIndent: string;
    lineSpacing: number;
    entrySpacing: string;
    newPage: boolean;
    size: number;
  };
  figures: {
    label: string;
    /** What a figure is called where the text points to it, when not the same. */
    reference: string;
    /** Where figures stand, and whether the text flows around them, unless something else is said of one. */
    align: 'left' | 'center' | 'right';
    wrap: boolean;
    /** A line break in it sets the caption on a line of its own. */
    separator: string;
    labelBold: boolean;
    labelItalic: boolean;
    captionPosition: 'above' | 'below';
    captionAlign: Align;
    /** In points; 0 for the size of the text. */
    captionSize: number;
    captionItalic: boolean;
    /** 0 for the spacing of the text. */
    captionLineSpacing: number;
    placement: 'in-text' | 'at-end';
    endTitle: string;
    /** With `{}` for the label and number. */
    placeholder: string;
  };
  equations: { beforeNumber: string; afterNumber: string; align: 'left' | 'center' | 'right' };
  tables: {
    label: string;
    reference: string;
    /** A line break in it sets the caption on a line of its own. */
    separator: string;
    labelBold: boolean;
    labelItalic: boolean;
    captionPosition: 'above' | 'below';
    captionAlign: Align;
    /** In points; 0 for the size of the text. */
    captionSize: number;
    captionItalic: boolean;
    /** 0 for the spacing of the text. */
    captionLineSpacing: number;
    placement: 'in-text' | 'at-end';
    endTitle: string;
    /** With `{}` for the label and number. */
    placeholder: string;
    align: 'left' | 'center' | 'right';
    wrap: boolean;
    /** The size of what stands in the table, in points; 0 for the size of the text. */
    size: number;
    /** 0 for the spacing of the text. */
    lineSpacing: number;
    /** The lines of a table: over and under it and under its headings; around every cell; none. */
    rules: 'horizontal' | 'grid' | 'none';
    headerBold: boolean;
  };
  header: Margin;
  footer: Margin;
  lineNumbers: boolean;
  style?: string;
  /** Gone with ADR 0038: limits are the template's requirements. Tolerated in old files. */
  limits?: {
    words: number | null;
    abstractWords: number | null;
    keywords: number | null;
    note: string;
  };
}

export interface ExportSection {
  level: number;
  heading: Inline[] | null;
  blocks: Block[];
  element: string | null;
  /** The kind of element the section was made from, where it is a kind of the catalogue (ADR 0038). */
  kind?: string;
}

/**
 * An element of a matter or cover kind among the direct children of the
 * element printed: its text at level 0, its children from level 1 (ADR 0038).
 */
export interface ExportPart {
  kind: string;
  element: string | null;
  title: Inline[];
  sections: ExportSection[];
}

export interface ExportAuthor {
  name: string;
  affiliation?: string;
  email?: string;
  orcid?: string;
}

/** A person of the document, with what they did for it. */
export type ExportContributor = ExportAuthor & { role: 'author' | 'editor' | 'translator' };

export interface ExportReference {
  id: string;
  key: string;
  type: string;
  fields: Record<string, string>;
  names: Record<string, unknown[]>;
}

export interface ExportDocument {
  title: Inline[];
  subtitle?: string;
  /** The authors, the editors and the translators, in their order. */
  contributors: ExportContributor[];
  date?: string;
  keywords: string[];
  language?: string;
  /** What the file formats carry as metadata: isbn, edition, publisher, place, doi (ADR 0038). */
  identifiers: Record<string, string>;
  /** The elements of a matter or cover kind among the direct children of the element printed (ADR 0038). */
  parts: ExportPart[];
  sections: ExportSection[];
  references: ExportReference[];
  /** The kinds of paragraph and of words that are the writer's own, which the project carries. */
  kinds?: OwnKind[];
  /** The looks of the elements under the one printed that have their own: what holds for each one's stretch (ADR 0059). */
  looks?: ElementLook[];
}

/** The layout an element under the one printed uses, with its changes (ADR 0059). */
export interface ElementLook {
  element: string;
  format: DocumentFormat;
}

export interface DocumentRequest {
  document: ExportDocument;
  style: string;
  format: DocumentFormat;
  /** The template whole (ADR 0038); the plain one where nothing is given. */
  template?: Template;
  /** Which of the template's outputs: `document` where nothing is given. */
  output?: string;
  key: string;
}

/** A part of a document as it is sent for the preview: its text is sent once, and named by its stamp from then on. */
export interface LeanSection {
  level: number;
  heading: Inline[] | null;
  element: string | null;
  /** Tells the text from every other, and from itself as it was before it was changed. */
  stamp: string;
  /** The text. Nothing, where it was sent before. */
  blocks: Block[] | null;
}

export interface LeanDocument extends Omit<ExportDocument, 'sections'> {
  sections: LeanSection[];
}

export interface PreviewRequest {
  document: LeanDocument;
  style: string;
  format: DocumentFormat;
  template?: Template;
  output?: string;
  key: string;
}

/**
 * A run of text on a page, as it was set: where it stands, in points from
 * the top left corner of the page. The text is laid over the drawn page,
 * unseen, so that it can be selected and copied.
 */
export interface TextRun {
  /** Where the run begins. */
  x: number;
  /** The y of its baseline. */
  baseline: number;
  /** Its advance: how far it reaches from `x`. */
  width: number;
  /** The size of the type. */
  size: number;
  text: string;
}

/** A page of the preview. */
export interface PreviewPage {
  /** Which page it is, the first being 1. */
  number: number;
  svg: string;
  /** The text on the page, run by run. */
  texts: TextRun[];
}

/** Where an element of the map begins in the document: the page, from 1, and the y in points from the top of it. */
export interface Place {
  element: string;
  page: number;
  y: number;
}

/**
 * A stretch of a page and what stands in it: the page, from 1, and the top
 * and the bottom in points from the top of it. `what` is `kind:<id>` for a
 * kind of paragraph, `part:<id>` for an element of a kind that makes a
 * document or a part the core makes (`part:contents`), `heading:<level>`,
 * `note`, `bibliography`, `figure`, `table` or `front`. See `preview/spots.ts`.
 */
export interface Spot {
  page: number;
  top: number;
  bottom: number;
  what: string;
}

export interface Preview {
  /** How many pages the document has. */
  count: number;
  /** The pages that were asked for. */
  pages: PreviewPage[];
  width: number;
  height: number;
  /** Where each element of the map begins, in the order of the text. */
  places: Place[];
  /** What stands where on all the pages, page by page, from the top. */
  spots: Spot[];
  warnings: string[];
  missing: string[];
  substitute: string | null;
}

export type Target =
  'pdf' | 'pdflatex' | 'docx' | 'odt' | 'latex' | 'markdown' | 'html' | 'epub' | 'typst';

export interface Exported {
  path: string;
  also: string[];
  warnings: string[];
  missing: string[];
}

export const toolsInfo = (again = false) => call<ToolsInfo>('tools_info', { again });
export const fontsList = () => call<string[]>('fonts_list');

export const stylesList = () => call<StyleSummary[]>('styles_list');
export const stylesSearch = (query: string) => call<StyleFound[]>('styles_search', { query });
export const stylesFetch = (id: string) => call<StyleSummary>('styles_fetch', { id });
export const stylesImport = (path: string) => call<StyleSummary>('styles_import', { path });
export const stylesRead = (id: string) => call<string>('styles_read', { id });
export const stylesSave = (id: string, title: string, xml: string) =>
  call<StyleSummary>('styles_save', { id, title, xml });
export const stylesDelete = (id: string) => call<void>('styles_delete', { id });
export const styleSample = (xml: string, references: ExportReference[], language?: string) =>
  call<string>('style_sample', { xml, references, language: language ?? null });

export const formatsList = () => call<FormatSummary[]>('formats_list');
export const formatsGet = (id: string) => call<DocumentFormat>('formats_get', { id });
export const formatsSave = (format: DocumentFormat) =>
  call<DocumentFormat>('formats_save', { format });
export const formatsDelete = (id: string) => call<void>('formats_delete', { id });
/** The look of every kind as the format resolves it, with the writer's own kinds. */
export const formatKindLooks = (format: DocumentFormat, own: OwnKind[]) =>
  call<KindLooks>('format_kind_looks', { format, own });

/**
 * The pages of a document: how many there are, and those that are asked
 * for, which are those that are looked at. It fails with the kind `lacking`
 * where texts were not sent and are not kept: the document is then to be
 * sent whole. With the kind `stopped` it was stopped.
 */
export const documentPreview = (request: PreviewRequest, pages: number[]) =>
  call<Preview>('document_preview', { request, pages });

/** The same of a document that is sent whole. */
export const documentPreviewWhole = (request: DocumentRequest, pages: number[]) =>
  documentPreview(
    {
      ...request,
      document: {
        ...request.document,
        sections: request.document.sections.map((s, i) => ({ ...s, stamp: `?.${i}` })),
      },
    },
    pages,
  );

/** Pages of the document that was made last for a key, as they come into view. */
/** Pages of a preview made before: how many it has, and those asked for. */
export interface PagesOf {
  count: number;
  pages: PreviewPage[];
}

export const documentPreviewPages = (key: string, pages: number[]) =>
  call<PagesOf>('document_preview_pages', { key, pages });

/** Stops what is being made for a key: the preview was closed. */
export const documentPreviewStop = (key: string) => call<void>('document_preview_stop', { key });
export const documentExport = (
  request: DocumentRequest,
  target: Target,
  path: string,
  options: { biblatex?: boolean } = {},
  ticket?: string,
) => call<Exported>('document_export', { request, target, path, options, ticket });
/** Stops the making of a file that was asked for with a ticket: it then fails with the kind `stopped`. */
export const documentExportStop = (ticket: string) =>
  call<void>('document_export_stop', { ticket });
export const openPath = (path: string, reveal = false) => call<void>('open_path', { path, reveal });
