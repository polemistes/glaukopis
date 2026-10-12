import type { Node } from 'prosemirror-model';
import { EditorState, TextSelection } from 'prosemirror-state';
import { describe, expect, it } from 'vitest';
import { bodySchema } from './schema';
import {
  firstCounted,
  giveNumber,
  markLine,
  numberFrom,
  numberLines,
  numberText,
  numbersAsked,
  passageAt,
  passageNumbers,
  relayoutNumbers,
} from './verse';

const { nodes } = bodySchema;

const p = (kind: string, words: string, attrs: Record<string, unknown> = {}) =>
  nodes.paragraph.create({ kind, ...attrs }, bodySchema.text(words));

const verse = (attrs: Record<string, unknown> = {}, lines?: Node[]) =>
  nodes.doc.create(null, [
    nodes.passage.create(
      { family: 'verse', ...attrs },
      lines ?? [
        p('speaker', 'Nurse'),
        p('line', 'If only the Argo'),
        p('line', 'had never flown'),
        p('direction', 'She weeps.'),
        p('line', 'through the dark rocks'),
        p('line', 'to Colchis'),
        p('line', 'nor the pine'),
      ],
    ),
  ]);

/** The numbers drawn in the margin, line by line: the label, with * where it was given by hand. */
function drawn(state: EditorState): (string | null)[] {
  const set = passageNumbers()
    .spec.state!.init.call(null, {} as never, state)
    .find();
  const out: (string | null)[] = [];
  state.doc.firstChild!.forEach((_line, offset) => {
    const d = set.find((d) => d.from === offset + 1 && 'data-n' in (attrsOf(d) ?? {}));
    const attrs = d ? attrsOf(d) : null;
    out.push(attrs ? attrs['data-n'] + ('data-n-set' in attrs ? '*' : '') : null);
  });
  return out;
}

/** The attributes a node decoration sets, which the decoration keeps in its type. */
const attrsOf = (d: unknown) => (d as { type: { attrs?: Record<string, string> } }).type.attrs;

/** The widgets of the numbers in the margin, in order: the label and whether it was given by hand, or `-` for the place where none is shown. */
function widgets(state: EditorState): string[] {
  const set = passageNumbers()
    .spec.state!.init.call(null, {} as never, state)
    .find();
  return set
    .filter((d) => !attrsOf(d))
    .map((d) => {
      const el = (
        d as unknown as { type: { toDOM: (view: unknown, getPos: () => number) => HTMLElement } }
      ).type.toDOM({} as never, () => d.from);
      return el.classList.contains('blank')
        ? '-'
        : el.textContent + ('given' in el.dataset ? '*' : '') + ('held' in el.dataset ? '~' : '');
    });
}

describe('the numbers of a passage', () => {
  it('are counted from the first number given, only on counted paragraphs, every so many as the passage or the layout says', () => {
    expect(drawn(EditorState.create({ doc: verse() }))).toEqual([
      null,
      null,
      null,
      null,
      null,
      null,
      null,
    ]);
    const counted = verse({ numbering: 'counted' }, [
      p('speaker', 'Nurse'),
      p('line', 'a', { number: '45' }),
      p('line', 'b'),
      p('direction', 'She weeps.'),
      p('line', 'c', { counted: false, number: '*' }),
      p('line', 'd'),
      p('line', 'e'),
      p('line', 'f'),
    ]);
    // Every fifth, as the layout has it where the passage says nothing.
    expect(drawn(EditorState.create({ doc: counted }))).toEqual([
      null,
      '45*',
      null,
      null,
      '*' + '*',
      null,
      null,
      null,
    ]);
    const every = nodes.doc.create(null, [
      nodes.passage.create({ ...counted.firstChild!.attrs, every: 2 }, counted.firstChild!.content),
    ]);
    expect(drawn(EditorState.create({ doc: every }))).toEqual([
      null,
      '45*',
      '46',
      null,
      '**',
      null,
      '48',
      null,
    ]);
    // Only what was given.
    const given = nodes.doc.create(null, [
      nodes.passage.create(
        { ...counted.firstChild!.attrs, numbering: 'given' },
        counted.firstChild!.content,
      ),
    ]);
    expect(drawn(EditorState.create({ doc: given }))).toEqual([
      null,
      '45*',
      null,
      null,
      '**',
      null,
      null,
      null,
    ]);
  });

  it('are drawn as widgets at the head of their paragraphs, with a place for one where none is shown, and none in a passage that is not numbered', () => {
    expect(widgets(EditorState.create({ doc: verse() }))).toEqual([]);
    const counted = verse({ numbering: 'counted', every: 2 }, [
      p('speaker', 'Nurse'),
      p('line', 'a', { number: '45' }),
      p('line', 'b'),
      p('line', 'c'),
    ]);
    expect(widgets(EditorState.create({ doc: counted }))).toEqual(['-', '45*', '46', '-']);
  });

  it('a kind of the writer`s own is counted as its base is, and the side is the passage`s or the layout`s', () => {
    const own = [{ id: 'k1', basedOn: 'speaker' }];
    const doc = nodes.doc.create(null, [
      nodes.passage.create({ family: 'verse', numbering: 'counted' }, [
        p('line', 'a', { number: '1' }),
        p('k1', 'Nurse'),
        p('line', 'b'),
      ]),
    ]);
    const state = EditorState.create({
      doc,
      plugins: [
        passageNumbers(
          () => own,
          () => ({ every: 1, side: 'right' }),
        ),
      ],
    });
    const found = state.plugins[0].getState(state).find();
    expect(found.map(attrsOf).filter(Boolean)).toEqual([
      { 'data-numbers': 'right' },
      { 'data-n': '1', 'data-n-set': '' },
      { 'data-n': '2' },
    ]);
    // Drawn anew when the layout changes.
    let side = 'right';
    const again = EditorState.create({
      doc,
      plugins: [
        passageNumbers(
          () => own,
          () => ({ every: 1, side: side as 'left' | 'right' }),
        ),
      ],
    });
    side = 'left';
    let now = again;
    relayoutNumbers({ state: now, dispatch: (tr) => (now = now.apply(tr)) });
    expect(now.plugins[0].getState(now).find().map(attrsOf).filter(Boolean)[0]).toEqual({
      'data-numbers': 'left',
    });
  });
});

