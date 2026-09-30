import { EditorState, TextSelection } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { afterEach, describe, expect, it } from 'vitest';
import { setStyle, styleOf } from './commands';
import { bodyPlugins } from './plugins';
import { DOMSerializer } from 'prosemirror-model';
import { bodySchema, safeHref } from './schema';

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

describe('links', () => {
  it('lead to the web, to an address or within the document, and nowhere that runs', () => {
    for (const href of [
      'https://example.org',
      'http://a.b/c?d#e',
      'mailto:a@b.no',
      'doi:10.1/x',
      '#part',
      'notes.html',
    ])
      expect(safeHref(href), href).toBe(true);
    for (const href of [
      'javascript:alert(1)',
      ' JavaScript:alert(1)',
      'java\tscript:alert(1)',
      'data:text/html,<b>',
      'vbscript:x',
      'file:///etc/passwd',
      null,
    ])
      expect(safeHref(href), String(href)).toBe(false);
  });

  it('that may not be followed are drawn without where they lead', () => {
    const draw = (href: string) => {
      const mark = bodySchema.marks.link.create({ href });
      const text = bodySchema.text('here', [mark]);
      const dom = DOMSerializer.fromSchema(bodySchema).serializeFragment(
        bodySchema.nodes.paragraph.create(null, text).content,
      );
      return (dom.firstChild as HTMLAnchorElement).getAttribute('href');
    };
    expect(draw('https://example.org')).toBe('https://example.org');
    expect(draw('javascript:alert(1)')).toBeNull();
  });
});

describe('what is put right as it is typed', () => {
  it('leaves the signs of Markdown as they are typed', () => {
    const v = editor();
    type(v, 'The *mênis* of **Achilles** and _so_ on');
    expect(written(v)).toBe('The *mênis* of **Achilles** and _so_ on');
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
