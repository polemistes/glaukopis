import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { ySyncPlugin } from 'y-prosemirror';
import { afterEach, describe, expect, it } from 'vitest';
import * as Y from 'yjs';
import { bodyPlugins } from '$lib/editor/plugins';
import { bodySchema } from '$lib/editor/schema';
import { Project } from '$lib/project/model/project.svelte';
import { readBody, type Block, type Inline } from '$lib/project/model/text';
import {
  around,
  intoCitation,
  leaveAsText,
  makeCitation,
  makeCitations,
  nodeOf,
  type Target,
} from './change';
import { gather, type Marked } from './gather';
import { HASH, cell, note, p, project, t, zotero } from './testing';

let views: EditorView[] = [];

/** An editor that writes in the text of an element, as where the text is written. */
function editor(fragment: Y.XmlFragment): EditorView {
  const place = document.body.appendChild(document.createElement('div'));
  const plugins = bodyPlugins(bodySchema, { undo: () => {}, redo: () => {} });
  const view = new EditorView(place, {
    state: EditorState.create({ schema: bodySchema, plugins: [ySyncPlugin(fragment), ...plugins] }),
  });
  views.push(view);
  return view;
}

afterEach(() => {
  for (const v of views) v.destroy();
  views = [];
  document.body.innerHTML = '';
});

const target = (m: Marked): Target => ({
  passage: m.passage,
  start: m.start,
  end: m.end,
  text: m.text,
  id: m.found.id,
});

/** Text that was proposed: where these words stand in the first passage that has them. */
function proposed(pr: Project, map: string, words: string): Target {
  const place = gather(pr, map).places.find((x) => x.text.includes(words))!;
  const start = place.text.indexOf(words);
  const end = start + words.length;
  return { passage: place.id, start, end, text: words, around: around(place.text, start, end) };
}

const text = (pr: Project, element: string) => readBody(pr.fragment(element, 'body')!);
const cited = (id: string, more: object = {}): Inline => ({
  kind: 'citation',
  items: [{ id, ...more }],
  mode: 'normal',
});

const A = zotero('a1b2c3d4e5f6');
const B = zotero('b1b2c3d4e5f6', 'WXYZ6789');

const wrath: Block[] = [
  p(t('Before.')),
  p(
    t('As was said '),
    t('(Nagy 1979, ', { found: A }),
    t('73', { found: A, em: {} }),
    t(')', { found: A }),
    t(' and '),
    t('sung', { strong: {} }),
    t(' '),
    t('(Lord 1960)', { found: B }),
    t('.'),
  ),
  p(t('After.')),
];

