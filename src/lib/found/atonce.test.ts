import { describe, expect, it } from 'vitest';
import type { Found, FoundItem, Suggestion } from '$lib/api/found';
import type { Imported } from '$lib/api/imported';
import { blocksToDoc } from '$lib/project/model/blocks';
import type { Block, Inline } from '$lib/project/model/text';
import { citeAtOnce, citeAtOnceIn } from './atonce';
import { HASH, cell, note, p, t, zotero } from './testing';
import { certain, citeItem, describeItem, wordsOf, zoteroKey } from './works';

/** A library that has these items of Zotero, and is asked as `found_suggest` is. */
function library(has: Record<string, Suggestion[]>) {
  const asked: FoundItem[][] = [];
  const suggest = async (items: FoundItem[]) => {
    asked.push(items);
    return items.map((item) => has[zoteroKey(item.uris?.[0] ?? '') ?? item.key ?? ''] ?? []);
  };
  return { asked, suggest };
}

const sure = (reference: string): Suggestion[] => [
  { reference, sure: 'certain', why: 'the same item in Zotero' },
  { reference: 'other', sure: 'possible', why: 'Nagy' },
];

const NAGY = zotero('a1b2c3d4e5f6', 'NAGY1979');
const LORD = zotero('b1b2c3d4e5f6', 'LORD1960', {
  items: [
    {
      uris: ['http://zotero.org/users/1/items/LORD1960'],
      locator: '3',
      label: 'chapter',
      prefix: 'see',
      suffix: 'passim',
      suppressAuthor: true,
    },
    { uris: ['http://zotero.org/users/1/items/NAGY1979'], label: 'page' },
  ],
  mode: 'intext',
});
const PARRY = zotero('c1b2c3d4e5f6', 'PARRY971');

