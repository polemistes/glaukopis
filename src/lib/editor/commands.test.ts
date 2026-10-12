import { EditorState, TextSelection } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { afterEach, describe, expect, it } from 'vitest';
import {
  indentParagraph,
  kindMarkOf,
  kindOf,
  kindsIn,
  languageOf,
  setKind,
  setLanguage,
  splitCitation,
  toggleKind,
} from './commands';
import { bodyPlugins } from './plugins';
import { bodySchema } from './schema';
import { backOutOfKind, enterKind, tabKind, untabKind } from './script';

let view: EditorView | undefined;

function editor(text = '', own: { id: string; basedOn: string }[] = []): EditorView {
  const place = document.body.appendChild(document.createElement('div'));
  view = new EditorView(place, {
    state: EditorState.create({
      schema: bodySchema,
      plugins: bodyPlugins(bodySchema, { undo: () => {}, redo: () => {}, passageKinds: () => own }),
    }),
  });
  if (text) view.dispatch(view.state.tr.insertText(text));
  return view;
}

/** The shape of the text: a passage as its family with the kinds of its paragraphs in brackets, a paragraph as its kind. */
function shape(v: EditorView): string {
  const out: string[] = [];
  v.state.doc.forEach((node) => {
    if (node.type.name === 'passage') {
      const kinds: string[] = [];
      node.forEach((p) => kinds.push(p.attrs.kind as string));
      out.push(`${node.attrs.family}[${kinds.join(' ')}]`);
    } else if (node.type.name === 'paragraph') out.push(node.attrs.kind as string);
    else out.push(node.type.name);
  });
  return out.join(' ');
}

/** Types words, then Enter, so that the text has paragraphs. */
function paragraphs(v: EditorView, ...words: string[]) {
  words.forEach((w, i) => {
    if (i) v.dispatch(v.state.tr.split(v.state.selection.from));
    v.dispatch(v.state.tr.insertText(w));
  });
}

afterEach(() => {
  view?.destroy();
  view = undefined;
  document.body.innerHTML = '';
});

