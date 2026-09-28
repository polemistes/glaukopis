/** Preview and export, reference styles, document formats. Mirrors `commands/documents.rs`. */

import type { Block, Inline } from '$lib/project/model/text';
import { call } from './backend';

export interface Tool {
  path: string;
  version: string;
}

export interface ToolsInfo {
  pandoc: Tool | null;
  typst: Tool | null;
  latex: string[];
  pandocApi: number[];
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

export type FormatKind = 'general' | 'style-guide' | 'publisher' | 'journal' | 'own';

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
  indent: boolean;
  spaceBefore: string;
  spaceAfter: string;
}

/** See `crates/core/src/formats/mod.rs`, where every parameter is explained. */
export interface DocumentFormat {
  id: string;
  name: string;
  kind: FormatKind;
  description: string;
  source?: { name: string; url: string; checked: string; confidence: string; notes: string };
  basedOn?: string;
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
  equations: { beforeNumber: string; afterNumber: string };
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
  language?: string;
  sections: ExportSection[];
  references: ExportReference[];
}

export interface DocumentRequest {
  document: ExportDocument;
  style: string;
  format: DocumentFormat;
  key: string;
}

export interface Preview {
  pages: string[];
  width: number;
  height: number;
  warnings: string[];
  missing: string[];
  substitute: string | null;
}

export type Target = 'pdf' | 'pdflatex' | 'docx' | 'odt' | 'latex' | 'markdown' | 'html' | 'typst';

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

export const documentPreview = (request: DocumentRequest) =>
  call<Preview>('document_preview', { request });
export const documentExport = (
  request: DocumentRequest,
  target: Target,
  path: string,
  options: { biblatex?: boolean } = {},
) => call<Exported>('document_export', { request, target, path, options });
export const openPath = (path: string, reveal = false) => call<void>('open_path', { path, reveal });
