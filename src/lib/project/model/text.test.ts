import { describe, expect, it } from 'vitest';
import * as Y from 'yjs';
import words from '../../../../crates/core/tests/fixtures/words.json';
import {
  beginsIn,
  blocksText,
  bodyFacts,
  countWords,
  fillBody,
  linemark,
  pagebreak,
  paragraph,
  readBody,
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

/** An element with attributes, holding words with marks and other elements, in order. */
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
    // Words that stand together are one text, as y-prosemirror keeps them.
    let text: Y.XmlText | null = null;
    for (const c of content) {
      if (typeof c === 'function') {
        text = null;
        c(e);
        continue;
      }
      if (!text) {
        text = new Y.XmlText();
        e.insert(e.length, [text]);
      }
      text.insert(text.length, c[0], c[1]);
    }
  };
}

describe('the shape texts are written in', () => {
  it('reads paragraphs of a kind with their stretch settings, line marks and breaks', () => {
    const fragment = body(
      el('paragraph', {}, ['Plain.']),
      el('paragraph', { kind: 'text', indent: 0 }, ['Also plain.']),
      el(
        'paragraph',
        { kind: 'speaker', indent: 0, numbering: 'counted', every: 5, side: 'right' },
        ['Nurse'],
      ),
      el(
        'paragraph',
        { kind: 'line', indent: 1, numbering: 'counted', every: 5, side: 'right', new: true },
        el('linemark', { number: '45', margin: 'ia.', indent: 2 }),
        ['If only'],
        el('hard_break', {}),
        el('linemark', { counted: false, hidden: true }),
        ['the Argo'],
      ),
      el('pagebreak', { what: 'column' }),
      el('paragraph', { kind: 'quote', indent: 0, numbering: 'given' }, ['Sing.']),
      el('pagebreak', { what: 'page' }),
    );
    expect(readBody(fragment)).toEqual([
      paragraph([t('Plain.')]),
      paragraph([t('Also plain.')]),
      paragraph([t('Nurse')], 'speaker', {
        indent: 0,
        numbering: 'counted',
        every: 5,
        side: 'right',
      }),
      paragraph(
        [
          linemark({ number: '45', margin: 'ia.', indent: 2 }),
          t('If only'),
          { kind: 'break' },
          linemark({ counted: false, hidden: true }),
          t('the Argo'),
        ],
        'line',
        { indent: 1, numbering: 'counted', every: 5, side: 'right', new: true },
      ),
      pagebreak('column'),
      paragraph([t('Sing.')], 'quote', { indent: 0, numbering: 'given' }),
      pagebreak('page'),
    ]);
    // A line mark is no word, and a break no text.
    expect(blocksText(readBody(fragment))).toBe(
      'Plain.\nAlso plain.\nNurse\nIf only\nthe Argo\nSing.',
    );
  });

  it('reads what the editor writes of a paragraph and a line mark that say nothing more', () => {
    // y-prosemirror writes every attribute that is not null, the defaults among them.
    const fragment = body(
      el('paragraph', { kind: 'line', indent: 0 }, el('linemark', { counted: true, indent: 0 }), [
        'Alone',
      ]),
      el('paragraph', { kind: 'line', indent: 0, numbering: 'none', every: 0 }, ['Again']),
      el('pagebreak', {}),
    );
    expect(readBody(fragment)).toEqual([
      paragraph([linemark(), t('Alone')], 'line'),
      paragraph([t('Again')], 'line'),
      pagebreak('page'),
    ]);
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
    const kind = body(el('paragraph', { kind: 'epigraph' }));
    expect(readBody(kind)).toEqual([paragraph([], 'epigraph')]);
  });
});

