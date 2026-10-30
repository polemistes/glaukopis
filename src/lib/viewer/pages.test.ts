import { describe, expect, it } from 'vitest';
import {
  AROUND,
  columnWidth,
  heightOf,
  lacking,
  pageAsked,
  pageAt,
  pageLeft,
  pagesSeen,
  placeAt,
  placePages,
  boxTransform,
  STILL,
  toLetGo,
  turned,
  under,
  wanted,
  widthWanted,
} from './pages';

const a4: [number, number] = [595, 842];

describe('the pages of a file in a side', () => {
  it('stand one under another, each as high as its size makes it', () => {
    const placed = placePages([a4, a4, [842, 595]], () => 500);
    expect(placed.tops[0]).toBe(AROUND.top);
    expect(placed.heights[0]).toBeCloseTo((500 * 842) / 595);
    expect(placed.tops[1]).toBeCloseTo(AROUND.top + placed.heights[0] + AROUND.between);
    expect(placed.heights[2]).toBeCloseTo((500 * 595) / 842);
  });

  it('finds the page at a height, and those seen with those beside them', () => {
    const placed = placePages(Array(10).fill(a4), () => 100);
    expect(pageAt(placed, 0)).toBe(1);
    expect(pageAt(placed, placed.tops[4] + 1)).toBe(5);
    expect(pageAt(placed, 1e9)).toBe(10);
    expect(pagesSeen(placed, placed.tops[4], placed.tops[5] + 1, 2)).toEqual([3, 4, 5, 6, 7, 8]);
    expect(pagesSeen(placed, 0, 1, 2)).toEqual([1, 2, 3]);
  });

  it('asks for the width shown, in the dots of the screen, never too wide', () => {
    expect(widthWanted(500)).toBe(500);
    expect(widthWanted(500.2)).toBe(501);
    expect(widthWanted(500, 2)).toBe(1000);
    expect(widthWanted(9000, 2)).toBe(4000);
  });

  it('places the pages a whole number of pixels wide', () => {
    expect(placePages([a4], () => 500.4).widths[0]).toBe(500);
  });

  it('draws a page again where it is too narrow or much too wide, not where it failed at that width', () => {
    expect(lacking(undefined, 500)).toBe(true);
    expect(lacking({ width: 500, pictured: true }, 500)).toBe(false);
    expect(lacking({ width: 480, pictured: true }, 500)).toBe(true);
    expect(lacking({ width: 600, pictured: true }, 500)).toBe(false);
    expect(lacking({ width: 700, pictured: true }, 500)).toBe(true);
    expect(lacking({ width: 500, pictured: false }, 500)).toBe(false);
    expect(lacking({ width: 400, pictured: false }, 500)).toBe(true);
  });

  it('fetches the pages nearest to the one in view first', () => {
    expect(wanted([3, 4, 5, 6, 7, 8], 6, () => true)).toEqual([6, 5, 7, 4, 8, 3]);
    expect(wanted([3, 4, 5, 6], 4, (n) => n !== 4)).toEqual([3, 5, 6]);
  });

  it('tells a place as a page and how far down it, which holds when the pages are shown larger', () => {
    const small = placePages(Array(10).fill(a4), () => 100);
    const large = placePages(Array(10).fill(a4), () => 300);
    const place = placeAt(small, small.tops[3] + small.heights[3] / 4);
    expect(place.page).toBe(4);
    expect(place.at).toBeCloseTo(0.25);
    expect(heightOf(large, place)).toBeCloseTo(large.tops[3] + large.heights[3] / 4);
    expect(placeAt(small, 0)).toEqual({ page: 1, at: 0 });
    expect(heightOf(small, { page: 99, at: 2 })).toBeCloseTo(small.tops[9] + small.heights[9]);
  });

  it('lets go the pages furthest from the one in view', () => {
    const kept = Array.from({ length: 45 }, (_, i) => i + 1);
    const gone = toLetGo(kept, 10, 40);
    expect(gone).toHaveLength(5);
    expect(gone.every((p) => p > 40)).toBe(true);
    expect(toLetGo([1, 2, 3], 1, 40)).toEqual([]);
  });

  it('goes to a page by its number in print, or by its count', () => {
    const labels = ['i', 'ii', '1', '2', '3'];
    expect(pageAsked('ii', labels)).toBe(2);
    expect(pageAsked('2', labels)).toBe(4);
    expect(pageAsked('5', labels)).toBe(5);
    expect(pageAsked('9', labels)).toBeNull();
    expect(pageAsked('', labels)).toBeNull();
  });
});

describe('where a page stands across the side', () => {
  const placed = placePages(
    [
      [100, 200],
      [50, 100],
    ],
    (w) => w * 4,
  );
  it('has the column as wide as the widest page with the room at its sides', () => {
    expect(columnWidth(placed)).toBe(400 + 2 * AROUND.side);
  });
  it('stands in the middle of a side wider than the column, and of the column where it is wider', () => {
    expect(pageLeft(placed, 0, 1000)).toBe(300);
    expect(pageLeft(placed, 1, 1000)).toBe(400);
    expect(pageLeft(placed, 0, 300)).toBe(AROUND.side);
    expect(pageLeft(placed, 1, 300)).toBe(AROUND.side + 100);
  });
});

describe('a zoom in progress, as a transform of the view', () => {
  const near = (a: [number, number], b: [number, number]) => {
    expect(a[0]).toBeCloseTo(b[0], 6);
    expect(a[1]).toBeCloseTo(b[1], 6);
  };

  it('keeps what lies under the pointer under it, turn after turn, wherever the pointer moves', () => {
    let g = STILL;
    const first = under(g, [200, 300]);
    g = turned(g, 1.2, [200, 300]);
    near(under(g, [200, 300]), first);
    // The pointer has moved: the point under it now is kept through the next turn.
    const second = under(g, [260, 310]);
    g = turned(g, 0.9, [260, 310]);
    near(under(g, [260, 310]), second);
    expect(g.s).toBeCloseTo(1.08);
  });

  it('composes the turns: two turns about one point are one turn by their product', () => {
    const q: [number, number] = [150, 400];
    const twice = turned(turned(STILL, 1.1, q), 1.25, q);
    const once = turned(STILL, 1.375, q);
    expect(twice.s).toBeCloseTo(once.s);
    near(twice.t, once.t);
  });

  it('transforms a box so that its corners are shown where the gesture shows them', () => {
    const g = turned(STILL, 2, [100, 100]);
    // The box laid out at (50, 300): its corner is shown at 100 + 2 · (50 − 100) = 0, 100 + 2 · (300 − 100) = 500.
    expect(boxTransform(g, [50, 300])).toBe('translate(-50px, 200px) scale(2)');
    expect(boxTransform(STILL, [50, 300])).toBe('translate(0px, 0px) scale(1)');
  });
});
