/**
 * What is read of the messages of a chat (record 0092), as plain functions:
 * which of them are unread, how they stand together under one name, where a
 * day begins, and what of them is to be told as they arrive. The panel, the
 * tab, the dot on the Document button and the toasts read them from here.
 */

import type { ChatMessage } from '$lib/project/model/types';

/**
 * The message that was read last, as it is kept on this computer with the
 * project's view: by its id, and by when it was written, for where it has
 * been taken back since.
 */
export interface ReadMark {
  id: string;
  created: string;
}

/** Messages of one person within so many milliseconds of the one before stand together under one name. */
export const TOGETHER = 5 * 60 * 1000;

/** Whether a message is of the one who works here. Where they are not known, none is. */
export const isMine = (message: ChatMessage, me: string | null | undefined): boolean =>
  !!me && message.author.id === me;

/** The mark of the last message, which says that all of them have been read; none where there is none. */
export function markOf(messages: readonly ChatMessage[]): ReadMark | null {
  const last = messages[messages.length - 1];
  return last ? { id: last.id, created: last.created } : null;
}

/** Whether two marks are the same. */
export const sameMark = (a: ReadMark | null, b: ReadMark | null): boolean =>
  a === b || (!!a && !!b && a.id === b.id && a.created === b.created);

/** A mark as it was kept, read with care: what cannot be read is none. */
export function readMark(kept: unknown): ReadMark | null {
  if (!kept || typeof kept !== 'object') return null;
  const { id, created } = kept as Record<string, unknown>;
  return typeof id === 'string' && id && typeof created === 'string' ? { id, created } : null;
}

/**
 * The messages of others that are newer than the one read last: those after
 * it, where it is still there; else those written after it was. With no
 * mark, every message of another is unread.
 */
export function unread(
  messages: readonly ChatMessage[],
  read: ReadMark | null,
  me: string | null | undefined,
): ChatMessage[] {
  let after: readonly ChatMessage[] = messages;
  if (read) {
    const at = messages.findIndex((m) => m.id === read.id);
    after = at >= 0 ? messages.slice(at + 1) : messages.filter((m) => m.created > read.created);
  }
  return after.filter((m) => !isMine(m, me));
}

/** The day a moment falls on, where the reader is: what tells where a day changes. */
export function dayOf(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

/** Messages that stand together: of one person, one after another, within a few minutes. */
export interface Group {
  /** The id of its first message: what the group is known by. */
  key: string;
  author: ChatMessage['author'];
  mine: boolean;
  /** Where the group begins a day that the one before it is not of: that day's first moment; else nothing. */
  day: string | null;
  messages: ChatMessage[];
}

/** Who wrote a message, as messages are told apart by it: by their id, else by their name. */
const whoOf = (m: ChatMessage) => m.author.id || `name:${m.author.name}`;

/**
 * The messages in groups, in their order: a message joins the group before
 * it where it is of the same person, of the same day, and written within
 * `TOGETHER` of the message before it.
 */
export function groups(
  messages: readonly ChatMessage[],
  me: string | null | undefined,
  together = TOGETHER,
): Group[] {
  const out: Group[] = [];
  let lastDay: string | null = null;
  for (const message of messages) {
    const day = dayOf(message.created);
    const last = out[out.length - 1];
    const before = last?.messages[last.messages.length - 1];
    const gap = before
      ? new Date(message.created).getTime() - new Date(before.created).getTime()
      : NaN;
    if (
      last &&
      before &&
      whoOf(before) === whoOf(message) &&
      day === lastDay &&
      gap >= 0 &&
      gap <= together
    ) {
      last.messages.push(message);
      continue;
    }
    out.push({
      key: message.id || `${out.length}`,
      author: message.author,
      mine: isMine(message, me),
      day: day && day !== lastDay ? message.created : null,
      messages: [message],
    });
    lastDay = day || lastDay;
  }
  return out;
}

/** The first words of a message, on one line, cut with an ellipsis where they go on. */
export function firstWords(text: string, most = 60): string {
  const line = text.replace(/\s+/g, ' ').trim();
  const signs = [...line];
  if (signs.length <= most) return line;
  const cut = signs.slice(0, most).join('');
  const space = cut.lastIndexOf(' ');
  return `${(space > most / 2 ? cut.slice(0, space) : cut).trimEnd()}…`;
}

/**
 * Of the messages, those to be told as they arrive: the unread ones of
 * others that have not been told yet. Those returned are counted as told.
 */
export function toTell(
  messages: readonly ChatMessage[],
  read: ReadMark | null,
  me: string | null | undefined,
  told: Set<string>,
): ChatMessage[] {
  const out = unread(messages, read, me).filter((m) => !told.has(m.id));
  for (const m of out) told.add(m.id);
  return out;
}
