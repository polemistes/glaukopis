import { describe, expect, it } from 'vitest';
import * as Y from 'yjs';
import { blocksToDoc, nameToDoc, writeBody, writeName } from './blocks';
import { bodyFacts, readBody, readTitle, type Block, type Inline } from './text';

const HASH = 'a'.repeat(64);

const t = (text: string, marks: Record<string, Record<string, unknown>> = {}): Inline => ({
  kind: 'text',
  text,
  marks,
});
const p = (...content: Inline[]): Block => ({ kind: 'paragraph', content });

/** A text with everything in it, as the application reads a text. */
const everything: Block[] = [
  p(
    t('A wrath that is '),
    t('more', { em: {} }),
    t(' than '),
    t('anger', { strong: {} }),
    t(', '),
    t('Small', { smallcaps: {} }),
    t(', H'),
    t('2', { sub: {} }),
    t('O, x'),
    t('2', { sup: {} }),
    t(', '),
    t('gone', { strike: {} }),
    t(', '),
    t('both', { em: {}, strong: {} }),
    t(', '),
    t('a link', { link: { href: 'https://example.org' } }),
    { kind: 'break' },
    t('Where '),
    { kind: 'math', tex: 'x_i \\leq \\alpha' },
    t(' holds '),
    {
      kind: 'citation',
      items: [
        { id: 'r1', locator: '73', prefix: 'see', suffix: 'and passim' },
        { id: 'r2', locator: '3', label: 'chapter', suppressAuthor: true },
      ],
      mode: 'normal',
    },
    t(' and '),
    { kind: 'citation', items: [{ id: 'r2' }], mode: 'intext' },
    t(' says, as in '),
    { kind: 'crossref', target: 'f1', form: 'number' },
    t('.'),
    {
      kind: 'footnote',
      content: [
        t('So the scholia; '),
        { kind: 'citation', items: [{ id: 'r2' }], mode: 'normal' },
        t(', where '),
        { kind: 'math', tex: 'n > 1' },
        t('.', { em: {} }),
      ],
    },
    { kind: 'footnote', content: [t('At the end.')], place: 'end' },
  ),
  { kind: 'equation', id: 'e1', tex: 'a^2 + b^2 = c^2', numbered: true, align: 'left' },
  { kind: 'equation', id: 'e2', tex: '\\sum_{i=1}^{n} i', numbered: false },
  {
    kind: 'blockquote',
    content: [p(t('Sing, goddess, the wrath.')), p(t('Of Achilles.', { em: {} }))],
  },
  {
    kind: 'bullet_list',
    items: [
      [p(t('one'))],
      [p(t('two')), { kind: 'ordered_list', start: 3, items: [[p(t('nested'))], [p(t('more'))]] }],
    ],
  },
  { kind: 'ordered_list', start: 1, items: [[p(t('first'))]] },
  {
    kind: 'figure',
    id: 'f1',
    align: 'right',
    wrap: true,
    file: HASH,
    extension: 'png',
    name: 'The shield.png',
    caption: [t('The shield of '), t('Achilles', { em: {} }), { kind: 'math', tex: 'x' }],
    alt: 'A round shield',
    width: 50,
    numbered: true,
  },
  {
    kind: 'figure',
    id: 'f2',
    file: HASH,
    extension: 'svg',
    name: 'forms.svg',
    caption: [],
    alt: '',
    width: 100,
    numbered: false,
  },
  {
    kind: 'table',
    id: 't1',
    caption: [t('Forms of the word')],
    rows: [
      [
        { content: [p(t('Form'))], colspan: 1, rowspan: 1, header: true },
        { content: [p(t('Where'))], colspan: 2, rowspan: 1, header: true, align: 'right' },
      ],
      [
        { content: [p(t('mênis', { em: {} }))], colspan: 1, rowspan: 2, header: true },
        { content: [p(t('12')), p(t('lines'))], colspan: 1, rowspan: 1, header: false },
        { content: [p()], colspan: 1, rowspan: 1, header: false, align: 'center' },
      ],
      [
        { content: [p(t('3'))], colspan: 1, rowspan: 1, header: false },
        { content: [p(t('Iliad'))], colspan: 1, rowspan: 1, header: false },
      ],
    ],
    numbered: true,
    width: 80,
    align: 'center',
    wrap: false,
  },
  {
    kind: 'row',
    items: [
      {
        kind: 'figure',
        id: 'f3',
        file: HASH,
        extension: 'jpg',
        name: 'one.jpg',
        caption: [t('One')],
        alt: '',
        width: 40,
        numbered: true,
      },
      { kind: 'equation', id: 'e3', tex: 'x = 1', numbered: true },
    ],
  },
  p(t('After it all.')),
];

/** The text as it is read. */
function read(fragment: Y.XmlFragment): Block[] {
  return readBody(fragment);
}

function written(blocks: Block[]): Y.XmlFragment {
  const doc = new Y.Doc();
  const fragment = doc.getXmlFragment('body');
  writeBody(fragment, blocks);
  return fragment;
}

