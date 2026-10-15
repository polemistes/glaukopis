import { describe, expect, it } from 'vitest';
import { firstTextChoice, latinWithGreek } from './how';

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
});

describe('Greek read with languages of the Latin script', () => {
  it('names them', () => {
    expect(latinWithGreek(['grc', 'eng', 'nor'])).toEqual(['eng', 'nor']);
    expect(latinWithGreek(['grc', 'lat'])).toEqual(['lat']);
  });
  it('says nothing of Greek alone, or of languages of other scripts', () => {
    expect(latinWithGreek(['grc'])).toEqual([]);
    expect(latinWithGreek(['grc', 'heb', 'rus'])).toEqual([]);
    expect(latinWithGreek(['eng', 'nor'])).toEqual([]);
  });
});
