import { describe, expect, it } from 'vitest';
import type { ChatMessage } from '$lib/project/model/types';
import {
  firstWords,
  groups,
  markOf,
  readMark,
  sameMark,
  toTell,
  unread,
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
