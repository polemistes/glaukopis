import { describe, expect, it } from 'vitest';
import * as Y from 'yjs';
import {
  beginsIn,
  blocksText,
  bodyFacts,
  fillBody,
  isOldShape,
  paragraph,
  passage,
  readBody,
  shaped,
  type Block,
  type Inline,
  type InlineText,
} from './text';

const t = (text: string, marks: InlineText['marks'] = {}): Inline => ({
  kind: 'text',
  text,
  marks,
});

/** A text as y-prosemirror stores it, from elements made by hand. */
function body(...make: ((fragment: Y.XmlFragment) => void)[]): Y.XmlFragment {
  const doc = new Y.Doc();
  const fragment = doc.getXmlFragment('body');
  doc.transact(() => {
    for (const m of make) m(fragment);
  });
  return fragment;
}

type Make = (parent: Y.XmlElement | Y.XmlFragment) => void;

/** An element with attributes, holding words with marks, or other elements. */
function el(
  name: string,
  attrs: Record<string, unknown>,
  ...content: ([string, Record<string, unknown>?] | Make)[]
): Make {
  return (parent) => {
    const e = new Y.XmlElement(name);
    for (const [key, value] of Object.entries(attrs)) e.setAttribute(key, value as string);
    // In the document before the words are written, so that each goes after the last.
    parent.insert(parent.length, [e]);
    const words = content.filter((c): c is [string, Record<string, unknown>?] => Array.isArray(c));
    if (words.length) {
      const text = new Y.XmlText();
      e.insert(0, [text]);
      for (const [w, marks] of words) text.insert(text.length, w, marks);
    }
    for (const c of content) if (typeof c === 'function') c(e);
  };
}

describe('the shape texts are written in', () => {
  it('reads paragraphs of a kind with what is said of them, and passages with their numbering', () => {
    const fragment = body(
      el('paragraph', {}, ['Plain.']),
      el('paragraph', { kind: 'text', indent: 0, counted: true }, ['Also plain.']),
      el(
        'passage',
        { family: 'verse', numbering: 'counted', every: 5 },
        el('paragraph', { kind: 'speaker', indent: 0, counted: true }, ['Nurse']),
        el('paragraph', { kind: 'line', indent: 1, number: '45', counted: true, margin: 'ia.' }, [
          'If only',
        ]),
        el('paragraph', { kind: 'line', indent: 0, counted: false }, ['the Argo']),
      ),
      el(
        'passage',
        { family: 'quotation', numbering: 'none', side: 'right' },
        el('paragraph', { kind: 'quote' }, ['Sing.']),
      ),
    );
    expect(readBody(fragment)).toEqual([
      paragraph([t('Plain.')]),
      paragraph([t('Also plain.')]),
      passage(
        'verse',
        [
          paragraph([t('Nurse')], 'speaker'),
          paragraph([t('If only')], 'line', { indent: 1, number: '45', margin: 'ia.' }),
          paragraph([t('the Argo')], 'line', { indent: 0, counted: false }),
        ],
        'counted',
        { every: 5 },
      ),
      passage('quotation', [paragraph([t('Sing.')], 'quote')], 'none', { side: 'right' }),
    ]);
    expect(blocksText(readBody(fragment))).toBe(
      'Plain.\nAlso plain.\nNurse\nIf only\nthe Argo\nSing.',
    );
  });

  it('brings loose paragraphs of a kind into passages of their family, and joins what stands together', () => {
    const own = [
      { id: 'k1', basedOn: 'line' },
      { id: 'k2', basedOn: null },
    ];
    const blocks: Block[] = [
      paragraph([t('a')], 'quote'),
      paragraph([t('b')], 'epigraph'),
      passage('quotation', [paragraph([t('c')], 'quote')]),
      paragraph([t('d')], 'attribution'),
      paragraph([t('e')]),
      paragraph([t('f')], 'line'),
      paragraph([t('g')], 'k1'),
      // An attribution stands in the passage before it, whatever its family.
      paragraph([t('h')], 'attribution'),
      paragraph([t('i')], 'k2'),
      passage('list', []),
      paragraph([t('j')], 'item', 1),
    ];
    expect(shaped(blocks, own)).toEqual([
      passage('quotation', [
        paragraph([t('a')], 'quote'),
        paragraph([t('b')], 'epigraph'),
        paragraph([t('c')], 'quote'),
        paragraph([t('d')], 'attribution'),
      ]),
      paragraph([t('e')]),
      passage('verse', [
        paragraph([t('f')], 'line'),
        paragraph([t('g')], 'k1'),
        paragraph([t('h')], 'attribution'),
      ]),
      passage('k2', [paragraph([t('i')], 'k2')]),
      passage('list', [paragraph([t('j')], 'item', 1)]),
    ]);
    // In shape, the same shaping changes nothing.
    const once = shaped(blocks, own);
    expect(shaped(once, own)).toEqual(once);
  });

  it('the marks come through as they are stored', () => {
    const fragment = body(
      el(
        'paragraph',
        {},
        ['under', { underline: true }],
        ['code', { code: true }],
        ['mênis', { kind: { name: 'foreign', lang: 'el' } }],
        ['Iliad', { kind: { name: 'title', lang: '' }, em: {} }],
        ['ἄειδε', { kind: { name: 'term', lang: '' }, lang: { tag: 'grc' } }],
      ),
    );
    const [p] = readBody(fragment);
    expect(p.kind).toBe('paragraph');
    expect(p.kind === 'paragraph' && p.content).toEqual([
      { kind: 'text', text: 'under', marks: { underline: true } },
      { kind: 'text', text: 'code', marks: { code: true } },
      { kind: 'text', text: 'mênis', marks: { kind: { name: 'foreign', lang: 'el' } } },
      { kind: 'text', text: 'Iliad', marks: { kind: { name: 'title', lang: '' }, em: {} } },
      {
        kind: 'text',
        text: 'ἄειδε',
        marks: { kind: { name: 'term', lang: '' }, lang: { tag: 'grc' } },
      },
    ]);
  });

  it('drops empty paragraphs of text at the end, and keeps an empty paragraph of a kind', () => {
    const fragment = body(el('paragraph', {}, ['One.']), el('paragraph', {}), el('paragraph', {}));
    expect(readBody(fragment)).toEqual([paragraph([t('One.')])]);
    const kind = body(
      el('passage', { family: 'quotation' }, el('paragraph', { kind: 'epigraph' })),
    );
    expect(readBody(kind)).toEqual([passage('quotation', [paragraph([], 'epigraph')])]);
  });
});

