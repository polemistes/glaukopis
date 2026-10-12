import { describe, expect, it } from 'vitest';
import * as Y from 'yjs';
import { blockElements, writeBody, writeName } from './blocks';
import {
  bodyFacts,
  linemark,
  pagebreak,
  paragraph,
  readBody,
  readTitle,
  type Block,
  type Inline,
  type ParagraphBlock,
} from './text';

const HASH = 'a'.repeat(64);

const t = (text: string, marks: Record<string, Record<string, unknown>> = {}): Inline => ({
  kind: 'text',
  text,
  marks,
});
const p = (...content: Inline[]): Block => paragraph(content);
const br: Inline = { kind: 'break' };

/** The settings of a numbered stretch of verse. */
const V: Pick<ParagraphBlock, 'indent' | 'numbering' | 'every' | 'side'> = {
  indent: 0,
  numbering: 'counted',
  every: 2,
  side: 'right',
};

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
    t(', '),
    t('Weltschmerz', { lang: { tag: 'de' } }),
    t(' and '),
    t('ἄειδε', { kind: { name: 'foreign', lang: 'el' }, lang: { tag: 'grc' } }),
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
    t('. '),
    { kind: 'refmark', label: '3:16' },
    t('For God so loved.'),
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
  paragraph([t('Sing, goddess, the wrath.')], 'quote'),
  paragraph([t('Of Achilles.', { em: {} })], 'epigraph'),
  paragraph([t('Homer')], 'attribution'),
  // A numbered stretch of verse, its stanzas paragraphs of lines, a speaker and a direction among them.
  paragraph([t('Nurse')], 'speaker', V),
  paragraph(
    [
      linemark({ number: '1' }),
      t('If only the Argo had never flown'),
      br,
      linemark({ indent: 1 }),
      t('through the dark '),
      t('Clashing Rocks', { em: {} }),
    ],
    'line',
    V,
  ),
  paragraph([linemark({ margin: 'aside' }), t('She weeps.')], 'direction', V),
  paragraph(
    [
      linemark({ number: '1094a1' }),
      t('Nor had the heroes rowed'),
      br,
      linemark({ counted: false, indent: 2 }),
      t('for Pelias'),
      br,
      linemark({ hidden: true, margin: 'ia. trim.' }),
      t('the golden fleece.'),
    ],
    'line',
    V,
  ),
  paragraph([t('A second run of verse.')], 'line', { ...V, new: true }),
  paragraph([t('Int. Palace – night')], 'scene'),
  paragraph([t('Nurse')], 'character'),
  paragraph([t('If only.')], 'dialogue'),
  pagebreak(),
  {
    kind: 'parallel',
    left: [paragraph([t('Εἴθ᾽ ὤφελ᾽')], 'line', { indent: 0, numbering: 'given' })],
    right: [p(t('If only.'))],
  },
  paragraph([t('one')], 'item'),
  paragraph([t('two')], 'item'),
  paragraph([linemark({ number: '3' }), t('nested')], 'numbered', 1),
  paragraph([t('more')], 'numbered', 1),
  paragraph([t('first')], 'numbered'),
  paragraph([t('Dear reader,')], 'k1'),
  pagebreak('column'),
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
        { content: [paragraph([t('Iliad')], 'quote')], colspan: 1, rowspan: 1, header: false },
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

function written(blocks: Block[]): Y.XmlFragment {
  const doc = new Y.Doc();
  const fragment = doc.getXmlFragment('body');
  writeBody(fragment, blocks);
  return fragment;
}

/** The elements a text is written as, in a document, so that they can be read. */
function elements(blocks: Block[]): Y.XmlElement[] {
  const doc = new Y.Doc();
  const fragment = doc.getXmlFragment('body');
  fragment.insert(0, blockElements(blocks));
  return fragment.toArray() as Y.XmlElement[];
}

/** An element of XML as a plain record: its name, attributes and children, text with its marks. */
function shape(node: Y.XmlElement | Y.XmlText): unknown {
  if (node instanceof Y.XmlText)
    return node
      .toDelta()
      .map((op: { insert: string; attributes?: unknown }) =>
        op.attributes ? [op.insert, op.attributes] : op.insert,
      );
  return {
    name: node.nodeName,
    attrs: node.getAttributes(),
    children: node.toArray().map((c) => shape(c as Y.XmlElement | Y.XmlText)),
  };
}

