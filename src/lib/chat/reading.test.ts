import { describe, expect, it } from 'vitest';
import type { ChatMessage } from '$lib/project/model/types';
import {
  arrivals,
  chipsOf,
  firstWords,
  groups,
  markOf,
  nearest,
  placed,
  readersOf,
  readMark,
  sameMark,
  toTell,
  unread,
  within,
  TOGETHER,
} from './reading';

const hector = { id: 'hector', name: 'Hector' };
const andromache = { id: 'andromache', name: 'Andromache' };

/** A message written at a moment given in minutes after a morning. */
function said(id: string, author: ChatMessage['author'], minutes: number, text = id): ChatMessage {
  const created = new Date(2026, 10, 13, 9, 0, 0).getTime() + minutes * 60_000;
  return { id, author, created: new Date(created).toISOString(), text };
}

describe('what is unread', () => {
  const messages = [
    said('a', hector, 0),
    said('b', andromache, 1),
    said('c', hector, 2),
    said('d', andromache, 3),
  ];

  it('with no mark, every message of another', () => {
    expect(unread(messages, null, 'hector').map((m) => m.id)).toEqual(['b', 'd']);
  });

  it('those of others after the message read last', () => {
    expect(unread(messages, markOf(messages.slice(0, 2)), 'hector').map((m) => m.id)).toEqual([
      'd',
    ]);
    expect(unread(messages, markOf(messages), 'hector')).toEqual([]);
  });

  it('where the message read last was taken back, those written after it', () => {
    const gone = { id: 'gone', created: messages[1].created };
    expect(unread(messages, gone, 'hector').map((m) => m.id)).toEqual(['d']);
  });

  it('never one’s own', () => {
    expect(unread(messages, null, 'andromache').map((m) => m.id)).toEqual(['a', 'c']);
  });

  it('reads a mark as it was kept, with care', () => {
    expect(readMark({ id: 'a', created: '2026-11-13T09:00:00Z' })).toEqual({
      id: 'a',
      created: '2026-11-13T09:00:00Z',
    });
    expect(readMark({ id: 7 })).toBeNull();
    expect(readMark('a')).toBeNull();
    expect(sameMark(readMark({ id: 'a', created: 'x' }), { id: 'a', created: 'x' })).toBe(true);
  });
});

describe('what is told as it arrives', () => {
  it('the unread ones of others, each once', () => {
    const told = new Set<string>();
    const first = [said('a', andromache, 0), said('b', hector, 1)];
    expect(toTell(first, null, 'hector', told).map((m) => m.id)).toEqual(['a']);
    expect(toTell(first, null, 'hector', told)).toEqual([]);
    const more = [...first, said('c', andromache, 2), said('d', andromache, 3)];
    expect(toTell(more, null, 'hector', told).map((m) => m.id)).toEqual(['c', 'd']);
  });

  it('nothing of what was read', () => {
    const messages = [said('a', andromache, 0), said('b', andromache, 1)];
    expect(toTell(messages, markOf(messages), 'hector', new Set())).toEqual([]);
  });
});

describe('messages that stand together', () => {
  it('of one person within a few minutes, under one name', () => {
    const all = groups(
      [
        said('a', hector, 0),
        said('b', hector, 2),
        said('c', andromache, 3),
        said('d', hector, 4),
        said('e', hector, 4 + TOGETHER / 60_000 + 1),
      ],
      'hector',
    );
    expect(all.map((g) => g.messages.map((m) => m.id))).toEqual([['a', 'b'], ['c'], ['d'], ['e']]);
    expect(all.map((g) => g.mine)).toEqual([true, false, true, true]);
    expect(all.map((g) => g.author.name)).toEqual(['Hector', 'Andromache', 'Hector', 'Hector']);
  });

  it('a line with the date where the day changes', () => {
    const all = groups(
      [said('a', hector, 0), said('b', andromache, 1), said('c', andromache, 24 * 60)],
      'hector',
    );
    expect(all.map((g) => !!g.day)).toEqual([true, false, true]);
    expect(all[2].messages.map((m) => m.id)).toEqual(['c']);
  });

  it('a person known only by name is told apart by the name', () => {
    const all = groups(
      [said('a', { id: '', name: 'Paris' }, 0), said('b', { id: '', name: 'Helen' }, 1)],
      null,
    );
    expect(all).toHaveLength(2);
    expect(all.every((g) => !g.mine)).toBe(true);
  });
});

