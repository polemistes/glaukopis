/**
 * Changing the chat of a project (records 0092 and 0107): saying something,
 * perhaps as an answer to another message, perhaps quoting words of one;
 * changing one's own message, and taking it back; marking how far one has
 * read, or taking that mark out; reacting to a message with an emoji; and
 * deleting the whole conversation. These are methods of
 * `Project`, which takes them in (see there).
 *
 * The messages are an array of plain objects in the project's document,
 * `chat`; who has read what is a map of its own, `chatRead`, by the person;
 * the reactions another, `chatReactions`, one entry for each person's one
 * emoji on one message, so that two who react at once both stay. All three
 * reach the others as every other change does, and are there for whoever
 * opens the project later. What is done here is outside undo: by its own
 * origin (`CHAT`), and since none of the three is in the scope of the undo
 * manager at all. A message is its author's: only they change it or take it
 * back.
 */

import { newId } from '$lib/util/id';
import { CHAT, nowIso, str } from '../origins';
import type { Project } from '../project.svelte';
import type {
  ChatMark,
  ChatMarkKind,
  ChatMessage,
  ChatQuote,
  ChatReaction,
  ChatReader,
  ChatWords,
} from '../types';

/** The most characters a message holds: what is longer is cut. */
export const MESSAGE_LENGTH = 4000;

/** The most characters of words quoted: what is longer is cut, with an ellipsis. */
export const QUOTE_LENGTH = 500;

/** The ways a stretch of a message can be set, in the order a message's marks are kept. */
export const CHAT_MARKS: readonly ChatMarkKind[] = ['strong', 'em', 'underline', 'strike', 'code'];

/** Who writes here, as a message names them. */
function author(p: Project): ChatMessage['author'] {
  return { id: p.me?.id ?? '', name: p.me?.name ?? '' };
}

/** A message as it is to be kept: trimmed, and cut where it is too long. */
export function cleanMessage(text: string): string {
  return cleanWords({ text }).text;
}

/**
 * Marks in order and as few as can say them: each within the words and not
 * empty, of a known kind, those of one kind that touch or overlap made one.
 */
export function tidyMarks(marks: readonly ChatMark[], length: number): ChatMark[] {
  const out: ChatMark[] = [];
  for (const kind of CHAT_MARKS) {
    const spans = marks
      .filter((m) => m.mark === kind)
      .map((m) => ({ from: Math.max(0, m.from), to: Math.min(length, m.to) }))
      .filter((m) => m.from < m.to)
      .sort((a, b) => a.from - b.from);
    for (const span of spans) {
      const last = out[out.length - 1];
      if (last && last.mark === kind && span.from <= last.to) last.to = Math.max(last.to, span.to);
      else out.push({ ...span, mark: kind });
    }
  }
  return out.sort(
    (a, b) => a.from - b.from || CHAT_MARKS.indexOf(a.mark) - CHAT_MARKS.indexOf(b.mark),
  );
}

/**
 * The words of a message as they are to be kept: trimmed, and cut at
 * `MESSAGE_LENGTH` characters where they are longer, the marks with them.
 */
export function cleanWords(what: string | ChatWords): ChatWords {
  const words = typeof what === 'string' ? { text: what } : what;
  const start = words.text.length - words.text.trimStart().length;
  let text = words.text.trim();
  const signs = [...text];
  if (signs.length > MESSAGE_LENGTH) text = signs.slice(0, MESSAGE_LENGTH).join('').trimEnd();
  const marks = tidyMarks(
    (words.marks ?? []).map((m) => ({ ...m, from: m.from - start, to: m.to - start })),
    text.length,
  );
  return marks.length ? { text, marks } : { text };
}

/**
 * Words quoted, from what may be a quote (record 0107, added to): the id of
 * the message they are from, and the words, trimmed, cut with an ellipsis
 * where they are longer than `QUOTE_LENGTH`. Nothing where it is no object
 * or has no words; another copy may have written anything there.
 */
export function chatQuoteOf(value: unknown): ChatQuote | null {
  if (!value || typeof value !== 'object') return null;
  const held = value as Record<string, unknown>;
  if (typeof held.text !== 'string') return null;
  let text = held.text.trim();
  if (!text) return null;
  const signs = [...text];
  if (signs.length > QUOTE_LENGTH)
    text = `${signs
      .slice(0, QUOTE_LENGTH - 1)
      .join('')
      .trimEnd()}…`;
  return { id: str(held.id), text };
}

/** Whether two lists of marks, each tidy, say the same. */
const sameMarks = (a: readonly ChatMark[] = [], b: readonly ChatMark[] = []) =>
  a.length === b.length &&
  a.every((m, i) => m.from === b[i].from && m.to === b[i].to && m.mark === b[i].mark);

/**
 * Whether a string is an emoji, as a reaction must be: short, and holding a
 * pictograph or a keycap. Another copy may have written anything there.
 */
export function isEmoji(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= 32 &&
    !/\s/.test(value) &&
    /\p{Extended_Pictographic}|⃣/u.test(value)
  );
}

