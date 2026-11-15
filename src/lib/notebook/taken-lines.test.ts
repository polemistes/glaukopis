import { EditorState } from 'prosemirror-state';
import { describe, expect, it } from 'vitest';
import { bodySchema } from '$lib/editor/schema';
import { takenLines } from './taken-lines';

const { doc, paragraph } = bodySchema.nodes;
const words = (text: string, passage?: string) =>
  bodySchema.text(text, passage ? [bodySchema.marks.taken.create({ passage })] : []);

describe('the line beside what was taken whole', () => {
  it('is drawn beside a paragraph every letter of which was taken, and no other', () => {
    const plugin = takenLines();
    const state = EditorState.create({
      schema: bodySchema,
      plugins: [plugin],
      doc: doc.create(null, [
        paragraph.create(null, [words('All taken', 'P1')]),
        paragraph.create(null, [words('Mine, and '), words('taken', 'P1')]),
        paragraph.create(null, [words('Two ', 'P1'), words('passages', 'P2'), words('  ')]),
        paragraph.create(),
      ]),
    });
    const lined = (s: EditorState) =>
      plugin
        .getState(s)!
        .find()
        .map((d) => [
          d.from,
          (d as unknown as { type: { attrs: { class: string } } }).type.attrs.class,
        ]);
    const first = state.doc.child(0).nodeSize;
    const second = state.doc.child(1).nodeSize;
    expect(lined(state)).toEqual([
      [0, 'taken-whole'],
      [first + second, 'taken-whole'],
    ]);
    // Written in, it is read anew: the first is no longer taken whole.
    const next = state.apply(state.tr.insertText('mine ', 1));
    expect(lined(next)).toEqual([[first + 5 + second, 'taken-whole']]);
  });
});
