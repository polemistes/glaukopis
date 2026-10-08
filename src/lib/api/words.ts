/**
 * The Fluent files of a folder, read and written, for the words of a
 * language written out from a project of words (ADR 0034).
 */

import { call } from './backend';

export interface WordsFile {
  name: string;
  text: string;
}

export const wordsRead = (dir: string) => call<WordsFile[]>('words_read', { dir });
export const wordsWrite = (dir: string, files: WordsFile[]) =>
  call<void>('words_write', { dir, files });
