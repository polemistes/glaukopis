import { describe, expect, it } from 'vitest';
import { languages, load } from '$lib/i18n';
import {
  byName,
  firstLanguages,
  frakturHint,
  hasFrakturModel,
  ocrLanguageName,
  tesseractLanguage,
} from './languages';

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
    // The Fraktur data of a language are told from its plain data.
    expect(ocrLanguageName('deu_frak')).toBe('German, Fraktur');
    expect(ocrLanguageName('dan_frak')).toBe('Danish, Fraktur');
    expect(ocrLanguageName('slk_frak')).toBe('Slovak, Fraktur');
    expect(ocrLanguageName('deu')).toBe('German');
    expect(ocrLanguageName('script/Latin')).toBe('Latin script');
    expect(byName(['nor', 'grc', 'eng'])).toEqual(['grc', 'eng', 'nor']);
  });

  it('name the Fraktur model for the type it reads, not for a language', async () => {
    expect(ocrLanguageName('deu_latf')).toBe('Fraktur (Gothic type)');
    expect(ocrLanguageName('deu_latf', true)).toBe('Fraktur (Gothic type)');
    expect(ocrLanguageName('script/Fraktur')).toBe('Fraktur (Gothic type)');
    expect(ocrLanguageName('dan_latf')).toBe('Fraktur, Danish and Norwegian (Gothic type)');
    // The older models of one language are still named by it.
    expect(ocrLanguageName('frk')).toBe('German, Fraktur');
    // So it stands under F, not under G with German.
    expect(byName(['nor', 'deu', 'deu_latf', 'eng', 'grc'])).toEqual([
      'grc',
      'eng',
      'deu_latf',
      'deu',
      'nor',
    ]);
    const was = languages.current;
    try {
      await load('nb');
      languages.current = 'nb';
      expect(ocrLanguageName('deu_latf')).toBe('Fraktur (gotisk skrift)');
      expect(ocrLanguageName('dan_latf')).toBe('Fraktur, dansk og norsk (gotisk skrift)');
    } finally {
      languages.current = was;
    }
  });

  it('say whether Gothic type can be read with what is installed', () => {
    expect(hasFrakturModel(['eng', 'deu_latf'])).toBe(true);
    expect(hasFrakturModel(['frk'])).toBe(true);
    expect(hasFrakturModel(['script/Fraktur', 'nor'])).toBe(true);
    expect(hasFrakturModel(['dan_latf'])).toBe(true);
    expect(hasFrakturModel(['eng', 'deu', 'nor'])).toBe(false);
    expect(hasFrakturModel([])).toBe(false);
  });

  it('name the model of Gothic type that knows æ, ø and å where Norwegian or Danish is read', () => {
    expect(frakturHint(['eng', 'deu_latf'], ['nor'])).toBe('ocr-languages-fraktur-hint-dan');
    expect(frakturHint(['dan_latf'], ['eng', 'dan'])).toBe('ocr-languages-fraktur-hint-dan');
    expect(frakturHint(['eng', 'deu_latf'], ['deu'])).toBe('ocr-languages-fraktur-hint');
    expect(frakturHint(['dan_latf'], ['deu_latf'])).toBe('ocr-languages-fraktur-hint');
    expect(frakturHint(['eng', 'nor'], ['nor'])).toBeNull();
  });

  it('are written in a sentence as the language of the interface writes them there', () => {
    const was = languages.current;
    try {
      languages.current = 'nb';
      expect(ocrLanguageName('eng')).toBe('Engelsk');
      expect(ocrLanguageName('eng', true)).toBe('engelsk');
      languages.current = 'en';
      expect(ocrLanguageName('eng', true)).toBe('English');
    } finally {
      languages.current = was;
    }
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