describe('a citation is made of what was found', () => {
  it('in the place of its text, all its pieces, and nothing else is changed', () => {
    const { pr, map, elements } = project(wrath);
    const [first] = gather(pr, map).marked;
    expect(
      makeCitation(pr, target(first), [{ id: 'r1', locator: ' 73 ', label: 'page' }], 'normal'),
    ).toEqual({ done: true });
    expect(text(pr, elements[0])).toEqual([
      p(t('Before.')),
      p(
        t('As was said '),
        cited('r1', { locator: '73' }),
        t(' and '),
        t('sung', { strong: {} }),
        t(' '),
        t('(Lord 1960)', { found: B }),
        t('.'),
      ),
      p(t('After.')),
    ]);
    expect(pr.node(elements[0])!.cited).toEqual(['r1']);
    expect(gather(pr, map).marked.map((m) => m.found.id)).toEqual([B.id]);
    // What the project holds is what an editor can hold.
    const v = editor(pr.fragment(elements[0], 'body')!);
    expect(() => v.state.doc.check()).not.toThrow();
    expect(v.state.doc.child(1).child(1).type.name).toBe('citation');
  });

  it('is undone as one step, and made again', () => {
    const { pr, map, elements } = project(wrath);
    pr.undoManager.clear();
    const [first, second] = gather(pr, map).marked;
    makeCitation(pr, target(first), [{ id: 'r1' }], 'normal');
    makeCitation(pr, target(second), [{ id: 'r2' }, { id: 'r3', prefix: 'cf.' }], 'intext');
    expect(pr.node(elements[0])!.cited).toEqual(['r1', 'r2', 'r3']);
    expect(pr.undoManager.undoStack.length).toBe(2);
    pr.undo();
    expect(pr.node(elements[0])!.cited).toEqual(['r1']);
    pr.undo();
    expect(text(pr, elements[0])).toEqual(wrath);
    expect(gather(pr, map).marked.map((m) => m.found.id)).toEqual([A.id, B.id]);
    pr.redo();
    pr.redo();
    expect(text(pr, elements[0])[1]).toEqual(
      p(
        t('As was said '),
        cited('r1'),
        t(' and '),
        t('sung', { strong: {} }),
        t(' '),
        { kind: 'citation', items: [{ id: 'r2' }, { id: 'r3', prefix: 'cf.' }], mode: 'intext' },
        t('.'),
      ),
    );
  });

  it('is found by its id where the text around it has changed', () => {
    const { pr, map, elements } = project(wrath);
    const [, second] = gather(pr, map).marked;
    const words = (pr.fragment(elements[0], 'body')!.get(1) as Y.XmlElement).get(0) as Y.XmlText;
    pr.transact(() => words.insert(0, 'And so, ', {}));
    expect(makeCitation(pr, target(second), [{ id: 'r2' }], 'normal')).toEqual({ done: true });
    expect(text(pr, elements[0])[1]).toMatchObject({
      content: [
        t('And so, As was said '),
        t('(Nagy 1979, ', { found: A }),
        {},
        {},
        {},
        {},
        {},
        cited('r2'),
        t('.'),
      ],
    });
    // Once it is a citation it is no longer there to be made one.
    expect(makeCitation(pr, target(second), [{ id: 'r2' }], 'normal')).toEqual({
      done: false,
      why: 'gone',
    });
  });

  it('not without a reference for every work', () => {
    const { pr, map, elements } = project(wrath);
    const [first] = gather(pr, map).marked;
    expect(makeCitation(pr, target(first), [], 'normal')).toEqual({ done: false, why: 'cannot' });
    expect(makeCitation(pr, target(first), [{ id: 'r1' }, { id: '' }], 'normal')).toEqual({
      done: false,
      why: 'cannot',
    });
    expect(text(pr, elements[0])).toEqual(wrath);
  });

  it('in a cell, and in what is said of a figure', () => {
    const { pr, map, elements } = project([
      {
        kind: 'table',
        id: 't1',
        caption: [t('Forms '), t('(Nagy 1979)', { found: A })],
        rows: [[cell(t('a')), cell(t('See '), t('(Lord 1960)', { found: B }))]],
        numbered: true,
        width: 0,
      },
      {
        kind: 'figure',
        id: 'f1',
        file: HASH,
        extension: 'png',
        name: 'shield.png',
        caption: [t('The shield '), t('(Parry 1971)', { found: zotero('c1b2c3d4e5f6') })],
        alt: '',
        width: 100,
        numbered: true,
      },
    ]);
    const all = gather(pr, map).marked;
    expect(all.map((m) => m.text)).toEqual(['(Nagy 1979)', '(Lord 1960)', '(Parry 1971)']);
    const done = makeCitations(
      pr,
      all.map((m, i) => ({ target: target(m), items: [{ id: `r${i + 1}` }], mode: 'normal' })),
    );
    expect(done).toEqual([{ done: true }, { done: true }, { done: true }]);
    const [table, figure] = text(pr, elements[0]);
    expect(table).toMatchObject({
      caption: [t('Forms '), cited('r1')],
      rows: [[{ content: [p(t('a'))] }, { content: [p(t('See '), cited('r2'))] }]],
    });
    expect(figure).toMatchObject({ caption: [t('The shield '), cited('r3')] });
  });
});

describe('all that are certain are made citations at once', () => {
  it('those of one paragraph as well, and undone as one step', () => {
    const { pr, map, elements } = project(wrath, [
      p(t('Elsewhere '), t('(Nagy 1979, 73)', { found: zotero('c1b2c3d4e5f6') })),
    ]);
    pr.undoManager.clear();
    const all = gather(pr, map).marked;
    const done = makeCitations(pr, [
      ...all.map((m, i) => ({
        target: target(m),
        items: [{ id: `r${i + 1}` }],
        mode: 'normal' as const,
      })),
      // What is no longer there does not stop the others.
      { target: { ...target(all[0]), id: 'gone' }, items: [{ id: 'r9' }], mode: 'normal' },
    ]);
    expect(done).toEqual([
      { done: true },
      { done: true },
      { done: true },
      { done: false, why: 'gone' },
    ]);
    expect(text(pr, elements[0])[1]).toEqual(
      p(
        t('As was said '),
        cited('r1'),
        t(' and '),
        t('sung', { strong: {} }),
        t(' '),
        cited('r2'),
        t('.'),
      ),
    );
    expect(text(pr, elements[1])).toEqual([p(t('Elsewhere '), cited('r3'))]);
    expect(pr.undoManager.undoStack.length).toBe(1);
    pr.undo();
    expect(text(pr, elements[0])).toEqual(wrath);
    expect(gather(pr, map).marked).toHaveLength(3);
    expect(makeCitations(pr, [])).toEqual([]);
  });
});