describe('the shapes texts were written in before', () => {
  it('a passage is read as the paragraphs it holds, standing where it stands', () => {
    const fragment = body(
      el('paragraph', {}, ['Before.']),
      el(
        'passage',
        { family: 'verse', numbering: 'counted', every: 5 },
        el('paragraph', { kind: 'speaker', indent: 0, counted: true }, ['Nurse']),
        el('paragraph', { kind: 'line', indent: 1, counted: true }, ['If only']),
      ),
      el('passage', { name: 'epigraph' }, ['Of the oldest shape.']),
      el('paragraph', {}, ['After.']),
    );
    expect(readBody(fragment)).toEqual([
      paragraph([t('Before.')]),
      paragraph([t('Nurse')], 'speaker'),
      paragraph([t('If only')], 'line', 1),
      paragraph([t('Of the oldest shape.')]),
      paragraph([t('After.')]),
    ]);
  });

  it('what an old paragraph said of its line is a line mark at its start', () => {
    const fragment = body(
      el('paragraph', { kind: 'line', indent: 0, number: '45', counted: true, margin: 'ia.' }, [
        'If only',
      ]),
      el('paragraph', { kind: 'line', indent: 0, counted: false }, ['the Argo']),
      el('paragraph', { kind: 'line', indent: 0, counted: true, hidden: true }, ['had never']),
      // A mark of the new shape holds over what the paragraph said.
      el('paragraph', { kind: 'verse', indent: 0, number: '9' }, el('linemark', { number: '50' }), [
        'flown',
      ]),
    );
    expect(readBody(fragment)).toEqual([
      paragraph([linemark({ number: '45', margin: 'ia.' }), t('If only')], 'line'),
      paragraph([linemark({ counted: false }), t('the Argo')], 'line'),
      paragraph([linemark({ hidden: true }), t('had never')], 'line'),
      // The old id of a kind names the kind it is now.
      paragraph([linemark({ number: '50' }), t('flown')], 'line'),
    ]);
  });

  it('an element that is not known is read as its text, and nothing falls over', () => {
    const fragment = body(
      el('verse', {}, el('verse_line', {}, ['Alone'])),
      el('blockquote', {}, el('paragraph', {}, ['Sing.'])),
    );
    expect(readBody(fragment)).toEqual([paragraph([t('Alone')]), paragraph([t('Sing.')])]);
  });
});

describe('what a text says of itself', () => {
  it('the kinds a text uses are counted once each, in the order of first use, text left out', () => {
    const blocks: Block[] = [
      paragraph([t('a')], 'epigraph'),
      paragraph([
        t('b ', { kind: { name: 'foreign', lang: 'el' } }),
        t('c ', { underline: true }),
        t('d', { kind: { name: 'term', lang: '' } }),
      ]),
      paragraph([], 'scene'),
      paragraph([], 'action'),
      paragraph([], 'speaker'),
      paragraph([linemark({ number: '1' }), t('e')], 'line'),
      paragraph([], 'direction'),
      paragraph([], 'attribution'),
      paragraph([], 'epigraph'),
      paragraph([], 'k1'),
      paragraph([t('f')], 'item'),
      // A speaker and a direction within a line are kinds of words.
      paragraph([
        t('Me. ', { kind: { name: 'speaker', lang: '' } }),
        t('g '),
        t('aside', { kind: { name: 'direction', lang: '' } }),
      ]),
      pagebreak(),
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
    // A line mark is no word.
    expect(bodyFacts(blocks).words).toBe(9);
    expect(bodyFacts([]).uses).toEqual([]);
  });

  it('a text of a page break alone is not empty', () => {
    expect(bodyFacts([paragraph([])]).empty).toBe(true);
    expect(bodyFacts([pagebreak('page')]).empty).toBe(false);
    expect(bodyFacts([paragraph([]), pagebreak('column')]).empty).toBe(false);
    expect(bodyFacts([pagebreak()]).words).toBe(0);
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
      paragraph([t('One')], 'quote'),
      paragraph([t('Two')], 'quote'),
    ]);
    // The old id of a kind names the kind it is now.
    expect(kinds('verse')).toEqual([paragraph([t('One')], 'line'), paragraph([t('Two')], 'line')]);
    expect(kinds('k2', 'Dear')).toEqual([paragraph([t('Dear')], 'k2')]);
    // Without text, one empty paragraph of the kind, so that the writing begins in it.
    expect(kinds('epigraph', '')).toEqual([paragraph([], 'epigraph')]);
    expect(kinds('', '')).toEqual([]);
    // A kind of words only is no kind of paragraph.
    expect(kinds('foreign', 'Word')).toEqual([paragraph([t('Word')])]);
    expect(beginsIn('')).toBe('text');
    expect(beginsIn(' list ')).toBe('item');
    expect(beginsIn('text')).toBe('text');
    expect(beginsIn('title')).toBe('text');
    expect(beginsIn('k2', own)).toBe('k2');
  });
});

describe('the words of a text', () => {
  // The same texts as the test of `count_words` in the core: the two must count alike.
  it.each(words as [string, number][])('%j has %i', (text, count) => {
    expect(countWords(text)).toBe(count);
  });
});
