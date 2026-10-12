import { EditorState, TextSelection } from 'prosemirror-state';
import { describe, expect, it } from 'vitest';
import { insertRefMark, labelBefore, nextLabel } from './refmarks';
import { bodySchema } from './schema';

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
