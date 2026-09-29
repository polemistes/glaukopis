import { describe, expect, it } from 'vitest';
import { findWords, inAnotherScript, isChecked, NOT_TEXT, wordAt } from './words';

const words = (text: string, locale = 'en', script: string | null = 'Latn') =>
  findWords(text, locale, script).map((w) => w.word);

describe('the words of a text', () => {
  it('are found where they stand', () => {
    const found = findWords('The wrath of Achilles.', 'en', 'Latn');
    expect(found.map((w) => [w.word, w.from, w.to])).toEqual([
      ['The', 0, 3],
      ['wrath', 4, 9],
      ['of', 10, 12],
      ['Achilles', 13, 21],
    ]);
  });

  it('keep their apostrophes, and are one where a hyphen joins them', () => {
    expect(words("Don't say it isn’t so: the e-post of a TV‑program, well-known.")).toEqual([
      "Don't",
      'say',
      'it',
      'isn’t',
      'so',
      'the',
      'e-post',
      'of',
      'a',
      'TV‑program',
      'well-known',
    ]);
    // Dashes part words; only hyphens join them.
    expect(words('war – peace—love')).toEqual(['war', 'peace', 'love']);
  });

  it('are asked about with the point that follows them', () => {
    const found = findWords('Bøker, tidsskrifter osv. og f.eks. aviser.', 'nb', 'Latn');
    expect(found.map((w) => w.asked)).toEqual([
      'Bøker',
      'tidsskrifter',
      'osv.',
      'og',
      'f.eks.',
      'aviser.',
    ]);
    // What is underlined is the word, without the point.
    expect(found[2].word).toBe('osv');
  });

  it('leave out words with digits', () => {
    expect(words('In the 1990s, H2O and COVID-19 were words; 1984 was a year.')).toEqual([
      'In',
      'the',
      'and',
      'were',
      'words',
      'was',
      'a',
      'year',
    ]);
  });

  it('leave out addresses', () => {
    expect(
      words(
        'See https://example.org/some-page, or www.nb.no/sprakbanken, write to post@example.no, or open notes.txt.',
      ),
    ).toEqual(['See', 'or', 'write', 'to', 'or', 'open']);
    expect(isChecked('e.g', 'Latn')).toBe(true);
    expect(isChecked('example.org', 'Latn')).toBe(false);
  });

  it('leave out words in another script than the dictionary’s', () => {
    expect(words('The word λόγος means word, and слово too.')).toEqual([
      'The',
      'word',
      'means',
      'word',
      'and',
      'too',
    ]);
    expect(words('Ὁ λόγος καὶ the word', 'el', 'Grek')).toEqual(['Ὁ', 'λόγος', 'καὶ']);
    // Where the script of the dictionary is not known, all are checked.
    expect(words('λόγος and word', 'en', null)).toEqual(['λόγος', 'and', 'word']);
    // A word that mixes them is checked: a Greek omicron has come into it.
    expect(inAnotherScript('lοgos', 'Latn')).toBe(false);
    expect(inAnotherScript('λόγος', 'Latn')).toBe(true);
  });

  it('are parted by what is not text', () => {
    expect(words(`the wrath${NOT_TEXT}of Achilles`)).toEqual(['the', 'wrath', 'of', 'Achilles']);
  });

  it('can be found at a place of the text', () => {
    const found = findWords('The wrath of Achilles', 'en', 'Latn');
    expect(wordAt(found, 6)?.word).toBe('wrath');
    expect(wordAt(found, 9)?.word).toBe('wrath');
    expect(wordAt(found, 12)?.word).toBe('of');
  });
});
