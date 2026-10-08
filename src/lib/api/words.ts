/**
 * The Fluent files of a folder, read and written, for the words of a
 * language written out from a project of words (ADR 0034); and the own
 * words of the data directory, laid over those built in (ADR 0035).
 */

import { call } from './backend';

export interface WordsFile {
  name: string;
  text: string;
}

export const wordsRead = (dir: string) => call<WordsFile[]>('words_read', { dir });
export const wordsWrite = (dir: string, files: WordsFile[]) =>
  call<void>('words_write', { dir, files });

/** The own words of a language: its tag, and its Fluent files. */
export interface OwnWordsOf {
  tag: string;
  files: WordsFile[];
}

/** An own message the core left out, and why. */
export interface LeftOut {
  language: string;
  file: string;
  id: string;
  why: string;
}

/** The own words of every language that has some. */
export const wordsOwn = () => call<OwnWordsOf[]>('words_own');
/** Writes Fluent files into the own words of a language. */
export const wordsOwnWrite = (tag: string, files: WordsFile[]) =>
  call<void>('words_own_write', { tag, files });
/** Takes away the own words of a language, or of all; the core reads its words again. */
export const wordsOwnRemove = (tag: string | null) => call<LeftOut[]>('words_own_remove', { tag });
/** Has the core read its own words again. */
export const wordsOwnUse = () => call<LeftOut[]>('words_own_use');
