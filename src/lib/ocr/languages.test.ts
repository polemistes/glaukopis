import { describe, expect, it } from 'vitest';
import { byName, firstLanguages, ocrLanguageName, tesseractLanguage } from './languages';

describe('the languages Tesseract reads', () => {
  it('are found for the tags of texts, and the names BibLaTeX gives them', () => {
    expect(tesseractLanguage('nb-NO')).toBe('nor');
    expect(tesseractLanguage('nn')).toBe('nor');
    expect(tesseractLanguage('en-GB')).toBe('eng');
    expect(tesseractLanguage('grc')).toBe('grc');
    expect(tesseractLanguage('ngerman')).toBe('deu');
    expect(tesseractLanguage('tlh')).toBeNull();
    expect(tesseractLanguage(null)).toBeNull();
  });

  it('are named in the language of the interface', () => {
    expect(ocrLanguageName('eng')).toBe('English');
    expect(ocrLanguageName('grc')).toBe('Ancient Greek');
    expect(ocrLanguageName('chi_sim')).toBe('Simplified Chinese');
    expect(ocrLanguageName('frk')).toBe('German, Fraktur');
    expect(ocrLanguageName('script/Latin')).toBe('Latin script');
    expect(byName(['nor', 'grc', 'eng'])).toEqual(['grc', 'eng', 'nor']);
  });

  it('are read with at first as chosen, or as the text and the interface are written', () => {
    const installed = ['eng', 'grc', 'nor'];
    expect(firstLanguages(installed, ['grc', 'deu'], ['nb'])).toEqual(['grc']);
    expect(firstLanguages(installed, [], ['nb', 'en'])).toEqual(['nor', 'eng']);
    expect(firstLanguages(installed, [], ['de', 'fr'])).toEqual(['eng']);
    expect(firstLanguages(['lat'], [], ['nb'])).toEqual(['lat']);
    expect(firstLanguages([], [], ['nb'])).toEqual([]);
  });
});
