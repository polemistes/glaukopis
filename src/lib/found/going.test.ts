import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FoundItem, FoundOptions, Passage, Proposal, Suggestion } from '$lib/api/found';
import { readBody, type Block } from '$lib/project/model/text';
import { Going, type Commands, type Kept } from './going.svelte';
import { note, p, project, t, zotero } from './testing';
import { zoteroKey } from './works';

const sure = (reference: string): Suggestion[] => [
  { reference, sure: 'certain', why: 'the same item in Zotero' },
  { reference: `${reference}-other`, sure: 'possible', why: 'the same author' },
];
const likely = (reference: string): Suggestion[] => [
  { reference, sure: 'likely', why: 'Nagy, 1979' },
];

/**
 * A library that is asked as the commands are. It has the items of Zotero
 * it is given, and takes parentheses with a name and a year for citations,
 * and notes as wholes, as the writer has said.
 */
function library(has: Record<string, Suggestion[]> = {}) {
  const calls = { suggest: 0, propose: 0, options: [] as FoundOptions[] };
  const commands: Commands = {
    suggest: async (items: FoundItem[]) => {
      calls.suggest++;
      return items.map((item) => has[zoteroKey(item.uris?.[0] ?? '') ?? item.key ?? ''] ?? []);
    },
    propose: async (passages: Passage[], options: FoundOptions) => {
      calls.propose++;
      calls.options.push(options);
      const out: Proposal[] = [];
      const taken = (passage: Passage, start: number, end: number) =>
        passage.taken.some(([a, b]) => a < end && start < b);
      for (const passage of passages) {
        if (passage.note && options.notes && !taken(passage, 0, passage.text.length)) {
          out.push({
            passage: passage.id,
            start: 0,
            end: passage.text.length,
            mode: 'normal',
            items: [
              {
                start: 0,
                end: passage.text.length,
                words: passage.text,
                suppressAuthor: false,
                suggestions: [],
              },
            ],
          });
          continue;
        }
        if (!options.years) continue;
        for (const m of passage.text.matchAll(/\(([A-Z][a-z]+) (\d{4})(?:, (\d+))?\)/g)) {
          const start = m.index;
          const end = start + m[0].length;
          if (taken(passage, start, end)) continue;
          out.push({
            passage: passage.id,
            start,
            end,
            mode: 'normal',
            items: [
              {
                start: start + 1,
                end: end - 1,
                words: `${m[1]} ${m[2]}`,
                ...(m[3] ? { locator: m[3] } : {}),
                suppressAuthor: false,
                suggestions: has[m[1]] ?? [],
              },
            ],
          });
        }
      }
      return out;
    },
    draft: async (data) => ({
      key: '',
      type: 'book',
      fields: { title: String(data.title ?? '') },
      names: {},
    }),
  };
  return { commands, calls };
}

const NAGY = zotero('a1b2c3d4e5f6', 'NAGY1979');
const LORD = zotero('b1b2c3d4e5f6', 'LORD1960');
const PARRY = zotero('c1b2c3d4e5f6', 'PARRY971', {
  items: [
    {
      uris: ['http://zotero.org/users/1/items/PARRY971'],
      data: { title: 'The Making of Homeric Verse', author: [{ family: 'Parry' }] },
    },
  ],
});

const wrath: Block[] = [
  p(t('As was said '), t('(Nagy 1979, 73)', { found: NAGY }), t(' and sung (Finley 1954, 12).')),
  p(t('Then '), t('(Lord 1960)', { found: LORD }), t(' and '), t('(Parry 1971)', { found: PARRY })),
];

function going(texts: Block[][], has: Record<string, Suggestion[]>, kept: Partial<Kept> = {}) {
  const made = project(...texts);
  const lib = library(has);
  const cited: string[] = [];
  const remembered: Kept[] = [];
  const g = new Going(made.pr, made.map, {
    commands: lib.commands,
    kept,
    keep: (id) => cited.push(id),
    remember: (k) => remembered.push(k),
  });
  return { ...made, ...lib, g, cited, remembered };
}

