/**
 * The works of a citation that was found, and what is made of them: the
 * works of a citation as the application has them.
 */

import type { FoundItem, Suggestion } from '$lib/api/found';
import type { CiteItem } from '$lib/editor/schema';
import { t } from '$lib/i18n';

/** What is said of the place in a work, and around it. */
export interface Said {
  locator?: string;
  label?: string;
  prefix?: string;
  suffix?: string;
  suppressAuthor?: boolean;
}

/** A work as a citation has it: the reference, with what was said of the place in it. */
export function citeItem(reference: string, said: Said): CiteItem {
  const out: CiteItem = { id: reference };
  if (said.locator?.trim()) out.locator = said.locator.trim();
  if (said.label && said.label !== 'page' && out.locator) out.label = said.label;
  if (said.prefix?.trim()) out.prefix = said.prefix.trim();
  if (said.suffix?.trim()) out.suffix = said.suffix.trim();
  if (said.suppressAuthor) out.suppressAuthor = true;
  return out;
}

/** The reference that is the work for certain, where there is one. */
export function certain(suggestions: Suggestion[] | undefined): string | null {
  return suggestions?.find((s) => s.sure === 'certain')?.reference ?? null;
}

const text = (value: unknown): string =>
  typeof value === 'string' ? value : typeof value === 'number' ? String(value) : '';

interface Named {
  family?: unknown;
  given?: unknown;
  literal?: unknown;
}

/** The names of those who made a work, as the file says: its authors, or else its editors or translators. */
function names(data: Record<string, unknown>): string[] {
  for (const role of ['author', 'editor', 'translator']) {
    const list = data[role];
    if (!Array.isArray(list) || !list.length) continue;
    const names = (list as Named[])
      .map((n) => text(n?.family) || text(n?.literal) || text(n?.given))
      .filter(Boolean);
    if (names.length) return names;
  }
  return [];
}

/** Those who made a work, as the file says: "Nagy", "Nagy and Lord", "Nagy et al." */
function people(data: Record<string, unknown>): string {
  const all = names(data);
  if (all.length <= 1) return all[0] ?? '';
  if (all.length === 2) return t('found-people-two', { first: all[0], second: all[1] });
  return t('found-people-more', { first: all[0] });
}

/** The year a work is of, as the file says. */
function year(data: Record<string, unknown>): string {
  const issued = data.issued as { 'date-parts'?: unknown; literal?: unknown; raw?: unknown };
  if (!issued || typeof issued !== 'object') return text(issued).match(/\d{4}/)?.[0] ?? '';
  const parts = issued['date-parts'];
  if (Array.isArray(parts) && Array.isArray(parts[0]) && parts[0].length) return text(parts[0][0]);
  return (text(issued.literal) || text(issued.raw)).match(/\d{4}/)?.[0] ?? '';
}

/** What the file says a work is, in a line: who, when, and what it is called. */
export function describeItem(item: FoundItem): { who: string; year: string; title: string } {
  const data = item.data ?? {};
  return { who: people(data), year: year(data), title: text(data.title) };
}

/**
 * The words by which a work is looked for in the library: who made it and
 * when, where the file says so; else what it is called; else its tag.
 */
export function wordsOf(item: FoundItem): string {
  const said = describeItem(item);
  // By the names, whatever the language of the interface joins them with.
  const all = names(item.data ?? {});
  const who = (all.length > 2 ? all.slice(0, 1) : all).join(' ');
  if (who) return [who, said.year].filter(Boolean).join(' ');
  if (said.title) return said.title.split(/\s+/).slice(0, 4).join(' ');
  return item.key ?? '';
}

/** The key of an item in Zotero, from its address. Nothing, where the address is none of an item. */
export function zoteroKey(uri: string): string | null {
  const key = /\/items\/([A-Za-z0-9]{8})\/?$/.exec(uri.trim())?.[1];
  return key ? key.toUpperCase() : null;
}
