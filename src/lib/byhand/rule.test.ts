import type { Node } from 'prosemirror-model';
import { EditorState, TextSelection } from 'prosemirror-state';
import { describe, expect, it } from 'vitest';
import { bodySchema } from '$lib/editor/schema';
import { unwrapBox } from './box';
import { holdsHand, onlyInBoxes } from './rule';

const s = bodySchema;
const { paragraph, rich, footnote } = s.nodes;
const big = s.marks.size.create({ pt: 20 });
const red = s.marks.colour.create({ value: '#a02020' });
const futura = s.marks.font.create({ family: 'Futura' });
const p = (content: Node[] | string, hand: unknown = null) =>
  paragraph.create(
    { hand },
    typeof content === 'string' ? (content ? s.text(content) : null) : content,
  );
const text = (...blocks: Node[]) => s.node('doc', null, blocks);
const state = (doc: Node) => EditorState.create({ doc, plugins: [onlyInBoxes()] });

/** Whether anything is set by hand in the block at `index` of a text. */
const byHand = (doc: Node, index: number) => holdsHand(doc.child(index));

describe('what is set by hand lives only in a box', () => {
  it('stays in a box, on words and on a paragraph', () => {
    const doc = text(
      p('Plain'),
      rich.create(null, [
        p([s.text('Big', [big]), s.text(' red', [red, futura])], { align: 'center' }),
      ]),
    );
    const after = state(doc).apply(state(doc).tr.insertText('!', 2));
    expect(byHand(after.doc, 1)).toBe(true);
    expect(after.doc.child(1).firstChild!.attrs.hand).toEqual({ align: 'center' });
  });

  it('is taken away from what is put in outside a box, in the same step', () => {
    const before = state(text(p('Plain')));
    const pasted = p([s.text('Big', [big]), s.text(' red', [red])], { align: 'right' });
    const after = before.apply(before.tr.insert(before.doc.content.size, pasted));
    expect(after.doc.childCount).toBe(2);
    expect(after.doc.child(1).textContent).toBe('Big red');
    expect(byHand(after.doc, 1)).toBe(false);
    expect(after.doc.child(1).attrs.hand).toBeNull();
  });

  it('is taken away with the box, when a box is made ordinary text', () => {
    const doc = text(
      p('Before'),
      rich.create(null, [p([s.text('Big', [big])], { spaceAfter: '12pt' }), p('Plain in it')]),
    );
    let after = state(doc);
    unwrapBox(8)(after, (tr) => (after = after.apply(tr)));
    expect(after.doc.childCount).toBe(3);
    expect(after.doc.textContent).toBe('BeforeBigPlain in it');
    expect(holdsHand(after.doc)).toBe(false);
    // The marks there are everywhere are left alone.
    const strong = state(
      text(rich.create(null, p([s.text('Bold', [s.marks.strong.create(), big])]))),
    );
    let plain = strong;
    unwrapBox(0)(plain, (tr) => (plain = plain.apply(tr)));
    expect(plain.doc.firstChild!.firstChild!.marks.map((m) => m.type.name)).toEqual(['strong']);
  });

  it('is taken away from a mark put on words outside a box', () => {
    const before = state(text(p('Plain words')));
    const after = before.apply(before.tr.addMark(1, 6, red));
    expect(holdsHand(after.doc)).toBe(false);
    const said = before.apply(before.tr.setNodeAttribute(0, 'hand', { align: 'center' }));
    expect(said.doc.firstChild!.attrs.hand).toBeNull();
  });

  it('is not had by a note at the foot, though the note is written in a box', () => {
    const note = footnote.create(null, s.text('A note', [red]));
    const before = state(text(rich.create(null, p([s.text('Words', [red])]))));
    const after = before.apply(before.tr.insert(7, note));
    const written = after.doc.firstChild!.firstChild!;
    expect(written.firstChild!.marks.map((m) => m.type.name)).toEqual(['colour']);
    expect(written.child(1).type.name).toBe('footnote');
    expect(holdsHand(written.child(1))).toBe(false);
  });

  it('leaves alone what a change did not touch', () => {
    // A text that came with something by hand outside a box is mended where it is written in, not all at once.
    const doc = text(p([s.text('Old', [red])]), p('Written in'));
    const before = state(doc);
    const after = before.apply(before.tr.insertText('!', doc.content.size - 1));
    expect(byHand(after.doc, 0)).toBe(true);
    const touched = after.apply(after.tr.insertText('!', 2));
    expect(byHand(touched.doc, 0)).toBe(false);
    expect(TextSelection.atStart(touched.doc)).toBeTruthy();
  });
});