describe('citations are made at once of what was read', () => {
  it('of what Zotero made, where the library has every work for certain', async () => {
    const { suggest, asked } = library({ NAGY1979: sure('r-nagy'), LORD1960: sure('r-lord') });
    const text: Block[] = [
      p(
        t('As was said '),
        t('(Nagy 1979, ', { found: NAGY }),
        t('73', { found: NAGY, em: {} }),
        t(')', { found: NAGY }),
        t(' and '),
        t('Lord (1960)', { found: LORD }),
        t(' but '),
        t('(Parry 1971)', { found: PARRY }),
        t('.'),
      ),
    ];
    const { texts, made, cited } = await citeAtOnce([text], suggest);
    expect(made).toBe(2);
    expect(cited).toEqual(['r-nagy', 'r-lord']);
    expect(texts).toEqual([
      [
        p(
          t('As was said '),
          { kind: 'citation', items: [{ id: 'r-nagy', locator: '73' }], mode: 'normal' },
          t(' and '),
          {
            kind: 'citation',
            items: [
              {
                id: 'r-lord',
                locator: '3',
                label: 'chapter',
                prefix: 'see',
                suffix: 'passim',
                suppressAuthor: true,
              },
              { id: 'r-nagy' },
            ],
            mode: 'intext',
          },
          t(' but '),
          // The library does not have it: it waits for the writer, as it was.
          t('(Parry 1971)', { found: PARRY }),
          t('.'),
        ),
      ],
    ]);
    // The library is asked once, for all the works there are.
    expect(asked).toHaveLength(1);
    expect(asked[0]).toHaveLength(4);
    // What was given is not changed, and what is made is what a text can hold.
    expect(text[0]).toMatchObject({
      content: [{}, { marks: { found: NAGY } }, {}, {}, {}, {}, {}, {}, {}],
    });
    expect(() => blocksToDoc(texts[0]).check()).not.toThrow();
  });

  it('not of what is only likely, nor where one work of several is not certain', async () => {
    const { suggest } = library({
      NAGY1979: [{ reference: 'r-nagy', sure: 'likely', why: 'Nagy, 1979' }],
      LORD1960: sure('r-lord'),
    });
    const text: Block[] = [
      p(t('(Nagy 1979, 73)', { found: NAGY }), t(' and '), t('Lord (1960)', { found: LORD })),
    ];
    const { texts, made, cited } = await citeAtOnce([text], suggest);
    expect(made).toBe(0);
    expect(cited).toEqual([]);
    expect(texts).toEqual([text]);
  });

  it('not of tags, of what Mendeley made, of what was left as text, or of what has no works', async () => {
    const { suggest, asked } = library({ NAGY1979: sure('r-nagy'), nagy1979: sure('r-nagy') });
    const by = (more: Partial<Found>, id: string) => ({ ...NAGY, id, ...more });
    const text: Block[] = [
      p(
        t('[@nagy1979]', {
          found: by({ by: 'key', items: [{ key: 'nagy1979' }] }, 'k1b2c3d4e5f6'),
        }),
        t('(Nagy 1979)', { found: by({ by: 'mendeley' }, 'm1b2c3d4e5f6') }),
        t('(Nagy 1979)', { found: by({ left: true }, 'l1b2c3d4e5f6') }),
        t('(Nagy 1979)', { found: by({ items: [] }, 'n1b2c3d4e5f6') }),
        t('(Nagy 1979)', { found: by({ by: 'form' }, 'f1b2c3d4e5f6') }),
      ),
    ];
    expect(await citeAtOnce([text], suggest)).toEqual({ texts: [text], made: 0, cited: [] });
    // Where there is nothing to ask for, the library is not asked.
    expect(asked).toEqual([]);
  });

  it('in notes, quotations, lists, cells and what is said of figures and tables', async () => {
    const { suggest } = library({ NAGY1979: sure('r-nagy') });
    const found = (n: number) => ({ ...NAGY, id: `a${n}b2c3d4e5f6` });
    const c: Inline = {
      kind: 'citation',
      items: [{ id: 'r-nagy', locator: '73' }],
      mode: 'normal',
    };
    const text: Block[] = [
      p(t('Said'), note(t('See '), t('Nagy 1979, 73', { found: found(1) }), t('.'))),
      { kind: 'blockquote', content: [p(t('(Nagy 1979, 73)', { found: found(2) }))] },
      { kind: 'bullet_list', items: [[p(t('(Nagy 1979, 73)', { found: found(3) }))]] },
      {
        kind: 'table',
        id: 't1',
        caption: [t('Forms '), t('(Nagy 1979, 73)', { found: found(4) })],
        rows: [[cell(t('(Nagy 1979, 73)', { found: found(5) }))]],
        numbered: true,
        width: 0,
      },
      {
        kind: 'row',
        items: [
          {
            kind: 'figure',
            id: 'f1',
            file: HASH,
            extension: 'png',
            name: '',
            caption: [t('(Nagy 1979, 73)', { found: found(6) })],
            alt: '',
            width: 100,
            numbered: true,
          },
          { kind: 'equation', id: 'e1', tex: 'x', numbered: false },
        ],
      },
    ];
    const { texts, made, cited } = await citeAtOnce(
      [text, [p(t('(Nagy 1979, 73)', { found: found(7) }))]],
      suggest,
    );
    expect(made).toBe(7);
    expect(cited).toEqual(['r-nagy']);
    expect(texts[0]).toMatchObject([
      { content: [t('Said'), { kind: 'footnote', content: [t('See '), c, t('.')] }] },
      { content: [{ content: [c] }] },
      { items: [[{ content: [c] }]] },
      { caption: [t('Forms '), c], rows: [[{ content: [{ content: [c] }] }]] },
      { items: [{ caption: [c] }, { kind: 'equation' }] },
    ]);
    expect(texts[1]).toEqual([p(c)]);
    expect(() => blocksToDoc(texts[0]).check()).not.toThrow();
  });

  it('of a document that was read, whose counts then say what is left', async () => {
    const { suggest } = library({ NAGY1979: sure('r-nagy') });
    const imported = {
      file: 'wrath.docx',
      kind: 'Word',
      title: [t('The wrath')],
      sections: [
        { level: 0, heading: [], blocks: [p(t('(Nagy 1979, 73)', { found: NAGY }))] },
        {
          level: 1,
          heading: [t('The word')],
          blocks: [
            p(
              { kind: 'citation', items: [{ id: 'r1' }, { id: 'r2' }], mode: 'normal' },
              t('(Parry 1971)', { found: PARRY }),
            ),
          ],
        },
      ],
      counts: { parts: 1, words: 9, cited: 2, notFound: 0, found: 2, foundMade: 2 },
    } as unknown as Imported;
    const made = await citeAtOnceIn(imported, suggest);
    expect(made.made).toBe(1);
    expect(made.imported.counts).toMatchObject({ cited: 3, found: 1, foundMade: 1, words: 9 });
    expect(made.imported.sections[0].blocks).toEqual([
      p({ kind: 'citation', items: [{ id: 'r-nagy', locator: '73' }], mode: 'normal' }),
    ]);
    expect(made.imported.sections[1].heading).toEqual([t('The word')]);
    // Where none is made, the document is as it was read.
    const none = await citeAtOnceIn(imported, async (items) => items.map(() => []));
    expect(none.imported).toBe(imported);
    expect(none.made).toBe(0);
  });
});

