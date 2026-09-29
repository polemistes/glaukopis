import { describe, expect, it } from 'vitest';
import type {
  ElementChange,
  Items,
  MapChanges,
  ObjectChange,
  Passage,
  Piece,
  Place,
} from '$lib/history/types';
import { group, likeness, type Change } from './grouping';

// ---- passages made by hand ----

const CLIENTS: Record<string, number> = { anna: 11, bo: 12, me: 13 };
let clock = 0;

function items(client: number, length: number): Items {
  const start = clock;
  clock += Math.max(1, length);
  return { [client]: [[start, start + length]] };
}

function same(text: string, marks: Record<string, unknown> = {}): Piece {
  return { status: 'same', text, marks, by: null, items: items(1, text.length) };
}

function added(text: string, by = 'anna'): Piece {
  return { status: 'added', text, marks: {}, by, items: items(CLIENTS[by], text.length) };
}

function removed(text: string, by = 'anna'): Piece {
  return { status: 'removed', text, marks: {}, by, items: items(CLIENTS[by], text.length) };
}

function formatted(
  text: string,
  marks: Record<string, unknown>,
  before: Record<string, unknown>,
  by = 'anna',
): Piece {
  return { status: 'same', text, marks, marksBefore: before, by, items: items(1, text.length) };
}

function object(kind: string, status: Piece['status'], by = 'anna'): Piece {
  return {
    status,
    text: '￼',
    object: { kind, label: kind, attrs: {} },
    marks: {},
    by: status === 'same' ? null : by,
    items: items(CLIENTS[by], 1),
  };
}

function place(element: string, path: Place['path'], part: Place['part'] = 'body'): Place {
  return { element, part, path };
}

function passage(
  element: string,
  path: Place['path'],
  pieces: Piece[],
  options: { before?: boolean; after?: boolean; part?: Place['part']; kind?: string } = {},
): Passage {
  return {
    place: place(element, path, options.part),
    kind: options.kind ?? 'paragraph',
    before: options.before ?? true,
    after: options.after ?? true,
    pieces,
  };
}

function written(
  element: string,
  path: Place['path'],
  text: string,
  by = 'anna',
  part: Place['part'] = 'body',
): Passage {
  return passage(element, path, [added(text, by)], { before: false, part });
}

function deleted(element: string, path: Place['path'], text: string, by = 'anna'): Passage {
  return passage(element, path, [removed(text, by)], { after: false });
}

function changes(
  passages: Passage[],
  more: { objects?: ObjectChange[]; elements?: ElementChange[] } = {},
): MapChanges {
  return { map: 'm', passages, objects: more.objects ?? [], elements: more.elements ?? [] };
}

/** A change as it is now, with the words that are new in brackets and those deleted in braces. */
function shown(c: Change): string {
  return c.stretches
    .map((s) =>
      s.pieces
        .map((p) =>
          p.status === 'added' ? `[${p.text}]` : p.status === 'removed' ? `{${p.text}}` : p.text,
        )
        .join(''),
    )
    .join(' | ');
}

// ---- the tests ----

describe('a sentence', () => {
  it('changed in several places is one change, with the words that changed marked', () => {
    const found = group(
      changes([
        passage(
          'a',
          [0],
          [
            same('The '),
            removed('grey'),
            added('black'),
            same(' cat sat on the '),
            added('old '),
            same('mat. It slept.'),
          ],
        ),
      ]),
    );
    expect(found).toHaveLength(1);
    expect(found[0].kind).toBe('changed');
    expect(shown(found[0])).toBe('The {grey}[black] cat sat on the [old ]mat.');
    expect(found[0].stretches[0].now).toEqual({ from: 0, to: 33 });
    expect(found[0].stretches[0].then).toEqual({ from: 0, to: 28 });
    expect(found[0].by).toEqual(['anna']);
  });

  it('changed in one word leaves the sentences around it alone', () => {
    const found = group(
      changes([
        passage(
          'a',
          [0],
          [same('The cat sat. The '), removed('dog'), added('hound'), same(' ran. It slept.')],
        ),
      ]),
    );
    expect(found.map(shown)).toEqual(['The {dog}[hound] ran.']);
    expect(found[0].stretches[0].now).toEqual({ from: 13, to: 27 });
  });

  it('and the next, each changed, are two changes', () => {
    const found = group(
      changes([
        passage(
          'a',
          [0],
          [same('A '), added('big '), same('cat sat. A '), removed('small '), same('dog ran.')],
        ),
      ]),
    );
    expect(found.map(shown)).toEqual(['A [big ]cat sat.', 'A {small }dog ran.']);
  });

  it('changed by two people is one change, by both', () => {
    const found = group(
      changes([
        passage(
          'a',
          [0],
          [
            same('The '),
            added('black ', 'anna'),
            same('cat sat on the '),
            removed('old ', 'bo'),
            same('mat.'),
          ],
        ),
      ]),
    );
    expect(found).toHaveLength(1);
    expect(found[0].by).toEqual(['anna', 'bo']);
  });

  it('formatted otherwise is a change of that sentence', () => {
    const found = group(
      changes([
        passage(
          'a',
          [0],
          [same('It is sung. The '), formatted('Iliad', { em: true }, {}), same(' is old.')],
        ),
      ]),
    );
    expect(found.map(shown)).toEqual(['The Iliad is old.']);
    expect(found[0].kind).toBe('changed');
    // Marks as they were are no change.
    expect(
      group(changes([passage('a', [0], [formatted('Same.', { em: true }, { em: true })])])),
    ).toEqual([]);
  });

  it('split in two by a change is one change', () => {
    const found = group(
      changes([
        passage(
          'a',
          [0],
          [same('The cat sat'), removed(' and t'), added('. T'), same('he dog ran. Then.')],
        ),
      ]),
    );
    expect(found.map(shown)).toEqual(['The cat sat{ and t}[. T]he dog ran.']);
  });

  it('keeps its key while more is written in it', () => {
    const first = group(
      changes([passage('a', [0], [same('The '), added('black '), same('cat sat.')])]),
    );
    const more = first[0].stretches[0].pieces[1];
    const later = group(
      changes([
        passage('a', [0], [same('The '), more, same('cat sat on the '), added('mat'), same('.')]),
      ]),
    );
    expect(later[0].key).toBe(first[0].key);
  });
});

