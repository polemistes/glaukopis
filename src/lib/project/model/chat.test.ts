import { describe, expect, it } from 'vitest';
import * as Y from 'yjs';
import {
  MESSAGE_LENGTH,
  QUOTE_LENGTH,
  chatMessageOf,
  chatQuoteOf,
  chatReactionOf,
  isEmoji,
  reactionKey,
} from './changing/chat';
import { Project } from './project.svelte';
import { PROJECT } from './types';

/** A project begun, written in by one person. */
function project(who = { id: 'hector', name: 'Hector' }) {
  const p = new Project(null);
  p.begin('Wrath');
  p.setMe(who);
  return p;
}

/** Two copies of one project, each written in by its own person, and how they see each other's changes. */
function two() {
  const a = project({ id: 'hector', name: 'Hector' });
  const b = new Project(null);
  b.load(Y.encodeStateAsUpdate(a.doc), []);
  b.setMe({ id: 'andromache', name: 'Andromache' });
  const sync = () => {
    Y.applyUpdate(b.doc, Y.encodeStateAsUpdate(a.doc, Y.encodeStateVector(b.doc)), 'remote');
    Y.applyUpdate(a.doc, Y.encodeStateAsUpdate(b.doc, Y.encodeStateVector(a.doc)), 'remote');
  };
  return { a, b, sync };
}

const texts = (p: Project) => p.chat.map((m) => m.text);

