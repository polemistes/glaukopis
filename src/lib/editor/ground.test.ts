import { DOMParser, type Node } from 'prosemirror-model';
import { EditorState, TextSelection, type Command } from 'prosemirror-state';
import { describe, expect, it } from 'vitest';
import { onlyInBoxes } from '$lib/byhand/rule';
import { EditorView } from 'prosemirror-view';
import { groundAt, GROUNDS, lastGround, putGround, setGround, toggleGround } from './ground';
import { bodySchema, MARKER } from './schema';

const s = bodySchema;
const { paragraph, rich } = s.nodes;
const p = (...content: Node[]) => paragraph.create(null, content);
const text = (...blocks: Node[]) => s.node('doc', null, blocks);
const old = s.marks.kind.create({ name: 'highlight', lang: '' });
const title = s.marks.kind.create({ name: 'title', lang: '' });

function state(doc: Node, from: number, to = from): EditorState {
  return EditorState.create({
    doc,
    selection: TextSelection.create(doc, from, to),
    plugins: [onlyInBoxes()],
  });
}

function run(command: Command, before: EditorState): EditorState | null {
  let after: EditorState | null = null;
  const done = command(before, (tr) => (after = before.apply(tr)));
  return done ? after : null;
}

/** The words of a text, each run with the ground it has in brackets after it. */
const grounds = (doc: Node): string => {
  const out: string[] = [];
  doc.descendants((node) => {
    if (!node.isText) return true;
    const ground = node.marks.find((m) => m.type.name === 'ground')?.attrs.value;
    const kind = node.marks.find((m) => m.type.name === 'kind')?.attrs.name;
    out.push(`${node.text}${ground ? `(${ground})` : ''}${kind ? `{${kind}}` : ''}`);
    return false;
  });
  return out.join('|');
};

describe('the ground of words', () => {
  it('is set of the words selected, in a text that is no sheet of rich text, and stays there', () => {
    const before = state(text(p(s.text('alpha beta gamma'))), 7, 11);
    const after = run(setGround('#A5D8FF'), before)!;
    expect(grounds(after.doc)).toBe('alpha |beta(#a5d8ff)| gamma');
    expect(groundAt(after)).toBe('#a5d8ff');
    // Written on: the rule that keeps the look by hand to a sheet leaves it.
    const on = after.apply(after.tr.insertText('!', 1));
    expect(grounds(on.doc)).toBe('!alpha |beta(#a5d8ff)| gamma');
  });

  it('is set on a sheet of rich text as anywhere', () => {
    const before = state(text(rich.create(null, p(s.text('alpha beta')))), 2, 7);
    expect(grounds(run(setGround(MARKER), before)!.doc)).toBe(`alpha(${MARKER})| beta`);
  });

  it('is one colour at a time: another takes the place of the first, and none takes it away', () => {
    const marked = run(setGround(MARKER), state(text(p(s.text('alpha beta'))), 1, 11))!;
    const green = run(setGround('#b7eb8f'), state(marked.doc, 1, 6))!;
    expect(grounds(green.doc)).toBe(`alpha(#b7eb8f)| beta(${MARKER})`);
    expect(groundAt(state(green.doc, 1, 11))).toBeUndefined();
    const none = run(setGround(null), state(green.doc, 1, 11))!;
    expect(grounds(none.doc)).toBe('alpha beta');
    expect(groundAt(state(none.doc, 1, 11))).toBeNull();
  });

  it('is set of what is written next where nothing is selected', () => {
    const before = state(text(p(s.text('alpha'))), 6);
    const after = run(setGround(MARKER), before)!;
    expect(groundAt(after)).toBe(MARKER);
    const written = after.apply(after.tr.insertText(' beta'));
    expect(grounds(written.doc)).toBe(`alpha| beta(${MARKER})`);
  });

  it('is no colour that is none', () => {
    const before = state(text(p(s.text('alpha'))), 1, 6);
    expect(run(setGround('yellow'), before)).toBeNull();
    expect(run(setGround('#12345'), before)).toBeNull();
  });

  it('takes the place of the highlight there was before, a kind of words, and leaves the other kinds', () => {
    const doc = text(p(s.text('alpha ', [old]), s.text('beta', [title]), s.text(' gamma', [old])));
    // The old highlight counts as the yellow, for the menu to show.
    expect(groundAt(state(doc, 1, 6))).toBe(MARKER);
    const after = run(setGround('#fcc2d7'), state(doc, 1, 11))!;
    expect(grounds(after.doc)).toBe('alpha (#fcc2d7)|beta(#fcc2d7){title}| gamma{highlight}');
    const none = run(setGround(null), state(doc, 1, 17))!;
    expect(grounds(none.doc)).toBe('alpha |beta{title}| gamma');
  });

  it('is turned on in the colour last chosen and off again, as bold is', () => {
    const view = new EditorView(document.createElement('div'), {
      state: state(text(p(s.text('alpha beta gamma'))), 7, 11),
    });
    // The yellow, until another colour is chosen from the tools.
    expect(lastGround()).toBe(MARKER);
    toggleGround(view.state, view.dispatch, view);
    expect(grounds(view.state.doc)).toBe(`alpha |beta(${MARKER})| gamma`);
    toggleGround(view.state, view.dispatch, view);
    expect(grounds(view.state.doc)).toBe('alpha beta gamma');
    putGround(view, '#A5D8FF');
    expect(grounds(view.state.doc)).toBe('alpha |beta(#a5d8ff)| gamma');
    expect(lastGround()).toBe('#a5d8ff');
    putGround(view, null);
    expect(lastGround()).toBe('#a5d8ff');
    toggleGround(view.state, view.dispatch, view);
    expect(grounds(view.state.doc)).toBe('alpha |beta(#a5d8ff)| gamma');
    // Where only some of what is selected has one, it is taken away from all of it.
    view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, 1, 17)));
    toggleGround(view.state, view.dispatch, view);
    expect(grounds(view.state.doc)).toBe('alpha beta gamma');
    view.destroy();
  });

  it('is offered in the colours of marker pens, the yellow first', () => {
    expect(GROUNDS[0]).toEqual(['yellow', MARKER]);
    expect(new Set(GROUNDS.map(([, value]) => value)).size).toBe(GROUNDS.length);
    for (const [, value] of GROUNDS) expect(value).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('is read from what another program has marked, as the yellow', () => {
    const holder = document.createElement('div');
    holder.innerHTML = '<p>alpha <mark>beta</mark> <mark data-ground="#a5d8ff">gamma</mark></p>';
    const parsed = DOMParser.fromSchema(s).parse(holder);
    expect(grounds(parsed)).toBe(`alpha |beta(${MARKER})| |gamma(#a5d8ff)`);
  });
});
