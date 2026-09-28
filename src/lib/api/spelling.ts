/**
 * Spelling: the dictionaries there are, the checking of words, and the
 * writer's own words. The shapes are those of `crates/core/src/spelling`.
 *
 * The language is that of a map, as its document has it (`en-GB`, `nb`);
 * none is English, which is checked with the American and the British
 * dictionary both.
 */

import { call } from './backend';

/** Where a dictionary was found. */
export type DictionarySource = 'own' | 'application' | 'system';

/** A dictionary that was found. */
export interface Dictionary {
  /** The language it is for: `en-US`, `nb-NO`. */
  tag: string;
  /** The name of its files: `en_US`. */
  name: string;
  source: DictionarySource;
  /** The folder its files are in. */
  dir: string;
}

/** How a text in a language is checked. */
export interface Checking {
  /** One dictionary, or for English without a country, two. */
  dictionaries: Dictionary[];
  /** The script of their words, as ISO 15924 names it: `Latn`. */
  script: string | null;
  /** The language whose list of the writer's own words holds: `en`. */
  words: string;
}

/** The dictionaries there are, looked for anew. */
export const spellingLanguages = () => call<Dictionary[]>('spelling_languages');

/** How a text in the language is checked, with its dictionaries read; null where there is none. */
export const spellingPrepare = (language: string | null) =>
  call<Checking | null>('spelling_prepare', { language });

/** For each word, whether it is right in the language. */
export const spellingCheck = (language: string | null, words: string[]) =>
  call<boolean[]>('spelling_check', { language, words });

/** What a misspelt word may be, the likeliest first. */
export const spellingSuggest = (language: string | null, word: string) =>
  call<string[]>('spelling_suggest', { language, word });

/** The writer's own words, by language (`en`, `nb`). */
export const spellingWords = () => call<Record<string, string[]>>('spelling_words');

/** Adds a word to the writer's own, for the language of a text. */
export const spellingAddWord = (language: string | null, word: string) =>
  call<void>('spelling_add_word', { language, word });

/** Takes a word away from the writer's own words of a language (`en`). */
export const spellingRemoveWord = (language: string, word: string) =>
  call<void>('spelling_remove_word', { language, word });
