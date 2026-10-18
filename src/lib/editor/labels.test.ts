import { describe, expect, it } from 'vitest';
import {
  citationText,
  citationWordsOf,
  PLAIN_POINTER,
  PLAIN_WORDS,
  pointerText,
  workText,
  type CitedWork,
} from './labels';
import type { CiteItem } from './schema';

const works: Record<string, CitedWork> = {
  nagy: { authors: 'Nagy', year: '1979', title: 'The Best of the Achaeans', key: 'nagy1979' },
  eds: { authors: 'West (ed.)', year: '', title: 'Iambi et Elegi', key: 'west' },
  anon: {
    authors: '',
    year: '1900',
    title: 'A song of the wrath of the son of Peleus: and more',
    key: 'anon',
  },
};
const lookup = (id: string) => works[id] ?? null;
const words = citationWordsOf({
  missing: 'missing',
  empty: 'no work',
  noDate: 'o. J.',
  locators: { chapter: 'Kap.', page: 'S.' },
});
const cite = (id: string, more: Partial<CiteItem> = {}): CiteItem => ({ id, ...more });

describe('a citation in a text', () => {
  it('names each work in short, with what the locator counts in the words given', () => {
    expect(
      citationText([cite('nagy', { locator: '4', label: 'chapter' })], 'normal', lookup, words),
    ).toBe('(Nagy 1979, Kap. 4)');
    // A page is not said: the number alone stands for it.
    expect(citationText([cite('nagy', { locator: '45' })], 'normal', lookup, words)).toBe(
      '(Nagy 1979, 45)',
    );
    expect(citationText([cite('eds'), cite('anon')], 'normal', lookup, words)).toBe(
      '(West o. J.; A song of the wrath… 1900)',
    );
  });

  it('names the author outside where it stands in the text', () => {
    expect(
      citationText([cite('nagy', { locator: '4' }), cite('eds')], 'intext', lookup, words),
    ).toBe('Nagy (1979, 4; West o. J.)');
  });

  it('says so of a work not known and of a citation of none', () => {
    expect(citationText([cite('gone')], 'normal', lookup, words)).toBe('(missing)');
    expect(citationText([cite('gone')], 'intext', lookup, words)).toBe('missing (missing)');
    expect(citationText([], 'normal', lookup, words)).toBe('no work');
  });

  it('keeps a word that begins with a sign close, and others a space off', () => {
    expect(citationText([cite('nagy', { suffix: ', passim' })], 'normal', lookup, words)).toBe(
      '(Nagy 1979, passim)',
    );
    expect(
      citationText([cite('nagy', { prefix: 'see ', suffix: 'n. 3' })], 'normal', lookup, words),
    ).toBe('(see Nagy 1979 n. 3)');
  });

  it('gives a work in short for what is written about it', () => {
    expect(workText(works.nagy, words)).toBe('Nagy 1979');
    expect(workText(works.eds, PLAIN_WORDS.citation)).toBe('West n.d.');
  });
});

describe('words that point', () => {
  const figure = { kind: 'figure' as const, number: '3', words: 'Shield' };
  it('say what the document calls a figure and a table, or the number alone', () => {
    expect(pointerText(figure, 'full', PLAIN_POINTER)).toBe('Figure 3');
    expect(pointerText(figure, 'full', { ...PLAIN_POINTER, label: 'Abbildung' })).toBe(
      'Abbildung 3',
    );
    expect(pointerText(figure, 'full', { ...PLAIN_POINTER, reference: 'Abb.' })).toBe('Abb. 3');
    expect(pointerText(figure, 'number', PLAIN_POINTER)).toBe('3');
    expect(
      pointerText({ kind: 'table', number: null, words: '' }, 'full', {
        ...PLAIN_POINTER,
        tableLabel: 'Tabelle',
      }),
    ).toBe('Tabelle');
  });

  it('put the number of an equation within what the document puts around it', () => {
    const q = { kind: 'equation' as const, number: '2', words: 'E = mc^2' };
    expect(pointerText(q, 'full', PLAIN_POINTER)).toBe('(2)');
    expect(pointerText(q, 'full', { ...PLAIN_POINTER, before: '[', after: ']' })).toBe('[2]');
    expect(pointerText({ ...q, number: null }, 'full', PLAIN_POINTER)).toBe('');
  });
});
