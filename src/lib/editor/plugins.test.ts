import { EditorState, TextSelection } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { afterEach, describe, expect, it } from 'vitest';
import { setStyle, styleOf } from './commands';
import { bodyPlugins } from './plugins';
import { bodySchema } from './schema';

let view: EditorView | undefined;

function editor(): EditorView {
  const place = document.body.appendChild(document.createElement('div'));
  view = new EditorView(place, {
    state: EditorState.create({
      schema: bodySchema,
      plugins: bodyPlugins(bodySchema, { undo: () => {}, redo: () => {} }),
    }),
  });
  return view;
}

/** Types as a person does: one sign at a time, each offered to the rules first. */
function type(v: EditorView, text: string) {
  for (const sign of text) {
    const { from, to } = v.state.selection;
    const taken = v.someProp('handleTextInput', (f) =>
      f(v, from, to, sign, () => v.state.tr.insertText(sign, from, to)),
    );
    if (!taken) v.dispatch(v.state.tr.insertText(sign, from, to));
  }
}

/** The text with its marks written out, to be compared. */
function written(v: EditorView): string {
  const out: string[] = [];
  v.state.doc.descendants((node) => {
    if (node.isText) {
      const marks = node.marks
        .map((m) => m.type.name)
        .sort()
        .join('+');
      out.push(marks ? `<${marks}>${node.text}</>` : (node.text ?? ''));
    }
  });
  return out.join('');
}

afterEach(() => {
  view?.destroy();
  view = undefined;
  document.body.innerHTML = '';
});

describe('signs that set words as they are typed', () => {
  it('sets italics and bold', () => {
    const v = editor();
    type(v, 'The *mênis* of **Achilles** and _so_ on');
    expect(written(v)).toBe('The <em>mênis</> of <strong>Achilles</> and <em>so</> on');
  });

  it('goes on in plain text after the last sign', () => {
    const v = editor();
    type(v, '*so* then');
    expect(written(v)).toBe('<em>so</> then');
  });

  it('sets several words, and at the beginning of a parenthesis', () => {
    const v = editor();
    type(v, '(*The Best of the Achaeans*)');
    expect(written(v)).toBe('(<em>The Best of the Achaeans</>)');
  });

  it('leaves alone the asterisk of a reconstructed form', () => {
    const v = editor();
    type(v, 'from *bher- and *dhe- ');
    expect(written(v)).toBe('from *bher- and *dhe- ');
    const w = editor();
    type(w, 'and 2*3*4 is 24');
    expect(written(w)).toBe('and 2*3*4 is 24');
    w.destroy();
  });

  it('leaves alone the underscore in a name', () => {
    const v = editor();
    type(v, 'the file my_notes_final and a_b');
    expect(written(v)).toBe('the file my_notes_final and a_b');
  });

  it('makes dashes', () => {
    const v = editor();
    type(v, 'pp. 12--14 --- so...');
    expect(written(v)).toBe('pp. 12–14 — so…');
  });

  it('begins a quotation and a list at the start of a line', () => {
    const v = editor();
    type(v, '> Sing, goddess');
    expect(styleOf(v.state)).toBe('quote');
    const w = editor();
    type(w, '1. First');
    expect(styleOf(w.state)).toBe('numbered');
    w.destroy();
  });
});

describe('the kind of a paragraph', () => {
  it('is changed from any to any', () => {
    const v = editor();
    type(v, 'Sing, goddess');
    expect(styleOf(v.state)).toBe('text');
    for (const style of [
      'quote',
      'list',
      'numbered',
      'quote',
      'text',
      'numbered',
      'list',
      'text',
    ] as const) {
      setStyle(style)(v.state, v.dispatch, v);
      expect(styleOf(v.state)).toBe(style);
      expect(v.state.doc.textContent).toBe('Sing, goddess');
    }
    expect(v.state.doc.childCount).toBe(1);
    expect(v.state.doc.firstChild?.type.name).toBe('paragraph');
  });

  it('is changed for the paragraph the cursor is in, and no other', () => {
    const v = editor();
    type(v, 'One');
    v.dispatch(v.state.tr.split(v.state.selection.from));
    type(v, 'Two');
    v.dispatch(v.state.tr.setSelection(TextSelection.atStart(v.state.doc)));
    setStyle('quote')(v.state, v.dispatch, v);
    expect(v.state.doc.child(0).type.name).toBe('blockquote');
    expect(v.state.doc.child(1).type.name).toBe('paragraph');
  });
});
