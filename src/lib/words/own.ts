/**
 * The own words (ADR 0035): Fluent files in the data directory, a folder for
 * each language, laid over the words built in, by the interface and by the
 * core. Read at the start, and again when they are changed or taken away.
 */

import {
  wordsOwn,
  wordsOwnRemove,
  wordsOwnUse,
  wordsOwnWrite,
  type LeftOut,
  type WordsFile,
} from '$lib/api/words';
import { setOwnWords } from '$lib/i18n';

/**
 * Has the interface and the core read their own words again, and lay them
 * over the words built in, so that what `t` says is said anew. What the core
 * left out; what the interface left out is told by `ownLeftOut`.
 */
export async function readOwnWords(): Promise<LeftOut[]> {
  const [all, core] = await Promise.all([wordsOwn(), wordsOwnUse()]);
  setOwnWords(new Map(all.map((o) => [o.tag, new Map(o.files.map((f) => [f.name, f.text]))])));
  return core;
}

/** The own words of a language, by the name of the file; none where it has none. */
export async function ownWordsOf(tag: string): Promise<Map<string, string>> {
  const all = await wordsOwn();
  return new Map((all.find((o) => o.tag === tag)?.files ?? []).map((f) => [f.name, f.text]));
}

/** Writes files into the own words of a language, and has them read again. */
export async function writeOwnWords(tag: string, files: WordsFile[]): Promise<void> {
  if (files.length) await wordsOwnWrite(tag, files);
  await readOwnWords();
}

/** Takes away the own words of a language, or of all, and has the words built in read again. */
export async function removeOwnWords(tag: string | null = null): Promise<void> {
  await wordsOwnRemove(tag);
  await readOwnWords();
}