describe('the shape texts were written in before', () => {
  it('a passage of a name is a paragraph of that kind in a passage of its family, and one of no name a paragraph', () => {
    const fragment = body(
      el('passage', { name: 'epigraph' }, ['Sing, goddess.']),
      el('passage', { name: 'attribution' }, ['Homer']),
      el('passage', { name: '' }, ['Of no kind.']),
      el('passage', {}, ['Of none either.']),
      el('passage', { name: 'k1' }, ['Dear reader,']),
      el('passage', { name: 'k2' }, ['Verse of my own']),
    );
    expect(fragment.toArray().every((e) => e instanceof Y.XmlElement && isOldShape(e))).toBe(true);
    const own = [
      { id: 'k1', basedOn: 'text' },
      { id: 'k2', basedOn: 'verse' },
    ];
    expect(readBody(fragment, own)).toEqual([
      passage('quotation', [
        paragraph([t('Sing, goddess.')], 'epigraph'),
        paragraph([t('Homer')], 'attribution'),
      ]),
      paragraph([t('Of no kind.')]),
      paragraph([t('Of none either.')]),
      passage('k1', [paragraph([t('Dear reader,')], 'k1')]),
      passage('verse', [paragraph([t('Verse of my own')], 'k2')]),
    ]);
    // Without the kinds of the writer's own, a kind that is not known is taken for text, and stands loose.
    expect(readBody(fragment)[4]).toEqual(paragraph([t('Verse of my own')], 'k2'));
  });

  it('a block quote is a quotation of quote paragraphs, what else stood in it after it', () => {
    const fragment = body(
      el(
        'blockquote',
        {},
        el('paragraph', {}, ['Sing, goddess.']),
        el('passage', { name: 'attribution' }, ['Homer']),
        el('figure', { id: 'f1', file: 'a'.repeat(64), extension: 'png' }, ['The shield']),
        el('blockquote', {}, el('paragraph', {}, ['Within.'])),
        el('paragraph', {}, ['And after.']),
      ),
      el('blockquote', {}, el('paragraph', {}, ['Another, joined.'])),
    );
    expect(readBody(fragment)).toEqual([
      passage('quotation', [
        paragraph([t('Sing, goddess.')], 'quote'),
        paragraph([t('Homer')], 'attribution'),
      ]),
      expect.objectContaining({ kind: 'figure', id: 'f1' }),
      passage('quotation', [
        paragraph([t('Within.')], 'quote'),
        paragraph([t('And after.')], 'quote'),
        paragraph([t('Another, joined.')], 'quote'),
      ]),
    ]);
  });

  it('a verse is a verse passage, counted where it had a start, which its first counted line is given', () => {
    const lines = () => [
      el('verse_line', { kind: 'speaker', indent: 0, counted: true }, ['Nurse']),
      el('verse_line', { kind: 'line', indent: 0, counted: true }, ['If only the Argo']),
      el('verse_line', { kind: 'line', indent: 1, counted: false }, ['had never flown']),
      el('verse_line', { kind: 'direction', indent: 0, counted: true, margin: 'aside' }, [
        'She weeps.',
      ]),
      el('verse_line', { kind: 'line', indent: 0, counted: true, number: '1094a1' }, ['Nor had']),
    ];
    const fragment = body(
      el('verse', { start: 45, by: 5 }, ...lines()),
      el('verse', { start: null, by: 2 }, ...lines()),
      el('verse', { by: 5 }, el('verse_line', { kind: 'line' }, ['Alone'])),
      el('verse', {}),
    );
    const read = readBody(fragment);
    expect(read).toEqual([
      // Two verses next to each other are one passage, the first one's numbering holding.
      passage(
        'verse',
        [
          paragraph([t('Nurse')], 'speaker'),
          paragraph([t('If only the Argo')], 'line', { indent: 0, number: '45' }),
          paragraph([t('had never flown')], 'line', { indent: 1, counted: false }),
          paragraph([t('She weeps.')], 'direction', { indent: 0, margin: 'aside' }),
          paragraph([t('Nor had')], 'line', { indent: 0, number: '1094a1' }),
          paragraph([t('Nurse')], 'speaker'),
          paragraph([t('If only the Argo')], 'line'),
          paragraph([t('had never flown')], 'line', { indent: 1, counted: false }),
          paragraph([t('She weeps.')], 'direction', { indent: 0, margin: 'aside' }),
          paragraph([t('Nor had')], 'line', { indent: 0, number: '1094a1' }),
          paragraph([t('Alone')], 'line'),
        ],
        'counted',
      ),
    ]);
    // Without a start: counted where a line was given a number, which the count began at; not otherwise.
    const second = readBody(body(el('verse', { start: null, by: 2 }, ...lines())));
    expect(second[0]).toMatchObject({ kind: 'passage', numbering: 'counted', every: 2 });
    const none = readBody(body(el('verse', {}, el('verse_line', {}, ['Alone']))));
    expect(none).toEqual([passage('verse', [paragraph([t('Alone')], 'line')])]);
  });

  it('script paragraphs are a script passage of their parts', () => {
    const fragment = body(
      el('script', { part: 'scene' }, ['INT. HOUSE']),
      el('script', { part: 'character' }, ['NURSE']),
      el('script', { part: 'nonsense' }, ['If only.']),
      el('paragraph', {}, ['Prose.']),
      el('script', { part: 'transition' }, ['CUT TO:']),
    );
    expect(readBody(fragment)).toEqual([
      passage('script', [
        paragraph([t('INT. HOUSE')], 'scene'),
        paragraph([t('NURSE')], 'character'),
        paragraph([t('If only.')], 'action'),
      ]),
      paragraph([t('Prose.')]),
      passage('script', [paragraph([t('CUT TO:')], 'transition')]),
    ]);
  });

  it('lists are list passages of items with their depth, a numbered list keeping where it began', () => {
    const fragment = body(
      el(
        'bullet_list',
        {},
        el('list_item', {}, el('paragraph', {}, ['one']), el('paragraph', {}, ['one more'])),
        el(
          'list_item',
          {},
          el('paragraph', {}, ['two']),
          el(
            'ordered_list',
            { start: 3 },
            el('list_item', {}, el('paragraph', {}, ['nested'])),
            el('list_item', {}, el('paragraph', {}, ['more'])),
          ),
        ),
        el('list_item', {}, el('paragraph', {}, ['three'])),
      ),
      el('ordered_list', { start: 1 }, el('list_item', {}, el('paragraph', {}, ['first']))),
      el('paragraph', {}, ['Between.']),
      el(
        'bullet_list',
        {},
        el('list_item', {}, el('equation', { tex: 'x', id: 'e' })),
        el('list_item', {}, el('paragraph', {}, ['after'])),
      ),
    );
    expect(readBody(fragment)).toEqual([
      passage('list', [
        paragraph([t('one')], 'item'),
        paragraph([t('one more')], 'item'),
        paragraph([t('two')], 'item'),
        paragraph([t('nested')], 'numbered', { indent: 1, number: '3' }),
        paragraph([t('more')], 'numbered', 1),
        paragraph([t('three')], 'item'),
        paragraph([t('first')], 'numbered'),
      ]),
      paragraph([t('Between.')]),
      { kind: 'equation', id: 'e', tex: 'x', numbered: false },
      passage('list', [paragraph([t('after')], 'item')]),
    ]);
  });

  it('the sides of a parallel text and the cells of a table are read too', () => {
    const fragment = body(
      el(
        'parallel',
        {},
        el('parallel_side', {}, el('verse', { start: 1 }, el('verse_line', {}, ['Εἴθ᾽ ὤφελ᾽']))),
        el('parallel_side', {}, el('paragraph', {}, ['If only.'])),
      ),
    );
    expect(readBody(fragment)).toEqual([
      {
        kind: 'parallel',
        left: [
          passage(
            'verse',
            [paragraph([t('Εἴθ᾽ ὤφελ᾽')], 'line', { indent: 0, number: '1' })],
            'counted',
          ),
        ],
        right: [paragraph([t('If only.')])],
      },
    ]);
  });
});