describe('what is said of a passage and a paragraph by hand', () => {
  it('numbers the passage the cursor is in, from a number given to its first counted paragraph', () => {
    let state = EditorState.create({ doc: verse() });
    state = state.apply(state.tr.setSelection(TextSelection.create(state.doc, 30)));
    expect(passageAt(state)?.passage.attrs.family).toBe('verse');
    numberLines({ numbering: 'counted', every: null, side: 'right' })(
      state,
      (tr) => (state = state.apply(tr)),
    );
    expect(state.doc.firstChild!.attrs).toMatchObject({
      numbering: 'counted',
      every: null,
      side: 'right',
    });
    numberFrom(' 45 ')(state, (tr) => (state = state.apply(tr)));
    // The speaker is not counted: the first line is.
    expect(firstCounted(state.doc.firstChild!)?.index).toBe(1);
    expect(state.doc.firstChild!.child(1).attrs.number).toBe('45');
    expect(state.doc.firstChild!.child(0).attrs.number).toBeNull();
    numberFrom(null)(state, (tr) => (state = state.apply(tr)));
    expect(state.doc.firstChild!.child(1).attrs.number).toBeNull();
    numberLines({ numbering: 'none', every: 3, side: null })(
      state,
      (tr) => (state = state.apply(tr)),
    );
    expect(state.doc.firstChild!.attrs).toMatchObject({ numbering: 'none', every: 3, side: null });
    // Outside a passage there is nothing to number.
    const plain = EditorState.create({
      doc: nodes.doc.create(null, [p('text', 'Prose')]),
    });
    expect(numberLines({ numbering: 'counted', every: null, side: null })(plain)).toBe(false);
    expect(passageAt(plain)).toBeNull();
  });

  it('gives a paragraph a number, leaves it uncounted, and gives it words in the margin', () => {
    let state = EditorState.create({ doc: verse() });
    state = state.apply(state.tr.setSelection(TextSelection.create(state.doc, 10)));
    markLine({ number: ' 1094a1 ', counted: false, hidden: false, margin: 'ia. trim.' })(
      state,
      (tr) => (state = state.apply(tr)),
    );
    expect(state.doc.firstChild!.child(1).attrs).toMatchObject({
      kind: 'line',
      number: '1094a1',
      counted: false,
      margin: 'ia. trim.',
    });
    expect(state.doc.firstChild!.child(0).attrs.number).toBeNull();
    // Taken away again.
    markLine({ number: '', counted: true, hidden: false, margin: '' })(
      state,
      (tr) => (state = state.apply(tr)),
    );
    expect(state.doc.firstChild!.child(1).attrs).toMatchObject({
      number: null,
      counted: true,
      margin: null,
    });
  });

  it('gives the paragraph at a position a number from the field in the margin, and takes it away with an empty field', () => {
    let state = EditorState.create({ doc: verse() });
    // The second paragraph: after the passage's opening (1) and the speaker (7).
    const second = 8;
    expect(state.doc.nodeAt(second)?.textContent).toBe('If only the Argo');
    giveNumber(second, ' 45 ')(state, (tr) => (state = state.apply(tr)));
    expect(state.doc.firstChild!.child(1).attrs.number).toBe('45');
    expect(state.doc.firstChild!.child(1).attrs.counted).toBe(true);
    giveNumber(second, '')(state, (tr) => (state = state.apply(tr)));
    expect(state.doc.firstChild!.child(1).attrs.number).toBeNull();
    // Not where no paragraph begins.
    expect(giveNumber(0, '1')(state)).toBe(false);
    expect(giveNumber(9, '1')(state)).toBe(false);
  });
});

