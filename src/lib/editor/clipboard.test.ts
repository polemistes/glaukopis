import { EditorState } from 'prosemirror-state';
import { describe, expect, it } from 'vitest';
import { DOMParser as PMParser, Slice } from 'prosemirror-model';
import { copiedHtml, copiedText, looksLikeOrg, pastedTextSlice, wordsOf } from './clipboard';
import { bodySchema } from './schema';

/** What is pasted into an empty paragraph of a text, as the editor then holds it. */
function pasted(text: string): string[] {
  const state = EditorState.create({ schema: bodySchema });
  const $at = state.doc.resolve(1);
  const tr = state.tr.replaceSelection(pastedTextSlice(text, $at, bodySchema));
  const out: string[] = [];
  tr.doc.forEach((block) => {
    let line = '';
    block.forEach((n) => (line += n.type.name === 'hard_break' ? '⏎' : n.text));
    out.push(line);
  });
  return out;
}

describe('text pasted as text', () => {
  it('keeps every line break: breaks within a paragraph, blank lines between, empty paragraphs for more', () => {
    expect(pasted('One\ntwo\n\nThree\n\n\n\nFour\n')).toEqual(['One⏎two', 'Three', '', '', 'Four']);
  });
  it('is one paragraph where there is no blank line, and what Windows wrote is read as well', () => {
    expect(pasted('One\r\ntwo')).toEqual(['One⏎two']);
    expect(pasted('Alone')).toEqual(['Alone']);
  });
  it('is breaks and nothing else in a note, which holds no paragraphs', () => {
    const note = bodySchema.nodes.footnote.create();
    const state = EditorState.create({ schema: bodySchema, doc: note });
    const slice = pastedTextSlice('One\n\nTwo\nthree', state.doc.resolve(0), bodySchema);
    const content: string[] = [];
    slice.content.forEach((n) => content.push(n.type.name === 'hard_break' ? '⏎' : (n.text ?? '')));
    expect(content).toEqual(['One', '⏎', '⏎', 'Two', '⏎', 'three']);
  });
});

describe('text copied as Org', () => {
  const { nodes } = bodySchema;
  const nagy = {
    id: 'R1',
    key: 'nagy1979',
    type: 'book',
    fields: {},
    names: {},
    modified: '',
    authors: 'Nagy',
    year: '1979',
    title: 'The Best of the Achaeans',
    container: '',
  };
  const doc = () =>
    bodySchema.node('doc', null, [
      nodes.paragraph.create(null, [
        bodySchema.text('As was said '),
        nodes.citation.create({ items: [{ id: 'R1', locator: '73' }], mode: 'normal' }),
        nodes.hard_break.create(),
        bodySchema.text('and '),
        bodySchema.text('more', [bodySchema.marks.em.create()]),
        nodes.footnote.create(null, [bodySchema.text('A note.')]),
      ]),
      nodes.paragraph.create({ kind: 'item' }, [bodySchema.text('One')]),
      nodes.paragraph.create({ kind: 'item' }, [bodySchema.text('Two')]),
      nodes.paragraph.create({ kind: 'quote' }, [bodySchema.text('Sing, goddess.')]),
    ]);

  it('is Org: citations by their keys, a break, marks, a note, a list and a quotation', () => {
    const text = copiedText(new Slice(doc().content, 0, 0), 'en', () => ({ references: [nagy] }));
    expect(text).toBe(
      [
        'As was said [cite:@nagy1979 73] \\\\',
        'and /more/[fn::A note.]',
        '',
        '- One',
        '- Two',
        '',
        '#+BEGIN_QUOTE',
        'Sing, goddess.',
        '#+END_QUOTE',
      ].join('\n'),
    );
  });

  it('what is copied within a paragraph is a line of Org', () => {
    const d = doc();
    const slice = d.slice(4, 11);
    expect(copiedText(slice, 'en')).toBe('was sai');
  });

  it('is read back as it was, pasted as text', () => {
    const text = copiedText(new Slice(doc().content, 0, 0), 'en', () => ({ references: [nagy] }));
    const state = EditorState.create({ schema: bodySchema });
    const slice = pastedTextSlice(text, state.doc.resolve(1), bodySchema, () => ({
      references: [nagy],
    }));
    const back = state.tr.replaceSelection(slice).doc;
    expect(back.toJSON()).toEqual(doc().toJSON());
  });

  it('the words of what is copied, where it is not Org: the citations as they are shown', () => {
    const text = wordsOf(new Slice(doc().content, 0, 0), 'en');
    expect(text.startsWith('As was said ')).toBe(true);
    expect(text).toContain('\nand more [A note.]\n\nOne');
  });

  it('the HTML copied has the citations as they are shown', () => {
    const html = copiedHtml(bodySchema, () => 'en').serializeFragment(doc().content);
    const span = (html as DocumentFragment).querySelector('span[data-citation]');
    expect(span?.textContent?.length).toBeGreaterThan(0);
  });
});

