import { describe, expect, it } from 'vitest';
import * as Y from 'yjs';
import { blocksText, bodyFacts, fillBody, readBody, type Block } from './text';

/** A text as y-prosemirror stores it, from elements made by hand. */
function body(...make: ((fragment: Y.XmlFragment) => void)[]): Y.XmlFragment {
  const doc = new Y.Doc();
  const fragment = doc.getXmlFragment('body');
  doc.transact(() => {
    for (const m of make) m(fragment);
  });
  return fragment;
}

function block(
  name: string,
  attrs: Record<string, string>,
  words: [string, Record<string, unknown>?][],
) {
  return (fragment: Y.XmlFragment) => {
    const el = new Y.XmlElement(name);
    for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
    // In the document before the words are written, so that each goes after the last.
    fragment.insert(fragment.length, [el]);
    const text = new Y.XmlText();
    el.insert(0, [text]);
    for (const [w, marks] of words) text.insert(text.length, w, marks);
  };
}

describe('passages and the kinds of words', () => {
  it('a passage is read with its kind, and one of no kind as a paragraph', () => {
    const fragment = body(
      block('passage', { name: 'epigraph' }, [['Sing, goddess.']]),
      block('passage', { name: '' }, [['Of no kind.']]),
      block('passage', {}, [['Of none either.']]),
    );
    expect(readBody(fragment)).toEqual([
      {
        kind: 'passage',
        name: 'epigraph',
        content: [{ kind: 'text', text: 'Sing, goddess.', marks: {} }],
      },
      { kind: 'paragraph', content: [{ kind: 'text', text: 'Of no kind.', marks: {} }] },
      { kind: 'paragraph', content: [{ kind: 'text', text: 'Of none either.', marks: {} }] },
    ]);
    expect(blocksText(readBody(fragment))).toBe('Sing, goddess.\nOf no kind.\nOf none either.');
  });

  it('the marks come through as they are stored', () => {
    const fragment = body(
      block('paragraph', {}, [
        ['under', { underline: true }],
        ['code', { code: true }],
        ['mênis', { kind: { name: 'foreign', lang: 'el' } }],
        ['Iliad', { kind: { name: 'title', lang: '' }, em: {} }],
      ]),
    );
    const [p] = readBody(fragment);
    expect(p.kind).toBe('paragraph');
    expect(p.kind === 'paragraph' && p.content).toEqual([
      { kind: 'text', text: 'under', marks: { underline: true } },
      { kind: 'text', text: 'code', marks: { code: true } },
      { kind: 'text', text: 'mênis', marks: { kind: { name: 'foreign', lang: 'el' } } },
      { kind: 'text', text: 'Iliad', marks: { kind: { name: 'title', lang: '' }, em: {} } },
    ]);
  });

  it('the kinds a text uses are counted once each, in the order of first use', () => {
    const blocks: Block[] = [
      { kind: 'passage', name: 'epigraph', content: [{ kind: 'text', text: 'a', marks: {} }] },
      {
        kind: 'paragraph',
        content: [
          { kind: 'text', text: 'b ', marks: { kind: { name: 'foreign', lang: 'el' } } },
          { kind: 'text', text: 'c ', marks: { underline: true } },
          { kind: 'text', text: 'd', marks: { kind: { name: 'term', lang: '' } } },
        ],
      },
      { kind: 'script', part: 'scene', content: [] },
      { kind: 'script', part: 'action', content: [] },
      {
        kind: 'verse',
        start: null,
        by: 5,
        lines: [
          { kind: 'speaker', indent: 0, content: [] },
          { kind: 'line', indent: 0, content: [{ kind: 'text', text: 'e', marks: {} }] },
          { kind: 'direction', indent: 0, content: [] },
        ],
      },
      {
        kind: 'blockquote',
        content: [
          { kind: 'passage', name: 'attribution', content: [] },
          { kind: 'passage', name: 'epigraph', content: [] },
        ],
      },
      { kind: 'bullet_list', items: [[{ kind: 'passage', name: 'k1', content: [] }]] },
    ];
    expect(bodyFacts(blocks).uses).toEqual([
      'epigraph',
      'foreign',
      'term',
      'scene',
      'action',
      'verse',
      'speaker',
      'direction',
      'attribution',
      'k1',
    ]);
    expect(bodyFacts(blocks).words).toBe(5);
    expect(bodyFacts([]).uses).toEqual([]);
  });

  it('a text is filled in the kind of paragraph an element begins in', () => {
    const doc = new Y.Doc();
    const kinds = (begins: string, text = 'One\nTwo') => {
      const fragment = doc.getXmlFragment(begins + text);
      doc.transact(() => fillBody(fragment, text, begins));
      return readBody(fragment);
    };
    expect(kinds('')).toEqual([
      { kind: 'paragraph', content: [{ kind: 'text', text: 'One', marks: {} }] },
      { kind: 'paragraph', content: [{ kind: 'text', text: 'Two', marks: {} }] },
    ]);
    expect(kinds('quote').map((b) => b.kind)).toEqual(['paragraph', 'paragraph']);
    expect(kinds('verse')).toEqual([
      {
        kind: 'verse',
        start: null,
        by: 5,
        lines: [
          { kind: 'line', indent: 0, content: [{ kind: 'text', text: 'One', marks: {} }] },
          { kind: 'line', indent: 0, content: [{ kind: 'text', text: 'Two', marks: {} }] },
        ],
      },
    ]);
    expect(kinds('character')).toEqual([
      { kind: 'script', part: 'character', content: [{ kind: 'text', text: 'One', marks: {} }] },
      { kind: 'script', part: 'character', content: [{ kind: 'text', text: 'Two', marks: {} }] },
    ]);
    expect(kinds('headword')).toEqual([
      { kind: 'passage', name: 'headword', content: [{ kind: 'text', text: 'One', marks: {} }] },
      { kind: 'passage', name: 'headword', content: [{ kind: 'text', text: 'Two', marks: {} }] },
    ]);
    // A kind of the writer's own is a passage too.
    expect(kinds('k1', 'Dear')).toEqual([
      { kind: 'passage', name: 'k1', content: [{ kind: 'text', text: 'Dear', marks: {} }] },
    ]);
    // Without text, one empty paragraph of the kind, so that the writing begins in it.
    expect(kinds('epigraph', '')).toEqual([{ kind: 'passage', name: 'epigraph', content: [] }]);
    expect(kinds('verse', '')).toEqual([
      { kind: 'verse', start: null, by: 5, lines: [{ kind: 'line', indent: 0, content: [] }] },
    ]);
    expect(kinds('', '')).toEqual([]);
  });
});
