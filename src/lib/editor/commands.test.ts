import { EditorState, TextSelection } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { afterEach, describe, expect, it } from 'vitest';
import {
  indentParagraph,
  insertBreak,
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
import { editorOf, press, shapeOf, type } from './testing';

let view: EditorView | undefined;
const views: EditorView[] = [];

function editor(text = '', own: { id: string; basedOn: string }[] = []): EditorView {
  const place = document.body.appendChild(document.createElement('div'));
  view = new EditorView(place, {
    state: EditorState.create({
      schema: bodySchema,
      plugins: bodyPlugins(bodySchema, { undo: () => {}, redo: () => {}, passageKinds: () => own }),
    }),
  });
  views.push(view);
  if (text) view.dispatch(view.state.tr.insertText(text));
  return view;
}

/** An editor holding a text written out as `testing.ts` writes it. */
function at(blocks: string[], own: { id: string; basedOn: string }[] = []): EditorView {
  const v = editorOf(blocks, { passageKinds: () => own });
  views.push(v);
  return v;
}

/** The kinds of the paragraphs, in order. */
function kinds(v: EditorView): string {
  const out: string[] = [];
  v.state.doc.forEach((node) =>
    out.push(node.type.name === 'paragraph' ? (node.attrs.kind as string) : node.type.name),
  );
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
  for (const v of views.splice(0)) v.destroy();
  view = undefined;
  document.body.innerHTML = '';
});

describe('the kind of a paragraph', () => {
  it('is a label: made of every kind from every kind, nothing but the kind changes', () => {
    const v = at(['text: {n=12,m=ia.}Sing, goddess / the wrath', 'text #counted/5: of Achilles']);
    v.dispatch(
      v.state.tr.setSelection(TextSelection.create(v.state.doc, 2, v.state.doc.content.size - 1)),
    );
    const content = () => {
      const out: unknown[] = [];
      v.state.doc.forEach((p) => out.push(p.content.toJSON()));
      return JSON.stringify(out);
    };
    const before = content();
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
      'break',
      'k1',
      'text',
    ]) {
      expect(setKind(kind)(v.state, v.dispatch, v), kind).toBe(true);
      expect(kindsIn(v.state), kind).toEqual([kind]);
      expect(content(), kind).toBe(before);
      // The numbering of the second stays as it was.
      expect(v.state.doc.child(1).attrs.numbering, kind).toBe('counted');
      expect(v.state.doc.child(1).attrs.every, kind).toBe(5);
    }
    expect(v.state.doc.childCount).toBe(2);
    // The old ids are understood.
    setKind('verse')(v.state, v.dispatch, v);
    expect(kindOf(v.state)).toBe('line');
    setKind('list')(v.state, v.dispatch, v);
    expect(kindOf(v.state)).toBe('item');
  });

  it('is changed for the paragraphs that are selected, and no other', () => {
    const v = editor();
    paragraphs(v, 'One', 'Two', 'Three');
    v.dispatch(v.state.tr.setSelection(TextSelection.create(v.state.doc, 1, 7)));
    setKind('headword')(v.state, v.dispatch, v);
    expect(kinds(v)).toBe('headword headword text');
    expect(kindsIn(v.state)).toEqual(['headword']);
    v.dispatch(v.state.tr.setSelection(TextSelection.create(v.state.doc, 8, 15)));
    expect(kindsIn(v.state)).toEqual(['headword', 'text']);
    setKind('line')(v.state, v.dispatch, v);
    expect(kinds(v)).toBe('headword line line');
    expect(v.state.doc.textContent).toBe('OneTwoThree');
  });

  it('keeps the indent of an item and a line, and of a kind based on one, and takes it away otherwise', () => {
    const own = [
      { id: 'k1', basedOn: 'line' },
      { id: 'k2', basedOn: 'k1' },
    ];
    const v = at(['item>2: Point|'], own);
    const indent = () => v.state.doc.firstChild!.attrs.indent;
    setKind('numbered', own)(v.state, v.dispatch, v);
    expect(indent()).toBe(2);
    setKind('line', own)(v.state, v.dispatch, v);
    expect(indent()).toBe(2);
    setKind('k2', own)(v.state, v.dispatch, v);
    expect(indent()).toBe(2);
    setKind('quote', own)(v.state, v.dispatch, v);
    expect(indent()).toBe(0);
  });

  it('is indented by indentParagraph whatever its kind, from none to eight', () => {
    const v = at(['quote: Sing|']);
    expect(indentParagraph(-1)(v.state)).toBe(false);
    for (let i = 0; i < 12; i++) indentParagraph(1)(v.state, v.dispatch);
    expect(v.state.doc.firstChild!.attrs.indent).toBe(8);
    for (let i = 0; i < 12; i++) indentParagraph(-1)(v.state, v.dispatch);
    expect(v.state.doc.firstChild!.attrs.indent).toBe(0);
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
    expect(kinds(v)).toBe('figure');
  });

  it('is drawn as a paragraph with its kind and its settings, and read back', () => {
    const v = at(['speaker>1 #given/2 right new: {n=5,-,m=ia.,i=2}Nurse']);
    const p = v.dom.querySelector('p')!;
    expect(p.getAttribute('data-kind')).toBe('speaker');
    expect(p.getAttribute('data-indent')).toBe('1');
    expect(p.getAttribute('style')).toContain('--indent: 1');
    expect(p.getAttribute('data-numbering')).toBe('given');
    expect(p.getAttribute('data-every')).toBe('2');
    expect(p.getAttribute('data-side')).toBe('right');
    expect(p.hasAttribute('data-new')).toBe(true);
    const mark = p.querySelector('span.linemark')!;
    expect(mark.getAttribute('data-number')).toBe('5');
    expect(mark.hasAttribute('data-uncounted')).toBe(true);
    expect(mark.hasAttribute('data-hidden')).toBe(false);
    expect(mark.getAttribute('data-margin')).toBe('ia.');
    expect(mark.getAttribute('data-indent')).toBe('2');
    expect(mark.textContent).toBe('');
    // Read back from what is drawn, as when it is pasted.
    const parsed = bodySchema.nodes.paragraph.spec.parseDOM![0].getAttrs!(p) as Record<
      string,
      unknown
    >;
    expect(parsed).toEqual({
      kind: 'speaker',
      indent: 1,
      numbering: 'given',
      every: 2,
      side: 'right',
      new: true,
    });
    const markAttrs = bodySchema.nodes.linemark.spec.parseDOM![0].getAttrs!(mark);
    expect(markAttrs).toEqual({
      number: '5',
      counted: false,
      hidden: null,
      margin: 'ia.',
      indent: 2,
    });
    // Text says nothing of what it does not have.
    const w = at(['text: Plain']);
    const plain = w.dom.querySelector('p')!;
    expect([...plain.attributes].map((a) => a.name)).toEqual([]);
  });
});

