import { describe, expect, it } from 'vitest';
import { EditorState } from 'prosemirror-state';
import type { DecorationSet } from 'prosemirror-view';
import type { MapChanges, Piece } from '$lib/history/types';
import { bodySchema } from '$lib/editor/schema';
import { blockIn, placeIn, reviewMarks } from './editor';
import { group } from './grouping';
import { markChanges, marksIn } from './marks';

function piece(status: Piece['status'], text: string, by: string | null = null): Piece {
  return { status, text, marks: {}, by, items: {} };
}

const colour = (by: string | null) => (by === 'anna' ? 'red' : by === 'bo' ? 'blue' : 'grey');

function changes(): MapChanges {
  return {
    map: 'm',
    passages: [
      {
        place: { element: 'a', part: 'body', path: [0] },
        kind: 'paragraph',
        before: true,
        after: true,
        pieces: [
          piece('same', 'The '),
          piece('removed', 'grey ', 'bo'),
          piece('added', 'black ', 'anna'),
          piece('same', 'cat￼ sat. It slept.'),
        ],
      },
      {
        place: { element: 'a', part: 'body', path: [1] },
        kind: 'paragraph',
        before: true,
        after: false,
        pieces: [piece('removed', 'Gone.', 'bo')],
      },
      {
        place: { element: 'b', part: 'body', path: [0, 'note', 1] },
        kind: 'note',
        before: true,
        after: true,
        pieces: [piece('same', 'See '), piece('added', 'Nagy', 'anna'), piece('same', '.')],
      },
    ],
    objects: [],
    elements: [{ element: 'c', kind: 'moved', by: 'bo' }],
  };
}

describe('the marks of the changes', () => {
  it('are said by element: added, deleted where it was, a paragraph gone, the number of a note', () => {
    const found = group(changes());
    const sentence = found.find((c) => c.kind === 'changed')!;
    const marked = markChanges(found, sentence.key, colour);
    expect(
      marksIn(marked, 'a').map((m) => [m.kind, m.from, m.to, m.text ?? '', m.colour, m.current]),
    ).toEqual([
      ['removed', 4, 4, 'grey ', 'blue', true],
      ['added', 4, 10, '', 'red', true],
      ['gone', 0, 0, 'Gone.', 'blue', false],
    ]);
    expect(marksIn(marked, 'b').map((m) => [m.kind, m.path, m.from])).toEqual([['note', [0], 1]]);
    expect(marked.elements.get('c')).toEqual([
      { change: found.find((c) => c.change)!.key, current: false, kind: 'moved', colour: 'blue' },
    ]);
  });

  it('are the same list where an element’s marks did not change', () => {
    const found = group(changes());
    const first = markChanges(found, null, colour);
    const again = markChanges(group(changes()), null, colour, first);
    expect(marksIn(again, 'a')).toBe(marksIn(first, 'a'));
  });
});

describe('in an editor', () => {
  const { nodes } = bodySchema;
  const doc = nodes.doc.create(null, [
    nodes.paragraph.create(null, [
      bodySchema.text('The black cat'),
      nodes.citation.create({ items: [{ id: 'x' }], mode: 'normal' }),
      bodySchema.text(' sat.'),
    ]),
    nodes.paragraph.create(null, [
      bodySchema.text('Second'),
      nodes.footnote.create(null, [bodySchema.text('One')]),
      nodes.footnote.create(null, [bodySchema.text('Two')]),
    ]),
  ]);

  it('finds a block by its path, and a note by its number in the paragraph', () => {
    expect(blockIn(doc, 'body', [0])).toMatchObject({ pos: 0 });
    const second = blockIn(doc, 'body', [1])!;
    expect(second.node.textContent).toBe('SecondOneTwo');
    const note = blockIn(doc, 'body', [1, 'note', 1])!;
    expect(note.node.type.name).toBe('footnote');
    expect(note.node.textContent).toBe('Two');
    expect(blockIn(doc, 'body', [2])).toBeNull();
  });

  it('counts a thing that is no text as one sign', () => {
    const block = blockIn(doc, 'body', [0])!;
    expect(doc.textBetween(placeIn(block, 4), placeIn(block, 9))).toBe('black');
    // After the citation: "The black cat" is 13 signs, the citation the 14th.
    expect(doc.textBetween(placeIn(block, 14), placeIn(block, 18))).toBe(' sat');
    expect(placeIn(block, 99)).toBe(block.pos + 1 + block.node.content.size);
  });

  it('draws what was added and what was deleted', () => {
    const plugin = reviewMarks('body');
    let state = EditorState.create({ doc, plugins: [plugin] });
    const marks = marksIn(markChanges(group(changes()), null, colour), 'a');
    state = state.apply(state.tr.setMeta(plugin.spec.key!, marks));
    const set = plugin.getState(state) as DecorationSet;
    const found = set.find();
    const inline = found.filter((d) => d.from !== d.to);
    expect(inline).toHaveLength(1);
    expect(doc.textBetween(inline[0].from, inline[0].to)).toBe('black ');
    // The deleted words where they were, and the paragraph gone before the one now in its place.
    const points = found.filter((d) => d.from === d.to).map((d) => d.from);
    expect(points.sort((a, b) => a - b)).toEqual([5, 21]);
  });
});
