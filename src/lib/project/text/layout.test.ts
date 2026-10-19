import { describe, expect, it } from 'vitest';
import { buildTree, isAncestor, type FlatNode } from '../model/tree';
import type { LinkRecord } from '../model/types';
import {
  bracketsOf,
  depthAt,
  depthUnder,
  DROP_STEP,
  dropChoices,
  dropIndent,
  GUTTER,
  joinable,
  lineBetween,
  marginWidth,
  nearestChoice,
  outlineNumbers,
  placeAt,
  textRows,
  totalsOf,
  type Box,
  type RowFacts,
} from './layout';

/**
 * book
 *   one
 *     one-a
 *       one-a-i
 *     one-b
 *   two
 *     two-a
 *   three
 */
const nodes: FlatNode[] = [
  ['book', null],
  ['one', 'book'],
  ['one-a', 'one'],
  ['one-a-i', 'one-a'],
  ['one-b', 'one'],
  ['two', 'book'],
  ['two-a', 'two'],
  ['three', 'book'],
].map(([id, parent], i) => ({
  id: id as string,
  parent: parent as string | null,
  order: String.fromCharCode(97 + i),
}));
const tree = buildTree(nodes, 'book');

/** Every element a heading with ten words of text, but where it is said otherwise. */
function factsOf(
  over: Record<string, Partial<RowFacts & { notes: number }>> = {},
): (id: string) => (RowFacts & { notes: number }) | undefined {
  return (id) =>
    tree.parent.has(id) || id === tree.root
      ? {
          excluded: false,
          empty: false,
          include: null,
          heading: true,
          words: 10,
          notes: 0,
          ...over[id],
        }
      : undefined;
}

const none = () => false;

describe('the rows of the text', () => {
  it('every element in the order of the text, a level deeper under each heading', () => {
    const rows = textRows(tree, factsOf({ two: { heading: false } }), none);
    expect(rows.map((r) => [r.id, r.level])).toEqual([
      ['book', 0],
      ['one', 1],
      ['one-a', 2],
      ['one-a-i', 3],
      ['one-b', 2],
      ['two', 1],
      // A name that is not printed does not deepen what is under it.
      ['two-a', 1],
      ['three', 1],
    ]);
    expect(rows.every((r) => !r.away && !r.hidden && r.foldable)).toBe(true);
  });

  it('a folded element hides all under it and says how many words it holds in all', () => {
    const rows = textRows(
      tree,
      factsOf({ 'one-a-i': { words: 3 }, 'one-b': { excluded: true } }),
      (id) => id === 'one' || id === 'one-a',
    );
    const one = rows.find((r) => r.id === 'one')!;
    expect(one.hidden).toEqual({ ids: ['one-a', 'one-a-i', 'one-b'], text: true, words: 33 });
    expect(rows.filter((r) => r.away).map((r) => r.id)).toEqual(['one-a', 'one-a-i', 'one-b']);
    // What is folded under what is folded hides nothing of its own while it is away.
    expect(rows.find((r) => r.id === 'one-a')!.hidden).toBe(null);
    // What is left out of the document leaves out what is under it.
    expect(rows.find((r) => r.id === 'one-b')!.excluded).toBe(true);
    expect(rows.find((r) => r.id === 'two')!.excluded).toBe(false);
  });

  it('an empty element with nothing under it has nothing to fold, unless it takes in a branch', () => {
    const rows = textRows(
      tree,
      factsOf({ three: { empty: true, words: 0 }, 'two-a': { empty: true, include: 'one' } }),
      (id) => id === 'three' || id === 'two-a' || id === 'two',
    );
    const three = rows.find((r) => r.id === 'three')!;
    expect(three.foldable).toBe(false);
    expect(three.hidden).toBe(null);
    const two = rows.find((r) => r.id === 'two')!;
    expect(two.hidden).toEqual({ ids: ['two-a'], text: true, words: 20 });
    const alone = textRows(
      tree,
      factsOf({ 'two-a': { empty: true, include: 'one' } }),
      (id) => id === 'two-a',
    ).find((r) => r.id === 'two-a')!;
    expect(alone.foldable).toBe(true);
    expect(alone.hidden).toEqual({ ids: [], text: true, words: 10 });
  });
});