describe('the first words of a message', () => {
  it('on one line', () => {
    expect(firstWords('Are you\nthere?')).toBe('Are you there?');
  });

  it('cut at a word, with an ellipsis', () => {
    const long = 'Sing, goddess, the wrath of Peleus’ son Achilles, the ruinous wrath that brought';
    const words = firstWords(long, 40);
    expect(words.endsWith('…')).toBe(true);
    expect(words.length).toBeLessThanOrEqual(41);
    expect(long.startsWith(words.slice(0, -1))).toBe(true);
  });
});

/** An answer to a message, written at a moment given in minutes after a morning. */
const answer = (id: string, author: ChatMessage['author'], minutes: number, to: string) => ({
  ...said(id, author, minutes),
  to,
});

/** The entries of the list, each as the ids of its messages and of the groups of its answers. */
const shape = (entries: ReturnType<typeof placed>) =>
  entries.map((e) => ({
    group: e.group?.messages.map((m) => m.id) ?? null,
    answers: e.answers.map((g) => g.messages.map((m) => m.id)),
  }));

describe('where each answer stands', () => {
  it('under the message it answers, however old, after the answers there', () => {
    const entries = placed(
      [
        said('a', hector, 0),
        said('b', andromache, 30),
        answer('c', andromache, 40, 'a'),
        said('d', hector, 50),
        answer('e', hector, 60, 'a'),
      ],
      'hector',
    );
    expect(shape(entries)).toEqual([
      { group: ['a'], answers: [['c'], ['e']] },
      { group: ['b'], answers: [] },
      { group: ['d'], answers: [] },
    ]);
  });

  it('an answer to an answer from a copy gone wrong, under the first', () => {
    const entries = placed(
      [said('a', hector, 0), answer('b', andromache, 1, 'a'), answer('c', hector, 2, 'b')],
      'hector',
    );
    expect(shape(entries)).toEqual([{ group: ['a'], answers: [['b'], ['c']] }]);
  });

  it('a message with answers ends its group under one name', () => {
    const entries = placed(
      [
        said('a', hector, 0),
        said('b', hector, 1),
        answer('c', andromache, 2, 'b'),
        said('d', hector, 3),
      ],
      'hector',
    );
    expect(shape(entries)).toEqual([
      { group: ['a', 'b'], answers: [['c']] },
      { group: ['d'], answers: [] },
    ]);
    expect(entries[0].answered).toBe('b');
  });

  it('answers of one person written together stand under one name', () => {
    const entries = placed(
      [
        said('a', hector, 0),
        answer('b', andromache, 1, 'a'),
        answer('c', andromache, 2, 'a'),
        answer('d', hector, 3, 'a'),
      ],
      'hector',
    );
    expect(shape(entries)).toEqual([{ group: ['a'], answers: [['b', 'c'], ['d']] }]);
  });

  it('an answer written on another day than its line says its date', () => {
    const entries = placed(
      [
        said('a', hector, 0),
        answer('b', andromache, 2, 'a'),
        answer('c', andromache, 24 * 60, 'a'),
      ],
      'hector',
    );
    expect(entries[0].answers.map((g) => g.dated)).toEqual([false, true]);
    expect(entries.map((e) => !!e.day)).toEqual([true]);
  });

  it('the answers of a message taken back together, where the first of them stood', () => {
    const entries = placed(
      [
        said('a', hector, 0),
        answer('b', andromache, 1, 'gone'),
        said('c', hector, 2),
        answer('d', hector, 3, 'gone'),
      ],
      'hector',
    );
    expect(shape(entries)).toEqual([
      { group: ['a'], answers: [] },
      { group: null, answers: [['b'], ['d']] },
      { group: ['c'], answers: [] },
    ]);
    expect(entries[1].answered).toBe('gone');
  });

  it('a ring of answers, as a copy gone wrong may make, as messages that answer none', () => {
    const entries = placed([answer('a', hector, 0, 'b'), answer('b', hector, 1, 'a')], 'hector');
    expect(shape(entries)).toEqual([{ group: ['a', 'b'], answers: [] }]);
  });
});

