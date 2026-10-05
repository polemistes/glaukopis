/** Preview and export, reference styles, document formats. Mirrors `commands/documents.rs`. */

import type { Block, Inline } from '$lib/project/model/text';
import { call } from './backend';

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
export type Position =
  'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';

export interface HeadingLevel {
  size: number;
  bold: boolean;
  italic: boolean;
  align: Align;
  case: Case;
  runIn: boolean;
  /** The heading begins a new page: a chapter of a book. */
  newPage: boolean;
  indent: boolean;
  spaceBefore: string;
  spaceAfter: string;
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
  /** What stands in a passage that holds no text of its own: the sign of a break. */
  text?: string;
}

/** Of paragraphs, or of words within them. */
export type KindFamily = 'paragraph' | 'words';

/** A kind that comes with the application, as the core has it: see `formats/kinds.rs`. */
export interface KindEntry {
  id: string;
  family: KindFamily;
  /** The group the tools show it in. */
  group: string;
  /** The id of the kind it is based on; nothing for text, or plain words. */
  basedOn: string | null;
  /** The name of its style in Word and Writer; empty where it has none. */
  style: string;
  /** How it differs from what it is based on. */
  look: Look;
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
  /** Kinds the format puts in the writer's hand, by id. */
  suggests?: string[];
  page: {
    size: string;
    width: string;
    height: string;
    marginTop: string;
    marginBottom: string;
    marginLeft: string;
    marginRight: string;
  };
  font: { family: string; size: number };
  text: {
    lineSpacing: number;
    align: Align;
    paragraphs: 'indent' | 'spaced';
    indent: string;
    indentFirst: boolean;
    spaceBetween: string;
    hyphenate: boolean;
    /** How italics are set: as italics, or underlined as typewritten manuscripts had them. */
    italics: 'italic' | 'underline';
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
  pageNumbers: { show: boolean; position: Position; firstPage: boolean };
  runningHead: {
    content: 'none' | 'title' | 'author' | 'author-title' | 'text';
    text: string;
    align: Align;
    case: Case;
  };
  lineNumbers: boolean;
  style?: string;
  limits: {
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
}

export interface ExportAuthor {
  name: string;
  affiliation?: string;
  email?: string;
  orcid?: string;
}

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
  authors: ExportAuthor[];
  date?: string;
  abstract?: string;
  keywords: string[];
  /** The cover of an e-book: a picture, by its hash, and its kind of file. */
  cover?: { hash: string; extension: string };
  language?: string;
  sections: ExportSection[];
  references: ExportReference[];
  /** The kinds of paragraph and of words that are the writer's own, which the project carries. */
  kinds?: OwnKind[];
}

export interface DocumentRequest {
  document: ExportDocument;
  style: string;
  format: DocumentFormat;
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

export interface Preview {
  /** How many pages the document has. */
  count: number;
  /** The pages that were asked for. */
  pages: PreviewPage[];
  width: number;
  height: number;
  /** Where each element of the map begins, in the order of the text. */
  places: Place[];
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
export const documentPreviewPages = (key: string, pages: number[]) =>
  call<{ count: number; pages: PreviewPage[] }>('document_preview_pages', { key, pages });

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