describe('text pasted as Org', () => {
  /** What is pasted, as kinds and words of paragraphs. */
  function kinds(text: string): string[] {
    const state = EditorState.create({ schema: bodySchema });
    const tr = state.tr.replaceSelection(pastedTextSlice(text, state.doc.resolve(1), bodySchema));
    const out: string[] = [];
    tr.doc.forEach((block) => {
      let line = '';
      block.forEach((n) => (line += n.type.name === 'hard_break' ? '⏎' : (n.text ?? '')));
      out.push(`${block.attrs.kind}: ${line}`);
    });
    return out;
  }

  it('is read as Org where it holds a sign of Org at the start of a line', () => {
    expect(kinds('- One\n- Two')).toEqual(['item: One', 'item: Two']);
    expect(kinds('1. First\n2. Second')).toEqual(['numbered: First', 'numbered: Second']);
    expect(kinds('#+BEGIN_VERSE\n@ Nurse\nIf only the Argo\nhad never flown\n#+END_VERSE')).toEqual(
      ['speaker: Nurse', 'line: If only the Argo⏎had never flown'],
    );
    expect(kinds('#+begin_quote\nSing.\n#+end_quote')).toEqual(['quote: Sing.']);
  });

  it('and where it holds a citation or a note of Org', () => {
    const state = EditorState.create({ schema: bodySchema });
    const slice = pastedTextSlice(
      'As [cite:@west2001] says.',
      state.doc.resolve(1),
      bodySchema,
      () => ({
        references: [{ id: 'W1', key: 'west2001' } as never],
      }),
    );
    let cited: unknown = null;
    slice.content.descendants((n) => {
      if (n.type.name === 'citation') cited = n.attrs.items;
    });
    expect(cited).toEqual([{ id: 'W1' }]);
  });

  it('is text as before where it holds no sign of Org', () => {
    expect(kinds('One\ntwo\n\nThree')).toEqual(['text: One⏎two', 'text: Three']);
    expect(kinds('> quoted mail\n> more')).toEqual(['text: > quoted mail⏎> more']);
    expect(looksLikeOrg('a *bold* word')).toBe(false);
    expect(looksLikeOrg('* A headline')).toBe(true);
    expect(looksLikeOrg('| a | b |')).toBe(true);
  });
});

describe('HTML pasted with a data-citation of its own', () => {
  /** The citations ProseMirror finds in HTML, as their works. */
  function citations(html: string): unknown[] {
    const place = document.createElement('div');
    place.innerHTML = html;
    const doc = PMParser.fromSchema(bodySchema).parse(place);
    const found: unknown[] = [];
    doc.descendants((n) => {
      if (n.type.name === 'citation') found.push(n.attrs.items);
    });
    return found;
  }

  it('is a citation only where the attribute holds works, each with a reference', () => {
    const values = ['12', '{}', '"nagy"', '[null]', '[{}]', '[{"id":""}]', '[{"id":3}]', 'oops'];
    for (const value of values) {
      const html = `<p>See <span data-citation='${value}'>here</span>.</p>`;
      expect(citations(html), value).toEqual([]);
    }
  });

  it('keeps of each work only what a work of a citation says', () => {
    const items = JSON.stringify([
      { id: 'nagy1979', locator: '12', label: 7, suppressAuthor: 'yes', colour: 'red' },
      { id: 'nagy1979', locator: '30', suppressAuthor: true },
    ]);
    expect(citations(`<p><span data-citation='${items}'>Nagy</span></p>`)).toEqual([
      [
        { id: 'nagy1979', locator: '12' },
        { id: 'nagy1979', locator: '30', suppressAuthor: true },
      ],
    ]);
  });
});
