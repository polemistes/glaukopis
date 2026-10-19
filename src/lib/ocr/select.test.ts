import { describe, expect, it } from 'vitest';
import { t } from '$lib/i18n';
import { pagesOfPart, pagesOfRun, rangeBetween, selectionSaid, toggled } from './select';

describe('the pages selected', () => {
  it('gain a page, or lose it where it was in them, in order', () => {
    expect(toggled([], 4)).toEqual([4]);
    expect(toggled([2, 9], 4)).toEqual([2, 4, 9]);
    expect(toggled([2, 4, 9], 4)).toEqual([2, 9]);
    // The last taken away: none, which is every page.
    expect(toggled([4], 4)).toEqual([]);
  });

  it('run from one page to another, both ends in, whichever comes first', () => {
    expect(rangeBetween(3, 6)).toEqual([3, 4, 5, 6]);
    expect(rangeBetween(6, 3)).toEqual([3, 4, 5, 6]);
    expect(rangeBetween(5, 5)).toEqual([5]);
  });

  it('are the pages of a run', () => {
    expect(pagesOfRun({ from: 39, to: 42 })).toEqual([39, 40, 41, 42]);
    expect(pagesOfRun({ from: 1, to: 1 })).toEqual([1]);
  });
});

describe('the pages of a part of the outline', () => {
  const outline = [
    { title: 'Preface', page: 3 },
    { title: 'One', page: 7 },
    { title: 'Two', page: 12 },
  ];

  it('run to the page before the next part, or to the end', () => {
    expect(pagesOfPart(outline, 0, 20)).toEqual([3, 4, 5, 6]);
    expect(pagesOfPart(outline, 1, 20)).toEqual([7, 8, 9, 10, 11]);
    expect(pagesOfPart(outline, 2, 14)).toEqual([12, 13, 14]);
  });

  it('hold their pages where the parts are out of order, or two begin on a page', () => {
    const odd = [
      { title: 'Two', page: 12 },
      { title: 'One', page: 7 },
      { title: 'One, again', page: 7 },
    ];
    expect(pagesOfPart(odd, 1, 14)).toEqual([7, 8, 9, 10, 11]);
    expect(pagesOfPart(odd, 2, 14)).toEqual([7, 8, 9, 10, 11]);
    expect(pagesOfPart(odd, 0, 14)).toEqual([12, 13, 14]);
  });

  it('are none past the end, or for a part that is not there', () => {
    expect(pagesOfPart(outline, 2, 10)).toEqual([]);
    expect(pagesOfPart(outline, 5, 20)).toEqual([]);
    expect(pagesOfPart([{ title: 'Nowhere', page: 0 }], 0, 20)).toEqual([]);
  });
});

describe('the pages selected, said', () => {
  it('say nothing for every page, for the caller to say', () => {
    expect(selectionSaid([], 559, t)).toBe('');
    expect(selectionSaid([1, 2, 3], 3, t)).toBe('');
    expect(selectionSaid([3, 1, 2, 2], 3, t)).toBe('');
  });

  it('say one page, and pages as stretches', () => {
    expect(selectionSaid([280], 559, t)).toBe('page 280');
    expect(selectionSaid([5, 3, 4, 9], 559, t)).toBe('pages 3–5, 9');
    expect(
      selectionSaid(
        Array.from({ length: 82 }, (_, i) => 39 + i),
        559,
        t,
      ),
    ).toBe('pages 39–120');
  });

  it('leave out pages that are not there', () => {
    expect(selectionSaid([2, 700], 559, t)).toBe('page 2');
    expect(selectionSaid([700], 559, t)).toBe('');
  });
});
