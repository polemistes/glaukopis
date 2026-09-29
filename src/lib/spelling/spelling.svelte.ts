/**
 * Spelling as the interface keeps it (ADR 0019): how each language is
 * checked, what is known of each word, and the words that are still to be
 * asked about, which are asked in batches. What is known is kept for all
 * the editors and for the text that is drawn without one, so that a word is
 * asked about once in each language.
 *
 * The language is that of a map (`document.language`): `en-GB`, `nb`; none
 * is English, which the core checks with both English dictionaries.
 */

import { SvelteMap } from 'svelte/reactivity';
import {
  spellingAddWord,
  spellingCheck,
  spellingPrepare,
  spellingRemoveWord,
  spellingSuggest,
  type Checking,
} from '$lib/api/spelling';
import { settings } from '$lib/state/settings.svelte';

/** How many words are asked about at once. */
const BATCH = 800;
/** How long words are gathered before they are asked about, in milliseconds. */
const GATHER = 25;

/** What has changed, for those that show the words. */
export type Change =
  /** Words have been answered: what waited for them can be shown. */
  | 'answered'
  /** What was known may be otherwise now: everything is to be looked at again. */
  | 'anew';

/** A language as maps have it, as a key: none is English. */
export function languageKey(language: string | null | undefined): string {
  return (language ?? '').trim();
}

/** What a word is as the dictionaries know it, lower case aside. */
function fold(word: string): string {
  return word.replace(/\.+$/, '').toLocaleLowerCase();
}

class Spelling {
  /** How each language is checked; null where there is no dictionary for it. */
  readonly checking = new SvelteMap<string, Checking | null>();
  /** Why a language could not be made ready, where it could not. */
  readonly failed = new SvelteMap<string, string>();

  #preparing = new Map<string, Promise<Checking | null>>();
  /** What is known of words, by the dictionaries that were asked: `en-US+en-GB`. */
  #known = new Map<string, Map<string, boolean>>();
  /** Words to be asked about, and those that are being asked about, by language. */
  #waiting = new Map<string, Set<string>>();
  #asked = new Map<string, Set<string>>();
  #timer: ReturnType<typeof setTimeout> | undefined;
  #listeners = new Set<(change: Change) => void>();
  #suggested = new Map<string, Promise<string[]>>();

  /** Whether spelling is checked: the setting, which is on at first. */
  get on(): boolean {
    return settings.value.spelling !== false;
  }

  /** Tells what has changed to what shows the words. Returns what stops it. */
  listen(listener: (change: Change) => void): () => void {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  #tell(change: Change) {
    for (const listener of this.#listeners) {
      try {
        listener(change);
      } catch (error) {
        console.error('spelling: what shows the words failed', error);
      }
    }
  }

  /** Everything is to be looked at again: the setting has changed, or a word was taken away. */
  anew() {
    this.#tell('anew');
  }

  /**
   * How a language is checked, where that is known; undefined while it is
   * being found out, which is begun if it was not.
   */
  checkingOf(language: string | null | undefined): Checking | null | undefined {
    const key = languageKey(language);
    if (this.checking.has(key)) return this.checking.get(key);
    void this.prepare(key);
    return undefined;
  }

  /** Makes a language ready: its dictionaries are read, if there are any. */
  prepare(language: string | null | undefined): Promise<Checking | null> {
    const key = languageKey(language);
    let ready = this.#preparing.get(key);
    if (!ready) {
      ready = spellingPrepare(key || null)
        .then((checking) => {
          this.checking.set(key, checking);
          this.failed.delete(key);
          return checking;
        })
        .catch((error) => {
          // Not checked, with the reason kept to be shown; tried again when next asked.
          this.#preparing.delete(key);
          this.failed.set(key, error?.message ?? String(error));
          this.checking.set(key, null);
          return null;
        })
        .finally(() => this.#tell('answered'));
      this.#preparing.set(key, ready);
    }
    return ready;
  }

  #knownOf(checking: Checking): Map<string, boolean> {
    const by = checking.dictionaries.map((d) => d.tag).join('+');
    let known = this.#known.get(by);
    if (!known) {
      known = new Map();
      this.#known.set(by, known);
    }
    return known;
  }