describe('numbers, stanzas and text', () => {
  it('pass over an empty line, which is the break between two stanzas', () => {
    const state = EditorState.create({
      doc: verse({ numbering: 'counted', every: 1 }, [
        p('line', 'One a', { number: '1' }),
        p('line', 'One b'),
        nodes.paragraph.create({ kind: 'line' }),
        p('line', 'Two a'),
      ]),
    });
    expect(drawn(state)).toEqual(['1*', '2', null, '3']);
  });

  it('make the paragraphs of text around the cursor a numbered passage of text', () => {
    const doc = nodes.doc.create(null, [p('text', 'One.'), p('text', 'Two.'), p('text', 'Three.')]);
    let state = EditorState.create({ doc });
    state = state.apply(state.tr.setSelection(TextSelection.create(state.doc, 7)));
    const asked = numbersAsked(state);
    expect(asked?.text).toBe(true);
    expect(asked?.passage.numbering).toBe('counted');
    expect(asked?.passage.every).toBe(1);
    expect(asked?.from).toEqual({ number: '1', here: false });
    let tr = state.tr;
    expect(numberText({ numbering: 'counted', every: 1, side: null })(state, (t) => (tr = t))).toBe(
      true,
    );
    state = state.apply(tr);
    const passage = state.doc.firstChild!;
    expect(passage.type.name).toBe('passage');
    expect(passage.attrs.family).toBe('text');
    expect(passage.childCount).toBe(3);
  });

  it('make only what is selected a passage, and nothing of what is not text', () => {
    const doc = nodes.doc.create(null, [
      p('text', 'One.'),
      p('text', 'Two.'),
      p('quote', 'Three.'),
    ]);
    let state = EditorState.create({ doc });
    state = state.apply(state.tr.setSelection(TextSelection.create(state.doc, 2, 4)));
    let tr = state.tr;
    numberText({ numbering: 'counted', every: null, side: null })(state, (t) => (tr = t));
    state = state.apply(tr);
    expect(state.doc.firstChild!.type.name).toBe('passage');
    expect(state.doc.firstChild!.childCount).toBe(1);
    // In a paragraph of a kind, outside a passage, there is no text to number.
    state = state.apply(
      state.tr.setSelection(TextSelection.create(state.doc, state.doc.content.size - 2)),
    );
    expect(numbersAsked(state)).toBeNull();
  });
});

describe('a number held back', () => {
  it('is counted, and shows nothing in the document, while the editor shows it struck through', () => {
    const state = EditorState.create({
      doc: verse({ numbering: 'counted', every: 2 }, [
        p('line', 'one', { number: '1' }),
        p('line', 'two', { hidden: true }),
        p('line', 'three'),
        p('line', 'four'),
      ]),
    });
    // The second would show 2: it is held back, and the fourth shows 4.
    expect(drawn(state)).toEqual(['1*', null, null, '4']);
    expect(widgets(state)).toContain('2~');
  });

  it('is said by the dialog, and only of a paragraph that is counted', () => {
    let state = EditorState.create({ doc: verse({ numbering: 'counted' }) });
    state = state.apply(state.tr.setSelection(TextSelection.create(state.doc, 10)));
    markLine({ number: null, counted: true, hidden: true, margin: null })(
      state,
      (tr) => (state = state.apply(tr)),
    );
    expect(state.doc.firstChild!.child(1).attrs.hidden).toBe(true);
    expect(numbersAsked(state)?.line.hidden).toBe(true);
    markLine({ number: null, counted: false, hidden: true, margin: null })(
      state,
      (tr) => (state = state.apply(tr)),
    );
    // Not counted, there is nothing to hold back: nothing is said of it, never false.
    expect(state.doc.firstChild!.child(1).attrs.hidden).toBeNull();
  });
});
