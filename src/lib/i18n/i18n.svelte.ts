/**
 * The words of the interface, in the languages it has (ADR 0020).
 *
 * Every word shown is looked up by a name in the Fluent files under
 * `locales/<language>/`, which are taken into the program when it is built.
 * English is the source: what a translation lacks is said in English, and
 * what English lacks is shown by its name, so that it is seen and mended.
 *
 *     t('search-next')
 *     t('search-found', { count: 3 })
 *
 * `t` reads the language of the interface, which is state: called in the
 * markup, or in `$derived`, what it says changes when the language does.
 * Called once, at the top of a script, it says it once.
 *
 * `document.ftl` holds the words that documents print, which are in the
 * language of the document, not of the interface: see `documentWord`.
 */

import { FluentBundle, FluentResource, type FluentVariable } from '@fluent/bundle';

export type Args = Record<string, FluentVariable>;

/** Every Fluent file, by its path: `/locales/nb/search.ftl`. */
const files = import.meta.glob('/locales/*/*.ftl', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

export const ENGLISH = 'en';

/** A language: its tag, and its name in itself. */
export interface Language {
  tag: string;
  name: string;
}

/**
 * The languages a text can be written in, as the details of a document offer
 * them. Their names are given by the system, in the language of the
 * interface.
 */
export const TEXT_LANGUAGES = [
  'en-GB',
  'en-US',
  'nb',
  'nn',
  'da',
  'sv',
  'de',
  'fr',
  'it',
  'es',
  'pt',
  'nl',
  'el',
  'grc',
  'la',
  'fi',
  'is',
  'pl',
  'cs',
  'ru',
  'tr',
];

function parts(path: string): { tag: string; name: string } | null {
  const m = /\/locales\/([^/]+)\/([^/]+)\.ftl$/.exec(path);
  return m ? { tag: m[1], name: m[2] } : null;
}

function makeBundle(tag: string, document: boolean): FluentBundle | null {
  const sources = Object.entries(files).filter(([path]) => {
    const p = parts(path);
    return p?.tag === tag && (p.name === 'document') === document;
  });
  if (!sources.length) return null;
  // Marks that keep right-to-left text apart are not wanted in these
  // languages, and would stand in what is copied and compared.
  const bundle = new FluentBundle(tag, { useIsolating: false });
  for (const [path, text] of sources) {
    const errors = bundle.addResource(new FluentResource(text));
    for (const error of errors) console.warn(`${path}: ${error.message}`);
  }
  return bundle;
}

const bundles = new Map<string, FluentBundle | null>();
const documentBundles = new Map<string, FluentBundle | null>();

function bundleOf(tag: string): FluentBundle | null {
  if (!bundles.has(tag)) bundles.set(tag, makeBundle(tag, false));
  return bundles.get(tag) ?? null;
}

function documentBundleOf(tag: string): FluentBundle | null {
  if (!documentBundles.has(tag)) documentBundles.set(tag, makeBundle(tag, true));
  return documentBundles.get(tag) ?? null;
}

/** What a bundle says by a name, `message` or `message.attribute`. */
function say(bundle: FluentBundle | null, id: string, args?: Args): string | null {
  if (!bundle) return null;
  const dot = id.indexOf('.');
  const message = bundle.getMessage(dot < 0 ? id : id.slice(0, dot));
  if (!message) return null;
  const pattern = dot < 0 ? message.value : message.attributes[id.slice(dot + 1)];
  if (!pattern) return null;
  const errors: Error[] = [];
  const said = bundle.formatPattern(pattern, args, errors);
  for (const error of errors) console.warn(`${id}: ${error.message}`);
  return said;
}

/** The first part of a tag, in small letters: `nb` of `nb-NO`. */
export function primary(tag: string | null | undefined): string {
  return (tag ?? '')
    .trim()
    .split(/[-_.@]/)[0]
    .toLowerCase();
}

class Languages {
  /** The language of the interface. */
  current = $state(ENGLISH);
  /** What the system says its language is: `nb-NO`. */
  system = $state(ENGLISH);
  /** The languages the interface is in. */
  interface = $state.raw<Language[]>([{ tag: ENGLISH, name: 'English' }]);
  /** The language the interface has when none is chosen. */
  interfaceDefault = $state(ENGLISH);
  /** The languages documents have words of their own in. */
  texts = $state.raw<string[]>([ENGLISH]);
  /** The language new texts are given: the one chosen, or that of the system. */
  newTexts = $state('en-US');
  /** The one new texts are given when none is chosen. */
  textDefault = $state('en-US');
}

export const languages = new Languages();

/** What the interface says by a name, in its language. */
export function t(id: string, args?: Args): string {
  const tag = languages.current;
  return (
    say(bundleOf(tag), id, args) ??
    (tag === ENGLISH ? null : say(bundleOf(ENGLISH), id, args)) ??
    missing(id)
  );
}

const told = new Set<string>();
function missing(id: string): string {
  if (!told.has(id)) {
    told.add(id);
    console.warn(`No words for “${id}”`);
  }
  return id;
}

/** Whether the interface has words by a name. */
export function has(id: string): boolean {
  return say(bundleOf(ENGLISH), id) !== null;
}

/** The language new texts are given, to be written into a new map. */
export function newTextLanguage(): string {
  return languages.newTexts;
}

/** The documents' language nearest to a tag, if documents have words in it. */
function documentTag(language: string | null | undefined): string {
  const p = primary(language) || ENGLISH;
  return p === 'no' ? 'nb' : p;
}

/** A word a document prints, in the language of the document, if documents have words in it. */
export function term(language: string | null | undefined, id: string): string | null {
  return say(documentBundleOf(documentTag(language)), id);
}

let english: Map<string, string> | null = null;

/**
 * A word of a format in the language of the document. The formats have
 * their words in English; one that is among the words of documents
 * ("Figure", "Notes") is given in the language of the document, with its
 * capitals as they were; one of the format's own is kept. As the core does
 * it (`i18n::in_language`).
 */
export function documentWord(language: string | null | undefined, word: string): string {
  if (!english) {
    english = new Map();
    const bundle = documentBundleOf(ENGLISH);
    for (const [path, text] of Object.entries(files)) {
      const p = parts(path);
      if (p?.tag !== ENGLISH || p.name !== 'document') continue;
      for (const id of names(text)) {
        const said = say(bundle, id);
        if (said) english.set(said.toLowerCase(), id);
      }
    }
  }
  const trimmed = word.trim();
  const id = english.get(trimmed.toLowerCase());
  const said = id ? term(language, id) : null;
  if (!said) return word;
  const letters = [...trimmed].filter((c) => c.toLowerCase() !== c.toUpperCase());
  if (letters.length > 1 && letters.every((c) => c === c.toUpperCase())) return said.toUpperCase();
  if (letters.length && letters[0] !== letters[0].toUpperCase())
    return said[0].toLowerCase() + said.slice(1);
  return said;
}

/** The names of the messages in the text of a Fluent file. */
export function names(text: string): string[] {
  return text
    .split('\n')
    .filter((line) => /^[a-zA-Z]/.test(line) && line.includes('='))
    .map((line) => line.slice(0, line.indexOf('=')).trim());
}

/** The name of a language, in the language of the interface: "Norwegian Bokmål", "norsk bokmål". */
export function languageName(tag: string): string {
  try {
    const names = new Intl.DisplayNames([languages.current], { type: 'language' });
    const name = names.of(tag) ?? tag;
    return name.charAt(0).toLocaleUpperCase(languages.current) + name.slice(1);
  } catch {
    return tag;
  }
}

/** The files, for the tests. */
export const allFiles = files;
