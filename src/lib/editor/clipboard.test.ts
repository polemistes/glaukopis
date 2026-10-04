import { EditorState } from 'prosemirror-state';
import { describe, expect, it } from 'vitest';
import { pastedTextSlice } from './clipboard';
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