describe('what was found is left as text', () => {
  it('the mark says so, and keeps what is known of it', () => {
    const { pr, map, elements } = project(wrath);
    pr.undoManager.clear();
    const [first] = gather(pr, map).marked;
    expect(leaveAsText(pr, target(first))).toEqual({ done: true });
    const left = { ...A, left: true };
    expect(text(pr, elements[0])[1]).toMatchObject({
      content: [
        t('As was said '),
        t('(Nagy 1979, ', { found: left }),
        t('73', { em: {}, found: left }),
        t(')', { found: left }),
        t(' and '),
        {},
        {},
        t('(Lord 1960)', { found: B }),
        t('.'),
      ],
    });
    const after = gather(pr, map);
    expect(after.marked.map((m) => m.found.id)).toEqual([B.id]);
    expect(after.places[1].taken).toEqual([
      [12, 27],
      [37, 48],
    ]);
    expect(leaveAsText(pr, target(first))).toEqual({ done: false, why: 'gone' });
    expect(pr.undoManager.undoStack.length).toBe(1);
    pr.undo();
    expect(text(pr, elements[0])).toEqual(wrath);
  });
});

describe('text that was proposed as a citation', () => {
  const plain: Block[] = [
    p(t('It is said (Nagy 1979, 73) and '), t('sung', { em: {} }), t(' (Lord 1960).')),
  ];

  it('is made a citation where it stands', () => {
    const { pr, map, elements } = project(plain);
    const at = proposed(pr, map, '(Nagy 1979, 73)');
    expect(makeCitation(pr, at, [{ id: 'r1', locator: '73' }], 'normal')).toEqual({ done: true });
    expect(text(pr, elements[0])).toEqual([
      p(
        t('It is said '),
        cited('r1', { locator: '73' }),
        t(' and '),
        t('sung', { em: {} }),
        t(' (Lord 1960).'),
      ),
    ]);
  });

  it('only if what stands there is still what was proposed', () => {
    const { pr, map, elements } = project(plain);
    const nagy = proposed(pr, map, '(Nagy 1979, 73)');
    const lord = proposed(pr, map, '(Lord 1960)');
    const words = (pr.fragment(elements[0], 'body')!.get(0) as Y.XmlElement).get(0) as Y.XmlText;
    // The year is changed by another, and words are written before it.
    pr.transact(() => {
      words.delete(17, 4);
      words.insert(17, '1990', {});
      words.insert(0, 'Truly: ', {});
    });
    const before = text(pr, elements[0]);
    expect(makeCitation(pr, nagy, [{ id: 'r1' }], 'normal')).toEqual({
      done: false,
      why: 'changed',
    });
    expect(leaveAsText(pr, nagy)).toEqual({ done: false, why: 'changed' });
    expect(text(pr, elements[0])).toEqual(before);
    // What was only moved by what was written before it is the same text still.
    expect(makeCitation(pr, lord, [{ id: 'r2' }], 'normal')).toEqual({ done: true });
    expect(text(pr, elements[0])).toEqual([
      p(
        t('Truly: It is said (Nagy 1990, 73) and '),
        t('sung', { em: {} }),
        t(' '),
        cited('r2'),
        t('.'),
      ),
    ]);
  });

  it('where the same words stand twice, it is the one with the same words around it', () => {
    const { pr, map, elements } = project([
      p(t('(Nagy 1979) and (Nagy 1979).')),
      p(t('(Nagy 1979) and (Nagy 1979) and (Nagy 1979) and so on.')),
    ]);
    const { places } = gather(pr, map);
    const at = proposed(pr, map, '(Nagy 1979)');
    const words = (n: number) =>
      (pr.fragment(elements[0], 'body')!.get(n) as Y.XmlElement).get(0) as Y.XmlText;
    pr.transact(() => {
      words(0).insert(0, 'So ', {});
      words(1).insert(0, 'So ', {});
    });
    expect(makeCitation(pr, at, [{ id: 'r1' }], 'normal')).toEqual({ done: true });
    expect(text(pr, elements[0])[0]).toEqual(p(t('So '), cited('r1'), t(' and (Nagy 1979).')));
    // Not where several have the same around them: it cannot be told which was meant.
    const among = {
      passage: places[1].id,
      start: 0,
      end: 11,
      text: '(Nagy 1979)',
      around: around(places[1].text, 0, 11),
    };
    expect(makeCitation(pr, among, [{ id: 'r1' }], 'normal')).toEqual({
      done: false,
      why: 'changed',
    });
    expect(
      makeCitation(pr, { ...at, passage: `${elements[0]}/1.99999` }, [{ id: 'r1' }], 'normal'),
    ).toEqual({
      done: false,
      why: 'gone',
    });
  });

  it('left as text, gets a mark that says so, and is not looked at again', () => {
    const { pr, map, elements } = project(plain);
    pr.undoManager.clear();
    const at = proposed(pr, map, '(Nagy 1979, 73)');
    expect(leaveAsText(pr, at, 'normal')).toEqual({ done: true });
    const [paragraph] = text(pr, elements[0]);
    const marked = (paragraph as { content: Inline[] }).content[1];
    expect(marked).toMatchObject({
      kind: 'text',
      text: '(Nagy 1979, 73)',
      marks: { found: { by: 'form', items: [], mode: 'normal', left: true } },
    });
    expect(marked.kind === 'text' ? marked.marks.found : null).toMatchObject({
      id: expect.stringMatching(/^[0-9A-Za-z]{12}$/),
    });
    const after = gather(pr, map);
    expect(after.marked).toEqual([]);
    expect(after.places[0].taken).toEqual([[11, 26]]);
    // It is there no longer to be made a citation, or left again.
    expect(makeCitation(pr, at, [{ id: 'r1' }], 'normal')).toEqual({ done: false, why: 'gone' });
    pr.undo();
    expect(text(pr, elements[0])).toEqual(plain);
  });
});

