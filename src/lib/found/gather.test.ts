import { describe, expect, it } from 'vitest';
import * as Y from 'yjs';
import { writeBody } from '$lib/project/model/blocks';
import {
  NO_TEXT,
  countFound,
  elementOf,
  gather,
  inOrder,
  locate,
  passageOf,
  placeOf,
} from './gather';
import { HASH, cell, note, p, project, t, zotero } from './testing';

describe('the passages of a map', () => {
  it('are its paragraphs, with one sign for each thing that is no text', () => {
    const { pr, map, elements } = project([
      p(
        t('As '),
        t('Nagy', { em: {} }),
        t(' says '),
        { kind: 'citation', items: [{ id: 'r1' }], mode: 'normal' },
        t(', where '),
        { kind: 'math', tex: 'x' },
        t(' and '),
        { kind: 'crossref', target: 'f1', form: 'full' },
        { kind: 'break' },
        t('hold.'),
        note(t('A note.')),
      ),
    ]);
    const { places, marked } = gather(pr, map);
    expect(marked).toEqual([]);
    expect(places.map((x) => x.text)).toEqual([
      `As Nagy says ${NO_TEXT}, where ${NO_TEXT} and ${NO_TEXT}\nhold.${NO_TEXT}`,
      'A note.',
    ]);
    expect(places.map((x) => x.note)).toEqual([false, true]);
    // A citation that is there is not looked at.
    expect(places[0].taken).toEqual([[13, 14]]);
    expect(places[1].stands).toEqual({ passage: places[0].id, at: places[0].text.length - 1 });
    expect(places.every((x) => x.element === elements[0])).toBe(true);
    expect(elementOf(places[1].id)).toBe(elements[0]);
    // What the commands are given holds nothing of the project.
    expect(passageOf(places[1])).toEqual({
      id: places[1].id,
      text: 'A note.',
      note: true,
      taken: [],
    });
  });

  it('are found in quotations, lists, cells, and what is said of figures and tables', () => {
    const { pr, map } = project([
      { kind: 'blockquote', content: [p(t('Quoted.'))] },
      {
        kind: 'bullet_list',
        items: [
          [p(t('one')), { kind: 'ordered_list', start: 1, items: [[p(t('nested'))]] }],
          [p(t('two'))],
        ],
      },
      {
        kind: 'figure',
        id: 'f1',
        file: HASH,
        extension: 'png',
        name: 'shield.png',
        caption: [t('The shield')],
        alt: '',
        width: 100,
        numbered: true,
      },
      { kind: 'equation', id: 'e1', tex: 'x', numbered: false },
      {
        kind: 'table',
        id: 't1',
        caption: [t('Forms')],
        rows: [[cell(t('a')), cell(t('b'), note(t('In a cell.')))]],
        numbered: true,
        width: 0,
      },
      {
        kind: 'row',
        items: [
          {
            kind: 'figure',
            id: 'f2',
            file: HASH,
            extension: 'png',
            name: '',
            caption: [t('Beside')],
            alt: '',
            width: 40,
            numbered: true,
          },
          { kind: 'equation', id: 'e2', tex: 'y', numbered: false },
        ],
      },
    ]);
    expect(gather(pr, map).places.map((x) => x.text)).toEqual([
      'Quoted.',
      'one',
      'nested',
      'two',
      'The shield',
      'Forms',
      'a',
      `b${NO_TEXT}`,
      'In a cell.',
      'Beside',
    ]);
  });

  it('are those of all elements of the map, in the order of the text, and of no other map', () => {
    const { pr, map, root, elements } = project([p(t('First.'))], [p(t('Second.'))]);
    const under = pr.addChild(elements[0], { title: 'Under', body: 'Under the first.' })!;
    const loose = pr.addLoose(map, { x: 0, y: 0 }, 'Loose')!;
    pr.transact(() => writeBody(pr.fragment(loose, 'body')!, [p(t('Loose.'))]));
    pr.transact(() => writeBody(pr.fragment(root, 'body')!, [p(t('Centre.'))]));
    pr.setExcluded(elements[1], true);
    const other = pr.createMap('Other');
    pr.transact(() => writeBody(pr.fragment(pr.map(other)!.root, 'body')!, [p(t('Elsewhere.'))]));

    const { places } = gather(pr, map);
    expect(places.map((x) => x.text)).toEqual([
      'Centre.',
      'First.',
      'Under the first.',
      // Left out of the document, it is part of the map all the same.
      'Second.',
      'Loose.',
    ]);
    expect(places.map((x) => x.element)).toEqual([root, elements[0], under, elements[1], loose]);
    expect(places.map((x) => x.order)).toEqual([0, 1, 2, 3, 4]);
    expect(gather(pr, other).places.map((x) => x.text)).toEqual(['Elsewhere.']);
  });

  it('are known by what holds them, which stays while others write around them', () => {
    const { pr, map, elements } = project([p(t('One.')), p(t('Two.'))]);
    const before = gather(pr, map).places;
    expect(new Set(before.map((x) => x.id)).size).toBe(2);
    // A paragraph is written before them, and words into the second.
    const body = pr.fragment(elements[0], 'body')!;
    pr.transact(() => {
      const nought = new Y.XmlElement('paragraph');
      nought.insert(0, [new Y.XmlText('Nought.')]);
      body.insert(0, [nought]);
      const words = (body.get(2) as Y.XmlElement).get(0) as Y.XmlText;
      words.insert(3, ', and more', {});
    });
    const after = gather(pr, map).places;
    expect(after.map((x) => x.text)).toEqual(['Nought.', 'One.', 'Two, and more.']);
    const two = locate(pr, before[1].id);
    expect(two?.text).toBe('Two, and more.');
    expect(locate(pr, `${elements[0]}/1.999999`)).toBeNull();
    expect(locate(pr, 'no such element/1.1')).toBeNull();
  });
});

