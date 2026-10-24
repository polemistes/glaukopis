import { describe, expect, it } from 'vitest';
import { clampZoom, keptZoom, percent, stepped } from './zoom';

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