describe('a citation in a note', () => {
  const C = zotero('c1b2c3d4e5f6');
  const noted: Block[] = [
    p(
      t('The wrath'),
      note(
        t('See '),
        t('Nagy, ', { found: A }),
        t('Best of the Achaeans', { found: A, em: {} }),
        t(', 73', { found: A }),
        t('; but he argues otherwise.'),
      ),
      t(' is sung'),
      note(t('Lord 1960, 12', { found: B }), t('.')),
      t(' and '),
      note(t('As '), { kind: 'math', tex: 'x' }, t(' shows, '), t('Parry 1971', { found: C })),
      t('told.'),
    ),
  ];

  it('the note becomes a citation, with what it said beside its works before and after them', () => {
    const { pr, map, elements } = project(noted);
    pr.undoManager.clear();
    const [first, second] = gather(pr, map).marked;
    expect([first.whole, second.whole]).toEqual([false, true]);
    expect(
      makeCitation(
        pr,
        target(first),
        [
          { id: 'r1', locator: '73', prefix: 'esp.' },
          { id: 'r2', suffix: 'passim' },
        ],
        'normal',
        'note',
      ),
    ).toEqual({ done: true });
    expect(
      makeCitation(pr, target(second), [{ id: 'r3', locator: '12' }], 'normal', 'note'),
    ).toEqual({
      done: true,
    });
    expect(text(pr, elements[0])).toMatchObject([
      {
        content: [
          t('The wrath '),
          {
            kind: 'citation',
            items: [
              { id: 'r1', locator: '73', prefix: 'See esp.' },
              { id: 'r2', suffix: 'passim; but he argues otherwise' },
            ],
            mode: 'normal',
          },
          t(' is sung '),
          cited('r3', { locator: '12' }),
          t(' and '),
          { kind: 'footnote' },
          t('told.'),
        ],
      },
    ]);
    expect(pr.node(elements[0])!.notes).toBe(1);
    pr.undo();
    pr.undo();
    expect(text(pr, elements[0])).toEqual(noted);
  });

  it('not where the note holds what words before and after cannot hold, and the text is left', () => {
    const { pr, map, elements } = project(noted);
    const { places, marked } = gather(pr, map);
    const third = marked[2];
    const place = places.find((x) => x.id === third.passage)!;
    expect(intoCitation(place, third.start, third.end)).toEqual({
      possible: false,
      why: 'The note holds a formula, which the words before and after a work cannot hold.',
    });
    expect(makeCitation(pr, target(third), [{ id: 'r1' }], 'normal', 'note')).toEqual({
      done: false,
      why: 'cannot',
    });
    expect(text(pr, elements[0])).toEqual(noted);
    // Nor where another citation that was found would be lost in the words.
    const two = project([
      p(t('Said'), note(t('Nagy 1979', { found: A }), t('; cf. '), t('Lord 1960', { found: B }))),
    ]);
    const found = gather(two.pr, two.map);
    const can = intoCitation(found.places[1], found.marked[0].start, found.marked[0].end, [
      found.marked[1],
    ]);
    expect(can.possible).toBe(false);
    expect(makeCitation(two.pr, target(found.marked[0]), [{ id: 'r1' }], 'normal', 'note')).toEqual(
      {
        done: false,
        why: 'cannot',
      },
    );
    // One that was left as text is words as other words are.
    leaveAsText(two.pr, target(found.marked[1]));
    expect(makeCitation(two.pr, target(found.marked[0]), [{ id: 'r1' }], 'normal', 'note')).toEqual(
      {
        done: true,
      },
    );
    expect(text(two.pr, two.elements[0])).toEqual([
      p(t('Said '), cited('r1', { suffix: '; cf. Lord 1960' })),
    ]);
    // In the text, there is no note to become one.
    const three = project(wrath);
    const inText = gather(three.pr, three.map);
    expect(intoCitation(inText.places[1], 12, 27).possible).toBe(false);
    // Asked for all the same, the citation stands where the text stood.
    expect(
      makeCitation(three.pr, target(inText.marked[0]), [{ id: 'r1' }], 'normal', 'note'),
    ).toEqual({ done: true });
    expect(text(three.pr, three.elements[0])[1]).toMatchObject({
      content: [t('As was said '), cited('r1'), {}, {}, {}, {}, {}],
    });
  });

  it('the citation stands in the note, which stays a note with what else it says', () => {
    const { pr, map, elements } = project(noted);
    const [first, , third] = gather(pr, map).marked;
    expect(
      makeCitation(pr, target(first), [{ id: 'r1', locator: '73' }], 'normal', 'here'),
    ).toEqual({
      done: true,
    });
    expect(makeCitation(pr, target(third), [{ id: 'r3' }], 'normal')).toEqual({ done: true });
    expect(text(pr, elements[0])).toMatchObject([
      {
        content: [
          t('The wrath'),
          note(t('See '), cited('r1', { locator: '73' }), t('; but he argues otherwise.')),
          t(' is sung'),
          note(t('Lord 1960, 12', { found: B }), t('.')),
          t(' and '),
          note(t('As '), { kind: 'math', tex: 'x' }, t(' shows, '), cited('r3')),
          t('told.'),
        ],
      },
    ]);
    expect(pr.node(elements[0])!.cited).toEqual(['r1', 'r3']);
  });

  it('a note that was proposed as a whole becomes a citation, or holds one', () => {
    const plain: Block[] = [
      p(t('Said'), note(t('See Nagy, Best of the Achaeans, 73.')), t(' and done.')),
    ];
    const one = project(plain);
    const whole = proposed(one.pr, one.map, 'See Nagy, Best of the Achaeans, 73.');
    expect(
      makeCitation(one.pr, whole, [{ id: 'r1', locator: '73', prefix: 'See' }], 'normal', 'note'),
    ).toEqual({ done: true });
    expect(text(one.pr, one.elements[0])).toEqual([
      p(t('Said '), cited('r1', { locator: '73', prefix: 'See' }), t(' and done.')),
    ]);
    const two = project(plain);
    makeCitation(two.pr, whole2(two), [{ id: 'r1' }], 'normal', 'here');
    expect(text(two.pr, two.elements[0])).toEqual([
      p(t('Said'), note(cited('r1')), t(' and done.')),
    ]);
    function whole2(of: typeof two) {
      return proposed(of.pr, of.map, 'See Nagy, Best of the Achaeans, 73.');
    }
  });
});