describe('the citations that were found', () => {
  it('are the text with the mark, the pieces with the same id being one', () => {
    const a = zotero('a1b2c3d4e5f6');
    const b = zotero('b1b2c3d4e5f6', 'WXYZ6789');
    const { pr, map, elements } = project([
      p(
        t('As was said '),
        t('(Nagy 1979, ', { found: a }),
        t('73', { found: a, em: {} }),
        t(')', { found: a }),
        t(' and '),
        t('(Lord 1960)', { found: b }),
        t('.'),
      ),
    ]);
    const { places, marked } = gather(pr, map);
    expect(marked).toEqual([
      {
        passage: places[0].id,
        element: elements[0],
        start: 12,
        end: 27,
        text: '(Nagy 1979, 73)',
        found: a,
        note: false,
        whole: false,
      },
      {
        passage: places[0].id,
        element: elements[0],
        start: 32,
        end: 43,
        text: '(Lord 1960)',
        found: b,
        note: false,
        whole: false,
      },
    ]);
    expect(places[0].text.slice(12, 27)).toBe('(Nagy 1979, 73)');
    expect(places[0].taken).toEqual([
      [12, 27],
      [32, 43],
    ]);
    expect(countFound(pr, map)).toBe(2);
  });

  it('are not those that were left as text, which are not looked at again', () => {
    const left = zotero('a1b2c3d4e5f6', 'ABCD2345', { left: true });
    const { pr, map } = project([p(t('See '), t('(Nagy 1979)', { found: left }), t('.'))]);
    const { places, marked } = gather(pr, map);
    expect(marked).toEqual([]);
    expect(places[0].taken).toEqual([[4, 15]]);
    expect(countFound(pr, map)).toBe(0);
  });

  it('are two where text with the same id stands in two places', () => {
    const a = zotero('a1b2c3d4e5f6');
    const { pr, map } = project([
      p(t('(Nagy 1979)', { found: a }), t(' and again '), t('(Nagy 1979)', { found: a })),
      p(t('(Nagy 1979)', { found: a })),
    ]);
    const { marked } = gather(pr, map);
    expect(marked.map((m) => [m.start, m.end])).toEqual([
      [0, 11],
      [22, 33],
      [0, 11],
    ]);
    expect(new Set(marked.map((m) => m.passage)).size).toBe(2);
  });

  it('have their places in units of UTF-16, as strings have them here', () => {
    const a = zotero('a1b2c3d4e5f6');
    const { pr, map } = project([p(t('μῆνιν 𝔄 ἄειδε '), t('(Ναγύ 1979)', { found: a }))]);
    const { places, marked } = gather(pr, map);
    expect(marked[0].start).toBe('μῆνιν 𝔄 ἄειδε '.length);
    expect(places[0].text.slice(marked[0].start, marked[0].end)).toBe('(Ναγύ 1979)');
  });

  it('stand in notes, and may be all that a note holds', () => {
    const a = zotero('a1b2c3d4e5f6');
    const b = zotero('b1b2c3d4e5f6');
    const c = zotero('c1b2c3d4e5f6');
    const d = zotero('d1b2c3d4e5f6');
    const { pr, map } = project([
      p(
        t('First'),
        note(t('Nagy 1979, 73', { found: a }), t('.')),
        t(' then '),
        t('(Lord 1960)', { found: b }),
        t(' and last'),
        note(t('See '), t('Nagy 1979', { found: c }), t('; but he argues otherwise.')),
        t(' '),
        t('(Parry 1971)', { found: d }),
      ),
    ]);
    const { places, marked } = gather(pr, map);
    // In the order of the text: what a note holds comes where the note stands.
    expect(marked.map((m) => m.found.id)).toEqual([a.id, b.id, c.id, d.id]);
    expect(marked.map((m) => [m.note, m.whole])).toEqual([
      [true, true],
      [false, false],
      [true, false],
      [false, false],
    ]);
    expect(places.map((x) => x.note)).toEqual([false, true, true]);
    const byId = new Map(places.map((x) => [x.id, x]));
    const order = marked.map((m) => placeOf(byId, m.passage, m.start));
    expect([...order].sort(inOrder)).toEqual(order);
    // Something proposed in the text after a note comes after what the note holds.
    expect(inOrder(placeOf(byId, places[0].id, 7), order[0])).toBeGreaterThan(0);
    expect(inOrder(placeOf(byId, places[0].id, 7), order[1])).toBeLessThan(0);
    expect(placeOf(byId, 'gone', 0)[0]).toBe(Number.MAX_SAFE_INTEGER);
  });
});
