import { describe, expect, it } from 'vitest';
import * as Y from 'yjs';
import { MESSAGE_LENGTH, chatMessageOf } from './changing/chat';
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
});
