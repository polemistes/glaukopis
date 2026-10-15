import { describe, expect, it } from 'vitest';
import type { StyleFoundView } from '$lib/api/imported';
import { languages } from '$lib/i18n';
import { lookInWords, OWN, styleOptions } from './styles';

const style = (said: Partial<StyleFoundView> = {}): StyleFoundView => ({
  id: 1,
  family: 'Bembo',
  italic: false,
  bold: false,
  size: 1,
  indent: false,
  kept: false,
  sample: '',
  count: 3,
  pages: 3,
  ...said,
});

describe('the look of a style found, in words', () => {
  it('says how it differs from the body, as text or as lines kept', () => {
    expect(lookInWords(style({ size: 0.8 }))).toBe('Smaller text');
    expect(lookInWords(style({ italic: true }))).toBe('Italic text');
    expect(lookInWords(style({ indent: true }))).toBe('Indented text');
    expect(lookInWords(style({ kept: true }))).toBe('Lines kept');
    expect(lookInWords(style({ size: 1.3, bold: true }))).toBe('Larger bold text');
  });
  it('puts together what holds of it', () => {
    expect(lookInWords(style({ size: 0.8, italic: true, indent: true }))).toBe(
      'Indented smaller italic text',
    );
    expect(lookInWords(style({ italic: true, kept: true }))).toBe('Italic lines kept');
  });
  it('names the font where nothing else tells it from the body, and says other text where not even that', () => {
    expect(lookInWords(style({ size: 1.02, family: 'Helvetica' }))).toBe('Text in Helvetica');
    expect(lookInWords(style({ family: '' }))).toBe('Other text');
  });
  it('bends the words as the language does', () => {
    const was = languages.current;
    try {
      languages.current = 'nb';
      expect(lookInWords(style({ size: 0.8, italic: true }))).toBe('Mindre kursiv tekst');
      expect(lookInWords(style({ italic: true, indent: true, kept: true }))).toBe(
        'Innrykkede kursive linjer',
      );
      expect(lookInWords(style({ kept: true }))).toBe('Linjer');
    } finally {
      languages.current = was;
    }
  });
});

describe('what a style found can be made', () => {
  it('is text first, the kinds of paragraph of the catalogue, and a kind of your own last', () => {
    const options = styleOptions();
    expect(options[0]).toEqual({ value: 'text', label: 'Text', group: undefined });
    expect(options.at(-1)?.value).toBe(OWN);
    const values = options.map((o) => o.value);
    expect(values).toContain('quote');
    expect(values).toContain('line');
    // No kind of words: a paragraph is never of one.
    expect(values).not.toContain('foreign');
    expect(new Set(values).size).toBe(values.length);
  });
});
