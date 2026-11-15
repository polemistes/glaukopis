import { describe, expect, it } from 'vitest';
import { kindColour } from '../kinds';
import { arrowheadsOf, associationCurve, type Box } from './layout';
import { associationDrawn } from './lines';

const a: Box = { id: 'a', x: 0, y: 0, w: 120, h: 40 };
const b: Box = { id: 'b', x: 300, y: 160, w: 90, h: 30 };

describe('one association, drawn from two boxes and a record', () => {
  it('is the curve between the boxes, its middle, its words, its heads and its colour', () => {
    const link = {
      id: 'l',
      from: 'a',
      to: 'b',
      label: 'kills',
      arrow: 'to' as const,
      colour: 'teal',
    };
    const c = associationCurve(a, b);
    expect(associationDrawn(link, a, b)).toEqual({
      id: 'l',
      path: c.path,
      middle: c.middle,
      label: 'kills',
      heads: arrowheadsOf(c, 'to'),
      colour: kindColour('teal').ink,
      faint: false,
    });
  });

  it('has no heads without an arrow, and the gold of an association without a colour', () => {
    const drawn = associationDrawn({ id: 'l', from: 'a', to: 'b', label: '' }, a, b);
    expect(drawn.heads).toEqual([]);
    expect(drawn.colour).toBeNull();
    expect(drawn.path.startsWith('M ')).toBe(true);
  });

  it('is faint where a box is shown in place of an end', () => {
    const folded = { id: 'l', from: 'a', to: 'hidden', label: '' };
    expect(associationDrawn(folded, a, b).faint).toBe(true);
  });

  it('needs of a box only its id, centre and size', () => {
    const plain = { id: 'n1', x: 10, y: 10, w: 200, h: 80 };
    const other = { id: 'n2', x: 400, y: -50, w: 200, h: 80 };
    const drawn = associationDrawn({ id: 'l', from: 'n1', to: 'n2', label: 'x' }, plain, other);
    expect(drawn.path).toBe(associationCurve(plain, other).path);
  });
});
