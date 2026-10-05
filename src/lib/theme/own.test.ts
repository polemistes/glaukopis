import { describe, expect, it } from 'vitest';
import { contrast, derive, isDark, judge, mix, STARTS } from './own';

describe('a colouring of one’s own', () => {
  it('mixes colours in sRGB', () => {
    expect(mix('#000000', '#ffffff', 0.5)).toBe('#808080');
    expect(mix('#ff0000', '#0000ff', 0)).toBe('#ff0000');
  });
  it('tells a dark scheme by its paper, and derives every token of the design system', () => {
    expect(isDark(STARTS.dark)).toBe(true);
    expect(isDark(STARTS.light)).toBe(false);
    const tokens = derive(STARTS.mellow);
    expect(Object.keys(tokens)).toContain('--desk');
    expect(Object.keys(tokens).length).toBeGreaterThan(30);
    expect(tokens['--paper']).toBe(STARTS.mellow.paper);
    expect(tokens['--accent-ink']).toBe('#ffffff');
  });
  it('judges the contrast of ink and accent on the paper, as WCAG counts it', () => {
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 0);
    for (const start of Object.values(STARTS)) expect(judge(start).fine).toBe(true);
    expect(judge({ ...STARTS.light, ink: '#dddddd' }).fine).toBe(false);
  });
});