describe('text written without an editor', () => {
  it('is read again as it was written', () => {
    const doc = blocksToDoc(everything);
    // What is written is what the editors can hold.
    expect(() => doc.check()).not.toThrow();
    expect(read(written(everything))).toEqual(everything);
  });

  it('is the same written into the project and read from an editor', () => {
    // As an editor would write it: the document of ProseMirror, and back.
    const again = blocksToDoc(readBody(written(everything)));
    expect(again.toJSON()).toEqual(blocksToDoc(everything).toJSON());
  });

  it('takes marks as they come from a file that was read', () => {
    const back = read(
      written([
        p({ kind: 'text', text: 'so', marks: { em: true, sup: true, sub: true, unknown: true } }),
      ]),
    );
    // Raised and lowered at once is not a thing: the last said holds.
    expect(back).toEqual([p(t('so', { em: {}, sub: {} }))]);
  });

  it('reads raised and lowered text by the names they were once kept under', () => {
    const doc = new Y.Doc();
    const fragment = doc.getXmlFragment('body');
    const paragraph = new Y.XmlElement('paragraph');
    const text = new Y.XmlText();
    fragment.insert(0, [paragraph]);
    paragraph.insert(0, [text]);
    text.insert(0, 'H', {});
    text.insert(1, '2', { 'sub--2fdnO0KL': {} });
    text.insert(2, 'O', {});
    text.insert(3, '2', { sup: {} });
    expect(readBody(fragment)).toEqual([
      p(t('H'), t('2', { sub: {} }), t('O'), t('2', { sup: {} })),
    ]);
  });

  it('counts what is said of a table apart from what stands in it', () => {
    const table = everything.find((b) => b.kind === 'table')!;
    // Forms of the word; Form, Where, mênis, 12, lines, 3, Iliad.
    expect(bodyFacts([table]).words).toBe(11);
  });

  it('keeps what is known of a citation that was found with its text', () => {
    const found = {
      id: 'a1b2c3d4e5f6',
      by: 'zotero',
      items: [{ uris: ['http://zotero.org/users/1/items/ABCD2345'], locator: '73' }],
      mode: 'normal',
      left: false,
    };
    const back = readBody(
      written([
        p(
          t('As was said '),
          t('(Nagy 1979, ', { found }),
          t('73', { found, em: {} }),
          t(')', { found }),
          t('.'),
        ),
        // Without an id it is nothing.
        p(t('(Lord 1960)', { found: { by: 'form' } })),
      ]),
    );
    expect(back).toEqual([
      p(
        t('As was said '),
        t('(Nagy 1979, ', { found }),
        t('73', { em: {}, found }),
        t(')', { found }),
        t('.'),
      ),
      p(t('(Lord 1960)')),
    ]);
  });

  it('gives what stands by itself an id where it has none', () => {
    const back = readBody(
      written([
        { kind: 'equation', id: '', tex: 'x', numbered: false },
        {
          kind: 'figure',
          id: '',
          file: HASH,
          extension: 'png',
          name: '',
          caption: [],
          alt: '',
          width: 100,
          numbered: true,
        },
        {
          kind: 'table',
          id: '',
          caption: [],
          rows: [[{ content: [], colspan: 1, rowspan: 1, header: false }]],
          numbered: true,
          width: 0,
        },
      ]),
    );
    const ids = back.map((b) => ('id' in b ? b.id : ''));
    expect(ids.every((id) => /^[0-9A-Za-z]{12}$/.test(id))).toBe(true);
    expect(new Set(ids).size).toBe(3);
  });

  it('leaves out what has no place, and keeps its text where it has text', () => {
    const note: Inline = { kind: 'footnote', content: [t('A note.')] };
    const back = readBody(
      written([
        p(t('Text.'), { kind: 'footnote', content: [t('Outer'), note] }),
        {
          kind: 'figure',
          id: 'f',
          file: HASH,
          extension: 'png',
          name: '',
          caption: [t('Said'), note],
          alt: '',
          width: 100,
          numbered: true,
        },
        {
          kind: 'table',
          id: 't',
          caption: [],
          rows: [
            [
              {
                content: [{ kind: 'bullet_list', items: [[p(t('one'))], [p(t('two'))]] }],
                colspan: 1,
                rowspan: 1,
                header: false,
              },
            ],
          ],
          numbered: true,
          width: 0,
        },
        {
          kind: 'bullet_list',
          items: [[{ kind: 'equation', id: 'e', tex: 'x', numbered: false }]],
        },
        { kind: 'blockquote', content: [] },
        { kind: 'bullet_list', items: [] },
      ]),
    );
    expect(back[0]).toEqual(p(t('Text.'), { kind: 'footnote', content: [t('Outer')] }));
    expect(back[1]).toMatchObject({ kind: 'figure', caption: [t('Said')] });
    expect(back[2]).toMatchObject({ rows: [[{ content: [p(t('one')), p(t('two'))] }]] });
    // An item of a list begins with a paragraph.
    expect(back[3]).toEqual({
      kind: 'bullet_list',
      items: [[p(), { kind: 'equation', id: 'e', tex: 'x', numbered: false }]],
    });
    expect(back).toHaveLength(4);
  });

  it('writes nothing of a text that is empty', () => {
    expect(written([]).length).toBe(0);
    expect(() => blocksToDoc([]).check()).not.toThrow();
  });

  it('writes a name with the marks a name can have', () => {
    const doc = new Y.Doc();
    const fragment = doc.getXmlFragment('title');
    const name: Inline[] = [
      t('The word '),
      { kind: 'text', text: 'mênis', marks: { em: true, strong: true } },
      { kind: 'break' },
      { kind: 'math', tex: 'x' },
      { kind: 'footnote', content: [t('No note.')] },
    ];
    expect(() => nameToDoc(name).check()).not.toThrow();
    writeName(fragment, name);
    expect(readTitle(fragment)).toEqual([t('The word '), t('mênis', { em: {} }), t(' x')]);
    // Written again, it is replaced, and not written twice.
    writeName(fragment, [t('Another')]);
    expect(readTitle(fragment)).toEqual([t('Another')]);
  });
});
