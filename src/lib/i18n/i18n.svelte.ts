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
 * English is always at hand. The files of another language are loaded when
 * the language is first asked for, since there are many languages and one
 * is read at a time: `load` fetches them, and `t` says English until they
 * are there, then says the language. The application loads the language of
 * the interface before it shows anything (App.svelte).
 *
 * `document.ftl` holds the words that documents print, which are in the
 * language of the document, not of the interface: see `documentWord`. Those
 * are small, and are at hand in every language.
 */

import { FluentBundle, FluentResource, type FluentVariable } from '@fluent/bundle';

export type Args = Record<string, FluentVariable>;

/** The English files, and the words of documents in every language, by path: `/locales/nb/document.ftl`. */
const atHand = {
  ...import.meta.glob('/locales/en/*.ftl', { query: '?raw', import: 'default', eager: true }),
  ...import.meta.glob('/locales/*/document.ftl', { query: '?raw', import: 'default', eager: true }),
} as Record<string, string>;

/** The files of every language, each fetched when asked for. */
const fetched = import.meta.glob('/locales/*/*.ftl', {
  query: '?raw',
  import: 'default',
}) as Record<string, () => Promise<string>>;

export const ENGLISH = 'en';

/** A language: its tag, and its name in itself. */
export interface Language {
  tag: string;
  name: string;
}

/**
 * The languages a text can be written in, as the details of a document offer
 * them. Their names are given by the system, in the language of the
 * interface. A text may be in a language documents have no words in; it is
 * then printed with English words.
 */
export const TEXT_LANGUAGES = [
  'en-GB',
  'en-US',
  'nb',
  'nn',
  'da',
  'sv',
  'fi',
  'is',
  'de',
  'nl',
  'fr',
  'it',
  'es',
  'pt-PT',
  'pt-BR',
  'ro',
  'el',
  'grc',
  'la',
  'pl',
  'cs',
  'sk',
  'sl',
  'hr',
  'bs',
  'sr-Cyrl',
  'sr-Latn',
  'uk',
  'be',
  'ru',
  'sq',
  'tr',
  'hi',
  'bn',
  'mr',
  'gu',
  'ta',
  'te',
  'zh-Hans',
  'zh-Hant',
  'ja',
];

function parts(path: string): { tag: string; name: string } | null {
  const m = /\/locales\/([^/]+)\/([^/]+)\.ftl$/.exec(path);
  return m ? { tag: m[1], name: m[2] } : null;
}

function makeBundle(tag: string, sources: [string, string][]): FluentBundle | null {
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
const loading = new Map<string, Promise<void>>();

/** Counts the languages that have been loaded, so that what `t` said is said anew when one arrives. */
let arrived = $state(0);

/**
 * Loads the words of a language, if they are not at hand. Nothing happens
 * for English, which always is, nor for a language that has no words.
 */
export function load(tag: string): Promise<void> {
  if (bundles.has(tag)) return Promise.resolve();
  let pending = loading.get(tag);
  if (!pending) {
    pending = (async () => {
      const files = Object.entries(fetched).filter(([path]) => {
        const p = parts(path);
        return p?.tag === tag && p.name !== 'document';
      });
      const sources: [string, string][] = [];
      for (const [path, fetch] of files) {
        const text = atHand[path] ?? (await fetch());
        sources.push([path, text]);
      }
      bundles.set(tag, makeBundle(tag, sources));
      loading.delete(tag);
      arrived++;
    })();
    loading.set(tag, pending);
  }
  return pending;
}

/** The bundle of a language, if it has been loaded; English is loaded at once. */
function bundleOf(tag: string): FluentBundle | null {
  if (!bundles.has(tag)) {
    if (tag === ENGLISH) {
      const sources = Object.entries(atHand).filter(([path]) => {
        const p = parts(path);
        return p?.tag === ENGLISH && p.name !== 'document';
      });
      bundles.set(ENGLISH, makeBundle(ENGLISH, sources));
    } else {
      load(tag).catch((error) => console.warn(`The words of ${tag} could not be loaded: ${error}`));
      return null;
    }
  }
  return bundles.get(tag) ?? null;
}

/** The languages documents have words in: those with a `document.ftl`. */
const documentLanguages = Object.keys(atHand)
  .map(parts)
  .filter((p) => p?.name === 'document')
  .map((p) => p!.tag);

function documentBundleOf(tag: string): FluentBundle | null {
  if (!documentBundles.has(tag)) {
    const sources = Object.entries(atHand).filter(([path]) => {
      const p = parts(path);
      return p?.tag === tag && p.name === 'document';
    });
    documentBundles.set(tag, makeBundle(tag, sources));
  }
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

/** A tag taken apart: the language in small letters, the script as `Latn`, the region as `BR`. */
function pieces(tag: string | null | undefined): {
  language: string;
  script: string | null;
  region: string | null;
} {
  const [head, modifier] = (tag ?? '').trim().split('.')[0].split('@');
  const subtags = head.split(/[-_]/).filter(Boolean);
  const language = (subtags.shift() ?? '').toLowerCase();
  let script: string | null = null;
  let region: string | null = null;
  for (const s of subtags) {
    if (/^[a-z]{4}$/i.test(s) && !script) script = s[0].toUpperCase() + s.slice(1).toLowerCase();
    else if (/^([a-z]{2}|\d{3})$/i.test(s) && !region) region = s.toUpperCase();
  }
  if (modifier === 'latin') script = 'Latn';
  if (modifier === 'cyrillic') script = 'Cyrl';
  return { language: language === 'no' ? 'nb' : language, script, region };
}

/**
 * The tag among those available that is nearest to a tag: the same with its
 * script and region, then with its script, then with its region, then the
 * language alone; then what the language means without more (Portuguese is
 * Portugal's, Chinese is simplified, Serbian is Cyrillic, unless the region
 * or the script says otherwise); then any of the language. Nothing, where
 * the language is not among them.
 */
export function nearest(
  tag: string | null | undefined,
  available: readonly string[],
): string | null {
  const { language, script, region } = pieces(tag);
  if (!language) return null;
  const has = (t: string) => available.find((a) => a.toLowerCase() === t.toLowerCase()) ?? null;
  const tries = [
    script && region ? `${language}-${script}-${region}` : null,
    script ? `${language}-${script}` : null,
    region ? `${language}-${region}` : null,
    language,
  ];
  for (const t of tries) {
    const found = t && has(t);
    if (found) return found;
  }
  const usual: Record<string, string> = {
    pt: region === 'BR' ? 'pt-BR' : 'pt-PT',
    zh: script === 'Hant' || ['TW', 'HK', 'MO'].includes(region ?? '') ? 'zh-Hant' : 'zh-Hans',
    sr: script === 'Latn' ? 'sr-Latn' : 'sr-Cyrl',
  };
  const found = usual[language] && has(usual[language]);
  if (found) return found;
  return available.find((a) => primary(a) === language) ?? null;
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
  // Read, so that what is said is said anew when a language arrives.
  void arrived;
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
  return nearest(language?.trim() ? language : ENGLISH, documentLanguages) ?? primary(language);
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
    for (const [path, text] of Object.entries(atHand)) {
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
