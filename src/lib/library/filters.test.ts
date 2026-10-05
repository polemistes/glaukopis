import { describe, expect, it } from 'vitest';
import type { Summary } from '$lib/api/library';
import {
  activeFilters,
  applyFilters,
  kindsOf,
  noFilters,
  parseYear,
  publishersOf,
  yearSpan,
} from './filters';

function entry(partial: Partial<Summary>): Summary {
  return {
    id: partial.key ?? 'x',
    key: 'x',
    type: 'book',
    authors: '',
    authorsSort: '',
    year: '',
    yearNumber: null,
    title: '',
    container: '',
    publisher: '',
    attachments: 0,
    hasNote: false,
    added: '',
    modified: '',
    search: '',
    ...partial,
  };
}

const entries = [
  entry({
    key: 'nagy1979',
    type: 'book',
    yearNumber: 1979,
    publisher: 'Johns Hopkins University Press',
  }),
  entry({ key: 'lord1960', type: 'book', yearNumber: 1960, publisher: 'Harvard University Press' }),
  entry({ key: 'west1988', type: 'article', yearNumber: 1988 }),
  entry({
    key: 'fowler2004',
    type: 'collection',
    yearNumber: 2004,
    publisher: 'Cambridge University Press',
  }),
  entry({
    key: 'kirk1985',
    type: 'book',
    yearNumber: 1985,
    publisher: 'Cambridge University Press',
  }),
  entry({ key: 'maronitis1999', type: 'book', yearNumber: 1999, publisher: 'Κέδρος' }),
  entry({ key: 'undated', type: 'misc' }),
];

const keys = (list: Summary[]) => list.map((e) => e.key);

describe('the filters of the library', () => {
  it('let everything through when none is on', () => {
    expect(applyFilters(entries, noFilters)).toBe(entries);
    expect(activeFilters(noFilters)).toBe(0);
  });

  it('narrow to the kinds that are ticked', () => {
    const f = { ...noFilters, kinds: ['article', 'collection'] };
    expect(keys(applyFilters(entries, f))).toEqual(['west1988', 'fowler2004']);
    expect(activeFilters(f)).toBe(1);
  });

  it('match the publisher by part of it, without regard to case or accents', () => {
    expect(keys(applyFilters(entries, { ...noFilters, publisher: 'cambridge' }))).toEqual([
      'fowler2004',
      'kirk1985',
    ]);
    expect(keys(applyFilters(entries, { ...noFilters, publisher: 'ΚΕΔΡΟΣ' }))).toEqual([
      'maronitis1999',
    ]);
    expect(keys(applyFilters(entries, { ...noFilters, publisher: '  ' }))).toEqual(keys(entries));
  });

  it('keep the years between from and to, and leave out those without a year', () => {
    expect(keys(applyFilters(entries, { ...noFilters, from: 1980, to: 1999 }))).toEqual([
      'west1988',
      'kirk1985',
      'maronitis1999',
    ]);
    expect(keys(applyFilters(entries, { ...noFilters, from: 2000, to: null }))).toEqual([
      'fowler2004',
    ]);
    expect(keys(applyFilters(entries, { ...noFilters, from: null, to: 1960 }))).toEqual([
      'lord1960',
    ]);
    expect(activeFilters({ ...noFilters, from: 1980, to: 1999 })).toBe(1);
  });

  it('work together', () => {
    const f = { kinds: ['book'], publisher: 'university', from: 1970, to: null };
    expect(keys(applyFilters(entries, f))).toEqual(['nagy1979', 'kirk1985']);
    expect(activeFilters(f)).toBe(3);
  });

  it('say which kinds and publishers there are, the most frequent first', () => {
    expect(kindsOf(entries)).toEqual([
      { value: 'book', count: 4 },
      { value: 'article', count: 1 },
      { value: 'collection', count: 1 },
      { value: 'misc', count: 1 },
    ]);
    expect(publishersOf(entries).slice(0, 2)).toEqual([
      { value: 'Cambridge University Press', count: 2 },
      { value: 'Harvard University Press', count: 1 },
    ]);
    expect(yearSpan(entries)).toEqual([1960, 2004]);
    expect(yearSpan([entry({})])).toBeNull();
  });

  it('read a year as typed', () => {
    expect(parseYear(' 1979 ')).toBe(1979);
    expect(parseYear('-300')).toBe(-300);
    expect(parseYear('')).toBeNull();
    expect(parseYear('197x')).toBeNull();
  });
});
