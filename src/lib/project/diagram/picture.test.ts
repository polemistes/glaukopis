import { describe, expect, it } from 'vitest';
import { toSvg, type Picture } from './picture';

// What is read from the screen is tried by the script `diagram-picture` and
// `associations`, in the real web view: jsdom draws nothing. Here, what is
// written of what was read.

describe('the picture as SVG', () => {
  it('writes an arrowhead as a filled path beside its dashed curve, faint as the curve is', () => {
    const teal = { hex: '#0e7490', alpha: 1 };
    const picture: Picture = {
      view: { x: 0, y: 0, w: 200, h: 100 },
      background: null,
      title: 'Iliad',
      shapes: [
        {
          kind: 'path',
          d: 'M 10 10 Q 100 80 190 10',
          fill: null,
          stroke: teal,
          strokeWidth: 1.5,
          dash: [5, 4],
          cap: 'round',
          opacity: 0.45,
        },
        {
          kind: 'path',
          d: 'M 190 10 L 180.5 13.2 L 185.3 19.6 Z',
          fill: teal,
          stroke: null,
          strokeWidth: 0,
          dash: [],
          cap: 'butt',
          opacity: 0.45,
        },
      ],
    };
    const svg = toSvg(picture);
    expect(svg).toContain(
      '<path d="M 10 10 Q 100 80 190 10" fill="none" stroke="#0e7490" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="5 4" opacity="0.45"/>',
    );
    expect(svg).toContain(
      '<path d="M 190 10 L 180.5 13.2 L 185.3 19.6 Z" fill="#0e7490" opacity="0.45"/>',
    );
  });
});
