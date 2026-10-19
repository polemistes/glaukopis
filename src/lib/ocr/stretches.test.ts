import { describe, expect, it } from 'vitest';
import {
  askedOf,
  beginStretch,
  firstStretch,
  pagesOf,
  removeStretch,
  stretchesAtOutline,
  stretchOf,
  withCurrent,
} from './stretches';

const eng = { languages: ['eng'], layout: '' as const };
const grc = { languages: ['grc', 'eng'], layout: 'column' as const };

describe('stretches of pages read otherwise', () => {
  it('begin with the whole, and a stretch begun is put in its place', () => {
    const list = firstStretch(eng);
    const { list: two, index } = beginStretch(list, 39, grc);
    expect(index).toBe(1);
    expect(two).toEqual([
      { from: 1, languages: ['eng'], layout: '' },
      { from: 39, languages: ['grc', 'eng'], layout: 'column' },
    ]);
    const { list: three, index: middle } = beginStretch(two, 12, eng);
    expect(middle).toBe(1);
    expect(three.map((s) => s.from)).toEqual([1, 12, 39]);
    // Begun again where one begins, it is that one.
    expect(beginStretch(three, 39, eng)).toEqual({ list: three, index: 2 });
  });

  it('hold the pages up to the next', () => {
    const list = [
      { from: 1, ...eng },
      { from: 12, ...eng },
      { from: 39, ...grc },
    ];
    expect([1, 11, 12, 38, 39, 400].map((p) => stretchOf(list, p))).toEqual([0, 0, 1, 1, 2, 2]);
    expect(pagesOf(list, 0, 400)).toEqual({ from: 1, to: 11 });
    expect(pagesOf(list, 2, 400)).toEqual({ from: 39, to: 400 });
  });

  it('give their pages to the one before when taken away, and the first stays', () => {
    const list = [
      { from: 1, ...eng },
      { from: 39, ...grc },
    ];
    expect(removeStretch(list, 1)).toEqual([{ from: 1, ...eng }]);
    expect(removeStretch(list, 0)).toBe(list);
  });

  it('take what the picker and the layout hold for the current one', () => {
    const list = [
      { from: 1, ...eng },
      { from: 39, ...eng },
    ];
    expect(withCurrent(list, 1, grc)[1]).toEqual({ from: 39, ...grc });
    expect(withCurrent(list, 1, grc)[0]).toEqual({ from: 1, ...eng });
  });

  it('may begin at the parts of the outline', () => {
    const outline = [
      { title: 'Preface', page: 1 },
      { title: 'Part One', page: 12 },
      { title: 'Part Two', page: 80 },
      { title: 'Beyond', page: 900 },
    ];
    expect(stretchesAtOutline(firstStretch(eng), outline, 400, grc).map((s) => s.from)).toEqual([
      1, 12, 80,
    ]);
  });

  it('are asked as the whole and its stretches', () => {
    expect(
      askedOf([
        { from: 1, ...eng },
        { from: 39, ...grc },
      ]),
    ).toEqual({
      languages: ['eng'],
      layout: '',
      stretches: [{ from: 39, languages: ['grc', 'eng'], layout: 'column' }],
    });
  });
});
