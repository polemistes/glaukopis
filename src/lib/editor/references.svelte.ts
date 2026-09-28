/**
 * What the editor knows about references: enough to show a citation in the
 * text. A project carries copies of the references it uses; the library has
 * the rest.
 */

import type { Reference, Summary } from '$lib/api/library';
import { primary, t } from '$lib/i18n';
import { library } from '$lib/state/library.svelte';
import type { Project } from '$lib/project/model/project.svelte';
import type { RefRecord } from '$lib/project/model/types';
import terms from '../../../resources/csl/locator-terms.json';
import { LOCATOR_LABELS, type CiteItem, type CiteMode } from './schema';

export interface RefLabel {
  authors: string;
  year: string;
  title: string;
  container: string;
  type: string;
  key: string;
  /** Whether the reference is in this user's library, and not only in the project. */
  inLibrary: boolean;
}

/** The project whose references the editors look up. Set by the project view. */
let current = $state.raw<Project | null>(null);

export function setProject(project: Project | null) {
  current = project;
}

/** The project that is open, if one is. */
export function currentProject(): Project | null {
  return current;
}

/** The language of the map an element belongs to, which its text is written in, where it is known. */
export function languageOf(element: string | null | undefined): string | undefined {
  const map = element ? current?.node(element)?.map : undefined;
  return map ? current?.map(map)?.document.language : undefined;
}

export function lookup(id: string): RefLabel | null {
  const s: Summary | undefined = library.get(id);
  if (s) {
    return {
      authors: s.authors,
      year: s.year,
      title: s.title,
      container: s.container,
      type: s.type,
      key: s.key,
      inLibrary: true,
    };
  }
  const r = current?.refs.get(id);
  if (r) {
    return {
      authors: r.authors,
      year: r.year,
      title: r.title,
      container: r.container,
      type: r.type,
      key: r.key,
      inLibrary: false,
    };
  }
  return null;
}

export function recordOf(reference: Reference): RefRecord {
  return {
    id: reference.id,
    key: reference.key,
    type: reference.type,
    fields: { ...reference.fields },
    names: structuredClone(reference.names),
    modified: reference.modified,
    authors: reference.summary.authors,
    year: reference.summary.year,
    title: reference.summary.title,
    container: reference.summary.container,
  };
}

function shortTitle(title: string): string {
  const main = title.split(/[:.?!]\s/)[0];
  const words = main.split(/\s+/);
  return words.length > 5 ? `${words.slice(0, 5).join(' ')}…` : main;
}

/** The words of CSL for each kind of locator, long and short, in the singular and the plural. */
const TERMS = terms as Record<string, Record<string, { long?: string[]; short?: string[] }>>;

/** The variant of a language that stands for it as a whole, where CSL has several. */
const USUAL: Record<string, string> = {
  en: 'en-US',
  de: 'de-DE',
  fr: 'fr-FR',
  es: 'es-ES',
  pt: 'pt-PT',
  zh: 'zh-CN',
  sr: 'sr-Latn-RS',
  no: 'nb-NO',
};

const locales = new Map<string, string | null>();

/**
 * The locale of CSL whose words stand for a language, chosen as the core
 * chooses it (`locale_for` in `document/pandoc.rs`): the language itself,
 * the usual variant of it, or the first there is. Nothing, where CSL does
 * not have the language.
 */
function localeOf(language: string): string | null {
  const known = locales.get(language);
  if (known !== undefined) return known;
  const all = Object.keys(TERMS);
  const find = (tag: string) => all.find((k) => k.toLowerCase() === tag.toLowerCase());
  const first = primary(language);
  const found =
    find(language.trim()) ??
    (USUAL[first] ? find(USUAL[first]) : undefined) ??
    all.filter((k) => primary(k) === first).sort()[0] ??
    null;
  locales.set(language, found);
  return found;
}

/**
 * What a kind of locator is called in a citation in a text: the short form
 * of CSL in the language of the text, or its word where CSL has no short
 * form. A text in English, or in a language CSL does not have, shows the
 * forms of English; signs (§, ¶) are the same in every language.
 */
export function locatorWord(kind: string, language?: string | null): string {
  const english = LOCATOR_LABELS.find(([id]) => id === kind)?.[1] ?? '';
  if (!english || !language || primary(language) === 'en' || !/\p{L}/u.test(english))
    return english;
  const locale = localeOf(language);
  const forms = locale ? TERMS[locale]?.[kind] : undefined;
  return forms?.short?.[0] || forms?.long?.[0] || english;
}

function locatorText(item: CiteItem, language?: string | null): string {
  if (!item.locator) return '';
  const label = item.label && item.label !== 'page' ? locatorWord(item.label, language) : '';
  return label ? `${label} ${item.locator}` : item.locator;
}

/**
 * One cited work in short: "Nagy 1979, 45". With the language of the text,
 * what the locator counts is said in it.
 */
export function itemLabel(
  item: CiteItem,
  options: { suppressAuthor?: boolean; language?: string | null } = {},
): string {
  const ref = lookup(item.id);
  if (!ref) return t('editor-citation-missing');
  const who = ref.authors.replace(/ \(eds?\.\)$/, '') || shortTitle(ref.title) || ref.key;
  const parts: string[] = [];
  if (item.prefix) parts.push(item.prefix.trim());
  const year = ref.year || 'n.d.';
  parts.push(item.suppressAuthor || options.suppressAuthor ? year : `${who} ${year}`);
  let out = parts.join(' ');
  const locator = locatorText(item, options.language);
  if (locator) out += `, ${locator}`;
  // Words that begin with a sign of their own stand close to what is before them.
  const after = item.suffix?.trim();
  if (after) out += /^[,;:.!?)]/.test(after) ? after : ` ${after}`;
  return out;
}

/**
 * A citation as the editor shows it. The reference style is applied in the
 * preview; in the text a neutral short form stands for it, with what the
 * locators count in the language of the text, where that is given.
 */
export function citationLabel(items: CiteItem[], mode: CiteMode, language?: string | null): string {
  if (!items.length) return t('editor-citation-empty');
  if (mode === 'intext') {
    const [first, ...rest] = items;
    const ref = lookup(first.id);
    const who = ref
      ? ref.authors.replace(/ \(eds?\.\)$/, '') || shortTitle(ref.title)
      : t('editor-citation-missing');
    const inside = [
      itemLabel(first, { suppressAuthor: true, language }),
      ...rest.map((i) => itemLabel(i, { language })),
    ].join('; ');
    return `${who} (${inside})`;
  }
  return `(${items.map((i) => itemLabel(i, { language })).join('; ')})`;
}

export function isMissing(items: CiteItem[]): boolean {
  return items.some((i) => !lookup(i.id));
}