describe('the chat of a project', () => {
  it('keeps what is said, trimmed, with who said it and when', () => {
    const p = project();
    const id = p.say('  Shall we go on with the second book?\n\n')!;
    expect(p.chat).toEqual([
      {
        id,
        author: { id: 'hector', name: 'Hector' },
        created: expect.stringMatching(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/),
        text: 'Shall we go on with the second book?',
      },
    ]);
  });

  it('keeps the line breaks within a message', () => {
    const p = project();
    p.say('First line\nsecond line');
    expect(texts(p)).toEqual(['First line\nsecond line']);
  });

  it('says nothing for an empty message', () => {
    const p = project();
    expect(p.say('   \n ')).toBeNull();
    expect(p.chat).toEqual([]);
    expect(p.yChat.length).toBe(0);
  });

  it('cuts a message that is too long', () => {
    const p = project();
    p.say('a'.repeat(5000));
    expect(p.chat[0].text).toHaveLength(MESSAGE_LENGTH);
  });

  it('cuts by characters, not by halves of them', () => {
    const p = project();
    p.say('𝔄'.repeat(4001));
    expect([...p.chat[0].text]).toHaveLength(MESSAGE_LENGTH);
  });

  it('takes back one’s own message, and only that', () => {
    const { a, b, sync } = two();
    const mine = a.say('Mine')!;
    const theirs = b.say('Theirs')!;
    sync();
    expect(a.unsay(theirs)).toBeNull();
    expect(texts(a)).toHaveLength(2);
    expect(a.unsay(mine)).toMatchObject({ message: { text: 'Mine' } });
    sync();
    expect(texts(a)).toEqual(['Theirs']);
    expect(texts(b)).toEqual(['Theirs']);
  });

  it('puts a message taken back where it stood', () => {
    const p = project();
    p.say('One');
    const two = p.say('Two')!;
    p.say('Three');
    const taken = p.unsay(two)!;
    expect(texts(p)).toEqual(['One', 'Three']);
    p.resay(taken);
    expect(texts(p)).toEqual(['One', 'Two', 'Three']);
    // Not twice.
    p.resay(taken);
    expect(texts(p)).toEqual(['One', 'Two', 'Three']);
  });

  it('deletes the whole conversation', () => {
    const { a, b, sync } = two();
    a.say('One');
    b.say('Two');
    sync();
    b.clearChat();
    sync();
    expect(a.chat).toEqual([]);
    expect(b.chat).toEqual([]);
  });

  it('reaches the other copy, in the same order on both', () => {
    const { a, b, sync } = two();
    a.say('Are you there?');
    sync();
    expect(texts(b)).toEqual(['Are you there?']);
    b.say('Yes.');
    sync();
    a.say('Good.');
    b.say('What now?');
    sync();
    expect(texts(a)).toEqual(texts(b));
    expect(texts(a).slice(0, 2)).toEqual(['Are you there?', 'Yes.']);
    expect(texts(a)).toHaveLength(4);
    expect(b.chat[0].author).toEqual({ id: 'hector', name: 'Hector' });
  });

  it('is there for whoever opens the project later', () => {
    const p = project();
    p.say('For tomorrow.');
    const later = new Project(null);
    later.load(Y.encodeStateAsUpdate(p.doc), []);
    expect(texts(later)).toEqual(['For tomorrow.']);
  });

  it('is never undone, and leaves undo as it was', () => {
    const p = project();
    const a = p.addChild(PROJECT, { title: 'A' })!;
    p.checkpoint();
    p.setTitle(a, 'B');
    p.checkpoint();
    const steps = p.undoManager.undoStack.length;
    const id = p.say('Hello')!;
    p.say('Again');
    p.unsay(id);
    expect(p.undoManager.undoStack.length).toBe(steps);
    p.undo();
    expect(p.node(a)!.title).toBe('A');
    expect(texts(p)).toEqual(['Again']);
    p.undo();
    p.undo();
    expect(texts(p)).toEqual(['Again']);
    p.redo();
    expect(texts(p)).toEqual(['Again']);
  });

  it('reads a message of another copy with care', () => {
    expect(chatMessageOf({ text: 'Hi', author: 'nobody', created: 7 })).toEqual({
      id: '',
      author: { id: '', name: '' },
      created: '',
      text: 'Hi',
    });
    expect(chatMessageOf({ id: 'x' })).toBeNull();
    expect(chatMessageOf(null)).toBeNull();
    const p = project();
    p.yChat.push([{ nonsense: true } as never, { id: 'm', text: 'Read' } as never]);
    expect(texts(p)).toEqual(['Read']);
  });

  it('places an answer, and an answer to an answer, under the first message', () => {
    const p = project();
    const first = p.say('Shall we begin?')!;
    const answer = p.say('Yes.', first)!;
    const again = p.say('Now?', answer)!;
    expect(p.chat.find((m) => m.id === answer)!.to).toBe(first);
    expect(p.chat.find((m) => m.id === again)!.to).toBe(first);
    expect(p.chat.find((m) => m.id === first)!.to).toBeUndefined();
  });

  it('says an answer to a message that is not there as one that answers none', () => {
    const p = project();
    const id = p.say('Hello', 'gone')!;
    expect(p.chat[0].id).toBe(id);
    expect('to' in p.chat[0]).toBe(false);
  });

  it('keeps the marks of the words, and cuts them with the words', () => {
    const p = project();
    p.say({ text: '  Bold and plain ', marks: [{ from: 2, to: 6, mark: 'strong' }] });
    expect(p.chat[0]).toMatchObject({
      text: 'Bold and plain',
      marks: [{ from: 0, to: 4, mark: 'strong' }],
    });
    p.say({
      text: 'a'.repeat(5000),
      marks: [
        { from: 3990, to: 4100, mark: 'em' },
        { from: 4500, to: 4600, mark: 'code' },
      ],
    });
    expect(p.chat[1].text).toHaveLength(MESSAGE_LENGTH);
    expect(p.chat[1].marks).toEqual([{ from: 3990, to: MESSAGE_LENGTH, mark: 'em' }]);
  });

  it('changes one’s own message where it stands, keeping who wrote it, when and what it answers', () => {
    const p = project();
    const first = p.say('One')!;
    const answer = p.say('Tow', first)!;
    p.say('Three');
    const before = p.chat.find((m) => m.id === answer)!;
    expect(p.reword(answer, { text: 'Two', marks: [{ from: 0, to: 3, mark: 'em' }] })).toBe(true);
    expect(texts(p)).toEqual(['One', 'Two', 'Three']);
    const after = p.chat[1];
    expect(after).toMatchObject({
      id: answer,
      author: before.author,
      created: before.created,
      to: first,
      marks: [{ from: 0, to: 3, mark: 'em' }],
    });
    expect(after.edited).toMatch(/^\d{4}-/);
  });

  it('changes nothing where nothing differs, or the words would be empty', () => {
    const p = project();
    const id = p.say({ text: 'Same', marks: [{ from: 0, to: 4, mark: 'strong' }] })!;
    expect(p.reword(id, { text: 'Same', marks: [{ from: 0, to: 4, mark: 'strong' }] })).toBe(false);
    expect(p.reword(id, '   ')).toBe(false);
    expect(p.chat[0].edited).toBeUndefined();
  });

  it('refuses to change another’s message', () => {
    const { a, b, sync } = two();
    const theirs = b.say('Theirs')!;
    sync();
    expect(a.reword(theirs, 'Mine now')).toBe(false);
    expect(texts(a)).toEqual(['Theirs']);
  });

  it('reaches the other copy as one message, changed', () => {
    const { a, b, sync } = two();
    const id = a.say('Frist')!;
    sync();
    a.reword(id, 'First');
    sync();
    expect(texts(b)).toEqual(['First']);
    expect(b.chat[0].id).toBe(id);
  });

  it('reads the copy changed last where a message was changed on two computers at once', () => {
    const { a, b, sync } = two();
    const id = a.say('Frist')!;
    sync();
    // The same person on another computer: the second copy writes as the first.
    b.setMe({ id: 'hector', name: 'Hector' });
    a.reword(id, 'First');
    b.reword(id, 'Fist');
    // The second is changed later.
    const index = b.yChat.toArray().findIndex((m) => m.id === id);
    b.doc.transact(() => {
      const m = b.yChat.get(index);
      b.yChat.delete(index, 1);
      b.yChat.insert(index, [{ ...m, edited: '2999-01-01T00:00:00Z' }]);
    });
    sync();
    expect(a.yChat.length).toBe(2);
    expect(texts(a)).toEqual(['Fist']);
    expect(texts(b)).toEqual(['Fist']);
  });

  it('keeps how far each has read, for both copies', () => {
    const { a, b, sync } = two();
    const id = a.say('Read me')!;
    sync();
    const created = b.chat[0].created;
    b.markChatRead({ id, created });
    a.markChatRead({ id, created });
    sync();
    const readers = (p: Project) =>
      p.chatReaders.map((r) => [r.id, r.name, r.read.id]).sort((x, y) => (x[0] < y[0] ? -1 : 1));
    expect(readers(a)).toEqual([
      ['andromache', 'Andromache', id],
      ['hector', 'Hector', id],
    ]);
    expect(readers(b)).toEqual(readers(a));
  });

  it('writes how far one has read only where it differs', () => {
    const p = project();
    const id = p.say('Once')!;
    const created = p.chat[0].created;
    p.markChatRead({ id, created });
    let writes = 0;
    p.yChatRead.observe(() => writes++);
    p.markChatRead({ id, created });
    expect(writes).toBe(0);
  });

  it('keeps the reactions of two copies to one message given at once, and takes one’s own back', () => {
    const { a, b, sync } = two();
    const id = a.say('Good news')!;
    sync();
    a.react(id, '👍');
    b.react(id, '👍');
    b.react(id, '🎉');
    sync();
    const of = (p: Project) => p.chatReactions.map((r) => `${r.person.id}:${r.emoji}`).sort();
    expect(of(a)).toEqual(['andromache:🎉', 'andromache:👍', 'hector:👍']);
    expect(of(b)).toEqual(of(a));
    expect(b.react(id, '👍')).toBe(false);
    sync();
    expect(of(a)).toEqual(['andromache:🎉', 'hector:👍']);
  });

  it('keeps the reactions of a message taken back, so that they come back with it', () => {
    const p = project();
    const id = p.say('Oops')!;
    p.react(id, '😀');
    const taken = p.unsay(id)!;
    expect(p.chatReactions).toHaveLength(1);
    p.resay(taken);
    expect(p.chatReactions.map((r) => r.message)).toEqual([id]);
  });

  it('reads with care what another copy wrote: marks, kinds and reactions', () => {
    expect(
      chatMessageOf({
        id: 'm',
        text: 'Four',
        to: 5,
        edited: '',
        marks: [
          { from: 0, to: 2, mark: 'strong' },
          { from: 2, to: 9, mark: 'em' },
          { from: 1, to: 2, mark: 'blink' },
          { from: 3, to: 3, mark: 'code' },
          { from: 'a', to: 2, mark: 'em' },
          null,
        ],
      }),
    ).toEqual({
      id: 'm',
      author: { id: '', name: '' },
      created: '',
      text: 'Four',
      marks: [{ from: 0, to: 2, mark: 'strong' }],
    });
    expect(chatMessageOf({ text: 'x', marks: 'bold' })).not.toHaveProperty('marks');
    expect(isEmoji('👍')).toBe(true);
    expect(isEmoji('🏳️‍🌈')).toBe(true);
    expect(isEmoji('1️⃣')).toBe(true);
    expect(isEmoji('a')).toBe(false);
    expect(isEmoji('👍 and words that go on')).toBe(false);
    expect(isEmoji(7)).toBe(false);
    expect(chatReactionOf(reactionKey('m', 'p', 'yes'), {})).toBeNull();
    expect(chatReactionOf('not json', {})).toBeNull();
    expect(chatReactionOf(reactionKey('m', 'p', '👍'), 'nonsense')).toEqual({
      message: 'm',
      person: { id: 'p', name: '' },
      emoji: '👍',
      when: '',
    });
    const p = project();
    p.yChatReactions.set(reactionKey('m', 'p', 'no'), { name: 'P' });
    p.yChatRead.set('q', { name: 'Q' });
    expect(p.chatReactions).toEqual([]);
    expect(p.chatReaders).toEqual([]);
  });

  it('deletes who has read and the reactions with the conversation', () => {
    const { a, b, sync } = two();
    const id = a.say('One')!;
    sync();
    b.react(id, '👍');
    b.markChatRead({ id, created: b.chat[0].created });
    sync();
    a.clearChat();
    sync();
    for (const p of [a, b]) {
      expect(p.chat).toEqual([]);
      expect(p.chatReaders).toEqual([]);
      expect(p.chatReactions).toEqual([]);
    }
  });

  it('keeps words quoted at the top of a message, for the other copy too', () => {
    const { a, b, sync } = two();
    const first = a.say('Sing, goddess, the wrath of Achilles')!;
    sync();
    const id = b.say('Why the wrath?', undefined, { id: first, text: '  the wrath  ' })!;
    sync();
    expect(a.chat.find((m) => m.id === id)).toMatchObject({
      text: 'Why the wrath?',
      quote: { id: first, text: 'the wrath' },
    });
    expect('to' in a.chat[1]).toBe(false);
    // An answer that quotes, and one without words, which is not said.
    const answer = b.say('And whose?', first, { id: first, text: 'Achilles' })!;
    expect(b.chat.find((m) => m.id === answer)).toMatchObject({
      to: first,
      quote: { id: first, text: 'Achilles' },
    });
    expect(b.say('  ', first, { id: first, text: 'Achilles' })).toBeNull();
    expect(b.chat).toHaveLength(3);
  });

  it('keeps the words quoted when the message is changed', () => {
    const p = project();
    const first = p.say('Sing, goddess')!;
    const id = p.say('Wich goddess?', undefined, { id: first, text: 'goddess' })!;
    expect(p.reword(id, 'Which goddess?')).toBe(true);
    expect(p.chat[1]).toMatchObject({
      text: 'Which goddess?',
      quote: { id: first, text: 'goddess' },
    });
  });

  it('reads a quote with care: none that is no object or has no words, a long one cut', () => {
    const read = (quote: unknown) => chatMessageOf({ id: 'm', text: 'Yes', quote })?.quote;
    expect(read('the wrath')).toBeUndefined();
    expect(read(null)).toBeUndefined();
    expect(read({ id: 'q', text: '   ' })).toBeUndefined();
    expect(read({ id: 'q' })).toBeUndefined();
    expect(read({ id: 7, text: 'Words' })).toEqual({ id: '', text: 'Words' });
    const long = read({ id: 'q', text: 'w'.repeat(800) })!;
    expect([...long.text]).toHaveLength(QUOTE_LENGTH);
    expect(long.text.endsWith('w…')).toBe(true);
    expect(chatQuoteOf({ id: 'q', text: 'short' })).toEqual({ id: 'q', text: 'short' });
  });

  it('takes one’s own mark of reading out, and only one’s own', () => {
    const { a, b, sync } = two();
    const id = a.say('Read me')!;
    sync();
    const created = b.chat[0].created;
    a.markChatRead({ id, created });
    b.markChatRead({ id, created });
    sync();
    b.unmarkChatRead();
    sync();
    expect(a.chatReaders.map((r) => r.id)).toEqual(['hector']);
    expect(b.chatReaders.map((r) => r.id)).toEqual(['hector']);
    // Nothing is written where there is nothing to take out.
    let writes = 0;
    b.yChatRead.observe(() => writes++);
    b.unmarkChatRead();
    expect(writes).toBe(0);
  });

  it('is not undone in the text: no answer, change, mark of reading or reaction', () => {
    const p = project();
    const a = p.addChild(PROJECT, { title: 'A' })!;
    p.checkpoint();
    p.setTitle(a, 'B');
    p.checkpoint();
    const steps = p.undoManager.undoStack.length;
    const id = p.say('Hello')!;
    const answer = p.say('Again', id)!;
    p.reword(answer, 'Once again');
    p.react(id, '👍');
    p.markChatRead({ id: answer, created: p.chat[1].created });
    expect(p.undoManager.undoStack.length).toBe(steps);
    p.undo();
    p.undo();
    expect(texts(p)).toEqual(['Hello', 'Once again']);
    expect(p.chatReactions).toHaveLength(1);
    expect(p.chatReaders).toHaveLength(1);
  });
});
