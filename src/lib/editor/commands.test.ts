import { EditorState, TextSelection } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { afterEach, describe, expect, it } from 'vitest';
import { kindMarkOf, kindOf, setKind, setStyle, styleOf, toggleKind } from './commands';
import { bodyPlugins } from './plugins';
import { bodySchema } from './schema';
import { backOutOfPassage, nextPassage, tabPassage } from './script';

let view: EditorView | undefined;

function editor(text = ''): EditorView {
  const place = document.body.appendChild(document.createElement('div'));
  view = new EditorView(place, {
    state: EditorState.create({
      schema: bodySchema,
      plugins: bodyPlugins(bodySchema, { undo: () => {}, redo: () => {} }),
    }),
  });
  if (text) view.dispatch(view.state.tr.insertText(text));
  return view;
}

/** The blocks of the text at the top, each as its type and its kind. */
function shape(v: EditorView): string[] {
  const out: string[] = [];
  v.state.doc.forEach((node) => {
    const name = node.type.name;
    const kind = node.attrs.name ?? node.attrs.part;
    out.push(kind ? `${name}:${kind}` : name);
  });
  return out;
}

afterEach(() => {
  view?.destroy();
  view = undefined;
  document.body.innerHTML = '';
});

describe('the kind of a paragraph', () => {
  it('is made of every kind from every kind, and the text stays', () => {
    const v = editor('Sing, goddess');
    expect(kindOf(v.state)).toBe('text');
    for (const kind of [
      'epigraph',
      'quote',
      'attribution',
      'list',
      'headword',
      'scene',
      'verse',
      'dialogue',
      'speaker',
      'draft',
      'numbered',
      'code',
      'text',
      'break',
      'k1',
      'text',
    ]) {
      expect(setKind(kind)(v.state, v.dispatch, v), kind).toBe(true);
      expect(kindOf(v.state), kind).toBe(kind);
      expect(v.state.doc.textContent, kind).toBe('Sing, goddess');
    }
    expect(shape(v)).toEqual(['paragraph']);
  });

  it('a kind of the writer`s own is a passage of its name, and a passage of no name is text', () => {
    const v = editor('Dear reader');
    setKind('k1')(v.state, v.dispatch, v);
    expect(shape(v)).toEqual(['passage:k1']);
    v.dispatch(v.state.tr.setNodeMarkup(0, undefined, { name: '' }));
    expect(kindOf(v.state)).toBe('text');
  });

  it('comes out of a quotation and a list to become a passage, and goes into one from a passage', () => {
    const v = editor('Within');
    setKind('quote')(v.state, v.dispatch, v);
    setKind('list')(v.state, v.dispatch, v);
    expect(kindOf(v.state)).toBe('list');
    setKind('epigraph')(v.state, v.dispatch, v);
    expect(shape(v)).toEqual(['passage:epigraph']);
    setKind('numbered')(v.state, v.dispatch, v);
    expect(shape(v)).toEqual(['ordered_list']);
    expect(kindOf(v.state)).toBe('numbered');
    setKind('scene')(v.state, v.dispatch, v);
    expect(shape(v)).toEqual(['script:scene']);
    setKind('gloss')(v.state, v.dispatch, v);
    expect(shape(v)).toEqual(['passage:gloss']);
  });

  it('is changed for the paragraphs that are selected, and no other', () => {
    const v = editor('One');
    v.dispatch(v.state.tr.split(v.state.selection.from));
    v.dispatch(v.state.tr.insertText('Two'));
    v.dispatch(v.state.tr.split(v.state.selection.from));
    v.dispatch(v.state.tr.insertText('Three'));
    // The first two.
    v.dispatch(v.state.tr.setSelection(TextSelection.create(v.state.doc, 1, 7)));
    setKind('headword')(v.state, v.dispatch, v);
    expect(shape(v)).toEqual(['passage:headword', 'passage:headword', 'paragraph']);
    setKind('text')(v.state, v.dispatch, v);
    expect(shape(v)).toEqual(['paragraph', 'paragraph', 'paragraph']);
  });

  it('leaves what holds text and is no paragraph as it is', () => {
    const v = editor();
    const { figure } = bodySchema.nodes;
    v.dispatch(
      v.state.tr.replaceWith(
        0,
        v.state.doc.content.size,
        figure.create({ file: 'a'.repeat(64), extension: 'png' }, bodySchema.text('Said')),
      ),
    );
    v.dispatch(v.state.tr.setSelection(TextSelection.create(v.state.doc, 2)));
    setKind('epigraph')(v.state, v.dispatch, v);
    expect(shape(v)).toEqual(['figure']);
  });

  it('within a verse, a line is said to be the speaker and the verse stays whole', () => {
    const v = editor('Nurse');
    v.dispatch(v.state.tr.split(v.state.selection.from));
    v.dispatch(v.state.tr.insertText('If only the Argo'));
    v.dispatch(v.state.tr.split(v.state.selection.from));
    v.dispatch(v.state.tr.insertText('had never flown'));
    v.dispatch(
      v.state.tr.setSelection(TextSelection.create(v.state.doc, 1, v.state.doc.content.size - 1)),
    );
    setKind('verse')(v.state, v.dispatch, v);
    expect(shape(v)).toEqual(['verse']);
    v.dispatch(v.state.tr.setSelection(TextSelection.create(v.state.doc, 2)));
    setKind('speaker')(v.state, v.dispatch, v);
    expect(shape(v)).toEqual(['verse']);
    const lines: string[] = [];
    v.state.doc.firstChild!.forEach((line) => lines.push(line.attrs.kind as string));
    expect(lines).toEqual(['speaker', 'line', 'line']);
    expect(kindOf(v.state)).toBe('speaker');
    setKind('direction')(v.state, v.dispatch, v);
    expect(kindOf(v.state)).toBe('direction');
    setKind('verse')(v.state, v.dispatch, v);
    expect(kindOf(v.state)).toBe('verse');
    expect(shape(v)).toEqual(['verse']);
  });

  it('is told by the old names too', () => {
    const v = editor('Old');
    setStyle('quote')(v.state, v.dispatch, v);
    expect(styleOf(v.state)).toBe('quote');
    setKind('epigraph')(v.state, v.dispatch, v);
    expect(styleOf(v.state)).toBe('text');
    expect(kindOf(v.state)).toBe('epigraph');
  });
});

