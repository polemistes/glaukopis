import { Node } from 'prosemirror-model';
import { EditorState, TextSelection } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { withinLines } from './changes';
import { redrawShape } from './numbers';
import { bodySchema } from './schema';
import { editorOf, shapeOf, text, type } from './testing';

const views: EditorView[] = [];

function at(blocks: string[], own: { id: string; basedOn: string; name?: string }[] = []) {
  const v = editorOf(blocks, {
    passageKinds: () => own,
    numbers: () => ({ every: 1, side: 'left' }),
  });
  views.push(v);
  return v;
}

afterEach(() => {
  for (const v of views.splice(0)) v.destroy();
  document.body.innerHTML = '';
});

/**
 * What is drawn over a text, paragraph by paragraph: the kind of its run,
 * whether it begins it, whether it is current, the label, the numbers in the
 * margin and the words there.
 */
function drawn(v: EditorView): string[] {
  return [...v.dom.querySelectorAll(':scope > p')].map((p) => {
    const parts = [
      p.getAttribute('data-run') ?? '-',
      p.hasAttribute('data-run-first') ? 'first' : '',
      p.hasAttribute('data-current') ? 'current' : '',
      p.querySelector('.run-label')?.textContent ?? '',
      p.getAttribute('data-n') ?? '',
      [...p.querySelectorAll('.line-number')]
        .map((el) => (el as HTMLElement).dataset.label ?? '#')
        .join(' '),
      [...p.querySelectorAll('.line-margin')].map((el) => el.textContent).join(' '),
    ];
    return parts.join('|');
  });
}

/** What a new editor of the same text, with the same selection, draws. */
function drawnAnew(v: EditorView, own: { id: string; basedOn: string; name?: string }[] = []) {
  const fresh = at(shapeOf(v), own);
  const { anchor, head } = v.state.selection;
  fresh.dispatch(fresh.state.tr.setSelection(TextSelection.create(fresh.state.doc, anchor, head)));
  return drawn(fresh);
}

const VERSE = [
  'text: Sing, goddess, the wrath|',
  'line #counted: {n=1,m=the proem}Of Peleus’ son / Achilles, / the accursed wrath',
  'line #counted: which brought / countless sorrows',
  'quote: upon the Achaeans',
  'quote: and sent down to Hades',
  'text: many valiant souls',
];

/** How many times the whole text is gone through while `f` runs. */
function walks(v: EditorView, f: () => void): number {
  const spy = vi.spyOn(Node.prototype, 'descendants');
  f();
  const n = spy.mock.calls.filter((_, i) => spy.mock.contexts[i] === v.state.doc).length;
  spy.mockRestore();
  return n;
}

