import { describe, expect, it } from 'vitest';
import { hexOfColour } from './ground';

describe('the ground told to Android', () => {
  it('is a colour as #rrggbb, however the browser gives it', () => {
    expect(hexOfColour('rgb(251, 250, 247)')).toBe('#fbfaf7');
    expect(hexOfColour('rgba(23, 27, 29, 1)')).toBe('#171b1d');
    expect(hexOfColour('rgb(23 27 29)')).toBe('#171b1d');
    expect(hexOfColour(' #FBFAF7 ')).toBe('#fbfaf7');
    expect(hexOfColour('#abc')).toBe('#aabbcc');
  });

  it('is none where the colour is clear or not read', () => {
    expect(hexOfColour('rgba(0, 0, 0, 0)')).toBeNull();
    expect(hexOfColour('transparent')).toBeNull();
    expect(hexOfColour('')).toBeNull();
  });
});
