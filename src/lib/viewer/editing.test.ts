import { describe, expect, it } from 'vitest';
import {
  clampedCrop,
  cssFilter,
  cssTransform,
  cutSize,
  flipped,
  isNothing,
  nothing,
  shownSize,
  turned,
} from './editing';

describe('an image edited', () => {
  it('changes nothing at first', () => {
    expect(isNothing(nothing())).toBe(true);
    expect(cssTransform(nothing())).toBe('');
    expect(cssFilter(nothing())).toBe('');
    expect(isNothing({ ...nothing(), crop: { x: 0, y: 0, width: 1, height: 1 } })).toBe(true);
  });

  it('is turned by quarters, its size swapped for odd turns', () => {
    const once = turned(nothing(), 1);
    expect(once.turns).toBe(1);
    expect(shownSize(once, 4, 3)).toEqual([3, 4]);
    expect(shownSize(turned(once, 1), 4, 3)).toEqual([4, 3]);
    expect(turned(nothing(), -1).turns).toBe(3);
    expect(isNothing(turned(once, -1))).toBe(true);
  });

  it('writes the turn before the flip, which the browser applies from the right', () => {
    const edit = flipped(turned(nothing(), 1), 'x');
    expect(cssTransform(edit)).toBe('scale(-1, 1) rotate(90deg)');
    expect(cssFilter({ ...nothing(), brightness: 150, saturation: 0 })).toBe(
      'brightness(1.5) contrast(1) saturate(0)',
    );
  });

  it('turns and flips the crop with the image, so that it covers the same part', () => {
    const left = { ...nothing(), crop: { x: 0, y: 0, width: 0.5, height: 1 } };
    // The left half, turned right, is the top half.
    expect(turned(left, 1).crop).toEqual({ x: 0, y: 0, width: 1, height: 0.5 });
    expect(turned(turned(left, 1), -1).crop).toEqual(left.crop);
    expect(flipped(left, 'x').crop).toEqual({ x: 0.5, y: 0, width: 0.5, height: 1 });
  });

  it('keeps a crop within the frame', () => {
    expect(clampedCrop({ x: 0.8, y: -0.1, width: 0.5, height: 2 })).toEqual({
      x: 0.5,
      y: 0,
      width: 0.5,
      height: 1,
    });
    expect(clampedCrop({ x: 0, y: 0, width: 0, height: 0 }).width).toBeGreaterThan(0);
  });

  it('says the pixels a crop cuts to, as the core rounds them', () => {
    const left = { ...nothing(), crop: { x: 0, y: 0, width: 0.5, height: 1 } };
    expect(cutSize(left, 4, 3)).toEqual([2, 3]);
    expect(cutSize(nothing(), 4, 3)).toEqual([4, 3]);
    expect(cutSize({ ...left, turns: 1 }, 4, 3)).toEqual([2, 4]);
    expect(
      cutSize({ ...nothing(), crop: { x: 0, y: 0, width: 0.0001, height: 0.0001 } }, 4, 3),
    ).toEqual([1, 1]);
  });
});
