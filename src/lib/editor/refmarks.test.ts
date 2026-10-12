import { EditorState, TextSelection } from 'prosemirror-state';
import { describe, expect, it } from 'vitest';
import { insertRefMark, labelBefore, nextLabel } from './refmarks';
import { bodySchema } from './schema';
import { markLine, splitLine } from './verse';

const { nodes } = bodySchema;

describe('reference marks', () => {
  it('propose the label that follows the one before', () => {
    expect(nextLabel('3:16')).toBe('3:17');
    expect(nextLabel('1094a1')).toBe('1094a2');
    expect(nextLabel('09')).toBe('10');
    expect(nextLabel('327a')).toBe('327b');
    expect(nextLabel('Prol.')).toBe('');
  });

  it('are put in where the cursor is, and found again before it', () => {
    const doc = nodes.doc.create(null, [nodes.paragraph.create(null, bodySchema.text('For God'))]);
    let state = EditorState.create({ doc });
    state = state.apply(state.tr.setSelection(TextSelection.create(state.doc, 4)));
    insertRefMark(' 16 ')(state, (tr) => (state = state.apply(tr)));
    const mark = state.doc.firstChild!.child(1);
    expect(mark.type.name).toBe('refmark');
    expect(mark.attrs.label).toBe('16');
    expect(labelBefore(state.doc, state.doc.content.size)).toBe('16');
    expect(labelBefore(state.doc, 2)).toBeNull();
  });
});

describe('a line of verse', () => {
  const verse = () =>
    nodes.doc.create(null, [
      nodes.verse.create(null, [
        nodes.verse_line.create(null, bodySchema.text('Nor had the heroes')),
        nodes.verse_line.create(null, bodySchema.text('rowed')),
      ]),
    ]);

  it('is given a number, is not counted, and has words in the margin', () => {
    let state = EditorState.create({ doc: verse() });
    state = state.apply(state.tr.setSelection(TextSelection.create(state.doc, 4)));
    markLine({ number: ' 1094a1 ', counted: false, margin: 'ia. trim.' })(
      state,
      (tr) => (state = state.apply(tr)),
    );
    expect(state.doc.firstChild!.firstChild!.attrs).toMatchObject({
      number: '1094a1',
      counted: false,
      margin: 'ia. trim.',
    });
    // Split within, the line that is split off says none of it.
    splitLine(state, (tr) => (state = state.apply(tr)));
    const lines = state.doc.firstChild!;
    expect(lines.childCount).toBe(3);
    expect(lines.child(0).attrs.number).toBe('1094a1');
    expect(lines.child(1).attrs).toMatchObject({ number: null, counted: true, margin: null });
  });
});