describe('the numbers of the outline', () => {
  it('counts the headings at each level, starting again under each', () => {
    const rows = textRows(tree, factsOf(), none);
    expect(Object.fromEntries(outlineNumbers(rows, () => true))).toEqual({
      one: '1',
      'one-a': '1.1',
      'one-a-i': '1.1.1',
      'one-b': '1.2',
      two: '2',
      'two-a': '2.1',
      three: '3',
    });
  });

  it('passes over what is not a heading or is left out, and counts what is folded away', () => {
    const facts = factsOf({ two: { heading: false }, 'one-a': { excluded: true } });
    const rows = textRows(tree, facts, (id) => id === 'one');
    expect(Object.fromEntries(outlineNumbers(rows, (id) => !!facts(id)?.heading))).toEqual({
      one: '1',
      'one-b': '1.1',
      // Under a name that is not printed, at the level of the name.
      'two-a': '2',
      three: '3',
    });
  });

  it('a level skipped is counted as nought', () => {
    const rows = textRows(tree, factsOf(), none);
    expect(outlineNumbers(rows, (id) => id === 'one-a-i').get('one-a-i')).toBe('0.0.1');
  });
});

describe('the totals of the text', () => {
  it('counts what is folded away and leaves out what is left out of the document', () => {
    const facts = factsOf({ two: { excluded: true, notes: 4 }, 'one-a': { notes: 2 } });
    const rows = textRows(tree, facts, (id) => id === 'one');
    // book, one, one-a, one-a-i, one-b, three: two and two-a are left out.
    expect(totalsOf(rows, facts)).toEqual({ words: 60, notes: 2 });
  });
});

describe('joining an element to the one before it', () => {
  it('is for an element with nothing under it, after one that is not folded', () => {
    const shown = (folded: string[]) =>
      textRows(tree, factsOf(), (id) => folded.includes(id)).filter((r) => !r.away);
    expect(joinable(shown([]), tree, 'one-b')).toBe(true);
    expect(joinable(shown([]), tree, 'three')).toBe(true);
    // Not the element in view, nor one with elements under it.
    expect(joinable(shown([]), tree, 'book')).toBe(false);
    expect(joinable(shown([]), tree, 'one-a')).toBe(false);
    // Not after one that is folded: its text would go before what is folded away.
    expect(joinable(shown(['two']), tree, 'three')).toBe(false);
  });
});

describe('where dragged elements would go', () => {
  it('knows how deep an element stands under the one in view', () => {
    expect(depthUnder(tree, 'book')).toBe(0);
    expect(depthUnder(tree, 'one')).toBe(1);
    expect(depthUnder(tree, 'one-a-i')).toBe(3);
    const view = buildTree(nodes, 'one');
    expect(depthUnder(view, 'one')).toBe(0);
    expect(depthUnder(view, 'one-a-i')).toBe(2);
  });

  it('takes the place after a section from the middle of it, or from 60 pixels down', () => {
    const boxes: Box[] = [
      { top: 0, bottom: 100, height: 100 },
      { top: 100, bottom: 300, height: 200 },
      { top: 300, bottom: 340, height: 40 },
    ];
    const at = (y: number) => placeAt(y, boxes.length, (i) => boxes[i]);
    expect(at(10)).toBe(0);
    expect(at(70)).toBe(0);
    expect(at(150)).toBe(0);
    expect(at(170)).toBe(1);
    expect(at(310)).toBe(1);
    expect(at(330)).toBe(2);
    expect(at(900)).toBe(2);
    // Only as many sections are measured as are needed.
    let asked = 0;
    placeAt(50, boxes.length, (i) => (asked++, boxes[i]));
    expect(asked).toBe(1);
  });

  it('between an element and one less deep: from under it out to beside the one below', () => {
    expect(dropChoices(tree, 'one-a-i', 'one-b', none)).toEqual([
      { depth: 4, parent: 'one-a-i', index: 0, say: 'under', name: 'one-a-i' },
      { depth: 3, parent: 'one-a', index: 1, say: 'after', name: 'one-a-i' },
      { depth: 2, parent: 'one', index: 1, say: 'before', name: 'one-b' },
    ]);
    expect(dropChoices(tree, 'one-b', 'two', none)).toEqual([
      { depth: 3, parent: 'one-b', index: 0, say: 'under', name: 'one-b' },
      { depth: 2, parent: 'one', index: 2, say: 'after', name: 'one-b' },
      { depth: 1, parent: 'book', index: 1, say: 'before', name: 'two' },
    ]);
  });

  it('after the last, as far out as beside those under the element in view', () => {
    expect(dropChoices(tree, 'three', null, none)).toEqual([
      { depth: 2, parent: 'three', index: 0, say: 'under', name: 'three' },
      { depth: 1, parent: 'book', index: 3, say: 'after', name: 'three' },
    ]);
    // Over the element in view, which is the title: only under it.
    expect(dropChoices(tree, 'book', 'one', none)).toEqual([
      { depth: 1, parent: 'book', index: 0, say: 'under', name: 'book' },
    ]);
  });

  it('never into what is dragged itself', () => {
    const dragging = (d: string) => (id: string) => id === d || isAncestor(tree, d, id);
    expect(dropChoices(tree, 'one-a-i', 'one-b', dragging('one'))).toEqual([]);
    expect(dropChoices(tree, 'one-a-i', 'one-b', dragging('one-a'))).toEqual([
      { depth: 2, parent: 'one', index: 1, say: 'before', name: 'one-b' },
    ]);
  });

  it('takes the depth nearest to the pointer, the deeper of two as near', () => {
    const choices = dropChoices(tree, 'one-a-i', 'one-b', none);
    const left = 100;
    expect(depthAt(left, left)).toBe(1);
    expect(depthAt(left + DROP_STEP * 2, left)).toBe(3);
    expect(nearestChoice(choices, depthAt(left - 500, left)).depth).toBe(2);
    expect(nearestChoice(choices, depthAt(left + DROP_STEP, left)).depth).toBe(2);
    expect(nearestChoice(choices, 3).depth).toBe(3);
    expect(nearestChoice(choices, depthAt(left + 2000, left)).depth).toBe(4);
    expect(nearestChoice([{ depth: 3 }, { depth: 1 }], 2).depth).toBe(3);
  });

  it('draws the line halfway between the two, indented by the depth, within the column', () => {
    const a: Box = { top: 100, bottom: 200, height: 100 };
    const b: Box = { top: 210, bottom: 260, height: 50 };
    expect(lineBetween(a, b, 50)).toBe(155);
    expect(lineBetween(a, undefined, 50)).toBe(156);
    expect(dropIndent(1, 600)).toBe(GUTTER);
    expect(dropIndent(3, 600)).toBe(GUTTER + 2 * DROP_STEP);
    expect(dropIndent(30, 600)).toBe(520);
  });
});