/** The key of one person's one emoji on one message, in the map of the reactions. */
export function reactionKey(message: string, person: string, emoji: string): string {
  return JSON.stringify([message, person, emoji]);
}

export const chatChanges = {
  /**
   * Says something in the chat: words alone, or words with their marks;
   * as an answer to a message, where `to` names one; with words of another
   * message quoted at its top, where `quote` holds them. An answer to an
   * answer answers what that one answered, so that answers are one deep;
   * where the message answered is not there, what is said answers none. The
   * words quoted are kept as they are given, whether their message is there
   * or not. Returns the id of the message; nothing for an empty one, quote
   * or no quote.
   */
  say(
    this: Project,
    what: string | ChatWords,
    to?: string,
    quote?: ChatQuote | null,
  ): string | null {
    const words = cleanWords(what);
    if (!words.text) return null;
    const id = newId();
    const answered = to ? this.chat.find((m) => m.id === to) : undefined;
    const root = answered ? (answered.to ?? answered.id) : undefined;
    const quoted = chatQuoteOf(quote);
    const message: ChatMessage = {
      id,
      author: author(this),
      created: nowIso(),
      ...(root ? { to: root } : {}),
      ...(quoted ? { quote: quoted } : {}),
      ...words,
    };
    this.doc.transact(() => this.yChat.push([message]), CHAT);
    return id;
  },

  /**
   * Changes one's own message, and nobody else's: it is put in again where
   * it stands, with its id, its author, when it was written, what it
   * answers and the words it quotes, and when it was changed. Nothing is done where neither the
   * words nor the marks differ, or the words would be empty. Returns
   * whether it was changed.
   */
  reword(this: Project, id: string, what: string | ChatWords): boolean {
    const me = this.me?.id;
    if (!me || !id) return false;
    const words = cleanWords(what);
    if (!words.text) return false;
    const index = this.yChat.toArray().findIndex((m) => chatMessageOf(m)?.id === id);
    if (index < 0) return false;
    const was = chatMessageOf(this.yChat.get(index));
    if (!was || was.author.id !== me) return false;
    if (
      was.text === words.text &&
      sameMarks(tidyMarks(was.marks ?? [], was.text.length), words.marks)
    )
      return false;
    const message: ChatMessage = {
      id: was.id,
      author: was.author,
      created: was.created,
      edited: nowIso(),
      ...(was.to ? { to: was.to } : {}),
      ...(was.quote ? { quote: was.quote } : {}),
      ...words,
    };
    this.doc.transact(() => {
      this.yChat.delete(index, 1);
      this.yChat.insert(index, [message]);
    }, CHAT);
    return true;
  },

  /**
   * Takes a message back: one's own alone. Returns where it stood and what
   * it was, so that it can be put back; nothing where nothing was taken.
   * Its reactions stay in their map, so that they come back with it.
   */
  unsay(this: Project, id: string): { index: number; message: ChatMessage } | null {
    const me = this.me?.id;
    if (!me) return null;
    const index = this.yChat.toArray().findIndex((m) => chatMessageOf(m)?.id === id);
    if (index < 0) return null;
    const message = chatMessageOf(this.yChat.get(index));
    if (!message || message.author.id !== me) return null;
    this.doc.transact(() => this.yChat.delete(index, 1), CHAT);
    return { index, message };
  },

  /** Puts a message that was taken back where it stood, or at the end where the chat has grown shorter since. */
  resay(this: Project, taken: { index: number; message: ChatMessage }) {
    if (this.yChat.toArray().some((m) => chatMessageOf(m)?.id === taken.message.id)) return;
    this.doc.transact(
      () => this.yChat.insert(Math.min(taken.index, this.yChat.length), [taken.message]),
      CHAT,
    );
  },

  /**
   * Keeps in the project how far one has read: the message read last, as
   * the mark on this computer has it. Written only where it differs from
   * what is kept, so that the others learn it once.
   */
  markChatRead(this: Project, mark: { id: string; created: string }) {
    const me = this.me;
    if (!me?.id || !mark.id) return;
    const was = chatReaderOf(me.id, this.yChatRead.get(me.id));
    if (was && was.read.id === mark.id && was.read.created === mark.created && was.name === me.name)
      return;
    const entry = { name: me.name, read: { id: mark.id, created: mark.created }, when: nowIso() };
    this.doc.transact(() => this.yChatRead.set(me.id, entry), CHAT);
  },

  /**
   * Takes one's own mark of how far one has read out of the project, and
   * nobody else's (record 0107, added to): for one who has chosen not to
   * show the others what they have read. Nothing is written where there is
   * none.
   */
  unmarkChatRead(this: Project) {
    const me = this.me?.id;
    if (!me || !this.yChatRead.has(me)) return;
    this.doc.transact(() => this.yChatRead.delete(me), CHAT);
  },

  /**
   * Gives one's own reaction to a message, an emoji, or takes it back where
   * it is there already. Anyone reacts to any message, with as many
   * different emojis as they like. Returns whether it is there now.
   */
  react(this: Project, id: string, emoji: string): boolean {
    const me = this.me;
    if (!me?.id || !id || !isEmoji(emoji)) return false;
    const key = reactionKey(id, me.id, emoji);
    const there = this.yChatReactions.has(key);
    this.doc.transact(() => {
      if (there) this.yChatReactions.delete(key);
      else this.yChatReactions.set(key, { name: me.name, when: nowIso() });
    }, CHAT);
    return !there;
  },

  /** Deletes the whole conversation: its messages, who has read them, and the reactions. */
  clearChat(this: Project) {
    if (!this.yChat.length && !this.yChatRead.size && !this.yChatReactions.size) return;
    this.doc.transact(() => {
      if (this.yChat.length) this.yChat.delete(0, this.yChat.length);
      for (const key of [...this.yChatRead.keys()]) this.yChatRead.delete(key);
      for (const key of [...this.yChatReactions.keys()]) this.yChatReactions.delete(key);
    }, CHAT);
  },
};

