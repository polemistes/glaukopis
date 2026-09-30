import { describe, expect, it } from 'vitest';
import { compare, type Compared } from './compare';

/** The first text again, and the second, from what was compared. */
const first = (c: Compared[]) =>
  c
    .filter((p) => p.status !== 'new')
    .map((p) => p.text)
    .join('');
const second = (c: Compared[]) =>
  c
    .filter((p) => p.status !== 'gone')
    .map((p) => p.text)
    .join('');

describe('where two texts differ', () => {
  it('is nowhere, in the same text', () => {
    expect(compare('Sing, goddess, the wrath.', 'Sing, goddess, the wrath.')).toEqual([
      { text: 'Sing, goddess, the wrath.', status: 'same' },
    ]);
    expect(compare('', '')).toEqual([]);
  });

  it('is in the words that were put in, taken away or changed', () => {
    const c = compare(
      'Sing, goddess, the wrath of Achilles.',
      'Sing, muse, the wrath of Achilles.',
    );
    expect(c).toEqual([
      { text: 'Sing, ', status: 'same' },
      { text: 'goddess', status: 'gone' },
      { text: 'muse', status: 'new' },
      { text: ', the wrath of Achilles.', status: 'same' },
    ]);
    expect(compare('the wrath', 'the great wrath')).toEqual([
      { text: 'the ', status: 'same' },
      { text: 'great ', status: 'new' },
      { text: 'wrath', status: 'same' },
    ]);
    expect(compare('', 'all new')).toEqual([{ text: 'all new', status: 'new' }]);
    expect(compare('all gone', '')).toEqual([{ text: 'all gone', status: 'gone' }]);
  });

  it('gives back both texts whole, however they differ', () => {
    const pairs: [string, string][] = [
      ['μῆνιν ἄειδε θεὰ', 'μῆνιν ἄειδε, θεά, Πηληϊάδεω'],
      ['a b c d e f', 'f e d c b a'],
      ['One.\n\nTwo, three.', 'One, two.\n\nThree.'],
    ];
    for (const [a, b] of pairs) {
      const c = compare(a, b);
      expect(first(c)).toBe(a);
      expect(second(c)).toBe(b);
    }
  });

  it('says that long texts that differ everywhere differ as wholes', () => {
    const a = Array.from({ length: 3000 }, (_, i) => `a${i}`).join(' ');
    const b = Array.from({ length: 3000 }, (_, i) => `b${i}`).join(' ');
    const c = compare(a, b);
    expect(first(c)).toBe(a);
    expect(second(c)).toBe(b);
    // A long text with a change or two is compared word by word.
    const changed = a.replace('a1500', 'changed');
    expect(compare(a, changed).filter((p) => p.status !== 'same')).toEqual([
      { text: 'a1500', status: 'gone' },
      { text: 'changed', status: 'new' },
    ]);
  });
});