describe('what is drawn over a text, on every change', () => {
  it('goes through the text for no keystroke in a line, and for no move of the cursor', () => {
    const v = at(VERSE);
    // A keystroke: what is drawn moves with the text. Two plugins of the
    // figures go over the blocks, and not into the lines: the ids of
    // figures, and where they stand. Before, the line marks, the numbers
    // and the brackets went through all of it as well.
    expect(walks(v, () => type(v, 'x'))).toBeLessThanOrEqual(2);
    const head = v.state.selection.head;
    expect(
      walks(v, () => v.dispatch(v.state.tr.setSelection(TextSelection.create(v.state.doc, 3)))),
    ).toBe(0);
    v.dispatch(v.state.tr.setSelection(TextSelection.create(v.state.doc, head)));
    // A paragraph split: drawn anew.
    expect(walks(v, () => v.dispatch(v.state.tr.split(v.state.selection.head)))).toBeGreaterThan(2);
  });

  it('is what a new editor of the same text draws, after writing and moving of every kind', () => {
    const v = at(VERSE);
    const same = () => expect(drawn(v)).toEqual(drawnAnew(v));
    expect(drawn(v)[1]).toBe('line|first||Verse · numbered|1|1 2 3|the proem');
    expect(drawn(v)[2]).toBe('line||||4|4 5|');
    same();
    type(v, ' and more');
    same();
    // Into a verse, in a line that has words.
    const verse = text(...VERSE).doc.child(0).nodeSize + 6;
    v.dispatch(v.state.tr.setSelection(TextSelection.create(v.state.doc, verse)));
    same();
    type(v, 'ever ');
    same();
    // Out of the verse and into the quotation: another run is current.
    const quote =
      v.state.doc.child(0).nodeSize +
      v.state.doc.child(1).nodeSize +
      v.state.doc.child(2).nodeSize +
      3;
    v.dispatch(v.state.tr.setSelection(TextSelection.create(v.state.doc, quote)));
    same();
    type(v, 'x');
    same();
    // A line of the verse emptied, and written in again: its number goes, and comes back.
    const second = v.state.doc.child(0).nodeSize + v.state.doc.child(1).nodeSize + 1;
    const line = v.state.doc.child(2).child(0);
    v.dispatch(v.state.tr.delete(second, second + line.nodeSize));
    expect(drawn(v)[2]).toMatch(/\|# 4\|$/);
    same();
    v.dispatch(v.state.tr.insertText('again', second));
    same();
    // A line break, a line mark taken out, and a paragraph given another kind.
    v.dispatch(v.state.tr.insert(second + 2, bodySchema.nodes.hard_break.create()));
    same();
    const proem = v.state.doc.child(0).nodeSize + 1;
    v.dispatch(v.state.tr.delete(proem, proem + 1));
    same();
    v.dispatch(
      v.state.tr.setNodeMarkup(0, undefined, { ...v.state.doc.child(0).attrs, kind: 'quote' }),
    );
    same();
    // Marks given, across paragraphs.
    v.dispatch(v.state.tr.addMark(2, v.state.doc.content.size - 2, bodySchema.marks.em.create()));
    same();
    // And a selection over two runs.
    v.dispatch(
      v.state.tr.setSelection(TextSelection.create(v.state.doc, 2, v.state.doc.content.size - 2)),
    );
    same();
  });

  it('is drawn anew when the kinds of the writer`s own are renamed', () => {
    let own = [{ id: 'chorus', basedOn: 'line', name: 'Chorus' }];
    const v = editorOf(['chorus: Strophe|', 'chorus: Antistrophe'], {
      passageKinds: () => own,
    });
    views.push(v);
    const label = () => v.dom.querySelector('.run-label')?.textContent;
    expect(label()).toBe('Chorus');
    own = [{ id: 'chorus', basedOn: 'line', name: 'Choir' }];
    type(v, 's');
    // Not at a keystroke, which draws nothing anew.
    expect(label()).toBe('Chorus');
    redrawShape(v);
    expect(label()).toBe('Choir');
  });

  it('still takes away a line mark that no longer stands at the start of its line', () => {
    const v = at(['line: Sing, / {n=5}goddess|', 'text: the wrath']);
    const mark = text('line: Sing, / |{n=5}goddess').cursor!;
    v.dispatch(v.state.tr.insertText('O ', mark));
    expect(shapeOf(v)[0]).toBe('line: Sing, / O goddess|');
  });
});

describe('changes within lines', () => {
  const state = () =>
    EditorState.create({ doc: text('text: Sing, goddess', 'text: the wrath').doc });

  it('are text written or taken out, and marks, in the same paragraphs', () => {
    const s = state();
    expect(withinLines(s.tr.insertText('O ', 1))).toMatchObject({ onlyText: true });
    expect(withinLines(s.tr.delete(1, 3))).toMatchObject({ onlyText: true });
    expect(withinLines(s.tr.addMark(1, 20, bodySchema.marks.em.create()))).toMatchObject({
      written: [],
    });
    expect(withinLines(s.tr.insert(3, bodySchema.nodes.hard_break.create()))).toMatchObject({
      onlyText: false,
    });
  });

  it('are not paragraphs split, joined, put in or given another kind', () => {
    const s = state();
    expect(withinLines(s.tr.split(3))).toBeNull();
    const end = s.doc.child(0).nodeSize;
    expect(withinLines(s.tr.join(end))).toBeNull();
    expect(withinLines(s.tr.delete(3, end + 3))).toBeNull();
    expect(
      withinLines(s.tr.setNodeMarkup(0, undefined, { ...s.doc.child(0).attrs, kind: 'quote' })),
    ).toBeNull();
    expect(withinLines(s.tr.replaceWith(0, s.doc.content.size, s.doc.content))).toBeNull();
  });
});