describe('the works of what was found', () => {
  it('become the works of a citation, with what was said of the place in them', () => {
    expect(
      citeItem('r1', {
        locator: ' 73–75 ',
        label: 'page',
        prefix: ' see ',
        suffix: '',
        suppressAuthor: false,
      }),
    ).toEqual({ id: 'r1', locator: '73–75', prefix: 'see' });
    expect(citeItem('r1', { locator: '3', label: 'chapter', suppressAuthor: true })).toEqual({
      id: 'r1',
      locator: '3',
      label: 'chapter',
      suppressAuthor: true,
    });
    // What the place counts says nothing without a place.
    expect(citeItem('r1', { label: 'chapter' })).toEqual({ id: 'r1' });
  });

  it('are certain where the library says so', () => {
    expect(certain(sure('r1'))).toBe('r1');
    expect(certain([{ reference: 'r1', sure: 'likely', why: '' }])).toBeNull();
    expect(certain([])).toBeNull();
    expect(certain(undefined)).toBeNull();
  });

  it('are looked for by who made them and when, by what they are called, or by their tag', () => {
    const data = {
      author: [{ family: 'Nagy', given: 'Gregory' }],
      issued: { 'date-parts': [[1979, 3]] },
      title: 'The Best of the Achaeans',
    };
    expect(describeItem({ data })).toEqual({
      who: 'Nagy',
      year: '1979',
      title: 'The Best of the Achaeans',
    });
    expect(wordsOf({ data })).toBe('Nagy 1979');
    expect(
      wordsOf({
        data: {
          editor: [{ family: 'Parry' }, { literal: 'The Academy' }],
          issued: { raw: 'c. 1971' },
        },
      }),
    ).toBe('Parry The Academy 1971');
    const three = { author: [{ family: 'A' }, { family: 'B' }, { family: 'C' }] };
    expect(describeItem({ data: three }).who).toBe('A et al.');
    expect(wordsOf({ data: three })).toBe('A');
    expect(wordsOf({ data: { title: 'The Singer of Tales, again and again' } })).toBe(
      'The Singer of Tales,',
    );
    expect(wordsOf({ key: 'nagy1979' })).toBe('nagy1979');
    expect(wordsOf({})).toBe('');
  });

  it('have the key of their item in Zotero in their address', () => {
    expect(zoteroKey('http://zotero.org/users/123/items/ABCD2345')).toBe('ABCD2345');
    expect(zoteroKey('http://zotero.org/groups/9/items/wxyz6789/')).toBe('WXYZ6789');
    expect(zoteroKey('http://zotero.org/users/123')).toBeNull();
    expect(zoteroKey('http://example.org/items/short')).toBeNull();
  });
});
