import { describe, expect, it } from 'vitest';
import { clearance, joined, moved, piece, reach, type Outline } from './contour';

const flat = (x1: number, x2: number, y: number): Outline => piece(x1, y, x2, y);

describe('the outline of a branch', () => {
  it('a piece runs from left to right, and has width', () => {
    expect(piece(10, 0, 0, 5)).toEqual([{ x1: 0, x2: 10, y1: 5, y2: 0 }]);
    expect(piece(3, 1, 3, 2)).toEqual([]);
  });

  it('joined, the bottom keeps what lies lowest at each x, the top what lies highest', () => {
    const a = flat(0, 100, 20);
    const b = flat(50, 150, 40);
    expect(joined(a, b, true)).toEqual([
      { x1: 0, x2: 50, y1: 20, y2: 20 },
      { x1: 50, x2: 150, y1: 40, y2: 40 },
    ]);
    expect(joined(a, b, false)).toEqual([
      { x1: 0, x2: 100, y1: 20, y2: 20 },
      { x1: 100, x2: 150, y1: 40, y2: 40 },
    ]);
    // Where neither has anything, the outline has nothing.
    expect(joined(flat(0, 10, 0), flat(20, 30, 0), true)).toEqual([
      { x1: 0, x2: 10, y1: 0, y2: 0 },
      { x1: 20, x2: 30, y1: 0, y2: 0 },
    ]);
    expect(joined([], a, true)).toBe(a);
  });

  it('a line that crosses a box’s edge is followed from the crossing', () => {
    const box = flat(0, 100, 20);
    const line = piece(0, 0, 100, 40);
    expect(joined(box, line, true)).toEqual([
      { x1: 0, x2: 50, y1: 20, y2: 20 },
      { x1: 50, x2: 100, y1: 20, y2: 40 },
    ]);
    expect(joined(box, line, false)).toEqual([
      { x1: 0, x2: 50, y1: 0, y2: 20 },
      { x1: 50, x2: 100, y1: 20, y2: 20 },
    ]);
  });

  it('pieces that go straight on from one another are one', () => {
    const left = piece(0, 0, 50, 50);
    const right = piece(50, 50, 100, 100);
    expect(joined(left, right, true)).toEqual([{ x1: 0, x2: 100, y1: 0, y2: 100 }]);
    expect(joined(flat(0, 10, 5), flat(10, 20, 5), false)).toEqual([
      { x1: 0, x2: 20, y1: 5, y2: 5 },
    ]);
  });

  it('is moved, and reaches as high and as low as its pieces', () => {
    const o = moved(piece(0, 0, 100, 40), 10, 5);
    expect(o).toEqual([{ x1: 10, x2: 110, y1: 5, y2: 45 }]);
    expect(reach(o, true)).toBe(45);
    expect(reach(o, false)).toBe(5);
    expect(moved(o, 0, 0)).toBe(o);
  });

  it('the clearance is what the top must go down by to stand clear of the bottom, wherever they lie over each other', () => {
    // A box under a box.
    expect(clearance(flat(0, 100, 20), flat(0, 100, -20), 10)).toBe(50);
    // A box beside a line that falls away from it: it must clear the line at its right edge.
    expect(clearance(piece(100, 0, 200, 100), flat(0, 140, -10), 10)).toBe(60);
    // Nothing over nothing.
    expect(clearance(flat(0, 100, 20), flat(200, 300, 0), 10)).toBeNull();
  });
});
