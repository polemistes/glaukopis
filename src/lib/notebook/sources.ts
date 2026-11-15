/**
 * The sources of the notebook as they are said: in a line, and in the line
 * under it; what reference of the library a source is made; and what the
 * library's record of a file says of where it came from (record 0101).
 */

import type { Draft } from '$lib/api/library';
import { itemLabel } from '$lib/editor/references.svelte';
import { languages, newTextLanguage, t } from '$lib/i18n';
import type { Place } from '$lib/api/notebook';
import type { Source } from './model/types';

/** How many signs of a source in words are said in its line. */
const WORDS = 80;

function cut(words: string, at = WORDS): string {
  const line = words.replace(/\s+/g, ' ').trim();
  return line.length <= at ? line : `${line.slice(0, at - 1).trimEnd()}…`;
}

/** The host of an address, without `www.`; the address itself where it has none. */
function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '') || url;
  } catch {
    return url;
  }
}

/** A reference in short, as a citation shows it, with its place where it has one. */
function referenceLabel(reference: string, locator?: string, label?: string): string {
  return itemLabel(
    { id: reference, ...(locator ? { locator } : {}), ...(label ? { label } : {}) },
    { language: newTextLanguage() },
  );
}

/** A source in a line: a page by its title, a reference in short, a file by its name, words as they are. */
export function sourceLabel(source: Source | null): string {
  if (!source) return t('notebook-source-none');
  switch (source.sort) {
    case 'web':
      return source.title.trim() || hostOf(source.url);
    case 'reference':
      return referenceLabel(source.reference, source.locator, source.label);
    case 'file':
      return source.name;
    case 'words':
      return cut(source.words);
  }
}

/** A day, in the language of the interface; nothing where it cannot be read. */
function day(iso: string | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat(languages.current, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d);
}

/** Where on the earth, in degrees north or south and east or west. */
export function placeWords(place: Place): string {
  const degrees = (n: number) =>
    new Intl.NumberFormat(languages.current, { maximumFractionDigits: 4 }).format(Math.abs(n));
  const lat = t(place.lat < 0 ? 'notebook-source-south' : 'notebook-source-north', {
    degrees: degrees(place.lat),
  });
  const lon = t(place.lon < 0 ? 'notebook-source-west' : 'notebook-source-east', {
    degrees: degrees(place.lon),
  });
  return `${lat}, ${lon}`;
}

/** The line under a source: a page's address and the day it was read; the day a file was taken, and where. */
export function sourceDetail(source: Source | null): string {
  if (!source) return '';
  const parts: string[] = [];
  switch (source.sort) {
    case 'web':
      parts.push(source.url, day(source.read));
      break;
    case 'file':
      parts.push(day(source.taken ?? source.time));
      if (source.place) parts.push(placeWords(source.place));
      break;
    case 'reference':
    case 'words':
      break;
  }
  return parts.filter(Boolean).join(' · ');
}

/** The day of a time, as BibLaTeX writes dates: `YYYY-MM-DD`. Nothing where it is none. */
function isoDay(iso: string | undefined): string {
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(iso ?? '');
  return m ? m[1] : '';
}

/** What is said, without what is empty. */
function fieldsOf(fields: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(fields).filter(([, v]) => v.trim()));
}

/**
 * The reference a source is made: a page an `online` reference with its
 * title, address and the day it was read; words a `misc` reference titled
 * by them; a file a `misc` reference titled by its name, dated by the day
 * it was taken or its own day. None for a reference, which it is.
 */
export function draftOf(source: Source): Draft | null {
  const draft = (type: string, fields: Record<string, string>): Draft => ({
    key: '',
    type,
    fields: fieldsOf(fields),
    names: {},
  });
  switch (source.sort) {
    case 'web':
      return draft('online', {
        title: source.title.trim(),
        url: source.url.trim(),
        urldate: isoDay(source.read),
      });
    case 'words':
      return draft('misc', { title: source.words.trim() });
    case 'file':
      return draft('misc', { title: source.name, date: isoDay(source.taken ?? source.time) });
    case 'reference':
      return null;
  }
}

/**
 * What the library's record of a file says of where it came from: the
 * address of a page, a reference in short, the words. None for a file,
 * whose record has its path already, and for no source.
 */
export function originOf(source: Source | null): string | null {
  if (!source) return null;
  switch (source.sort) {
    case 'web':
      return source.url;
    case 'reference':
      return referenceLabel(source.reference, source.locator, source.label);
    case 'words':
      return source.words.trim() || null;
    case 'file':
      return null;
  }
}
