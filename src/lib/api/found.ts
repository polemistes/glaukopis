/**
 * Citations that were found in a text that was written elsewhere, and what
 * the library has for them. The shapes are those of `crates/core/src/found`,
 * where they are told of at length.
 */

import type { CiteMode } from '$lib/editor/schema';
import { call } from './backend';
import type { Draft } from './library';

/** By what a citation was found: a program that keeps references, a tag in a file of text, or how it looks. */
export type FoundBy = 'zotero' | 'mendeley' | 'key' | 'form';

/** One work that is cited, as the text it was found in has it. */
export interface FoundItem {
  /** The tag that names the reference, in a file of text. */
  key?: string;
  /** The addresses of the item, as Zotero gives them. */
  uris?: string[];
  /** What the program that made the citation says of the work, in the form of CSL. */
  data?: Record<string, unknown>;
  locator?: string;
  /** What the locator counts, as CSL names it. Absent for pages. */
  label?: string;
  prefix?: string;
  suffix?: string;
  suppressAuthor?: boolean;
}

/** What the mark `found` holds. */
export interface Found {
  /** One for all the text of one citation, where other marks cut it in pieces. */
  id: string;
  by: FoundBy;
  items: FoundItem[];
  mode: CiteMode;
  /** The writer has said that this is to be left as text. */
  left?: boolean;
}

export type Sure = 'possible' | 'likely' | 'certain';

/** A reference of the library that may be what is cited. */
export interface Suggestion {
  /** The id of the reference. */
  reference: string;
  sure: Sure;
  /** Why, in a few words. */
  why: string;
}

/** Text in which citations are looked for. Places are in units of UTF-16, as those of strings here. */
export interface Passage {
  id: string;
  /** The text without its marks; what is no text is one U+FFFC each. */
  text: string;
  note: boolean;
  /** The parts that are not to be looked at. */
  taken: [number, number][];
}

export interface FoundOptions {
  /** Parentheses with a year in them are citations. */
  years: boolean;
  /** A note that names a work of the library cites it. */
  named: boolean;
  /** Every note cites. */
  notes: boolean;
}

export interface ProposedItem {
  start: number;
  end: number;
  /** The words that name the work. */
  words: string;
  locator?: string;
  label?: string;
  prefix?: string;
  suffix?: string;
  suppressAuthor: boolean;
  suggestions: Suggestion[];
}

/** Something in a passage that looks like a citation. */
export interface Proposal {
  passage: string;
  start: number;
  end: number;
  mode: CiteMode;
  items: ProposedItem[];
}

/** For each work that is cited, the references of the library it may be, the likeliest first. */
export const foundSuggest = (items: FoundItem[]) =>
  call<Suggestion[][]>('found_suggest', { items });

/** What looks like citations in the passages. */
export const foundPropose = (passages: Passage[], options: FoundOptions) =>
  call<Proposal[]>('found_propose', { passages, options });

/** What is said of a work, as a reference that can be added to the library. */
export const foundDraft = (data: Record<string, unknown>) =>
  call<Draft | null>('found_draft', { data });