describe('the kind of words', () => {
  it('is set on the words, replaced by another, and taken off by the same', () => {
    const v = editor('mênis of Achilles');
    v.dispatch(v.state.tr.setSelection(TextSelection.create(v.state.doc, 1, 6)));
    expect(kindMarkOf(v.state)).toBeNull();
    expect(toggleKind('foreign', 'el')(v.state, v.dispatch, v)).toBe(true);
    expect(kindMarkOf(v.state)).toEqual({ name: 'foreign', lang: 'el' });
    // Another kind takes its place: a run of words has one kind.
    toggleKind('term')(v.state, v.dispatch, v);
    expect(kindMarkOf(v.state)).toEqual({ name: 'term', lang: '' });
    expect(v.state.doc.firstChild!.firstChild!.marks).toHaveLength(1);
    // The same language is the same kind; another language is not.
    toggleKind('foreign', 'el')(v.state, v.dispatch, v);
    toggleKind('foreign', 'grc')(v.state, v.dispatch, v);
    expect(kindMarkOf(v.state)).toEqual({ name: 'foreign', lang: 'grc' });
    toggleKind('foreign', 'grc')(v.state, v.dispatch, v);
    expect(kindMarkOf(v.state)).toBeNull();
    expect(v.state.doc.firstChild!.firstChild!.marks).toHaveLength(0);
  });

  it('with nothing selected is what is typed next, and is told by setKind as well', () => {
    const v = editor();
    setKind('highlight')(v.state, v.dispatch, v);
    expect(kindMarkOf(v.state)).toEqual({ name: 'highlight', lang: '' });
    v.dispatch(v.state.tr.insertText('bright'));
    expect(v.state.doc.firstChild!.firstChild!.marks[0].attrs).toEqual({
      name: 'highlight',
      lang: '',
    });
    expect(shape(v)).toEqual(['paragraph']);
  });

  it('is drawn as a span with the kind, and the language of foreign words', () => {
    const v = editor('ἄνδρα');
    v.dispatch(v.state.tr.setSelection(TextSelection.create(v.state.doc, 1, 6)));
    toggleKind('foreign', 'grc')(v.state, v.dispatch, v);
    const span = v.dom.querySelector('span.kind')!;
    expect(span.getAttribute('data-kind')).toBe('foreign');
    expect(span.getAttribute('lang')).toBe('grc');
    toggleKind('term')(v.state, v.dispatch, v);
    expect(v.dom.querySelector('span.kind')!.hasAttribute('lang')).toBe(false);
  });
});

