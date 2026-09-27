/**
 * What the editor knows about references: enough to show a citation in the
 * text. A project carries copies of the references it uses; the library has
 * the rest.
 */

import type { Reference, Summary } from '$lib/api/library';
import { library } from '$lib/state/library.svelte';
import type { Project } from '$lib/project/model/project.svelte';
import type { RefRecord } from '$lib/project/model/types';
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

function locatorText(item: CiteItem): string {
  if (!item.locator) return '';
  const label =
    item.label && item.label !== 'page'
      ? LOCATOR_LABELS.find(([id]) => id === item.label)?.[2]
      : '';
  return label ? `${label} ${item.locator}` : item.locator;
}

/** One cited work in short: "Nagy 1979, 45". */
export function itemLabel(item: CiteItem, options: { suppressAuthor?: boolean } = {}): string {
  const ref = lookup(item.id);
  if (!ref) return '[reference not found]';
  const who = ref.authors.replace(/ \(eds?\.\)$/, '') || shortTitle(ref.title) || ref.key;
  const parts: string[] = [];
  if (item.prefix) parts.push(item.prefix.trim());
  const year = ref.year || 'n.d.';
  parts.push(item.suppressAuthor || options.suppressAuthor ? year : `${who} ${year}`);
  let out = parts.join(' ');
  const locator = locatorText(item);
  if (locator) out += `, ${locator}`;
  if (item.suffix) out += ` ${item.suffix.trim()}`;
  return out;
}

/**
 * A citation as the editor shows it. The reference style is applied in the
 * preview; in the text a neutral short form stands for it.
 */
export function citationLabel(items: CiteItem[], mode: CiteMode): string {
  if (!items.length) return '(citation)';
  if (mode === 'intext') {
    const [first, ...rest] = items;
    const ref = lookup(first.id);
    const who = ref
      ? ref.authors.replace(/ \(eds?\.\)$/, '') || shortTitle(ref.title)
      : '[reference not found]';
    const inside = [
      itemLabel(first, { suppressAuthor: true }),
      ...rest.map((i) => itemLabel(i)),
    ].join('; ');
    return `${who} (${inside})`;
  }
  return `(${items.map((i) => itemLabel(i)).join('; ')})`;
}

export function isMissing(items: CiteItem[]): boolean {
  return items.some((i) => !lookup(i.id));
}
