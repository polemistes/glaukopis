/**
 * Languages of spelling and of OCR that are imported (ADR 0032): those
 * there are, those a server offers, and the importing and taking away of
 * them. The shapes are those of `crates/core/src/languages.rs`.
 */

import { call } from './backend';

/** What a language is for. */
export type LanguageKind = 'spelling' | 'ocr';

/** The server packages come from unless the settings say another. */
export const DEFAULT_LANGUAGES_SERVER = 'https://robertemilberge.no/glaukopis/';

/** A language that is imported. */
export interface InstalledLanguage {
  kind: LanguageKind;
  /** The name of its files: `nb_NO`, `nor`. */
  name: string;
  /** Its language as a tag: `nb-NO`; for OCR it may be empty. */
  language: string;
  title: string;
  version: string;
  licence: string;
  source: string;
}

/** A package a server offers. */
export interface OfferedLanguage {
  kind: LanguageKind;
  name: string;
  language: string;
  title: string;
  version: string;
  file: string;
  /** In bytes. */
  size: number;
  sha256: string;
  licence: string;
  source: string;
}

/** What a server offers, and which it is. */
export interface LanguageOffer {
  server: string;
  packages: OfferedLanguage[];
}

export const languagesInstalled = () => call<InstalledLanguage[]>('languages_installed');

/** What a server offers: the one given, or that of the settings. */
export const languagesOffered = (server: string | null) =>
  call<LanguageOffer>('languages_offered', { server });

/** Fetches a package from the server and imports it. */
export const languagesInstall = (server: string | null, offered: OfferedLanguage) =>
  call<InstalledLanguage[]>('languages_install', { server, offered });

/** Imports files: packages, extensions of dictionaries, the files of a dictionary, or data for Tesseract. */
export const languagesImport = (paths: string[]) =>
  call<InstalledLanguage[]>('languages_import', { paths });

export const languagesRemove = (kind: LanguageKind, name: string) =>
  call<void>('languages_remove', { kind, name });
