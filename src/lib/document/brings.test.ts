import { describe, expect, it } from 'vitest';
import type { FormatSummary } from '$lib/api/documents';
import type { Requirements } from '$lib/api/templates';
import { limitsBrought, pagesBrought, partsBrought } from './brings';

const layout = (over: Partial<FormatSummary> = {}): FormatSummary => ({
  id: 'manuscript',
  name: 'Manuscript',
  kind: 'general',
  description: '',
  own: false,
  confidence: '',
  checked: '',
  paper: 'a4',
  width: '21cm',
  height: '29.7cm',
  font: 'Times New Roman',
  size: 12,
  lineSpacing: 2,
  ...over,
});

const none: Requirements = {
  words: null,
  abstractWords: null,
  keywords: null,
  anonymous: false,
  note: '',
};

describe('what a document type brings', () => {
  it('names its parts in their order, those made and those of a kind', () => {
    expect(
      partsBrought([
        { part: 'title-page' },
        { kind: 'abstract' },
        { part: 'body' },
        { part: 'bibliography' },
      ]),
    ).toBe('Title page · Abstract · The text · Bibliography');
  });

  it('names a kind it does not know by its id', () => {
    expect(partsBrought([{ kind: 'colophon' }])).toBe('colophon');
  });

  it('says the paper, the font with its size and the line spacing of its layout', () => {
    expect(pagesBrought(layout())).toBe('A4 · Times New Roman 12 pt · Line spacing 2');
    expect(pagesBrought(layout({ paper: 'a5', font: 'Libertinus Serif', size: 10.5 }))).toBe(
      'A5 · Libertinus Serif 10.5 pt · Line spacing 2',
    );
  });

  it('says a paper of the writer’s own by its width and height', () => {
    expect(pagesBrought(layout({ paper: 'custom', width: '12.9cm', height: '19.8cm' }))).toMatch(
      /^12\.9cm × 19\.8cm · /,
    );
  });

  it('says the reference style after the pages, where one is named', () => {
    expect(pagesBrought(layout({ lineSpacing: 1.5 }), 'APA 7th')).toBe(
      'A4 · Times New Roman 12 pt · Line spacing 1.5 · APA 7th',
    );
    expect(pagesBrought(undefined, 'APA 7th')).toBe('APA 7th');
  });

  it('says nothing of a type that requires nothing', () => {
    expect(limitsBrought(none)).toBe('');
  });

  it('says the limits it sets, and that it is anonymous', () => {
    expect(
      limitsBrought({ ...none, words: 8000, abstractWords: 200, keywords: 5, anonymous: true }),
    ).toBe('Words of text 8,000 · Words of abstract 200 · Keywords 5 · Anonymous');
  });
});
