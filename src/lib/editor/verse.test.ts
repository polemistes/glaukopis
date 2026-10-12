import type { Node } from 'prosemirror-model';
import { EditorState, TextSelection } from 'prosemirror-state';
import { describe, expect, it } from 'vitest';
import { bodySchema } from './schema';
import {
  firstCounted,
  markLine,
  numberFrom,
  numberLines,
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
    const d = set.find(
      (d) => d.from === offset + 1 && 'data-n' in (d.type as never as { attrs: object }).attrs,
    );
    const attrs = d ? (d.type as never as { attrs: Record<string, string> }).attrs : null;
    out.push(attrs ? attrs['data-n'] + ('data-n-set' in attrs ? '*' : '') : null);
  });
  return out;
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
    const attrsOf = (d: { type: unknown }) => (d.type as { attrs: Record<string, string> }).attrs;
    expect(found.map(attrsOf)).toEqual([
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
    expect(now.plugins[0].getState(now).find().map(attrsOf)[0]).toEqual({ 'data-numbers': 'left' });
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
    markLine({ number: ' 1094a1 ', counted: false, margin: 'ia. trim.' })(
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
    markLine({ number: '', counted: true, margin: '' })(state, (tr) => (state = state.apply(tr)));
    expect(state.doc.firstChild!.child(1).attrs).toMatchObject({
      number: null,
      counted: true,
      margin: null,
    });
  });
});
