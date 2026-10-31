import { describe, expect, it } from 'vitest';
import {
  countHeading,
  countedThrough,
  headingNumber,
  resolvedNumbering,
  styledNumber,
  throughLevels,
  type Headings,
} from './headingNumbers';

const level = (numbering = 'as-above', counted = 'under') =>
  ({ numbering, counted }) as Headings['levels'][number];
const numberOf = (h: Headings, counts: number[]) =>
  headingNumber(counts, resolvedNumbering(h), throughLevels(h));

describe('the numbers of headings as the document prints them', () => {
  it('follow the levels, as the core numbers them', () => {
    const h: Headings = { numbered: true, levels: [level(), level(), level()] };
    expect(resolvedNumbering(h)).toEqual(['arabic', 'arabic', 'arabic']);
    expect(numberOf(h, [2, 1, 3])).toBe('2.1.3');
    // Level 3 none: not numbered, the deeper as it.
    h.levels[2].numbering = 'none';
    expect(numberOf(h, [2, 1, 3])).toBeNull();
    expect(numberOf(h, [2, 1])).toBe('2.1');
    // Level 1 roman, level 2 as above: in its style, under its number.
    h.levels[2].numbering = 'as-above';
    h.levels[0].numbering = 'roman';
    expect(numberOf(h, [4, 2])).toBe('IV.II');
    h.levels[1].numbering = 'arabic';
    expect(numberOf(h, [4, 2])).toBe('IV.2');
    expect(numberOf(h, [4, 2, 1])).toBe('IV.2.1');
    // A level not numbered between: the numbers of the numbered levels.
    h.levels[1].numbering = 'none';
    h.levels[2].numbering = 'alpha-lower';
    expect(numberOf(h, [4, 2, 3])).toBe('IV.c');
    // Deeper than the levels say: as the last.
    expect(numberOf(h, [4, 2, 3, 2])).toBe('IV.c.b');
    // Not numbered at all, whatever the levels say.
    h.numbered = false;
    expect(resolvedNumbering(h)).toEqual([null, null, null]);
    expect(numberOf(h, [1])).toBeNull();
    // No format at all: nothing to number by.
    expect(resolvedNumbering(undefined)).toEqual([]);
    expect(headingNumber([1, 2], ['arabic'], [])).toBe('1.2');
  });

  it('count a level on through the document', () => {
    // Three parts of three chapters, the chapters 1 to 9 (record 0078).
    const h: Headings = {
      numbered: true,
      levels: [level('roman'), level('arabic', 'through'), level()],
    };
    expect(throughLevels(h)).toEqual([false, true, false]);
    const numbering = resolvedNumbering(h);
    const through = throughLevels(h);
    const counts = [0, 0, 0, 0, 0, 0];
    const numbers: (string | null)[] = [];
    for (const l of [0, 1, 2, 2, 1, 1, 0, 1, 2, 1, 1, 0, 1, 1, 1]) {
      countHeading(counts, l, through);
      numbers.push(headingNumber(counts.slice(0, l + 1), numbering, through));
    }
    expect(numbers).toEqual([
      'I',
      '1',
      '1.1',
      '1.2',
      '2',
      '3',
      'II',
      '4',
      '4.1',
      '5',
      '6',
      'III',
      '7',
      '8',
      '9',
    ]);
    // The first level is never counted through: nothing above begins it anew.
    h.levels[0].counted = 'through';
    expect(throughLevels(h)).toEqual([false, true, false]);
    expect(countedThrough([false, true], 5)).toBe(true);
    expect(countedThrough([], 2)).toBe(false);
  });

  it('write numbers in each style', () => {
    expect(styledNumber(1994, 'roman')).toBe('MCMXCIV');
    expect(styledNumber(3, 'roman-lower')).toBe('iii');
    expect(styledNumber(28, 'letters')).toBe('AB');
    expect(styledNumber(26, 'letters')).toBe('Z');
    expect(styledNumber(27, 'letters-lower')).toBe('aa');
    expect(styledNumber(7, 'arabic')).toBe('7');
  });
});
