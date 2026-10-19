import { describe, expect, it } from 'vitest';
import type { Spot } from '$lib/api/documents';
import { lookFor, readWhat, spotsOn, TEXT, whatIs } from './spots';

const spot = (page: number, top: number, bottom: number, what: string): Spot => ({
  page,
  top,
  bottom,
  what,
});

// Two pages as the core tells them: the title block, a quotation, a
// heading, a note at the foot; and an appendix that goes on over the next,
// with a heading in it and a note at its foot.
const SPOTS: Spot[] = [
  spot(1, 72, 140, 'front'),
  spot(1, 180, 230, 'kind:quote'),
  spot(1, 250, 268, 'heading:1'),
  spot(1, 600, 770, 'part:appendix'),
  spot(1, 740, 760, 'note'),
  spot(2, 72, 770, 'part:appendix'),
  spot(2, 300, 318, 'heading:2'),
];

describe('what a line is', () => {
  it('is what the spot that holds its baseline is', () => {
    expect(whatIs(SPOTS, 1, 100)).toBe('front');
    expect(whatIs(SPOTS, 1, 200)).toBe('kind:quote');
    expect(whatIs(SPOTS, 1, 262)).toBe('heading:1');
  });

  it('is text where no spot holds it', () => {
    // Between the quotation and the heading, above the title block, and in the margin at the foot.
    expect(whatIs(SPOTS, 1, 240)).toBe(TEXT);
    expect(whatIs(SPOTS, 1, 40)).toBe('text');
    expect(whatIs(SPOTS, 2, 800)).toBe('text');
    expect(whatIs([], 1, 100)).toBe('text');
  });

  it('is the innermost of the spots that hold it', () => {
    // A note at the foot of a page that the appendix goes on from; a heading within the appendix.
    expect(whatIs(SPOTS, 1, 750)).toBe('note');
    expect(whatIs(SPOTS, 1, 700)).toBe('part:appendix');
    expect(whatIs(SPOTS, 2, 310)).toBe('heading:2');
    expect(whatIs(SPOTS, 2, 400)).toBe('part:appendix');
    // Of two as high, the later.
    expect(whatIs([spot(1, 0, 10, 'figure'), spot(1, 0, 10, 'table')], 1, 5)).toBe('table');
  });

  it('is of its own page', () => {
    expect(whatIs(SPOTS, 2, 200)).toBe('part:appendix');
    expect(whatIs(SPOTS, 3, 200)).toBe('text');
    expect(spotsOn(SPOTS, 2).map((s) => s.what)).toEqual(['part:appendix', 'heading:2']);
    expect(spotsOn(SPOTS, 3)).toEqual([]);
  });

  it('holds a baseline at the very edge of a spot, and none beyond it', () => {
    // Where the type has no room below its baseline, the last line ends where the block does.
    expect(whatIs(SPOTS, 1, 230)).toBe('kind:quote');
    expect(whatIs(SPOTS, 1, 230.4)).toBe('kind:quote');
    expect(whatIs(SPOTS, 1, 179.6)).toBe('kind:quote');
    expect(whatIs(SPOTS, 1, 231)).toBe('text');
  });
});

describe('what a line is, taken apart', () => {
  it('reads every sort the core names', () => {
    expect(readWhat('kind:quote')).toEqual({ sort: 'kind', id: 'quote' });
    expect(readWhat('kind:k-3f9a')).toEqual({ sort: 'kind', id: 'k-3f9a' });
    expect(readWhat('part:appendix')).toEqual({ sort: 'part', id: 'appendix' });
    expect(readWhat('part:list-of-figures')).toEqual({ sort: 'part', id: 'list-of-figures' });
    expect(readWhat('heading:3')).toEqual({ sort: 'heading', level: 3 });
    for (const sort of ['note', 'bibliography', 'figure', 'table', 'front', 'text'] as const)
      expect(readWhat(sort)).toEqual({ sort });
  });

  it('reads what it does not know as text', () => {
    for (const what of [
      '',
      'kind:',
      'part:',
      'heading:',
      'heading:0',
      'heading:two',
      'note:1',
      'margin',
      'x:y',
    ])
      expect(readWhat(what)).toEqual({ sort: 'text' });
  });
});

describe('where Look opens', () => {
  it('opens at the section and in it at what the line is', () => {
    expect(lookFor('kind:quote')).toEqual({ section: 'paragraphs', kind: 'quote' });
    expect(lookFor('kind:k-3f9a')).toEqual({ section: 'paragraphs', kind: 'k-3f9a' });
    expect(lookFor('part:appendix')).toEqual({ section: 'contents' });
    expect(lookFor('part:contents')).toEqual({ section: 'contents' });
    expect(lookFor('heading:2')).toEqual({ section: 'headings', level: 2 });
    expect(lookFor('note')).toEqual({ section: 'notes' });
    expect(lookFor('bibliography')).toEqual({ section: 'notes', at: 'bibliography' });
    expect(lookFor('figure')).toEqual({ section: 'figures' });
    expect(lookFor('table')).toEqual({ section: 'figures' });
    expect(lookFor('front')).toEqual({ section: 'front' });
    expect(lookFor('text')).toEqual({ section: 'type' });
  });

  it('opens at the type for what it does not know', () => {
    expect(lookFor('margin')).toEqual({ section: 'type' });
    expect(lookFor('heading:none')).toEqual({ section: 'type' });
  });
});