/** The marks of a message, from what may be marks: those that cannot be read are left out. */
function marksOf(value: unknown, length: number): ChatMark[] {
  if (!Array.isArray(value)) return [];
  const marks: ChatMark[] = [];
  for (const held of value) {
    if (!held || typeof held !== 'object') continue;
    const { from, to, mark } = held as Record<string, unknown>;
    if (
      typeof from !== 'number' ||
      typeof to !== 'number' ||
      !Number.isInteger(from) ||
      !Number.isInteger(to) ||
      from < 0 ||
      to > length ||
      from >= to ||
      !CHAT_MARKS.includes(mark as ChatMarkKind)
    )
      continue;
    marks.push({ from, to, mark: mark as ChatMarkKind });
  }
  return marks;
}

/**
 * A message of the chat, from what may be one. What another copy of the
 * program wrote, a later one or one gone wrong, may lack what a message has:
 * a message is its text, and of the rest each part is taken where it is of
 * its type and is else left out. A mark of a kind not known, or outside the
 * words, is dropped, not the message, and so is a quote that cannot be read.
 */
export function chatMessageOf(value: unknown): ChatMessage | null {
  if (!value || typeof value !== 'object') return null;
  const held = value as Record<string, unknown>;
  if (typeof held.text !== 'string') return null;
  const by =
    held.author && typeof held.author === 'object' ? (held.author as Record<string, unknown>) : {};
  const edited = str(held.edited);
  const to = str(held.to);
  const quote = chatQuoteOf(held.quote);
  const marks = marksOf(held.marks, held.text.length);
  return {
    id: str(held.id),
    author: { id: str(by.id), name: str(by.name) },
    created: str(held.created),
    ...(edited ? { edited } : {}),
    ...(to ? { to } : {}),
    ...(quote ? { quote } : {}),
    text: held.text,
    ...(marks.length ? { marks } : {}),
  };
}

/**
 * The messages of the chat as they are read, from what the array holds:
 * those that cannot be read left out, and of two with one id (its author
 * changed it on two computers at once) the one changed last, where the
 * first of them stood.
 */
export function chatMessagesOf(values: readonly unknown[]): ChatMessage[] {
  const out: ChatMessage[] = [];
  const at = new Map<string, number>();
  for (const value of values) {
    const message = chatMessageOf(value);
    if (!message) continue;
    const before = message.id ? at.get(message.id) : undefined;
    if (before === undefined) {
      if (message.id) at.set(message.id, out.length);
      out.push(message);
      continue;
    }
    const was = out[before];
    if ((message.edited ?? message.created) > (was.edited ?? was.created)) out[before] = message;
  }
  return out;
}

/** Who has read the chat, and how far, from an entry of the map: nothing where it cannot be read. */
export function chatReaderOf(id: string, value: unknown): ChatReader | null {
  if (!id || !value || typeof value !== 'object') return null;
  const held = value as Record<string, unknown>;
  const read =
    held.read && typeof held.read === 'object' ? (held.read as Record<string, unknown>) : null;
  if (!read || typeof read.id !== 'string' || !read.id || typeof read.created !== 'string')
    return null;
  return {
    id,
    name: str(held.name),
    read: { id: read.id, created: read.created },
    when: str(held.when),
  };
}

/** A reaction, from an entry of the map: nothing where its key or its emoji cannot be read. */
export function chatReactionOf(key: string, value: unknown): ChatReaction | null {
  let parts: unknown;
  try {
    parts = JSON.parse(key);
  } catch {
    return null;
  }
  if (!Array.isArray(parts) || parts.length !== 3) return null;
  const [message, person, emoji] = parts as unknown[];
  if (typeof message !== 'string' || !message || typeof person !== 'string' || !person) return null;
  if (!isEmoji(emoji)) return null;
  const held = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  return { message, person: { id: person, name: str(held.name) }, emoji, when: str(held.when) };
}
