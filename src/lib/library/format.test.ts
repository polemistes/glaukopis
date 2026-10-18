import { afterEach, describe, expect, it } from 'vitest';
import { languages, t } from '$lib/i18n';
import { fileSize, reasonWords, truncate, wordsAround } from './format';

afterEach(() => {
  languages.current = 'en';
});

describe('the words for things of the library', () => {
  it('give the size of a file as before in English, and in the way of the language', () => {
    expect(fileSize(512)).toBe('512 B');
    expect(fileSize(1023)).toBe('1023 B');
    expect(fileSize(2048)).toBe('2 kB');
    expect(fileSize(1.5 * 1024 * 1024)).toBe('1.5 MB');
    expect(fileSize(2 * 1024 * 1024)).toBe('2.0 MB');
    expect(fileSize(1500 * 1024 * 1024)).toBe('1500.0 MB');
    languages.current = 'nb';
    expect(fileSize(1.5 * 1024 * 1024)).toBe('1,5 MB');
  });

  it('say why a reference is taken for another, the last reason joined to the others', () => {
    expect(reasonWords([])).toBe('');
    expect(reasonWords(['doi'])).toBe('the same DOI');
    expect(reasonWords(['doi', 'isbn', 'file'])).toBe(
      'the same DOI, the same ISBN and the same file',
    );
    expect(reasonWords(['name', 'first-page'])).toBe('named like it and the first page agrees');
    expect(reasonWords(['folder'])).toBe('in a folder named like it');
    languages.current = 'nb';
    expect(reasonWords(['doi', 'file'])).toBe('samme DOI og samme fil');
    expect(reasonWords(['name'])).toBe('navnet stemmer');
  });

  it('give the words around what is shown otherwise than as words', () => {
    const notFound = () => wordsAround((file) => t('library-zotero-not-found', { file }));
    const [before, after] = notFound();
    expect(before).toMatch(/^No Zotero was found .* the folder that holds $/);
    expect(after).toBe('.');
    languages.current = 'nb';
    expect(notFound()[0]).toMatch(/mappen med $/);
    expect(wordsAround(() => t('library-no-title'))).toEqual(['Ingen tittel', '']);
  });
});

describe('a text cut short', () => {
  it('is cut at a word, with an ellipsis', () => {
    expect(truncate('The Best of the Achaeans', 40)).toBe('The Best of the Achaeans');
    expect(truncate('The Best of the Achaeans: Concepts of the Hero', 32)).toBe(
      'The Best of the Achaeans…',
    );
  });

  it('never cuts a sign outside the first plane in two', () => {
    // A letter and forty signs of Linear B, each two halves in JavaScript:
    // the 32nd half is the first of a sign.
    const title = 'A' + '\u{10000}\u{10001}\u{10002}\u{10003}\u{10004}'.repeat(8);
    const cut = truncate(title, 32);
    expect(Array.from(cut)).toHaveLength(33);
    expect(cut.endsWith('…')).toBe(true);
    expect(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/.test(cut)).toBe(false);
    expect(truncate('\u{10000}'.repeat(5), 5)).toBe('\u{10000}'.repeat(5));
  });
});