describe('what a text says of itself', () => {
  it('the kinds a text uses are counted once each, in the order of first use, text left out', () => {
    const blocks: Block[] = [
      passage('quotation', [paragraph([t('a')], 'epigraph')]),
      paragraph([
        t('b ', { kind: { name: 'foreign', lang: 'el' } }),
        t('c ', { underline: true }),
        t('d', { kind: { name: 'term', lang: '' } }),
      ]),
      passage('script', [paragraph([], 'scene'), paragraph([], 'action')]),
      passage('verse', [
        paragraph([], 'speaker'),
        paragraph([t('e')], 'line'),
        paragraph([], 'direction'),
      ]),
      passage('quotation', [paragraph([], 'attribution'), paragraph([], 'epigraph')]),
      passage('k1', [paragraph([], 'k1')]),
      passage('list', [paragraph([t('f')], 'item')]),
    ];
    expect(bodyFacts(blocks).uses).toEqual([
      'epigraph',
      'foreign',
      'term',
      'scene',
      'action',
      'speaker',
      'line',
      'direction',
      'attribution',
      'k1',
      'item',
    ]);
    expect(bodyFacts(blocks).words).toBe(6);
    expect(bodyFacts([]).uses).toEqual([]);
  });

  it('a text is filled in the kind of paragraph an element begins in', () => {
    const doc = new Y.Doc();
    const own = [
      { id: 'k1', basedOn: 'text' },
      { id: 'k2', basedOn: 'line' },
    ];
    const kinds = (begins: string, text = 'One\nTwo') => {
      const fragment = doc.getXmlFragment(begins + text);
      doc.transact(() => fillBody(fragment, text, begins, own));
      return readBody(fragment, own);
    };
    expect(kinds('')).toEqual([paragraph([t('One')]), paragraph([t('Two')])]);
    expect(kinds('quote')).toEqual([
      passage('quotation', [paragraph([t('One')], 'quote'), paragraph([t('Two')], 'quote')]),
    ]);
    // The old id of a kind names the kind it is now.
    expect(kinds('verse')).toEqual([
      passage('verse', [paragraph([t('One')], 'line'), paragraph([t('Two')], 'line')]),
    ]);
    expect(kinds('character')).toEqual([
      passage('script', [paragraph([t('One')], 'character'), paragraph([t('Two')], 'character')]),
    ]);
    // A kind of the writer's own is a passage of its own family, or of the family of what it is based on.
    expect(kinds('k1', 'Dear')).toEqual([passage('k1', [paragraph([t('Dear')], 'k1')])]);
    expect(kinds('k2', 'Dear')).toEqual([passage('verse', [paragraph([t('Dear')], 'k2')])]);
    // Without text, one empty paragraph of the kind, so that the writing begins in it.
    expect(kinds('epigraph', '')).toEqual([passage('quotation', [paragraph([], 'epigraph')])]);
    expect(kinds('', '')).toEqual([]);
    expect(beginsIn('')).toBe('text');
    expect(beginsIn(' list ')).toBe('list');
    expect(beginsIn('text')).toBe('text');
    expect(beginsIn('k2', own)).toBe('verse');
  });
});