describe('who has read a message', () => {
  const messages = [said('a', hector, 0), said('b', andromache, 1), said('c', hector, 2)];
  const reader = (id: string, name: string, read: ChatMessage) => ({
    id,
    name,
    read: { id: read.id, created: read.created },
    when: '',
  });

  it('those whose mark is that message or one after it, not its writer nor oneself', () => {
    const by = readersOf(
      messages,
      [reader('andromache', 'Andromache', messages[1]), reader('paris', 'Paris', messages[2])],
      'hector',
    );
    expect(by.get('a')!.map((r) => r.id)).toEqual(['andromache', 'paris']);
    expect(by.get('b')!.map((r) => r.id)).toEqual(['paris']);
    expect(by.get('c')!.map((r) => r.id)).toEqual(['paris']);
    const mine = readersOf(messages, [reader('hector', 'Hector', messages[2])], 'hector');
    expect(mine.size).toBe(0);
  });

  it('by when it was written, where the message of the mark was taken back', () => {
    const gone = { ...said('x', hector, 1), id: 'gone' };
    const by = readersOf(messages, [reader('paris', 'Paris', gone)], 'hector');
    expect([...by.keys()]).toEqual(['a', 'b']);
  });
});

describe('the reactions to a message', () => {
  it('as chips, one for each emoji, counted, with whether one’s own is among them', () => {
    const r = (message: string, person: string, emoji: string) => ({
      message,
      person: { id: person, name: person.toUpperCase() },
      emoji,
      when: '',
    });
    const chips = chipsOf(
      [r('a', 'hector', '👍'), r('a', 'paris', '👍'), r('a', 'paris', '🎉'), r('b', 'paris', '👍')],
      'hector',
    );
    expect(chips.get('a')).toEqual([
      { emoji: '👍', count: 2, names: ['HECTOR', 'PARIS'], mine: true },
      { emoji: '🎉', count: 1, names: ['PARIS'], mine: false },
    ]);
    expect(chips.get('b')![0].mine).toBe(false);
  });
});

describe('what is new', () => {
  it('what arrived of others, and whether one of one’s own is among it', () => {
    const messages = [said('a', hector, 0), said('b', andromache, 1), said('c', andromache, 2)];
    expect(arrivals(messages, new Set(['a']), 'hector')).toEqual({
      theirs: ['b', 'c'],
      mine: false,
    });
    expect(
      arrivals([...messages, said('d', hector, 3)], new Set(['a', 'b', 'c']), 'hector'),
    ).toEqual({ theirs: [], mine: true });
  });

  it('of what is not seen, the nearest to what is shown, and which way', () => {
    const view = { top: 100, bottom: 300 };
    expect(within({ top: 290, bottom: 320 }, view)).toBe(true);
    expect(within({ top: 300, bottom: 320 }, view)).toBe(false);
    expect(
      nearest(
        [
          { id: 'far-up', top: 0, bottom: 20 },
          { id: 'up', top: 60, bottom: 90 },
          { id: 'down', top: 400, bottom: 420 },
        ],
        view,
      ),
    ).toEqual({ id: 'up', up: true });
    expect(nearest([{ id: 'down', top: 310, bottom: 330 }], view)).toEqual({
      id: 'down',
      up: false,
    });
    expect(nearest([], view)).toBeNull();
  });
});