describe('the brackets of associations', () => {
  const link = (id: string, from: string, to: string, label = ''): LinkRecord => ({
    id,
    from,
    to,
    label,
  });
  const anchors = new Map([
    ['one', 10],
    ['one-a', 50],
    ['one-b', 100],
    ['two', 200],
    ['three', 300],
  ]);
  const itself = (id: string) => id;

  it('the short ones innermost, the long ones out in lanes of their own', () => {
    const out = bracketsOf(
      [link('long', 'one', 'three'), link('short', 'one-a', 'one-b'), link('mid', 'one', 'two')],
      anchors,
      itself,
    );
    expect(out.map((b) => [b.id, b.lane])).toEqual([
      ['short', 0],
      ['mid', 1],
      ['long', 2],
    ]);
    expect(marginWidth(out)).toBe(10 + 3 * 9 + 12);
  });

  it('those apart share a lane, those within six pixels of each other do not', () => {
    const apart = bracketsOf(
      [link('a', 'one', 'one-a'), link('b', 'one-b', 'two')],
      anchors,
      itself,
    );
    expect(apart.map((b) => b.lane)).toEqual([0, 0]);
    const near = bracketsOf(
      [link('a', 'one', 'one-a'), link('b', 'x', 'y')],
      new Map([...anchors, ['x', 55], ['y', 120]]),
      itself,
    );
    expect(near.map((b) => [b.id, b.lane])).toEqual([
      ['a', 0],
      ['b', 1],
    ]);
    expect(marginWidth([])).toBe(40);
  });

  it('runs from the upper end down, and is not drawn to itself or to what is not measured', () => {
    const shown = (id: string) => (id === 'one-a' ? 'one' : id);
    const out = bracketsOf(
      [
        link('up', 'two', 'one', 'sees'),
        link('folded', 'one-a', 'one'),
        link('gone', 'one', 'nowhere'),
      ],
      anchors,
      shown,
    );
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ id: 'up', from: 'one', to: 'two', top: 10, bottom: 200 });
    expect(out[0].label).toBe('sees');
    expect(out[0].path).toBe('M 0 10 H 5 Q 10 10 10 15 V 195 Q 10 200 5 200 H 0');
    // Two ends at almost the same height: a straight stroke.
    const flat = bracketsOf(
      [link('f', 'a', 'b')],
      new Map([
        ['a', 40],
        ['b', 41],
      ]),
      itself,
    );
    expect(flat[0].path).toBe('M 0 40 H 10');
  });
});
