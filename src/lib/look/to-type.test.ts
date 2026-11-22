import { describe, expect, it } from 'vitest';
import type { ContentsItem } from '$lib/api/templates';
import { typeContents } from './to-type';

const novel: { contents: ContentsItem[]; kinds: string[] } = {
  contents: [
    { kind: 'cover' },
    { part: 'half-title' },
    { part: 'title-page' },
    { kind: 'dedication' },
    { part: 'contents' },
    { part: 'body' },
    { part: 'notes' },
    { kind: 'acknowledgements' },
  ],
  kinds: ['cover', 'blurb', 'dedication', 'acknowledgements'],
};

describe('what a document type made from a document holds', () => {
  it('has the parts the document has, in the order they stand, what Glaukopis makes as a part', () => {
    const { contents } = typeContents(
      ['title-page', 'abstract', 'body', 'appendix', 'bibliography'],
      { contents: [{ part: 'body' }], kinds: [] },
    );
    expect(contents).toEqual([
      { part: 'title-page' },
      { kind: 'abstract' },
      { part: 'body' },
      { kind: 'appendix' },
      { part: 'bibliography' },
    ]);
  });

  it('leaves out what the type had and the document has not: a part can be taken away', () => {
    const { contents } = typeContents(['title-page', 'body'], novel);
    expect(contents).toEqual([{ part: 'title-page' }, { part: 'body' }, { part: 'notes' }]);
  });

  it('keeps the notes before the bibliography where the type had them', () => {
    const { contents } = typeContents(['body', 'bibliography'], novel);
    expect(contents).toEqual([{ part: 'body' }, { part: 'notes' }, { part: 'bibliography' }]);
  });

  it('keeps the contents of the type where the document has no part at all', () => {
    expect(typeContents(['body'], novel).contents).toEqual(novel.contents);
    expect(typeContents([], novel).contents).toEqual(novel.contents);
  });

  it('keeps a cover among the kinds, and gives it no place in the order', () => {
    const { contents, kinds } = typeContents(['blurb', 'dedication', 'body'], {
      contents: [{ part: 'body' }],
      kinds: ['dedication'],
    });
    expect(contents).toEqual([{ kind: 'dedication' }, { part: 'body' }]);
    expect(kinds).toEqual(['dedication', 'blurb']);
  });

  it('puts the text before the back matter where the document has no text of its own', () => {
    const { contents } = typeContents(['dedication', 'appendix'], {
      contents: [{ part: 'body' }],
      kinds: [],
    });
    expect(contents).toEqual([{ kind: 'dedication' }, { part: 'body' }, { kind: 'appendix' }]);
  });

  it('keeps the kinds the type offers', () => {
    expect(typeContents(['title-page', 'body'], novel).kinds).toEqual(novel.kinds);
  });
});
