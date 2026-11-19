import { describe, expect, it } from 'vitest';
import {
  colourOf,
  fontOf,
  handMarkAttrs,
  handOf,
  lengthOf,
  pointsOf,
  sameHand,
  sizeOf,
} from './hand';

describe('what is set by hand of words, as it is kept', () => {
  it('a font by its name, without what could be read as something else', () => {
    expect(fontOf('EB Garamond')).toBe('EB Garamond');
    expect(fontOf({ family: '  Noto   Serif ' })).toBe('Noto Serif');
    expect(fontOf('Evil"; } body { color: red')).toBe('Evil body color: red');
    expect(fontOf('')).toBeNull();
    expect(fontOf('x'.repeat(101))).toBeNull();
    expect(fontOf(12)).toBeNull();
  });

  it('a size in points, to the half point, within what letters can be', () => {
    expect(sizeOf(12)).toBe(12);
    expect(sizeOf({ pt: 10.26 })).toBe(10.5);
    expect(sizeOf('14')).toBe(14);
    expect(sizeOf(3)).toBeNull();
    expect(sizeOf(401)).toBeNull();
    expect(sizeOf('large')).toBeNull();
    expect(sizeOf(NaN)).toBeNull();
  });

  it('a colour as six letters of sixteen, small', () => {
    expect(colourOf('#A02020')).toBe('#a02020');
    expect(colourOf({ value: '#abc' })).toBe('#aabbcc');
    expect(colourOf('red')).toBeNull();
    expect(colourOf('#12345')).toBeNull();
    expect(colourOf('url(x)')).toBeNull();
  });

  it('each as the attributes of its mark, or nothing', () => {
    expect(handMarkAttrs('font', 'Futura')).toEqual({ family: 'Futura' });
    expect(handMarkAttrs('size', 20)).toEqual({ pt: 20 });
    expect(handMarkAttrs('colour', '#A02020')).toEqual({ value: '#a02020' });
    expect(handMarkAttrs('colour', 'tomato')).toBeNull();
  });
});

describe('how a paragraph stands by hand, as it is kept', () => {
  it('only what is said, and said well', () => {
    expect(
      handOf({
        align: 'center',
        lineSpacing: 1.5,
        spaceBefore: '6 pt',
        spaceAfter: '0.5CM',
        indentLeft: 'wide',
        firstLine: '0pt',
        colour: '#fff',
      }),
    ).toEqual({
      align: 'center',
      lineSpacing: 1.5,
      spaceBefore: '6pt',
      spaceAfter: '0.5cm',
      firstLine: '0pt',
    });
    expect(handOf({ align: 'middle', lineSpacing: 40 })).toBeNull();
    expect(handOf(null)).toBeNull();
    expect(handOf('center')).toBeNull();
  });

  it('lengths with their unit, and in points', () => {
    expect(lengthOf('1cm')).toBe('1cm');
    expect(lengthOf('-2.50 mm')).toBe('-2.5mm');
    expect(lengthOf('3em')).toBeNull();
    expect(lengthOf('12')).toBeNull();
    expect(pointsOf('1in')).toBe(72);
    expect(Math.round(pointsOf('1cm') * 100) / 100).toBe(28.35);
  });

  it('two that say the same are the same, in whatever order they say it', () => {
    expect(
      sameHand({ align: 'center', spaceAfter: '6pt' }, { spaceAfter: '6pt', align: 'center' }),
    ).toBe(true);
    expect(sameHand(null, {})).toBe(true);
    expect(sameHand({ align: 'center' }, { align: 'right' })).toBe(false);
  });
});
