import { describe, expect, it } from 'vitest';
import type { Tried, TriedWord } from '$lib/api/ocr';
import { languages, t } from '$lib/i18n';
import { ocrLanguageName } from './languages';
import type { PageSettings } from './plan';
import {
  KEPT,
  UNSURE,
  isUnsure,
  paragraphText,
  pieces,
  remembered,
  settingsSaid,
  unsureOf,
  type Trial,
} from './trials';

const word = (text: string, confidence: number | null = 95, line = false): TriedWord => ({
  text,
  confidence,
  left: 0,
  top: 0,
  width: 10,
  height: 10,
  line,
});

const tried = (paragraphs: TriedWord[][] = []): Tried => ({
  page: 1,
  label: '1',
  paragraphs,
  words: paragraphs.flat().length,
  unsure: paragraphs.flat().filter(isUnsure).length,
  confidence: 90,
  poorly: false,
  png: '',
  width: 100,
  height: 140,
  blocks: [],
});

const settings = (change: Partial<PageSettings> = {}): PageSettings => ({
  languages: ['eng'],
  dpi: 0,
  layout: '',
  contrast: false,
  ...change,
});

const trial = (at: number, change: Partial<PageSettings> = {}): Trial => ({
  settings: settings(change),
  tried: tried(),
  at,
});

describe('the trials of a page', () => {
  it('are kept the newest first', () => {
    const one = trial(1);
    const two = trial(2);
    expect(remembered([], one)).toEqual([one]);
    expect(remembered([one], two)).toEqual([two, one]);
  });

  it('are six at most, the oldest dropped', () => {
    let kept: Trial[] = [];
    for (let at = 1; at <= 8; at++) kept = remembered(kept, trial(at));
    expect(KEPT).toBe(6);
    expect(kept.map((t) => t.at)).toEqual([8, 7, 6, 5, 4, 3]);
    expect(remembered(kept, trial(9), 2).map((t) => t.at)).toEqual([9, 8]);
  });
});

describe('the settings of a trial, said in a line', () => {
  it('name the languages and the resolution, and the layout only where it is told', () => {
    languages.current = 'en';
    expect(settingsSaid(settings({ languages: ['dan_latf'] }), ocrLanguageName, t)).toBe(
      'Fraktur (Gothic type), Norwegian and Danish · 300',
    );
    expect(
      settingsSaid(
        settings({ languages: ['eng', 'grc'], dpi: 400, layout: 'column', contrast: true }),
        ocrLanguageName,
        t,
      ),
    ).toBe('English + Ancient Greek · 400 · One column · B/W');
    expect(settingsSaid(settings({ languages: [], dpi: 600 }), ocrLanguageName, t)).toBe(
      'English, as none is chosen · 600',
    );
  });

  it('are said in the language of the interface', () => {
    languages.current = 'nb';
    try {
      expect(settingsSaid(settings({ layout: 'sparse', contrast: true }), ocrLanguageName, t)).toBe(
        'Engelsk · 300 · Spredt tekst · svart-hvitt',
      );
    } finally {
      languages.current = 'en';
    }
  });
});

describe('the words Tesseract was unsure of', () => {
  it('are those under the confidence of an unsure word', () => {
    expect(UNSURE).toBe(70);
    expect(isUnsure(word('a', 69.9))).toBe(true);
    expect(isUnsure(word('a', 0))).toBe(true);
    expect(isUnsure(word('a', 70))).toBe(false);
    expect(isUnsure(word('a', 96))).toBe(false);
    // Where Tesseract gave no confidence, it is not said to be unsure.
    expect(isUnsure(word('a', null))).toBe(false);
  });

  it('are found through every paragraph of a page tried, in the order read', () => {
    const a = word('Hvad', 40, true);
    const b = word('sagde', 91);
    const c = word('han', 12, true);
    expect(unsureOf(tried([[a, b], [c]]))).toEqual([a, c]);
    expect(unsureOf(null)).toEqual([]);
  });
});

describe('a paragraph read', () => {
  const paragraph = [
    word('Det', 96, true),
    word('var', 93),
    word('en', 55),
    word('Morgen', 90, true),
    word('i', 30),
    word('Mai.', 88),
  ];

  it('is its words with spaces between, each line on a line of its own', () => {
    expect(paragraphText(paragraph)).toBe('Det var en\nMorgen i Mai.');
    expect(paragraphText([])).toBe('');
    const broken = [
      { ...word('quar-', 90), line: true },
      { ...word('rel', 90), line: true },
      word('between', 90),
    ];
    expect(paragraphText(broken)).toBe('quar-\nrel between');
    expect(pieces(broken).map((p) => p.text)).toEqual(['quar-\nrel between']);
  });

  it('is shown in pieces, the sure words together and each unsure word alone', () => {
    const shown = pieces(paragraph);
    expect(shown.map((p) => [p.text, p.unsure?.confidence ?? null])).toEqual([
      ['Det var ', null],
      ['en', 55],
      ['\nMorgen ', null],
      ['i', 30],
      [' Mai.', null],
    ]);
    expect(shown.map((p) => p.text).join('')).toBe(paragraphText(paragraph));
    expect(pieces([word('ſ', 10)]).map((p) => p.text)).toEqual(['ſ']);
    expect(pieces([word('a', 20), word('b', 20)]).map((p) => p.text)).toEqual(['a', ' ', 'b']);
    expect(pieces([])).toEqual([]);
  });
});