describe('the keys in a paragraph of a kind', () => {
  const press = (v: EditorView, command: ReturnType<typeof nextPassage>) =>
    command(v.state, v.dispatch, v);

  it('Enter at the end begins the kind that follows', () => {
    const v = editor('Sing, goddess');
    setKind('epigraph')(v.state, v.dispatch, v);
    v.dispatch(v.state.tr.setSelection(TextSelection.atEnd(v.state.doc)));
    expect(press(v, nextPassage())).toBe(true);
    expect(shape(v)).toEqual(['passage:epigraph', 'passage:attribution']);
    expect(kindOf(v.state)).toBe('attribution');
    v.dispatch(v.state.tr.insertText('Homer'));
    expect(press(v, nextPassage())).toBe(true);
    expect(shape(v)).toEqual(['passage:epigraph', 'passage:attribution', 'paragraph']);
    // Not in the middle of the text.
    v.dispatch(v.state.tr.setSelection(TextSelection.create(v.state.doc, 3)));
    expect(press(v, nextPassage())).toBe(false);
  });

  it('Enter after code is code, and after a part of a script the part that follows', () => {
    const v = editor('let x');
    setKind('code')(v.state, v.dispatch, v);
    v.dispatch(v.state.tr.setSelection(TextSelection.atEnd(v.state.doc)));
    press(v, nextPassage());
    expect(shape(v)).toEqual(['passage:code', 'passage:code']);
    const w = editor('MARY');
    setKind('character')(w.state, w.dispatch, w);
    w.dispatch(w.state.tr.setSelection(TextSelection.atEnd(w.state.doc)));
    press(w, nextPassage());
    expect(shape(w)).toEqual(['script:character', 'script:dialogue']);
    w.destroy();
  });

  it('a kind of the writer`s own is followed as the kind it is based on', () => {
    const v = editor('Dear reader');
    setKind('k1')(v.state, v.dispatch, v);
    v.dispatch(v.state.tr.setSelection(TextSelection.atEnd(v.state.doc)));
    press(
      v,
      nextPassage(() => [{ id: 'k1', basedOn: 'headword' }]),
    );
    expect(shape(v)).toEqual(['passage:k1', 'passage:gloss']);
    const w = editor('Dear reader');
    setKind('k2')(w.state, w.dispatch, w);
    w.dispatch(w.state.tr.setSelection(TextSelection.atEnd(w.state.doc)));
    press(
      w,
      nextPassage(() => [{ id: 'k2', basedOn: 'draft' }]),
    );
    expect(shape(w)).toEqual(['passage:k2', 'passage:k2']);
    w.destroy();
  });

  it('Tab makes an empty paragraph the other kind, and begins one after a full one', () => {
    const v = editor();
    setKind('headword')(v.state, v.dispatch, v);
    expect(press(v, tabPassage())).toBe(true);
    expect(shape(v)).toEqual(['passage:gloss']);
    v.dispatch(v.state.tr.insertText('What it means'));
    expect(press(v, tabPassage())).toBe(true);
    expect(shape(v)).toEqual(['passage:gloss', 'passage:headword']);
    expect(kindOf(v.state)).toBe('headword');
    // Tab means nothing to an epigraph.
    setKind('epigraph')(v.state, v.dispatch, v);
    expect(press(v, tabPassage())).toBe(false);
  });

  it('Backspace at the start of an empty paragraph of a kind makes it text', () => {
    const v = editor();
    setKind('draft')(v.state, v.dispatch, v);
    expect(press(v, backOutOfPassage)).toBe(true);
    expect(shape(v)).toEqual(['paragraph']);
    const w = editor('Not empty');
    setKind('draft')(w.state, w.dispatch, w);
    w.dispatch(w.state.tr.setSelection(TextSelection.atStart(w.state.doc)));
    expect(press(w, backOutOfPassage)).toBe(false);
    w.destroy();
  });
});
