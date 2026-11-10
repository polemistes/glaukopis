import { EditorState } from 'prosemirror-state';
import { describe, expect, it } from 'vitest';
import { givenNumbers } from './given-numbers';
import { bodySchema } from './schema';

const { paragraph, linemark } = bodySchema.nodes;
const p = (kind: string, words: string, number?: string) =>
  paragraph.create({ kind }, [
    ...(number ? [linemark.create({ number })] : []),
    bodySchema.text(words),
  ]);

describe('a point of a numbered list given its number by hand', () => {
  it('has the number said on it, for the count to go on from', () => {
    const plugin = givenNumbers();
    let state = EditorState.create({
      doc: bodySchema.node('doc', null, [
        p('numbered', 'first'),
        p('text', 'said of it'),
        p('numbered', 'second', '2'),
        p('text', 'a line', '7'),
        p('numbered', 'not a number', 'iv'),
      ]),
      plugins: [plugin],
    });
    const given = () =>
      plugin
        .getState(state)!
        .find()
        .map((d) => (d as unknown as { type: { attrs: Record<string, string> } }).type.attrs);
    expect(given()).toEqual([{ 'data-given': '2', style: '--given: 2' }]);
    // Written in, the number stays with its point.
    state = state.apply(state.tr.insertText('x', 1));
    expect(given()).toEqual([{ 'data-given': '2', style: '--given: 2' }]);
  });
});
