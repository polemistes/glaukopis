import { describe, expect, it } from 'vitest';
import type { Summary } from '$lib/api/library';
import { fold, search, sortEntries } from './library.svelte';

function entry(partial: Partial<Summary>): Summary {
  const s: Summary = {
    id: partial.key ?? 'x',
    key: 'x',
    type: 'book',
    authors: '',
    authorsSort: '',
    year: '',
    yearNumber: null,
    title: '',
    container: '',
    attachments: 0,
    hasNote: false,
    added: '',
    modified: '',
    search: '',
    ...partial,
  };
  if (!s.search) s.search = fold(`${s.authors} ${s.title} ${s.year} ${s.key}`);
  if (!s.authorsSort) s.authorsSort = fold(s.authors);
  return s;
}

const entries = [
  entry({
    key: 'nagy1979',
    authors: 'Nagy',
    title: 'The Best of the Achaeans',
    year: '1979',
    yearNumber: 1979,
  }),
  entry({
    key: 'lord1960',
    authors: 'Lord',
    title: 'The Singer of Tales',
    year: '1960',
    yearNumber: 1960,
  }),
  entry({
    key: 'godel',
    authors: 'Gödel',
    title: 'Über formal unentscheidbare Sätze',
    year: '1931',
    yearNumber: 1931,
  }),
  entry({ key: 'anon', authors: '', title: 'Ἰλιάς', year: '' }),
];

describe('search', () => {
  it('folds diacritics in the query as in the text', () => {
    expect(fold('Gödel, Søren & Straße')).toBe('godel soren strasse');
    expect(search(entries, 'godel').map((e) => e.key)).toEqual(['godel']);
    expect(search(entries, 'GÖDEL satze').map((e) => e.key)).toEqual(['godel']);
    expect(search(entries, 'ιλιας').map((e) => e.key)).toEqual(['anon']);
  });

  it('matches every word, from the beginning of words', () => {
    expect(search(entries, 'the 19').map((e) => e.key)).toEqual(['nagy1979', 'lord1960']);
    expect(search(entries, 'nag best').map((e) => e.key)).toEqual(['nagy1979']);
    expect(search(entries, 'agy')).toEqual([]);
    expect(search(entries, '  ')).toHaveLength(4);
  });
});

describe('sorting', () => {
  it('puts entries without the value last in both directions', () => {
    expect(sortEntries(entries, 'authors', false).map((e) => e.key)).toEqual([
      'godel',
      'lord1960',
      'nagy1979',
      'anon',
    ]);
    expect(sortEntries(entries, 'authors', true).map((e) => e.key)).toEqual([
      'nagy1979',
      'lord1960',
      'godel',
      'anon',
    ]);
    expect(sortEntries(entries, 'year', true).map((e) => e.key)).toEqual([
      'nagy1979',
      'lord1960',
      'godel',
      'anon',
    ]);
    expect(sortEntries(entries, 'year', false).map((e) => e.key)).toEqual([
      'godel',
      'lord1960',
      'nagy1979',
      'anon',
    ]);
  });
});
