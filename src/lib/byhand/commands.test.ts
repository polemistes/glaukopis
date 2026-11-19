import type { Node } from 'prosemirror-model';
import { EditorState, TextSelection, type Command } from 'prosemirror-state';
import { describe, expect, it } from 'vitest';
import { bodySchema } from '$lib/editor/schema';
import { clearHand, handAt, handMarkAt, setHand, setHandMark } from './commands';
import { onlyInBoxes } from './rule';

const s = bodySchema;
const { paragraph, rich } = s.nodes;
const p = (words: string, hand: unknown = null) =>
  paragraph.create({ hand }, words ? s.text(words) : null);
const text = (...blocks: Node[]) => s.node('doc', null, blocks);
const at = (doc: Node, from: number, to = from) =>
  EditorState.create({
    doc,
    selection: TextSelection.create(doc, from, to),
    plugins: [onlyInBoxes()],
  });

function run(command: Command, before: EditorState): EditorState | null {
  let after: EditorState | null = null;
  const done = command(before, (tr) => (after = before.apply(tr)));
  return done ? after : null;
}

/** The words of a text with what is set by hand of each run, as `word{size=20,colour=#a02020}`. */
const marked = (doc: Node): string => {
  const out: string[] = [];
  doc.descendants((node) => {
    if (!node.isText) return true;
    const said = node.marks
      .filter((m) => ['font', 'size', 'colour'].includes(m.type.name))
      .map((m) => `${m.type.name}=${Object.values(m.attrs)[0]}`);
    out.push(said.length ? `${node.text}{${said.join(',')}}` : node.text!);
    return false;
  });
  return out.join('|');
};

// Before | [Dear all | welcome] : "Dear all" from 10 to 18, "welcome" from 20 to 27.
const doc = text(p('Before'), rich.create(null, [p('Dear all'), p('welcome')]));

describe('setting a font, a size and a colour by hand', () => {
  it('sets each of the words selected, and lays one over another', () => {
    let state = run(setHandMark('size', 20), at(doc, 10, 14))!;
    expect(marked(state.doc)).toBe('Before|Dear{size=20}| all|welcome');
    state = run(setHandMark('colour', '#A02020'), at(state.doc, 12, 18))!;
    expect(marked(state.doc)).toBe(
      'Before|De{size=20}|ar{size=20,colour=#a02020}| all{colour=#a02020}|welcome',
    );
    state = run(setHandMark('font', 'EB Garamond'), at(state.doc, 10, 27))!;
    expect(marked(state.doc)).toContain('welcome{font=EB Garamond}');
    // A size over a size takes its place.
    state = run(setHandMark('size', 14), at(state.doc, 10, 14))!;
    expect(marked(state.doc)).toContain('De{font=EB Garamond,size=14}');
  });

  it('takes one away where nothing is given, and leaves the others', () => {
    let state = run(setHandMark('size', 20), at(doc, 10, 18))!;
    state = run(setHandMark('colour', '#a02020'), at(state.doc, 10, 18))!;
    state = run(setHandMark('size', null), at(state.doc, 10, 18))!;
    expect(marked(state.doc)).toBe('Before|Dear all{colour=#a02020}|welcome');
    state = run(setHandMark('colour', ''), at(state.doc, 10, 18))!;
    expect(marked(state.doc)).toBe('Before|Dear all|welcome');
  });

  it('sets what is written next where nothing is selected', () => {
    let state = run(setHandMark('colour', '#a02020'), at(doc, 18))!;
    expect(handMarkAt(state, 'colour')).toBe('#a02020');
    state = state.apply(state.tr.insertText('!'));
    expect(marked(state.doc)).toBe('Before|Dear all|!{colour=#a02020}|welcome');
  });

  it('is not done outside a box, nor with what is no font, size or colour', () => {
    expect(run(setHandMark('size', 20), at(doc, 2, 5))).toBeNull();
    expect(run(setHandMark('size', 'large'), at(doc, 10, 14))).toBeNull();
    expect(run(setHandMark('colour', 'red'), at(doc, 10, 14))).toBeNull();
  });

  it('is kept to the box where the selection goes beyond it', () => {
    const state = run(setHandMark('size', 20), at(doc, 12, 14))!;
    const wide = run(setHandMark('colour', '#a02020'), at(state.doc, 10, 27))!;
    expect(marked(wide.doc).startsWith('Before|')).toBe(true);
  });

  it('says what the words selected have: one value, none, or that they differ', () => {
    let state = run(setHandMark('size', 20), at(doc, 10, 14))!;
    expect(handMarkAt(at(state.doc, 10, 14), 'size')).toBe(20);
    expect(handMarkAt(at(state.doc, 10, 18), 'size')).toBeUndefined();
    expect(handMarkAt(at(state.doc, 15, 18), 'size')).toBeNull();
    expect(handMarkAt(at(state.doc, 12), 'size')).toBe(20);
    expect(handMarkAt(at(state.doc, 12), 'colour')).toBeNull();
    state = run(setHandMark('font', 'Futura'), at(state.doc, 10, 27))!;
    expect(handMarkAt(at(state.doc, 10, 27), 'font')).toBe('Futura');
  });
});

