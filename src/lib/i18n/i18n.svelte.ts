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
 *
 * Own words (ADR 0035), Fluent files of the data directory, are laid over the
 * words built in: a message there takes the place of the one of the same
 * name, where it fits the English built in (`setOwnWords`).
 */

import { FluentBundle, FluentResource, type FluentVariable } from '@fluent/bundle';
import { fault, readFile } from '$lib/words/fluent';

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

/** The languages that have words: every folder under `locales/`. */
export function localeTags(): string[] {
  const tags = new Set<string>();
  for (const path of Object.keys(fetched)) {
    const p = parts(path);
    if (p) tags.add(p.tag);
  }
  return [...tags].sort();
}

/**
 * The Fluent files of a language as they are written, by name
 * (`common.ftl`), the words of documents among them: for making a project of
 * them (`words/`).
 */
export async function localeSources(tag: string): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  for (const [path, fetch] of Object.entries(fetched)) {
    const p = parts(path);
    if (p?.tag !== tag) continue;
    out.set(`${p.name}.ftl`, atHand[path] ?? (await fetch()));
  }
  return new Map([...out].sort(([a], [b]) => a.localeCompare(b)));
}

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

/** The own words of every language that has some: its files by name (`common.ftl`). */
export type OwnWords = Map<string, Map<string, string>>;

/** An own message left out, and why. */
export interface LeftOut {
  language: string;
  file: string;
  id: string;
  why: string;
}

/** The own words laid over those built in. */
let own: OwnWords = new Map();
/** What of the own words did not fit, and was left out. */
let leftOut: LeftOut[] = [];

/** The parts of the English messages built in, `name` or `name.hint`, with their text: of the interface, or of documents. */
const englishParts = new Map<boolean, Map<string, string>>();
function englishPartsOf(document: boolean): Map<string, string> {
  let found = englishParts.get(document);
  if (!found) {
    found = new Map();
    for (const [path, text] of Object.entries(atHand)) {
      const p = parts(path);
      if (p?.tag !== ENGLISH || (p.name === 'document') !== document) continue;
      for (const [key, part] of readFile(text).parts)
        if (!found.has(key)) found.set(key, part.text);
    }
    englishParts.set(document, found);
  }
  return found;
}

/**
 * The messages of a file of own words that fit: each is good Fluent, and
 * each of its parts has the variables and the references of the English
 * built in, and the plural forms of the language. As one text, to be laid
 * over the words built in; with what was left out.
 */
export function fitting(
  tag: string,
  file: string,
  text: string,
): { text: string; count: number; left: LeftOut[] } {
  const english = englishPartsOf(file === 'document.ftl');
  const read = readFile(text);
  const good: string[] = [];
  const left: LeftOut[] = [];
  for (const m of read.messages) {
    let why: string | null = m.parts.length ? null : 'no text';
    for (const p of m.parts) {
      const theirs = english.get(p.key);
      const wrong = theirs === undefined ? null : fault(tag, read.parts.get(p.key)!.text, theirs);
      if (theirs === undefined) why = `${p.key} is not among the English words`;
      else if (wrong) why = `${p.key}: ${wrong.kind} ${wrong.detail}`;
      if (why) break;
    }
    if (why) left.push({ language: tag, file, id: m.id, why });
    else good.push(text.slice(m.start, m.end));
  }
  // What is not good Fluent is not among the messages read, but is told.
  if (read.faulty) left.push({ language: tag, file, id: '…', why: 'not good Fluent' });
  return { text: good.join('\n') + (good.length ? '\n' : ''), count: good.length, left };
}