const texts = (g: Going) => g.entries.map((e) => e.target.text);
const body = (pr: Parameters<typeof readBody>[0]) => readBody(pr);

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe('what there is to go through', () => {
  it('is what was found, with what the library has for every work', async () => {
    const { g, calls } = going([wrath], {
      NAGY1979: sure('r-nagy'),
      LORD1960: likely('r-lord'),
    });
    await g.open();
    expect(texts(g)).toEqual(['(Nagy 1979, 73)', '(Lord 1960)', '(Parry 1971)']);
    expect(g.entries.map((e) => e.works[0].reference)).toEqual(['r-nagy', 'r-lord', null]);
    expect(g.entries.map((e) => g.sureness(e))).toEqual(['certain', 'likely', 'none']);
    expect(g.entries.map((e) => g.ready(e))).toEqual([true, true, false]);
    expect(g.entries[0].works[0]).toMatchObject({ locator: '73', label: 'page', chosen: false });
    expect(g.certain.map((e) => e.target.text)).toEqual(['(Nagy 1979, 73)']);
    expect(g.current?.target.text).toBe('(Nagy 1979, 73)');
    expect(g.asked).toBe(true);
    // What only looks like a citation is not looked for unless the writer has said so.
    expect(calls).toMatchObject({ suggest: 1, propose: 0 });
  });

  it('begins at the one that was pressed in the text', async () => {
    const { g } = going([wrath], {});
    await g.open(LORD.id);
    expect(g.current?.target.text).toBe('(Lord 1960)');
    expect(g.index).toBe(1);
  });

  it('has what looks like a citation where the writer has said so, in the order of the text', async () => {
    const { g, calls, remembered } = going([wrath], { Finley: likely('r-finley') });
    await g.open();
    await g.take({ years: true });
    expect(calls.options).toEqual([{ years: true, notes: false }]);
    expect(remembered).toEqual([{ years: true, notes: false, inNotes: '' }]);
    expect(texts(g)).toEqual([
      '(Nagy 1979, 73)',
      '(Finley 1954, 12)',
      '(Lord 1960)',
      '(Parry 1971)',
    ]);
    const finley = g.entries[1];
    expect(finley).toMatchObject({ marked: false, by: 'form', note: false });
    expect(finley.works[0]).toMatchObject({
      words: 'Finley 1954',
      locator: '12',
      reference: 'r-finley',
    });
    expect(g.sureness(finley)).toBe('likely');
    // Turned off again, they are no longer there.
    await g.take({ years: false });
    expect(texts(g)).toEqual(['(Nagy 1979, 73)', '(Lord 1960)', '(Parry 1971)']);
  });

  it('says when the library could not be asked, and has what was found all the same', async () => {
    const { g, commands } = going([wrath], {});
    commands.suggest = async () => {
      throw new Error('no library');
    };
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => {});
    await g.open();
    quiet.mockRestore();
    expect(g.failure).toBe('The library could not be asked.');
    expect(texts(g)).toHaveLength(3);
    expect(g.asking).toBe(false);
  });
});