  /**
   * Whether a word is right in a language: true or false where it is known,
   * and undefined where it is not yet, in which case it is asked about. In
   * a language without a dictionary every word is right.
   */
  judge(language: string | null | undefined, asked: string): boolean | undefined {
    const key = languageKey(language);
    const checking = this.checkingOf(key);
    if (checking === null) return true;
    if (checking) {
      const known = this.#knownOf(checking).get(asked);
      if (known !== undefined) return known;
    }
    this.#ask(key, asked);
    return undefined;
  }

  #ask(key: string, asked: string) {
    if (this.#asked.get(key)?.has(asked)) return;
    let waiting = this.#waiting.get(key);
    if (!waiting) {
      waiting = new Set();
      this.#waiting.set(key, waiting);
    }
    waiting.add(asked);
    this.#timer ??= setTimeout(() => {
      this.#timer = undefined;
      void this.#flush();
    }, GATHER);
  }

  async #flush() {
    const all = [...this.#waiting];
    this.#waiting.clear();
    await Promise.all(all.map(([key, words]) => this.#askAll(key, [...words])));
  }

  async #askAll(key: string, words: string[]) {
    const checking = await this.prepare(key);
    if (!checking) return;
    const known = this.#knownOf(checking);
    let asked = this.#asked.get(key);
    if (!asked) {
      asked = new Set();
      this.#asked.set(key, asked);
    }
    const todo = words.filter((w) => !known.has(w) && !asked.has(w));
    for (const w of todo) asked.add(w);
    for (let i = 0; i < todo.length; i += BATCH) {
      const batch = todo.slice(i, i + BATCH);
      try {
        const right = await spellingCheck(key || null, batch);
        batch.forEach((w, n) => known.set(w, right[n] !== false));
      } catch (error) {
        // Not known, and so not shown as wrong.
        console.error('spelling: words could not be checked', error);
        for (const w of batch) known.set(w, true);
      } finally {
        for (const w of batch) asked.delete(w);
      }
      this.#tell('answered');
    }
  }

  /** What a misspelt word may be, the likeliest first. Asked once for each word. */
  suggest(language: string | null | undefined, word: string): Promise<string[]> {
    const key = `${languageKey(language)}\n${word}`;
    let found = this.#suggested.get(key);
    if (!found) {
      found = this.prepare(language).then((checking) =>
        checking ? spellingSuggest(languageKey(language) || null, word) : [],
      );
      found.catch(() => this.#suggested.delete(key));
      this.#suggested.set(key, found);
    }
    return found;
  }

  /** Forgets what is known of a word in the languages whose own words are those of `words`. */
  #forget(words: string, word: string) {
    const folded = fold(word);
    for (const checking of this.checking.values()) {
      if (!checking || checking.words !== words) continue;
      const known = this.#knownOf(checking);
      for (const w of [...known.keys()]) if (fold(w) === folded) known.delete(w);
    }
    for (const key of [...this.#suggested.keys()]) this.#suggested.delete(key);
  }

  /** Adds a word to the writer's own, for the language of a text. */
  async addWord(language: string | null | undefined, word: string) {
    const checking = await this.prepare(language);
    await spellingAddWord(languageKey(language) || null, word);
    if (checking) {
      this.#forget(checking.words, word);
      // Known at once to be right, as it is written.
      this.#knownOf(checking).set(word, true);
    }
    this.#tell('anew');
  }

  /** Takes a word away from the writer's own words of a language (`en`). */
  async removeWord(words: string, word: string) {
    await spellingRemoveWord(words, word);
    this.#forget(words, word);
    this.#tell('anew');
  }
}

export const spelling = new Spelling();

/**
 * Whether a word is among those ignored in a project. One written in small
 * letters is ignored with a capital as well, as at the start of a sentence.
 */
export function isIgnored(ignored: ReadonlySet<string>, word: string): boolean {
  if (!ignored.size) return false;
  return ignored.has(word) || ignored.has(word.toLocaleLowerCase());
}
