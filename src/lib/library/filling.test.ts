import { describe, expect, it } from 'vitest';
import type { Draft } from '$lib/api/library';
import { fillEmpty } from './filling';

const found: Draft = {
  key: '',
  type: 'article-journal',
  fields: { title: 'The Name of the Hero', container: 'Arethusa', year: '1979', volume: '12' },
  names: { author: [{ family: 'Nagy', given: 'Gregory' }] },
};

describe('a form filled from a lookup that came back late', () => {
  it('keeps what the writer typed and fills only what is empty', () => {
    const typed: Draft = {
      key: 'nagy79',
      type: 'book',
      fields: { title: 'Best of the Achaeans', year: '', publisher: 'Johns Hopkins' },
      names: { author: [{ family: '', given: '' }] },
    };
    const { draft, kept } = fillEmpty(typed, found, 'book');
    expect(draft).toEqual({
      key: 'nagy79',
      type: 'article-journal',
      fields: {
        title: 'Best of the Achaeans',
        year: '1979',
        publisher: 'Johns Hopkins',
        container: 'Arethusa',
        volume: '12',
      },
      names: { author: [{ family: 'Nagy', given: 'Gregory' }] },
    });
    expect(kept).toBe(true);
    // What is put in is a copy: changing the form does not change what was found.
    draft.names.author[0].family = 'Lord';
    expect(found.names.author[0].family).toBe('Nagy');
  });

  it('keeps the names and the type the writer gave', () => {
    const typed: Draft = {
      key: '',
      type: 'chapter',
      fields: {},
      names: { author: [{ family: 'Lord' }] },
    };
    const { draft, kept } = fillEmpty(typed, found, 'book');
    expect(draft.type).toBe('chapter');
    expect(draft.names.author).toEqual([{ family: 'Lord' }]);
    expect(draft.fields.title).toBe('The Name of the Hero');
    expect(kept).toBe(true);
  });

  it('says nothing was kept where what was typed is what was found', () => {
    const typed: Draft = { key: '', type: 'book', fields: { year: ' 1979 ' }, names: {} };
    expect(fillEmpty(typed, found, 'book').kept).toBe(false);
  });
});
