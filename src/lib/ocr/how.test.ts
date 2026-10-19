import { describe, expect, it } from 'vitest';
import {
  firstPageToTry,
  firstTextChoice,
  lowResolution,
  scriptOf,
  scriptsAlike,
  stretchesOf,
} from './how';

describe('what becomes of the text a PDF has, at first', () => {
  it('is translated where a scheme applies', () => {
    expect(firstTextChoice({ withText: 4, poor: 4, schemes: [{}] })).toBe('translate');
  });
  it('is read anew where it is poor and nothing translates it', () => {
    expect(firstTextChoice({ withText: 4, poor: 2, schemes: [] })).toBe('anew');
  });
  it('is kept otherwise', () => {
    expect(firstTextChoice({ withText: 4, poor: 1, schemes: [] })).toBe('keep');
  });
  it('is kept where the pages are pictures of too few dots, poor as it is', () => {
    expect(firstTextChoice({ withText: 4, poor: 4, schemes: [], resolution: 72 })).toBe('keep');
    expect(firstTextChoice({ withText: 4, poor: 4, schemes: [], resolution: 300 })).toBe('anew');
  });
});

describe('the page tried at first', () => {
  it('is the first Tesseract is to read', () => {
    expect(firstPageToTry({ firstWithoutText: 4 }, 'keep')).toBe(4);
    expect(firstPageToTry({ firstWithoutText: 4 }, 'translate')).toBe(4);
    expect(firstPageToTry({ firstWithoutText: 4 }, 'anew')).toBe(1);
    expect(firstPageToTry({ firstWithoutText: null }, 'keep')).toBe(1);
  });
});

describe('the resolution of a scan', () => {
  it('is too low under 150 dots to the inch, and nothing is said of pages that are no pictures', () => {
    expect(lowResolution({ resolution: 72 })).toBe(true);
    expect(lowResolution({ resolution: 150 })).toBe(false);
    expect(lowResolution({ resolution: null })).toBe(false);
    expect(lowResolution({})).toBe(false);
  });
});

describe('pages said as stretches', () => {
  it('joins pages that follow each other, as the core does', () => {
    expect(stretchesOf([3, 4, 5, 9])).toBe('3–5, 9');
    expect(stretchesOf([7])).toBe('7');
    expect(stretchesOf([])).toBe('');
    expect(stretchesOf(Array.from({ length: 12 }, (_, i) => (i + 1) * 2))).toBe(
      '2, 4, 6, 8, 10, 12, 14, 16, 18, 20, …',
    );
  });
});

describe('scripts whose letters look alike, read together', () => {
  const pairs = (chosen: string[]) => scriptsAlike(chosen).map(({ a, b }) => `${a} ${b}`);

  it('knows the script of a language, and of a script Tesseract reads as one', () => {
    expect(scriptOf('eng')).toBe('Latin');
    expect(scriptOf('frk')).toBe('Latin');
    expect(scriptOf('srp_latn')).toBe('Latin');
    expect(scriptOf('grc')).toBe('Greek');
    expect(scriptOf('script/Greek')).toBe('Greek');
    expect(scriptOf('ukr')).toBe('Cyrillic');
    expect(scriptOf('heb')).toBeNull();
  });
  it('names Greek with a language of the Latin script, with the letters alike', () => {
    expect(scriptsAlike(['grc', 'eng', 'nor'])).toEqual([
      { a: 'Greek', b: 'Latin', alike: 'ϲ c, ο o, ν v, ρ p, α a' },
    ]);
    expect(pairs(['lat', 'script/Greek'])).toEqual(['Greek Latin']);
  });
  it('names Cyrillic with Latin, and Greek with Cyrillic', () => {
    expect(pairs(['rus', 'deu'])).toEqual(['Cyrillic Latin']);
    expect(pairs(['ell', 'bul'])).toEqual(['Greek Cyrillic']);
    expect(pairs(['grc', 'rus', 'eng'])).toEqual([
      'Greek Latin',
      'Cyrillic Latin',
      'Greek Cyrillic',
    ]);
  });
  it('says nothing of one script alone, or of scripts whose letters do not look alike', () => {
    expect(pairs(['grc', 'ell'])).toEqual([]);
    expect(pairs(['eng', 'nor', 'script/Latin'])).toEqual([]);
    expect(pairs(['grc', 'heb'])).toEqual([]);
    expect(pairs(['rus', 'ara', 'chi_sim'])).toEqual([]);
    expect(pairs([])).toEqual([]);
  });
});
