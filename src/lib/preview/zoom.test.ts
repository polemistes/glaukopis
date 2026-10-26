import { describe, expect, it } from 'vitest';
import { clampZoom, FILE, keptZoom, percent, rung, stepped, wheeled, zoomAsked } from './zoom';

describe('the zoom of the typesetting pane', () => {
  it('goes by tenths, from a step or from between two', () => {
    expect(stepped(1, 1)).toBe(1.1);
    expect(stepped(1, -1)).toBe(0.9);
    expect(stepped(1.5, 2)).toBe(1.7);
    // A page fitted to the pane at 87 % goes to 90 % or to 80 %.
    expect(stepped(0.87, 1)).toBe(0.9);
    expect(stepped(0.87, -1)).toBe(0.8);
    expect(stepped(1.25, -1)).toBe(1.2);
  });

  it('stays between half and three times the size of the page', () => {
    expect(stepped(0.5, -1)).toBe(0.5);
    expect(stepped(3, 1)).toBe(3);
    expect(clampZoom(0.1)).toBe(0.5);
    expect(clampZoom(7)).toBe(3);
  });

  it('is read from what was kept with care, none being the width of the pane', () => {
    expect(keptZoom(1.5)).toBe(1.5);
    expect(keptZoom(null)).toBe(null);
    expect(keptZoom('2')).toBe(null);
    expect(keptZoom(-1)).toBe(null);
    expect(keptZoom(Number.NaN)).toBe(null);
    expect(keptZoom(9)).toBe(3);
  });

  it('is said as a whole percentage', () => {
    expect(percent(1.25)).toBe(125);
    expect(percent(0.874)).toBe(87);
  });
});

describe('the zoom of a file in a side', () => {
  it('goes by rungs of a ladder with a hundred percent on it, six to a doubling', () => {
    expect(rung(1, 6)).toBe(2);
    expect(rung(1, -6)).toBe(0.5);
    expect(rung(0.5, 6)).toBe(1);
    expect(rung(1, 1)).toBeCloseTo(1.122, 3);
    expect(rung(1, -1)).toBeCloseTo(0.891, 3);
    // From between two rungs, to the one in the direction asked.
    expect(rung(1.05, 1)).toBeCloseTo(1.122, 3);
    expect(rung(1.05, -1)).toBe(1);
    expect(rung(0.125, -1)).toBeCloseTo(0.111, 3);
    expect(rung(4, 12)).toBe(8);
    expect(rung(0.05, -1)).toBe(0.05);
  });

  it('turns with the wheel: a notch near a rung, a touchpad as small as it turns, never more than a quarter', () => {
    expect(wheeled(1, -40)).toBeCloseTo(1.105, 3);
    expect(wheeled(1, 40)).toBeCloseTo(0.905, 3);
    expect(wheeled(1, -4)).toBeCloseTo(1.01, 3);
    expect(wheeled(1, -1000)).toBeCloseTo(1.284, 3);
    expect(wheeled(1, -1, 1)).toBeCloseTo(1.105, 3);
    expect(wheeled(0.05, 40)).toBe(0.05);
    expect(wheeled(8, -40)).toBe(8);
    // The least zooms still move: not rounded away.
    expect(wheeled(0.05, -1)).toBeGreaterThan(0.05);
  });

  it('is read from a field in percent, with or without the sign, a comma as a point', () => {
    expect(zoomAsked('150')).toBe(1.5);
    expect(zoomAsked(' 150 % ')).toBe(1.5);
    expect(zoomAsked('12,5')).toBe(0.125);
    expect(zoomAsked('12.5%')).toBe(0.125);
    expect(zoomAsked('1')).toBe(0.05);
    expect(zoomAsked('5000')).toBe(8);
    expect(zoomAsked('')).toBe(null);
    expect(zoomAsked('0')).toBe(null);
    expect(zoomAsked('wide')).toBe(null);
  });

  it('is kept within the wide range of a file', () => {
    expect(keptZoom(0.1, FILE)).toBe(0.1);
    expect(keptZoom(9, FILE)).toBe(8);
    expect(keptZoom(0.1)).toBe(0.5);
  });
});