function makeBundle(
  tag: string,
  sources: [string, string][],
  ownFiles?: Map<string, string>,
  document = false,
): FluentBundle | null {
  if (!sources.length) return null;
  // Marks that keep right-to-left text apart are not wanted in these
  // languages, and would stand in what is copied and compared.
  const bundle = new FluentBundle(tag, { useIsolating: false });
  for (const [path, text] of sources) {
    const errors = bundle.addResource(new FluentResource(text));
    for (const error of errors) console.warn(`${path}: ${error.message}`);
  }
  for (const [file, text] of ownFiles ?? []) {
    if ((file === 'document.ftl') !== document) continue;
    const fit = fitting(tag, file, text);
    for (const l of fit.left)
      console.warn(`Own words, ${tag}/${l.file}: ${l.id} is left out: ${l.why}`);
    leftOut.push(...fit.left);
    if (fit.count) bundle.addResource(new FluentResource(fit.text), { allowOverrides: true });
  }
  return bundle;
}

const bundles = new Map<string, FluentBundle | null>();
const documentBundles = new Map<string, FluentBundle | null>();
/** The files of the languages loaded, as they are built in, by path. */
const builtIn = new Map<string, [string, string][]>();
const loading = new Map<string, Promise<void>>();

/** Counts the languages that have been loaded, so that what `t` said is said anew when one arrives. */
let arrived = $state(0);

/**
 * Loads the words of a language, if they are not at hand. Nothing happens
 * for English, which always is, nor for a language that has no words.
 */
export function load(tag: string): Promise<void> {
  if (tag === ENGLISH || builtIn.has(tag)) return Promise.resolve();
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
      builtIn.set(tag, sources);
      bundles.delete(tag);
      loading.delete(tag);
      arrived++;
    })();
    loading.set(tag, pending);
  }
  return pending;
}

/**
 * Lays own words over the words built in, in place of those laid over
 * before, and has what `t` said said anew. What does not fit is left out
 * (`ownLeftOut`), and the built-in words stand.
 */
export function setOwnWords(files: OwnWords) {
  own = new Map([...files].filter(([, f]) => f.size));
  leftOut = [];
  bundles.clear();
  documentBundles.clear();
  languages.own = [...own.keys()].sort();
  arrived++;
}

/** What of the own words was left out, of the languages read since they were set. */
export function ownLeftOut(): LeftOut[] {
  return leftOut;
}

/** The bundle of a language, if it has been loaded; English is loaded at once. */
function bundleOf(tag: string): FluentBundle | null {
  const made = bundles.get(tag);
  if (made !== undefined) return made;
  const sources =
    tag === ENGLISH
      ? Object.entries(atHand).filter(([path]) => {
          const p = parts(path);
          return p?.tag === ENGLISH && p.name !== 'document';
        })
      : builtIn.get(tag);
  if (!sources) {
    load(tag).catch((error) => console.warn(`The words of ${tag} could not be loaded: ${error}`));
    return null;
  }
  const bundle = makeBundle(tag, sources, own.get(tag));
  bundles.set(tag, bundle);
  return bundle;
}

/** The languages documents have words in: those with a `document.ftl`. */
const documentLanguages = Object.keys(atHand)
  .map(parts)
  .filter((p) => p?.name === 'document')
  .map((p) => p!.tag);

function documentSources(tag: string): [string, string][] {
  return Object.entries(atHand).filter(([path]) => {
    const p = parts(path);
    return p?.tag === tag && p.name === 'document';
  });
}

function documentBundleOf(tag: string): FluentBundle | null {
  if (!documentBundles.has(tag)) {
    documentBundles.set(tag, makeBundle(tag, documentSources(tag), own.get(tag), true));
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
  /** The languages that have own words laid over those built in (ADR 0035). */
  own = $state.raw<string[]>([]);
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
    // The words of the formats are English as the formats have them: those built in.
    const bundle = makeBundle(ENGLISH, documentSources(ENGLISH));
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
    // A language the system has no name for, of those a scholar may quote: the application names it.
    if (name === tag && has(`language-name-${tag}`)) return t(`language-name-${tag}`);
    return name.charAt(0).toLocaleUpperCase(languages.current) + name.slice(1);
  } catch {
    return tag;
  }
}
