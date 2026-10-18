import { describe, expect, it, vi } from 'vitest';
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
import { HASH, cell, list, note, p, project, quote, t, zotero } from './testing';

describe('the passages of an element in view', () => {
  it('are its paragraphs, with one sign for each thing that is no text', () => {
    const { pr, at, elements } = project([
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
    const { places, marked } = gather(pr, at);
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
    const { pr, at } = project([
      quote(t('Quoted.')),
      ...list([t('one')], [t('nested')], [t('two')]),
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
    expect(gather(pr, at).places.map((x) => x.text)).toEqual([
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

  it('are those of the element in view and all under it, in the order of the text, and of nothing else', () => {
    const { pr, at, elements } = project([p(t('First.'))], [p(t('Second.'))]);
    const under = pr.addChild(elements[0], { title: 'Under', body: 'Under the first.' })!;
    pr.transact(() => writeBody(pr.fragment(at, 'body')!, [p(t('Preamble.'))]));
    pr.setExcluded(elements[1], true);
    const other = pr.addChild(at, { title: 'Other', body: 'Elsewhere.' })!;

    const { places } = gather(pr, at);
    expect(places.map((x) => x.text)).toEqual([
      'Preamble.',
      'First.',
      'Under the first.',
      // Left out of the document, it is part of the project all the same.
      'Second.',
      'Elsewhere.',
    ]);
    expect(places.map((x) => x.element)).toEqual([at, elements[0], under, elements[1], other]);
    expect(places.map((x) => x.order)).toEqual([0, 1, 2, 3, 4]);
    // Seen from an element, its own branch alone.
    expect(gather(pr, elements[0]).places.map((x) => x.text)).toEqual([
      'First.',
      'Under the first.',
    ]);
    expect(gather(pr, other).places.map((x) => x.text)).toEqual(['Elsewhere.']);
  });

  it('are known by what holds them, which stays while others write around them', () => {
    const { pr, at, elements } = project([p(t('One.')), p(t('Two.'))]);
    const before = gather(pr, at).places;
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
    const after = gather(pr, at).places;
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
    const { pr, at, elements } = project([
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
    const { places, marked } = gather(pr, at);
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
    expect(countFound(pr, at)).toBe(2);
  });

  it('are not those that were left as text, which are not looked at again', () => {
    const left = zotero('a1b2c3d4e5f6', 'ABCD2345', { left: true });
    const { pr, at } = project([p(t('See '), t('(Nagy 1979)', { found: left }), t('.'))]);
    const { places, marked } = gather(pr, at);
    expect(marked).toEqual([]);
    expect(places[0].taken).toEqual([[4, 15]]);
    expect(countFound(pr, at)).toBe(0);
  });

  it('are two where text with the same id stands in two places', () => {
    const a = zotero('a1b2c3d4e5f6');
    const { pr, at } = project([
      p(t('(Nagy 1979)', { found: a }), t(' and again '), t('(Nagy 1979)', { found: a })),
      p(t('(Nagy 1979)', { found: a })),
    ]);
    const { marked } = gather(pr, at);
    expect(marked.map((m) => [m.start, m.end])).toEqual([
      [0, 11],
      [22, 33],
      [0, 11],
    ]);
    expect(new Set(marked.map((m) => m.passage)).size).toBe(2);
  });

  it('have their places in units of UTF-16, as strings have them here', () => {
    const a = zotero('a1b2c3d4e5f6');
    const { pr, at } = project([p(t('μῆνιν 𝔄 ἄειδε '), t('(Ναγύ 1979)', { found: a }))]);
    const { places, marked } = gather(pr, at);
    expect(marked[0].start).toBe('μῆνιν 𝔄 ἄειδε '.length);
    expect(places[0].text.slice(marked[0].start, marked[0].end)).toBe('(Ναγύ 1979)');
  });

  it('stand in notes, and may be all that a note holds', () => {
    const a = zotero('a1b2c3d4e5f6');
    const b = zotero('b1b2c3d4e5f6');
    const c = zotero('c1b2c3d4e5f6');
    const d = zotero('d1b2c3d4e5f6');
    const { pr, at } = project([
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
    const { places, marked } = gather(pr, at);
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

describe('what is gathered on every change', () => {
  /** A project of many elements, each with a citation that was found, and a way to write in one of them. */
  function many() {
    const texts = Array.from({ length: 40 }, (_, i) => [
      p(t(`Part ${i}, as was said `), t('(Nagy 1979)', { found: zotero(`a${i}b2c3d4e5f6`) })),
    ]);
    const made = project(...texts);
    const write = (element: string, what: string) =>
      made.pr.transact(() => {
        const paragraph = made.pr.fragment(element, 'body')!.get(0) as Y.XmlElement;
        (paragraph.get(0) as Y.XmlText).insert(0, what);
      });
    return { ...made, write };
  }

  /** How many texts of elements are read while `f` runs. */
  function reads(pr: ReturnType<typeof many>['pr'], f: () => void): number {
    const spy = vi.spyOn(pr, 'fragment');
    f();
    const n = spy.mock.calls.filter(([, which]) => which === 'body').length;
    spy.mockRestore();
    return n;
  }

  it('reads again only the element written in, to count the citations of the branch', () => {
    const { pr, at, elements, write } = many();
    expect(countFound(pr, at)).toBe(40);
    write(elements[7], 'So ');
    expect(reads(pr, () => expect(countFound(pr, at)).toBe(40))).toBe(1);
    // Nothing changed: nothing is read.
    expect(reads(pr, () => countFound(pr, at))).toBe(0);
  });

  it('reads again only the element written in, to gather the branch, and gives what is new', () => {
    const { pr, at, elements, write } = many();
    const before = gather(pr, at);
    write(elements[7], 'So ');
    let after = gather(pr, at);
    expect(reads(pr, () => (after = gather(pr, at)))).toBe(0);
    write(elements[3], 'Then ');
    expect(reads(pr, () => (after = gather(pr, at)))).toBe(1);
    expect(after.places.map((x) => x.order)).toEqual(before.places.map((x) => x.order));
    expect(after.places[3].text).toBe(`Then ${before.places[3].text}`);
    expect(after.places[7].text).toBe(`So ${before.places[7].text}`);
    expect(after.marked[3].start).toBe(before.marked[3].start + 'Then '.length);
    expect(after.marked.map((m) => m.found.id)).toEqual(before.marked.map((m) => m.found.id));
    // What one took and changed is not what the next is given.
    after.places[0].text = 'changed';
    after.marked[0].start = -1;
    const again = gather(pr, at);
    expect(again.places[0].text).toBe(before.places[0].text);
    expect(again.marked[0].start).toBe(before.marked[0].start);
  });

  it('counts what was found anew where a citation is left as text', () => {
    const { pr, at, elements } = many();
    expect(countFound(pr, at)).toBe(40);
    pr.transact(() => {
      const paragraph = pr.fragment(elements[2], 'body')!.get(0) as Y.XmlElement;
      const text = paragraph.get(0) as Y.XmlText;
      const length = text.length;
      text.format(length - '(Nagy 1979)'.length, '(Nagy 1979)'.length, {
        found: { ...zotero('a2b2c3d4e5f6'), left: true },
      });
    });
    expect(countFound(pr, at)).toBe(39);
    expect(gather(pr, at).marked).toHaveLength(39);
  });
});