describe('how paragraphs stand by hand', () => {
  const hands = (state: EditorState) => {
    const out: unknown[] = [];
    state.doc.descendants((node) => {
      if (node.type.name === 'paragraph') out.push(node.attrs.hand);
      return true;
    });
    return out;
  };

  it('is said of the paragraph the cursor is in, laid over what it says already', () => {
    let state = run(setHand({ align: 'center' }), at(doc, 12))!;
    expect(hands(state)).toEqual([null, { align: 'center' }, null]);
    state = run(setHand({ spaceAfter: '12pt' }), at(state.doc, 12))!;
    expect(hands(state)).toEqual([null, { align: 'center', spaceAfter: '12pt' }, null]);
    state = run(setHand({ align: null }), at(state.doc, 12))!;
    expect(hands(state)).toEqual([null, { spaceAfter: '12pt' }, null]);
    state = run(setHand({ spaceAfter: null }), at(state.doc, 12))!;
    expect(hands(state)).toEqual([null, null, null]);
  });

  it('is said of every paragraph selected, in the box', () => {
    const state = run(setHand({ align: 'right', lineSpacing: 1.5 }), at(doc, 12, 22))!;
    expect(hands(state)).toEqual([
      null,
      { align: 'right', lineSpacing: 1.5 },
      { align: 'right', lineSpacing: 1.5 },
    ]);
    expect(run(setHand({ align: 'right' }), at(doc, 2))).toBeNull();
  });

  it('is told for the tools: what all selected say alike, and what they say differently', () => {
    let state = run(setHand({ align: 'center', spaceAfter: '6pt' }), at(doc, 12))!;
    state = run(setHand({ align: 'right', spaceAfter: '6pt' }), at(state.doc, 22))!;
    expect(handAt(at(state.doc, 12))).toEqual({
      look: { align: 'center', spaceAfter: '6pt' },
      mixed: [],
    });
    expect(handAt(at(state.doc, 12, 22))).toEqual({
      look: { spaceAfter: '6pt' },
      mixed: ['align'],
    });
    expect(handAt(at(state.doc, 2))).toEqual({ look: {}, mixed: [] });
  });
});

describe('clearing what is set by hand', () => {
  it('takes it from what is selected, words and paragraphs, and leaves bold', () => {
    let state = run(setHandMark('size', 20), at(doc, 10, 18))!;
    state = run(setHand({ align: 'center' }), at(state.doc, 12, 22))!;
    state = state.apply(state.tr.addMark(10, 14, s.marks.strong.create()));
    const cleared = run(clearHand, at(state.doc, 10, 18))!;
    expect(marked(cleared.doc)).toBe('Before|Dear| all|welcome');
    expect(cleared.doc.child(1).child(0).attrs.hand).toBeNull();
    expect(cleared.doc.child(1).child(1).attrs.hand).toEqual({ align: 'center' });
    expect(
      cleared.doc
        .child(1)
        .child(0)
        .firstChild!.marks.map((m) => m.type.name),
    ).toEqual(['strong']);
  });

  it('with nothing selected, takes it from the paragraph the cursor is in', () => {
    let state = run(setHandMark('colour', '#a02020'), at(doc, 10, 18))!;
    state = run(setHandMark('colour', '#a02020'), at(state.doc, 20, 27))!;
    const cleared = run(clearHand, at(state.doc, 12))!;
    expect(marked(cleared.doc)).toBe('Before|Dear all|welcome{colour=#a02020}');
    expect(run(clearHand, at(doc, 2))).toBeNull();
  });
});