describe('new and deleted text', () => {
  it('of several sentences is one change', () => {
    const found = group(
      changes([
        passage('a', [0], [same('Old one. '), added('New here. New there. '), same('Old two.')]),
      ]),
    );
    expect(found).toHaveLength(1);
    expect(found[0].kind).toBe('added');
    expect(shown(found[0])).toBe('[New here. New there. ]');
    const gone = group(
      changes([
        passage(
          'a',
          [0],
          [same('Old one. '), removed('Gone here. Gone there. '), same('Old two.')],
        ),
      ]),
    );
    expect(gone.map((c) => c.kind)).toEqual(['removed']);
  });

  it('a paragraph written, and several in a row with their notes, are one change', () => {
    const found = group(
      changes([
        written('a', [2], 'First new paragraph.'),
        written('a', [3], 'Second new one.'),
        written('a', [3, 'note', 0], 'A note in it.'),
        written('a', [4], 'Third.'),
        written('a', [6], 'Apart from them.'),
      ]),
    );
    expect(found.map((c) => [c.kind, c.stretches.length])).toEqual([
      ['added', 4],
      ['added', 1],
    ]);
    expect(found[0].stretches.every((s) => s.whole)).toBe(true);
  });

  it('a paragraph deleted is one change', () => {
    const found = group(changes([deleted('a', [1], 'It was here. And this.')]));
    expect(found.map((c) => c.kind)).toEqual(['removed']);
    expect(shown(found[0])).toBe('{It was here. And this.}');
  });

  it('within a list and after it', () => {
    const found = group(
      changes([
        written('a', [3, 1, 0], 'An item.'),
        written('a', [3, 2, 0], 'Another.'),
        written('a', [4], 'After.'),
      ]),
    );
    expect(found).toHaveLength(1);
  });
});

describe('a paragraph moved', () => {
  it('is one change, from where it was to where it is', () => {
    const text = 'The wrath of Achilles is the subject of the poem, and it is sung by the Muse.';
    const found = group(
      changes([
        deleted('a', [1], text),
        passage('a', [2], [same('Unchanged. '), added('A new sentence.')]),
        written('b', [0], text.replace('sung by', 'sung, as always, by'), 'bo'),
      ]),
    );
    const moved = found.filter((c) => c.kind === 'moved');
    expect(moved).toHaveLength(1);
    expect(moved[0].stretches.map((s) => s.passage.place.element)).toEqual(['a', 'b']);
    expect(moved[0].by).toEqual(['bo', 'anna']);
    expect(found.filter((c) => c.kind === 'added')).toHaveLength(1);
  });

  it('is not what has other words', () => {
    const found = group(
      changes([
        deleted('a', [1], 'The wrath of Achilles is sung.'),
        written('a', [5], 'Hector dies at the end of the poem.'),
      ]),
    );
    expect(found.map((c) => c.kind)).toEqual(['removed', 'added']);
  });
});

describe('elements', () => {
  const at = (parent: string | null, after: string | null) => ({ parent, after });

  it('each added, removed, moved, set out of the document or given a heading is one', () => {
    const found = group(
      changes(
        [
          written('new', [0], 'A new element', 'anna', 'title'),
          written('new', [0], 'Its text. Two sentences.'),
          written('new', [1], 'And a paragraph.'),
          passage('old', [0], [same('Some '), added('more '), same('text.')]),
        ],
        {
          elements: [
            { element: 'new', kind: 'added', after: at('root', 'old'), by: 'anna' },
            { element: 'gone', kind: 'removed', before: at('root', 'old'), by: 'bo' },
            {
              element: 'old',
              kind: 'moved',
              before: at('root', null),
              after: at('root', 'x'),
              by: 'bo',
            },
            { element: 'x', kind: 'excluded', by: 'anna' },
            { element: 'x', kind: 'heading', by: 'anna' },
          ],
        },
      ),
      { sequence: ['root', 'x', 'old', 'new'] },
    );
    expect(found.map((c) => `${c.element}:${c.change?.kind ?? c.kind}`)).toEqual([
      'x:excluded',
      'x:heading',
      'old:moved',
      'old:changed',
      'gone:removed',
      'new:added',
    ]);
    const made = found.find((c) => c.element === 'new')!;
    expect(made.stretches).toHaveLength(3);
    expect(made.stretches[0].passage.place.part).toBe('title');
  });
});

