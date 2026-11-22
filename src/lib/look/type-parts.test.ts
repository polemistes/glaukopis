import { describe, expect, it } from 'vitest';
import type { ContentsItem } from '$lib/api/templates';
import { suggestedParts } from '$lib/document/composition';
import { withoutPart, withPart } from './type-parts';

const novel = {
  contents: [
    { kind: 'cover' },
    { part: 'title-page' },
    { kind: 'dedication' },
    { part: 'contents' },
    { part: 'body' },
    { kind: 'acknowledgements' },
    { part: 'notes' },
    { part: 'bibliography' },
  ] as ContentsItem[],
  kinds: ['cover', 'blurb', 'dedication', 'afterword'],
};

const order = (parts: { contents: ContentsItem[] }) =>
  parts.contents.map((c) => ('kind' in c ? c.kind : c.part));

describe('the parts a document type suggests', () => {
  it('takes a part out of the order and out of the kinds it offers', () => {
    const out = withoutPart(novel, 'dedication');
    expect(order(out)).not.toContain('dedication');
    expect(out.kinds).toEqual(['cover', 'blurb', 'afterword']);
    expect(suggestedParts({ ...out } as never)).not.toContain('dedication');
    expect(order(novel)).toContain('dedication');
  });

  it('takes a part Glaukopis makes out as any other', () => {
    expect(order(withoutPart(novel, 'title-page'))).toEqual([
      'cover',
      'dedication',
      'contents',
      'body',
      'acknowledgements',
      'notes',
      'bibliography',
    ]);
  });

  it('puts a part of the front before the text', () => {
    expect(order(withPart(novel, 'preface')).indexOf('preface')).toBe(4);
    expect(withPart(novel, 'list-of-figures').contents[4]).toEqual({ part: 'list-of-figures' });
  });

  it('puts a part of the back after the text, before the notes and the bibliography', () => {
    expect(order(withPart(novel, 'appendix'))).toEqual([
      'cover',
      'title-page',
      'dedication',
      'contents',
      'body',
      'acknowledgements',
      'appendix',
      'notes',
      'bibliography',
    ]);
  });

  it('puts the bibliography last', () => {
    const none = withoutPart(novel, 'bibliography');
    expect(order(withPart(none, 'bibliography')).at(-1)).toBe('bibliography');
  });

  it('offers what is on no page among the kinds, with no place in the order', () => {
    const out = withPart(withoutPart(novel, 'blurb'), 'blurb');
    expect(out.kinds).toContain('blurb');
    expect(order(out)).not.toContain('blurb');
  });

  it('leaves a part already suggested where it is', () => {
    expect(withPart(novel, 'dedication')).toEqual(novel);
    expect(withPart(novel, 'afterword')).toEqual(novel);
  });
});