describe('what the writer does', () => {
  it('a citation is made, and the next is shown', async () => {
    const { g, pr, elements, cited } = going([wrath], {
      NAGY1979: sure('r-nagy'),
      LORD1960: likely('r-lord'),
    });
    await g.open();
    g.entries[0].works[0].prefix = 'see';
    expect(g.make()).toBe(true);
    expect(body(pr.fragment(elements[0], 'body')!)[0]).toMatchObject({
      content: [
        t('As was said '),
        {
          kind: 'citation',
          items: [{ id: 'r-nagy', locator: '73', prefix: 'see' }],
          mode: 'normal',
        },
        t(' and sung (Finley 1954, 12).'),
      ],
    });
    expect(cited).toEqual(['r-nagy']);
    expect(texts(g)).toEqual(['(Lord 1960)', '(Parry 1971)']);
    expect(g.current?.target.text).toBe('(Lord 1960)');
    // Not where a work has no reference.
    g.show(g.entries[1].key);
    expect(g.make()).toBe(false);
    expect(texts(g)).toHaveLength(2);
  });

  it('the text is left, and later is on to the next with nothing changed', async () => {
    const { g, pr, elements } = going([wrath], { NAGY1979: sure('r-nagy') });
    await g.open();
    const before = body(pr.fragment(elements[0], 'body')!);
    g.later();
    expect(g.current?.target.text).toBe('(Lord 1960)');
    expect(body(pr.fragment(elements[0], 'body')!)).toEqual(before);
    expect(g.leave()).toBe(true);
    expect(texts(g)).toEqual(['(Nagy 1979, 73)', '(Parry 1971)']);
    expect(g.current?.target.text).toBe('(Parry 1971)');
    // From the last, round to the first; and back.
    g.later();
    expect(g.current?.target.text).toBe('(Nagy 1979, 73)');
    g.move(-1);
    expect(g.current?.target.text).toBe('(Parry 1971)');
  });

  it('what is done is undone as one step each, and what comes back is shown', async () => {
    const { g, pr } = going([wrath], { NAGY1979: sure('r-nagy'), LORD1960: sure('r-lord') });
    pr.undoManager.clear();
    await g.open();
    g.make();
    g.leave();
    expect(texts(g)).toEqual(['(Parry 1971)']);
    pr.undo();
    g.changed();
    expect(texts(g)).toEqual(['(Lord 1960)', '(Parry 1971)']);
    expect(g.current?.target.text).toBe('(Lord 1960)');
    pr.undo();
    g.changed();
    expect(texts(g)).toEqual(['(Nagy 1979, 73)', '(Lord 1960)', '(Parry 1971)']);
    expect(g.current?.target.text).toBe('(Nagy 1979, 73)');
    // The library is asked for what has come back.
    expect(g.entries[0].works[0].reference).toBeNull();
    await vi.advanceTimersByTimeAsync(500);
    expect(g.entries[0].works[0].reference).toBe('r-nagy');
    // Nothing is read anew while nothing has changed.
    const same = g.entries;
    g.changed();
    expect(g.entries).toBe(same);
  });

  it('all that are certain are made at once, and undone as one step', async () => {
    const { g, pr, elements, cited } = going([wrath], {
      NAGY1979: sure('r-nagy'),
      LORD1960: likely('r-lord'),
      PARRY971: sure('r-parry'),
    });
    pr.undoManager.clear();
    await g.open();
    expect(g.certain).toHaveLength(2);
    expect(g.makeCertain()).toBe(2);
    expect(texts(g)).toEqual(['(Lord 1960)']);
    expect(g.current?.target.text).toBe('(Lord 1960)');
    expect(cited).toEqual(['r-nagy', 'r-parry']);
    expect(pr.node(elements[0])!.cited).toEqual(['r-nagy', 'r-parry']);
    expect(pr.undoManager.undoStack.length).toBe(1);
    pr.undo();
    g.changed();
    expect(texts(g)).toHaveLength(3);
    expect(g.makeCertain()).toBe(0);
  });

  it('a reference chosen by the writer is kept when the library is asked again, and is not made at once', async () => {
    const { g } = going([wrath], { NAGY1979: sure('r-nagy') });
    await g.open();
    const [nagy, lord] = g.entries;
    g.choose(nagy.works[0], 'r-nagy-other');
    g.choose(lord.works[0], 'r-mine');
    await g.ask();
    expect(g.entries[0].works[0]).toMatchObject({ reference: 'r-nagy-other', chosen: true });
    expect(g.entries[1].works[0]).toMatchObject({ reference: 'r-mine', chosen: true });
    expect(g.sureness(g.entries[1])).toBe('certain');
    // Certain for the library is what the library said, and nothing else.
    expect(g.certain).toEqual([]);
    g.choose(g.entries[0].works[0], 'r-nagy');
    expect(g.certain).toHaveLength(1);
  });

  it('works are taken out and added', async () => {
    const { g, pr, elements } = going([wrath], { NAGY1979: sure('r-nagy') });
    await g.open();
    const entry = g.entries[0];
    g.add(entry, 'r-added');
    expect(entry.works.map((w) => w.reference)).toEqual(['r-nagy', 'r-added']);
    expect(g.sure(entry)).toBe(false);
    g.remove(entry, entry.works[0]);
    expect(g.make()).toBe(true);
    expect(pr.node(elements[0])!.cited).toEqual(['r-added']);
    // With no work left, there is nothing to make a citation of.
    const next = g.current!;
    g.choose(next.works[0], 'r1');
    g.remove(next, next.works[0]);
    expect(g.ready(next)).toBe(false);
    expect(g.make()).toBe(false);
  });

  it('a work the library does not have is drafted from what the file says, with the key of its item', async () => {
    const { g } = going([wrath], {});
    await g.open();
    const parry = g.entries[2].works[0];
    expect(parry.words).toBe('Parry');
    expect(await g.draft(parry)).toEqual({
      key: '',
      type: 'book',
      fields: { title: 'The Making of Homeric Verse', 'glaukopis-zotero': 'PARRY971' },
      names: {},
    });
    // Of one the file says nothing of, there is nothing to draft.
    expect(await g.draft(g.entries[0].works[0])).toBeNull();
  });
});