describe('text written without an editor', () => {
  it('is read again as it was written', () => {
    expect(readBody(written(everything))).toEqual(everything);
  });

  it('writes the shape the editors write: paragraphs of a kind with the attributes they have', () => {
    const [plain, verse, page, column] = elements([
      p(t('Plain '), t('words', { em: {} })),
      paragraph(
        [
          linemark({ number: '45', counted: false, hidden: true, margin: 'ia.', indent: 2 }),
          t('If only'),
          br,
          linemark({ number: '46a' }),
          t('the Argo'),
          br,
          linemark(),
          t('had never'),
        ],
        'line',
        { indent: 1, numbering: 'counted', every: 5, side: 'right', new: true },
      ),
      pagebreak('page'),
      pagebreak('column'),
    ]);
    // What a paragraph leaves to the layout, or does not say, is not written.
    expect(shape(plain)).toEqual({
      name: 'paragraph',
      attrs: { kind: 'text', indent: 0 },
      children: [['Plain ', ['words', { em: {} }]]],
    });
    expect(shape(verse)).toEqual({
      name: 'paragraph',
      attrs: { kind: 'line', indent: 1, numbering: 'counted', every: 5, side: 'right', new: true },
      children: [
        {
          name: 'linemark',
          attrs: { number: '45', counted: false, hidden: true, margin: 'ia.', indent: 2 },
          children: [],
        },
        ['If only'],
        { name: 'hard_break', attrs: {}, children: [] },
        { name: 'linemark', attrs: { number: '46a' }, children: [] },
        ['the Argo'],
        { name: 'hard_break', attrs: {}, children: [] },
        { name: 'linemark', attrs: {}, children: [] },
        ['had never'],
      ],
    });
    expect(shape(page)).toEqual({ name: 'pagebreak', attrs: { what: 'page' }, children: [] });
    expect(shape(column)).toEqual({ name: 'pagebreak', attrs: { what: 'column' }, children: [] });
    // A numbering of none is no numbering.
    const [none] = elements([paragraph([t('x')], 'line', { indent: 0, numbering: 'none' })]);
    expect(none.getAttributes() as Record<string, unknown>).toEqual({ kind: 'line', indent: 0 });
  });

  it('reads a line mark again with each thing it says', () => {
    for (const said of [
      { number: '1234' },
      { counted: false as const },
      { hidden: true as const },
      { margin: 'ia. trim.' },
      { indent: 3 },
    ]) {
      const text = [paragraph([linemark(said), t('a line')], 'line')];
      expect(readBody(written(text))).toEqual(text);
    }
  });

  it('writes what is not words as the elements the editors have for it', () => {
    const [made] = elements([
      p(
        t('a'),
        { kind: 'break' },
        { kind: 'math', tex: ' x ' },
        { kind: 'citation', items: [{ id: 'r1' }], mode: 'intext' },
        { kind: 'crossref', target: 'f1', form: 'name' },
        { kind: 'refmark', label: '3:16' },
        {
          kind: 'footnote',
          content: [t('Note'), { kind: 'footnote', content: [t('no')] }, linemark({ number: '1' })],
        },
        { kind: 'footnote', content: [t('End')], place: 'end' },
        t('b'),
      ),
    ]);
    expect((shape(made) as { children: unknown[] }).children).toEqual([
      ['a'],
      { name: 'hard_break', attrs: {}, children: [] },
      { name: 'math', attrs: { tex: 'x' }, children: [] },
      { name: 'citation', attrs: { items: [{ id: 'r1' }], mode: 'intext' }, children: [] },
      { name: 'crossref', attrs: { target: 'f1', form: 'name' }, children: [] },
      { name: 'refmark', attrs: { label: '3:16' }, children: [] },
      { name: 'footnote', attrs: { place: '' }, children: [['Note']] },
      { name: 'footnote', attrs: { place: 'end' }, children: [['End']] },
      ['b'],
    ]);
  });

  it('takes marks as they come from a file that was read', () => {
    const back = readBody(
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

  it('counts no reference mark as a word', () => {
    const marked = p(t('For God so '), { kind: 'refmark', label: '3:16' }, t('loved the world'));
    expect(bodyFacts([marked]).words).toBe(6);
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
          caption: [t('Said'), note, { kind: 'refmark', label: '1' }, linemark({ number: '1' })],
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
                // A cell holds paragraphs; what else is the text it has, and a break nothing.
                content: [
                  paragraph([t('one')], 'item'),
                  paragraph([t('two')], 'item'),
                  { kind: 'equation', id: 'e', tex: 'x', numbered: false },
                  pagebreak(),
                ],
                colspan: 1,
                rowspan: 1,
                header: false,
              },
            ],
          ],
          numbered: true,
          width: 0,
        },
        { kind: 'row', items: [] },
      ]),
    );
    expect(back[0]).toEqual(p(t('Text.'), { kind: 'footnote', content: [t('Outer')] }));
    expect(back[1]).toMatchObject({ kind: 'figure', caption: [t('Said')] });
    expect(back[2]).toMatchObject({
      rows: [
        [{ content: [paragraph([t('one')], 'item'), paragraph([t('two')], 'item'), p(t('x'))] }],
      ],
    });
    expect(back).toHaveLength(3);
  });

  it('writes nothing of a text that is empty, and replaces what stood there otherwise', () => {
    expect(written([]).length).toBe(0);
    const fragment = written([p(t('First.'))]);
    writeBody(fragment, [p(t('Second.'))]);
    expect(readBody(fragment)).toEqual([p(t('Second.'))]);
    // A text of nothing that is written is one empty paragraph, in which the writing begins.
    writeBody(fragment, [{ kind: 'row', items: [] }]);
    expect(fragment.length).toBe(1);
    expect(readBody(fragment)).toEqual([]);
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
    writeName(fragment, name);
    expect(readTitle(fragment)).toEqual([t('The word '), t('mênis', { em: {} }), t(' x')]);
    // Written again, it is replaced, and not written twice.
    writeName(fragment, [t('Another')]);
    expect(readTitle(fragment)).toEqual([t('Another')]);
    expect(fragment.length).toBe(1);
  });
});
