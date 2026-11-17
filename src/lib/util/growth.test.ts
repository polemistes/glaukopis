import { describe, expect, it } from 'vitest';
import { growth } from './growth';

/** Work that is kept: the sum of what a loop made. */
let kept = 0;

describe('how work grows', () => {
  it('is about four for work that grows with its size', () => {
    const linear = (n: number) => {
      for (let i = 0; i < n * 200; i++) kept += i % 7;
    };
    expect(growth(linear, 500)).toBeLessThan(8);
  });

  it('is far more for work that grows with the square of its size, though it is measured again', () => {
    const square = (n: number) => {
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) kept += (i ^ j) % 7;
    };
    expect(growth(square, 150, { times: 3 })).toBeGreaterThan(8);
    expect(kept).toBeGreaterThan(0);
    // Measured three times, since it never comes out low: given the time for that on a slow machine.
  }, 30000);
});