describe('text that was proposed', () => {
  const plain: Block[] = [p(t('Said (Nagy 1979, 73) and (Lord 1960) and (Nagy 1979, 73).'))];

  it('is made a citation, and what was proposed after it is where it now stands', async () => {
    const { g, pr, elements, calls } = going(
      [plain],
      { Nagy: likely('r-nagy'), Lord: likely('r-lord') },
      { years: true },
    );
    await g.open();
    expect(texts(g)).toEqual(['(Nagy 1979, 73)', '(Lord 1960)', '(Nagy 1979, 73)']);
    expect(g.make()).toBe(true);
    // At once, before the library has been asked again.
    expect(calls.propose).toBe(1);
    expect(texts(g)).toEqual(['(Lord 1960)', '(Nagy 1979, 73)']);
    expect(g.entries.map((e) => e.target.start)).toEqual([11, 27]);
    expect(g.make()).toBe(true);
    expect(g.make()).toBe(true);
    expect(body(pr.fragment(elements[0], 'body')!)).toMatchObject([
      {
        content: [
          t('Said '),
          { items: [{ id: 'r-nagy', locator: '73' }] },
          t(' and '),
          { items: [{ id: 'r-lord' }] },
          t(' and '),
          { items: [{ id: 'r-nagy', locator: '73' }] },
          t('.'),
        ],
      },
    ]);
    expect(texts(g)).toEqual([]);
    await vi.advanceTimersByTimeAsync(500);
    expect(calls.propose).toBe(2);
    expect(texts(g)).toEqual([]);
  });

  it('left as text, is not proposed again', async () => {
    const { g, pr, map } = going([plain], { Nagy: likely('r-nagy') }, { years: true });
    await g.open();
    g.show(g.entries[1].key);
    expect(g.leave()).toBe(true);
    await g.ask();
    expect(texts(g)).toEqual(['(Nagy 1979, 73)', '(Nagy 1979, 73)']);
    // Another who opens the window later is not asked about it either.
    const later = new Going(pr, map, { commands: library().commands, kept: { years: true } });
    await later.open();
    expect(texts(later)).toEqual(['(Nagy 1979, 73)', '(Nagy 1979, 73)']);
  });

  it('is not changed where the text is no longer what was proposed, and the writer is told', async () => {
    const { g, pr, elements } = going([plain], { Nagy: likely('r-nagy') }, { years: true });
    await g.open();
    const first = g.entries[0];
    // Changed by another while the window was not told.
    const before = pr.revision;
    pr.transact(() => {
      const words = pr.fragment(elements[0], 'body')!.get(0) as import('yjs').XmlElement;
      (words.get(0) as import('yjs').XmlText).delete(6, 4);
    });
    expect(pr.revision).toBeGreaterThan(before);
    const key = first.key;
    expect(g.make(first)).toBe(false);
    expect(g.entries.some((e) => e.key === key)).toBe(false);
    expect(pr.node(elements[0])!.cited).toEqual([]);
    await vi.advanceTimersByTimeAsync(10);
    // Looked at again, what stands there now is proposed.
    expect(texts(g)).toEqual(['(Lord 1960)', '(Nagy 1979, 73)']);
  });
});