describe('a citation that was made of a note', () => {
  it('stands apart from the word the note stood close to, and nowhere else', () => {
    const N = (id: string) => note(t('Nagy 1979', { found: zotero(id) }));
    const { pr, map, elements } = project([
      p(
        N('a1b2c3d4e5f6'),
        t('At the start, after room '),
        N('b1b2c3d4e5f6'),
        t(' and ('),
        N('c1b2c3d4e5f6'),
        t(') and close'),
        N('d1b2c3d4e5f6'),
        t('.'),
      ),
    ]);
    const done = makeCitations(
      pr,
      gather(pr, map).marked.map((m) => ({
        target: target(m),
        items: [{ id: 'r1' }],
        mode: 'normal',
        how: 'note',
      })),
    );
    expect(done.every((d) => d.done)).toBe(true);
    expect(text(pr, elements[0])).toEqual([
      p(
        cited('r1'),
        t('At the start, after room '),
        cited('r1'),
        t(' and ('),
        cited('r1'),
        t(') and close '),
        cited('r1'),
        t('.'),
      ),
    ]);
  });
});

describe('while the text is being written in', () => {
  it('the editor that is bound shows the citation, and the undo of the project takes it back', () => {
    const { pr, map, elements } = project(wrath);
    const v = editor(pr.fragment(elements[0], 'body')!);
    expect(v.state.doc.child(1).textContent).toBe(
      'As was said (Nagy 1979, 73) and sung (Lord 1960).',
    );
    pr.undoManager.clear();
    const [first, second] = gather(pr, map).marked;
    expect(makeCitation(pr, target(first), [{ id: 'r1', locator: '73' }], 'normal')).toEqual({
      done: true,
    });
    const shown = v.state.doc.child(1);
    expect(shown.textContent).toBe('As was said  and sung (Lord 1960).');
    expect(shown.child(1).type.name).toBe('citation');
    expect(shown.child(1).attrs).toEqual({ items: [{ id: 'r1', locator: '73' }], mode: 'normal' });
    expect(() => v.state.doc.check()).not.toThrow();
    // The one who writes goes on writing, and the project has both.
    v.dispatch(v.state.tr.insertText('Indeed. ', 10));
    expect(leaveAsText(pr, target(second))).toEqual({ done: true });
    expect(v.state.doc.child(1).textContent).toBe('Indeed. As was said  and sung (Lord 1960).');
    const last = v.state.doc.child(1).child(v.state.doc.child(1).childCount - 2);
    expect(last.marks.find((m) => m.type.name === 'found')?.attrs.left).toBe(true);
    expect(text(pr, elements[0])[1]).toMatchObject({
      content: [t('Indeed. As was said '), cited('r1', { locator: '73' }), {}, {}, {}, {}, t('.')],
    });
    // What the editor holds is what the project holds.
    expect(v.state.doc.eq(nodeOfBody(pr, elements[0]))).toBe(true);
    pr.undo();
    expect(
      v.state.doc.child(1).child(v.state.doc.child(1).childCount - 2).marks[0].attrs.left,
    ).toBe(false);
    pr.undo();
    pr.undo();
    expect(v.state.doc.child(1).textContent).toBe(
      'As was said (Nagy 1979, 73) and sung (Lord 1960).',
    );
    expect(text(pr, elements[0])).toEqual(wrath);
  });

  it('a note becomes a citation under the eyes of the one who writes', () => {
    const { pr, map, elements } = project([
      p(t('Said'), note(t('See '), t('Nagy 1979', { found: A }), t('.')), t(' and done.')),
    ]);
    const v = editor(pr.fragment(elements[0], 'body')!);
    expect(v.state.doc.child(0).child(1).type.name).toBe('footnote');
    const [first] = gather(pr, map).marked;
    expect(makeCitation(pr, target(first), [{ id: 'r1' }], 'normal', 'note')).toEqual({
      done: true,
    });
    expect(v.state.doc.child(0).child(1).type.name).toBe('citation');
    expect(v.state.doc.child(0).child(1).attrs.items).toEqual([{ id: 'r1', prefix: 'See' }]);
    expect(v.state.doc.child(0).textContent).toBe('Said  and done.');
  });
});