describe('the keys, the same in every kind', () => {
  it('Enter parts a paragraph of prose; Shift+Enter breaks the line; Backspace joins them again', () => {
    const v = at(['text: Sing, |goddess']);
    expect(press(v, 'Enter')).toBe(true);
    expect(shapeOf(v)).toEqual(['text: Sing, ', 'text: |goddess']);
    press(v, 'Backspace');
    expect(shapeOf(v)).toEqual(['text: Sing, |goddess']);
    press(v, 'Enter', { shiftKey: true });
    expect(shapeOf(v)).toEqual(['text: Sing,  / |goddess']);
    press(v, 'Backspace');
    expect(shapeOf(v)).toEqual(['text: Sing, |goddess']);
  });

  it('Enter in verse makes a new stanza of the same kind, indent and numbering, the mark staying with its line', () => {
    const v = at(['line>1 #counted/5 new: {n=1}Sing, goddess / |{n=2,i=1}the wrath']);
    // The cursor is put after the mark of its line.
    expect(shapeOf(v)).toEqual(['line>1 #counted/5 new: {n=1}Sing, goddess / {n=2,i=1}|the wrath']);
    press(v, 'Enter');
    // The line break became the break between the stanzas; the second is no new run.
    expect(shapeOf(v)).toEqual([
      'line>1 #counted/5 new: {n=1}Sing, goddess',
      'line>1 #counted/5: {n=2,i=1}|the wrath',
    ]);
    // At the end of the last line, a new stanza, empty.
    v.dispatch(v.state.tr.setSelection(TextSelection.atEnd(v.state.doc)));
    press(v, 'Enter');
    expect(shapeOf(v)[2]).toBe('line>1 #counted/5: |');
    // Enter on it again: the paragraph is text, which is how one leaves the verse.
    press(v, 'Enter');
    expect(shapeOf(v)[2]).toBe('text #counted/5: |');
    // And on an empty paragraph of text, Enter parts it as ever.
    press(v, 'Enter');
    expect(shapeOf(v)).toHaveLength(4);
  });

  it('Shift+Enter at the start of a line leaves its mark with it', () => {
    const v = at(['line: Sing / {n=5}|goddess']);
    press(v, 'Enter', { shiftKey: true });
    expect(shapeOf(v)).toEqual(['line: Sing /  / {n=5}|goddess']);
  });

  it('Backspace at the start of a line takes the break and the line`s mark; at the start of a paragraph joins it, the first`s kind holding', () => {
    const v = at(['line: Sing / {n=5}|goddess', 'quote: the wrath']);
    press(v, 'Backspace');
    expect(shapeOf(v)).toEqual(['line: Sing|goddess', 'quote: the wrath']);
    const w = at(['quote: Sing', 'line #counted: {n=5}|goddess']);
    press(w, 'Backspace');
    expect(shapeOf(w)).toEqual(['quote: Sing|goddess']);
    const x = at(['item>1: One', 'text: |Two']);
    press(x, 'Backspace');
    expect(shapeOf(x)).toEqual(['item>1: One|Two']);
  });

  it('Enter in a list makes an item with its indent, and on an empty item leaves the list', () => {
    const v = at(['item>2: Point|']);
    press(v, 'Enter');
    expect(shapeOf(v)).toEqual(['item>2: Point', 'item>2: |']);
    press(v, 'Enter');
    expect(shapeOf(v)).toEqual(['item>2: Point', 'text: |']);
  });

  it('Enter on an empty paragraph of any kind makes it text, keeping its line marks', () => {
    for (const kind of ['quote', 'speaker', 'scene', 'code', 'k1']) {
      const v = at([`${kind}: {n=4}|`], [{ id: 'k1', basedOn: 'dialogue' }]);
      press(v, 'Enter');
      expect(shapeOf(v), kind).toEqual(['text: {n=4}|']);
    }
  });

  it('Tab indents a line of verse by its mark, and any other paragraph as a whole', () => {
    const v = at(['line: Sing / |goddess / the wrath']);
    press(v, 'Tab');
    expect(shapeOf(v)).toEqual(['line: Sing / {i=1}|goddess / the wrath']);
    press(v, 'Tab');
    expect(shapeOf(v)).toEqual(['line: Sing / {i=2}|goddess / the wrath']);
    press(v, 'Tab', { shiftKey: true });
    press(v, 'Tab', { shiftKey: true });
    // The mark goes when it says nothing more.
    expect(shapeOf(v)).toEqual(['line: Sing / |goddess / the wrath']);
    // A mark that says more stays.
    const w = at(['line: {n=7}|Sing']);
    press(w, 'Tab');
    press(w, 'Tab', { shiftKey: true });
    expect(shapeOf(w)).toEqual(['line: {n=7}|Sing']);
    // A kind based on a line does the same.
    const k = at(['k1: |Sing'], [{ id: 'k1', basedOn: 'line' }]);
    press(k, 'Tab');
    expect(shapeOf(k)).toEqual(['k1: {i=1}|Sing']);
    // Prose and a list: the paragraph.
    const x = at(['text: |Sing', 'item: Point']);
    press(x, 'Tab');
    expect(shapeOf(x)).toEqual(['text>1: |Sing', 'item: Point']);
    x.dispatch(x.state.tr.setSelection(TextSelection.atEnd(x.state.doc)));
    for (let i = 0; i < 10; i++) press(x, 'Tab');
    expect(shapeOf(x)[1]).toBe('item>8: Point|');
    // Shift+Tab with no indent to take away does nothing.
    const y = at(['text: |Sing']);
    press(y, 'Tab', { shiftKey: true });
    expect(shapeOf(y)).toEqual(['text: |Sing']);
  });

  it('Tab over lines of verse selected indents each of them', () => {
    const v = at(['line: Sing / goddess / the wrath']);
    const start = 1;
    const end = v.state.doc.content.size - 1;
    v.dispatch(v.state.tr.setSelection(TextSelection.create(v.state.doc, start, end)));
    press(v, 'Tab');
    expect(shapeOf(v)).toEqual(['line: {i=1}Sing / {i=1}goddess / {i=1}the wrath']);
  });

  it('keeps line marks at the start of their lines: what is typed goes after, and a mark that is joined into a line goes', () => {
    const v = at(['line: {n=5}|']);
    type(v, 'Sing');
    expect(shapeOf(v)).toEqual(['line: {n=5}Sing|']);
    // Delete at the end of a paragraph joins the next to it: the mark of its first line no longer begins one.
    const w = at(['line: Sing|', 'line: {n=5}goddess']);
    press(w, 'Delete');
    expect(shapeOf(w)).toEqual(['line: Sing|goddess']);
  });

  it('turns "> ", "- " and "1. " at the start of a paragraph of text into its kind, and "7. " gives the number', () => {
    const v = at(['text: |']);
    type(v, '7. Seventh');
    expect(shapeOf(v)).toEqual(['numbered: {n=7}Seventh|']);
    const w = at(['text: |']);
    type(w, '> Sing');
    expect(shapeOf(w)).toEqual(['quote: Sing|']);
  });
});

describe('a break of the page or of the column', () => {
  it('stands after the paragraph, or in place of an empty one, and the writing goes on after it', () => {
    const v = at(['text: Sing|']);
    expect(insertBreak('page')(v.state, v.dispatch)).toBe(true);
    expect(shapeOf(v)).toEqual(['text: Sing', 'pagebreak', 'text: |']);
    insertBreak('column')(v.state, v.dispatch);
    expect(shapeOf(v)).toEqual(['text: Sing', 'pagebreak', 'pagebreak column', 'text: |']);
    const div = v.dom.querySelectorAll('div.pagebreak')[1];
    expect(div.getAttribute('data-what')).toBe('column');
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
    expect(kinds(v)).toBe('text');
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