describe('the kind of a paragraph', () => {
  it('is made of every kind from every kind, the text stays, and the passage follows', () => {
    const v = editor('Sing, goddess');
    expect(kindOf(v.state)).toBe('text');
    for (const kind of [
      'epigraph',
      'quote',
      'attribution',
      'item',
      'headword',
      'scene',
      'line',
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
    expect(shape(v)).toBe('text');
    setKind('line')(v.state, v.dispatch, v);
    expect(shape(v)).toBe('verse[line]');
    setKind('quote')(v.state, v.dispatch, v);
    expect(shape(v)).toBe('quotation[quote]');
    // The old ids are understood.
    setKind('verse')(v.state, v.dispatch, v);
    expect(kindOf(v.state)).toBe('line');
    setKind('list')(v.state, v.dispatch, v);
    expect(shape(v)).toBe('list[item]');
  });

  it('a kind of the writer`s own forms a passage of its base`s family, or of its own', () => {
    const own = [
      { id: 'k1', basedOn: 'epigraph' },
      { id: 'letter', basedOn: 'text' },
    ];
    const v = editor('Dear reader', own);
    setKind('k1', own)(v.state, v.dispatch, v);
    expect(shape(v)).toBe('quotation[k1]');
    setKind('letter', own)(v.state, v.dispatch, v);
    expect(shape(v)).toBe('letter[letter]');
    expect(kindOf(v.state)).toBe('letter');
  });

  it('is changed for the paragraphs that are selected, and no other', () => {
    const v = editor();
    paragraphs(v, 'One', 'Two', 'Three');
    // The first two.
    v.dispatch(v.state.tr.setSelection(TextSelection.create(v.state.doc, 1, 7)));
    setKind('headword')(v.state, v.dispatch, v);
    expect(shape(v)).toBe('glossary[headword headword] text');
    expect(kindsIn(v.state)).toEqual(['headword']);
    // The second and the third, over the edge of the passage.
    v.dispatch(v.state.tr.setSelection(TextSelection.create(v.state.doc, 8, 15)));
    expect(kindsIn(v.state)).toEqual(['headword', 'text']);
    setKind('line')(v.state, v.dispatch, v);
    expect(shape(v)).toBe('glossary[headword] verse[line line]');
    expect(v.state.doc.textContent).toBe('OneTwoThree');
    setKind('text')(v.state, v.dispatch, v);
    expect(shape(v)).toBe('glossary[headword] text text');
  });

  it('a paragraph set to text in the middle of a verse splits it, and set back joins it again', () => {
    const v = editor();
    paragraphs(v, 'a', 'b', 'c');
    v.dispatch(v.state.tr.setSelection(TextSelection.create(v.state.doc, 1, 8)));
    setKind('line')(v.state, v.dispatch, v);
    expect(shape(v)).toBe('verse[line line line]');
    v.dispatch(v.state.tr.setSelection(TextSelection.create(v.state.doc, 5)));
    expect(kindOf(v.state)).toBe('line');
    setKind('text')(v.state, v.dispatch, v);
    expect(shape(v)).toBe('verse[line] text verse[line]');
    expect(v.state.selection.$from.parent.textContent).toBe('b');
    setKind('line')(v.state, v.dispatch, v);
    expect(shape(v)).toBe('verse[line line line]');
  });

  it('keeps a number, the margin words and the uncounted state, and the indent only where the kind is indented', () => {
    const v = editor('Nurse');
    setKind('line')(v.state, v.dispatch, v);
    indentParagraph(1)(v.state, v.dispatch);
    indentParagraph(1)(v.state, v.dispatch);
    const at = () => v.state.doc.firstChild!.firstChild!;
    v.dispatch(
      v.state.tr.setNodeMarkup(1, undefined, {
        ...at().attrs,
        number: '12',
        counted: false,
        margin: 'ia.',
      }),
    );
    expect(at().attrs).toMatchObject({ indent: 2, number: '12', counted: false, margin: 'ia.' });
    setKind('item')(v.state, v.dispatch, v);
    expect(at().attrs).toMatchObject({ kind: 'item', indent: 2, number: '12', margin: 'ia.' });
    setKind('speaker')(v.state, v.dispatch, v);
    expect(at().attrs).toMatchObject({ kind: 'speaker', indent: 0, number: '12', counted: false });
    // Not indented past eight, nor below nought; nothing to a kind that is not indented.
    expect(indentParagraph(-1)(v.state)).toBe(false);
    setKind('line')(v.state, v.dispatch, v);
    for (let i = 0; i < 12; i++) indentParagraph(1)(v.state, v.dispatch);
    expect(at().attrs.indent).toBe(8);
    for (let i = 0; i < 12; i++) indentParagraph(-1)(v.state, v.dispatch);
    expect(at().attrs.indent).toBe(0);
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
    expect(setKind('epigraph')(v.state, v.dispatch, v)).toBe(false);
    expect(shape(v)).toBe('figure');
  });

  it('is drawn as a paragraph with its kind, in a passage of its family', () => {
    const v = editor('Nurse');
    setKind('speaker')(v.state, v.dispatch, v);
    const passage = v.dom.querySelector('div.passage')!;
    expect(passage.getAttribute('data-family')).toBe('verse');
    expect(passage.hasAttribute('data-numbering')).toBe(false);
    const p = passage.querySelector('p')!;
    expect(p.getAttribute('data-kind')).toBe('speaker');
    setKind('text')(v.state, v.dispatch, v);
    expect(v.dom.querySelector('div.passage')).toBeNull();
    expect(v.dom.querySelector('p')!.hasAttribute('data-kind')).toBe(false);
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
    expect(shape(v)).toBe('text');
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

describe('the language of a passage', () => {
  it('runs over paragraphs, goes with a kind of words, and is taken off', () => {
    const v = editor('Er sagte');
    v.dispatch(v.state.tr.split(v.state.selection.to).insertText('Weltschmerz'));
    const end = v.state.doc.content.size - 1;
    v.dispatch(v.state.tr.setSelection(TextSelection.create(v.state.doc, 4, end)));
    expect(languageOf(v.state)).toBeNull();
    expect(setLanguage('de')(v.state, v.dispatch, v)).toBe(true);
    expect(languageOf(v.state)).toBe('de');
    // In each paragraph, as far as the selection runs.
    const second = v.state.doc.child(1).firstChild!;
    expect(second.marks.map((m) => [m.type.name, m.attrs.tag])).toEqual([['lang', 'de']]);
    expect(v.state.doc.child(0).child(1).text).toBe('sagte');
    // A kind of words does not take its place, nor it a kind.
    toggleKind('term')(v.state, v.dispatch, v);
    expect(languageOf(v.state)).toBe('de');
    expect(kindMarkOf(v.state)).toEqual({ name: 'term', lang: '' });
    setLanguage('grc')(v.state, v.dispatch, v);
    expect(languageOf(v.state)).toBe('grc');
    expect(kindMarkOf(v.state)).toEqual({ name: 'term', lang: '' });
    setLanguage(null)(v.state, v.dispatch, v);
    expect(languageOf(v.state)).toBeNull();
    expect(kindMarkOf(v.state)).toEqual({ name: 'term', lang: '' });
  });

  it('is drawn as a span with the language, inside the kind of words, named on hover', () => {
    const v = editor('ἄνδρα');
    v.dispatch(v.state.tr.setSelection(TextSelection.create(v.state.doc, 1, 6)));
    toggleKind('foreign', 'el')(v.state, v.dispatch, v);
    setLanguage('grc')(v.state, v.dispatch, v);
    const span = v.dom.querySelector('span.lang')!;
    expect(span.getAttribute('lang')).toBe('grc');
    expect(span.getAttribute('title')).toBeTruthy();
    // The nearest language is that of the passage.
    expect(span.closest('[lang]')).toBe(span);
    expect(span.parentElement!.closest('.kind')).not.toBeNull();
  });

  it('with nothing selected is what is typed next', () => {
    const v = editor();
    setLanguage('la')(v.state, v.dispatch, v);
    v.dispatch(v.state.tr.insertText('arma'));
    expect(v.state.doc.firstChild!.firstChild!.marks[0].attrs).toEqual({ tag: 'la' });
  });
});

describe('the keys in a paragraph of a kind', () => {
  const press = (v: EditorView, command: ReturnType<typeof enterKind>) =>
    command(v.state, v.dispatch, v);
  const end = (v: EditorView) =>
    v.dispatch(v.state.tr.setSelection(TextSelection.atEnd(v.state.doc)));

  it('Enter at the end begins the kind that follows, within the passage, and text leaves it', () => {
    const v = editor('Sing, goddess');
    setKind('epigraph')(v.state, v.dispatch, v);
    end(v);
    expect(press(v, enterKind())).toBe(true);
    expect(shape(v)).toBe('quotation[epigraph attribution]');
    expect(kindOf(v.state)).toBe('attribution');
    v.dispatch(v.state.tr.insertText('Homer'));
    expect(press(v, enterKind())).toBe(true);
    expect(shape(v)).toBe('quotation[epigraph attribution] text');
    expect(kindOf(v.state)).toBe('text');
    // In a text paragraph the base keys do it.
    expect(press(v, enterKind())).toBe(false);
  });

  it('Enter within a paragraph splits it, the part after of the same kind without what was said of the whole', () => {
    const v = editor('Nor had the heroes rowed');
    setKind('line')(v.state, v.dispatch, v);
    v.dispatch(
      v.state.tr.setNodeMarkup(1, undefined, {
        ...v.state.doc.firstChild!.firstChild!.attrs,
        number: '1094a1',
        margin: 'ia.',
        indent: 1,
      }),
    );
    v.dispatch(v.state.tr.setSelection(TextSelection.create(v.state.doc, 20)));
    expect(press(v, enterKind())).toBe(true);
    expect(shape(v)).toBe('verse[line line]');
    const verse = v.state.doc.firstChild!;
    expect(verse.child(0).attrs).toMatchObject({ number: '1094a1', margin: 'ia.', indent: 1 });
    expect(verse.child(1).attrs).toMatchObject({ number: null, margin: null, indent: 1 });
    expect(verse.child(1).textContent).toBe(' rowed');
  });

  it('Enter on an empty last paragraph of a passage makes it text, leaving the passage', () => {
    const v = editor('a');
    setKind('line')(v.state, v.dispatch, v);
    end(v);
    press(v, enterKind());
    expect(shape(v)).toBe('verse[line line]');
    press(v, enterKind());
    expect(shape(v)).toBe('verse[line] text');
    expect(kindOf(v.state)).toBe('text');
    // A speaker is followed by a line, a direction by a line.
    const w = editor('Nurse');
    setKind('speaker')(w.state, w.dispatch, w);
    end(w);
    press(w, enterKind());
    expect(shape(w)).toBe('verse[speaker line]');
    w.destroy();
  });

  it('Enter after code is code, after an item an item with its indent, and after a part of a script the part that follows', () => {
    const v = editor('let x');
    setKind('code')(v.state, v.dispatch, v);
    end(v);
    press(v, enterKind());
    expect(shape(v)).toBe('code[code code]');
    const w = editor('MARY');
    setKind('character')(w.state, w.dispatch, w);
    end(w);
    press(w, enterKind());
    expect(shape(w)).toBe('script[character dialogue]');
    w.destroy();
    const u = editor('First');
    setKind('item')(u.state, u.dispatch, u);
    indentParagraph(1)(u.state, u.dispatch);
    end(u);
    press(u, enterKind());
    expect(shape(u)).toBe('list[item item]');
    expect(u.state.doc.firstChild!.child(1).attrs.indent).toBe(1);
    u.destroy();
  });

  it('a kind of the writer`s own is followed as the kind it is based on', () => {
    const own = [
      { id: 'k1', basedOn: 'headword' },
      { id: 'k2', basedOn: 'draft' },
    ];
    const v = editor('Dear reader', own);
    setKind('k1', own)(v.state, v.dispatch, v);
    end(v);
    press(
      v,
      enterKind(() => own),
    );
    expect(shape(v)).toBe('glossary[k1 gloss]');
    const w = editor('Dear reader', own);
    setKind('k2', own)(w.state, w.dispatch, w);
    end(w);
    press(
      w,
      enterKind(() => own),
    );
    expect(shape(w)).toBe('draft[k2 k2]');
    w.destroy();
  });

  it('Tab makes an empty paragraph the other kind, begins one after a full one, and indents a line or an item', () => {
    const v = editor();
    setKind('headword')(v.state, v.dispatch, v);
    expect(press(v, tabKind())).toBe(true);
    expect(shape(v)).toBe('glossary[gloss]');
    v.dispatch(v.state.tr.insertText('What it means'));
    expect(press(v, tabKind())).toBe(true);
    expect(shape(v)).toBe('glossary[gloss headword]');
    expect(kindOf(v.state)).toBe('headword');
    // Tab means nothing to an epigraph.
    setKind('epigraph')(v.state, v.dispatch, v);
    expect(press(v, tabKind())).toBe(false);
    // A line is indented, and back.
    setKind('line')(v.state, v.dispatch, v);
    expect(press(v, tabKind())).toBe(true);
    expect(v.state.selection.$from.parent.attrs.indent).toBe(1);
    expect(press(v, untabKind())).toBe(true);
    expect(v.state.selection.$from.parent.attrs.indent).toBe(0);
    expect(press(v, untabKind())).toBe(true);
    expect(v.state.selection.$from.parent.attrs.indent).toBe(0);
  });

  it('Backspace at the start of an empty paragraph of a kind makes it text, as at the start of the first of a passage', () => {
    const v = editor();
    setKind('draft')(v.state, v.dispatch, v);
    expect(press(v, backOutOfKind())).toBe(true);
    expect(shape(v)).toBe('text');
    const w = editor();
    paragraphs(w, 'Not empty', 'Second');
    w.dispatch(w.state.tr.setSelection(TextSelection.create(w.state.doc, 1, 14)));
    setKind('draft')(w.state, w.dispatch, w);
    expect(shape(w)).toBe('draft[draft draft]');
    // Within the passage, with words before: the base keys join.
    w.dispatch(w.state.tr.setSelection(TextSelection.create(w.state.doc, 13)));
    expect(press(w, backOutOfKind())).toBe(false);
    // At the start of the first paragraph: text.
    w.dispatch(w.state.tr.setSelection(TextSelection.atStart(w.state.doc)));
    expect(press(w, backOutOfKind())).toBe(true);
    expect(shape(w)).toBe('text draft[draft]');
    w.destroy();
  });
});

describe('the words of a citation parted from it', () => {
  it('makes the words text of the line and each work a citation of its own, parted by semicolons where no words stand between', () => {
    const v = editor('Not all agree. ');
    const items = [
      { id: 'ussher', locator: 'xxxv', prefix: "For those who accept Lowe's conclusions see" },
      { id: 'west', locator: '55' },
      { id: 'olson', suffix: 'attributes the view to Lowe', suppressAuthor: true },
    ];
    v.dispatch(
      v.state.tr.replaceSelectionWith(bodySchema.nodes.citation.create({ items, mode: 'normal' })),
    );
    const pos = v.state.selection.from - 1;
    expect(splitCitation(pos)(v.state, v.dispatch)).toBe(true);
    const pieces: string[] = [];
    v.state.doc.firstChild!.forEach((n) =>
      pieces.push(
        n.type.name === 'citation'
          ? `[${(n.attrs.items as { id: string; locator?: string }[]).map((i) => i.id + (i.locator ? ' ' + i.locator : '')).join(';')}]`
          : n.text!,
      ),
    );
    expect(pieces).toEqual([
      "Not all agree. For those who accept Lowe's conclusions see ",
      '[ussher xxxv]',
      '; ',
      '[west 55]',
      '; ',
      '[olson]',
      ' attributes the view to Lowe',
    ]);
    const olson = v.state.doc.firstChild!.child(5);
    expect(olson.attrs.items[0]).toEqual({ id: 'olson', suppressAuthor: true });
    // A citation of one work with no words about it has nothing to part.
    const one = editor('');
    one.dispatch(
      one.state.tr.replaceSelectionWith(
        bodySchema.nodes.citation.create({ items: [{ id: 'west' }], mode: 'normal' }),
      ),
    );
    expect(splitCitation(one.state.selection.from - 1)(one.state)).toBe(false);
  });
});