describe('a citation in a note', () => {
  const noted: Block[] = [
    p(
      t('The wrath'),
      note(t('See '), t('Nagy 1979, 73', { found: NAGY }), t('; but he argues otherwise.')),
      t(' is sung'),
      note(t('Lord 1960', { found: LORD }), t('.')),
      t(' and told'),
      note(t('As '), { kind: 'math', tex: 'x' }, t(' shows, '), t('Parry 1971', { found: PARRY })),
      t('.'),
    ),
  ];
  const has = { NAGY1979: sure('r-nagy'), LORD1960: sure('r-lord'), PARRY971: sure('r-parry') };

  it('is given as a citation where it is all the note holds, and within the note otherwise', async () => {
    const { g } = going([noted], has);
    await g.open();
    expect(g.entries.map((e) => [e.note, e.whole])).toEqual([
      [true, false],
      [true, true],
      [true, false],
    ]);
    expect(g.entries.map((e) => g.how(e))).toEqual(['here', 'note', 'here']);
    expect(g.can(g.entries[0])).toEqual({
      possible: true,
      before: 'See',
      after: '; but he argues otherwise',
    });
    expect(g.can(g.entries[2])).toMatchObject({ possible: false });
  });

  it('is as the writer chooses, for this one or for all that follow', async () => {
    const { g, pr, elements, remembered } = going([noted], has);
    await g.open();
    g.choice(g.entries[0], 'note', false);
    expect(g.entries.map((e) => g.how(e))).toEqual(['note', 'note', 'here']);
    expect(remembered).toEqual([]);
    g.choice(g.entries[1], 'here', true);
    expect(remembered).toEqual([{ years: false, notes: false, inNotes: 'within' }]);
    // What was chosen for one before gives way to what is said for all.
    expect(g.entries.map((e) => g.how(e))).toEqual(['here', 'here', 'here']);
    g.choice(g.entries[1], 'note', true);
    // Where the note cannot become a citation, the citation stands in the note.
    expect(g.entries.map((e) => g.how(e))).toEqual(['note', 'note', 'here']);
    expect(g.makeCertain()).toBe(3);
    expect(body(pr.fragment(elements[0], 'body')!)).toMatchObject([
      {
        content: [
          t('The wrath'),
          {
            kind: 'citation',
            items: [
              { id: 'r-nagy', locator: '73', prefix: 'See', suffix: '; but he argues otherwise' },
            ],
          },
          t(' is sung'),
          { kind: 'citation', items: [{ id: 'r-lord', locator: '73' }] },
          t(' and told'),
          {
            kind: 'footnote',
            content: [t('As '), { kind: 'math' }, t(' shows, '), { kind: 'citation' }],
          },
          t('.'),
        ],
      },
    ]);
    g.choice(g.entries[0] ?? ({} as never), 'here', false);
    expect(remembered[remembered.length - 1].inNotes).toBe('');
  });

  it('every note is proposed as a whole where the writer has said so', async () => {
    const { g, pr, elements } = going(
      [[p(t('Said'), note(t('See Nagy, Best of the Achaeans, 73.')), t(' and done.'))]],
      {},
      { notes: true },
    );
    await g.open();
    expect(g.entries).toHaveLength(1);
    const entry = g.entries[0];
    expect(entry).toMatchObject({ marked: false, note: true, whole: true });
    expect(g.how(entry)).toBe('note');
    expect(g.ready(entry)).toBe(false);
    g.choose(entry.works[0], 'r-nagy');
    entry.works[0].prefix = 'See';
    entry.works[0].locator = '73';
    expect(g.make()).toBe(true);
    expect(body(pr.fragment(elements[0], 'body')!)).toEqual([
      p(
        t('Said'),
        {
          kind: 'citation',
          items: [{ id: 'r-nagy', locator: '73', prefix: 'See' }],
          mode: 'normal',
        },
        t(' and done.'),
      ),
    ]);
  });
});
