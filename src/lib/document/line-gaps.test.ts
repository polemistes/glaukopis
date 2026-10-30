import { describe, expect, it } from 'vitest';
import type { DocumentFormat } from '$lib/api/documents';
import { annotationsGap, annotationsGapWhere, numbersGap } from './line-gaps';

const verse = (more: Partial<DocumentFormat['verse']> = {}): DocumentFormat['verse'] => ({
  every: 5,
  side: 'left',
  ...more,
});

describe('the distance of the numbers and the annotations from the text', () => {
  it("is the core's default where the layout says none", () => {
    expect(numbersGap(verse())).toBe('0.25cm');
    // Across from the numbers, as far as they; on their side, outside them.
    expect(annotationsGap(verse(), 'left')).toBe('0.25cm');
    expect(annotationsGap(verse({ annotations: 'left' }), 'left')).toBe('1.5cm');
    expect(annotationsGap(verse({ annotations: 'left' }), 'right')).toBe('0.25cm');
    expect(annotationsGapWhere(verse({ numbersGap: '1cm' }), false)).toBe('1cm');
  });

  it("is the layout's where it says one, wherever they stand", () => {
    const given = verse({ annotations: 'left', numbersGap: '5mm', annotationsGap: '2cm' });
    expect(numbersGap(given)).toBe('5mm');
    expect(annotationsGap(given, 'left')).toBe('2cm');
    expect(annotationsGap(given, 'right')).toBe('2cm');
  });
});
