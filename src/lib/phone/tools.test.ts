import { EditorState, TextSelection, type Transaction } from 'prosemirror-state';
import { describe, expect, it } from 'vitest';
import { bodySchema } from '$lib/editor/schema';
import { TOOLS, toolCommand, toolOn, type TextTool } from './tools';

/** A text of one paragraph with these words, the cursor at the end, or the words from `from` to `to` selected. */
function stateOf(words: string, from?: number, to?: number): EditorState {
  const doc = bodySchema.node('doc', null, [
    bodySchema.node('paragraph', null, words ? [bodySchema.text(words)] : []),
  ]);
  const state = EditorState.create({ schema: bodySchema, doc });
  const selection =
    from === undefined ? TextSelection.atEnd(doc) : TextSelection.create(doc, from, to ?? from);
  return state.apply(state.tr.setSelection(selection));
}

/** The state once a tool is pressed. */
function pressed(state: EditorState, tool: TextTool): EditorState {
  let next = state;
  const done = toolCommand(tool)(state, (tr: Transaction) => (next = state.apply(tr)));
  expect(done).toBe(true);
  return next;
}

/** The words of the text that carry a mark. */
function marked(state: EditorState, mark: string): string {
  let out = '';
  state.doc.descendants((node) => {
    if (node.isText && node.marks.some((m) => m.type.name === mark)) out += node.text;
  });
  return out;
}

describe('the tools of the row over the keyboard', () => {
  it('are seven, in their order, the two that take a file in before Undo, which is last', () => {
    expect(TOOLS).toEqual(['bold', 'italic', 'list', 'todo', 'file', 'photograph', 'undo']);
  });

  it('set the words selected in bold and in italics, and take it away again', () => {
    let state = stateOf('Some bold words', 6, 10);
    expect(toolOn(state, 'bold')).toBe(false);
    state = pressed(state, 'bold');
    expect(marked(state, 'strong')).toBe('bold');
    expect(toolOn(state, 'bold')).toBe(true);
    state = pressed(state, 'italic');
    expect(marked(state, 'em')).toBe('bold');
    expect(toolOn(state, 'italic')).toBe(true);
    state = pressed(state, 'bold');
    expect(marked(state, 'strong')).toBe('');
    expect(toolOn(state, 'bold')).toBe(false);
  });

  it('with nothing selected, make what is written next bold, and say so', () => {
    let state = stateOf('Words');
    state = pressed(state, 'bold');
    expect(toolOn(state, 'bold')).toBe(true);
    state = state.apply(state.tr.insertText(' more'));
    expect(marked(state, 'strong')).toBe(' more');
  });

  it('make the paragraph a point of a list, and text again', () => {
    let state = stateOf('A point');
    expect(toolOn(state, 'list')).toBe(false);
    state = pressed(state, 'list');
    expect(state.doc.firstChild!.attrs.kind).toBe('item');
    expect(toolOn(state, 'list')).toBe(true);
    expect(toolOn(state, 'todo')).toBe(false);
    state = pressed(state, 'list');
    expect(state.doc.firstChild!.attrs.kind).toBe('text');
    expect(toolOn(state, 'list')).toBe(false);
  });

  it('make the paragraph a point to tick, from a point of a list too, and text again', () => {
    let state = pressed(stateOf('To be done'), 'list');
    state = pressed(state, 'todo');
    expect(state.doc.firstChild!.attrs.kind).toBe('todo');
    expect(toolOn(state, 'todo')).toBe(true);
    expect(toolOn(state, 'list')).toBe(false);
    state = pressed(state, 'todo');
    expect(state.doc.firstChild!.attrs.kind).toBe('text');
  });

  it('are off where there is no text', () => {
    for (const tool of ['bold', 'italic', 'list', 'todo'] as const)
      expect(toolOn(null, tool)).toBe(false);
  });
});