/** The text of an element as the editors read it from the project. */
function nodeOfBody(pr: Project, element: string) {
  const body = pr.fragment(element, 'body')!;
  return bodySchema.node(
    'doc',
    null,
    body.toArray().map((block) => nodeOf(block as Y.XmlElement)),
  );
}

describe('while another writes in the same project', () => {
  /** Two who have the same project, and what each writes reaches the other when `meet` is called. */
  function two(blocks: Block[]) {
    const mine = project(blocks);
    const theirs = new Project(null);
    Y.applyUpdate(theirs.doc, Y.encodeStateAsUpdate(mine.pr.doc));
    const meet = () => {
      Y.applyUpdate(
        theirs.doc,
        Y.encodeStateAsUpdate(mine.pr.doc, Y.encodeStateVector(theirs.doc)),
      );
      Y.applyUpdate(
        mine.pr.doc,
        Y.encodeStateAsUpdate(theirs.doc, Y.encodeStateVector(mine.pr.doc)),
      );
    };
    return { ...mine, theirs, meet };
  }
  const words = (pr: Project, element: string, paragraph: number, child = 0) =>
    (pr.fragment(element, 'body')!.get(paragraph) as Y.XmlElement).get(child) as Y.XmlText;

  it('what the other writes elsewhere and in the same paragraph is kept', () => {
    const { pr, map, elements, theirs, meet } = two(wrath);
    const [first] = gather(pr, map).marked;
    // At the same time, neither knowing of the other:
    makeCitation(pr, target(first), [{ id: 'r1', locator: '73' }], 'normal');
    theirs.transact(() => {
      words(theirs, elements[0], 0).insert(7, ' And more before.', {});
      words(theirs, elements[0], 1).insert(0, 'Indeed: ', {});
      words(theirs, elements[0], 2).insert(0, 'Long ', {});
      theirs.setTitle(elements[0], 'Another name');
    });
    meet();
    const mine = text(pr, elements[0]);
    expect(text(theirs, elements[0])).toEqual(mine);
    expect(mine[0]).toEqual(p(t('Before. And more before.')));
    expect(mine[2]).toEqual(p(t('Long After.')));
    expect(mine[1]).toMatchObject({
      content: [
        t('Indeed: As was said '),
        cited('r1', { locator: '73' }),
        t(' and '),
        {},
        {},
        {},
        t('.'),
      ],
    });
    expect(pr.node(elements[0])!.title).toBe('Another name');
    expect(gather(theirs, map).marked.map((m) => m.found.id)).toEqual([B.id]);
    // What the other wrote is not taken back by the undo of the one who made the citation.
    pr.undo();
    meet();
    expect(text(theirs, elements[0])).toEqual(text(pr, elements[0]));
    expect(text(pr, elements[0])[0]).toEqual(p(t('Before. And more before.')));
    expect(gather(pr, map).marked.map((m) => m.text)).toEqual(['(Nagy 1979, 73)', '(Lord 1960)']);
    expect(gather(pr, map).places[1].text).toBe(
      'Indeed: As was said (Nagy 1979, 73) and sung (Lord 1960).',
    );
  });

  it('words the other writes after the citation, in the same line, are not lost', () => {
    const { pr, map, elements, theirs, meet } = two([
      p(t('Said '), t('(Nagy 1979)', { found: A }), t(' and done.')),
    ]);
    const [first] = gather(pr, map).marked;
    makeCitation(pr, target(first), [{ id: 'r1' }], 'normal');
    theirs.transact(() => {
      const line = words(theirs, elements[0], 0);
      line.insert(line.length, ' And more.', {});
    });
    meet();
    expect(text(theirs, elements[0])).toEqual(text(pr, elements[0]));
    const all = gather(pr, map).places[0].text;
    expect(all).toContain('And more.');
    expect(all).toContain('Said ');
    expect(all).toContain(' and done.');
    expect(pr.node(elements[0])!.cited).toEqual(['r1']);
    const v = editor(theirs.fragment(elements[0], 'body')!);
    expect(() => v.state.doc.check()).not.toThrow();
  });

  it('both leave the same as text, or one makes a citation of what the other left, and the project is whole', () => {
    const { pr, map, elements, theirs, meet } = two(wrath);
    const [first, second] = gather(pr, map).marked;
    leaveAsText(pr, target(first));
    leaveAsText(theirs, target(first));
    makeCitation(pr, target(second), [{ id: 'r2' }], 'normal');
    leaveAsText(theirs, target(second));
    meet();
    expect(text(theirs, elements[0])).toEqual(text(pr, elements[0]));
    expect(gather(pr, map).marked).toEqual([]);
    expect(pr.node(elements[0])!.cited).toEqual(['r2']);
    const v = editor(pr.fragment(elements[0], 'body')!);
    expect(() => v.state.doc.check()).not.toThrow();
    expect(v.state.doc.child(1).textContent).toBe('As was said (Nagy 1979, 73) and sung .');
  });
});
