import { describe, expect, it } from 'vitest';
import { AROUND, pageAsked, pageAt, pagesSeen, placePages, toLetGo, widthWanted } from './pages';

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

  it('asks for widths in steps, sharp on a dense screen, never too wide', () => {
    expect(widthWanted(500)).toBe(600);
    expect(widthWanted(500, 2)).toBe(1000);
    expect(widthWanted(9000, 2)).toBe(4000);
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
