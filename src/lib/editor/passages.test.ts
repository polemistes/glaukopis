import type { Node } from 'prosemirror-model';
import { EditorState, TextSelection } from 'prosemirror-state';
import { describe, expect, it } from 'vitest';
import { keepShape, passages } from './passages';
import { bodySchema } from './schema';

const { doc, paragraph, passage, parallel, parallel_side } = bodySchema.nodes;

/** A paragraph of a kind with these words. */
const p = (kind: string, words = kind, attrs: Record<string, unknown> = {}) =>
  paragraph.create({ kind, ...attrs }, words ? bodySchema.text(words) : undefined);

/** A passage of a family, with its paragraphs. */
const P = (family: string, children: Node[], attrs: Record<string, unknown> = {}) =>
  passage.create({ family, ...attrs }, children);

/** The shape of a text, written out: a passage as its family with its kinds in brackets, a paragraph as its kind. */
function shape(node: Node): string {
  const out: string[] = [];
  node.forEach((child) => {
    if (child.type === passage) {
      const kinds: string[] = [];
      child.forEach((para) => kinds.push(para.attrs.kind as string));
      out.push(`${child.attrs.family}[${kinds.join(' ')}]`);
    } else if (child.type === paragraph) out.push(child.attrs.kind as string);
    else if (child.type === parallel) {
      const sides: string[] = [];
      child.forEach((side) => sides.push(shape(side)));
      out.push(`parallel(${sides.join(' | ')})`);
    } else out.push(child.type.name);
  });
  return out.join(' ');
}

/** The shape kept, on a text that is anything but. */
function kept(children: Node[], own: { id: string; basedOn?: string }[] = []) {
  const state = EditorState.create({ doc: doc.create(null, children) });
  const tr = state.tr;
  const did = keepShape(tr, own);
  return { did, doc: tr.doc, shape: shape(tr.doc), tr };
}