describe('objects', () => {
  it('a figure put in, with what is said of it, is one change', () => {
    const found = group(
      changes([written('a', [2], 'The shield of Achilles.', 'anna')], {
        objects: [
          {
            place: place('a', [2]),
            kind: 'figure',
            status: 'added',
            after: { file: 'x' },
            by: 'anna',
          },
        ],
      }),
    );
    expect(found).toHaveLength(1);
    expect(found[0].kind).toBe('object');
    expect(found[0].object?.kind).toBe('figure');
    expect(found[0].stretches).toHaveLength(1);
  });

  it('a citation put into a sentence where nothing else changed is one of its own', () => {
    const found = group(
      changes([
        passage(
          'a',
          [0],
          [same('The wrath is divine '), object('citation', 'added'), same('. It is sung.')],
        ),
      ]),
    );
    expect(found).toHaveLength(1);
    expect(found[0].kind).toBe('object');
    expect(found[0].stretches[0].pieces).toHaveLength(1);
  });

  it('and one put in with words is part of their sentence', () => {
    const found = group(
      changes([
        passage(
          'a',
          [0],
          [
            same('The wrath is divine'),
            added(', as Nagy says '),
            object('citation', 'added'),
            same('. It is sung.'),
          ],
        ),
      ]),
    );
    expect(found.map((c) => c.kind)).toEqual(['changed']);
    expect(found[0].stretches[0].now).toEqual({ from: 0, to: 36 });
  });

  it('and one put in where the words of the sentence changed as well goes with them', () => {
    const found = group(
      changes([
        passage(
          'a',
          [0],
          [
            same('The '),
            added('great '),
            same('wrath is divine '),
            object('citation', 'added'),
            same('. It is sung.'),
          ],
        ),
      ]),
    );
    expect(found.map((c) => c.kind)).toEqual(['changed']);
  });
});

describe('notes', () => {
  it('are gone through sentence by sentence', () => {
    const found = group(
      changes([
        passage('a', [3, 'note', 0], [same('See Nagy. '), added('And Lord. '), same('Both.')], {
          kind: 'note',
        }),
      ]),
    );
    expect(found.map(shown)).toEqual(['[And Lord. ]']);
  });

  it('one put in, with its text, is one change', () => {
    const found = group(
      changes([
        passage(
          'a',
          [3],
          [same('It is divine.'), object('footnote', 'added'), same(' It is sung.')],
        ),
        written('a', [3, 'note', 0], 'Cf. Nagy 1979.'),
      ]),
    );
    expect(found).toHaveLength(1);
    expect(found[0].kind).toBe('added');
    expect(found[0].stretches).toHaveLength(2);
  });
});

describe('by paragraph', () => {
  it('each passage that changed is one', () => {
    const found = group(
      changes([
        passage(
          'a',
          [0],
          [same('A '), added('big '), same('cat sat. A '), removed('small '), same('dog ran.')],
        ),
      ]),
      { unit: 'paragraph' },
    );
    expect(found).toHaveLength(1);
    expect(found[0].stretches[0].whole).toBe(true);
  });
});

describe('one’s own changes', () => {
  it('are left out, unless they are asked for, and shown where another changed the sentence too', () => {
    const map = changes([
      passage('a', [0], [same('The '), added('black ', 'me'), same('cat sat.')]),
      passage(
        'a',
        [1],
        [same('The '), added('big ', 'me'), same('dog '), added('really ', 'anna'), same('ran.')],
      ),
    ]);
    expect(group(map, { me: 'me' }).map(shown)).toEqual(['The [big ]dog [really ]ran.']);
    expect(group(map, { me: 'me', own: true })).toHaveLength(2);
  });
});

describe('the order of the text', () => {
  it('is that of the elements, then of their names and texts', () => {
    const found = group(
      changes([
        passage('b', [1], [same('B two '), added('x'), same('.')]),
        passage('a', [0], [same('A one '), added('y'), same('.')]),
        passage('b', [0], [same('B one '), added('z'), same('.')]),
        passage('b', [0], [same('B title '), added('w')], { part: 'title' }),
      ]),
      { sequence: ['a', 'b'] },
    );
    expect(found.map(shown)).toEqual(['A one [y].', 'B title [w]', 'B one [z].', 'B two [x].']);
  });
});

describe('likeness', () => {
  it('is one for the same words, and less for fewer in common', () => {
    expect(likeness('The wrath of Achilles', 'the WRATH of achilles!')).toBe(1);
    expect(likeness('a b c d', 'a b c e')).toBe(0.75);
    expect(likeness('', 'a')).toBe(0);
  });
});