describe('the shape of a text', () => {
  it('puts a paragraph of a kind in a passage of its family, and leaves text where it is', () => {
    const { did, shape } = kept([p('text'), p('quote'), p('text')]);
    expect(did).toBe(true);
    expect(shape).toBe('text quotation[quote] text');
  });

  it('puts a run of paragraphs of one family in one passage, and does nothing to a text that has the shape', () => {
    const first = kept([p('line', 'a'), p('line', 'b'), p('speaker'), p('line', 'c'), p('text')]);
    expect(first.shape).toBe('verse[line line speaker line] text');
    const again = kept([...first.doc.content.content]);
    expect(again.did).toBe(false);
    expect(again.shape).toBe(first.shape);
  });

  it('lifts a text paragraph out of a passage, splitting it', () => {
    const { shape } = kept([P('verse', [p('line', 'a'), p('text'), p('line', 'b')])]);
    expect(shape).toBe('verse[line] text verse[line]');
  });

  it('splits a paragraph of another family out into a passage of its own', () => {
    const { shape } = kept([P('quotation', [p('quote', 'a'), p('item'), p('quote', 'b')])]);
    expect(shape).toBe('quotation[quote] list[item] quotation[quote]');
  });

  it('keeps an attribution in whatever passage precedes it, and at the top makes a quotation of it', () => {
    expect(kept([P('verse', [p('line'), p('attribution')])]).shape).toBe('verse[line attribution]');
    expect(kept([P('verse', [p('line')]), p('attribution')]).shape).toBe('verse[line attribution]');
    expect(kept([p('text'), p('attribution')]).shape).toBe('text quotation[attribution]');
    // At the head of a passage of another family it has nothing to join: it goes before.
    expect(kept([P('verse', [p('attribution'), p('line')])]).shape).toBe(
      'quotation[attribution] verse[line]',
    );
    // A list in the middle of a quotation, with the attribution staying with the quotation that follows the list.
    expect(
      kept([P('quotation', [p('quote'), p('item'), p('quote', 'b'), p('attribution')])]).shape,
    ).toBe('quotation[quote] list[item] quotation[quote attribution]');
    expect(kept([P('quotation', [p('quote'), p('line'), p('attribution')])]).shape).toBe(
      'quotation[quote] verse[line attribution]',
    );
  });

  it('joins passages of one family that stand next to each other, the first one`s settings holding', () => {
    const { doc, shape } = kept([
      P('verse', [p('line', 'a')], { numbering: 'counted', every: 3 }),
      P('verse', [p('line', 'b')], { numbering: 'given', side: 'right' }),
      P('list', [p('item')]),
      P('list', [p('numbered')]),
    ]);
    expect(shape).toBe('verse[line line] list[item numbered]');
    expect(doc.firstChild!.attrs).toMatchObject({ numbering: 'counted', every: 3, side: null });
  });

  it('keeps text in a numbered passage of text, and lifts it out when the passage is not numbered', () => {
    const numbered = kept([
      P('text', [p('text', 'One'), p('text', 'Two')], { numbering: 'counted' }),
      p('text'),
    ]);
    expect(numbered.did).toBe(false);
    expect(numbered.shape).toBe('text[text text] text');
    const plain = kept([P('text', [p('text', 'One'), p('text', 'Two')]), p('text')]);
    expect(plain.shape).toBe('text text text');
    // What is not text does not stay in it.
    const mixed = kept([
      P('text', [p('text', 'One'), p('quote', 'Two')], { numbering: 'counted' }),
    ]);
    expect(mixed.shape).toBe('text[text] quotation[quote]');
  });

  it('takes an empty passage away', () => {
    const { shape } = kept([p('text'), passage.create({ family: 'verse' }), p('text')]);
    expect(shape).toBe('text text');
  });

  it('keeps the shape within the sides of a parallel text, and leaves a table cell as it is', () => {
    const { shape } = kept([
      parallel.create(null, [
        parallel_side.create(null, [p('line', 'a'), p('line', 'b')]),
        parallel_side.create(null, [P('verse', [p('text'), p('line')])]),
      ]),
    ]);
    expect(shape).toBe('parallel(verse[line line] | text verse[line])');
    const { table_cell, table_row, table, tabular, table_caption } = bodySchema.nodes;
    const cell = table_cell.create(null, [p('quote')]);
    const t = tabular.create(null, [
      table_caption.create(),
      table.create(null, [table_row.create(null, [cell])]),
    ]);
    const inCell = kept([t]);
    expect(inCell.did).toBe(false);
  });

  it('a kind of the writer`s own has the family of what it is based on, and one based on text a family of its own', () => {
    const own = [
      { id: 'k1', basedOn: 'epigraph' },
      { id: 'letter', basedOn: 'text' },
    ];
    expect(kept([p('quote'), p('k1'), p('letter'), p('letter', 'b'), p('text')], own).shape).toBe(
      'quotation[quote k1] letter[letter letter] text',
    );
    // Not known at all: text.
    expect(kept([p('nothing')]).shape).toBe('nothing');
  });

  it('the cursor stays with its words', () => {
    const state = EditorState.create({
      doc: doc.create(null, [p('text', 'One'), p('quote', 'Two'), p('text', 'Three')]),
      selection: undefined,
    });
    // Within "Two", after the "w".
    const at = EditorState.create({
      doc: state.doc,
      selection: TextSelection.create(state.doc, 8),
    });
    const tr = at.tr;
    keepShape(tr);
    const { $from } = tr.selection;
    expect($from.parent.textContent).toBe('Two');
    expect($from.parentOffset).toBe(2);
  });

  it('as a plugin, follows every change but what comes through the shared document', () => {
    const state = EditorState.create({
      doc: doc.create(null, [p('text', 'One')]),
      plugins: [passages()],
    });
    const next = state.apply(state.tr.setNodeMarkup(0, undefined, { kind: 'quote' }));
    expect(shape(next.doc)).toBe('quotation[quote]');
    // Nothing to do: no transaction is appended.
    const same = next.applyTransaction(next.tr.insertText('!', 4));
    expect(same.transactions).toHaveLength(1);
  });
});
